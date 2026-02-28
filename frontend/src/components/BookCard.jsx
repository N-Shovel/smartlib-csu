// Purpose: Displays a single book with availability and quick actions.
// Parts: metadata display, status tags, borrow/return/details actions.
const BookCard = ({
	book,
	canBorrow,
	canReturn,
	onBorrow,
	onReturn,
	onOpenDetails,
	borrowLabel,
	isPending = false,
	pendingMessage,
	showBorrower = false
}) => {
	// Thesis entries use "Apply" wording and a permission flow instead of plain borrow.
	const isThesis = String(book.category || "").toLowerCase() === "thesis";
	const isMobileViewport =
		typeof window !== "undefined" && window.matchMedia("(max-width: 900px)").matches;
	const MAX_TITLE_CHARS = isMobileViewport ? 46 : 80;
	const MAX_DESCRIPTION_CHARS = isMobileViewport ? 66 : 95;
	const titleText = String(book.title || "").trim();
	const previewTitle =
		titleText.length > MAX_TITLE_CHARS
			? `${titleText.slice(0, MAX_TITLE_CHARS).trimEnd()}...`
			: titleText;
	const descriptionText = String(book.description || "").trim();
	// Keep cards compact by truncating long descriptions.
	const previewDescription =
		descriptionText.length > MAX_DESCRIPTION_CHARS
			? `${descriptionText.slice(0, MAX_DESCRIPTION_CHARS).trimEnd()}...`
			: descriptionText;

	return (
		<article className="card book-card">
			<div className="book-card__header">
				<h3 title={book.title}>{previewTitle}</h3>
				<span
					className={`status status--desktop ${book.available ? "status--ok" : "status--busy"}`}
				>
					{book.available ? "Available" : "Borrowed"}
				</span>
			</div>
			{book.category ? <p className="book-card__category">{book.category}</p> : null}
			<p className="muted book-card__author">{book.author}</p>
			{Array.isArray(book.keywords) && book.keywords.length > 0 ? (
				<p className="micro">Keywords: {book.keywords.join(", ")}</p>
			) : null}
			{previewDescription ? <p className="book-card__desc">{previewDescription}</p> : null}
			{showBorrower && !book.available && book.borrowedBy ? (
				<p className="micro">Borrowed by {book.borrowedBy}</p>
			) : null}
			<span className={`status status--mobile ${book.available ? "status--ok" : "status--busy"}`}>
				{book.available ? "Available" : "Borrowed"}
			</span>
			<div className="book-card__actions">
				{/* Details are always available regardless of borrow state. */}
				<button className="btn btn--info" onClick={() => onOpenDetails(book)}>
					{isThesis ? "Detail" : "Details"}
				</button>
				{/* Primary action toggles between borrow/apply and return based on availability. */}
				{book.available ? (
					<button
						className={`btn ${isPending ? "btn--view" : "btn--primary"}`}
						onClick={() => onBorrow(book)}
						disabled={!canBorrow && !isPending}
					>
						{borrowLabel || (isThesis ? "Apply" : "Borrow")}
					</button>
				) : (
					<button
						className="btn btn--return"
						onClick={() => onReturn(book.id)}
						disabled={!canReturn}
					>
						Return
					</button>
				)}
			</div>
			{isPending && pendingMessage ? <p className="micro">{pendingMessage}</p> : null}
		</article>
	);
};

export default BookCard;
