import {
  getBorrowerSummary,
  getBorrowHistory
} from "../../services/bookService";
import { exportToCSV } from "../../services/exportService";
import { formatDateTime } from "../../utils/dateUtils";
import { getBorrowHistoryExport } from "../../data/exportBorrowersHistory";

const BorrowerTracking = () => {
  const borrowers = getBorrowerSummary();
  const history = getBorrowHistory();

  const handleExport = () => {
    if (borrowers.length === 0) return;
    exportToCSV(borrowers, "borrower-summary.csv");
  };

  const handleHistoryExport = () => {
    if (history.length === 0) return;
    exportToCSV(getBorrowHistoryExport(history), "borrow-history.csv");
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Borrower Tracking</h2>
          <p className="muted">Current borrowed books by borrower.</p>
        </div>
        <button
          className="btn btn--ghost"
          onClick={handleExport}
          disabled={borrowers.length === 0}
        >
          Export CSV
        </button>
      </div>
      {borrowers.length === 0 ? (
        <div className="empty-state">No active borrowings.</div>
      ) : (
        <div className="book-grid">
          {borrowers.map((borrower) => (
            <div key={borrower.email} className="card">
              <h3>{borrower.email}</h3>
              <p className="muted">
                Borrowed Books: {borrower.borrowedCount}
              </p>
              <ul className="list">
                {borrower.titles.map((title, index) => (
                  <li key={`${borrower.email}-${index}`}>{title}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="page-header" style={{ marginTop: "2rem" }}>
        <div>
          <h2>Borrow History</h2>
          <p className="muted">Recent book activity for borrowers.</p>
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
        <div className="card">
          <div className="table">
            <div className="table__row table__head">
              <span>User</span>
              <span>Book</span>
              <span>Action</span>
              <span>Time</span>
            </div>
            {history.slice(0, 6).map((entry) => (
              <div className="table__row" key={entry.id}>
                <span>{entry.borrowerEmail}</span>
                <span>{entry.title}</span>
                <span>{entry.action.replace("_", " ")}</span>
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
