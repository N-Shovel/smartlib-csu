import { axiosInstance } from "../store/axios";

const normalizeRequests = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.requests)) return payload.requests;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
};

export const getBooks = async () => {
  const response = await axiosInstance.get("/items/get-items");
  return Array.isArray(response?.data?.books) ? response.data.books : [];
};

export const getBookById = async (bookId) => {
  const books = await getBooks();
  return books.find((book) => String(book.id) === String(bookId)) || null;
};

export const getBorrowHistory = async () => {
  const response = await axiosInstance.get("/history/borrower-logs");
  return normalizeRequests(response?.data);
};

export const getBorrowRequestsByBorrower = async (borrowerEmailOrId) => {
  const requests = await getBorrowHistory();
  const lookup = String(borrowerEmailOrId || "").trim().toLowerCase();

  if (!lookup) return [];

  return requests.filter((request) => {
    const requestEmail = String(request?.student_profiles?.email || request?.student_profiles?.users_public?.email || "").trim().toLowerCase();
    const requestUserId = String(request?.student_user_id || "").trim().toLowerCase();
    return requestEmail === lookup || requestUserId === lookup;
  });
};

export const borrowBook = async (bookId, borrowerEmail, itemType = "book") => {
  const books = await getBooks();
  const book = books.find((entry) => String(entry.id) === String(bookId));
  if (!book) return { ok: false, error: "Book not found" };

  const response = await axiosInstance.post("/items/borrow-item", {
    item_title: book.title,
    item_type: book.item_type || itemType,
    item_id: book.id,
  });

  return { ok: true, data: response.data };
};

export const requestBookReturn = async (bookId) => {
  const response = await axiosInstance.patch("/items/request-return", {
    itemId: bookId,
  });

  return { ok: true, data: response.data };
};

export const cancelBorrowRequest = async (requestId) => {
  const response = await axiosInstance.patch("/items/cancel-borrow-request", {
    requestId,
  });

  return { ok: true, data: response.data };
};
