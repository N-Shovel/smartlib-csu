// Purpose: Displays a single book with availability and quick actions.
// Parts: metadata display, status tags, borrow/return/details actions.
const BookCard = ({
	book,
	canBorrow,
	canReturn,
	onBorrow,
	onReturn,
	onOpenDetails,
	showBorrower = false
}) => {
	// Thesis entries use "Apply" wording and a permission flow instead of plain borrow.
	const isThesis = String(book.category || "").toLowerCase() === "thesis";
	const MAX_DESCRIPTION_CHARS = 95;
	const descriptionText = String(book.description || "").trim();
	// Keep cards compact by truncating long descriptions.
	const previewDescription =
		descriptionText.length > MAX_DESCRIPTION_CHARS
			? `${descriptionText.slice(0, MAX_DESCRIPTION_CHARS).trimEnd()}...`
			: descriptionText;

	return (
		<article className="card book-card">
			<div className="book-card__header">
				<h3>{book.title}</h3>
				<span className={`status ${book.available ? "status--ok" : "status--busy"}`}>
					{book.available ? "Available" : "Borrowed"}
				</span>
			</div>
			{book.category ? <p className="book-card__category">{book.category}</p> : null}
			<p className="muted">{book.author}</p>
			{previewDescription ? <p className="book-card__desc">{previewDescription}</p> : null}
			{showBorrower && !book.available && book.borrowedBy ? (
				<p className="micro">Borrowed by {book.borrowedBy}</p>
			) : null}
			<div className="book-card__actions">
				{/* Details are always available regardless of borrow state. */}
				<button className="btn btn--ghost" onClick={() => onOpenDetails(book)}>
					{isThesis ? "Detail" : "Details"}
				</button>
				{/* Primary action toggles between borrow/apply and return based on availability. */}
				{book.available ? (
					<button
						className="btn btn--primary"
						onClick={() => onBorrow(book)}
						disabled={!canBorrow}
					>
						{isThesis ? "Apply" : "Borrow"}
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
