// Purpose: Role-aware sidebar navigation with active/interactive states.
// Parts: nav config, active item tracking, interaction handlers, nav render.
import { useEffect, useRef, useState } from "react";
import { Menu } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { ROLES } from "../constants/roles";
import { useAuth } from "../context/AuthContext";

const Sidebar = () => {
	const { user, logoutUser } = useAuth();
	const navigate = useNavigate();
	const [isCollapsed, setIsCollapsed] = useState(false);
	const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
	const [isMobileMoving, setIsMobileMoving] = useState(false);
	const movementTimeoutRef = useRef(null);

	const handleLogout = () => {
		logoutUser();
		setIsMobileMenuOpen(false);
		navigate("/login");
	};

	useEffect(() => {
		if (!user) return;

		const markMoving = () => {
			// Hide idle animation while the user is actively moving/scrolling.
			setIsMobileMoving(true);
			if (movementTimeoutRef.current) {
				clearTimeout(movementTimeoutRef.current);
			}
			// Return to idle state shortly after movement stops.
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
	}, [user]);

	if (!user) return null;

	// Sidebar links are derived from the authenticated user's role.
	const links =
		user.role === ROLES.STAFF
			? [
					{ to: "/staff/dashboard", label: "Dashboard" },
					{ to: "/staff/tracking", label: "Borrowers" },
					{ to: "/staff/reservation", label: "Reservation" },
					{ to: "/staff/books", label: "Book Management" },
					{ to: "/staff/borrowers", label: "Borrowers Signup" }
				]
			: [
					{ to: "/borrower/browse", label: "Browse" },
					{ to: "/borrower/reserve", label: "Reserve Room" },
					{ to: "/borrower/activity", label: "Activity Log" },
					{ to: "/borrower/account", label: "Account" }
				];

	return (
		<>
			<button
				type="button"
				className={`mobile-menu-fab${!isMobileMoving ? " mobile-menu-fab--idle" : ""}`}
				// Mobile quick-action button toggles sidebar visibility.
				onClick={() => setIsMobileMenuOpen((prev) => !prev)}
				aria-label={isMobileMenuOpen ? "Close menu" : "Open menu"}
			>
				<Menu size={18} strokeWidth={2.35} />
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
							// Close mobile drawer once user selects a destination.
							onClick={() => setIsMobileMenuOpen(false)}
							className={({ isActive }) =>
								`sidebar__link${isActive ? " sidebar__link--active" : ""}`
							}
						>
							<span className="sidebar__link-label">{link.label}</span>
						</NavLink>
					))}
				</div>
				<div className="sidebar__footer">
					<button type="button" className="btn btn--ghost sidebar__logout" onClick={handleLogout}>
						Logout
					</button>
				</div>
			</aside>
		</>
	);
};

export default Sidebar;
