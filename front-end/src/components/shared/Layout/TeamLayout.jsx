import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import TeamSidebar from './TeamSidebar';
import TeamNavbarFixed from './TeamNavbarFixed.jsx';
import { useTheme } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';

const TeamLayout = () => {
  const { isDarkMode } = useTheme();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleSidebarToggle = (isOpen) => {
    setIsSidebarOpen(isOpen);
  };

  return (
    <NotificationProvider>
      <div className={`flex h-screen transition-colors duration-300 ${isDarkMode ? 'dark bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'
        }`}>
        <TeamSidebar isOpen={isSidebarOpen} />
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'
          }`}>
          <TeamNavbarFixed onSidebarToggle={handleSidebarToggle} />
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
