import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProtectedRouteProps {
  element?: React.ReactElement;
  requireAdmin?: boolean;
  requireUser?: boolean;
  isLayout?: boolean;
}

export function ProtectedRoute({ 
  element, 
  requireAdmin = false,
  requireUser = true,
  isLayout = false 
}: ProtectedRouteProps) {
  const { token, isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: window.location.pathname }} />;
  }

  // Redirect admins to admin dashboard if they try to access user routes
  if (!requireAdmin && isAdmin && requireUser) {
    return <Navigate to="/admin" replace />;
  }

  // Redirect users to dashboard if they try to access admin routes
  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return isLayout ? <Outlet /> : element;
}