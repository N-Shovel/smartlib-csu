// Purpose: Login page handling borrower/staff authentication flow.
// Parts: form state, submit handler, validation/errors, render.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useAuthStore";
import AuthCard from "../../components/AuthCard";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { studentLogin, isLoading } = useStore();

  const handleLogin = async () => {
    // Reset previous validation/auth messages before a new attempt.
    setError("");

    // Validate input
    if (!email || !password) {
      const errorMsg = "Please enter both email and password";
      setError(errorMsg);
      return;
    }

    // Call the store's login method
    const success = await studentLogin(email, password);
    
    if (!success) {
      setError("Login failed. Please check your credentials.");
      return;
    }

    // Success - navigate to borrower browse page
    navigate("/borrower/browse");
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
          disabled={isLoading}
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
          disabled={isLoading}
        />
        {error ? <div className="alert">{error}</div> : null}
        <button 
          className={`btn ${isLoading? "bg-gray-500 cursor-not-allowed": "btn--primary"}`} 
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
        <button 
          className="btn btn--ghost" 
          onClick={() => navigate("/signup")}
          disabled={isLoading}
        >
          Create an account
        </button>
    </AuthCard>
  );
};

export default Login;
