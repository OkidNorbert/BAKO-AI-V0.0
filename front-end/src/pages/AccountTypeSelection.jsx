import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Users, User } from 'lucide-react';

const AccountTypeSelection = () => {
    const navigate = useNavigate();
    const { user, login } = useAuth(); // Assuming we might need to update the role via an API call
    const { isDarkMode } = useTheme();

    const handleSelection = (type) => {
        // In a real app, you'd call an API to update the user's role/accountType
        // For now, we'll mock this by updating local storage and state if possible
        // Or we just navigate and let the app handle it based on some state
        const roleMapping = {
            team: 'admin',
            personal: 'coach'
        };

        // Update local storage for mock persistence
        localStorage.setItem('userRole', roleMapping[type]);

        // Refresh page or navigate to trigger the new layout
        window.location.href = type === 'team' ? '/team' : '/player';
    };

    return (
        <div className="min-h-[80vh] flex items-center justify-center p-4">
            <div className={`max-w-4xl w-full space-y-8 p-8 rounded-2xl shadow-xl transition-all duration-300 ${isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                <div className="text-center">
                    <h2 className={`text-4xl font-extrabold ${isDarkMode ? 'text-white' : 'text-gray-900'
                        }`}>
                        Choose Your Account Type
                    </h2>
                    <p className={`mt-4 text-lg ${isDarkMode ? 'text-gray-300' : 'text-gray-600'
                        }`}>
                        Tell us how you'll be using BAKO Basketball Analytics
                    </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mt-12">
                    {/* Team Account */}
                    <button
                        onClick={() => handleSelection('team')}
                        className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-300 group ${isDarkMode
                            ? 'border-gray-700 hover:border-blue-500 bg-gray-700/50'
                            : 'border-gray-100 hover:border-blue-500 bg-gray-50'
                            } hover:shadow-2xl hover:-translate-y-2`}
                    >
                        <div className="p-6 rounded-full bg-blue-100 text-blue-600 transition-transform duration-300 group-hover:scale-110">
                            <Users size={48} />
                        </div>
                        <h3 className={`mt-6 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Team / Organization
                        </h3>
                        <p className={`mt-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Analyze full matches, manage your rosters, and coordinate team performance metrics.
                        </p>
                        <div className="mt-8 px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold group-hover:bg-blue-700 transition-colors">
                            Continue as Team
                        </div>
                    </button>

                    {/* Personal Account */}
                    <button
                        onClick={() => handleSelection('personal')}
                        className={`flex flex-col items-center p-8 rounded-2xl border-2 transition-all duration-300 group ${isDarkMode
                            ? 'border-gray-700 hover:border-orange-500 bg-gray-700/50'
                            : 'border-gray-100 hover:border-orange-500 bg-gray-50'
                            } hover:shadow-2xl hover:-translate-y-2`}
                    >
                        <div className="p-6 rounded-full bg-orange-100 text-orange-600 transition-transform duration-300 group-hover:scale-110">
                            <User size={48} />
                        </div>
                        <h3 className={`mt-6 text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'
                            }`}>
                            Personal Player
                        </h3>
                        <p className={`mt-4 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-600'
                            }`}>
                            Focus on your individual skills, upload training videos, and track your personal progress.
                        </p>
                        <div className="mt-8 px-6 py-2 bg-orange-600 text-white rounded-lg font-semibold group-hover:bg-orange-700 transition-colors">
                            Continue as Player
                        </div>
                    </button>
                </div>

                <p className={`text-center text-sm ${isDarkMode ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                    You can change your account preference later in settings.
                </p>
            </div>
        </div>
    );
};

export default AccountTypeSelection;
