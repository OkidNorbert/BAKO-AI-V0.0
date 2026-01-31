import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  Shield,
  Lock,
  Key,
  User,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Save,
  RefreshCw,
  Eye,
  EyeOff
} from 'lucide-react';

const Security = () => {
  const [settings, setSettings] = useState({
    twoFactorAuth: false,
    sessionTimeout: 30,
    passwordPolicy: {
      minLength: 8,
      requireUppercase: true,
      requireNumbers: true,
      requireSpecialChars: true
    },
    ipWhitelist: [],
    accessLogs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [logs, setLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    page: 1,
    total: 0,
    pages: 0
  });
  const [filters, setFilters] = useState({
    action: '',
    status: '',
    startDate: '',
    endDate: ''
  });
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      fetchSecuritySettings();
      fetchSecurityLogs();
    }
  }, [isAuthenticated, pagination.page, filters]);

  const fetchSecuritySettings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getSecuritySettings();
      
      // Ensure all required properties exist with default values
      const settingsData = response.data || {};
      setSettings({
        twoFactorAuth: settingsData.twoFactorAuth || false,
        sessionTimeout: settingsData.sessionTimeout || 30,
        passwordPolicy: {
          minLength: settingsData.passwordPolicy?.minLength || 8,
          requireUppercase: settingsData.passwordPolicy?.requireUppercase || true,
          requireNumbers: settingsData.passwordPolicy?.requireNumbers || true,
          requireSpecialChars: settingsData.passwordPolicy?.requireSpecialChars || true
        },
        ipWhitelist: settingsData.ipWhitelist || [],
        accessLogs: settingsData.accessLogs || []
      });
    } catch (error) {
      console.error('Error fetching security settings:', error);
      setError('Failed to fetch security settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityLogs = async () => {
    try {
      setLogsLoading(true);
      const response = await adminAPI.getSecurityLogs({
        page: pagination.page,
        ...filters
      });
      setLogs(response.data.logs);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Error fetching security logs:', error);
      setError('Failed to fetch security logs');
    } finally {
      setLogsLoading(false);
    }
  };

  const handleSettingChange = (setting, value) => {
    setSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const handlePasswordPolicyChange = (policy, value) => {
    setSettings(prev => ({
      ...prev,
      passwordPolicy: {
        ...prev.passwordPolicy,
        [policy]: value
      }
    }));
  };

  const handleAddIp = () => {
    if (newIp && !settings.ipWhitelist.includes(newIp)) {
      setSettings(prev => ({
        ...prev,
        ipWhitelist: [...prev.ipWhitelist, newIp]
      }));
      setNewIp('');
    }
  };

  const handleRemoveIp = (ip) => {
    setSettings(prev => ({
      ...prev,
      ipWhitelist: prev.ipWhitelist.filter(i => i !== ip)
    }));
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await adminAPI.updateSecuritySettings(settings);
      setSuccess('Security settings updated successfully.');
    } catch (error) {
      console.error('Error updating security settings:', error);
      setError('Failed to update security settings. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (filter, value) => {
    setFilters(prev => {
      const newFilters = {
        ...prev,
        [filter]: value
      };
      
      // Reset to first page when filters change
      setPagination(prev => ({
        ...prev,
        page: 1
      }));
      
      // Fetch logs with new filters
      setTimeout(() => {
        fetchSecurityLogs();
      }, 0);
      
      return newFilters;
    });
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => {
      const newPagination = {
        ...prev,
        page: newPage
      };
      
      // Fetch logs for the new page
      setTimeout(() => {
        fetchSecurityLogs();
      }, 0);
      
      return newPagination;
    });
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading security settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className={`text-2xl font-bold ${
            isDarkMode 
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
          }`}>Security Settings</h1>
          <button
            onClick={handleSaveSettings}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              isDarkMode
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700'
                : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
            }`}
          >
            <Save className="h-4 w-4" />
            <span>Save Changes</span>
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-500 to-green-600 text-white shadow-md">
            <div className="flex items-center">
              <CheckCircle className="h-5 w-5 mr-2" />
              <span>{success}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Authentication Settings */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Authentication Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5 text-blue-500" />
                  <span>Two-Factor Authentication</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.twoFactorAuth}
                    onChange={(e) => handleSettingChange('twoFactorAuth', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    isDarkMode
                      ? 'bg-gray-700 peer-checked:bg-blue-600'
                      : 'bg-gray-200 peer-checked:bg-blue-500'
                  }`}>
                    <div className={`absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5 transition-transform ${
                      settings.twoFactorAuth ? 'translate-x-5' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Session Timeout (minutes)</label>
                <input
                  type="number"
                  value={settings.sessionTimeout}
                  onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                  min="5"
                  max="120"
                />
              </div>
            </div>
          </div>

          {/* Password Policy */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Password Policy</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Minimum Password Length</label>
                <input
                  type="number"
                  value={settings.passwordPolicy.minLength}
                  onChange={(e) => handlePasswordPolicyChange('minLength', parseInt(e.target.value))}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                  min="8"
                  max="32"
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Lock className="h-5 w-5 text-blue-500" />
                  <span>Require Uppercase Letters</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireUppercase}
                    onChange={(e) => handlePasswordPolicyChange('requireUppercase', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    isDarkMode
                      ? 'bg-gray-700 peer-checked:bg-blue-600'
                      : 'bg-gray-200 peer-checked:bg-blue-500'
                  }`}>
                    <div className={`absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5 transition-transform ${
                      settings.passwordPolicy.requireUppercase ? 'translate-x-5' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Key className="h-5 w-5 text-blue-500" />
                  <span>Require Numbers</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireNumbers}
                    onChange={(e) => handlePasswordPolicyChange('requireNumbers', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    isDarkMode
                      ? 'bg-gray-700 peer-checked:bg-blue-600'
                      : 'bg-gray-200 peer-checked:bg-blue-500'
                  }`}>
                    <div className={`absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5 transition-transform ${
                      settings.passwordPolicy.requireNumbers ? 'translate-x-5' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-blue-500" />
                  <span>Require Special Characters</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.passwordPolicy.requireSpecialChars}
                    onChange={(e) => handlePasswordPolicyChange('requireSpecialChars', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className={`w-11 h-6 rounded-full peer ${
                    isDarkMode
                      ? 'bg-gray-700 peer-checked:bg-blue-600'
                      : 'bg-gray-200 peer-checked:bg-blue-500'
                  }`}>
                    <div className={`absolute left-[2px] top-[2px] bg-white rounded-full h-5 w-5 transition-transform ${
                      settings.passwordPolicy.requireSpecialChars ? 'translate-x-5' : ''
                    }`}></div>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* IP Whitelist */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">IP Whitelist</h2>
            <div className="space-y-4">
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={newIp}
                  onChange={(e) => setNewIp(e.target.value)}
                  placeholder="Enter IP address"
                  className={`flex-1 p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
                <button
                  onClick={handleAddIp}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Add
                </button>
              </div>
              <div className="space-y-2">
                {settings.ipWhitelist.map((ip, index) => (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-2 rounded-md ${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                    }`}
                  >
                    <span>{ip}</span>
                    <button
                      onClick={() => handleRemoveIp(ip)}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600'
                          : 'hover:bg-gray-200'
                      }`}
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Access Logs */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Recent Access Logs</h2>
              <div className="flex gap-2">
                <select
                  value={filters.action}
                  onChange={(e) => handleFilterChange('action', e.target.value)}
                  className={`p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <option value="">All Actions</option>
                  <option value="login">Login</option>
                  <option value="logout">Logout</option>
                  <option value="password_change">Password Change</option>
                  <option value="password_reset">Password Reset</option>
                  <option value="2fa_enabled">2FA Enabled</option>
                  <option value="2fa_disabled">2FA Disabled</option>
                  <option value="settings_update">Settings Update</option>
                  <option value="ip_blocked">IP Blocked</option>
                </select>
                <select
                  value={filters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={`p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <option value="">All Status</option>
                  <option value="success">Success</option>
                  <option value="failed">Failed</option>
                  <option value="blocked">Blocked</option>
                </select>
                <input
                  type="date"
                  value={filters.startDate}
                  onChange={(e) => handleFilterChange('startDate', e.target.value)}
                  className={`p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
                <input
                  type="date"
                  value={filters.endDate}
                  onChange={(e) => handleFilterChange('endDate', e.target.value)}
                  className={`p-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>

            {logsLoading ? (
              <div className="flex justify-center py-4">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center py-4 text-gray-500">
                No logs found
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  {logs.map((log, index) => (
                    <div
                      key={index}
                      className={`flex items-center justify-between p-2 rounded-md ${
                        isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span>{log.user?.firstName} {log.user?.lastName}</span>
                        <span className="text-sm text-gray-500">({log.user?.email})</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-500">{new Date(log.createdAt).toLocaleString()}</span>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          log.status === 'success'
                            ? 'bg-green-100 text-green-800'
                            : log.status === 'failed'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <div className="flex justify-center mt-4 gap-2">
                    <button
                      onClick={() => handlePageChange(pagination.page - 1)}
                      disabled={pagination.page === 1}
                      className={`px-3 py-1 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 text-white disabled:opacity-50'
                          : 'bg-gray-200 text-gray-800 disabled:opacity-50'
                      }`}
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1">
                      Page {pagination.page} of {pagination.pages}
                    </span>
                    <button
                      onClick={() => handlePageChange(pagination.page + 1)}
                      disabled={pagination.page === pagination.pages}
                      className={`px-3 py-1 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 text-white disabled:opacity-50'
                          : 'bg-gray-200 text-gray-800 disabled:opacity-50'
                      }`}
                    >
                      Next
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Security; 