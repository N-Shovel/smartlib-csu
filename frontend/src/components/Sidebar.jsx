import { NavLink } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
	const { user } = useAuth();

	if (!user) return null;

	const links =
		user.role === ROLES.STAFF
			? [
					{ to: "/staff/dashboard", label: "Dashboard" },
					{ to: "/staff/approvals", label: "Approvals" },
					{ to: "/staff/tracking", label: "Borrowers" },
					{ to: "/staff/borrowers", label: "Borrower Signups" }
				]
			: [
					{ to: "/borrower/browse", label: "Browse" },
					{ to: "/borrower/reserve", label: "Reserve Room" }
				];

	return (
		<aside className="sidebar">
			<div className="sidebar__title">{user.role} menu</div>
			<div className="sidebar__section">
				{links.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						className={({ isActive }) =>
							`sidebar__link${isActive ? " sidebar__link--active" : ""}`
						}
					>
						{link.label}
					</NavLink>
				))}
			</div>
		</aside>
	);
};

export default Sidebar;
