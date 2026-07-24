import { Navigate, Outlet } from 'react-router-dom';
import { useAuth, hasMinRole, type Role } from '../../context/AuthContext';

export default function RequireAuth({ min = 'VIEWER' }: { min?: Role }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!hasMinRole(user, min)) return <Navigate to="/" replace />;
  return <Outlet />;
}
