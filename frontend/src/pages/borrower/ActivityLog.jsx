// Purpose: Borrower activity timeline for reservations and borrowing actions.
// Parts: source data selection, derived filters, action handlers, table/list render.
import { useEffect, useMemo, useRef } from "react";
import {
    autoClosePassedReservations,
    formatReservationHour,
    getReservationHistory,
    getReservations,
    isReservationTimePassed,
    requestReservationCancellation
} from "../../services/reservationService";
import { formatDateTime } from "../../utils/dateUtils";
import { showError, showInfo, showSuccess } from "../../utils/notification";
import { RESERVATION_STATUS } from "../../constants/status";
import { formatActivityAction } from "../../utils/activityUtils";
import { useStore } from "../../store/useAuthStore";
import { useRequest } from "../../store/useRequestsStore";

const isBorrowHistoryStatus = (status) => {
    const normalized = String(status || "").toLowerCase();
    return ["approved", "returned", "cancelled"].includes(normalized);
};

const toBorrowActionLabel = (status) => {
    const normalized = String(status || "").toLowerCase();
    if (normalized === "approved") return "BORROW_BOOK";
    if (normalized === "returned") return "RETURN_BOOK";
    if (normalized === "cancelled") return "CANCELLED";
    return normalized || "-";
};

const ActivityLog = () => {
    const { user } = useStore();
    // Use normalized current-user email to scope visible activity records.
    const userEmail = (user?.profile?.email || user?.user?.email || user?.email || "").toLowerCase();
    const userId = user?.profile?.user_id || user?.user?.id || "";
    
    const {fetchHistory, itemRequests} = useRequest();
    
    useEffect(() => {
        fetchHistory();
    },[fetchHistory])

    useEffect(() => {
        const intervalId = setInterval(() => {
            fetchHistory();
        }, 3000);

        return () => {
            clearInterval(intervalId);
        };
    }, [fetchHistory]);

    const reservationUpdates = !userEmail
        ? []
        : getReservationHistory().filter(
            (entry) => String(entry.requestedBy || "").toLowerCase() === userEmail
        );

    autoClosePassedReservations();
    const myReservations = getReservations().filter(
        (entry) =>
            String(entry.requestedBy || "").toLowerCase() === userEmail &&
            entry.status === RESERVATION_STATUS.PENDING &&
            !isReservationTimePassed(entry)
    );

    const myBorrowRequests = useMemo(() => {
        if (!Array.isArray(itemRequests)) return [];

        return itemRequests.filter((entry) => {
            if (userId && entry.student_user_id) {
                return entry.student_user_id === userId;
            }

            const entryEmail = String(entry.student_profiles?.email || entry.borrowerEmail || "").toLowerCase();
            return Boolean(userEmail) && entryEmail === userEmail;
        });
    }, [itemRequests, userEmail, userId]);

    const borrowUpdates = useMemo(
        () => myBorrowRequests.filter((entry) => !isBorrowHistoryStatus(entry.status)),
        [myBorrowRequests]
    );

    const borrowedHistory = useMemo(
        () => myBorrowRequests
            .filter((entry) => isBorrowHistoryStatus(entry.status))
            .map((entry) => ({
                id: entry.id,
                title: entry.item_title,
                action: toBorrowActionLabel(entry.status),
                timestamp: entry.returned_at || entry.approved_at || entry.decision_at || entry.requested_at,
            })),
        [myBorrowRequests]
    );

    const cancellationTimeoutRef = useRef(null);

    useEffect(() => () => {
        if (cancellationTimeoutRef.current) {
            clearTimeout(cancellationTimeoutRef.current);
        }
    }, []);

    const handleCancellationRequest = (id) => {
        // Ask service to mark this reservation as cancellation-requested.
        showInfo("Submitting cancellation request, please wait...");
        if (cancellationTimeoutRef.current) {
            clearTimeout(cancellationTimeoutRef.current);
        }
        // LOGIC: Match cancellation UX timing with other borrower mutations
        // (borrow/return/cancel) so feedback feels consistent across actions.
        cancellationTimeoutRef.current = setTimeout(() => {
            const result = requestReservationCancellation(id, userEmail);
            if (!result.ok) {
                showError(result.error || "Unable to request cancellation.");
                cancellationTimeoutRef.current = null;
                return;
            }
            showSuccess("Cancellation request submitted.");
            cancellationTimeoutRef.current = null;
        }, 500);
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
                    <h2>Book Borrow Update</h2>
                    <p className="muted">Track your borrow request status and release updates.</p>
                </div>
            </div>
            {borrowUpdates.length === 0 ? (
                <div className="empty-state">No borrow updates yet.</div>
            ) : (
                    <div className="card table-scroll table-scroll--five activity-log-table-card">
                        <div className="table table--borrow-updates">
                            <div className="table__row table__head">
                                <span>Book</span>
                                <span>Status</span>
                                <span>Requested</span>
                                <span>Updated</span>
                            </div>
                            {borrowUpdates.map((entry) => (
                                <div className="table__row" key={entry.id}>
                                    <span>{entry.item_title || "-"}</span>
                                    <span>{entry.status || "-"}</span>
                                    <span>{formatDateTime(entry.requested_at)}</span>
                                    <span>{formatDateTime(entry.decision_at || entry.requested_at)}</span>
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
                                    <span>{formatActivityAction(entry.action)}</span>
                                    <span>{formatDateTime(entry.timestamp)}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            <div className="page-header" style={{ marginTop: "2rem" }}>
                <div>
                    <h2>Request Reservation Update</h2>
                    <p className="muted">Request updates for your active reservations.</p>
                </div>
            </div>
            {myReservations.length === 0 ? (
                <div className="empty-state">No active reservations available for cancellation.</div>
            ) : (
                    <div className="card table-scroll table-scroll--five activity-log-table-card">
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
                                        className="btn btn--danger"
                                        onClick={() => handleCancellationRequest(entry.id)}
                                        disabled={entry.cancellationRequested}
                                    >
                                        {entry.cancellationRequested ? "Cancellation Requested" : "Cancel"}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

            <div className="page-header" style={{ marginTop: "2rem" }}>
                <div>
                    <h2>Reservation History</h2>
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
                                    <span>{formatActivityAction(entry.action)}</span>
                                    <span>{entry.status || "-"}</span>
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
