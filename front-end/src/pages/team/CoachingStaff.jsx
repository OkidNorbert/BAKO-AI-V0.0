import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { showToast } from '@/components/shared/Toast';
import {
    Users,
    UserPlus,
    Trash2,
    ShieldCheck,
    ShieldAlert,
    Mail,
    Loader2,
    Info,
    ArrowRight
} from 'lucide-react';

const CoachingStaff = () => {
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
        <div className="space-y-12 pb-12">
            <div>
                <h1 className="text-6xl font-black tracking-tighter mb-4 text-white">Coaching Staff</h1>
                <p className="text-xl text-gray-500">
                    Manage your team's coaching staff and their <span className="text-orange-500 font-black">assigned roles</span>.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Linking Form - Only for Owners */}
                {isOwner && (
                    <div className="p-8 rounded-[2rem] glass-dark border border-white/5 h-fit">
                        <div className="flex items-center space-x-3 mb-8">
                            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500">
                                <UserPlus size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Add Coach</h2>
                        </div>

                        <form onSubmit={handleLinkStaff} className="space-y-6">
                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                                    Coach Email
                                </label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 h-5 w-5" />
                                    <input
                                        type="email"
                                        required
                                        value={linkData.email}
                                        onChange={(e) => setLinkData({ ...linkData, email: e.target.value })}
                                        placeholder="coach@example.com"
                                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 font-bold transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] uppercase font-black tracking-widest text-gray-500 mb-2">
                                    Designated Role
                                </label>
                                <div className="px-4 py-1 rounded-2xl bg-white/5 border border-white/10">
                                    <select
                                        value={linkData.role}
                                        onChange={(e) => setLinkData({ ...linkData, role: e.target.value })}
                                        className="w-full bg-transparent border-none text-white font-bold py-3 pr-8 focus:ring-0 appearance-none cursor-pointer"
                                    >
                                        <option value="Main Coach" className="bg-gray-900">Main Coach</option>
                                        <option value="Assistant Coach" className="bg-gray-900">Assistant Coach</option>
                                        <option value="Technical Analyst" className="bg-gray-900">Technical Analyst</option>
                                        <option value="Physical Trainer" className="bg-gray-900">Physical Trainer</option>
                                    </select>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={isLinking}
                                className="w-full flex items-center justify-center space-x-2 py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-sm transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)] disabled:opacity-50 disabled:shadow-none"
                            >
                                {isLinking ? <Loader2 className="animate-spin" size={20} /> : <span>Link Coach Account</span>}
                            </button>
                        </form>

                        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10 flex items-start space-x-3 group hover:border-orange-500/30 transition-colors cursor-help">
                            <Info className="text-orange-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-xs font-bold text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors">
                                To link a coach, they must first create a <span className="text-white">"Team Coach"</span> account using their email address.
                            </p>
                        </div>
                    </div>
                )}

                {/* Staff List */}
                <div className="lg:col-span-2 p-8 rounded-[2rem] glass-dark border border-white/5">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center space-x-3">
                            <div className="p-3 rounded-2xl bg-blue-500/10 text-blue-500">
                                <Users size={24} />
                            </div>
                            <h2 className="text-2xl font-black text-white tracking-tight">Active Roster</h2>
                        </div>
                        <span className="text-[10px] uppercase font-black tracking-widest px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-gray-400">
                            {staff.length} Members
                        </span>
                    </div>

                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/5 rounded-3xl border border-white/5 border-dashed">
                            <Loader2 className="animate-spin text-orange-500 mb-4" size={40} />
                            <p className="text-gray-500 font-bold text-sm uppercase tracking-widest">Loading staff roster...</p>
                        </div>
                    ) : staff.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-white/5 rounded-3xl border border-white/5">
                            <div className="h-24 w-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                                <Users className="text-gray-500" size={40} />
                            </div>
                            <p className="text-xl font-black text-white mb-2">No coaching staff linked yet</p>
                            <p className="text-gray-500 font-bold text-sm">Use the form to invite your first coach.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {staff.map((member) => (
                                <div
                                    key={member.id}
                                    className="p-6 rounded-3xl bg-white/5 border border-white/10 flex flex-col justify-between transition-all hover:bg-white/10 hover:border-white/20 group hover:-translate-y-1"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-xl shadow-lg">
                                                {member.full_name?.charAt(0) || <Users size={20} />}
                                            </div>
                                            <div>
                                                <h3 className="font-black text-white text-lg leading-tight">
                                                    {member.full_name}
                                                </h3>
                                                <p className="text-xs font-bold text-gray-500 mt-0.5">
                                                    {member.email}
                                                </p>
                                            </div>
                                        </div>
                                        {isOwner && (
                                            <button
                                                onClick={() => handleRemoveStaff(member.id)}
                                                className="p-2 rounded-xl text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                                                title="Remove Staff"
                                            >
                                                <Trash2 size={18} />
                                            </button>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between">
                                        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-black/30 border border-white/5">
                                            {member.staff_role === 'Main Coach' ? (
                                                <ShieldCheck className="text-green-500" size={14} />
                                            ) : (
                                                <ShieldAlert className="text-blue-500" size={14} />
                                            )}
                                            <span className="text-[10px] font-black uppercase tracking-widest text-gray-300">
                                                {member.staff_role || 'Staff'}
                                            </span>
                                        </div>

                                        <button className="flex items-center text-[10px] font-black uppercase tracking-widest text-orange-500 group-hover:text-orange-400 transition-colors">
                                            Overview <ArrowRight size={12} className="ml-1 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
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
