// Purpose: Staff borrower monitoring with active records and history export.
// Parts: pending borrow requests, current borrower table, history export table.
import { useEffect, useMemo, useState } from "react";
import {
  getBorrowHistory,
  getBorrowRequests,
  receiveBorrowRequest,
  receiveReturnRequest
} from "../../services/bookService";
import { exportToCSV } from "../../services/exportService";
import { formatDateTime, formatDateTimeFull } from "../../utils/dateUtils";
import { showError, showSuccess } from "../../utils/notification";
import { getUserProfileByEmail } from "../../services/authService";
import useItems from "../../store/useItemsStore";
import { useRequest } from "../../store/useRequestsStore";

const BorrowerTracking = () => {
  const storeBooks = useItems((state) => state.books);
  const fetchBooks = useItems((state) => state.fetchBooks);
  const { fetchHistory, itemRequests } = useRequest();
  const [history, setHistory] = useState(() => getBorrowHistory());
  const [borrowRequests, setBorrowRequests] = useState(() => getBorrowRequests());

  useEffect(() => {
    fetchBooks();
    fetchHistory();
  }, [fetchBooks, fetchHistory]);

  const books = useMemo(
    () =>
      (storeBooks || [])
        .filter((item) => !item?.is_deleted)
        .map((item) => ({
          ...item,
          available: item?.is_available ?? item?.available ?? true,
          borrowedBy: item?.borrowedBy ?? null,
        })),
    [storeBooks]
  );

  const getStudentIdByEmail = (email) =>
    getUserProfileByEmail(email)?.id || "-";
  const formatHistoryAction = (action) => String(action || "-").replace(/_/g, " ");

  const pendingRequests = borrowRequests.filter((entry) => entry.status === "pending");
  const pendingReturnRequestByBookAndUser = borrowRequests
    .filter((entry) => entry.status === "pending_return")
    .reduce((summary, entry) => {
      const key = `${entry.bookId}-${String(entry.borrowerEmail || "").toLowerCase()}`;
      summary[key] = entry;
      return summary;
    }, {});

  const currentBorrowers = books
    .filter((book) => !book.available && book.borrowedBy)
    .map((book) => {
      const borrowEvent = history.find(
        (entry) =>
          entry.bookId === book.id &&
          String(entry.borrowerEmail || "").toLowerCase().trim() ===
            String(book.borrowedBy || "").toLowerCase().trim() &&
          entry.action === "BORROW_BOOK"
      );

      return {
        user: book.borrowedBy,
        studentId: getStudentIdByEmail(book.borrowedBy),
        book: book.title,
        bookId: book.id,
        time: borrowEvent?.timestamp || null,
        pendingReturnRequest:
          pendingReturnRequestByBookAndUser[
            `${book.id}-${String(book.borrowedBy || "").toLowerCase()}`
          ] || null
      };
    });

  const refresh = () => {
    fetchBooks();
    setHistory(getBorrowHistory());
    setBorrowRequests(getBorrowRequests());
  };

  const handleReceive = (requestId) => {
    const result = receiveBorrowRequest(requestId);
    if (!result.ok) {
      showError(result.error || "Unable to receive borrow request.");
      return;
    }

    showSuccess("Book release received and recorded.");
    refresh();
  };

  const handleReturn = (requestId) => {
    if (!requestId) {
      showError("Return request not found.");
      return;
    }
    const result = receiveReturnRequest(requestId);
    if (!result.ok) {
      showError(result.error || "Unable to return book.");
      return;
    }

    showSuccess("Book returned.");
    refresh();
  };

  const handleHistoryExport = () => {
    if (history.length === 0) return;
    const historyData = history.map((entry) => ({
      "Book ID": entry.bookId || "-",
      "Book Title": entry.bookTitle || "-",
      "Borrower Email": entry.borrowerEmail || "-",
      "Action": formatHistoryAction(entry.action),
      "Timestamp": formatDateTimeFull(entry.timestamp),
    }));
    exportToCSV(historyData, "borrow-history.csv");
  };

  return (
    <section className="staff-page staff-tracking-page">
      <div className="page-header">
        <div>
          <h2>Borrower Tracking</h2>
          <p className="muted">Track borrower requests and current book releases.</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "1rem" }}>
        <div>
          <h2>Pending Borrow Requests</h2>
          <p className="muted">Confirm book pickup by clicking receive.</p>
        </div>
      </div>
      {(!itemRequests || itemRequests.length === 0) ? (
        <div className="empty-state">No pending borrow requests.</div>
      ) : (
        <div className="card table-scroll table-scroll--five staff-table-card">
          <div className="table table--staff-borrow-requests">
            <div className="table__row table__head">
              <span>Student</span>
              <span>ID Number</span>
              <span>Program</span>
              <span>Item</span>
              <span>Type</span>
              <span>Status</span>
              <span>Requested</span>
            </div>
            {itemRequests.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.student_profiles?.last_name || "-"}</span>
                <span>{entry.student_profiles?.id_number || "-"}</span>
                <span>{entry.student_profiles?.program || "-"}</span>
                <span>{entry.item_title || "-"}</span>
                <span>{entry.item_type || "-"}</span>
                <span>{entry.status || "-"}</span>
                <span>{formatDateTime(entry.requested_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Current Borrower</h2>
          <p className="muted">Books currently picked up by borrowers.</p>
        </div>
      </div>
      {currentBorrowers.length === 0 ? (
        <div className="empty-state">No current borrowers.</div>
      ) : (
        <div className="card table-scroll table-scroll--five staff-table-card">
          <div className="table table--staff-current-borrowers">
            <div className="table__row table__head">
              <span>User</span>
              <span>Student ID</span>
              <span>Book</span>
              <span>Time</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {currentBorrowers.map((entry) => (
              <div className="table__row" key={`${entry.user}-${entry.bookId}`}>
                <span>{entry.user}</span>
                <span>{entry.studentId}</span>
                <span>{entry.book}</span>
                <span>{formatDateTimeFull(entry.time)}</span>
                <span>
                  {entry.pendingReturnRequest
                    ? "returning"
                    : "borrowed"}
                </span>
                <button
                  className="btn btn--return"
                  onClick={() => handleReturn(entry.pendingReturnRequest?.id)}
                  disabled={!entry.pendingReturnRequest}
                >
                  Return
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Borrow History</h2>
          <p className="muted">Latest 6 book activity entries for borrowers.</p>
        </div>
        <button
          className="btn btn--ghost"
          onClick={handleHistoryExport}
          disabled={history.length === 0}
        >
          Export CSV
        </button>
      </div>
      {history.length === 0 ? (
        <div className="empty-state">No history yet.</div>
      ) : (
        <div className="card table-scroll table-scroll--five staff-table-card">
          <div className="table table--staff-borrow-history">
            <div className="table__row table__head">
              <span>User</span>
              <span>Student ID</span>
              <span>Book</span>
              <span>Action</span>
              <span>Time</span>
            </div>
            {history.slice(0, 6).map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.borrowerEmail}</span>
                <span>{getStudentIdByEmail(entry.borrowerEmail)}</span>
                <span>{entry.title}</span>
                <span>{formatHistoryAction(entry.action)}</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default BorrowerTracking;
