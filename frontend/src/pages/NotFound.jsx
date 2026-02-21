import { Link } from "react-router-dom";

const NotFound = () => (
	<div className="empty-state">
		<h2>404 - Page Not Found</h2>
		<p className="muted">The page you are looking for does not exist.</p>
		<Link className="btn btn--ghost" to="/">
			Go Home
		</Link>
	</div>
);
export default NotFound;
