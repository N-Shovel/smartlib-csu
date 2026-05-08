// Purpose: Central route table for public and role-protected pages.
// Parts: public routes, borrower routes, staff routes, fallback routes.
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ActivityLog from "../pages/borrower/ActivityLog";
import Account from "../pages/borrower/Account";
import BookDetails from "../pages/borrower/BookDetails";
import BrowseBooks from "../pages/borrower/BrowseBooks";
import RoomReservation from "../pages/borrower/RoomReservation";
import NotFound from "../pages/NotFound";
import BorrowerTracking from "../pages/staff/BorrowerTracking";
import Dashboard from "../pages/staff/Dashboard";
import StaffAndBorrowerList from "../pages/staff/StaffAndBorrowerList";
import BookManagement from "../pages/staff/BookManagement";
import Reservation from "../pages/staff/Reservation";
import { useStore } from "../store/useAuthStore";
import { useEffect, useState } from "react";
import PageLoader from "../components/PageLoader";

const publicAuthPaths = new Set(["/", "/login", "/signup"]);

const AppRoutesContent = () => {
	const { user, checkAuth, isCheckingAuth } = useStore();
	const location = useLocation();
	const isPublicAuthPath = publicAuthPaths.has(location.pathname);

	useEffect(() => {
		if (!isPublicAuthPath) {
			checkAuth();
		}
	}, [checkAuth, isPublicAuthPath, location.pathname]);

	const isStaff = ["staff", "admin"].includes(String(user?.profile?.role || "").toLowerCase());

	const [routeLoading, setRouteLoading] = useState(false);

	useEffect(() => {
		// Slightly defer showing the loader to avoid synchronous setState in effect.
		const start = setTimeout(() => setRouteLoading(true), 8);
		const end = setTimeout(() => setRouteLoading(false), 340);
		return () => {
			clearTimeout(start);
			clearTimeout(end);
		};
	}, [location.pathname]);

	if (isCheckingAuth && !isPublicAuthPath) return <PageLoader />;
	if (routeLoading) return <PageLoader />;

	return (
		<div className="app-root-shell">
			<div className="app-root-content">
				<Routes>
					{/* Default entry redirects to login. */}
					<Route path="/" element={<Navigate to="/login" replace />} />
					{/* Public authentication routes. */}
					<Route path="/login" element={!user ? <Login /> : isStaff ? <Navigate to={"/staff/dashboard"} /> : <Navigate to={"/borrower/browse"} />} />
					<Route path="/signup" element={!user ? <Signup /> : <Navigate to={"/borrower/browse"} />} />

					{/* Borrower-only routes guarded by role check. */}
					<Route
						path="/borrower/browse"
						element={
							<ProtectedRoute>
								<Layout>
									<BrowseBooks />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/borrower/activity"
						element={
							<ProtectedRoute>
								<Layout>
									<ActivityLog />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/borrower/book/:id"
						element={
							<ProtectedRoute>
								<Layout>
									<BookDetails />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/borrower/reserve"
						element={
							<ProtectedRoute>
								<Layout>
									<RoomReservation />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/borrower/account"
						element={
							<ProtectedRoute role="borrower">
								<Layout>
									<Account />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Staff-only routes guarded by role check. */}
					<Route
						path="/staff/dashboard"
						element={
							<ProtectedRoute>
								<Layout>
									<Dashboard />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/staff/tracking"
						element={
							<ProtectedRoute>
								<Layout>
									<BorrowerTracking />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/staff/borrowers"
						element={
							<ProtectedRoute>
								<Layout>
									<StaffAndBorrowerList />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/staff/books"
						element={
							<ProtectedRoute>
								<Layout>
									<BookManagement />
								</Layout>
							</ProtectedRoute>
						}
					/>

					<Route
						path="/staff/reservation"
						element={
							<ProtectedRoute role="staff">
								<Layout>
									<Reservation />
								</Layout>
							</ProtectedRoute>
						}
					/>

					{/* Catch-all fallback for unknown URLs. */}
					<Route path="*" element={<NotFound />} />
				</Routes>
			</div>
			<footer className="app-copyright" aria-label="Copyright">
				© {new Date().getFullYear()} SmartLib CSU. All rights reserved.
			</footer>
		</div>
	);
};

const AppRoutes = () => {
    return (
        <BrowserRouter>
		    <AppRoutesContent />
	    </BrowserRouter>
    );
};

export default AppRoutes;
