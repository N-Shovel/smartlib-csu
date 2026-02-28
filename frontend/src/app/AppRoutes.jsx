// Purpose: Central route table for public and role-protected pages.
// Parts: public routes, borrower routes, staff routes, fallback routes.
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Layout from "../components/Layout";
import ProtectedRoute from "../components/ProtectedRoute";
import Login from "../pages/auth/Login";
import Signup from "../pages/auth/Signup";
import ActivityLog from "../pages/borrower/ActivityLog";
import BookDetails from "../pages/borrower/BookDetails";
import BrowseBooks from "../pages/borrower/BrowseBooks";
import RoomReservation from "../pages/borrower/RoomReservation";
import NotFound from "../pages/NotFound";
import Approvals from "../pages/staff/Approvals";
import BorrowerTracking from "../pages/staff/BorrowerTracking";
import Dashboard from "../pages/staff/Dashboard";
import StaffAndBorrowerList from "../pages/staff/StaffAndBorrowerList";
import { useStore } from "../store/useAuthStore";
import { useEffect } from "react";
import PageLoader from "../components/PageLoader";

const AppRoutes = () => {

    const {user, studentAuth, isCheckingAuth} = useStore();
    
    useEffect(() => {
        studentAuth();
    }, [studentAuth])
    
    if(isCheckingAuth) return <PageLoader/>  

	return (
		<BrowserRouter>
			<Routes>
				{/* Default entry redirects to login. */}
				<Route path="/" element={<Navigate to="/login" replace />} />
				{/* Public authentication routes. */}
				<Route path="/login" element={!user? <Login /> : <Navigate to={"/borrower/browse"}/>} />
				<Route path="/signup" element={!user? <Signup /> : <Navigate to={"/borrower/browse"}/>}/>

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
					path="/staff/approvals"
					element={
						<ProtectedRoute>
							<Layout>
								<Approvals />
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

				{/* Catch-all fallback for unknown URLs. */}
				<Route path="*" element={<NotFound />} />
			</Routes>
		</BrowserRouter>
	);
};

export default AppRoutes;
