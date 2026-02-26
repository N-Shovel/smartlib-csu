const BookDetailsModal = ({ isOpen, book, onClose }) => {
  if (!isOpen || !book) return null;

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true">
      <div className="card modal-card modal-card--book-details">
        <h3>{book.title}</h3>
        {book.category ? <p className="detail-card__category">{book.category}</p> : null}
        <p className="muted">{book.author}</p>
        <p className="detail-card__desc">{book.description}</p>
        <button className="btn btn--primary" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
};

export default BookDetailsModal;
