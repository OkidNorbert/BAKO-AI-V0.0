import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { showToast } from '@/components/shared/Toast';
import {
    Users,
    UserPlus,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Search,
    Mail,
    Loader2,
    Info
} from 'lucide-react';

const CoachingStaff = () => {
    const { isDarkMode } = useTheme();
    const { user } = useAuth();
    const [staff, setStaff] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isLinking, setIsLinking] = useState(false);
    const [linkData, setLinkData] = useState({
        email: '',
        role: 'Main Coach'
    });

    const isOwner = user?.role === 'team';

    useEffect(() => {
        fetchStaff();
    }, []);

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const response = await adminAPI.getStaff();
            setStaff(response.data || []);
        } catch (error) {
            console.error('Error fetching staff:', error);
            setStaff([]);
            showToast('Failed to load coaching staff', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleLinkStaff = async (e) => {
        e.preventDefault();
        if (!isOwner) return;

        try {
            setIsLinking(true);
            const result = await adminAPI.linkStaffMember(linkData.email, linkData.role);
            showToast('Staff member linked successfully!', 'success');
            setLinkData({ email: '', role: 'Main Coach' });
            fetchStaff();
        } catch (error) {
            showToast(error.response?.data?.detail || 'Failed to link staff member', 'error');
        } finally {
            setIsLinking(false);
        }
    };

    const handleRemoveStaff = async (staffId) => {
        if (!isOwner) return;
        if (!window.confirm('Are you sure you want to remove this staff member?')) return;

        try {
            await adminAPI.removeStaffMember(staffId);
            showToast('Staff member removed successfully', 'success');
            fetchStaff();
        } catch (error) {
            showToast('Failed to remove staff member', 'error');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        Coaching Staff
                    </h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Manage your team's coaching staff and their assigned roles.
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Linking Form - Only for Owners */}
                {isOwner && (
                    <div className={`p-6 rounded-xl shadow-lg border h-fit ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                        <div className="flex items-center space-x-2 mb-6">
                            <UserPlus className="text-orange-500" size={20} />
                            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Link New Coach</h2>
                        </div>

                        <form onSubmit={handleLinkStaff} className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Coach Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                    <input
                                        type="email"
                                        required
                                        value={linkData.email}
                                        onChange={(e) => setLinkData({ ...linkData, email: e.target.value })}
                                        placeholder="coach@example.com"
                                        className={`w-full pl-10 pr-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                            }`}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Designated Role
                                </label>
                                <select
                                    value={linkData.role}
                                    onChange={(e) => setLinkData({ ...linkData, role: e.target.value })}
                                    className={`w-full px-4 py-2 rounded-lg border focus:outline-none focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300'
                                        }`}
                                >
                                    <option value="Main Coach">Main Coach</option>
                                    <option value="Assistant Coach">Assistant Coach</option>
                                    <option value="Technical Analyst">Technical Analyst</option>
                                    <option value="Physical Trainer">Physical Trainer</option>
                                </select>
                            </div>

                            <button
                                type="submit"
                                disabled={isLinking}
                                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-medium transition-colors disabled:opacity-50"
                            >
                                {isLinking ? <Loader2 className="animate-spin" size={20} /> : <span>Link Coach Account</span>}
                            </button>
                        </form>

                        <div className={`mt-6 p-4 rounded-lg flex items-start space-x-3 ${isDarkMode ? 'bg-gray-700/50' : 'bg-orange-50'}`}>
                            <Info className="text-orange-500 shrink-0" size={18} />
                            <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                                To link a coach, they must first create a "Team Coach" account using their email address.
                            </p>
                        </div>
                    </div>
                )}

                {/* Staff List */}
                <div className={`lg:col-span-2 p-6 rounded-xl shadow-lg border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center space-x-2">
                            <Users className="text-indigo-500" size={20} />
                            <h2 className={`font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Current Staff</h2>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${isDarkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                            {staff.length} Members
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-12">
                            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Loading staff roster...</p>
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                                <Users className="text-gray-400" size={30} />
                            </div>
                            <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>No coaching staff linked yet.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all hover:shadow-md ${isDarkMode ? 'bg-gray-700/30 border-gray-600' : 'bg-gray-50 border-gray-200'
                                        }`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600 font-bold">
                                                {member.full_name?.charAt(0) || <Users size={20} />}
                                            </div>
                                            <div>
                                                <h3 className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                                    {member.full_name}
                                                </h3>
                                                <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveStaff(member.id)}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                title="Remove Staff"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
                                        <div className="flex items-center space-x-1.5 shadow-sm px-2 py-0.5 rounded-full bg-white dark:bg-gray-800">
                                            {member.staff_role === 'Main Coach' ? (
                                                <ShieldCheck className="text-green-500" size={14} />
                                            ) : (
                                                <ShieldAlert className="text-blue-500" size={14} />
                                            )}
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                                {member.staff_role || 'Staff'}
                                            </span>
                                        </div>

                                        <button className="text-[10px] font-semibold text-orange-500 hover:underline uppercase tracking-tighter">
                                            View Activity
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default CoachingStaff;
