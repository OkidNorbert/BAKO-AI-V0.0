import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import {
  Save,
  Settings,
  MapPin,
  Globe,
  Twitter,
  Instagram,
  Users,
  Timer,
  Shuffle
} from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    teamName: '',
    homeCourt: '',
    phone: '',
    email: '',
    website: '',
    social: {
      twitter: '',
      instagram: ''
    },
    competitionSettings: {
      quarterDuration: 12, // minutes
      maxTimeouts: 7,
      maxFouls: 6
    },
    rosterSettings: {
      maxPlayers: 15,
      maxCoaches: 5,
      allowGuestPlayers: true
    }
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        setError('');
        // Mock fetch or existing endpoint
        // const response = await api.get('/team/settings');
        // setSettings(response.data || settings);

        // Mock data for now since backend might not match
        setTimeout(() => {
          setSettings(prev => ({
            ...prev,
            teamName: 'BAKO Analytics Demo Team',
            homeCourt: 'Downtown Arena',
            phone: '555-0123',
            email: 'coach@bako-analytics.com'
          }));
          setLoading(false);
        }, 500);

      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to fetch team settings. Please try again later.');
        setLoading(false);
      }
    };

    fetchSettings();
  }, []);

  const handleSettingChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNestedChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');

      // Mock save
      await new Promise(resolve => setTimeout(resolve, 1000));
      // await api.put('/team/settings', settings);

      setSuccessMessage('Team settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      setError('Failed to save settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  const inputClassName = `w-full p-2 rounded-md ${isDarkMode
      ? 'bg-gray-700 text-white border border-gray-600 focus:border-orange-500'
      : 'bg-white text-gray-900 border border-gray-300 focus:border-orange-500'
    } focus:ring-1 focus:ring-orange-500 outline-none transition-colors`;

  const sectionClassName = `mb-6 p-6 rounded-lg shadow-sm ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`;
  const headerClassName = "flex items-center space-x-2 mb-4 text-lg font-semibold";

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Team Settings</h1>
            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Manage your team details and preferences</p>
          </div>
          <button
            onClick={handleSaveSettings}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full font-medium shadow-lg transition-transform hover:scale-105 ${isDarkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-700 hover:to-red-700 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
              }`}
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg border border-red-200">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg border border-green-200">
            {successMessage}
          </div>
        )}

        {/* Basic Information */}
        <div className={sectionClassName}>
          <div className={headerClassName}>
            <Settings className="h-5 w-5 text-orange-500" />
            <h2>Team Identity</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Team Name</label>
              <input
                type="text"
                value={settings.teamName}
                onChange={(e) => handleSettingChange('teamName', e.target.value)}
                className={inputClassName}
                placeholder="e.g. Golden State Warriors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <MapPin size={16} className="mr-1 text-gray-400" /> Home Court / Arena
              </label>
              <input
                type="text"
                value={settings.homeCourt}
                onChange={(e) => handleSettingChange('homeCourt', e.target.value)}
                className={inputClassName}
                placeholder="e.g. Chase Center"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Globe size={16} className="mr-1 text-gray-400" /> Website
              </label>
              <input
                type="url"
                value={settings.website}
                onChange={(e) => handleSettingChange('website', e.target.value)}
                className={inputClassName}
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Official Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => handleSettingChange('email', e.target.value)}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Contact Phone</label>
              <input
                type="tel"
                value={settings.phone}
                onChange={(e) => handleSettingChange('phone', e.target.value)}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className={sectionClassName}>
          <div className={headerClassName}>
            <Globe className="h-5 w-5 text-blue-400" />
            <h2>Social Presence</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Twitter size={16} className="mr-1 text-blue-400" /> Twitter Handle
              </label>
              <input
                type="text"
                value={settings.social.twitter}
                onChange={(e) => handleNestedChange('social', 'twitter', e.target.value)}
                className={inputClassName}
                placeholder="@teamhandle"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Instagram size={16} className="mr-1 text-pink-500" /> Instagram Handle
              </label>
              <input
                type="text"
                value={settings.social.instagram}
                onChange={(e) => handleNestedChange('social', 'instagram', e.target.value)}
                className={inputClassName}
                placeholder="@teamhandle"
              />
            </div>
          </div>
        </div>

        {/* Competition Settings */}
        <div className={sectionClassName}>
          <div className={headerClassName}>
            <Timer className="h-5 w-5 text-red-500" />
            <h2>Competition Rules</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Quarter Duration (mins)</label>
              <input
                type="number"
                value={settings.competitionSettings.quarterDuration}
                onChange={(e) => handleNestedChange('competitionSettings', 'quarterDuration', parseInt(e.target.value))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Timeouts</label>
              <input
                type="number"
                value={settings.competitionSettings.maxTimeouts}
                onChange={(e) => handleNestedChange('competitionSettings', 'maxTimeouts', parseInt(e.target.value))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fouls Limit</label>
              <input
                type="number"
                value={settings.competitionSettings.maxFouls}
                onChange={(e) => handleNestedChange('competitionSettings', 'maxFouls', parseInt(e.target.value))}
                className={inputClassName}
              />
            </div>
          </div>
        </div>

        {/* Roster Settings */}
        <div className={sectionClassName}>
          <div className={headerClassName}>
            <Users className="h-5 w-5 text-green-500" />
            <h2>Roster Limits</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Max Players</label>
              <input
                type="number"
                value={settings.rosterSettings.maxPlayers}
                onChange={(e) => handleNestedChange('rosterSettings', 'maxPlayers', parseInt(e.target.value))}
                className={inputClassName}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Max Coaches</label>
              <input
                type="number"
                value={settings.rosterSettings.maxCoaches}
                onChange={(e) => handleNestedChange('rosterSettings', 'maxCoaches', parseInt(e.target.value))}
                className={inputClassName}
              />
            </div>
            <div className="flex items-center justify-between p-2">
              <label className="block text-sm font-medium">Allow Guest Players</label>
              <input
                type="checkbox"
                checked={settings.rosterSettings.allowGuestPlayers}
                onChange={(e) => handleNestedChange('rosterSettings', 'allowGuestPlayers', e.target.checked)}
                className="h-5 w-5 text-orange-600 focus:ring-orange-500 border-gray-300 rounded"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 