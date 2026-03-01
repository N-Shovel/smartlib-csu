// Purpose: Role-based route gate to protect restricted pages.
// Parts: auth check, role validation, redirect behavior.
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ children, role }) => {
  const { user, isAuthLoading } = useAuth();

  // Wait for persisted auth hydration to finish before route checks.
  // Returning null here avoids briefly rendering a redirect based on stale null user.
  if (isAuthLoading) return null;

  // Block anonymous users from protected pages.
  if (!user) return <Navigate to="/login" replace />;

  // Block authenticated users that don't match the required role.
  // Optional chaining prevents runtime crash if user shape is unexpectedly incomplete.
  if (role && user?.role !== role) return <Navigate to="/" replace />;

  // Auth + role checks passed.
  return children;
};

export default ProtectedRoute;
