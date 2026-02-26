import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ROLES } from "../../constants/roles";
import AuthCard from "../../components/AuthCard";
import { showError, showSuccess } from "../../utils/notification";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleLogin = () => {
    setError("");
    const result = loginUser(email, password);
    if (!result.ok) {
      setError(result.error);
      showError(result.error);
      return;
    }

    showSuccess(
      result.user.role === ROLES.STAFF
        ? "Logged in as staff"
        : "Logged in as borrower"
    );

    navigate(
      result.user.role === ROLES.STAFF ? "/staff/dashboard" : "/borrower/browse"
    );
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in with your CSU account to manage books and reservations."
    >
        <label className="label" htmlFor="login-email">Email</label>
        <input
          className="input"
          type="email"
          id="login-email"
          autoComplete="email"
          placeholder="you@carsu.edu.ph"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label" htmlFor="login-password">Password</label>
        <input
          className="input"
          type="password"
          id="login-password"
          autoComplete="current-password"
          placeholder="Enter your password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error ? <div className="alert">{error}</div> : null}
        <button className="btn btn--primary" onClick={handleLogin}>
          Login
        </button>
        <button className="btn btn--ghost" onClick={() => navigate("/signup")}>
          Create an account
        </button>
    </AuthCard>
  );
};

export default Login;
