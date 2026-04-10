import { useEffect, useState } from "react";

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

const getItemCapacity = (itemType) => {
	return String(itemType || "").toLowerCase() === "thesis" ? 1 : 3;
};

const resolveBookAvailability = (book) => {
	const totalCopies = getItemCapacity(book.item_type);
	const dbTotalCopies = Number(book.total_copies);
	const effectiveTotalCopies = Number.isInteger(dbTotalCopies) && dbTotalCopies > 0
		? dbTotalCopies
		: totalCopies;

	const dbAvailableCopies = Number(book.available_copies);
	const effectiveAvailableCopies = Number.isInteger(dbAvailableCopies)
		? Math.min(Math.max(dbAvailableCopies, 0), effectiveTotalCopies)
		: (book.is_available ? effectiveTotalCopies : 0);

	return {
		totalCopies: effectiveTotalCopies,
		availableCopies: effectiveAvailableCopies,
	};
};

const getDisplayAvailability = (book) => {
	const { availableCopies, totalCopies } = resolveBookAvailability(book);
	return `${availableCopies}/${totalCopies}`;
};

// Purpose: Displays a single book with availability and quick actions.
// Parts: metadata display, status tags, borrow/return/details actions.
const BookCard = ({
	book,
	canBorrow,
	onBorrow,
	onOpenDetails,
	borrowLabel,
	isPending = false,
	pendingMessage,
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
	const keywordTokens = normalizeKeywords(book.keywords);
	const categoryTokens = normalizeCategories(book.category, book.item_type);
	const keywordsLine = keywordTokens.join(", ");
	const displayCategory =
		String(book.item_type || categoryTokens[0] || "").trim().toLowerCase() || "n/a";
	const displayAvailability = getDisplayAvailability(book);
	const { availableCopies } = resolveBookAvailability(book);
	const isBookAvailable = availableCopies > 0;

	return (
		<article className="card book-card">
			<div className="book-card__content">
				<div className="book-card__header">
					<h3 title={book.title} className="book-card__title-row">
						<strong className="book-card__label">Title:</strong> <span>{previewTitle}</span>
					</h3>
					<span
						className={`book-card__stock-badge ${isBookAvailable ? "book-card__stock-badge--ok" : "book-card__stock-badge--busy"}`}
					>
						{displayAvailability}
					</span>
				</div>
				<p className="book-card__field book-card__author">
					<strong className="book-card__label">Author:</strong> <span>{book.author || "N/A"}</span>
				</p>
				<p className="book-card__field book-card__keywords-line" title={keywordsLine || "N/A"}>
					<strong className="book-card__label">Keywords:</strong> <span>{keywordsLine || "N/A"}</span>
				</p>
				<p className="book-card__field book-card__category-line">{displayCategory}</p>
				<p className="book-card__field book-card__desc">
					<strong className="book-card__label">Description:</strong> <span>{descriptionText || "N/A"}</span>
				</p>
				{showBorrower && !isBookAvailable && book.borrowedBy ? (
					<p className="micro">Borrowed by {book.borrowedBy}</p>
				) : null}
			</div>
			<div className="book-card__actions">
				{/* Details are always available regardless of borrow state. */}
				<button className="btn btn--info" onClick={() => onOpenDetails(book)}>
					{isThesis ? "Detail" : "Details"}
				</button>
				{/* Primary action toggles between borrow/apply and return based on availability. */}
				{isBookAvailable ? (
					<button
						className={`btn ${isPending ? "btn--view" : "btn--primary"}`}
						onClick={() => onBorrow(book)}
						disabled={isProcessing || isPending || (!canBorrow && !isPending)}
					>
						{borrowLabel || (isThesis ? "Apply" : "Borrow")}
					</button>
				) : (
					<button
						className="btn btn--return"
						disabled
					>
						Borrowed
					</button>
				)}
			</div>
			{isPending && pendingMessage ? <p className="micro">{pendingMessage}</p> : null}
		</article>
	);
};

export default BookCard;
