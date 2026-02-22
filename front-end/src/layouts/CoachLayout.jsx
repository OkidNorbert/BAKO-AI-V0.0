import React, { useState } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import {
    User, Video, LogOut, ChevronLeft, ChevronRight, Shield
} from 'lucide-react';

const CoachLayout = () => {
    const { isDarkMode } = useTheme();
    const { user, logout } = useAuth();
    const [collapsed, setCollapsed] = useState(false);

    const navItems = [
        { path: '/coach/analysis', icon: Video, label: 'Match Analysis' },
        { path: '/coach/profile', icon: User, label: 'My Profile' },
    ];

    const sidebarW = collapsed ? 'w-16' : 'w-56';
    const dark = isDarkMode;

    return (
        <div className={`flex h-screen ${dark ? 'bg-gray-900 text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
            {/* Slim Sidebar */}
            <aside className={`flex-shrink-0 ${sidebarW} transition-all duration-300 flex flex-col border-r ${dark ? 'bg-gray-900 border-gray-800' : 'bg-white border-gray-200'
                }`}>
                {/* Logo */}
                <div className={`flex items-center gap-3 px-4 py-5 border-b ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <div className="flex-shrink-0 h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow">
                        <Shield size={16} className="text-white" />
                    </div>
                    {!collapsed && (
                        <div className="min-w-0">
                            <p className="text-sm font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600 truncate">
                                BAKO Coach
                            </p>
                            <p className={`text-xs truncate ${dark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {user?.name || 'Coach'}
                            </p>
                        </div>
                    )}
                </div>

                {/* Nav */}
                <nav className="flex-1 px-2 py-4 space-y-1">
                    {navItems.map(({ path, icon: Icon, label }) => (
                        <NavLink
                            key={path}
                            to={path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all font-medium text-sm ${isActive
                                    ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white shadow-md'
                                    : dark
                                        ? 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`
                            }
                            title={label}
                        >
                            <Icon size={18} className="flex-shrink-0" />
                            {!collapsed && <span>{label}</span>}
                        </NavLink>
                    ))}
                </nav>

                {/* Sign Out */}
                <div className={`px-2 pb-4 border-t pt-3 ${dark ? 'border-gray-800' : 'border-gray-100'}`}>
                    <button
                        onClick={logout}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${dark ? 'text-gray-400 hover:bg-gray-800 hover:text-red-400' : 'text-gray-500 hover:bg-red-50 hover:text-red-600'
                            }`}
                        title="Sign out"
                    >
                        <LogOut size={18} className="flex-shrink-0" />
                        {!collapsed && <span>Sign Out</span>}
                    </button>
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(v => !v)}
                    className={`absolute top-1/2 -right-3 z-20 h-6 w-6 rounded-full border flex items-center justify-center shadow-md transition-colors ${dark ? 'bg-gray-800 border-gray-700 text-gray-300 hover:bg-gray-700' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                >
                    {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
                </button>
            </aside>

            {/* Main Content */}
            <main className={`flex-1 overflow-y-auto ${dark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                <Outlet />
            </main>
        </div>
    );
};

export default CoachLayout;
