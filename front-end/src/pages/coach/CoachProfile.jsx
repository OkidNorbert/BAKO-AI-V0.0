import React, { useState, useEffect } from 'react';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { playerAPI } from '@/services/api';
import { showToast } from '@/components/shared/Toast';
import { User, Mail, Shield, Save, Loader2, AlertTriangle, Trash2 } from 'lucide-react';

const CoachProfile = () => {
    const { isDarkMode } = useTheme();
    const { user, deleteAccount } = useAuth();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deleteConfirmPhrase, setDeleteConfirmPhrase] = useState('');
    const [isDeleting, setIsDeleting] = useState(false);
    const [profile, setProfile] = useState({ full_name: '', email: '', position: '', bio: '' });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const load = async () => {
            try {
                const res = await playerAPI.getProfile();
                const u = res.data?.user || {};
                setProfile({
                    full_name: u.full_name || user?.name || '',
                    email: u.email || user?.email || '',
                    position: u.position || '',
                    bio: u.bio || ''
                });
            } catch {
                setProfile(p => ({ ...p, full_name: user?.name || '', email: user?.email || '' }));
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [user]);

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await playerAPI.updateProfile({ user: { full_name: profile.full_name, position: profile.position, bio: profile.bio } });
            showToast('Profile updated!', 'success');
        } catch {
            showToast('Failed to update profile', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmPhrase !== 'DELETE MY ACCOUNT') {
            showToast('Please type the confirmation phrase exactly', 'error');
            return;
        }

        try {
            setIsDeleting(true);
            const result = await deleteAccount();
            if (result.success) {
                showToast('Account deleted successfully', 'success');
            } else {
                showToast(result.error || 'Failed to delete account', 'error');
            }
        } catch (error) {
            showToast('An error occurred during account deletion', 'error');
        } finally {
            setIsDeleting(false);
            setShowDeleteModal(false);
        }
    };

    const base = `min-h-screen p-6 md:p-10 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`;
    const card = `rounded-2xl border p-6 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100 shadow-sm'}`;
    const label = `block text-xs font-semibold uppercase tracking-widest mb-1.5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`;
    const input = `w-full px-4 py-3 rounded-xl border text-sm outline-none transition focus:ring-2 focus:ring-orange-500/30 ${isDarkMode ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500 focus:border-orange-500' : 'bg-gray-50 border-gray-200 text-gray-900 focus:border-orange-400'
        }`;

    if (loading) return (
        <div className={`${base} flex items-center justify-center`}>
            <Loader2 className="animate-spin text-orange-500" size={36} />
        </div>
    );

    return (
        <div className={base}>
            <div className="max-w-xl mx-auto space-y-8">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
                        My Profile
                    </h1>
                    <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Manage your personal account details
                    </p>
                </div>

                {/* Avatar / Role card */}
                <div className={`${card} flex items-center gap-4`}>
                    <div className="flex-shrink-0 h-16 w-16 rounded-2xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center shadow-lg">
                        <User size={28} className="text-white" />
                    </div>
                    <div>
                        <p className={`font-bold text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{profile.full_name || 'Coach'}</p>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-500/10 text-orange-500">Coach</span>
                            <span className={`text-xs ${isDarkMode ? 'text-gray-500' : 'text-gray-400'}`}>· Not yet linked to a team</span>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSave} className={card}>
                    <h2 className={`font-semibold mb-5 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Account Details</h2>
                    <div className="space-y-5">
                        <div>
                            <label className={label}>Full Name</label>
                            <input className={input} value={profile.full_name} onChange={e => setProfile(p => ({ ...p, full_name: e.target.value }))} placeholder="Your full name" />
                        </div>
                        <div>
                            <label className={label}>Email</label>
                            <input className={`${input} opacity-60 cursor-not-allowed`} value={profile.email} disabled />
                        </div>
                        <div>
                            <label className={label}>Position / Role</label>
                            <input className={input} value={profile.position} onChange={e => setProfile(p => ({ ...p, position: e.target.value }))} placeholder="e.g. Assistant Coach, Head Coach" />
                        </div>
                        <div>
                            <label className={label}>Bio</label>
                            <textarea
                                className={`${input} resize-none`} rows={3}
                                value={profile.bio} onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                                placeholder="A short bio about yourself..."
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="mt-6 w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-red-600 text-white hover:opacity-90 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                        {saving ? 'Saving...' : 'Save Profile'}
                    </button>
                </form>

                {/* Linking info */}
                <div className={`rounded-2xl border p-5 ${isDarkMode ? 'bg-blue-900/20 border-blue-800/40' : 'bg-blue-50 border-blue-100'}`}>
                    <div className="flex items-start gap-3">
                        <Shield size={18} className="text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                            <p className={`text-sm font-semibold ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>Want to join a team?</p>
                            <p className={`text-xs mt-1 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                Share your registered email with the team's organization owner. They'll add you from their Coaching Staff page and your account will automatically gain access to all team features.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Danger Zone */}
                <div className={`mt-10 p-6 rounded-2xl border ${isDarkMode ? 'bg-red-900/10 border-red-900/30' : 'bg-red-50 border-red-100'}`}>
                    <h3 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>
                        <AlertTriangle size={20} />
                        Danger Zone
                    </h3>
                    <p className={`text-sm mb-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        Permanently delete your account and all your data. This action is irreversible.
                    </p>
                    <button
                        onClick={() => setShowDeleteModal(true)}
                        className="flex items-center gap-2 py-2.5 px-5 rounded-xl font-semibold text-sm bg-red-600 text-white hover:bg-red-700 transition shadow-lg shadow-red-900/20"
                    >
                        <Trash2 size={16} />
                        Delete Account
                    </button>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {showDeleteModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className={`w-full max-w-md p-6 rounded-2xl shadow-2xl ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white'}`}>
                        <div className="flex items-center gap-3 mb-4 text-red-500">
                            <AlertTriangle size={32} />
                            <h2 className="text-xl font-bold">Confirm Deletion</h2>
                        </div>

                        <p className={`mb-6 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                            This will permanently delete your profile, matches, and analysis results. This cannot be undone.
                        </p>

                        <div className="mb-6">
                            <label className={`block text-xs font-bold mb-2 uppercase tracking-widest ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                Type <span className="text-red-600 underline text-sm">DELETE MY ACCOUNT</span> to confirm
                            </label>
                            <input
                                type="text"
                                value={deleteConfirmPhrase}
                                onChange={(e) => setDeleteConfirmPhrase(e.target.value)}
                                placeholder="Type the phrase here..."
                                className={`w-full px-4 py-3 rounded-xl border-2 transition outline-none ${isDarkMode
                                    ? 'bg-gray-900 border-gray-700 text-white focus:border-red-500'
                                    : 'bg-white border-gray-200 text-gray-900 focus:border-red-500'
                                    }`}
                            />
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={() => { setShowDeleteModal(false); setDeleteConfirmPhrase(''); }}
                                className={`flex-1 py-3 rounded-xl font-semibold transition ${isDarkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                    }`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDeleteAccount}
                                disabled={deleteConfirmPhrase !== 'DELETE MY ACCOUNT' || isDeleting}
                                className={`flex-1 py-3 rounded-xl font-bold text-white transition ${deleteConfirmPhrase === 'DELETE MY ACCOUNT'
                                    ? 'bg-red-600 hover:bg-red-700'
                                    : 'bg-gray-400 cursor-not-allowed grayscale'
                                    }`}
                            >
                                {isDeleting ? 'Deleting...' : 'Delete Permanently'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CoachProfile;
