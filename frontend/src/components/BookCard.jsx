import { useEffect, useState } from "react";

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
	returnLabel = "Return",
	isPending = false,
	pendingMessage,
	returnMessage,
	isProcessing = false,
	showBorrower = false
}) => {
	// Thesis entries use "Apply" wording and a permission flow instead of plain borrow.
	const isThesis = String(book.item_type || "").toLowerCase() === "thesis";
	const [isMobileViewport, setIsMobileViewport] = useState(false);

	useEffect(() => {
		if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
			return undefined;
		}

		const mediaQuery = window.matchMedia("(max-width: 900px)");
		const updateViewport = () => {
			setIsMobileViewport(mediaQuery.matches);
		};

		updateViewport();
		if (typeof mediaQuery.addEventListener === "function") {
			mediaQuery.addEventListener("change", updateViewport);
			return () => mediaQuery.removeEventListener("change", updateViewport);
		}

		mediaQuery.addListener(updateViewport);
		return () => mediaQuery.removeListener(updateViewport);
	}, []);

	const MAX_TITLE_CHARS = isMobileViewport ? 46 : 80;
	const titleText = String(book.title || "").trim();
	const previewTitle =
		titleText.length > MAX_TITLE_CHARS
			? `${titleText.slice(0, MAX_TITLE_CHARS).trimEnd()}...`
			: titleText;
	const descriptionText = String(book.description || "").trim();

	return (
		<article className="card book-card">
			<div className="book-card__header">
				<h3 title={book.title}>{previewTitle}</h3>
				<span
					className={`status status--desktop ${book.is_available ? "status--ok" : "status--busy"}`}
				>
					{book.is_available ? "Available" : "Borrowed"}
				</span>
			</div>
			{book.category ? <p className="book-card__category">{book.category}</p> : null}
			<p className="muted book-card__author">{book.author}</p>
			{Array.isArray(book.keywords) && book.keywords.length > 0 ? (
				<p className="micro">Keywords: {book.keywords.join(", ")}</p>
			) : null}
			{descriptionText ? <p className="book-card__desc">{descriptionText}</p> : null}
			{showBorrower && !book.is_available && book.borrowedBy ? (
				<p className="micro">Borrowed by {book.borrowedBy}</p>
			) : null}
			<span className={`status status--mobile ${book.is_available ? "status--ok" : "status--busy"}`}>
				{book.is_available ? "Available" : "Borrowed"}
			</span>
			<div className="book-card__actions">
				{/* Details are always available regardless of borrow state. */}
				<button className="btn btn--info" onClick={() => onOpenDetails(book)}>
					{isThesis ? "Detail" : "Details"}
				</button>
				{/* Primary action toggles between borrow/apply and return based on availability. */}
				{book.is_available ? (
					<button
						className={`btn ${isPending ? "btn--view" : "btn--primary"}`}
						onClick={() => onBorrow(book)}
						disabled={isProcessing || (!canBorrow && !isPending)}
					>
						{borrowLabel || (isThesis ? "Apply" : "Borrow")}
					</button>
				) : (
					<button
						className="btn btn--return"
						onClick={() => onReturn(book.id)}
						disabled={isProcessing || !canReturn}
					>
						{returnLabel}
					</button>
				)}
			</div>
			{isPending && pendingMessage ? <p className="micro">{pendingMessage}</p> : null}
			{!book.is_available && returnMessage ? <p className="micro">{returnMessage}</p> : null}
		</article>
	);
};

export default BookCard;
