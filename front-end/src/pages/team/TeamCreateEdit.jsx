import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { showToast } from '../../components/shared/Toast';
import {
  Save,
  ArrowLeft,
  Users,
  MapPin,
  Globe,
  Phone,
  Mail,
  Calendar,
  Trophy,
  Target,
  Settings,
  Upload,
  X,
  Plus,
  Trash2
} from 'lucide-react';

const TeamCreateEdit = () => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const isEditing = Boolean(teamId);

  const [teamData, setTeamData] = useState({
    name: '',
    abbreviation: '',
    homeCourt: '',
    foundedYear: new Date().getFullYear(),
    city: '',
    state: '',
    country: '',
    contactInfo: {
      phone: '',
      email: '',
      website: ''
    },
    socialMedia: {
      twitter: '',
      instagram: '',
      facebook: '',
      youtube: ''
    },
    teamColors: {
      primary: '#FF6B35',
      secondary: '#004E89',
      accent: '#FFD23F'
    },
    roster: {
      maxPlayers: 15,
      currentPlayers: 0
    },
    achievements: [],
    staff: {
      headCoach: '',
      assistantCoaches: [],
      trainer: '',
      manager: ''
    }
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [logoPreview, setLogoPreview] = useState(null);
  const [newAchievement, setNewAchievement] = useState({ title: '', year: '', description: '' });
  const [newAssistantCoach, setNewAssistantCoach] = useState('');

  useEffect(() => {
    if (isEditing) {
      fetchTeamData();
    }
  }, [teamId, isEditing]);

  const fetchTeamData = async () => {
    try {
      setLoading(true);
      // In real app, this would call the API
      // const response = await adminAPI.getTeam(teamId);
      // setTeamData(response.data);

      // Mock data for editing
      const mockTeamData = {
        name: 'BAKO Warriors',
        abbreviation: 'BKW',
        homeCourt: 'BAKO Basketball Arena',
        foundedYear: 2020,
        city: 'Nairobi',
        state: '',
        country: 'Kenya',
        contactInfo: {
          phone: '+254 123 456 789',
          email: 'info@bakowarriors.com',
          website: 'www.bakowarriors.com'
        },
        socialMedia: {
          twitter: '@bakowarriors',
          instagram: '@bakowarriors',
          facebook: 'bakowarriors',
          youtube: 'bakowarriors'
        },
        teamColors: {
          primary: '#FF6B35',
          secondary: '#004E89',
          accent: '#FFD23F'
        },
        roster: {
          maxPlayers: 15,
          currentPlayers: 12
        },
        achievements: [
          { title: 'League Champions', year: '2023', description: 'Won the national basketball league' },
          { title: 'Regional Tournament', year: '2022', description: 'East Africa basketball champions' }
        ],
        staff: {
          headCoach: 'Michael Johnson',
          assistantCoaches: ['James Smith', 'David Wilson'],
          trainer: 'Sarah Davis',
          manager: 'Robert Brown'
        }
      };

      setTeamData(mockTeamData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching team data:', error);
      setError('Failed to load team data');
      setLoading(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setTeamData(prev => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value
        }
      }));
    } else {
      setTeamData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const addAchievement = () => {
    if (newAchievement.title && newAchievement.year) {
      setTeamData(prev => ({
        ...prev,
        achievements: [...prev.achievements, { ...newAchievement }]
      }));
      setNewAchievement({ title: '', year: '', description: '' });
    }
  };

  const removeAchievement = (index) => {
    setTeamData(prev => ({
      ...prev,
      achievements: prev.achievements.filter((_, i) => i !== index)
    }));
  };

  const addAssistantCoach = () => {
    if (newAssistantCoach.trim()) {
      setTeamData(prev => ({
        ...prev,
        staff: {
          ...prev.staff,
          assistantCoaches: [...prev.staff.assistantCoaches, newAssistantCoach.trim()]
        }
      }));
      setNewAssistantCoach('');
    }
  };

  const removeAssistantCoach = (index) => {
    setTeamData(prev => ({
      ...prev,
      staff: {
        ...prev.staff,
        assistantCoaches: prev.staff.assistantCoaches.filter((_, i) => i !== index)
      }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError('');

      // Validation
      if (!teamData.name.trim()) {
        setError('Team name is required');
        setLoading(false);
        return;
      }

      if (!teamData.abbreviation.trim() || teamData.abbreviation.length > 3) {
        setError('Team abbreviation is required (max 3 characters)');
        setLoading(false);
        return;
      }

      // In real app, this would call the API
      if (isEditing) {
        // await adminAPI.updateTeam(teamId, teamData);
        showToast('Team updated successfully!', 'success');
      } else {
        // await adminAPI.createTeam(teamData);
        showToast('Team created successfully!', 'success');
      }

      navigate('/team/settings');
    } catch (error) {
      console.error('Error saving team:', error);
      setError('Failed to save team. Please try again.');
      setLoading(false);
    }
  };

  if (loading && isEditing) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950'
        : 'bg-gradient-to-b from-blue-50 to-indigo-100'
        }`}>
        <div className="flex flex-col items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-orange-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>
            Loading team data...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode
      ? 'bg-gradient-to-b from-gray-900 to-purple-950'
      : 'bg-gradient-to-b from-blue-50 to-purple-100'
      }`}>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/team/settings')}
            className={`flex items-center space-x-2 mb-4 ${isDarkMode ? 'text-gray-300 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
          >
            <ArrowLeft size={20} />
            <span>Back to Settings</span>
          </button>

          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {isEditing ? 'Edit Team' : 'Create New Team'}
          </h1>
          <p className={`mt-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {isEditing ? 'Update your team information' : 'Set up your basketball team profile'}
          </p>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'}`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">

          {/* Basic Information */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Users className="mr-2" size={24} />
              Basic Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Team Name *
                </label>
                <input
                  type="text"
                  value={teamData.name}
                  onChange={(e) => handleInputChange(null, 'name', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter team name"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Abbreviation *
                </label>
                <input
                  type="text"
                  value={teamData.abbreviation}
                  onChange={(e) => handleInputChange(null, 'abbreviation', e.target.value.toUpperCase())}
                  maxLength={3}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="e.g., BAK"
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Home Court
                </label>
                <input
                  type="text"
                  value={teamData.homeCourt}
                  onChange={(e) => handleInputChange(null, 'homeCourt', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter home court name"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Founded Year
                </label>
                <input
                  type="number"
                  value={teamData.foundedYear}
                  onChange={(e) => handleInputChange(null, 'foundedYear', parseInt(e.target.value))}
                  min="1900"
                  max={new Date().getFullYear()}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <MapPin className="mr-2" size={24} />
              Location
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  City
                </label>
                <input
                  type="text"
                  value={teamData.city}
                  onChange={(e) => handleInputChange(null, 'city', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter city"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  State/Province
                </label>
                <input
                  type="text"
                  value={teamData.state}
                  onChange={(e) => handleInputChange(null, 'state', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter state/province"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Country
                </label>
                <input
                  type="text"
                  value={teamData.country}
                  onChange={(e) => handleInputChange(null, 'country', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="Enter country"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Phone className="mr-2" size={24} />
              Contact Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Phone
                </label>
                <input
                  type="tel"
                  value={teamData.contactInfo.phone}
                  onChange={(e) => handleInputChange('contactInfo', 'phone', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="+254 123 456 789"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Email
                </label>
                <input
                  type="email"
                  value={teamData.contactInfo.email}
                  onChange={(e) => handleInputChange('contactInfo', 'email', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="info@team.com"
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Website
                </label>
                <input
                  type="url"
                  value={teamData.contactInfo.website}
                  onChange={(e) => handleInputChange('contactInfo', 'website', e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg border ${isDarkMode
                    ? 'bg-gray-700 border-gray-600 text-white'
                    : 'bg-white border-gray-300 text-gray-900'
                    } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  placeholder="www.teamwebsite.com"
                />
              </div>
            </div>
          </div>

          {/* Team Colors */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className={`text-xl font-semibold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
              <Target className="mr-2" size={24} />
              Team Colors
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Primary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={teamData.teamColors.primary}
                    onChange={(e) => handleInputChange('teamColors', 'primary', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={teamData.teamColors.primary}
                    onChange={(e) => handleInputChange('teamColors', 'primary', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Secondary Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={teamData.teamColors.secondary}
                    onChange={(e) => handleInputChange('teamColors', 'secondary', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={teamData.teamColors.secondary}
                    onChange={(e) => handleInputChange('teamColors', 'secondary', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
              </div>

              <div>
                <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Accent Color
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="color"
                    value={teamData.teamColors.accent}
                    onChange={(e) => handleInputChange('teamColors', 'accent', e.target.value)}
                    className="h-10 w-20 rounded border border-gray-300"
                  />
                  <input
                    type="text"
                    value={teamData.teamColors.accent}
                    onChange={(e) => handleInputChange('teamColors', 'accent', e.target.value)}
                    className={`flex-1 px-3 py-2 rounded-lg border ${isDarkMode
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-orange-500`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/team/settings')}
              className={`px-6 py-3 rounded-lg font-medium transition-colors ${isDarkMode
                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className={`px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2 ${loading
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isDarkMode
                    ? 'bg-orange-600 hover:bg-orange-700 text-white'
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
            >
              <Save size={20} />
              <span>{loading ? 'Saving...' : (isEditing ? 'Update Team' : 'Create Team')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TeamCreateEdit;
