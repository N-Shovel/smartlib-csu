// Purpose: Detailed single-book page with borrower actions.
// Parts: selected book state, borrow/return handlers, thesis flow, detail render.
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  getBookById,
  borrowBook,
  returnBook,
  getBorrowRequestsByBorrower,
  cancelBorrowRequest
} from "../../services/bookService";
import ThesisPermissionModal from "../../components/ThesisPermissionModal";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(getBookById(id));
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionCode, setPermissionCode] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [borrowRequests, setBorrowRequests] = useState(
    () => getBorrowRequestsByBorrower(user?.email)
  );
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);

  if (!book) {
    return (
      <div className="empty-state">
        <h2>Book not found</h2>
        <Link className="btn btn--ghost" to="/borrower/browse">
          Back to browse
        </Link>
      </div>
    );
  }

  // Pull the latest copy after borrow/return mutations.
  const refresh = () => {
    setBook(getBookById(id));
    setBorrowRequests(getBorrowRequestsByBorrower(user?.email));
  };

  // Thesis items require the permission-code modal flow.
  const isThesis = String(book.category || "").toLowerCase() === "thesis";

  const pendingRequest = borrowRequests.find(
    (request) => request.bookId === book.id && request.status === "pending"
  );

  const submitBorrow = (code = "") => {
    if (!user) return null;
    const result = borrowBook(book.id, user.email, code);
    if (!result.ok) {
      showError(result.error);
      return result;
    }

    showSuccess("Pending. Please pick it up at the library.");
    refresh();
    return result;
  };

  const handleBorrow = () => {
    if (!user) return;
    if (pendingRequest) {
      setIsCancelModalOpen(true);
      return;
    }
    // Thesis borrowing is gated by manual permission code submission.
    if (isThesis) {
      setIsPermissionModalOpen(true);
      setPermissionCode("");
      setPermissionError("");
      return;
    }

    // Non-thesis items are borrowed directly.
    submitBorrow();
  };

  const handleThesisApply = () => {
    const result = submitBorrow(permissionCode);
    if (!result?.ok) {
      setPermissionError(result?.error || "Unable to apply for this thesis.");
      return;
    }

    setIsPermissionModalOpen(false);
    setPermissionCode("");
    setPermissionError("");
  };

  const handleReturn = () => {
    if (!user) return;
    // Return operation validates ownership in service layer.
    const result = returnBook(book.id, user.email);
    if (!result.ok) {
      showError(result.error);
    } else {
      showSuccess("Book returned successfully");
    }
    refresh();
  };

  const handleCancelPendingRequest = () => {
    if (!user || !pendingRequest) return;
    const result = cancelBorrowRequest(pendingRequest.id, user.email);
    if (!result.ok) {
      showError(result.error || "Unable to cancel borrow request.");
      return;
    }

    showSuccess("Borrow request cancelled.");
    setIsCancelModalOpen(false);
    refresh();
  };

  return (
    <section className="detail-card">
      <div>
        <h2>{book.title}</h2>
        {book.category ? <p className="detail-card__category">{book.category}</p> : null}
        <p className="muted">{book.author}</p>
        {Array.isArray(book.keywords) && book.keywords.length > 0 ? (
          <p className="micro">Keywords: {book.keywords.join(", ")}</p>
        ) : null}
        <p className="detail-card__desc">{book.description}</p>
      </div>
      <div className="detail-card__meta">
        <span className={`status ${book.available ? "status--ok" : "status--busy"}`}>
          {book.available ? "Available" : "Borrowed"}
        </span>
        {!book.available && book.borrowedBy ? (
          <p className="micro">Borrowed by {book.borrowedBy}</p>
        ) : null}
        <div className="detail-card__actions">
          {book.available ? (
            <button className={`btn ${pendingRequest ? "btn--view" : "btn--primary"}`} onClick={handleBorrow}>
              {pendingRequest ? "Pending" : isThesis ? "Apply" : "Borrow"}
            </button>
          ) : (
            <button
              className="btn btn--return"
              onClick={handleReturn}
              disabled={book.borrowedBy !== user?.email}
            >
              Return
            </button>
          )}
          <Link className="btn btn--ghost" to="/borrower/browse">
            Back to browse
          </Link>
        </div>
        {pendingRequest ? <p className="micro">Please pick it up at the library.</p> : null}
      </div>

      <ThesisPermissionModal
        isOpen={isPermissionModalOpen}
        code={permissionCode}
        error={permissionError}
        onCodeChange={(value) => {
          setPermissionCode(value);
          if (permissionError) setPermissionError("");
        }}
        onCancel={() => {
          setIsPermissionModalOpen(false);
          setPermissionCode("");
          setPermissionError("");
        }}
        onSubmit={handleThesisApply}
      />

      {isCancelModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card modal-card">
            <h3>Cancel Pending Borrow Request</h3>
            <p className="muted">Do you want to cancel this pending borrow request?</p>
            <div className="modal-actions">
              <button className="btn btn--ghost" onClick={() => setIsCancelModalOpen(false)}>
                Keep Pending
              </button>
              <button className="btn btn--danger" onClick={handleCancelPendingRequest}>
                Cancel Request
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default BookDetails;
