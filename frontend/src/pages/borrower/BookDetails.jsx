// Purpose: Detailed single-book page with borrower actions.
// Parts: selected book state, borrow/return handlers, thesis flow, detail render.
import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBookById, borrowBook, returnBook } from "../../services/bookService";
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

  const refresh = () => setBook(getBookById(id));

  const isThesis = String(book.category || "").toLowerCase() === "thesis";

  const submitBorrow = (code = "") => {
    if (!user) return null;
    const result = borrowBook(book.id, user.email, code);
    if (!result.ok) {
      showError(result.error);
      return result;
    }

    showSuccess("Book borrowed successfully");
    refresh();
    return result;
  };

  const handleBorrow = () => {
    if (!user) return;
    if (isThesis) {
      setIsPermissionModalOpen(true);
      setPermissionCode("");
      setPermissionError("");
      return;
    }

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
    const result = returnBook(book.id, user.email);
    if (!result.ok) {
      showError(result.error);
    } else {
      showSuccess("Book returned successfully");
    }
    refresh();
  };

  return (
    <section className="detail-card">
      <div>
        <h2>{book.title}</h2>
        {book.category ? <p className="detail-card__category">{book.category}</p> : null}
        <p className="muted">{book.author}</p>
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
            <button className="btn btn--primary" onClick={handleBorrow}>
              {isThesis ? "Apply" : "Borrow"}
            </button>
          ) : (
            <button
              className="btn btn--ghost"
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
    </section>
  );
};

export default BookDetails;
