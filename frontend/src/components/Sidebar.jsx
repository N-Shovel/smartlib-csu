// Purpose: Role-aware sidebar navigation with active/interactive states.
// Parts: nav config, active item tracking, interaction handlers, nav render.
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
	const { user } = useAuth();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobileMoving, setIsMobileMoving] = useState(false);
	const movementTimeoutRef = useRef(null);

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

	useEffect(() => {
		const markMoving = () => {
			setIsMobileMoving(true);
			if (movementTimeoutRef.current) {
				clearTimeout(movementTimeoutRef.current);
			}
			movementTimeoutRef.current = setTimeout(() => {
				setIsMobileMoving(false);
			}, 800);
		};

		window.addEventListener("scroll", markMoving, { passive: true });
		window.addEventListener("touchmove", markMoving, { passive: true });
		window.addEventListener("wheel", markMoving, { passive: true });
		window.addEventListener("mousemove", markMoving);

		return () => {
			window.removeEventListener("scroll", markMoving);
			window.removeEventListener("touchmove", markMoving);
			window.removeEventListener("wheel", markMoving);
			window.removeEventListener("mousemove", markMoving);
			if (movementTimeoutRef.current) {
				clearTimeout(movementTimeoutRef.current);
			}
		};
	}, []);

	return (
		<>
			<button
				type="button"
				className={`mobile-menu-fab${!isMobileMoving ? " mobile-menu-fab--idle" : ""}`}
				onClick={() => setIsMobileMenuOpen((prev) => !prev)}
				aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
			>
				<Menu size={18} strokeWidth={2.35} />
				<span>{isMobileMenuOpen ? "Close" : "Menu"}</span>
			</button>

			<aside
				className={`sidebar${isCollapsed ? " sidebar--collapsed" : ""}${
					isMobileMenuOpen ? " sidebar--mobile-open" : ""
				}`}
			>
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
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`sidebar__link${isActive ? " sidebar__link--active" : ""}`
							}
						>
							<span className="sidebar__link-label">{link.label}</span>
						</NavLink>
					))}
				</div>
			</aside>
		</>
	);
};

export default Sidebar;
