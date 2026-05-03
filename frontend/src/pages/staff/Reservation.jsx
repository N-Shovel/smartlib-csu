// Purpose: Staff reservation approvals and reservation-history management page.
// Parts: reservation datasets, formatting helpers, approve/close handlers, export/table render.
import { useEffect, useMemo, useState } from "react";
import {
  autoClosePassedReservations,
  getReservations,
  approveReservation,
  getReservationHistory,
  formatReservationHour,
  closeReservation
} from "../../services/reservationService";
import { RESERVATION_STATUS } from "../../constants/status";
import { formatDateTimeFull } from "../../utils/dateUtils";
import { showError, showSuccess } from "../../utils/notification";
import { exportToCSV } from "../../services/exportService";
import { useStore } from "../../store/useAuthStore";

const getReservationDisplayAction = (entry) => {
  const status = String(entry?.status || "").toLowerCase();
  const decisionNote = String(entry?.decisionNote || entry?.decision_note || "").toUpperCase();

  if (status === "pending") return "REQUESTED";
  if (status === "approved") return "APPROVED";
  if (status === "cancelled") return "CANCELLED";
  if (status === "rejected" && decisionNote === "AUTO_EXPIRED") return "AVAILABLE";
  if (status === "rejected") return "ENDED";
  return "REQUESTED";
};

const getReservationDisplayStatus = (entry) => {
  const status = String(entry?.status || "").toLowerCase();
  const decisionNote = String(entry?.decisionNote || entry?.decision_note || "").toUpperCase();

  if (status === "pending") return "request";
  if (status === "approved") return "approve";
  if (status === "cancelled") return "rejected";
  if (status === "rejected" && decisionNote === "AUTO_EXPIRED") return "available";
  if (status === "rejected") return "rejected";
  return status || "-";
};

