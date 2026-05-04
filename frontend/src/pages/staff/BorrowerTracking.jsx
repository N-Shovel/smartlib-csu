// Purpose: Staff borrower monitoring with active records and history export.
// Parts: pending borrow requests, current borrower table, history export table.
import { useEffect, useMemo, useState } from "react";
import { exportToCSV } from "../../services/exportService";
import { formatDateTimeFull } from "../../utils/dateUtils";
import { showError } from "../../utils/notification";
import useItems from "../../store/useItemsStore";
import { formatActivityAction } from "../../utils/activityUtils";
import { useRequest } from "../../store/useRequestsStore";

const BorrowerTracking = () => {
  const storeBooks = useItems((state) => state.books);
  const fetchBooks = useItems((state) => state.fetchBooks);
  const { fetchHistory, itemRequests, approveBorrowRequest, confirmReturnRequest } = useRequest();
  const [receivingRequestId, setReceivingRequestId] = useState(null);
  const [returningRequestId, setReturningRequestId] = useState(null);

  useEffect(() => {
    fetchBooks();
    fetchHistory();
  }, [fetchBooks, fetchHistory]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchHistory();
    }, 3000);

    return () => clearInterval(intervalId);
  }, [fetchHistory]);

  const booksById = useMemo(() => {
    const map = new Map();
    (storeBooks || []).forEach((item) => {
      if (item?.id) map.set(item.id, item);
    });
    return map;
  }, [storeBooks]);

  const formatHistoryAction = (action) => String(action || "-").replace(/_/g, " ");

  const pendingRequests = (itemRequests || []).filter((entry) => entry.status === "pending");

  const currentBorrowers = (itemRequests || [])
    .filter((entry) => {
      const normalizedStatus = String(entry.status || "").toLowerCase();
      return normalizedStatus === "approved";
    })
    .sort((a, b) => new Date(b.approved_at || b.decision_at || 0) - new Date(a.approved_at || a.decision_at || 0))
    .map((entry) => {
      const fullName = `${entry.student_profiles?.first_name || ""} ${entry.student_profiles?.last_name || ""}`.trim();
      const itemId = entry.library_item_id;
      const book = itemId ? booksById.get(itemId) : null;
      const isReturnRequested = String(entry.decision_note || "").trim().toUpperCase() === "RETURN_REQUESTED";

      return {
        requestId: entry.id,
        user: fullName || entry.student_profiles?.last_name || "-",
        studentId: entry.student_profiles?.id_number || "-",
        book: entry.item_title || book?.title || "-",
        bookId: itemId || entry.id,
        time: entry.approved_at || entry.decision_at || entry.requested_at,
        status: isReturnRequested ? "return requested" : "borrowed",
      };
    });

  const borrowHistoryRows = (itemRequests || [])
    .filter((entry) => ["approved", "returned", "cancelled"].includes(String(entry.status || "").toLowerCase()))
    .sort((a, b) => {
      const aTime = a.returned_at || a.approved_at || a.decision_at || a.requested_at;
      const bTime = b.returned_at || b.approved_at || b.decision_at || b.requested_at;
      return new Date(bTime || 0) - new Date(aTime || 0);
    });

  const refresh = () => {
    fetchBooks();
    fetchHistory();
  };

  const handleApprove = async (requestId) => {
    if (!requestId || receivingRequestId) return;
    setReceivingRequestId(requestId);
    const result = await approveBorrowRequest(requestId);
    if (result?.ok) {
      refresh();
    }
    setReceivingRequestId(null);
  };

  const handleReturn = async (requestId) => {
    if (!requestId) {
      showError("Return request not found.");
      return;
    }
    if (returningRequestId) return;

    setReturningRequestId(requestId);
    const result = await confirmReturnRequest(requestId);
    if (!result?.ok) {
      setReturningRequestId(null);
      return;
    }

    refresh();
    setReturningRequestId(null);
  };

  const handleHistoryExport = () => {
    if (borrowHistoryRows.length === 0) return;
    const historyData = borrowHistoryRows.map((entry) => ({
      "Book ID": entry.library_item_id || "-",
      "Book Title": entry.item_title || "-",
      "Borrower": `${entry.student_profiles?.first_name || ""} ${entry.student_profiles?.last_name || ""}`.trim() || "-",
      "Action": formatHistoryAction(String(entry.status || "")),
      "Timestamp": formatDateTimeFull(entry.returned_at || entry.approved_at || entry.decision_at || entry.requested_at),
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
      {pendingRequests.length === 0 ? (
        <div className="empty-state">No borrow requests yet.</div>
      ) : (
        <div className="card table-scroll table-scroll--five staff-table-card">
          <div className="table table--staff-borrow-requests">
            <div className="table__row table__head">
              <span>Student</span>
              <span>ID Number</span>
              <span>Program</span>
              <span>Item</span>
              <span>Status</span>
              <span>Requested</span>
              <span>Action</span>
            </div>
            {pendingRequests.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{`${entry.student_profiles?.first_name || ""} ${entry.student_profiles?.last_name || ""}`.trim() || "-"}</span>
                <span>{entry.student_profiles?.id_number || "-"}</span>
                <span>{entry.student_profiles?.program || "-"}</span>
                <span>{entry.item_title || "-"}</span>
                <span>{entry.status || "-"}</span>
                <span>{formatDateTimeFull(entry.requested_at)}</span>
                <button
                  className="btn btn--primary"
                  onClick={() => handleApprove(entry.id)}
                  disabled={Boolean(receivingRequestId)}
                >
                  {receivingRequestId === entry.id ? "Receiving..." : "Receive"}
                </button>
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
        <div className="empty-state">No active borrower requests.</div>
      ) : (
        <div className="card table-scroll table-scroll--current-borrowers staff-table-card">
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
              <div className="table__row" key={entry.requestId}>
                <span>{entry.user}</span>
                <span>{entry.studentId}</span>
                <span>{entry.book}</span>
                <span>{formatDateTimeFull(entry.time)}</span>
                <span>{entry.status}</span>
                <button
                  className="btn btn--return"
                  onClick={() => handleReturn(entry.requestId)}
                  disabled={Boolean(returningRequestId)}
                >
                  {returningRequestId === entry.requestId ? "Returning..." : "Returned"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Borrow History</h2>
          <p className="muted">All book activity entries for borrowers.</p>
        </div>
        <button
          className="btn btn--ghost btn--export-soft"
          onClick={handleHistoryExport}
          disabled={borrowHistoryRows.length === 0}
        >
          Export CSV
        </button>
      </div>
      {borrowHistoryRows.length === 0 ? (
        <div className="empty-state">No request history yet.</div>
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
            {borrowHistoryRows.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{`${entry.student_profiles?.first_name || ""} ${entry.student_profiles?.last_name || ""}`.trim() || "-"}</span>
                <span>{entry.student_profiles?.id_number || "-"}</span>
                <span>{entry.item_title || "-"}</span>
                <span>{formatActivityAction(`BORROW_${String(entry.status || "").toUpperCase()}`)}</span>
                <span>{formatDateTimeFull(entry.returned_at || entry.approved_at || entry.decision_at || entry.requested_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default BorrowerTracking;
