// Purpose: Staff dashboard showing summary metrics and recent activity.
// Parts: metric derivation, formatting helpers, summary cards, activity list render.
import { getActivityLogs, getBorrowHistory } from "../../services/bookService";
import { getReservationHistory } from "../../services/reservationService";
import { getUserProfileByEmail } from "../../services/authService";
import { formatDateTime } from "../../utils/dateUtils";
import StaffSummaryCards from "../../components/StaffSummaryCards";

const Dashboard = () => {
  // Show a short, recent feed to keep dashboard quick to scan.
  // Normalize borrow logs into a single shape used by the shared feed table.
  const hiddenBookManagementActions = new Set(["BOOK_ADDED", "BOOK_DELETED"]);
  const borrowLogs = getActivityLogs()
    .filter((entry) => !hiddenBookManagementActions.has(String(entry.action || "").toUpperCase()))
    .map((entry) => ({
      ...entry,
      userEmail: entry.borrowerEmail || "",
      sourceTimestamp: entry.timestamp
    }));

  // Only include reservation actions that matter for day-to-day monitoring.
  const reservationActionsForFeed = new Set([
    "RESERVATION_CREATED",
    "RESERVATION_APPROVED",
    "RESERVATION_CLOSED",
    "RESERVATION_CANCELLATION_REQUESTED"
  ]);

  // Project reservation history into same feed schema as borrow logs.
  const reservationRequestLogs = getReservationHistory()
    .filter((entry) => reservationActionsForFeed.has(entry.action))
    .map((entry) => ({
      ...entry,
      userEmail: entry.requestedBy || "",
      sourceTimestamp: entry.timestamp
    }));

  // Merge, sort newest-first, then cap to the latest four events.
  const logs = [...borrowLogs, ...reservationRequestLogs]
    .sort(
      (a, b) =>
        new Date(b.sourceTimestamp || 0).getTime() -
        new Date(a.sourceTimestamp || 0).getTime()
    )
    .slice(0, 4);

  const borrowHistory = getBorrowHistory();
  // Count only successful borrow actions so "Most Borrowed" reflects actual checkouts.
  const borrowBookCountByTitle = borrowHistory.reduce((summary, entry) => {
    if (String(entry.action || "").toUpperCase() !== "BORROW_BOOK") return summary;

    const title = String(entry.title || "").trim();
    if (!title) return summary;

    summary[title] = (summary[title] || 0) + 1;
    return summary;
  }, {});

  const mostBorrowedBook = Object.entries(borrowBookCountByTitle).sort(
    (a, b) => b[1] - a[1]
  )[0] || null;

  // Activity score combines borrow logs and reservation lifecycle events per user.
  const activityCountByUser = [...borrowLogs, ...reservationRequestLogs].reduce(
    (summary, entry) => {
      const email = String(entry.userEmail || "").trim().toLowerCase();
      if (!email) return summary;

      summary[email] = (summary[email] || 0) + 1;
      return summary;
    },
    {}
  );

  const mostActiveUser = Object.entries(activityCountByUser).sort(
    (a, b) => b[1] - a[1]
  )[0] || null;

  // Summary cards prioritize simple, high-signal metrics for quick dashboard scanning.
  const summaryCards = [
    {
      label: "Most Borrowed",
      value: mostBorrowedBook ? mostBorrowedBook[0] : "No borrow data yet"
    },
    {
      label: "Top Activity User",
      value: mostActiveUser ? mostActiveUser[0] : "No activity yet"
    }
  ];

  const formatAction = (action) => {
    const normalizedAction = String(action || "").trim().toUpperCase();

    if (normalizedAction === "RESERVATION_CREATED") return "ROOM REQUESTED";
    if (normalizedAction === "RESERVATION_APPROVED") return "ROOM APPROVED";
    if (normalizedAction === "RESERVATION_CLOSED") return "ROOM CLOSED";
    if (normalizedAction === "RESERVATION_CANCELLATION_REQUESTED") {
      return "ROOM CANCELED";
    }

    return String(action || "-").replace(/_/g, " ");
  };
  // Resolve Student ID from profile first; fallback to event payload if present.
  const getStudentId = (entry) => {
    const profile = getUserProfileByEmail(entry.userEmail);
    return profile?.id || entry.userId || "-";
  };

  return (
    <section className="staff-page staff-dashboard-page">
      <div className="page-header">
        <div>
          <h2>Staff Dashboard</h2>
          <p className="muted">Monitor reservations and borrower activity.</p>
        </div>
      </div>

      <StaffSummaryCards cards={summaryCards} />

      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Recent Activity</h2>
          <p className="muted">Latest borrow/return updates and room requests.</p>
        </div>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">No activity yet.</div>
      ) : (
        <div className="card table-scroll table-scroll--five dashboard-activity-table-card">
          <div className="table table--staff-dashboard-activity">
            <div className="table__row table__head">
              <span>Action</span>
              <span>User</span>
              <span>Student ID</span>
              <span>Time</span>
            </div>
            {logs.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{formatAction(entry.action)}</span>
                <span>{entry.userEmail || "-"}</span>
                <span>{getStudentId(entry)}</span>
                <span>{formatDateTime(entry.sourceTimestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
