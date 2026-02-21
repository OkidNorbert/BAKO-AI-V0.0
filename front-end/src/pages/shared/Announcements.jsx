import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { MessageSquare, Plus, Trash2, Calendar, User, Megaphone } from 'lucide-react';
import { toast } from 'react-toastify';
import api from '@/utils/axiosConfig';

const Announcements = () => {
    const { user } = useAuth();
    const { isDarkMode } = useTheme();
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newAnnouncement, setNewAnnouncement] = useState({ title: '', content: '' });

    const isCoach = user?.role === 'coach';

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        try {
            setLoading(true);
            const response = await api.get('/communications/announcements');
            setAnnouncements(response.data.announcements);
        } catch (error) {
            console.error('Error fetching announcements:', error);
            toast.error('Failed to load announcements');
        } finally {
            setLoading(false);
        }
    };

    const handleAddAnnouncement = async (e) => {
        e.preventDefault();
        if (!newAnnouncement.title || !newAnnouncement.content) {
            toast.warning('Title and content are required');
            return;
        }

        try {
            await api.post('/communications/announcements', newAnnouncement);
            toast.success('Announcement posted successfully');
            setShowAddModal(false);
            setNewAnnouncement({ title: '', content: '' });
            fetchAnnouncements();
        } catch (error) {
            console.error('Error posting announcement:', error);
            toast.error('Failed to post announcement');
        }
    };

    const handleDeleteAnnouncement = async (id) => {
        if (!window.confirm('Are you sure you want to delete this announcement?')) return;

        try {
            await api.delete(`/communications/announcements/${id}`);
            toast.success('Announcement deleted');
            setAnnouncements(prev => prev.filter(a => a.id !== id));
        } catch (error) {
            console.error('Error deleting announcement:', error);
            toast.error('Failed to delete announcement');
        }
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className={`text-2xl font-bold flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        <Megaphone className="mr-3 text-orange-500" /> Team Announcements
                    </h1>
                    <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        Keep track of latest team updates and bulletins
                    </p>
                </div>
                {isCoach && (
                    <button
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors font-medium shadow-md"
                    >
                        <Plus size={20} className="mr-2" /> Post Announcement
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
                </div>
            ) : announcements.length === 0 ? (
                <div className={`flex flex-col items-center justify-center p-12 rounded-2xl border-2 border-dashed ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
                    <MessageSquare size={48} className="text-gray-400 mb-4" />
                    <p className={`text-lg font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>No announcements yet</p>
                    <p className="text-sm text-gray-400 mt-1">Check back later for updates from your coaching staff</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {announcements.map((ann) => (
                        <div
                            key={ann.id}
                            className={`p-5 rounded-2xl shadow-sm border ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <h3 className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                                    {ann.title}
                                </h3>
                                {isCoach && (
                                    <button
                                        onClick={() => handleDeleteAnnouncement(ann.id)}
                                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                            </div>
                            <p className={`mb-4 whitespace-pre-wrap ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                                {ann.content}
                            </p>
                            <div className="flex items-center text-xs text-gray-400 space-x-4 border-t pt-3 mt-auto">
                                <div className="flex items-center">
                                    <User size={14} className="mr-1" /> {ann.authorName}
                                </div>
                                <div className="flex items-center">
                                    <Calendar size={14} className="mr-1" /> {new Date(ann.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
                    <div className={`${isDarkMode ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-200'} border w-full max-w-lg rounded-2xl shadow-2xl p-6`}>
                        <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>New Announcement</h2>
                        <form onSubmit={handleAddAnnouncement}>
                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Title</label>
                                <input
                                    type="text"
                                    value={newAnnouncement.title}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                                    className={`w-full p-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    placeholder="e.g., Practice Time Change"
                                />
                            </div>
                            <div className="mb-6">
                                <label className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Content</label>
                                <textarea
                                    rows={4}
                                    value={newAnnouncement.content}
                                    onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                                    className={`w-full p-2.5 rounded-xl border ${isDarkMode ? 'bg-gray-800 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
                                    placeholder="Type your message here..."
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className={`px-4 py-2 rounded-lg font-medium ${isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-medium shadow-md transition-colors"
                                >
                                    Post Announcement
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Announcements;
