
import { useEffect, useMemo, useState, useCallback } from "react";
import { Search } from "lucide-react";
import BookCard from "../../components/BookCard";
import BookDetailsModal from "../../components/BookDetailsModal";
import ThesisPermissionModal from "../../components/ThesisPermissionModal";
import {
    requestBookReturn,
    getBorrowHistory,
    getBorrowRequestsByBorrower,
    cancelBorrowRequest,
} from "../../services/bookService";
import { showError, showInfo, showSuccess } from "../../utils/notification";
import { useStore } from "../../store/useAuthStore";
import useItems from "../../store/useItemsStore";
import { useRequest } from "../../store/useRequestsStore";

const BrowseBooks = () => {
    const { user } = useStore();
    const { books, fetchBooks } = useItems();
    const { sendRequest, loading } = useRequest();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null); // null | "general" | "thesis"

    const [pendingThesisBookId, setPendingThesisBookId] = useState(null);
    const [permissionCode, setPermissionCode] = useState("");
    const [permissionError, setPermissionError] = useState("");

    const [selectedBook, setSelectedBook] = useState(null);

    const [borrowRequests, setBorrowRequests] = useState([]);
    const [requestToCancel, setRequestToCancel] = useState(null);
    const [borrowHistory, setBorrowHistory] = useState([]);

    const [processingById, setProcessingById] = useState({});
    const [borrowHistoryVersion, setBorrowHistoryVersion] = useState(0);

    const isProcessing = (id) => Boolean(processingById[id]);

    const markProcessing = (id, next) => {
        setProcessingById((current) => {
            if (next) return { ...current, [id]: true };
            const { [id]: _removed, ...rest } = current;
            return rest;
        });
    };

    const loadBorrowRequests = useCallback(async () => {
        if (!user?.email) {
            setBorrowRequests([]);
            return;
        }

        try {
            const result = await getBorrowRequestsByBorrower(user.email);

            // Some services return array directly, some wrap in { ok, data }.
            if (Array.isArray(result)) {
                setBorrowRequests(result);
                return;
            }
            if (result?.ok && Array.isArray(result.data)) {
                setBorrowRequests(result.data);
                return;
            }

            setBorrowRequests([]);
        } catch (e) {
            setBorrowRequests([]);
            showError(e?.message || "Unable to load borrow requests.");
        }
    }, [user?.email]);

    const loadBorrowHistory = useCallback(async () => {
        try {
            const result = await getBorrowHistory();

            if (Array.isArray(result)) {
                setBorrowHistory(result);
                return;
            }
            if (result?.data && Array.isArray(result.data)) {
                setBorrowHistory(result.data);
                return;
            }

            setBorrowHistory([]);
        } catch (e) {
            console.error("Error loading borrow history:", e);
            setBorrowHistory([]);
        }
    }, []);

    const refresh = useCallback(async () => {
        await loadBorrowRequests();
        await loadBorrowHistory();
        setBorrowHistoryVersion((current) => current + 1);
    }, [loadBorrowRequests, loadBorrowHistory]);

    useEffect(() => {
        fetchBooks();
    }, [fetchBooks]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    const filteredBooks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();
        if (!query) return books;

        return books.filter((book) =>
            [book.title, book.author, book.category, ...(book.keywords || [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [books, searchQuery]);

    const regularBooks = useMemo(() => {
        return filteredBooks.filter((book) => String(book.item_type || "").toLowerCase() !== "thesis");
    }, [filteredBooks]);

    const thesisBooks = useMemo(() => {
        return filteredBooks.filter((book) => String(book.item_type || "").toLowerCase() === "thesis");
    }, [filteredBooks]);

    const pendingRequestByBookId = useMemo(() => {
        const pendingMap = new Map();
        borrowRequests.forEach((request) => {
            if (request.status === "pending") pendingMap.set(request.bookId, request);
        });
        return pendingMap;
    }, [borrowRequests]);

    const pendingReturnRequestByBookId = useMemo(() => {
        const pendingMap = new Map();
        borrowRequests.forEach((request) => {
            if (request.status === "pending_return") pendingMap.set(request.bookId, request);
        });
        return pendingMap;
    }, [borrowRequests]);

    // NOTE:
    // Your book objects (from the array you posted) do NOT include `borrowedBy`,
    // so we compute “what the current user borrowed” from borrow history.
    const borrowedByUserBookIds = useMemo(() => {
        if (!user?.email) return new Set();

        const set = new Set();

        borrowHistory.forEach((entry) => {
            const action = String(entry.action || "").toUpperCase();
            const borrower = String(entry.borrowerEmail || entry.email || "").toLowerCase();

            if (action === "BORROW_BOOK" && borrower === user.email.toLowerCase() && entry.bookId) {
                set.add(entry.bookId);
            }
        });

        return set;
    }, [user?.email, borrowHistory]);

    const recommendedBooksLine = useMemo(() => {
        const borrowCountByTitle = borrowHistory.reduce((summary, entry) => {
            if (String(entry.action || "").toUpperCase() !== "BORROW_BOOK") return summary;

            const title = String(entry.title || "").trim();
            if (!title) return summary;

            summary[title] = (summary[title] || 0) + 1;
            return summary;
        }, {});

        const topTitles = Object.entries(borrowCountByTitle)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([title]) => title);

        if (topTitles.length > 0) return topTitles.join(", ");

        return books
            .filter((book) => book.is_available)
            .slice(0, 3)
            .map((book) => book.title)
            .join(", ");
    }, [books, borrowHistory]);

    const submitBorrow = async (id, code = "", handlers = {}) => {
        const { onError, onSuccess } = handlers;

        if (!user?.user?.email) return;
        if (isProcessing(id)) return;

        markProcessing(id, true);
        showInfo("Processing borrow request, please wait...");

        try {
            // Find the book to get its title
            const book = books.find((b) => b.id === id);
            if (!book) {
                throw new Error("Book not found");
            }
            console.log(book.title);
            console.log(book.item_type);
            // Use the sendRequest function from useRequest store
            await sendRequest(book.title, book.item_type, id);

            // Give time for success message to show before refresh
            await new Promise(resolve => setTimeout(resolve, 500));
            await refresh();
        } catch (e) {
            const errorMsg = e?.response?.data?.message || e?.message || "Unable to borrow book.";
            if (onError) onError({ ok: false, error: errorMsg });
        } finally {
            markProcessing(id, false);
        }
    };

    const handleBorrow = (book) => {

        const pendingRequest = pendingRequestByBookId.get(book.id);

        if (pendingRequest) {
            setRequestToCancel(pendingRequest);
            return;
        }


        const isThesis = String(book.item_type || "").toLowerCase() === "thesis";
        if (isThesis) {
            setPendingThesisBookId(book.id);
            setPermissionCode("");
            setPermissionError("");
            return;
        }
        

        submitBorrow(book.id);
    };

    const handleThesisApply = () => {
        if (!pendingThesisBookId) return;

        submitBorrow(pendingThesisBookId, permissionCode, {
            onError: (result) => {
                setPermissionError(result?.error || "Unable to apply for this thesis.");
            },
            onSuccess: () => {
                setPendingThesisBookId(null);
                setPermissionCode("");
                setPermissionError("");
            },
        });
    };

    const handleReturn = async (bookId) => {
        if (!user?.email) return;
        if (isProcessing(bookId)) return;

        //  Prevent returning books you didn’t borrow
        if (!borrowedByUserBookIds.has(bookId)) {
            showError("You can only return books you borrowed.");
            return;
        }

        if (pendingReturnRequestByBookId.has(bookId)) {
            showInfo("Return request is already pending.");
            return;
        }

        markProcessing(bookId, true);
        showInfo("Submitting return request, please wait...");

        try {
            showSuccess("Return request submitted. Please wait for staff confirmation.");
            await refresh();
        } catch (e) {
            const errorMsg = e?.response?.data?.message || e?.message || "Unable to request return.";
            showError(errorMsg);
        } finally {
            markProcessing(bookId, false);
        }
    };

    const handleCancelPendingRequest = async () => {
        if (!requestToCancel || !user?.email) return;

        const bookId = requestToCancel.bookId;
        if (isProcessing(bookId)) return;

        markProcessing(bookId, true);
        showInfo("Cancelling borrow request, please wait...");

        try {
            await cancelBorrowRequest(requestToCancel.id, user.email);

            showSuccess("Borrow request cancelled.");
            setRequestToCancel(null);
            await refresh();
        } catch (e) {
            const errorMsg = e?.response?.data?.message || e?.message || "Unable to cancel borrow request.";
            showError(errorMsg);
        } finally {
            markProcessing(bookId, false);
        }
    };

    const handleCategoryToggle = (category) => {
        setSelectedCategory((current) => (current === category ? null : category));
    };

    const renderBookGrid = (list) => (
        <div className="book-grid">
            {list.map((book) => {
                const bookId = book.id;
                const hasPendingBorrow = pendingRequestByBookId.has(bookId);
                const hasPendingReturn = pendingReturnRequestByBookId.has(bookId);

                return (
                    <BookCard
                        key={bookId}
                        book={book}
                        isProcessing={isProcessing(bookId)}
                        canBorrow={Boolean(book.is_available)}
                        isPending={hasPendingBorrow}
                        borrowLabel={hasPendingBorrow ? "Pending" : undefined}
                        pendingMessage={hasPendingBorrow ? "Please pick it up at the library." : undefined}
                        returnLabel={hasPendingReturn ? "Pending Return" : "Return"}
                        returnMessage={hasPendingReturn ? "Waiting for staff confirmation." : undefined}
                        canReturn={!book.is_available && borrowedByUserBookIds.has(bookId) && !hasPendingReturn}
                        onBorrow={handleBorrow}
                        onReturn={handleReturn}
                        onOpenDetails={setSelectedBook}
                    />
                );
            })}
        </div>
    );

    return (
        <section className="browse-books-page">
            <div className="page-header">
                <div>
                    <h2>Browse Books</h2>
                    <p className="muted">Pick a title and borrow instantly.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "1rem" }}>
                <p>
                    <strong>Recommended Books:</strong>{" "}
                    {recommendedBooksLine || "No recommendations available yet."}
                </p>
            </div>

            <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="search-input-wrapper">
                    <Search className="search-input-icon" size={18} aria-hidden="true" />
                    <input
                        className="input search-input"
                        type="search"
                        aria-label="Search books by title, author, or category"
                        placeholder="Search by title, author, or category"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <div className="book-category-filter" role="group" aria-label="Book category filter">
                    <button
                        type="button"
                        aria-pressed={selectedCategory === "general"}
                        className={`btn btn--ghost${
selectedCategory === "general" ? " book-category-filter__btn--active" : ""
}`}
                        onClick={() => handleCategoryToggle("general")}
                    >
                        {selectedCategory === "general" ? "✓ General Books" : "General Books"}
                    </button>

                    <button
                        type="button"
                        aria-pressed={selectedCategory === "thesis"}
                        className={`btn btn--ghost${
selectedCategory === "thesis" ? " book-category-filter__btn--active" : ""
}`}
                        onClick={() => handleCategoryToggle("thesis")}
                    >
                        {selectedCategory === "thesis" ? "✓ Thesis Books" : "Thesis Books"}
                    </button>
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <div className="empty-state">No books found for your search.</div>
            ) : null}

            {selectedCategory === null || selectedCategory === "general" ? renderBookGrid(regularBooks) : null}

            {selectedCategory === null && regularBooks.length > 0 && thesisBooks.length > 0 ? (
                <div className="book-section-separator" aria-hidden="true" />
            ) : null}

            {selectedCategory === null || selectedCategory === "thesis" ? renderBookGrid(thesisBooks) : null}

            <BookDetailsModal
                isOpen={Boolean(selectedBook)}
                book={selectedBook}
                onClose={() => setSelectedBook(null)}
            />

            <ThesisPermissionModal
                isOpen={Boolean(pendingThesisBookId)}
                code={permissionCode}
                error={permissionError}
                onCodeChange={(value) => {
                    setPermissionCode(value);
                    if (permissionError) setPermissionError("");
                }}
                onCancel={() => {
                    setPendingThesisBookId(null);
                    setPermissionCode("");
                    setPermissionError("");
                }}
                onSubmit={handleThesisApply}
            />

            {requestToCancel ? (
                <div className="modal-overlay" role="dialog" aria-modal="true">
                    <div className="card modal-card">
                        <h3>Cancel Pending Borrow Request</h3>
                        <p className="muted">Do you want to cancel this pending borrow request?</p>
                        <div className="modal-actions">
                            <button className="btn btn--ghost" onClick={() => setRequestToCancel(null)}>
                                Keep Pending
                            </button>
                            <button
                                className="btn btn--danger"
                                onClick={handleCancelPendingRequest}
                                disabled={isProcessing(requestToCancel.bookId)}
                            >
                                Cancel Request
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default BrowseBooks;
