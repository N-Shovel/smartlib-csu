import { useState } from "react";
import {
  getReservations,
  approveReservation,
  getReservationHistory
} from "../../services/reservationService";
import { RESERVATION_STATUS } from "../../constants/status";
import { formatDateTime } from "../../utils/dateUtils";
import { showSuccess } from "../../utils/notification";
import { exportToCSV } from "../../services/exportService";
import { getReservationHistoryExport } from "../../data/exportReservations";

const Approvals = () => {
  const [reservations, setReservations] = useState(getReservations());
  const [history, setHistory] = useState(getReservationHistory());
  const formatAction = (action) => action.replace(/_/g, " ");

  const refresh = () => {
    setReservations(getReservations());
    setHistory(getReservationHistory());
  };

  const pending = reservations.filter(
    (reservation) => reservation.status === RESERVATION_STATUS.PENDING
  );

  const handleApprove = (id) => {
    const result = approveReservation(id);
    if (result.ok) {
      showSuccess("Reservation approved");
      refresh();
    } else {
      alert(result.error ?? "Failed to approve reservation.");
    }
  };

  const handleHistoryExport = () => {
    if (history.length === 0) return;
    exportToCSV(
      getReservationHistoryExport(history.slice(0, 6)),
      "reservation-history.csv"
    );
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Reservations</h2>
          <p className="muted">Approve or clear pending room requests.</p>
        </div>
      </div>
      {pending.length === 0 ? (
        <div className="empty-state">No pending reservations.</div>
      ) : (
        <div className="card">
          <div className="table">
            <div className="table__row table__head">
              <span>Room</span>
              <span>Requester</span>
              <span>Notes</span>
              <span>Requested</span>
              <span>Action</span>
            </div>
            {pending.map((reservation) => (
              <div className="table__row" key={reservation.id}>
                <span>{reservation.room}</span>
                <span>{reservation.requestedBy}</span>
                <span>{reservation.notes || "-"}</span>
                <span>{formatDateTime(reservation.createdAt)}</span>
                <button
                  className="btn btn--ghost"
                  onClick={() => handleApprove(reservation.id)}
                >
                  Approve
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Reservation History</h2>
          <p className="muted">Latest 6 reservation updates.</p>
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
        <div className="empty-state">No reservation history yet.</div>
      ) : (
        <div className="card">
          <div className="table">
            <div className="table__row table__head">
              <span>Room</span>
              <span>Requester</span>
              <span>Action</span>
              <span>Status</span>
              <span>Time</span>
            </div>
            {history.slice(0, 6).map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.room}</span>
                <span>{entry.requestedBy}</span>
                <span>{formatAction(entry.action)}</span>
                <span>{entry.status}</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Approvals;
