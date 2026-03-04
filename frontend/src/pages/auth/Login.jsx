// Purpose: Login page handling borrower/staff authentication flow.
// Parts: form state, submit handler, validation/errors, render.
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useAuthStore";
import AuthCard from "../../components/AuthCard";
import EmailConfirmationPopup from "../../confirmation/EmailConfirmationPopup";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const navigate = useNavigate();
  const {Login, isLoading } = useStore();

  const handleLogin = async () => {
    // Reset previous validation/auth messages before a new attempt.
    setError("");

    // Validate input
    if (!email || !password) {
      const errorMsg = "Please enter both email and password";
      setError(errorMsg);
      return;
    }

    // UI-only behavior: always show confirmation modal first.
    // TODO(BACKEND): Attempt login, check `email_verified` from auth provider,
    // and only navigate to dashboard/browse when verification is true.

    const ok = await Login(email, password);

    if (!ok) {
      setError("Login failed. Please check your credentials.");
      return;
    }

    const {user} = useStore.getState();

    if(!user?.user?.user_metadata?.email_verified){
        setPendingEmail(email);
        setIsEmailPopupOpen(true);
    }
    
    if (user?.profile?.role === "staff") {
      navigate("/staff/dashboard");
    } else {
      navigate("/borrower/browse");
    }

  };

  return (
    <>
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
    <EmailConfirmationPopup
      isOpen={isEmailPopupOpen}
      email={pendingEmail}
      onResend={() => {
        // TODO(BACKEND): Call resend verification endpoint for `pendingEmail`.
      }}
    />
    </>
  );
};

export default Login;
