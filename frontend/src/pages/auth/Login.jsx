// Purpose: Login page handling borrower/staff authentication flow.
// Parts: form state, submit handler, validation/errors, render.
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
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { loginUser } = useAuth();

  const handleLogin = () => {
    if (isRedirecting) return;
    // Reset previous validation/auth messages before a new attempt.
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
        : "Logged in as borrower",
      2000
    );

    setIsRedirecting(true);
    // LOGIC: Keep user on current screen briefly so success feedback is visible,
    // then continue to the role-specific landing page.
    setTimeout(() => {
      navigate(
        result.user.role === ROLES.STAFF ? "/staff/dashboard" : "/borrower/browse"
      );
    }, 2200);
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
        <button className="btn btn--primary" onClick={handleLogin} disabled={isRedirecting}>
          {isRedirecting ? "Logging in..." : "Login"}
        </button>
        <button className="btn btn--ghost" onClick={() => navigate("/signup")} disabled={isRedirecting}>
          Create an account
        </button>
    </AuthCard>
  );
};

export default Login;
