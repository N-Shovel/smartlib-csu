import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";
import { ROLES } from "../../constants/roles";
import AuthCard from "../../components/AuthCard";

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
    showSuccess("Welcome back!");
    navigate(
      result.user.role === ROLES.STAFF ? "/staff/dashboard" : "/borrower/browse"
    );
  };

  return (
    <AuthCard
      title="Welcome back"
      subtitle="Sign in to manage books and reservations."
    >
        <label className="label">Email</label>
        <input
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@library.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
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
