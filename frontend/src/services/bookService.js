import books from "../data/books";
import logs from "../data/activityLogs";
import borrowersHistory from "../data/borrowersHIstory";
import { getData, saveData } from "./localStorageService";
import { getIsoTimestamp } from "../utils/dateUtils";

const BOOKS_KEY = "library_books";
const LOGS_KEY = "library_activity_logs";
const HISTORY_KEY = "library_borrow_history";

const copyBook = (book) => ({ ...book });

const loadBooks = () => {
  const stored = getData(BOOKS_KEY, null);
  if (!stored || stored.length === 0) {
    saveData(BOOKS_KEY, books);
    return [...books];
  }
  return stored;
};

const saveBooks = (nextBooks) => saveData(BOOKS_KEY, nextBooks);

const loadLogs = () => {
  const stored = getData(LOGS_KEY, null);
  if (!stored || stored.length === 0) {
    saveData(LOGS_KEY, logs);
    return [...logs];
  }
  return stored;
};

const saveLogs = (nextLogs) => saveData(LOGS_KEY, nextLogs);

const loadHistory = () => {
  const stored = getData(HISTORY_KEY, null);
  if (!stored || stored.length === 0) {
    saveData(HISTORY_KEY, borrowersHistory);
    return [...borrowersHistory];
  }
  return stored;
};

const saveHistory = (nextHistory) => saveData(HISTORY_KEY, nextHistory);

const addLog = (action, payload) => {
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

export const borrowBook = (id, borrowerEmail) => {
  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === parseInt(id, 10));
  if (!book) return { ok: false, error: "Book not found" };
  if (!book.available) return { ok: false, error: "Book unavailable" };

  book.available = false;
  book.borrowedBy = borrowerEmail;
  saveBooks(currentBooks);

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
  if (book.borrowedBy !== borrowerEmail)
    return { ok: false, error: "Not your borrowed book" };

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
