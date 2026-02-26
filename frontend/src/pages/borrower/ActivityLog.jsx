// Purpose: Borrower activity timeline for reservations and borrowing actions.
// Parts: source data selection, derived filters, action handlers, table/list render.
import { useState } from "react";
import { getBorrowHistory } from "../../services/bookService";
import {
  formatReservationHour,
  getReservationHistory,
  getReservations,
  requestReservationCancellation
} from "../../services/reservationService";
import { useAuth } from "../../context/AuthContext";
import { formatDateTime } from "../../utils/dateUtils";
import { showError, showSuccess } from "../../utils/notification";
import { RESERVATION_STATUS } from "../../constants/status";

const ActivityLog = () => {
  const { user } = useAuth();
  const userEmail = user?.email || "";

  const getUserReservationUpdates = () =>
    getReservationHistory().filter(
      (entry) => entry.requestedBy?.toLowerCase() === userEmail.toLowerCase()
    );

  const getUserActiveReservations = () =>
    getReservations().filter(
      (entry) =>
        entry.requestedBy?.toLowerCase() === userEmail.toLowerCase() &&
        entry.status !== RESERVATION_STATUS.CLOSED
    );

  const getUserBorrowedHistory = () =>
    getBorrowHistory().filter(
      (entry) => entry.borrowerEmail?.toLowerCase() === userEmail.toLowerCase()
    );

  const [reservationUpdates, setReservationUpdates] = useState(
    getUserReservationUpdates
  );
  const [myReservations, setMyReservations] = useState(getUserActiveReservations);
  const [borrowedHistory] = useState(getUserBorrowedHistory);

  const formatAction = (action) => action?.replace(/_/g, " ") || "-";

  const handleCancellationRequest = (id) => {
    const result = requestReservationCancellation(id, userEmail);
    if (!result.ok) {
      showError(result.error || "Unable to request cancellation.");
      return;
    }
    showSuccess("Cancellation request submitted.");
    setMyReservations(getUserActiveReservations());
    setReservationUpdates(getUserReservationUpdates());
  };

  return (
    <section className="activity-log-page">
      <div className="page-header">
        <div>
          <h2>Activity Log</h2>
          <p className="muted">Track your reservation updates and borrowed books history.</p>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: "1rem" }}>
        <div>
          <h2>Request Reservation Cancellation</h2>
          <p className="muted">Apply to cancel your active reservations.</p>
        </div>
      </div>
      {myReservations.length === 0 ? (
        <div className="empty-state">No active reservations available for cancellation.</div>
      ) : (
        <div className="card activity-log-table-card">
          <div className="table table--reservation-actions">
            <div className="table__row table__head">
              <span>Room</span>
              <span>Time Slot</span>
              <span>Status</span>
              <span>Action</span>
            </div>
            {myReservations.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.room}</span>
                <span>{formatReservationHour(entry.reservationHour)}</span>
                <span>
                  {entry.cancellationRequested
                    ? "cancellation requested"
                    : entry.status}
                </span>
                <button
                  className="btn btn--ghost"
                  onClick={() => handleCancellationRequest(entry.id)}
                  disabled={entry.cancellationRequested}
                >
                  {entry.cancellationRequested ? "Requested" : "Apply Cancellation"}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Reservation Updates</h2>
          <p className="muted">Latest updates for your room reservation requests.</p>
        </div>
      </div>
      {reservationUpdates.length === 0 ? (
        <div className="empty-state">No reservation updates yet.</div>
      ) : (
        <div className="card table-scroll table-scroll--five activity-log-table-card">
          <div className="table table--reservation-updates">
            <div className="table__row table__head">
              <span>Room</span>
              <span>Time Slot</span>
              <span>Action</span>
              <span>Status</span>
              <span>Updated</span>
            </div>
            {reservationUpdates.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.room}</span>
                <span>{formatReservationHour(entry.reservationHour)}</span>
                <span>{formatAction(entry.action)}</span>
                <span>{entry.status || "-"}</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Books Borrowed History</h2>
          <p className="muted">History of books you borrowed or returned.</p>
        </div>
      </div>
      {borrowedHistory.length === 0 ? (
        <div className="empty-state">No borrowing history yet.</div>
      ) : (
        <div className="card table-scroll table-scroll--five activity-log-table-card">
          <div className="table table--borrow-history">
            <div className="table__row table__head">
              <span>Book</span>
              <span>Action</span>
              <span>Time</span>
            </div>
            {borrowedHistory.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.title || "-"}</span>
                <span>{formatAction(entry.action)}</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default ActivityLog;
