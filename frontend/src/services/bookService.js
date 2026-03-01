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
const REQUESTS_KEY = "library_borrow_requests";
const THESIS_PERMISSION_CODE = "24101234";
// Track original seeded IDs so we can treat seeded vs user-added books differently.
const seedBookIds = new Set(books.map((book) => book.id));
// In-memory suppression list for seed books deleted during the current app session.
const transientDeletedSeedBookIds = new Set();

const copyBook = (book) => ({ ...book });
const normalizeEmail = (email) => String(email || "").trim().toLowerCase();

// Stable identity key used to prevent visually duplicated books.
const toBookIdentity = (book) =>
  [book?.title, book?.author, book?.category || "Book"]
    .map((value) => String(value || "").trim().toLowerCase())
    .join("|");

const dedupeBooksByIdentity = (booksList) => {
  const seenIdentities = new Set();

  // Keep first occurrence and drop later duplicates with same identity.
  return booksList.filter((book) => {
    const identity = toBookIdentity(book);
    if (!identity || seenIdentities.has(identity)) {
      return false;
    }

    seenIdentities.add(identity);
    return true;
  });
};

const mergeMissingSeedBooks = (storedBooks) => {
  // Keep newly added seed books available in older localStorage snapshots,
  // and backfill missing metadata for existing books.
  const seedById = new Map(books.map((seedBook) => [seedBook.id, seedBook]));

  const normalizedStoredBooks = storedBooks.map((storedBook) => {
    const seedBook = seedById.get(storedBook.id);

    if (!seedBook) {
      return {
        ...storedBook,
        category: storedBook.category || "Book",
        keywords: Array.isArray(storedBook.keywords) ? storedBook.keywords : []
      };
    }

    return {
      ...storedBook,
      title: storedBook.title || seedBook.title,
      author: storedBook.author || seedBook.author,
      category: storedBook.category || seedBook.category || "Book",
      description: storedBook.description || seedBook.description,
      keywords: Array.isArray(storedBook.keywords)
        ? storedBook.keywords
        : Array.isArray(seedBook.keywords)
          ? seedBook.keywords
          : []
    };
  });

  const existingIds = new Set(normalizedStoredBooks.map((book) => book.id));
  // Re-introduce missing seed books unless user deleted them in this live session.
  const missingSeedBooks = books.filter(
    (book) => !existingIds.has(book.id) && !transientDeletedSeedBookIds.has(book.id)
  );

  const mergedBooks = [...normalizedStoredBooks, ...missingSeedBooks];
  // Final dedupe pass protects against historical storage drift.
  const uniqueBooks = dedupeBooksByIdentity(mergedBooks);
  saveData(BOOKS_KEY, uniqueBooks);
  return uniqueBooks;
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

const loadBorrowRequests = () => getData(REQUESTS_KEY, []);

const saveBorrowRequests = (nextRequests) => saveData(REQUESTS_KEY, nextRequests);

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

export const getBorrowRequests = () =>
  loadBorrowRequests().map((entry) => ({ ...entry }));

export const getBorrowRequestsByBorrower = (borrowerEmail) => {
  const normalizedEmail = normalizeEmail(borrowerEmail);
  if (!normalizedEmail) return [];

  return loadBorrowRequests()
    .filter(
      (entry) =>
        String(entry.borrowerEmail || "").trim().toLowerCase() === normalizedEmail
    )
    .map((entry) => ({ ...entry }));
};

export const getBooks = () => loadBooks().map(copyBook);

export const getBookById = (id) => {
  const book = loadBooks().find((item) => item.id === parseInt(id, 10));
  return book ? copyBook(book) : null;
};

export const addBook = (bookInput) => {
  // Normalize all fields so validation and duplicate checks are consistent.
  const title = String(bookInput?.title || "").trim();
  const author = String(bookInput?.author || "").trim();
  const category = String(bookInput?.category || "Book").trim() || "Book";
  const description = String(bookInput?.description || "").trim();
  const keywords = Array.isArray(bookInput?.keywords)
    ? bookInput.keywords
    : String(bookInput?.keywords || "")
        .split(",")
        .map((keyword) => keyword.trim())
        .filter(Boolean);

  if (!title || !author || !description) {
    return { ok: false, error: "Title, author, and description are required." };
  }

  const currentBooks = loadBooks();
  const nextIdentity = toBookIdentity({ title, author, category });
  // Block adds when logical identity already exists, even with a different ID.
  const hasDuplicate = currentBooks.some(
    (existingBook) => toBookIdentity(existingBook) === nextIdentity
  );

  if (hasDuplicate) {
    return { ok: false, error: "This book already exists." };
  }

  const nextBook = {
    id: Date.now(),
    title,
    author,
    category,
    description,
    available: true,
    borrowedBy: null,
    keywords
  };

  saveBooks([nextBook, ...currentBooks]);
  addLog("BOOK_ADDED", { bookId: nextBook.id });

  return { ok: true, book: copyBook(nextBook) };
};

export const deleteBook = (id) => {
  const numericId = parseInt(id, 10);
  const currentBooks = loadBooks();
  const targetBook = currentBooks.find((book) => book.id === numericId);

  if (!targetBook) {
    return { ok: false, error: "Book not found." };
  }

  if (!targetBook.available) {
    return { ok: false, error: "Cannot delete a currently borrowed book." };
  }

  const nextBooks = currentBooks.filter((book) => book.id !== numericId);
  saveBooks(nextBooks);
  // Seed deletions are remembered for this session so they don't auto-reappear immediately.
  if (seedBookIds.has(numericId)) {
    transientDeletedSeedBookIds.add(numericId);
  }
  addLog("BOOK_DELETED", { bookId: numericId });

  return { ok: true };
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

  const normalizedBorrowerEmail = String(borrowerEmail || "").trim().toLowerCase();
  const pendingRequests = loadBorrowRequests();
  const hasPendingRequest = pendingRequests.some(
    (request) =>
      request.bookId === book.id &&
      request.status === "pending"
  );

  if (hasPendingRequest) {
    return { ok: false, error: "This book already has a pending borrow request." };
  }

  const nextRequest = {
    id: Date.now(),
    bookId: book.id,
    title: book.title,
    borrowerEmail: normalizedBorrowerEmail,
    status: "pending",
    requestedAt: getIsoTimestamp()
  };
  saveBorrowRequests([nextRequest, ...pendingRequests]);

  addLog("BORROW_REQUESTED", {
    borrowerEmail: normalizedBorrowerEmail,
    bookId: book.id
  });

  return { ok: true, request: { ...nextRequest } };
};

export const receiveBorrowRequest = (requestId, receiverEmail = "staff") => {
  const currentRequests = loadBorrowRequests();
  const index = currentRequests.findIndex((request) => request.id === requestId);
  if (index === -1) return { ok: false, error: "Borrow request not found" };

  const selectedRequest = currentRequests[index];
  if (selectedRequest.status !== "pending") {
    return { ok: false, error: "Borrow request is no longer pending." };
  }

  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === selectedRequest.bookId);
  if (!book) return { ok: false, error: "Book not found" };
  if (!book.available) return { ok: false, error: "Book is already borrowed." };

  book.available = false;
  book.borrowedBy = selectedRequest.borrowerEmail;
  saveBooks(currentBooks);

  const completedRequest = {
    ...selectedRequest,
    status: "received",
    receivedAt: getIsoTimestamp(),
    receivedBy: String(receiverEmail || "staff").trim().toLowerCase()
  };
  currentRequests[index] = completedRequest;
  saveBorrowRequests(currentRequests);

  const nextHistory = [
    {
      id: Date.now(),
      bookId: book.id,
      title: book.title,
      borrowerEmail: selectedRequest.borrowerEmail,
      action: "BORROW_BOOK",
      timestamp: getIsoTimestamp()
    },
    ...loadHistory()
  ];
  saveHistory(nextHistory);

  addLog("BORROW_BOOK_RECEIVED", {
    borrowerEmail: selectedRequest.borrowerEmail,
    bookId: book.id
  });

  return { ok: true, request: { ...completedRequest }, book: copyBook(book) };
};

