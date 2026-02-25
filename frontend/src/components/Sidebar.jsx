import { useState } from "react";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
	const { user } = useAuth();
	const [isCollapsed, setIsCollapsed] = useState(false);

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
					{ to: "/borrower/reserve", label: "Reserve Room" },
					{ to: "/borrower/activity", label: "Activity Log" }
				];

	return (
		<aside className={`sidebar${isCollapsed ? " sidebar--collapsed" : ""}`}>
			<div className="sidebar__head">
				<button
					type="button"
					className="sidebar__toggle"
					onClick={() => setIsCollapsed((prev) => !prev)}
					aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
				>
					<Menu size={18} strokeWidth={2.35} />
				</button>
				<div className="sidebar__title">{user.role} menu</div>
			</div>
			<div className="sidebar__section">
				{links.map((link) => (
					<NavLink
						key={link.to}
						to={link.to}
						title={link.label}
						className={({ isActive }) =>
							`sidebar__link${isActive ? " sidebar__link--active" : ""}`
						}
					>
						<span className="sidebar__link-label">{link.label}</span>
					</NavLink>
				))}
			</div>
		</aside>
	);
};

export default Sidebar;
