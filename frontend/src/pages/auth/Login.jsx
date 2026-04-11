// Purpose: Login page handling borrower/staff authentication flow.
// Parts: form state, submit handler, validation/errors, render.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useStore } from "../../store/useAuthStore";
import AuthCard from "../../components/AuthCard";
import EmailConfirmationPopup from "../../confirmation/EmailConfirmationPopup";

const isEmailVerified = (authUser) => {
  const confirmedAt = authUser?.email_confirmed_at;
  const metadataVerified = authUser?.user_metadata?.email_verified;
  const appMetadataVerified = authUser?.app_metadata?.email_verified;

  return Boolean(confirmedAt || metadataVerified || appMetadataVerified);
};

const isStaffRole = (role) => ["staff", "admin"].includes(String(role || "").toLowerCase());

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
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

    if (!isEmailVerified(user?.user)) {
        setPendingEmail(email);
        setIsEmailPopupOpen(true);
        return;
    }
    
    if (isStaffRole(user?.profile?.role)) {
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
        <div className="password-input-wrapper">
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            id="login-password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
            disabled={isLoading}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
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
      onClose={() => setIsEmailPopupOpen(false)}
      onResend={() => {
        // TODO(BACKEND): Call resend verification endpoint for `pendingEmail`.
      }}
    />
    </>
  );
};

export default Login;
