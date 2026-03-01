// Purpose: Staff dashboard showing summary metrics and recent activity.
// Parts: metric derivation, formatting helpers, summary cards, activity list render.
import { getActivityLogs, getBorrowHistory } from "../../services/bookService";
import { getReservationHistory } from "../../services/reservationService";
import { getUserProfileByEmail } from "../../services/authService";
import { formatDateTime } from "../../utils/dateUtils";

const Dashboard = () => {
  // LOGIC: Dashboard uses two separate datasets:
  // 1) recent feed (mixed borrow + reservation events), and
  // 2) summary panels (confirmed borrow/reservation outcomes only).
  // Keeping these concerns separate prevents pending/noisy events from inflating summary counts.
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
    .filter((entry) =>
      reservationActionsForFeed.has(String(entry.action || "").toUpperCase())
    )
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
  const successfulBorrowEntries = borrowHistory.filter(
    (entry) => String(entry.action || "").toUpperCase() === "BORROW_BOOK"
  );
  // Count only successful borrow actions so "Most Borrowed" reflects actual checkouts.
  const borrowBookCountByTitle = successfulBorrowEntries.reduce((summary, entry) => {

    const title = String(entry.title || "").trim();
    if (!title) return summary;

    summary[title] = (summary[title] || 0) + 1;
    return summary;
  }, {});

  const bookActivityRows = Object.entries(borrowBookCountByTitle).sort(
    (a, b) => b[1] - a[1]
  );

  const successfulReservationActions = new Set(["RESERVATION_APPROVED"]);
  const successfulReservationEntries = getReservationHistory().filter((entry) =>
    successfulReservationActions.has(String(entry.action || "").toUpperCase())
  );

  // LOGIC: Aggregate borrower activity in one map so borrow + reservation metrics
  // stay aligned per user and can be sorted by a combined engagement score.
  const topActivityByUser = {};
  successfulBorrowEntries.forEach((entry) => {
    const email = String(entry.borrowerEmail || "").trim().toLowerCase();
    if (!email) return;

    if (!topActivityByUser[email]) {
      topActivityByUser[email] = {
        user: email,
        borrowedActions: 0,
        reservationActions: 0,
        total: 0
      };
    }

    topActivityByUser[email].borrowedActions += 1;
    topActivityByUser[email].total += 1;
  });

  successfulReservationEntries.forEach((entry) => {
    const email = String(entry.requestedBy || "").trim().toLowerCase();
    if (!email) return;

    if (!topActivityByUser[email]) {
      topActivityByUser[email] = {
        user: email,
        borrowedActions: 0,
        reservationActions: 0,
        total: 0
      };
    }

    topActivityByUser[email].reservationActions += 1;
    topActivityByUser[email].total += 1;
  });

  const borrowerActivityRows = Object.values(topActivityByUser)
    .filter((entry) => entry.borrowedActions > 0 || entry.reservationActions > 0)
    .sort((a, b) => {
      // LOGIC: Sort priority = total activity, then borrow count, then reservation count.
      // This gives deterministic ordering when users have close activity totals.
      if (b.total !== a.total) return b.total - a.total;
      if (b.borrowedActions !== a.borrowedActions) {
        return b.borrowedActions - a.borrowedActions;
      }
      return b.reservationActions - a.reservationActions;
    })
    .map((entry) => {
      const profile = getUserProfileByEmail(entry.user);
      return {
        ...entry,
        profileLabel: [
          entry.user || "-",
          profile?.id || "-",
          profile?.collegeCourse || "-",
          profile?.yearLevel || "-"
        ].join(" - ")
      };
    });
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

      <div className="stats-grid">
        <div className="card dashboard-summary-card">
          <p className="dashboard-summary-title">Book Activity</p>
          <ul className="dashboard-summary-list">
            {bookActivityRows.length === 0 ? (
              <li>No confirmed borrow activity yet</li>
            ) : (
              bookActivityRows.map(([title, count]) => (
                <li key={title}>
                  {title} - Borrowed : {count}
                </li>
              ))
            )}
          </ul>
        </div>

        <div className="card dashboard-summary-card">
          <p className="dashboard-summary-title">Borrower Activity</p>
          <ul className="dashboard-summary-list">
            {borrowerActivityRows.length === 0 ? (
              <li>No borrower activity yet</li>
            ) : (
              borrowerActivityRows.map((entry) => (
                <li key={entry.user}>
                  {entry.profileLabel}
                  <ul className="dashboard-summary-sublist">
                    <li>Borrowed: {entry.borrowedActions}</li>
                    <li>Reservation: {entry.reservationActions}</li>
                  </ul>
                </li>
              ))
            )}
          </ul>
        </div>
      </div>

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
