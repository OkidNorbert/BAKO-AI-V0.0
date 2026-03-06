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
  Trophy,
  MessageSquare,
  Bell
} from 'lucide-react';
import { useAuth } from '../../../context/AuthContext';

const TeamSidebar = ({ isOpen }) => {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  const isCoach = user?.role === 'coach';
  const isOwner = user?.role === 'team';
  const isLinked = !!user?.organizationId;

  const menuItems = [
    { path: '/team/dashboard', icon: Home, label: 'Dashboard', dotColor: 'bg-orange-500', show: true },
    { path: '/team/roster', icon: Users, label: 'Team Roster', dotColor: 'bg-purple-500', show: isLinked },
    { path: '/team/notifications', icon: Bell, label: 'Notifications', dotColor: 'bg-red-500', show: isLinked },
    { path: '/team/staff', icon: Shield, label: 'Coaching Staff', dotColor: 'bg-indigo-500', show: isOwner && isLinked },
    { path: '/team/announcements', icon: MessageSquare, label: 'Announcements', dotColor: 'bg-green-500', show: isLinked },
    { path: '/team/matches', icon: Video, label: 'Match Analysis', dotColor: 'bg-orange-400', show: isCoach && isLinked },
    { path: '/team/schedule', icon: Calendar, label: 'Schedule', dotColor: 'bg-yellow-400', show: isLinked },
    { path: '/team/reports', icon: BarChart2, label: 'Reports & Analytics', dotColor: 'bg-gray-400', show: isLinked },
    { path: '/team/settings', icon: Settings, label: 'Team Profile', dotColor: 'bg-purple-700', show: isOwner }
  ].filter(item => item.show);

  const sub = isDarkMode ? 'text-gray-500' : 'text-gray-400';

  return (
    <aside className={`fixed top-0 left-0 z-40 h-screen transition-all duration-500 ${isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-64 bg-[#0f1115] border-r border-white/5 shadow-2xl overflow-hidden`}>
      
      {/* Background Decorative Gradient */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 via-yellow-500 to-orange-500 opacity-50"></div>
      
      <div className="h-full px-6 py-10 flex flex-col relative z-10">
        <div className="mb-12 flex items-center">
            <h1 className="text-2xl font-black tracking-tighter text-white">
                BAKO<span className="text-orange-500">.</span>AI
            </h1>
        </div>

        <div className="mb-6">
          <p className="text-[10px] uppercase font-black tracking-[0.2em] text-gray-500">
            Navigation
          </p>
        </div>

        <nav className="flex-1 space-y-2">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `
                group flex items-center px-4 py-3 rounded-2xl transition-all duration-300
                ${isActive 
                  ? 'bg-white/10 text-white shadow-glass border border-white/10' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
                }
              `}
              end={item.path === '/team/dashboard'}
            >
              <item.icon className="w-5 h-5 mr-4 transition-transform group-hover:scale-110" />
              <span className="font-bold text-sm tracking-tight">{item.label}</span>
              {/* Active Indicator Dot */}
              <div className={`ml-auto w-1.5 h-1.5 rounded-full transition-all duration-500 ${item.dotColor} opacity-0 group-[.active]:opacity-100 shadow-[0_0_10px_rgba(255,255,255,0.5)]`} />
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto p-6 rounded-[2rem] glass-dark border border-white/5 relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-24 h-24 bg-orange-500/10 blur-3xl rounded-full" />
          <div className="relative z-10 text-center">
            <h3 className="text-xs font-black text-white mb-1 uppercase tracking-wider">Need Support?</h3>
            <p className="text-[10px] text-gray-500 mb-4 font-medium">Get help from our elite performance team.</p>
            <button className="w-full py-2 bg-white text-black text-[10px] font-black rounded-xl hover:bg-orange-500 hover:text-white transition-colors uppercase tracking-widest">
              Contact Hub
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default TeamSidebar; 