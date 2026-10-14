import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';
import { FullPageSpinner } from '../components/common/Spinner.jsx';

/** Blocks logged-out users and remembers where they were going (including invite links). */
export default function ProtectedRoute({ children }) {
  const { user, profile, loading } = useAuth();
  const location = useLocation();
  if (loading) return <FullPageSpinner label="Checking your session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: `${location.pathname}${location.search}` }} />;
  if (!profile) return <FullPageSpinner label="Setting up your profile…" />;
  return children || <Outlet />;
}
