import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) return <main className="route-loading" role="status">Checking your session…</main>;
  if (!isAuthenticated) return <Navigate to="/login" replace state={{ returnUrl: `${location.pathname}${location.search}` }} />;
  return <Outlet />;
}
