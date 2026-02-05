import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
  const { user } = useAuth();

  // Redirect to the appropriate dashboard based on user role
  switch (user?.role) {
    case 'team':
      return <Navigate to="/team/dashboard" replace />;
    case 'player':
      return <Navigate to="/player/dashboard" replace />;
    default:
      return <Navigate to="/login" replace />;
  }
};

export default Dashboard; 