import { useState } from "react";
import BookCard from "../../components/BookCard";
import { getBooks, borrowBook, returnBook } from "../../services/bookService";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";

const BrowseBooks = () => {
  const { user } = useAuth();
  const [books, setBooks] = useState(getBooks());

  const refresh = () => setBooks(getBooks());

  const handleBorrow = (id) => {
    if (!user) return;
    const result = borrowBook(id, user.email);
    if (!result.ok) {
      showError(result.error);
    } else {
      showSuccess("Book borrowed successfully");
    }
    refresh();
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
      <div className="book-grid">
        {books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            canBorrow={book.available}
            canReturn={!book.available && book.borrowedBy === user?.email}
            onBorrow={handleBorrow}
            onReturn={handleReturn}
          />
        ))}
      </div>
    </section>
  );
};

export default BrowseBooks;
