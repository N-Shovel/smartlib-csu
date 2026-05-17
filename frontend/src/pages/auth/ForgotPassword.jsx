import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { requestPasswordReset } from "../../services/authService";
import { showError, showSuccess } from "../../utils/notification";

const ForgotPassword = () => {
	const [email, setEmail] = useState("");
	const [error, setError] = useState("");
	const [message, setMessage] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const navigate = useNavigate();

	const handleSubmit = async () => {
		setError("");
		setMessage("");

		if (!email) {
			const nextError = "Please enter your email address.";
			setError(nextError);
			showError(nextError);
			return;
		}

		setIsSubmitting(true);
		const result = await requestPasswordReset(email);
		setIsSubmitting(false);

		if (!result.ok) {
			setError(result.error);
			showError(result.error);
			return;
		}

		const nextMessage = "If that email exists, a reset link has been sent.";
		setMessage(nextMessage);
		showSuccess(nextMessage);
	};

	return (
		<div className="auth-page auth-page--login">
			<AuthCard
				title="Forgot password"
				subtitle="Enter your CSU email and we will send a reset link."
				className="auth-card--compact"
			>
				<label className="label" htmlFor="forgot-email">Email</label>
				<input
					className="input"
					type="email"
					id="forgot-email"
					autoComplete="email"
					placeholder="you@carsu.edu.ph"
					value={email}
					onChange={(e) => setEmail(e.target.value)}
					disabled={isSubmitting}
				/>

				{error ? <div className="alert">{error}</div> : null}
				{message ? <div className="alert alert--success">{message}</div> : null}

				<button className="btn btn--primary" onClick={handleSubmit} disabled={isSubmitting}>
					{isSubmitting ? "Sending..." : "Send reset link"}
				</button>
				<button className="btn btn--ghost" onClick={() => navigate("/login")} disabled={isSubmitting}>
					Back to login
				</button>
				<p className="muted auth-card__switch">
					Remembered your password? <Link to="/login">Login</Link>
				</p>
			</AuthCard>
		</div>
	);
};

export default ForgotPassword;