import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import api from '@/utils/axiosConfig';
import {
    BarChart2,
    Activity,
    Zap,
    Target,
    TrendingUp,
    Calendar,
    ChevronDown,
    Filter
} from 'lucide-react';

const SkillAnalytics = () => {
    const { isDarkMode } = useTheme();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        shooting: { frequency: '85%', accuracy: '78%', trend: '+5%' },
        dribbling: { intensity: 'High', touches: '1.2k', trend: '+12%' },
        movement: { speed: '24.5 km/h', stamina: 'A-', trend: '+3%' }
    });

    useEffect(() => {
        // Simulate data fetch
        setTimeout(() => setLoading(false), 800);
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
            </div>
        );
    }

    return (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold flex items-center">
                        <BarChart2 className="mr-3 h-8 w-8 text-orange-500" />
                        Skill Analytics
                    </h1>
                    <p className={`mt-1 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Deep dive into your performance metrics and growth trends
                    </p>
                </div>

                <div className="flex items-center space-x-3">
                    <div className={`flex items-center px-4 py-2 rounded-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                        }`}>
                        <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                        <span className="text-sm font-medium">Last 30 Days</span>
                        <ChevronDown className="ml-2 h-4 w-4 text-gray-400" />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {/* Shooting Frequency */}
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl">
                            <Target className="h-6 w-6 text-orange-600" />
                        </div>
                        <span className="flex items-center text-green-500 text-sm font-bold">
                            <TrendingUp size={14} className="mr-1" /> {stats.shooting.trend}
                        </span>
                    </div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Shooting Frequency
                    </h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold">{stats.shooting.frequency}</span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>accuracy: {stats.shooting.accuracy}</span>
                    </div>
                </div>

                {/* Dribble Intensity */}
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl">
                            <Zap className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="flex items-center text-green-500 text-sm font-bold">
                            <TrendingUp size={14} className="mr-1" /> {stats.dribbling.trend}
                        </span>
                    </div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Dribble Intensity
                    </h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold">{stats.dribbling.intensity}</span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>{stats.dribbling.touches} touches</span>
                    </div>
                </div>

                {/* Movement Speed */}
                <div className={`p-6 rounded-2xl shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                    <div className="flex justify-between items-start mb-4">
                        <div className="p-3 bg-green-100 rounded-xl">
                            <Activity className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="flex items-center text-green-500 text-sm font-bold">
                            <TrendingUp size={14} className="mr-1" /> {stats.movement.trend}
                        </span>
                    </div>
                    <h3 className={`text-sm font-semibold uppercase tracking-wider ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Movement Speed
                    </h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-3xl font-bold">{stats.movement.speed}</span>
                        <span className={`ml-2 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>stamina: {stats.movement.stamina}</span>
                    </div>
                </div>
            </div>

            {/* Session Comparison Chart Placeholder */}
            <div className={`rounded-2xl shadow-lg p-6 mb-8 ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-100'}`}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold">Session Comparison</h2>
                    <button className={`flex items-center px-3 py-1.5 rounded-lg border text-sm ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}>
                        <Filter size={14} className="mr-2" /> Filter
                    </button>
                </div>

                <div className="h-64 flex items-end space-x-4 px-2">
                    {[45, 78, 52, 91, 63, 84, 72].map((height, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center">
                            <div
                                className={`w-full max-w-[40px] rounded-t-lg transition-all duration-1000 bg-gradient-to-t from-orange-600 to-orange-400 shadow-lg shadow-orange-500/20`}
                                style={{ height: `${height}%` }}
                            ></div>
                            <span className="text-[10px] mt-2 font-medium opacity-50">S-{i + 1}</span>
                        </div>
                    ))}
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-gray-100 dark:border-gray-700">
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Total Drills</p>
                        <p className="text-lg font-bold">142</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Total Minutes</p>
                        <p className="text-lg font-bold">840</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Avg Intensity</p>
                        <p className="text-lg font-bold">High</p>
                    </div>
                    <div className="text-center">
                        <p className="text-[10px] uppercase font-bold text-gray-400">Growth Rate</p>
                        <p className="text-lg font-bold text-green-500">+8.4%</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SkillAnalytics;
