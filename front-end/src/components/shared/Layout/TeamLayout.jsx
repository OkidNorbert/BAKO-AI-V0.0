import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import TeamSidebar from './TeamSidebar';
import TeamNavbar from './TeamNavbar';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

const TeamLayout = () => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // An unlinked coach (role=coach but no organizationId) lives in /coach — redirect them out of /team.
  if (user?.role === 'coach' && !user?.organizationId) {
    return <Navigate to="/coach" replace />;
  }

  return (
    <div className={`flex h-screen transition-colors duration-500 bg-[#0f1115] text-white`}>
      <TeamSidebar isOpen={isSidebarOpen} />
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-500 ${isSidebarOpen ? 'ml-64' : 'ml-0'
        }`}>
        <TeamNavbar onSidebarToggle={setIsSidebarOpen} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto admin-main-content-scrollbar">
          <div className="max-w-7xl mx-auto px-8 py-10">
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              <Outlet />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeamLayout;