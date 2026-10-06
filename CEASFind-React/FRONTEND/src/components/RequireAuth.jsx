import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export function FullPageSpinner() {
  return (
    <div className="full-page-spinner">
      <div className="spinner" />
    </div>
  );
}

// Signed in AND registered (users/{uid} exists). A signed-in user without a
// profile is sent back to /auth to finish registration with a course code.
export default function RequireAuth({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();

  if (loading) return <FullPageSpinner />;
  if (!user || !profile) return <Navigate to="/auth" replace state={{ from: location }} />;
  return children;
}
