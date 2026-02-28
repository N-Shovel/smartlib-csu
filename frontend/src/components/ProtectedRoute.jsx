// Purpose: Route gate to protect restricted pages from unauthenticated users.
// Parts: auth check, redirect behavior.
import { Navigate } from "react-router-dom";
import { useStore } from "../store/useAuthStore";

const ProtectedRoute = ({ children }) => {
  const { user } = useStore();

  // Block anonymous users from protected pages.
  if (!user) return <Navigate to="/login" replace />;

  // Auth check passed.
  return children;
};

export default ProtectedRoute;