export const requestBookReturn = (id, borrowerEmail) => {
  const normalizedBorrowerEmail = normalizeEmail(borrowerEmail);
  if (!normalizedBorrowerEmail) {
    return { ok: false, error: "Borrower email is required." };
  }

  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === parseInt(id, 10));
  if (!book) return { ok: false, error: "Book not found" };
  if (book.available) return { ok: false, error: "Book is already available" };
  if (normalizeEmail(book.borrowedBy) !== normalizedBorrowerEmail) {
    return { ok: false, error: "Not your borrowed book" };
  }

  const currentRequests = loadBorrowRequests();
  // LOGIC: Enforce one active return request per (book, borrower) pair.
  // This prevents duplicate pending rows and double-processing by staff.
  const hasPendingReturnRequest = currentRequests.some(
    (request) =>
      request.bookId === book.id &&
      normalizeEmail(request.borrowerEmail) === normalizedBorrowerEmail &&
      request.status === "pending_return"
  );

  if (hasPendingReturnRequest) {
    return { ok: false, error: "Return request already submitted." };
  }

  const nextRequest = {
    id: Date.now(),
    bookId: book.id,
    title: book.title,
    borrowerEmail: normalizedBorrowerEmail,
    status: "pending_return",
    requestedAt: getIsoTimestamp()
  };

  saveBorrowRequests([nextRequest, ...currentRequests]);
  addLog("RETURN_REQUESTED", {
    borrowerEmail: normalizedBorrowerEmail,
    bookId: book.id
  });

  return { ok: true, request: { ...nextRequest } };
};

