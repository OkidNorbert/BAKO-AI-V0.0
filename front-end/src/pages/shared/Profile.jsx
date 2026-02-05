import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  Calendar,
  MapPin,
  Award,
  Activity,
  Edit,
  Save,
  X,
  Camera,
  Shield,
  Bell,
  Globe,
  Lock,
  ChevronRight
} from 'lucide-react';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    location: '',
    bio: '',
    preferences: {
      notifications: true,
      language: 'en',
      timezone: 'UTC',
      privacy: 'public'
    }
  });

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        location: user.location || '',
        bio: user.bio || '',
        preferences: user.preferences || {
          notifications: true,
          language: 'en',
          timezone: 'UTC',
          privacy: 'public'
        }
      });
    }
  }, [user]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handlePreferenceChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update user context
      await updateUser(formData);

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phone || '',
        dateOfBirth: user.dateOfBirth || '',
        location: user.location || '',
        bio: user.bio || '',
        preferences: user.preferences || {
          notifications: true,
          language: 'en',
          timezone: 'UTC',
          privacy: 'public'
        }
      });
    }
    setIsEditing(false);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Handle avatar upload
      console.log('Avatar upload:', file);
    }
  };

  const getRoleSpecificContent = () => {
    if (user?.role === 'team') {
      return {
        title: 'Team Profile',
        subtitle: 'Manage your team organization and settings',
        additionalInfo: (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Team Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Team Members</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.teamMembers || 12}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Players</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.activePlayers || 10}</p>
              </div>
            </div>
          </div>
        )
      };
    } else {
      return {
        title: 'Player Profile',
        subtitle: 'Manage your personal basketball profile and achievements',
        additionalInfo: (
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <h3 className={`font-semibold mb-3 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>Player Statistics</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Overall Rating</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.rating || 85}</p>
              </div>
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Position</p>
                <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>{user.position || 'Guard'}</p>
              </div>
            </div>
          </div>
        )
      };
    }
  };

  const roleContent = getRoleSpecificContent();

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-purple-950'
      : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>

      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {roleContent.title}
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
            {roleContent.subtitle}
          </p>
        </div>

        {/* Profile Header */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row items-start md:items-center space-y-4 md:space-y-0 md:space-x-6">
            {/* Avatar */}
            <div className="relative">
              <div className={`w-24 h-24 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-gray-700' : 'bg-gray-200'
                }`}>
                {user?.avatar ? (
                  <img src={user.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className={`w-12 h-12 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                )}
              </div>
              {isEditing && (
                <label className="absolute bottom-0 right-0 bg-orange-500 rounded-full p-2 cursor-pointer hover:bg-orange-600 transition-colors">
                  <Camera className="w-4 h-4 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Basic Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-2">
                <h2 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  {formData.firstName} {formData.lastName}
                </h2>
                {user?.role === 'team' ? (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                    Team Account
                  </span>
                ) : (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'
                    }`}>
                    Player Account
                  </span>
                )}
              </div>
              <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {user?.role === 'team' ? 'Team Manager' : 'Basketball Player'}
              </p>
            </div>

            {/* Actions */}
            <div className="flex space-x-2">
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                      ? 'bg-orange-600 hover:bg-orange-700 text-white'
                      : 'bg-orange-500 hover:bg-orange-600 text-white'
                    } transition-colors`}
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button
                    onClick={handleSave}
                    disabled={loading}
                    className={`flex items-center px-4 py-2 rounded-lg ${loading
                        ? 'bg-gray-400 cursor-not-allowed'
                        : isDarkMode
                          ? 'bg-green-600 hover:bg-green-700 text-white'
                          : 'bg-green-500 hover:bg-green-600 text-white'
                      } transition-colors`}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={handleCancel}
                    className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-700 text-white'
                        : 'bg-gray-500 hover:bg-gray-600 text-white'
                      } transition-colors`}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancel
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-200">
            {['personal', 'preferences', 'security'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 font-medium transition-colors ${activeTab === tab
                    ? isDarkMode
                      ? 'text-orange-400 border-b-2 border-orange-400'
                      : 'text-orange-600 border-b-2 border-orange-600'
                    : isDarkMode
                      ? 'text-gray-400 hover:text-gray-300'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className={`rounded-xl shadow-lg p-6 mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {activeTab === 'personal' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Last Name
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={!isEditing}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone
                </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Date of Birth
                </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => handleInputChange('dateOfBirth', e.target.value)}
                    disabled={!isEditing}
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Location
                </label>
                <div className="relative">
                  <MapPin className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    disabled={!isEditing}
                    placeholder="City, Country"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => handleInputChange('bio', e.target.value)}
                  disabled={!isEditing}
                  rows={3}
                  placeholder="Tell us about yourself..."
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    } ${!isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                />
              </div>
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <Bell className={`w-4 h-4 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Email Notifications</span>
                </div>
                <button
                  onClick={() => handlePreferenceChange('notifications', !formData.preferences.notifications)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.preferences.notifications
                      ? 'bg-orange-500'
                      : 'bg-gray-300'
                    }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.preferences.notifications ? 'translate-x-6' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Language
                </label>
                <select
                  value={formData.preferences.language}
                  onChange={(e) => handlePreferenceChange('language', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Timezone
                </label>
                <select
                  value={formData.preferences.timezone}
                  onChange={(e) => handlePreferenceChange('timezone', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="UTC">UTC</option>
                  <option value="EST">Eastern Time</option>
                  <option value="PST">Pacific Time</option>
                  <option value="CST">Central Time</option>
                </select>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Profile Privacy
                </label>
                <select
                  value={formData.preferences.privacy}
                  onChange={(e) => handlePreferenceChange('privacy', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                    }`}
                >
                  <option value="public">Public</option>
                  <option value="private">Private</option>
                  <option value="friends">Friends Only</option>
                </select>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Current Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="password"
                    placeholder="Enter current password"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="password"
                    placeholder="Enter new password"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Confirm New Password
                </label>
                <div className="relative">
                  <Lock className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
                  <input
                    type="password"
                    placeholder="Confirm new password"
                    className={`w-full pl-10 pr-3 py-2 rounded-lg border ${isDarkMode
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300 text-gray-900'
                      }`}
                  />
                </div>
              </div>

              <button className={`flex items-center px-4 py-2 rounded-lg ${isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                } transition-colors`}>
                <Shield className="w-4 h-4 mr-2" />
                Update Password
              </button>
            </div>
          )}
        </div>

        {/* Role-Specific Additional Info */}
        {roleContent.additionalInfo}
      </div>
    </div>
  );
};

export default Profile;
