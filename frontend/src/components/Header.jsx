import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = () => {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutUser();
    navigate("/login");
  };

  return (
    <header className="header">
      <div className="header__brand">
        <Link to="/" className="brand">
          SmartLib CSU
        </Link>
      </div>
      <nav className="header__nav">
        {user ? (
          <div className="header__meta">
            <span className="pill">{user.role}</span>
            <span className="header__email">{user.email}</span>
            <button className="btn btn--ghost" onClick={handleLogout}>
              Logout
            </button>
          </div>
        ) : (
          <div className="header__actions">
            <Link className="btn btn--ghost" to="/login">
              Login
            </Link>
            <Link className="btn btn--primary" to="/signup">
              Signup
            </Link>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Header;
