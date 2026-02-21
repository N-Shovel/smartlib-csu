const AuthCard = ({ title, subtitle, children, className = "", formClassName = "" }) => {
	return (
		<div className={`auth-card ${className}`.trim()}>
			<h2>{title}</h2>
			<p className="muted">{subtitle}</p>
			<div className={`form auth-card__form ${formClassName}`.trim()}>{children}</div>
		</div>
	);
};

export default AuthCard;
