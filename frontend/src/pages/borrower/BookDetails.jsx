// Purpose: Detailed single-book page with borrower actions.
// Parts: selected book state, borrow/return handlers, thesis flow, detail render.
import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";

import ThesisPermissionModal from "../../components/ThesisPermissionModal";
import { showError, showInfo, showSuccess } from "../../utils/notification";
import { useStore } from "../../store/useAuthStore";
import useItems from "../../store/useItemsStore";
import { useRequest } from "../../store/useRequestsStore";

const BookDetails = () => {
  const { id } = useParams();
  const { user } = useStore();
  const { books, fetchBooks } = useItems();
  const { itemRequests, fetchHistory, sendRequest, cancelBorrowRequest } = useRequest();
  const [isPermissionModalOpen, setIsPermissionModalOpen] = useState(false);
  const [permissionCode, setPermissionCode] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const queuedActionRef = useRef(null);

  const currentUserId = user?.profile?.user_id || user?.user?.id || null;

  useEffect(() => {
    fetchBooks();
    fetchHistory();
  }, [fetchBooks, fetchHistory, refreshVersion]);

  const book = useMemo(() => {
    return books.find((entry) => String(entry.id) === String(id)) || null;
  }, [books, id]);

  const borrowRequests = useMemo(() => {
    return (itemRequests || []).filter((request) => request.student_user_id === currentUserId);
  }, [currentUserId, itemRequests]);

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

  const isThesis = String(book.item_type || book.category || "").toLowerCase() === "thesis";
  const isBookAvailable = Number(book.available_copies) > 0 || book.is_available !== false;

  const pendingRequest = borrowRequests.find(
    (request) => String(request.library_item_id || request.bookId || "") === String(book.id) && request.status === "pending"
  );

  const submitBorrow = (handlers = {}) => {
    const { onError, onSuccess } = handlers;
    if (!user) return;
    showInfo("Processing borrow request, please wait...");

    queueAction(() => {
      sendRequest(book.title, book.item_type || book.category, book.id)
        .then((result) => {
          showSuccess(result?.data?.message || "Pending. Please pick it up at the library.");
          setIsPermissionModalOpen(false);
          setPermissionCode("");
          setPermissionError("");
          refresh();
          if (onSuccess) onSuccess(result);
        })
        .catch((error) => {
          const message = error?.response?.data?.message || error?.message || "Unable to send borrow request.";
          showError(message);
          if (onError) onError({ ok: false, error: message });
        });
    }, 500);
  };

  const handleBorrow = () => {
    if (!user) return;
    if (pendingRequest) {
      setIsCancelModalOpen(true);
      return;
    }

    if (isThesis) {
      setIsPermissionModalOpen(true);
      setPermissionCode("");
      setPermissionError("");
      return;
    }

    submitBorrow();
  };

  const handleThesisApply = () => {
    submitBorrow({
      onError: (result) => {
        setPermissionError(result?.error || "Unable to apply for this thesis.");
      },
      onSuccess: () => {
        setIsPermissionModalOpen(false);
        setPermissionCode("");
        setPermissionError("");
      },
    });
  };

  const handleCancelPendingRequest = () => {
    if (!user || !pendingRequest) return;
    showInfo("Cancelling borrow request, please wait...");

    queueAction(() => {
      cancelBorrowRequest(pendingRequest.id)
        .then((result) => {
          if (!result.ok) {
            showError(result.error || "Unable to cancel borrow request.");
            return;
          }

          showSuccess("Borrow request cancelled.");
          setIsCancelModalOpen(false);
          refresh();
        })
        .catch((error) => {
          showError(error?.message || "Unable to cancel borrow request.");
        });
    }, 500);
  };

  return (
    <section className="detail-card">
      <div>
        <h2>{book.title}</h2>
        {book.item_type || book.category ? <p className="detail-card__category">{book.item_type || book.category}</p> : null}
        <p className="muted">{book.author}</p>
        {Array.isArray(book.keywords) && book.keywords.length > 0 ? (
          <p className="micro">Keywords: {book.keywords.join(", ")}</p>
        ) : null}
        <p className="detail-card__desc">{book.description}</p>
      </div>
      <div className="detail-card__meta">
        <span className={`status ${isBookAvailable ? "status--ok" : "status--busy"}`}>
          {isBookAvailable ? "Available" : "Borrowed"}
        </span>
        <div className="detail-card__actions">
          {isBookAvailable ? (
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
              <button className="btn btn--danger btn--cancel" onClick={handleCancelPendingRequest}>
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
