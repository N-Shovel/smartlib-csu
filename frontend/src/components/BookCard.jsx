import { Link } from "react-router-dom";

const BookCard = ({ book, canBorrow, canReturn, onBorrow, onReturn, showBorrower = false }) => {
	return (
		<article className="card book-card">
			<div className="book-card__header">
				<h3>{book.title}</h3>
				<span className={`status ${book.available ? "status--ok" : "status--busy"}`}>
					{book.available ? "Available" : "Borrowed"}
				</span>
			</div>
			<p className="muted">{book.author}</p>
			<p className="book-card__desc">{book.description}</p>
			{showBorrower && !book.available && book.borrowedBy ? (
				<p className="micro">Borrowed by {book.borrowedBy}</p>
			) : null}
			<div className="book-card__actions">
				<Link className="btn btn--ghost" to={`/borrower/book/${book.id}`}>
					Details
				</Link>
				{book.available ? (
					<button
						className="btn btn--primary"
						onClick={() => onBorrow(book.id)}
						disabled={!canBorrow}
					>
						Borrow
					</button>
				) : (
					<button
						className="btn btn--ghost"
						onClick={() => onReturn(book.id)}
						disabled={!canReturn}
					>
						Return
					</button>
				)}
			</div>
		</article>
	);
};

export default BookCard;
