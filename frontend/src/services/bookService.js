import { axiosInstance } from "../store/axios";

// Get borrow requests by borrower email
export const getBorrowRequestsByBorrower = async (email) => {
  try {
    const response = await axiosInstance.get("/borrow-requests/by-borrower", {
      params: { email },
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching borrow requests:", error);
    throw error;
  }
};

// Get borrow history
export const getBorrowHistory = async () => {
  try {
    const response = await axiosInstance.get("/history/recent-activity", {
      withCredentials: true,
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching borrow history:", error);
    throw error;
  }
};

// Borrow a book
export const borrowBook = async (bookId, borrowerEmail, permissionCode = "") => {
  try {
    const response = await axiosInstance.post(
      "/items/borrow",
      {
        bookId,
        borrowerEmail,
        ...(permissionCode && { permissionCode }),
      },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error borrowing book:", error);
    throw error;
  }
};

// Request book return
export const requestBookReturn = async (bookId, borrowerEmail) => {
  try {
    const response = await axiosInstance.post(
      "/items/request-return",
      { bookId, borrowerEmail },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error requesting book return:", error);
    throw error;
  }
};

// Cancel borrow request
export const cancelBorrowRequest = async (requestId, borrowerEmail) => {
  try {
    const response = await axiosInstance.post(
      "/borrow-requests/cancel",
      { requestId, borrowerEmail },
      { withCredentials: true }
    );
    return response.data;
  } catch (error) {
    console.error("Error cancelling borrow request:", error);
    throw error;
  }
};
