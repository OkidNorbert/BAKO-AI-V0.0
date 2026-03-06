import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import Navbar from '@/components/shared/Layout/Navbar';

const PlayerLayout = () => {
  const { isDarkMode } = useTheme();

  return (
    <div className="min-h-screen bg-[#0f1115] text-white transition-all duration-500">
      <Navbar role="player" />
      <main className="pt-8">
        <Outlet />
      </main>
    </div>
  );
};

export default PlayerLayout;
