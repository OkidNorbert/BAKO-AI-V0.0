import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import { useTheme } from '@/context/ThemeContext';

const Layout = () => {
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen bg-[#0f1115] text-white">
      <Navbar />
      <main className="flex-grow">
        <div className={['/login', '/register'].includes(location.pathname)
          ? "w-full overflow-x-hidden"
          : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
        }>
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>
      <Footer />

    </div>
  );
};

export default Layout; 