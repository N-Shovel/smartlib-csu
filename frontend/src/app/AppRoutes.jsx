// Purpose: Central route table for public and role-protected pages.
// Parts: public routes, borrower routes, staff routes, fallback routes.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import { ROLES } from "../constants/roles";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ActivityLog from "../pages/borrower/ActivityLog";
import Account from "../pages/borrower/Account";
import BookDetails from "../pages/borrower/BookDetails";
import BrowseBooks from "../pages/borrower/BrowseBooks";
import RoomReservation from "../pages/borrower/RoomReservation";
import NotFound from "../pages/NotFound";
import Reservation from "../pages/staff/Reservation";
import BorrowerTracking from "../pages/staff/BorrowerTracking";
import Dashboard from "../pages/staff/Dashboard";
import StaffAndBorrowerList from "../pages/staff/StaffAndBorrowerList";
import BookManagement from "../pages/staff/BookManagement";

const AppRoutes = () => {
	return (
		<BrowserRouter>
			<Routes>
				{/* Default entry redirects to login. */}
				<Route path="/" element={<Navigate to="/login" replace />} />
				{/* Public authentication routes. */}
				<Route path="/login" element={<Login />} />
				<Route path="/signup" element={<Signup />} />

				{/* Borrower-only routes guarded by role check. */}
				<Route
					path="/borrower/browse"
					element={
						<ProtectedRoute role={ROLES.BORROWER}>
							<Layout>
								<BrowseBooks />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/borrower/activity"
					element={
						<ProtectedRoute role={ROLES.BORROWER}>
							<Layout>
								<ActivityLog />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/borrower/book/:id"
					element={
						<ProtectedRoute role={ROLES.BORROWER}>
							<Layout>
								<BookDetails />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/borrower/reserve"
					element={
						<ProtectedRoute role={ROLES.BORROWER}>
							<Layout>
								<RoomReservation />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/borrower/account"
					element={
						<ProtectedRoute role={ROLES.BORROWER}>
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
						<ProtectedRoute role={ROLES.STAFF}>
							<Layout>
								<Dashboard />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/staff/reservation"
					element={
						<ProtectedRoute role={ROLES.STAFF}>
							<Layout>
								<Reservation />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/staff/approvals"
					element={<Navigate to="/staff/reservation" replace />}
				/>

				<Route
					path="/staff/tracking"
					element={
						<ProtectedRoute role={ROLES.STAFF}>
							<Layout>
								<BorrowerTracking />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/staff/borrowers"
					element={
						<ProtectedRoute role={ROLES.STAFF}>
							<Layout>
								<StaffAndBorrowerList />
							</Layout>
						</ProtectedRoute>
					}
				/>

				<Route
					path="/staff/books"
					element={
						<ProtectedRoute role={ROLES.STAFF}>
							<Layout>
								<BookManagement />
							</Layout>
						</ProtectedRoute>
					}
				/>

				{/* Catch-all fallback for unknown URLs. */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
};

export default AppRoutes;