export const receiveReturnRequest = (requestId, receiverEmail = "staff") => {
  const currentRequests = loadBorrowRequests();
  const index = currentRequests.findIndex((request) => request.id === requestId);
  if (index === -1) return { ok: false, error: "Return request not found" };

  const selectedRequest = currentRequests[index];
  if (selectedRequest.status !== "pending_return") {
    return { ok: false, error: "Return request is no longer pending." };
  }

  const currentBooks = loadBooks();
  const book = currentBooks.find((item) => item.id === selectedRequest.bookId);
  if (!book) return { ok: false, error: "Book not found" };
  if (book.available) return { ok: false, error: "Book is already available." };

  const normalizedBorrowerEmail = normalizeEmail(selectedRequest.borrowerEmail);
  if (normalizeEmail(book.borrowedBy) !== normalizedBorrowerEmail) {
    return { ok: false, error: "Book borrower does not match return request." };
  }

  // LOGIC: Staff confirmation is the single state transition that makes a book
  // available again. We intentionally update inventory, request status, history,
  // and activity logs together to keep audit trail and availability consistent.
  book.available = true;
  book.borrowedBy = null;
  saveBooks(currentBooks);

  const completedRequest = {
    ...selectedRequest,
    status: "returned",
    returnedAt: getIsoTimestamp(),
    receivedBy: String(receiverEmail || "staff").trim().toLowerCase()
  };
  currentRequests[index] = completedRequest;
  saveBorrowRequests(currentRequests);

  const nextHistory = [
    {
      id: Date.now(),
      bookId: book.id,
      title: book.title,
      borrowerEmail: normalizedBorrowerEmail,
      action: "RETURN_BOOK",
      timestamp: getIsoTimestamp()
    },
    ...loadHistory()
  ];
  saveHistory(nextHistory);

  addLog("RETURN_BOOK_RECEIVED", {
    borrowerEmail: normalizedBorrowerEmail,
    bookId: book.id
  });

  return { ok: true, request: { ...completedRequest }, book: copyBook(book) };
};

export const cancelBorrowRequest = (requestId, borrowerEmail) => {
  const currentRequests = loadBorrowRequests();
  const index = currentRequests.findIndex((request) => request.id === requestId);
  if (index === -1) return { ok: false, error: "Borrow request not found" };

  const selectedRequest = currentRequests[index];
  if (selectedRequest.status !== "pending") {
    return { ok: false, error: "Only pending requests can be cancelled." };
  }

  const normalizedBorrowerEmail = String(borrowerEmail || "").trim().toLowerCase();
  const normalizedRequestEmail = String(selectedRequest.borrowerEmail || "").trim().toLowerCase();
  if (!normalizedBorrowerEmail || normalizedBorrowerEmail !== normalizedRequestEmail) {
    return { ok: false, error: "You can only cancel your own borrow request." };
  }

  const cancelledRequest = {
    ...selectedRequest,
    status: "cancelled",
    cancelledAt: getIsoTimestamp()
  };
  currentRequests[index] = cancelledRequest;
  saveBorrowRequests(currentRequests);

  addLog("BORROW_REQUEST_CANCELLED", {
    borrowerEmail: normalizedBorrowerEmail,
    bookId: selectedRequest.bookId
  });

  return { ok: true, request: { ...cancelledRequest } };
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

export const replaceBorrowerEmail = (previousEmail, nextEmail) => {
  const normalizedPreviousEmail = normalizeEmail(previousEmail);
  const normalizedNextEmail = normalizeEmail(nextEmail);

  if (!normalizedPreviousEmail || !normalizedNextEmail) {
    return { ok: false, error: "Both previous and next email are required." };
  }

  if (normalizedPreviousEmail === normalizedNextEmail) {
    return { ok: true, changed: false };
  }

  const nextBooks = loadBooks().map((book) =>
    normalizeEmail(book.borrowedBy) === normalizedPreviousEmail
      ? { ...book, borrowedBy: normalizedNextEmail }
      : book
  );
  saveBooks(nextBooks);

  const nextRequests = loadBorrowRequests().map((request) =>
    normalizeEmail(request.borrowerEmail) === normalizedPreviousEmail
      ? { ...request, borrowerEmail: normalizedNextEmail }
      : request
  );
  saveBorrowRequests(nextRequests);

  const nextHistory = loadHistory().map((entry) =>
    normalizeEmail(entry.borrowerEmail) === normalizedPreviousEmail
      ? { ...entry, borrowerEmail: normalizedNextEmail }
      : entry
  );
  saveHistory(nextHistory);

  const nextLogs = loadLogs().map((entry) =>
    normalizeEmail(entry.borrowerEmail) === normalizedPreviousEmail
      ? { ...entry, borrowerEmail: normalizedNextEmail }
      : entry
  );
  saveLogs(nextLogs);

  return { ok: true, changed: true };
};
