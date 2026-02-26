// Purpose: Signup page for creating borrower accounts.
// Parts: form model, validation logic, submit handler, grouped form render.
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";
import { ROLES } from "../../constants/roles";
import AuthCard from "../../components/AuthCard";

const Signup = () => {
  const [id, setId] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [coursAndYear, setCoursAndYear] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signupUser } = useAuth();

  const handleSignup = () => {
    setError("");
    
    // Check required fields
    if (!firstName || !lastName || !coursAndYear || !id || !contactInfo || !email || !currentAddress || !password || !confirmPassword) {
      const errorMsg = "Please fill up all required fields";
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      const errorMsg = "Passwords do not match";
      setError(errorMsg);
      showError(errorMsg);
      return;
    }

    const profile = {
      firstName,
      lastName,
      collegeCourse: coursAndYear,
      id,
      contactInfo,
      currentAddress
    };

    const result = signupUser(email, password, ROLES.BORROWER, profile);
    if (!result.ok) {
      setError(result.error);
      showError(result.error);
      return;
    }
    showSuccess("Account created!");
    navigate("/login");
  };

  return (
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
          onChange={(e) => setFirstName(e.target.value)}
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
          required
        />
      </div>

      <div className="signup-field">
        <label className="label">
          Program & Year Level <span className="required">*</span>
        </label>
        <input
          className="input"
          placeholder="BSCS-2nd Year"
          value={coursAndYear}
          onChange={(e) => setCoursAndYear(e.target.value)}
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
          onChange={(e) => setId(e.target.value)}
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
          onChange={(e) => setContactInfo(e.target.value)}
          required
        />
      </div>

      <div className="signup-field">
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
          >
            {showPassword ? "Hide" : "Show"}
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
          >
            {showConfirmPassword ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      <div className="signup-field signup-field--full">
        {error ? <div className="alert">{error}</div> : null}
        <button className="btn btn--primary" onClick={handleSignup}>
          Signup
        </button>
        <p className="muted auth-card__switch">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </AuthCard>
  );
};

export default Signup;
