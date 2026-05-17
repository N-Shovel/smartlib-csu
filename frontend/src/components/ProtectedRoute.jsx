// Purpose: Route gate to protect restricted pages from unauthenticated users.
// Parts: auth check, redirect behavior.
import { Navigate } from "react-router-dom";
import { useStore } from "../store/useAuthStore";
import { getVerificationEmail, needsEmailVerification } from "../utils/authVerification";

const ProtectedRoute = ({ children, role }) => {
  const { user } = useStore();

  // Block anonymous users from protected pages.
  if (!user) return <Navigate to="/login" replace />;

  // Redirect users who still need to confirm their email.
  if (needsEmailVerification(user)) {
    return <Navigate to="/verify-email" replace state={{ email: getVerificationEmail(user) }} />;
  }

  // Block authenticated users that don't match the required role.
  // Optional chaining prevents runtime crash if user shape is unexpectedly incomplete.
  if (role && user?.profile?.role !== role) return <Navigate to="/" replace />;

  // Auth + role checks passed.
  return children;
};

export default ProtectedRoute;
