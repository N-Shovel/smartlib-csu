// Purpose: Book domain service for borrow/return, logs, and borrower summaries.
// Parts: storage adapters, business rules, mutation handlers, activity/history helpers.
import books from "../data/books";
import logs from "../data/activityLogs";
import borrowersHistory from "../data/borrowersHistory";
import { getData, saveData } from "./localStorageService";
import { getIsoTimestamp } from "../utils/dateUtils";

const BOOKS_KEY = "library_books";
const LOGS_KEY = "library_activity_logs";
const HISTORY_KEY = "library_borrow_history";
const THESIS_PERMISSION_CODE = "24101234";

const copyBook = (book) => ({ ...book });

const mergeMissingSeedBooks = (storedBooks) => {
  // Keep newly added seed books available in older localStorage snapshots.
  const existingIds = new Set(storedBooks.map((book) => book.id));
  const missingSeedBooks = books.filter((book) => !existingIds.has(book.id));

  if (missingSeedBooks.length === 0) {
    return storedBooks;
  }

  const mergedBooks = [...storedBooks, ...missingSeedBooks];
  saveData(BOOKS_KEY, mergedBooks);
  return mergedBooks;
};

const loadBooks = () => {
  const stored = getData(BOOKS_KEY, null);
  if (!stored || stored.length === 0) {
    // First-run seed for local mock mode.
    saveData(BOOKS_KEY, books);
    return [...books];
  }
  return mergeMissingSeedBooks(stored);
};

const saveBooks = (nextBooks) => saveData(BOOKS_KEY, nextBooks);

const loadLogs = () => {
  const stored = getData(LOGS_KEY, null);
  if (!stored || stored.length === 0) {
    // Initialize with sample activity events.
    saveData(LOGS_KEY, logs);
    return [...logs];
  }
  return stored;
};

const saveLogs = (nextLogs) => saveData(LOGS_KEY, nextLogs);

const loadHistory = () => {
  const stored = getData(HISTORY_KEY, null);
  if (!stored || stored.length === 0) {
    // Initialize borrower history collection.
    saveData(HISTORY_KEY, borrowersHistory);
    return [...borrowersHistory];
  }
  return stored;
};

const saveHistory = (nextHistory) => saveData(HISTORY_KEY, nextHistory);

const addLog = (action, payload) => {
  // Prepend latest event to keep recent activity first.
  const nextLogs = [
    {
      id: Date.now(),
      action,
      timestamp: getIsoTimestamp(),
      ...payload
    },
    ...loadLogs()
  ];
  saveLogs(nextLogs);
};

export const getActivityLogs = () => loadLogs().map((entry) => ({ ...entry }));

export const getBorrowHistory = () =>
  loadHistory().map((entry) => ({ ...entry }));

export const getBooks = () => loadBooks().map(copyBook);

export const getBookById = (id) => {
  const book = loadBooks().find((item) => item.id === parseInt(id, 10));
  return book ? copyBook(book) : null;
};

export const borrowBook = (id, borrowerEmail, permissionCode = "") => {
  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === parseInt(id, 10));
  if (!book) return { ok: false, error: "Book not found" };
  const isThesis = String(book.category || "").toLowerCase() === "thesis";

  // Thesis items require a permission code.
  if (isThesis && !String(permissionCode).trim()) {
    return { ok: false, error: "Permission slip code is required for thesis application." };
  }

  // Validate permission code for thesis borrowing workflow.
  if (isThesis && String(permissionCode).trim() !== THESIS_PERMISSION_CODE) {
    return { ok: false, error: "Invalid permission slip code." };
  }

  // Prevent borrowing when item is already checked out.
  if (!book.available) return { ok: false, error: "Book unavailable" };

  // Mutate book availability and borrower ownership state.
  book.available = false;
  book.borrowedBy = borrowerEmail;
  saveBooks(currentBooks);

  // Record borrow action in borrower history and staff activity log.
  const nextHistory = [
    {
      id: Date.now(),
      bookId: book.id,
      title: book.title,
      borrowerEmail,
      action: "BORROW_BOOK",
      timestamp: getIsoTimestamp()
    },
    ...loadHistory()
  ];
  saveHistory(nextHistory);
  addLog("BORROW_BOOK", { borrowerEmail, bookId: book.id });

  return { ok: true, book: copyBook(book) };
};

export const returnBook = (id, borrowerEmail) => {
  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === parseInt(id, 10));
  if (!book) return { ok: false, error: "Book not found" };
  if (book.available) return { ok: false, error: "Book already available" };
  // Only the borrower who checked out the book can return it.
  if (book.borrowedBy !== borrowerEmail)
    return { ok: false, error: "Not your borrowed book" };

  // Reset checkout fields on return.
  book.available = true;
  book.borrowedBy = null;
  saveBooks(currentBooks);

  const nextHistory = [
    {
      id: Date.now(),
      bookId: book.id,
      title: book.title,
      borrowerEmail,
      action: "RETURN_BOOK",
      timestamp: getIsoTimestamp()
    },
    ...loadHistory()
  ];
  saveHistory(nextHistory);
  addLog("RETURN_BOOK", { borrowerEmail, bookId: book.id });

  return { ok: true, book: copyBook(book) };
};

export const getBorrowerSummary = () => {
  const summary = {};

  // Build grouped borrower summary from currently borrowed books.
  loadBooks().forEach((book) => {
    if (!book.available && book.borrowedBy) {
      if (!summary[book.borrowedBy]) {
        summary[book.borrowedBy] = {
          email: book.borrowedBy,
          borrowedCount: 0,
          titles: []
        };
      }
      summary[book.borrowedBy].borrowedCount += 1;
      summary[book.borrowedBy].titles.push(book.title);
    }
  });

  return Object.values(summary);
};
