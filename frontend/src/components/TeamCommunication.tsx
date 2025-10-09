import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';
import api from '../services/api';

interface TeamAnnouncement {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  priority: 'low' | 'medium' | 'high';
  is_read: boolean;
}

interface TeamMessage {
  id: number;
  sender: string;
  recipient: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

export const TeamCommunication: React.FC = () => {
  const {  } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [announcements, setAnnouncements] = useState<TeamAnnouncement[]>([]);
  const [messages, setMessages] = useState<TeamMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'announcements' | 'messages'>('announcements');
  const [showCreateAnnouncement, setShowCreateAnnouncement] = useState(false);
  const [showSendMessage, setShowSendMessage] = useState(false);

  useEffect(() => {
    fetchCommunicationData();
  }, []);

  const fetchCommunicationData = async () => {
    try {
      setLoading(true);
      const [announcementsResponse, messagesResponse] = await Promise.all([
        api.communication.getAnnouncements(),
        api.communication.getMessages()
      ]);
      setAnnouncements(announcementsResponse.data);
      setMessages(messagesResponse.data);
    } catch (error: any) {
      // Handle 503 errors silently
      if (error.name === 'SilentError' || error.message?.includes('Service unavailable')) {
        // Service unavailable - show empty state
        setAnnouncements([]);
        setMessages([]);
      } else {
        console.error('Error fetching communication data:', error);
        showToast('Failed to load communication data', 'error');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAnnouncement = async (announcementData: Partial<TeamAnnouncement>) => {
    try {
      await api.communication.createAnnouncement(announcementData);
      showToast('Announcement created successfully', 'success');
      setShowCreateAnnouncement(false);
      fetchCommunicationData();
    } catch (error: any) {
      console.error('Error creating announcement:', error);
      showToast('Failed to create announcement', 'error');
    }
  };

  const handleSendMessage = async (messageData: Partial<TeamMessage>) => {
    try {
      await api.communication.sendMessage(messageData);
      showToast('Message sent successfully', 'success');
      setShowSendMessage(false);
      fetchCommunicationData();
    } catch (error: any) {
      console.error('Error sending message:', error);
      showToast('Failed to send message', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Team Communication
          </h1>
          <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage team announcements and direct messages
          </p>
        </div>

        {/* Tabs */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg mb-8`}>
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'announcements'
                  ? darkMode
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-orange-600 border-b-2 border-orange-600'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📢 Announcements
            </button>
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-4 text-sm font-medium ${
                activeTab === 'messages'
                  ? darkMode
                    ? 'text-orange-400 border-b-2 border-orange-400'
                    : 'text-orange-600 border-b-2 border-orange-600'
                  : darkMode
                  ? 'text-gray-400 hover:text-gray-300'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              💬 Messages
            </button>
          </div>

          <div className="p-6">
            {activeTab === 'announcements' ? (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Team Announcements
                  </h2>
                  <button
                    onClick={() => setShowCreateAnnouncement(true)}
                    className={`px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    + New Announcement
                  </button>
                </div>

                {announcements.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">📢</div>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No announcements yet
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                      Create your first team announcement to get started
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {announcements.map((announcement) => (
                      <div
                        key={announcement.id}
                        className={`p-4 rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {announcement.title}
                          </h3>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              announcement.priority === 'high'
                                ? 'bg-red-100 text-red-800'
                                : announcement.priority === 'medium'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {announcement.priority}
                          </span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'} mb-2`}>
                          {announcement.content}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>By {announcement.author}</span>
                          <span>{new Date(announcement.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    Direct Messages
                  </h2>
                  <button
                    onClick={() => setShowSendMessage(true)}
                    className={`px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    + Send Message
                  </button>
                </div>

                {messages.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-4xl mb-4">💬</div>
                    <p className={`text-lg ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      No messages yet
                    </p>
                    <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-2`}>
                      Send your first message to a team member
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`p-4 rounded-lg border ${
                          darkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                            {message.sender} → {message.recipient}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {new Date(message.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                          {message.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Create Announcement Modal */}
        {showCreateAnnouncement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Create Announcement
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const announcementData = {
                  title: formData.get('title') as string,
                  content: formData.get('content') as string,
                  priority: formData.get('priority') as 'low' | 'medium' | 'high',
                };
                handleCreateAnnouncement(announcementData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Priority
                    </label>
                    <select
                      name="priority"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Content
                    </label>
                    <textarea
                      name="content"
                      rows={4}
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Create Announcement
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowCreateAnnouncement(false)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Send Message Modal */}
        {showSendMessage && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl p-6 w-full max-w-lg mx-4`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                Send Message
              </h3>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const messageData = {
                  recipient: formData.get('recipient') as string,
                  content: formData.get('content') as string,
                };
                handleSendMessage(messageData);
              }}>
                <div className="space-y-4">
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      To
                    </label>
                    <select
                      name="recipient"
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    >
                      <option value="">Select Player</option>
                      {/* TODO: Populate with actual team players */}
                      <option value="player1">Player 1</option>
                      <option value="player2">Player 2</option>
                    </select>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'} mb-2`}>
                      Message
                    </label>
                    <textarea
                      name="content"
                      rows={4}
                      required
                      className={`w-full px-3 py-2 rounded-lg border ${
                        darkMode 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      }`}
                    />
                  </div>
                </div>
                <div className="flex space-x-3 mt-6">
                  <button
                    type="submit"
                    className={`flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors`}
                  >
                    Send Message
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowSendMessage(false)}
                    className={`flex-1 px-4 py-2 ${
                      darkMode 
                        ? 'bg-gray-600 text-white hover:bg-gray-700' 
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                    } rounded-lg transition-colors`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
