import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getBookById, borrowBook, returnBook } from "../../services/bookService";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [book, setBook] = useState(getBookById(id));

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

  const handleBorrow = () => {
    if (!user) return;
    const result = borrowBook(book.id, user.email);
    if (!result.ok) {
      showError(result.error);
    } else {
      showSuccess("Book borrowed successfully");
    }
    refresh();
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
              Borrow
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
    </section>
  );
};

export default BookDetails;
