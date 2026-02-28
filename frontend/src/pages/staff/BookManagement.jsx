import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import { addBook, deleteBook, getBooks } from "../../services/bookService";
import { showError, showSuccess } from "../../utils/notification";
import BookDetailsModal from "../../components/BookDetailsModal";

const INITIAL_FORM = {
  title: "",
  author: "",
  category: "Book",
  description: "",
  keywords: ""
};

const BookManagement = () => {
  // Local UI state is seeded from service and refreshed after each mutation.
  const [books, setBooks] = useState(getBooks());
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedBook, setSelectedBook] = useState(null);
  const [bookToDelete, setBookToDelete] = useState(null);
  // Keep only the last reversible action to support one-step undo.
  const [lastAction, setLastAction] = useState(null);

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    // Category filter runs first, then text search refines the result set.
    const byCategory =
      selectedCategory === null
        ? books
        : books.filter(
            (book) => String(book.category || "").toLowerCase() === selectedCategory
          );

    if (!query) return byCategory;

    return byCategory.filter((book) =>
      [book.title, book.author, book.category, ...(book.keywords || [])]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [books, searchQuery, selectedCategory]);

  const refresh = () => setBooks(getBooks());

  const handleCategoryToggle = (category) => {
    setSelectedCategory((current) => (current === category ? null : category));
  };

  const handleDelete = (book) => {
    setBookToDelete(book);
  };

  const handleConfirmDelete = () => {
    if (!bookToDelete) return;

    const result = deleteBook(bookToDelete.id);
    if (!result.ok) {
      showError(result.error || "Unable to delete book.");
      return;
    }

    // Save deletion context so Undo can reconstruct the removed entry.
    showSuccess("Book deleted.");
    setLastAction({ type: "delete", book: bookToDelete });
    setBookToDelete(null);
    refresh();
  };

  const handleUndo = () => {
    if (!lastAction) return;

    // Undo add by deleting the recently created book.
    if (lastAction.type === "add") {
      const result = deleteBook(lastAction.book.id);
      if (!result.ok) {
        showError(result.error || "Unable to undo add action.");
        return;
      }
      showSuccess("Add action undone.");
      setLastAction(null);
      refresh();
      return;
    }

    // Undo delete by re-adding the removed book details.
    if (lastAction.type === "delete") {
      const result = addBook({
        title: lastAction.book.title,
        author: lastAction.book.author,
        category: lastAction.book.category,
        description: lastAction.book.description,
        keywords: lastAction.book.keywords || []
      });
      if (!result.ok) {
        showError(result.error || "Unable to undo delete action.");
        return;
      }
      showSuccess("Delete action undone.");
      setLastAction(null);
      refresh();
    }
  };

  const handleAddSubmit = () => {
    const result = addBook(form);
    if (!result.ok) {
      showError(result.error || "Unable to add book.");
      return;
    }

  // Save add context so user can rollback the creation in one click.
    showSuccess("Book added.");
    setLastAction({ type: "add", book: result.book });
    setIsAddModalOpen(false);
    setForm(INITIAL_FORM);
    refresh();
  };

  return (
    <section className="staff-book-management-page">
      <div className="page-header">
        <div>
          <h2>Book Management</h2>
          <p className="muted">Manage catalog books, add new books, and remove entries.</p>
        </div>
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
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="book-category-filter" role="group" aria-label="Book category filter">
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
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => setIsAddModalOpen(true)}
          >
            Add
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={handleUndo}
            disabled={!lastAction}
          >
            Undo
          </button>
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">No books found.</div>
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
                >
                  <X size={14} strokeWidth={2.6} aria-hidden="true" />
                </button>
              </div>
              {book.category ? <p className="book-card__category">{book.category}</p> : null}
              <p className="muted book-card__author">{book.author}</p>
              {Array.isArray(book.keywords) && book.keywords.length > 0 ? (
                <p className="micro">Keywords: {book.keywords.join(", ")}</p>
              ) : null}
              <p className="book-card__desc">{book.description}</p>
              <div className="book-card__actions">
                <button className="btn btn--info" onClick={() => setSelectedBook(book)}>
                  Details
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      <BookDetailsModal
        isOpen={Boolean(selectedBook)}
        book={selectedBook}
        onClose={() => setSelectedBook(null)}
      />

      {bookToDelete ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card modal-card">
            <h3>Delete Book</h3>
            <p className="muted">
              Are you sure you want to delete <strong>{bookToDelete.title}</strong>?
            </p>
            <div className="modal-actions">
              <button className="btn btn--ghost" onClick={() => setBookToDelete(null)}>
                No
              </button>
              <button className="btn btn--danger" onClick={handleConfirmDelete}>
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {isAddModalOpen ? (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="card modal-card modal-card--book-management">
            <h3>Add Book</h3>
            <label className="label">Title</label>
            <input
              className="input"
              value={form.title}
              onChange={(event) =>
                setForm((current) => ({ ...current, title: event.target.value }))
              }
            />

            <label className="label">Author</label>
            <input
              className="input"
              value={form.author}
              onChange={(event) =>
                setForm((current) => ({ ...current, author: event.target.value }))
              }
            />

            <label className="label">Category</label>
            <select
              className="select"
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({ ...current, category: event.target.value }))
              }
            >
              <option value="Book">Book</option>
              <option value="Thesis">Thesis</option>
            </select>

            <label className="label">Description</label>
            <textarea
              className="input input--area"
              value={form.description}
              onChange={(event) =>
                setForm((current) => ({ ...current, description: event.target.value }))
              }
            />

            <label className="label">Keywords (comma-separated)</label>
            <input
              className="input"
              value={form.keywords}
              onChange={(event) =>
                setForm((current) => ({ ...current, keywords: event.target.value }))
              }
            />

            <div className="modal-actions">
              <button
                className="btn btn--danger"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setForm(INITIAL_FORM);
                }}
              >
                Cancel
              </button>
              <button className="btn btn--primary" onClick={handleAddSubmit}>
                Add Book
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
};

export default BookManagement;
