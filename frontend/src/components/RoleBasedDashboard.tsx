import React from 'react';
import { useAuth } from '../context/AuthContext';
import { EnhancedDashboard } from './EnhancedDashboard';
import { CoachDashboard } from './CoachDashboard';

export const RoleBasedDashboard: React.FC = () => {
  const { user } = useAuth();

  // Render different dashboards based on user role
  if (user?.role === 'coach') {
    return <CoachDashboard />;
  }

  // Default to player dashboard
  return <EnhancedDashboard />;
};
