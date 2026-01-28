import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import {
  Save,
  Settings,
  Clock,
  Calendar,
  Bell,
  Mail,
  Shield,
  Database,
  Users,
  FileText
} from 'lucide-react';

const SystemSettings = () => {
  const [settings, setSettings] = useState({
    academyName: '',
    address: '',
    phone: '',
    email: '',
    operatingHours: {
      monday: { open: '7:00 AM', close: '6:00 PM' },
      tuesday: { open: '7:00 AM', close: '6:00 PM' },
      wednesday: { open: '7:00 AM', close: '6:00 PM' },
      thursday: { open: '7:00 AM', close: '6:00 PM' },
      friday: { open: '7:00 AM', close: '6:00 PM' },
      saturday: { open: 'Closed', close: 'Closed' },
      sunday: { open: 'Closed', close: 'Closed' }
    },
    maxPlayersPerClass: 15,
    maxCoachRatio: 5,
    paymentDueDate: 5,
    lateFeePercentage: 10
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
        const response = await api.get('/admin/settings');
        setSettings(response.data || settings);
      } catch (error) {
        console.error('Error fetching settings:', error);
        setError('Failed to fetch system settings. Please try again later.');
      } finally {
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

  const handleOperatingHoursChange = (day, field, value) => {
    setSettings(prev => ({
      ...prev,
      operatingHours: {
        ...prev.operatingHours,
        [day]: {
          ...prev.operatingHours[day],
          [field]: value
        }
      }
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccessMessage('');
      await api.put('/admin/settings', settings);
      setSuccessMessage('Settings saved successfully!');
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">System Settings</h1>
          <button
            onClick={handleSaveSettings}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            {successMessage}
          </div>
        )}

        {/* Basic Information */}
        <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2 mb-4">
            <Settings className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Basic Information</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Daycare Name</label>
              <input
                type="text"
                value={settings.academyName}
                onChange={(e) => handleSettingChange('academyName', e.target.value)}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Address</label>
              <input
                type="text"
                value={settings.address}
                onChange={(e) => handleSettingChange('address', e.target.value)}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={settings.phone}
                  onChange={(e) => handleSettingChange('phone', e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={(e) => handleSettingChange('email', e.target.value)}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Operating Hours */}
        <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2 mb-4">
            <Clock className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Operating Hours</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.operatingHours).map(([day, hours]) => (
              <div key={day} className="grid grid-cols-3 gap-4 items-center">
                <div className="capitalize">{day}</div>
                <div>
                  <input
                    type="text"
                    value={hours.open}
                    onChange={(e) => handleOperatingHoursChange(day, 'open', e.target.value)}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={hours.close}
                    onChange={(e) => handleOperatingHoursChange(day, 'close', e.target.value)}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Class Settings */}
        <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2 mb-4">
            <Users className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Class Settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Maximum Players Per Class</label>
              <input
                type="number"
                value={settings.maxPlayersPerClass}
                onChange={(e) => handleSettingChange('maxPlayersPerClass', parseInt(e.target.value))}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Maximum Coach Ratio</label>
              <input
                type="number"
                value={settings.maxCoachRatio}
                onChange={(e) => handleSettingChange('maxCoachRatio', parseInt(e.target.value))}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className={`mb-6 p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex items-center space-x-2 mb-4">
            <FileText className="h-5 w-5 text-blue-500" />
            <h2 className="text-lg font-semibold">Payment Settings</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Payment Due Date (day of month)</label>
              <input
                type="number"
                value={settings.paymentDueDate}
                onChange={(e) => handleSettingChange('paymentDueDate', parseInt(e.target.value))}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Late Fee Percentage</label>
              <input
                type="number"
                value={settings.lateFeePercentage}
                onChange={(e) => handleSettingChange('lateFeePercentage', parseInt(e.target.value))}
                className={`w-full p-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettings; 