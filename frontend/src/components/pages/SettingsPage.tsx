import React, { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';

export const SettingsPage: React.FC = () => {
  const { darkMode, toggleDarkMode } = useTheme();
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    weeklyReports: true,
    autoAnalysis: true,
  });

  const handleSave = () => {
    showToast('Settings saved successfully!', 'success');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className={`text-4xl font-bold mb-2 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Settings
        </h1>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>
          Manage your account and preferences
        </p>
      </div>

      {/* Profile Settings */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Profile Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Email
            </label>
            <input
              type="email"
              value={user?.email || ''}
              disabled
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'} border-0`}
            />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
              Role
            </label>
            <input
              type="text"
              value={user?.role || ''}
              disabled
              className={`w-full px-4 py-2 rounded-lg ${darkMode ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-600'} border-0 capitalize`}
            />
          </div>
        </div>
      </div>

      {/* Appearance Settings */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Appearance
        </h2>
        <div className="flex items-center justify-between">
          <div>
            <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
            <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Switch between light and dark theme
            </p>
          </div>
          <button
            onClick={toggleDarkMode}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              darkMode ? 'bg-orange-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                darkMode ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Notification Settings */}
      <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
        <h2 className={`text-2xl font-bold mb-6 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Notifications
        </h2>
        <div className="space-y-4">
          {[
            { key: 'emailNotifications', label: 'Email Notifications', description: 'Receive updates via email' },
            { key: 'pushNotifications', label: 'Push Notifications', description: 'Get notified about new insights' },
            { key: 'weeklyReports', label: 'Weekly Reports', description: 'Receive weekly performance summaries' },
            { key: 'autoAnalysis', label: 'Auto Analysis', description: 'Automatically analyze uploaded videos' },
          ].map((setting) => (
            <div key={setting.key} className="flex items-center justify-between py-3">
              <div>
                <p className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{setting.label}</p>
                <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{setting.description}</p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, [setting.key]: !settings[setting.key as keyof typeof settings] })}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings[setting.key as keyof typeof settings] ? 'bg-orange-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    settings[setting.key as keyof typeof settings] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-8 py-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white font-semibold rounded-lg hover:from-orange-700 hover:to-orange-800 transition-all transform hover:scale-105"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
};
