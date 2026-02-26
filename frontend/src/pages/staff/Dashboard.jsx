// Purpose: Staff dashboard showing summary metrics and recent activity.
// Parts: metric derivation, formatting helpers, summary cards, activity list render.
import { getActivityLogs } from "../../services/bookService";
import { formatDateTime } from "../../utils/dateUtils";
import StaffSummaryCards from "../../components/StaffSummaryCards";

const Dashboard = () => {
  const logs = getActivityLogs().slice(0, 4);
  const formatAction = (action) => action.replace(/_/g, " ");

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Staff Dashboard</h2>
          <p className="muted">Monitor reservations and borrower activity.</p>
        </div>
      </div>
      <StaffSummaryCards />
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Recent Activity</h2>
          <p className="muted">Latest borrow and return updates.</p>
        </div>
      </div>
      {logs.length === 0 ? (
        <div className="empty-state">No activity yet.</div>
      ) : (
        <div className="card">
          <div className="table">
            <div className="table__row table__head">
              <span>Action</span>
              <span>User</span>
              <span>Book</span>
              <span>Time</span>
            </div>
            {logs.map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{formatAction(entry.action)}</span>
                <span>{entry.borrowerEmail || "-"}</span>
                <span>{entry.bookId ? `No. ${entry.bookId}` : "-"}</span>
                <span>{formatDateTime(entry.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
};

export default Dashboard;
