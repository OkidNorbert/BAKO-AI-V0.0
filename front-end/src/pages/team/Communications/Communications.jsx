import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import {
  Mail,
  MessageSquare,
  Send,
  Trash2,
  Search,
  Filter,
  User,
  Users,
  Clock,
  Plus,
  Edit,
  XCircle
} from 'lucide-react';

const Communications = () => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showNewMessage, setShowNewMessage] = useState(false);
  const [newMessage, setNewMessage] = useState({
    subject: '',
    content: '',
    recipients: 'all', // Default recipients value as string
    type: 'email',
    priority: 'normal'
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getCommunications();
      setMessages(response.data || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError('Failed to fetch messages. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError('');
      
      await adminAPI.createCommunication(newMessage);
      
      setShowNewMessage(false);
      setNewMessage({
        subject: '',
        content: '',
        recipients: 'all',
        type: 'email',
        priority: 'normal'
      });
      fetchMessages();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('Are you sure you want to delete this message?')) {
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      await adminAPI.deleteCommunication(id);
      fetchMessages();
    } catch (error) {
      console.error('Error deleting message:', error);
      setError('Failed to delete message. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const filteredMessages = messages.filter(message => {
    if (!message) return false;
    
    const subject = (message.subject || '').toLowerCase();
    const content = (message.content || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = subject.includes(searchTermLower) || content.includes(searchTermLower);
    const matchesType = filterType === 'all' || message.type === filterType;
    
    return matchesSearch && matchesType;
  });

  const getMessageIcon = (type) => {
    switch (type) {
      case 'email':
        return <Mail className="h-5 w-5 text-blue-500" />;
      case 'notification':
        return <MessageSquare className="h-5 w-5 text-green-500" />;
      case 'sms':
        return <MessageSquare className="h-5 w-5 text-yellow-500" />;
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-gray-500';
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Communications</h1>
          <button
            onClick={() => setShowNewMessage(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>New Message</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {/* New Message Form */}
        {showNewMessage && (
          <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">New Message</h2>
              <button
                onClick={() => setShowNewMessage(false)}
                className={`p-1 rounded-md ${
                  isDarkMode
                    ? 'hover:bg-gray-700'
                    : 'hover:bg-gray-100'
                }`}
              >
                <XCircle className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Subject</label>
                <input
                  type="text"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Content</label>
                <textarea
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                  rows="4"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Type</label>
                  <select
                    value={newMessage.type}
                    onChange={(e) => setNewMessage({ ...newMessage, type: e.target.value })}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  >
                    <option value="email">Email</option>
                    <option value="notification">Notification</option>
                    <option value="sms">SMS</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Priority</label>
                  <select
                    value={newMessage.priority}
                    onChange={(e) => setNewMessage({ ...newMessage, priority: e.target.value })}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="low">Low</option>
                    <option value="normal">Normal</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Recipients</label>
                <select
                  value={newMessage.recipients}
                  onChange={(e) => setNewMessage({
                    ...newMessage,
                    recipients: e.target.value
                  })}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                  required
                >
                  <option value="all">All Users</option>
                  <option value="contacts">All Contacts</option>
                  <option value="coach">All Coach</option>
                  <option value="coaches">All Coaches</option>
                </select>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <Send className="h-4 w-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Search and Filter */}
        <div className={`p-4 rounded-lg mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search messages..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Filter className={`h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className={`rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              >
                <option value="all">All Types</option>
                <option value="email">Email</option>
                <option value="notification">Notification</option>
                <option value="sms">SMS</option>
              </select>
            </div>
          </div>
        </div>

        {/* Messages List */}
        <div className={`rounded-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={`${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Subject</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Recipients</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredMessages.length > 0 ? (
                filteredMessages.map((message) => (
                  <tr key={message._id || message.id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getMessageIcon(message.type)}
                        <span className="ml-2 capitalize">{message.type || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{message.subject || 'N/A'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 text-gray-500 mr-2" />
                        <span>{message.sentTo || 'N/A'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 text-gray-500 mr-2" />
                        <span>
                          {message.sentDate
                            ? new Date(message.sentDate).toLocaleDateString()
                            : 'N/A'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleDeleteMessage(message._id || message.id)}
                          className={`p-1 rounded-md ${
                            isDarkMode
                              ? 'hover:bg-gray-700'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr key="no-messages">
                  <td colSpan="5" className="px-6 py-4 text-center">
                    No messages found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Communications; 