const Reservation = () => {
  const { borrowers, getStudentBorrowers } = useStore();

  const [reservations, setReservations] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedReason, setSelectedReason] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStudentBorrowers();
  }, [getStudentBorrowers]);

  // Initial load and periodic refresh
  useEffect(() => {
    const refresh = async () => {
      try {
        await autoClosePassedReservations();
        const [reservationsData, historyData] = await Promise.all([
          getReservations(),
          getReservationHistory(),
        ]);
        setReservations(reservationsData);
        setHistory(historyData);
      } catch (error) {
        console.error("Error refreshing reservations:", error);
      } finally {
        setIsLoading(false);
      }
    };

    refresh();

    // Set up interval for periodic refresh
    const intervalId = setInterval(refresh, 30000);
    return () => clearInterval(intervalId);
  }, []);

  const studentIdByEmail = useMemo(() => {
    return (borrowers || []).reduce((summary, borrower) => {
      const email = String(borrower?.email || "").trim().toLowerCase();
      if (!email) return summary;

      summary[email] = borrower?.id_number || "-";
      return summary;
    }, {});
  }, [borrowers]);

  // Student ID is resolved from a memoized profile map to avoid repeated lookups.
  const getStudentIdByEmail = (email) =>
    studentIdByEmail[String(email || "").trim().toLowerCase()] || "-";
  // Collapse legacy/raw history action strings into table-safe labels.
  const formatHistoryAction = (action) => {
    const normalizedAction = String(action || "").trim().toUpperCase();

    if (normalizedAction.includes("APPROVED")) {
      return "APPROVED";
    }

    if (normalizedAction.includes("AVAILABLE")) {
      return "AVAILABLE";
    }

    if (normalizedAction.includes("ENDED")) {
      return "ENDED";
    }

    if (normalizedAction.includes("CANCEL")) {
      return "Canceled";
    }

    if (normalizedAction.includes("CLOSED") || normalizedAction.includes("REJECTED")) {
      return "CLOSED";
    }

    if (normalizedAction.includes("REQUEST") || normalizedAction.includes("CREATED")) {
      return "REQUESTED";
    }

    return "REQUESTED";
  };

  const refresh = async () => {
    // Keep reservations and history in sync after approve/close actions.
    try {
      await autoClosePassedReservations();
      const [reservationsData, historyData] = await Promise.all([
        getReservations(),
        getReservationHistory(),
      ]);
      setReservations(reservationsData);
      setHistory(historyData);
    } catch (error) {
      console.error("Error refreshing reservations:", error);
    }
  };

  // Split live reservations into pending and currently approved sections.
  const pending = reservations.filter(
    (reservation) => reservation.status === RESERVATION_STATUS.PENDING
  );
  const currentReservations = reservations.filter(
    (reservation) => reservation.status === RESERVATION_STATUS.APPROVED
  );

  const handleApprove = async (id) => {
    try {
      const result = await approveReservation(id);
      if (result.ok) {
        showSuccess("Reservation approved");
        await refresh();
      } else {
        showError(result.error ?? "Failed to approve reservation.");
      }
    } catch (error) {
      showError("An error occurred while approving the reservation.");
      console.error("Error approving reservation:", error);
    }
  };

  const handleClose = async (id) => {
    try {
      const result = await closeReservation(id);
      if (result.ok) {
        showSuccess("Reservation closed");
        await refresh();
      } else {
        showError(result.error ?? "Failed to close reservation.");
      }
    } catch (error) {
      showError("An error occurred while closing the reservation.");
      console.error("Error closing reservation:", error);
    }
  };

  const handleHistoryExport = () => {
    // Export intentionally includes only the latest six rows shown in the UI.
    if (history.length === 0) return;
    const historyData = history.slice(0, 6).map((entry) => ({
      "Room": entry.room || "-",
      "Requester": entry.requestedBy || "-",
      "Reservation Hour": formatReservationHour(entry.reservationHour),
      "Date": formatDateTimeFull(entry.reservationDate),
      "Status": entry.status || "-",
    }));
    exportToCSV(
      historyData,
      "reservation-history-latest.csv"
    );
  };

  const openReasonModal = (reservation) => {
    // Preserve only fields needed by the modal payload.
    setSelectedReason({
      room: reservation.room,
      requester: reservation.requestedBy,
      reason: reservation.notes || "No reason provided."
    });
  };

  const closeReasonModal = () => {
    setSelectedReason(null);
  };

  const getReservationReason = (reservation) => {
    const reasonValue = reservation?.notes ?? reservation?.reason ?? "";
    const normalizedReason = String(reasonValue).trim();
    return normalizedReason;
  };

  if (isLoading) {
    return (
      <section className="staff-page staff-approvals-page">
        <div className="empty-state">Loading reservations...</div>
      </section>
    );
  }

  return (
    <section className="staff-page staff-approvals-page reservation-page">
      <div className="page-header">
        <div>
          <h2>Approval</h2>
          <p className="muted">Approve or clear pending room requests.</p>
        </div>
      </div>
      {pending.length === 0 ? (
        <div className="empty-state">No reservation requests yet.</div>
      ) : (
        <div className="card staff-table-card reservation-table-wrap">
          <table className="staff-data-table">
            <colgroup>
              <col style={{ width: "10ch" }} />
              <col style={{ width: "22ch" }} />
              <col style={{ width: "12ch" }} />
              <col style={{ width: "24ch" }} />
              <col style={{ width: "10ch" }} />
              <col style={{ width: "10ch" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Room</th>
                <th>Time Slot</th>
                <th>ID</th>
                <th>Requested</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {pending.map((reservation) => (
                <tr key={reservation.id}>
                  <td data-label="Room">{reservation.room}</td>
                  <td data-label="Time Slot">{formatReservationHour(reservation.reservationHour)}</td>
                  <td data-label="ID">{getStudentIdByEmail(reservation.requestedBy)}</td>
                  <td data-label="Requested">{formatDateTimeFull(reservation.createdAt)}</td>
                  <td data-label="Reason">
                    <button
                      className="btn btn--view"
                      onClick={() => openReasonModal(reservation)}
                    >
                      View
                    </button>
                  </td>
                  <td data-label="Action">
                    <button
                      className="btn btn--success"
                      onClick={() => handleApprove(reservation.id)}
                    >
                      Approve
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Current Reservations</h2>
          <p className="muted">Latest 6 approved reservations currently in use.</p>
        </div>
      </div>
      {currentReservations.length === 0 ? (
        <div className="empty-state">No active reservation requests.</div>
      ) : (
        <div className="card staff-table-card reservation-table-wrap">
          <table className="staff-data-table">
            <colgroup>
              <col style={{ width: "10ch" }} />
              <col style={{ width: "22ch" }} />
              <col style={{ width: "12ch" }} />
              <col style={{ width: "24ch" }} />
              <col style={{ width: "16ch" }} />
              <col style={{ width: "24ch" }} />
              <col style={{ width: "18ch" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Room</th>
                <th>Time Slot</th>
                <th>ID</th>
                <th>Requested</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {currentReservations.slice(0, 6).map((reservation) => (
                <tr key={reservation.id}>
                  <td data-label="Room">{reservation.room}</td>
                  <td data-label="Time Slot">{formatReservationHour(reservation.reservationHour)}</td>
                  <td data-label="ID">{getStudentIdByEmail(reservation.requestedBy)}</td>
                  <td data-label="Requested">{formatDateTimeFull(reservation.createdAt)}</td>
                  <td data-label="Status">
                    {reservation.cancellationRequested
                      ? "approved · cancellation requested"
                      : getReservationDisplayStatus(reservation)}
                  </td>
                  <td data-label="Reason">
                    <div className="reservation-reason-cell">
                      {getReservationReason(reservation) ? (
                        <button
                          className="btn btn--view"
                          onClick={() => openReasonModal(reservation)}
                        >
                          View
                        </button>
                      ) : (
                        <span className="muted">-</span>
                      )}
                    </div>
                  </td>
                  <td data-label="Action">
                    <button
                      className="btn btn--danger"
                      onClick={() => handleClose(reservation.id)}
                    >
                      Close
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Reservation History</h2>
          <p className="muted">Latest 6 reservation updates.</p>
        </div>
        <button
          className="btn btn--ghost btn--export-soft"
          onClick={handleHistoryExport}
          disabled={history.length === 0}
        >
          Export CSV
        </button>
      </div>
      {history.length === 0 ? (
        <div className="empty-state">No reservation request history yet.</div>
      ) : (
        <div className="card staff-table-card reservation-table-wrap">
          <table className="staff-data-table">
            <colgroup>
              <col style={{ width: "10ch" }} />
              <col style={{ width: "22ch" }} />
              <col style={{ width: "20ch" }} />
              <col style={{ width: "12ch" }} />
              <col style={{ width: "11ch" }} />
              <col style={{ width: "14ch" }} />
              <col style={{ width: "24ch" }} />
            </colgroup>
            <thead>
              <tr>
                <th>Room</th>
                <th>Time Slot</th>
                <th>Email</th>
                <th>ID</th>
                <th>Action</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {history.slice(0, 6).map((entry) => (
                <tr key={entry.id}>
                  <td data-label="Room">{entry.room}</td>
                  <td data-label="Time Slot">{formatReservationHour(entry.reservationHour)}</td>
                  <td data-label="Email">{entry.requestedBy}</td>
                  <td data-label="ID">{getStudentIdByEmail(entry.requestedBy)}</td>
                  <td data-label="Action">{formatHistoryAction(getReservationDisplayAction(entry))}</td>
                  <td data-label="Status">{getReservationDisplayStatus(entry)}</td>
                  <td data-label="Time">{formatDateTimeFull(entry.timestamp)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedReason ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card modal-card modal-card--reason-details">
            <h3>Reservation Reason</h3>
            <p>
              <strong>Room:</strong> {selectedReason.room || "-"}
            </p>
            <p>
              <strong>Email:</strong> {selectedReason.requester || "-"}
            </p>
            <p>
              <strong>Reason:</strong> {selectedReason.reason}
            </p>
            <div className="modal-actions">
              <button className="btn btn--danger" onClick={closeReasonModal}>
                Close
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default Reservation;
