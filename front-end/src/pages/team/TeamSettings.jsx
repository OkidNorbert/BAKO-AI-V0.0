import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import {
  Save,
  Settings,
  MapPin,
  Globe,
  Twitter,
  Instagram,
  Users,
  Timer,
  Palette,
  Shirt,
  Image as ImageIcon,
  Loader2
} from 'lucide-react';
import { showToast } from '../../components/shared/Toast';

const TeamSettings = () => {
  const [settings, setSettings] = useState({
    name: '',
    description: '',
    logo_url: '',
    primary_color: '#FF5733',
    secondary_color: '#333333',
    jersey_style: 'Solid',
    home_court: '',
    phone: '',
    email: '',
    website: '',
    twitter_handle: '',
    instagram_handle: '',
    competition_settings: {
      quarterDuration: 12,
      maxTimeouts: 7,
      maxFouls: 6
    },
    roster_settings: {
      maxPlayers: 15,
      maxCoaches: 5,
      allowGuestPlayers: true
    }
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    const fetchTeamData = async () => {
      try {
        setLoading(true);
        const response = await adminAPI.getProfile();
        if (response.data && response.data.organization) {
          const org = response.data.organization;
          setSettings(prev => ({
            ...prev,
            ...org,
            // Ensure nested objects are handled
            competition_settings: org.competition_settings || prev.competition_settings,
            roster_settings: org.roster_settings || prev.roster_settings
          }));
        }
      } catch (error) {
        console.error('Error fetching team profile:', error);
        showToast('Failed to fetch team data', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchTeamData();
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
      setSaving(true);
      // We send the data under "organization" key as expected by backend update_profile
      await adminAPI.updateProfile({
        organization: {
          ...settings,
          // Backend expects snake_case for most but let's be careful
          // Values like twitter_handle are already snake_case in our state
        }
      });
      showToast('Team profile updated successfully!', 'success');
    } catch (error) {
      console.error('Error saving settings:', error);
      showToast('Failed to save team profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <Loader2 className="animate-spin h-12 w-12 text-orange-500" />
      </div>
    );
  }

  const inputClassName = `w-full p-2.5 rounded-lg border transition-all outline-none focus:ring-2 focus:ring-orange-500/20 ${isDarkMode
      ? 'bg-gray-700/50 border-gray-600 text-white focus:border-orange-500'
      : 'bg-white border-gray-300 text-gray-900 focus:border-orange-500 shadow-sm'
    }`;

  const sectionClassName = `mb-8 p-6 rounded-2xl border ${isDarkMode
      ? 'bg-gray-800/50 border-gray-700 shadow-xl'
      : 'bg-white border-gray-100 shadow-md'
    }`;

  const labelClassName = `block text-sm font-semibold mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`;

  return (
    <div className={`min-h-screen p-4 md:p-8 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-500 to-red-600">
              Team Profile
            </h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
              Manage your team's public identity and competition rules
            </p>
          </div>
          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className={`flex items-center space-x-2 px-8 py-3 rounded-xl font-bold transition-all transform active:scale-95 disabled:opacity-50 shadow-lg ${isDarkMode
                ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white'
                : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
              }`}
          >
            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
            <span>{saving ? 'Saving...' : 'Save Profile'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: Core Identity */}
          <div className="lg:col-span-2 space-y-8">
            {/* Identity Section */}
            <div className={sectionClassName}>
              <div className="flex items-center space-x-2 mb-6">
                <Settings className="h-6 w-6 text-orange-500" />
                <h2 className="text-xl font-bold">General Information</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={labelClassName}>Team Name</label>
                  <input
                    type="text"
                    value={settings.name}
                    onChange={(e) => handleSettingChange('name', e.target.value)}
                    className={inputClassName}
                    placeholder="e.g. BAKO Analytics Pro"
                  />
                </div>

                <div>
                  <label className={labelClassName}>Team Description</label>
                  <textarea
                    value={settings.description}
                    onChange={(e) => handleSettingChange('description', e.target.value)}
                    rows={3}
                    className={inputClassName}
                    placeholder="Tell the world about your team..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className={labelClassName}>
                      <MapPin size={16} className="inline mr-1 text-orange-500" /> Home Court
                    </label>
                    <input
                      type="text"
                      value={settings.home_court || ''}
                      onChange={(e) => handleSettingChange('home_court', e.target.value)}
                      className={inputClassName}
                      placeholder="e.g. Madison Square Garden"
                    />
                  </div>
                  <div>
                    <label className={labelClassName}>
                      <Globe size={16} className="inline mr-1 text-blue-500" /> Website
                    </label>
                    <input
                      type="url"
                      value={settings.website || ''}
                      onChange={(e) => handleSettingChange('website', e.target.value)}
                      className={inputClassName}
                      placeholder="https://team-site.com"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Visual Identity Section */}
            <div className={sectionClassName}>
              <div className="flex items-center space-x-2 mb-6">
                <Palette className="h-6 w-6 text-purple-500" />
                <h2 className="text-xl font-bold">Visual Identity</h2>
              </div>

              <div className="space-y-6">
                <div>
                  <label className={labelClassName}>
                    <ImageIcon size={16} className="inline mr-1 text-gray-400" /> Logo URL
                  </label>
                  <input
                    type="url"
                    value={settings.logo_url || ''}
                    onChange={(e) => handleSettingChange('logo_url', e.target.value)}
                    className={inputClassName}
                    placeholder="https://..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className={labelClassName}>Primary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.primary_color || '#FF5733'}
                        onChange={(e) => handleSettingChange('primary_color', e.target.value)}
                        className="h-10 w-full rounded-lg cursor-pointer border-none p-1 bg-transparent"
                      />
                      <span className="text-xs font-mono">{settings.primary_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClassName}>Secondary Color</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="color"
                        value={settings.secondary_color || '#333333'}
                        onChange={(e) => handleSettingChange('secondary_color', e.target.value)}
                        className="h-10 w-full rounded-lg cursor-pointer border-none p-1 bg-transparent"
                      />
                      <span className="text-xs font-mono">{settings.secondary_color}</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClassName}>
                      <Shirt size={16} className="inline mr-1 text-indigo-500" /> Jersey Style
                    </label>
                    <select
                      value={settings.jersey_style || 'Solid'}
                      onChange={(e) => handleSettingChange('jersey_style', e.target.value)}
                      className={inputClassName}
                    >
                      <option value="Solid">Solid</option>
                      <option value="Striped">Striped</option>
                      <option value="Gradient">Gradient</option>
                      <option value="Minimal">Minimalist</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact & Social Section */}
            <div className={sectionClassName}>
              <div className="flex items-center space-x-2 mb-6">
                <Globe className="h-6 w-6 text-green-500" />
                <h2 className="text-xl font-bold">Connect</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className={labelClassName}>Official Email</label>
                  <input
                    type="email"
                    value={settings.email || ''}
                    onChange={(e) => handleSettingChange('email', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Contact Phone</label>
                  <input
                    type="tel"
                    value={settings.phone || ''}
                    onChange={(e) => handleSettingChange('phone', e.target.value)}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    <Twitter size={16} className="inline mr-1 text-blue-400" /> Twitter Handle
                  </label>
                  <input
                    type="text"
                    value={settings.twitter_handle || ''}
                    onChange={(e) => handleSettingChange('twitter_handle', e.target.value)}
                    className={inputClassName}
                    placeholder="@teamhandle"
                  />
                </div>
                <div>
                  <label className={labelClassName}>
                    <Instagram size={16} className="inline mr-1 text-pink-500" /> Instagram Handle
                  </label>
                  <input
                    type="text"
                    value={settings.instagram_handle || ''}
                    onChange={(e) => handleSettingChange('instagram_handle', e.target.value)}
                    className={inputClassName}
                    placeholder="@teamhandle"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Rules & Limits */}
          <div className="space-y-8">
            <div className={sectionClassName}>
              <div className="flex items-center space-x-2 mb-6">
                <Timer className="h-6 w-6 text-red-500" />
                <h2 className="text-xl font-bold">Matches</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClassName}>Quarter Duration (mins)</label>
                  <input
                    type="number"
                    value={settings.competition_settings.quarterDuration}
                    onChange={(e) => handleNestedChange('competition_settings', 'quarterDuration', parseInt(e.target.value))}
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label className={labelClassName}>Max Timeouts</label>
                  <input
                    type="number"
                    value={settings.competition_settings.maxTimeouts}
                    onChange={(e) => handleNestedChange('competition_settings', 'maxTimeouts', parseInt(e.target.value))}
                    className={inputClassName}
                  />
                </div>
              </div>
            </div>

            <div className={sectionClassName}>
              <div className="flex items-center space-x-2 mb-6">
                <Users className="h-6 w-6 text-indigo-500" />
                <h2 className="text-xl font-bold">Roster</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <label className={labelClassName}>Max Players</label>
                  <input
                    type="number"
                    value={settings.roster_settings.maxPlayers}
                    onChange={(e) => handleNestedChange('roster_settings', 'maxPlayers', parseInt(e.target.value))}
                    className={inputClassName}
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <span className="font-medium">Allow Guest Players</span>
                  <button
                    onClick={() => handleNestedChange('roster_settings', 'allowGuestPlayers', !settings.roster_settings.allowGuestPlayers)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.roster_settings.allowGuestPlayers ? 'bg-orange-500' : 'bg-gray-400'
                      }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.roster_settings.allowGuestPlayers ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamSettings;