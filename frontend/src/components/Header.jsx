// Purpose: Top navigation bar with auth-aware user actions.
// Parts: auth/user lookup, logout handler, nav/action rendering.
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ROLES } from "../constants/roles";
import caragaStateUniversityLogo from "../assets/Caraga_State_University.png";

const Header = () => {
  const { user } = useAuth();

  const brandTarget =
    user?.role === ROLES.STAFF
      ? "/staff/dashboard"
      : user?.role === ROLES.BORROWER
        ? "/borrower/browse"
        : "/login";

  return (
    <header className="header">
      <div className="header__brand">
        <Link to={brandTarget} className="brand">
          <img
            className="brand__logo"
            src={caragaStateUniversityLogo}
            alt="Caraga State University logo"
          />
          <span>SmartLib CSU</span>
        </Link>
      </div>
      <nav className="header__nav">
        {/* Render account info/actions when authenticated; otherwise show entry actions. */}
        {user ? (
          <div className="header__meta">
            <span className="pill">{user.role}</span>
            <span className="header__email">{user.email}</span>
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
