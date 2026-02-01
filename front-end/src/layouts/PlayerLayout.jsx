import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import Navbar from '@/components/shared/Layout/Navbar';
import { NotificationProvider } from '@/context/NotificationContext';

const PlayerLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <NotificationProvider>
      <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
        <Navbar role="player" />
        <main className="pt-4">
          <Outlet />
        </main>
      </div>
    </NotificationProvider>
  );
};

export default PlayerLayout; 