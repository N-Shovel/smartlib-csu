import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { showError, showSuccess } from "../../utils/notification";
import { ROLES } from "../../constants/roles";
import AuthCard from "../../components/AuthCard";

const Signup = () => {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [collegeCourse, setCollegeCourse] = useState("");
  const [yearLevel, setYearLevel] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [currentAddress, setCurrentAddress] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const { signupUser } = useAuth();

  const handleSignup = () => {
    setError("");
    const profile = {
      firstName,
      lastName,
      collegeCourse,
      yearLevel,
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
      subtitle="Join the library and start borrowing."
      className="auth-card--signup"
      formClassName="signup-form"
    >
      <div className="signup-field">
        <label className="label">First Name</label>
        <input
          className="input"
          placeholder="Juan"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
      </div>

      <div className="signup-field">
        <label className="label">Last Name</label>
        <input
          className="input"
          placeholder="Dela Cruz"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />
      </div>

      <div className="signup-field">
        <label className="label">College Course</label>
        <input
          className="input"
          placeholder="BS Information Technology"
          value={collegeCourse}
          onChange={(e) => setCollegeCourse(e.target.value)}
        />
      </div>

      <div className="signup-field">
        <label className="label">Year LVL</label>
        <input
          className="input"
          placeholder="3rd Year"
          value={yearLevel}
          onChange={(e) => setYearLevel(e.target.value)}
        />
      </div>

      <div className="signup-field">
        <label className="label">Contact Info</label>
        <input
          className="input"
          placeholder="09XXXXXXXXX"
          value={contactInfo}
          onChange={(e) => setContactInfo(e.target.value)}
        />
      </div>

      <div className="signup-field">
        <label className="label">Email</label>
        <input
          className="input"
          placeholder="you@library.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">Current Address</label>
        <textarea
          className="input input--area signup-input--address"
          placeholder="Enter your current address"
          value={currentAddress}
          onChange={(e) => setCurrentAddress(e.target.value)}
        />
      </div>

      <div className="signup-field signup-field--full">
        <label className="label">Password</label>
        <input
          className="input"
          type="password"
          placeholder="Create a password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
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
