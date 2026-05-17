import { useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthCard from "../../components/AuthCard";
import { useStore } from "../../store/useAuthStore";
import { getVerificationEmail, needsEmailVerification } from "../../utils/authVerification";

const VerifyEmail = () => {
	const location = useLocation();
	const navigate = useNavigate();
	const user = useStore((state) => state.user);
	const emailFromState = location.state?.email || location.state?.pendingEmail || "";
	const email = getVerificationEmail(user, emailFromState);
	const verificationPending = needsEmailVerification(user);
	const isVerified = Boolean(user) && !verificationPending;

	useEffect(() => {
		if (!user) return;

		if (!verificationPending) {
			const role = String(user?.profile?.role || "").toLowerCase();
			const destination = ["staff", "admin"].includes(role) ? "/staff/dashboard" : "/borrower/browse";
			navigate(destination, { replace: true });
		}
	}, [navigate, user, verificationPending]);

	return (
		<div className="auth-page auth-page--login">
			<AuthCard
				title={isVerified ? "Email verified" : "Verify your email"}
				subtitle={
					isVerified
						? "Your email has already been verified. You can continue to your account."
						: "We sent a verification link to your inbox. Confirm your email before signing in."
				}
				className="auth-card--verification"
			>
				<div className="verification-panel">
					<p className="muted">
						{email ? (
							<>
								We sent the verification email to <strong>{email}</strong>.
							</>
						) : (
							"Check the email address you used during signup for the verification link."
						)}
					</p>
					<p className="muted" style={{ marginTop: "0.75rem" }}>
						If you have already confirmed the email, go back to login and sign in again.
					</p>
					<div className="verification-actions">
						<Link className="btn btn--primary btn--block" to="/login" replace>
							Back to login
						</Link>
						<button
							type="button"
							className="btn btn--ghost btn--block"
							onClick={() => navigate("/signup")}
						>
							Create a new account
						</button>
					</div>
				</div>
			</AuthCard>
		</div>
	);
};

export default VerifyEmail;