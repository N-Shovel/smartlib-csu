// Purpose: Detailed single-book page with borrower actions.
// Parts: selected book state, borrow/return handlers, thesis flow, detail render.
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

import ThesisPermissionModal from "../../components/ThesisPermissionModal";
import {
  borrowBook,
  cancelBorrowRequest,
  getBookById,
  getBorrowRequestsByBorrower,
} from "../../services/bookService";
import { showError, showInfo, showSuccess } from "../../utils/notification";
import { useStore } from "../../store/useAuthStore";

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useStore();
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionCode, setPermissionCode] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const queuedActionRef = useRef(null);
  const userEmail = user?.user?.email || user?.email || "";
  const book = useMemo(() => {
    void refreshVersion;
    return getBookById(id);
  }, [id, refreshVersion]);
  const borrowRequests = useMemo(
    () => {
      void refreshVersion;
      return getBorrowRequestsByBorrower(userEmail);
    },
    [userEmail, refreshVersion]
  );

  const clearQueuedAction = () => {
    if (queuedActionRef.current) {
      clearTimeout(queuedActionRef.current);
      queuedActionRef.current = null;
    }
  };

  const queueAction = (callback, delay = 500) => {
    clearQueuedAction();
    queuedActionRef.current = setTimeout(() => {
      queuedActionRef.current = null;
      callback();
    }, delay);
  };

  const refresh = () => {
    setRefreshVersion((current) => current + 1);
  };

  useEffect(() => () => {
    clearQueuedAction();
  }, []);

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

  // Thesis items require the permission-code modal flow.
  const isThesis = String(book.category || "").toLowerCase() === "thesis";

  const pendingRequest = borrowRequests.find(
    (request) => request.bookId === book.id && request.status === "pending"
  );

  const submitBorrow = (code = "", handlers = {}) => {
    const { onError, onSuccess } = handlers;
    if (!user) return;
    showInfo("Processing borrow request, please wait...");
    queueAction(() => {
      const result = borrowBook(book.id, userEmail, code);
      if (!result.ok) {
        showError(result.error);
        if (onError) onError(result);
        return;
      }

      showSuccess("Pending. Please pick it up at the library.");
      refresh();
      if (onSuccess) onSuccess(result);
    }, 500);
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
    submitBorrow(permissionCode, {
      onError: (result) => {
        setPermissionError(result?.error || "Unable to apply for this thesis.");
      },
      onSuccess: () => {
        setIsPermissionModalOpen(false);
        setPermissionCode("");
        setPermissionError("");
      }
    });
  };

  const handleCancelPendingRequest = () => {
    if (!user || !pendingRequest) return;
    showInfo("Cancelling borrow request, please wait...");
    // LOGIC: Mirror borrow/return delay pattern so all borrower mutations
    // have uniform processing feedback and transition timing.
    queueAction(() => {
      const result = cancelBorrowRequest(pendingRequest.id, userEmail);
      if (!result.ok) {
        showError(result.error || "Unable to cancel borrow request.");
        return;
      }

      showSuccess("Borrow request cancelled.");
      setIsCancelModalOpen(false);
      refresh();
    }, 500);
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
            <button className="btn btn--return" disabled>
              Borrowed
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
