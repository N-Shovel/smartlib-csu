import { useEffect, useState } from "react";
import {useRequest} from "../store/useRequestsStore"
import { Loader2Icon } from "lucide-react";

const normalizeKeywords = (keywords) => {
	if (Array.isArray(keywords)) {
		return keywords
			.map((keyword) => String(keyword || "").trim())
			.filter(Boolean);
	}

	if (typeof keywords === "string") {
		return keywords
			.split(",")
			.map((keyword) => keyword.trim())
			.filter(Boolean);
	}

	return [];
};

const normalizeCategories = (category, itemType) => {
	if (Array.isArray(category)) {
		const tokens = category
			.map((entry) => String(entry || "").trim())
			.filter(Boolean);

		if (tokens.length > 0) return tokens;
	}

	if (typeof category === "string") {
		const tokens = category
			.split(",")
			.map((entry) => entry.trim())
			.filter(Boolean);

		if (tokens.length > 0) return tokens;
	}

	if (itemType) {
		return [String(itemType).trim()];
	}

	return [];
};

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
    
    const {loading} =useRequest();

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
	const keywordTokens = normalizeKeywords(book.keywords);
	const categoryTokens = normalizeCategories(book.category, book.item_type);

	return (
		<article className="card book-card">
			<div className="book-card__content">
				<div className="book-card__header">
					<h3 title={book.title} className="book-card__title-row">
						<strong className="book-card__label">Title:</strong> <span>{previewTitle}</span>
					</h3>
					<span
						className={`status status--desktop ${book.is_available ? "status--ok" : "status--busy"}`}
					>
						{book.is_available ? "Available" : "Borrowed"}
					</span>
				</div>
				<p className="book-card__field book-card__author">
					<strong className="book-card__label">Author:</strong> <span>{book.author || "N/A"}</span>
				</p>
				<div className="book-card__field">
					<strong className="book-card__label">Keywords:</strong>
					{keywordTokens.length > 0 ? (
						<div className="book-card__keyword-list" aria-label="Book keywords">
							{keywordTokens.map((keyword) => (
								<span key={keyword} className="book-card__keyword-chip">{keyword}</span>
							))}
						</div>
					) : (
						<span className="muted"> N/A</span>
					)}
				</div>
				{categoryTokens.length > 0 ? (
					<div className="book-card__field book-card__category-line">
						<strong className="book-card__label">Category:</strong>
						<div className="book-card__keyword-list" aria-label="Book categories">
							{categoryTokens.map((category) => (
								<span key={category} className="book-card__keyword-chip">{category}</span>
							))}
						</div>
					</div>
				) : null}
				{descriptionText ? (
					<p className="book-card__field book-card__desc">
						<strong className="book-card__label">Description:</strong> <span>{descriptionText}</span>
					</p>
				) : null}
				{showBorrower && !book.is_available && book.borrowedBy ? (
					<p className="micro">Borrowed by {book.borrowedBy}</p>
				) : null}
				<span className={`status status--mobile ${book.is_available ? "status--ok" : "status--busy"}`}>
					{book.is_available ? "Available" : "Borrowed"}
				</span>
			</div>
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
						disabled={isProcessing || isPending || (!canBorrow && !isPending)}
					>
						{borrowLabel || (isThesis ? "Apply" : "Borrow") || (loading?? <Loader2Icon className="flex justify-center items-center animate-spin"/>)}
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
