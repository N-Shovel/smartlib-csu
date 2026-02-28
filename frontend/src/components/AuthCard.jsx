// Purpose: Reusable auth page container with title/subtitle and form slot.
// Parts: props contract, heading block, children/form render.
const AuthCard = ({ title, subtitle, children, className = "", formClassName = "" }) => {
	return (
		// Combines base auth card class with optional page-specific class overrides.
		<div className={`auth-card ${className}`.trim()}>
			<h2>{title}</h2>
			<p className="muted">{subtitle}</p>
			{/* Children usually contain the form fields/actions for login/signup. */}
			<div className={`form auth-card__form ${formClassName}`.trim()}>{children}</div>
		</div>
	);
};

export default AuthCard;
