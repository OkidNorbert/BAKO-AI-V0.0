import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTheme } from '../../../context/ThemeContext';
import {
  Home,
  Users,
  Video,
  Calendar,
  Settings,
  BarChart2,
  Shield,
  Trophy
} from 'lucide-react';
import BasketballLogo from './BasketballLogo';

const AdminSidebar = ({ isOpen }) => {
  const { isDarkMode } = useTheme();

  const menuItems = [
    { path: '/team/dashboard', icon: Home, label: 'Dashboard', color: 'from-blue-500 to-indigo-600' },
    { path: '/team/roster', icon: Users, label: 'Team Roster', color: 'from-purple-500 to-violet-600' },
    { path: '/team/matches', icon: Video, label: 'Match Analysis', color: 'from-orange-400 to-pink-500' },
    { path: '/team/schedule', icon: Calendar, label: 'Schedule', color: 'from-yellow-400 to-amber-600' },
    { path: '/team/reports', icon: BarChart2, label: 'Reports & Analytics', color: 'from-gray-500 to-gray-600' },
    { path: '/team/settings', icon: Settings, label: 'Settings', color: 'from-purple-500 to-indigo-700' },
    { path: '/', icon: Home, label: 'Back to Website', color: 'from-pink-500 to-orange-500' }
  ];

  // Count unread messages in communications
  const hasCommunicationsIndicator = false; // Will be implemented with real data

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-transform duration-300 ${isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-gray-800 border-gray-700'
        : 'bg-gradient-to-b from-white to-gray-50 border-gray-200'
      } border-r custom-admin-sidebar-scrollbar`}>
      <div className="h-full px-3 py-4 overflow-y-auto">
        <div className="mb-8 px-3 flex items-center">
          <div className={`h-11 w-11 rounded-full bg-white flex items-center justify-center mr-3 shadow-sm`}>
            <BasketballLogo className="h-9 w-9" color="#ef4444" />
          </div>
          <h1 className={`text-xl font-bold ${isDarkMode
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-red-400'
            : 'text-transparent bg-clip-text bg-gradient-to-r from-orange-600 to-red-600'
            }`}>
            BAKO Analytics
          </h1>
        </div>

        <div className="my-4 px-3">
          <p className={`text-xs uppercase font-semibold tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
            Main Navigation
          </p>
        </div>

        <ul className="space-y-2 px-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) => {
                  const baseClasses = `flex items-center p-2.5 rounded-xl transition-all duration-200`;
                  const activeClasses = isDarkMode
                    ? `bg-gradient-to-r ${item.color} text-white`
                    : `bg-gradient-to-r ${item.color} text-white`;
                  const inactiveClasses = isDarkMode
                    ? 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900';

                  return `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;
                }}
                end={item.path === '/team/dashboard'}
              >
                {({ isActive }) => (
                  <>
                    <item.icon className={`w-5 h-5 ${!isActive && 'transition-transform group-hover:scale-110'}`} />
                    <span className="ml-3 font-medium">{item.label}</span>
                    {item.path === '/team/communications' && hasCommunicationsIndicator && (
                      <span className="inline-flex items-center justify-center w-5 h-5 ml-auto text-xs font-semibold text-white bg-red-500 rounded-full">
                        !
                      </span>
                    )}
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className={`mt-10 mx-3 p-4 rounded-xl ${isDarkMode ? 'bg-gray-800' : 'bg-white'
          } shadow-sm`}>
          <div className="flex flex-col items-center text-center">
            <div className={`h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center mb-2`}>
              <Shield className="h-5 w-5 text-white" />
            </div>
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              Need Help?
            </h3>
            <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Contact team support for assistance
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default AdminSidebar; 