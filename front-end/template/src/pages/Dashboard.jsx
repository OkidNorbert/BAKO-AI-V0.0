import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Redirect to the appropriate dashboard based on user role
  switch (user?.role) {
    case 'admin':
      return <Navigate to="/admin/dashboard" replace />;
    case 'coach':
      return <Navigate to="/coach/dashboard" replace />;
    case 'contact':
      return <Navigate to="/contact/dashboard" replace />;
    case 'finance':
      return <Navigate to="/finance/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard; 