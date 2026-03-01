// Purpose: Signup page for creating borrower accounts.
// Parts: form model, validation logic, submit handler, grouped form render.
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";
import { ROLES } from "../../constants/roles";
import AuthCard from "../../components/AuthCard";

const toYearLevelSuffix = (value) => {
  const text = String(value || "").trim();
  if (!text) return "N/A";

  if (/\b(st|nd|rd|th)\b/i.test(text) || /\byear\b/i.test(text)) {
    return text;
  }

  const matched = text.match(/\d+/);
  if (!matched) return text;

  const yearNumber = Number(matched[0]);
  if (!Number.isFinite(yearNumber) || yearNumber <= 0) return text;

  const modulo100 = yearNumber % 100;
  const modulo10 = yearNumber % 10;
  let suffix = "th";
  if (modulo100 < 11 || modulo100 > 13) {
    if (modulo10 === 1) suffix = "st";
    else if (modulo10 === 2) suffix = "nd";
    else if (modulo10 === 3) suffix = "rd";
  }

  return `${yearNumber}${suffix} Year`;
};

const Signup = () => {
  const [id, setId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [nameSuffix, setNameSuffix] = useState("");
  const [coursAndYear, setCoursAndYear] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [isRedirecting, setIsRedirecting] = useState(false);
  const navigate = useNavigate();
  const { signupUser } = useAuth();

  const setSignupError = (message) => {
    // Keep toast and inline alert messages in sync from one helper.
    setError(message);
    showError(message);
  };

  const handleSuffixChange = (event) => {
    // Suffix accepts short tokens only (e.g., JR, SR, III).
    const value = String(event.target.value || "")
      .replace(/\s+/g, "")
      .slice(0, 3)
      .toUpperCase();
    setNameSuffix(value);
  };

  const handleStudentIdChange = (event) => {
    // Preserve user-entered format while enforcing configured max length.
    const value = String(event.target.value || "").slice(0, 10);
    setId(value);
  };

  const handleContactChange = (event) => {
    // Contact number is normalized to digits-only so exact-length checks stay reliable.
    const digitsOnly = String(event.target.value || "")
      .replace(/\D/g, "")
      .slice(0, 12);
    setContactInfo(digitsOnly);
  };

  const handleSignup = () => {
    if (isRedirecting) return;
    // Clear stale errors before validating fresh input.
    setError("");
    const normalizedFirstName = String(firstName || "").trim();
    const normalizedLastName = String(lastName || "").trim();
    const normalizedSuffix = String(nameSuffix || "").trim();
    const normalizedProgramAndYear = String(coursAndYear || "").trim();
    const normalizedStudentId = String(id || "").trim();
    const normalizedContact = String(contactInfo || "").trim();
    const normalizedEmail = String(email || "").trim();
    const normalizedAddress = String(currentAddress || "").trim();

    // Validation runs before service call so users get immediate, field-specific feedback.
    // Guard: all required borrower fields must be present.
    if (!normalizedFirstName || !normalizedLastName || !normalizedProgramAndYear || !normalizedStudentId || !normalizedContact || !normalizedEmail || !normalizedAddress || !password || !confirmPassword) {
      setSignupError("Please fill up all required fields");
      return;
    }

    // Guard: prevent account creation when password confirmation does not match.
    if (password !== confirmPassword) {
      setSignupError("Passwords do not match");
      return;
    }

    if (normalizedSuffix.length > 3) {
      setSignupError("Suffix must be up to 3 characters only.");
      return;
    }

    if (normalizedProgramAndYear.length < 10 || normalizedProgramAndYear.length > 12) {
      setSignupError("Program & Year Level must be 10 to 12 characters.");
      return;
    }

    if (normalizedStudentId.length > 10) {
      setSignupError("Student ID must be up to 10 characters only.");
      return;
    }

    if (normalizedContact.length !== 12) {
      setSignupError("Contact Number must be exactly 12 characters.");
      return;
    }

    // Package form fields into a borrower profile payload for signup service.
    const [parsedCourse = "", parsedYearLevel = ""] = normalizedProgramAndYear
      .split("-")
      .map((value) => value.trim());

    const profile = {
      firstName: normalizedFirstName,
      lastName: normalizedLastName,
      nameSuffix: normalizedSuffix,
      collegeCourse: parsedCourse || normalizedProgramAndYear,
      yearLevel: toYearLevelSuffix(parsedYearLevel),
      id: normalizedStudentId,
      contactInfo: normalizedContact,
      currentAddress: normalizedAddress
    };

    // Persist new account via auth context/service.
    const result = signupUser(normalizedEmail, password, ROLES.BORROWER, profile);
    if (!result.ok) {
      setSignupError(result.error);
      return;
    }
    // On success, direct the user to login so they can authenticate.
    showSuccess("Account created!", 2000);
    setIsRedirecting(true);
    // LOGIC: Delay redirect so users can read the success confirmation first.
    setTimeout(() => {
      navigate("/login");
    }, 1700);
  };

  return (
    <AuthCard
      title="Create account"
      subtitle="Create your CSU library account and start borrowing."
      className="auth-card--signup"
      formClassName="signup-form"
    >
      <div className="signup-field signup-field--full signup-name-row">
        <div className="signup-field">
          <label className="label">
            First Name <span className="required">*</span>
          </label>
          <input
            className="input"
            placeholder="Juan"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            autoComplete="given-name"
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
            onChange={(e) => setLastName(e.target.value)}
            autoComplete="family-name"
            required
          />
        </div>

        <div className="signup-field signup-field--suffix">
          <label className="label">Suffix</label>
          <input
            className="input signup-input--suffix"
            placeholder="Jr."
            value={nameSuffix}
            onChange={handleSuffixChange}
            maxLength={3}
            autoComplete="honorific-suffix"
          />
        </div>
      </div>

      <div className="signup-field signup-field--full signup-row-triple">
        <div className="signup-field">
          <label className="label">
            Program & Year Level <span className="required">*</span>
          </label>
          <input
            className="input"
            placeholder="BSCS-2nd Year"
            value={coursAndYear}
            onChange={(e) => setCoursAndYear(e.target.value)}
            minLength={10}
            maxLength={12}
            required
          />
        </div>

        <div className="signup-field">
          <label className="label">
            Student ID <span className="required">*</span>
          </label>
          <input
            className="input"
            placeholder="241-01234"
            value={id}
            onChange={handleStudentIdChange}
            maxLength={10}
            required
          />
        </div>

        <div className="signup-field">
          <label className="label">
            Contact Number <span className="required">*</span>
          </label>
          <input
            className="input"
            type="tel"
            inputMode="numeric"
            placeholder="09XXXXXXXXX"
            value={contactInfo}
            onChange={handleContactChange}
            minLength={12}
            maxLength={12}
            required
          />
        </div>
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
          maxLength={80}
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
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            title={showPassword ? "Hide password" : "Show password"}
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
            required
          />
          <button
            type="button"
            className="password-toggle"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            title={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
          >
            {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="signup-field signup-field--full">
        {error ? <div className="alert" role="alert">{error}</div> : null}
        <button className="btn btn--primary" onClick={handleSignup} disabled={isRedirecting}>
          {isRedirecting ? "Signing up..." : "Signup"}
        </button>
        <p className="muted auth-card__switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export default Signup;
