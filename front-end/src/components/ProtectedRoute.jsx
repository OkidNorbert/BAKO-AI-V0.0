import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = ({ allowedRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  console.log('ProtectedRoute: Rendering with props:', {
    hasUser: !!user,
    userRole: user?.role,
    requiredRoles: allowedRoles,
    currentPath: location.pathname
  });

  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    console.log('ProtectedRoute: User role not authorized:', {
      userRole: user.role,
      requiredRoles: allowedRoles
    });

    // Redirect to the appropriate dashboard based on user role
    switch (user.role) {
      case 'team':
        return <Navigate to="/team" replace />;
      case 'player':
        return <Navigate to="/player" replace />;
      default:
        return <Navigate to="/" replace />;
    }
  }

  console.log('ProtectedRoute: Access granted to:', location.pathname);
  return <Outlet />;
};

export default ProtectedRoute; 