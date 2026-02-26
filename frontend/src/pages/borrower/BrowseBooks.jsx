// Purpose: Searchable borrower catalog split by regular and thesis books.
// Parts: local state, derived filtered lists, borrow/return/thesis handlers, modal render.
import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import BookCard from "../../components/BookCard";
import BookDetailsModal from "../../components/BookDetailsModal";
import ThesisPermissionModal from "../../components/ThesisPermissionModal";
import { getBooks, borrowBook, returnBook } from "../../services/bookService";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const BrowseBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState(getBooks());
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingThesisBookId, setPendingThesisBookId] = useState(null);
  const [permissionCode, setPermissionCode] = useState("");
  const [permissionError, setPermissionError] = useState("");
  const [selectedBook, setSelectedBook] = useState(null);

  const filteredBooks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return books;

    return books.filter((book) =>
      [book.title, book.author, book.category]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [books, searchQuery]);

  const regularBooks = useMemo(
    () =>
      filteredBooks.filter(
        (book) => String(book.category || "").toLowerCase() !== "thesis"
      ),
    [filteredBooks]
  );

  const thesisBooks = useMemo(
    () =>
      filteredBooks.filter(
        (book) => String(book.category || "").toLowerCase() === "thesis"
      ),
    [filteredBooks]
  );

  const refresh = () => setBooks(getBooks());

  const submitBorrow = (id, code = "") => {
    if (!user) return;
    const result = borrowBook(id, user.email, code);
    if (!result.ok) {
      showError(result.error);
      return result;
    } else {
      showSuccess("Book borrowed successfully");
    }
    refresh();
    return result;
  };

  const handleBorrow = (book) => {
    if (!user) return;

    const isThesis = String(book.category || "").toLowerCase() === "thesis";
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

    const result = submitBorrow(pendingThesisBookId, permissionCode);
    if (!result?.ok) {
      setPermissionError(result?.error || "Unable to apply for this thesis.");
      return;
    }

    setPendingThesisBookId(null);
    setPermissionCode("");
    setPermissionError("");
  };

  const handleReturn = (id) => {
    if (!user) return;
    const result = returnBook(id, user.email);
    if (!result.ok) {
      showError(result.error);
    } else {
      showSuccess("Book returned successfully");
    }
    refresh();
  };

  return (
    <section>
      <div className="page-header">
        <div>
          <h2>Browse Books</h2>
          <p className="muted">Pick a title and borrow instantly.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: "1rem" }}>
        <div className="search-input-wrapper">
          <Search className="search-input-icon" size={18} aria-hidden="true" />
          <input
            className="input search-input"
            type="search"
            placeholder="Search by title, author, or category"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {filteredBooks.length === 0 ? (
        <div className="empty-state">No books found for your search.</div>
      ) : null}

      <div className="book-grid">
        {regularBooks.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            canBorrow={book.available}
            canReturn={!book.available && book.borrowedBy === user?.email}
            onBorrow={handleBorrow}
            onReturn={handleReturn}
            onOpenDetails={setSelectedBook}
          />
        ))}
      </div>

      {regularBooks.length > 0 && thesisBooks.length > 0 ? (
        <div className="book-section-separator" aria-hidden="true" />
      ) : null}

      {thesisBooks.length > 0 ? (
        <div className="book-grid">
          {thesisBooks.map((book) => (
            <BookCard
              key={book.id}
              book={book}
              canBorrow={book.available}
              canReturn={!book.available && book.borrowedBy === user?.email}
              onBorrow={handleBorrow}
              onReturn={handleReturn}
              onOpenDetails={setSelectedBook}
            />
          ))}
        </div>
      ) : null}

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
    </section>
  );
};

export default BrowseBooks;
