// Purpose: Signup page for creating borrower accounts.
// Parts: form model, validation logic, submit handler, grouped form render.
import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useStore } from "../../store/useAuthStore";
import { showError } from "../../utils/notification";
import AuthCard from "../../components/AuthCard";
import EmailConfirmationPopup from "../../confirmation/EmailConfirmationPopup";

const sanitizeNameInput = (value) => String(value || "").replace(/\d/g, "");
const sanitizeDigitsInput = (value) => String(value || "").replace(/\D/g, "");
const PROGRAM_PATTERN = /^[A-Z]{2,5} - [1-4](st|nd|rd|th) Year$/;

const formatStudentId = (digits) => {
  const d = String(digits || "").replace(/\D/g, "");
  if (!d) return "";
  if (d.length <= 3) {
    return d.length === 3 ? `${d} - ` : d;
  }
  const first = d.substring(0, 3);
  const rest = d.substring(3, 8); // limit to next 5 chars
  return `${first} - ${rest}`;
};

const Signup = () => {
  const [id, setId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [courseAndYear, setCourseAndYear] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isEmailPopupOpen, setIsEmailPopupOpen] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const navigate = useNavigate();
  const { studentSignUp, isLoading, user } = useStore();

  const handleSignup = async () => {

      // Clear stale errors before validating fresh input.
      setError("");
      
      // Guard: all required borrower fields must be present.
      if (!firstName || !lastName || !courseAndYear || !id || !contactInfo || !email || !currentAddress || !password || !confirmPassword) {
        const errorMsg = "Please fill up all required fields";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      if (/\d/.test(firstName) || /\d/.test(lastName)) {
        const errorMsg = "Names must contain letters only.";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      if (!/^\d+$/.test(id)) {
        const errorMsg = "Student ID must contain numbers only.";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      if (!/^\d+$/.test(contactInfo)) {
        const errorMsg = "Contact number must contain numbers only.";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      if (!PROGRAM_PATTERN.test(String(courseAndYear || "").trim())) {
        const errorMsg = "Program & Year Level must match format like BSCS - 2nd Year.";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }

      // Guard: prevent account creation when password confirmation does not match.
      if (password !== confirmPassword) {
        const errorMsg = "Passwords do not match";
        setError(errorMsg);
        showError(errorMsg);
        return;
      }
      const success = await studentSignUp(
        email,
        password,
        id,
        firstName,
        lastName,
        null, // suffix - optional
        courseAndYear,        
        contactInfo,
        currentAddress
      );

      if (!success) {
        setError("Signup failed. Please try again.");
        return;
      }
    
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
    <div className="auth-page auth-page--login">
    <AuthCard
      title="Create account"
      subtitle="Create your CSU library account and start borrowing."
      className="auth-card--signup"
      formClassName="signup-form"
    >
      <div className="signup-field">
        <label className="label">
          First Name <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="Juan"
          value={firstName}
          onChange={(e) => setFirstName(sanitizeNameInput(e.target.value))}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field">
        <label className="label">
          Last Name <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="Dela Cruz"
          value={lastName}
          onChange={(e) => setLastName(sanitizeNameInput(e.target.value))}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field">
        <label className="label">
          Program & Year Level <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="BSCS - 2nd Year"
          value={courseAndYear}
          onChange={(e) => setCourseAndYear(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field">
        <label className="label">
          Student ID <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="241 - 01234"
          value={formatStudentId(id)}
          inputMode="numeric"
          onChange={(e) => {
            const digits = sanitizeDigitsInput(e.target.value).slice(0, 8); // 3 + 5
            setId(digits);
          }}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field">
        <label className="label">
          Contact Number <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="09XXXXXXXXX"
          value={contactInfo}
          inputMode="numeric"
          onChange={(e) => setContactInfo(sanitizeDigitsInput(e.target.value))}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">
          Email <span className="required">*</span>
        </label>
        <input
          className="input"
          type="email"
          autoComplete="email"
          placeholder="you@carsu.edu.ph"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">
          Current Address <span className="required">*</span>
        </label>
        <textarea
          className="input input--area signup-input--address"
          placeholder="Enter your current address"
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
          disabled={isLoading}
          required
        />
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">
          Password <span className="required">*</span>
        </label>
        <div className="password-input-wrapper">
          <input
            className="input"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={isLoading}
            required
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
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">
          Confirm Password <span className="required">*</span>
        </label>
        <div className="password-input-wrapper">
          <input
            className="input"
            type={showConfirmPassword ? "text" : "password"}
            autoComplete="new-password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            disabled={isLoading}
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            disabled={isLoading}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="signup-field signup-field--full">
        {error ? <div className="alert">{error}</div> : null}
        <button 
          className={`btn ${isLoading? "bg-gray-500 cursor-not-allowed" :  "btn--primary"}`} 
          onClick={handleSignup}
          disabled={isLoading}
        >
          {isLoading ? "Creating account..." : "Signup"}
        </button>
        <p className="muted auth-card__switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AuthCard>
    <EmailConfirmationPopup
      isOpen={isEmailPopupOpen}
      email={pendingEmail}
      onResend={() => {
        // TODO(BACKEND): Call resend verification endpoint for `pendingEmail`.
      }}
    />
    </div>
  );
};

export default Signup;
