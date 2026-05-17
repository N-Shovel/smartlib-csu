import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import AuthCard from "../../components/AuthCard";
import { resetPasswordWithToken } from "../../services/authService";
import { showError, showSuccess } from "../../utils/notification";
import { extractAccessTokenFromLocation } from "../../utils/passwordReset";

const ResetPassword = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const [accessToken, setAccessToken] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [error, setError] = useState("");
	const [success, setSuccess] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		const token = extractAccessTokenFromLocation(location);

		if (!token) {
			setError("Reset link is missing or expired. Request a new one.");
			return;
		}

		setAccessToken(token);
	}, [location]);

	const handleReset = async () => {
		setError("");
		setSuccess("");

		if (!accessToken) {
			const nextError = "Reset link is missing or expired. Request a new one.";
			setError(nextError);
			showError(nextError);
			return;
		}

		if (!password || !confirmPassword) {
			const nextError = "Please enter and confirm your new password.";
			setError(nextError);
			showError(nextError);
			return;
		}

		if (password !== confirmPassword) {
			const nextError = "Passwords do not match.";
			setError(nextError);
			showError(nextError);
			return;
		}

		setIsSubmitting(true);
		const result = await resetPasswordWithToken(accessToken, password);
		setIsSubmitting(false);

		if (!result.ok) {
			setError(result.error);
			showError(result.error);
			return;
		}

		const nextMessage = "Password updated successfully. You can now sign in.";
		setSuccess(nextMessage);
		showSuccess(nextMessage);
		navigate("/login", { replace: true });
	};

	return (
		<div className="auth-page auth-page--login">
			<AuthCard
				title="Reset password"
				subtitle="Create a new password for your CSU account."
				className="auth-card--compact auth-card--verification"
			>
				<label className="label" htmlFor="reset-password">New password</label>
				<div style={{ position: "relative", display: "flex", alignItems: "center" }}>
					<input
						className="input"
						type={showPassword ? "text" : "password"}
						id="reset-password"
						autoComplete="new-password"
						placeholder="Enter new password"
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						disabled={isSubmitting}
						style={{ paddingRight: "2.5rem" }}
					/>
					<button
						type="button"
						onClick={() => setShowPassword((current) => !current)}
						disabled={isSubmitting}
						style={{ position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
						aria-label={showPassword ? "Hide password" : "Show password"}
					>
						{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
					</button>
				</div>

				<label className="label" htmlFor="confirm-reset-password">Confirm password</label>
				<div style={{ position: "relative", display: "flex", alignItems: "center" }}>
					<input
						className="input"
						type={showConfirmPassword ? "text" : "password"}
						id="confirm-reset-password"
						autoComplete="new-password"
						placeholder="Confirm new password"
						value={confirmPassword}
						onChange={(e) => setConfirmPassword(e.target.value)}
						disabled={isSubmitting}
						style={{ paddingRight: "2.5rem" }}
					/>
					<button
						type="button"
						onClick={() => setShowConfirmPassword((current) => !current)}
						disabled={isSubmitting}
						style={{ position: "absolute", right: "0.75rem", background: "none", border: "none", cursor: "pointer", padding: "0.25rem", display: "flex", alignItems: "center" }}
						aria-label={showConfirmPassword ? "Hide password" : "Show password"}
					>
						{showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
					</button>
				</div>

				{error ? <div className="alert">{error}</div> : null}
				{success ? <div className="alert alert--success">{success}</div> : null}

				<button className="btn btn--primary" onClick={handleReset} disabled={isSubmitting}>
					{isSubmitting ? "Updating..." : "Reset password"}
				</button>
				<Link className="btn btn--ghost btn--block" to="/login">
					Back to login
				</Link>
			</AuthCard>
		</div>
	);
};

export default ResetPassword;
