import { useMemo, useState, useEffect } from "react";
import { Loader2Icon, LoaderIcon, Search, X } from "lucide-react";
import { showError, showSuccess } from "../../utils/notification";
import BookDetailsModal from "../../components/BookDetailsModal";
import useItems from "../../store/useItemsStore";

const INITIAL_FORM = {
    itemType: "book", // "book" | "thesis"
    title: "",
    author: "",
    description: "",
    keywords: "", // comma-separated string
    itemNumber: "",
};

const BookManagement = () => {
    const { books, fetchBooks, createItem, deleteItem, isLoading } = useItems();

    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState(null); // "book" | "thesis" | null
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [form, setForm] = useState(INITIAL_FORM);
    const [selectedBook, setSelectedBook] = useState(null);
    const [bookToDelete, setBookToDelete] = useState(null);

    useEffect(() => {
        fetchBooks();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const filteredBooks = useMemo(() => {
        const query = searchQuery.trim().toLowerCase();

        const byCategory =
            selectedCategory === null
                ? books
                : books.filter((book) => String(book.item_type || "").toLowerCase() === selectedCategory);

        if (!query) return byCategory;

        return byCategory.filter((book) =>
            [book.title, book.author, book.item_type, ...(book.keywords || [])]
            .filter(Boolean)
            .some((value) => String(value).toLowerCase().includes(query))
        );
    }, [books, searchQuery, selectedCategory]);

    const handleCategoryToggle = (category) => {
        setSelectedCategory((current) => (current === category ? null : category));
    };

    const handleDelete = (book) => setBookToDelete(book);

    const handleConfirmDelete = async () => {
        if (!bookToDelete?.id || isLoading) return;

        try {
            await deleteItem(bookToDelete.id);

            // close modal after deleting
            setBookToDelete(null);
            // If your store doesn't update `items` on delete, keep this:
        } catch (err) {
            showError(err?.message || "Failed to delete item.");
        }
    };

    const handleAddSubmit = async () => {
        if (!form.title.trim()) return showError("Title is required.");
        if (!form.author.trim()) return showError("Author is required.");

        const keywordsArray = String(form.keywords || "")
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);

        const payload = {
            itemType: form.itemType,
            title: form.title.trim(),
            author: form.author.trim(),
            description: form.description?.trim() || "",
            keywords: keywordsArray,
            itemNumber: form.itemNumber?.trim() || "",
        };

        try {
            await createItem(payload);
            
            setIsAddModalOpen(false);
            setForm(INITIAL_FORM);
            await fetchBooks();
        } catch (err) {
            showError(err?.message || "Failed to create item.");
        }
    };

    return (
        <section className="staff-book-management-page">
            <div className="page-header">
                <div>
                    <h2>Book Management</h2>
                    <p className="muted">Manage catalog books/theses, add new items, and remove entries.</p>
                </div>
            </div>

            <div className="card" style={{ marginBottom: "1rem" }}>
                <div className="search-input-wrapper">
                    <Search className="search-input-icon" size={18} aria-hidden="true" />
                    <input
                        className="input search-input"
                        type="search"
                        placeholder="Search by title/author/type/keywords"
                        value={searchQuery}
                        onChange={(event) => setSearchQuery(event.target.value)}
                    />
                </div>

                <div className="book-category-filter" role="group" aria-label="Item type filter">
                    <button
                        type="button"
                        aria-pressed={selectedCategory === "book"}
                        className={`btn btn--ghost${
selectedCategory === "book" ? " book-category-filter__btn--active" : ""
}`}
                        onClick={() => handleCategoryToggle("book")}
                    >
                        {selectedCategory === "book" ? "✓ Books" : "Books"}
                    </button>

                    <button
                        type="button"
                        aria-pressed={selectedCategory === "thesis"}
                        className={`btn btn--ghost${
selectedCategory === "thesis" ? " book-category-filter__btn--active" : ""
}`}
                        onClick={() => handleCategoryToggle("thesis")}
                    >
                        {selectedCategory === "thesis" ? "✓ Thesis" : "Thesis"}
                    </button>

                    <button type="button" className="btn btn--primary" onClick={() => setIsAddModalOpen(true)}>
                        Add
                    </button>

                </div>
            </div>

            {isLoading ? (
                <div className="card" style={{ display: "flex", justifyContent: "center", padding: "2rem" }}>
                    <Loader2Icon className="size-6 animate-spin" aria-label="Loading books" />
                </div>
            ) : filteredBooks.length === 0 ? (
                    <div className="empty-state">No items found.</div>
                ) : (
                        <div className="book-grid">
                            {filteredBooks.map((book) => (
                                <article className="card book-card" key={book.id}>
                                    <div className="book-card__header">
                                        <h3 title={book.title}>{book.title}</h3>
                                        <button
                                            className="book-management-delete-btn"
                                            onClick={() => handleDelete(book)}
                                            aria-label={`Delete ${book.title}`}
                                            disabled={isLoading}
                                        >
                                            <X size={14} strokeWidth={2.6} aria-hidden="true" />
                                        </button>
                                    </div>

                                    {book.item_type ? <p className="book-card__category">{book.item_type}</p> : null}
                                    {book.author ? <p className="muted book-card__author">{book.author}</p> : null}

                                    {Array.isArray(book.keywords) && book.keywords.length > 0 ? (
                                        <p className="micro">Keywords: {book.keywords.join(", ")}</p>
                                    ) : null}

                                    <p className="book-card__desc">{book.description}</p>

                                    <div className="book-card__actions">
                                        <button className="btn btn--info" onClick={() => setSelectedBook(book)} disabled={isLoading}>
                                            Details
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}

            <BookDetailsModal isOpen={Boolean(selectedBook)} book={selectedBook} onClose={() => setSelectedBook(null)} />

            {bookToDelete ? (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="delete-book-title">
                    <div className="card modal-card">
                        <h3 id="delete-book-title">Delete Item</h3>
                        <p className="muted">
                            Are you sure you want to delete <strong>{bookToDelete.title}</strong>?
                        </p>
                        <div className="modal-actions">
                            <button className="btn btn--ghost" onClick={() => setBookToDelete(null)} disabled={isLoading}>
                                No
                            </button>
                            <button className="btn btn--danger" onClick={handleConfirmDelete} disabled={isLoading}>
                                {isLoading ? (
                                    <LoaderIcon className="size-5 flex justify-center items-center animate-spin" />
                                ) : (
                                        "Yes, Delete"
                                    )}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

            {isAddModalOpen ? (
                <div className="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="add-book-title">
                    <div className="card modal-card modal-card--book-management">
                        <h3 id="add-book-title">Add Item</h3>

                        <label className="label">Type</label>
                        <select
                            className="select"
                            value={form.itemType}
                            onChange={(event) => setForm((c) => ({ ...c, itemType: event.target.value }))}
                            disabled={isLoading}
                        >
                            <option value="book">Book</option>
                            <option value="thesis">Thesis</option>
                        </select>

                        <label className="label">Title</label>
                        <input
                            className="input"
                            value={form.title}
                            onChange={(event) => setForm((c) => ({ ...c, title: event.target.value }))}
                            disabled={isLoading}
                        />

                        <label className="label">Author</label>
                        <input
                            className="input"
                            value={form.author}
                            onChange={(event) => setForm((c) => ({ ...c, author: event.target.value }))}
                            disabled={isLoading}
                        />

                        <label className="label">Item Number (optional)</label>
                        <input
                            className="input"
                            value={form.itemNumber}
                            onChange={(event) => setForm((c) => ({ ...c, itemNumber: event.target.value }))}
                            disabled={isLoading}
                        />

                        <label className="label">Description</label>
                        <textarea
                            className="input input--area"
                            value={form.description}
                            onChange={(event) => setForm((c) => ({ ...c, description: event.target.value }))}
                            disabled={isLoading}
                        />

                        <label className="label">Keywords (comma-separated)</label>
                        <input
                            className="input"
                            value={form.keywords}
                            onChange={(event) => setForm((c) => ({ ...c, keywords: event.target.value }))}
                            disabled={isLoading}
                        />

                        <div className="modal-actions">
                            <button
                                className="btn btn--danger"
                                onClick={() => {
                                    setIsAddModalOpen(false);
                                    setForm(INITIAL_FORM);
                                }}
                                disabled={isLoading}
                            >
                                Cancel
                            </button>
                            <button className="btn btn--primary" onClick={handleAddSubmit} disabled={isLoading}>
                                {isLoading ? <LoaderIcon className="flex items-center justify-center animate-spin" /> : "Add"}
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </section>
    );
};

export default BookManagement;
