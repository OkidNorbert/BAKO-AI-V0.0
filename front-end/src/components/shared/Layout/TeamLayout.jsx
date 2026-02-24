import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import TeamSidebar from './TeamSidebar';
import TeamNavbar from './TeamNavbar';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { NotificationProvider } from '@/context/NotificationContext';

const TeamLayout = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // An unlinked coach (role=coach but no organizationId) lives in /coach — redirect them out of /team.
  if (user?.role === 'coach' && !user?.organizationId) {
    return <Navigate to="/coach" replace />;
  }

  return (
    <NotificationProvider>
      <div className={`flex h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
        <TeamSidebar isOpen={isSidebarOpen} />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}>
          <TeamNavbar onSidebarToggle={setIsSidebarOpen} />
          <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900 admin-main-content-scrollbar">
            <div className="container mx-auto px-6 py-8">
              <div className="animate-fade-in">
                <Outlet />
              </div>
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
};

export default TeamLayout;