import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import api from '@/utils/axiosConfig';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Award,
  Clock,
  Save,
  AlertCircle,
  CheckCircle,
  Camera,
  Edit,
  Trophy,
  Target,
  Activity
} from 'lucide-react';

const PlayerProfile = () => {
  const { playerId } = useParams();
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    position: '',
    jerseyNumber: '',
    experience: '',
    height: '',
    weight: '',
    bio: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { isDarkMode } = useTheme();
  const { user } = useAuth();

  // If we have a playerId, we're likely in a team context viewing a player
  // If not, we're a player viewing our own profile
  const isOwnProfile = !playerId || (user && user.playerId === playerId);

  useEffect(() => {
    fetchProfile();
  }, [playerId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');

      const endpoint = playerId ? `/players/${playerId}` : '/player/profile';
      const response = await api.get(endpoint);

      // Handle the different data structures between the two endpoints
      if (playerId) {
        // Response from /players/{id}
        const data = response.data;
        setProfile({
          firstName: data.name?.split(' ')[0] || '',
          lastName: data.name?.split(' ').slice(1).join(' ') || '',
          email: data.email || '',
          phone: data.phone || '',
          address: data.address || '',
          dateOfBirth: data.date_of_birth || '',
          position: data.position || '',
          jerseyNumber: data.jersey_number || '',
          experience: data.experience_years || '',
          height: data.height_cm || '',
          weight: data.weight_kg || '',
          bio: data.bio || '',
          profileImage: data.image_url || null,
          createdAt: data.created_at
        });
      } else {
        // Response from /player/profile
        setProfile(response.data);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Failed to fetch profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSaving(true);
    setError('');
    setSuccess('');
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setSaving(false);
      return;
    }
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only image files (JPG, PNG, GIF) are allowed');
      setSaving(false);
      return;
    }
    try {
      const formData = new FormData();
      formData.append('image', file);
      const response = await api.post('/player/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        transformRequest: [(data) => data],
        timeout: 30000
      });
      if (response.data?.imageUrl) {
        setProfile(prev => ({ ...prev, profileImage: response.data.imageUrl }));
        setSuccess('Profile image updated successfully');
      } else {
        setError('Failed to upload image: Invalid server response');
      }
    } catch (err) {
      console.error('Error uploading image:', err);
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    // Mock save logic removed
    try {
      await api.put('/player/profile', profile);
      setSuccess('Profile updated successfully!');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err.response?.data?.message || 'Failed to update profile. Please try again.');
      if (err.response?.status === 401) {
        setError('Session expired. Please login again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-orange-500 to-red-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-800'}`}>
      <div className="h-2 w-full bg-gradient-to-r from-orange-400 via-red-500 to-pink-500"></div>

      <div className={`${isDarkMode ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900' : 'bg-gradient-to-r from-orange-500 to-red-600'} py-10 px-6 shadow-lg relative z-10`}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="relative">
            <div className="w-36 h-36 rounded-full border-4 border-white overflow-hidden shadow-lg">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isDarkMode ? 'bg-indigo-800' : 'bg-indigo-300'}`}>
                  <User className="h-20 w-20 text-white" />
                </div>
              )}
            </div>
            {isOwnProfile && (
              <label className="absolute bottom-2 right-2 p-2 rounded-full cursor-pointer bg-orange-400 hover:bg-orange-300 text-gray-900 shadow-lg transition-all duration-200 transform hover:scale-110">
                <Camera className="h-5 w-5" />
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
          </div>

          <div className="text-center md:text-left md:flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex items-center justify-center md:justify-start mt-2 text-indigo-100">
              <Trophy className="h-5 w-5 mr-2" />
              <span className="font-medium">BAKO Player</span>
            </div>
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center text-white">
                <Award className="h-5 w-5 mr-2 text-yellow-300" />
                <span>{profile.position || '—'} • #{profile.jerseyNumber || '—'}</span>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center text-white">
                <Activity className="h-5 w-5 mr-2 text-pink-400" />
                <span>{profile.experience || 0} years playing</span>
              </div>
            </div>
          </div>

          {isOwnProfile && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700 text-white' : 'bg-orange-400 hover:bg-orange-500 text-gray-900'} px-6 py-3 rounded-lg font-medium flex items-center shadow-lg transition-all duration-200 transform hover:scale-105`}
            >
              <Edit className="h-5 w-5 mr-2" />
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </button>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto mt-6 px-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border-l-4 border-green-500 text-green-700 rounded-md flex items-center">
            <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <h2 className="flex items-center">
                  <User className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  Personal Information
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {['firstName', 'lastName', 'email', 'phone', 'dateOfBirth', 'position', 'jerseyNumber', 'experience', 'height', 'weight'].map((field) => (
                  <div key={field}>
                    <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                      {field.replace(/([A-Z])/g, ' $1').replace(/^./, (s) => s.toUpperCase())}
                    </label>
                    <input
                      type={field === 'email' ? 'email' : field === 'dateOfBirth' ? 'date' : field === 'experience' || field === 'jerseyNumber' ? 'text' : 'text'}
                      name={field}
                      value={profile[field] || ''}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`w-full px-4 py-3 rounded-lg border ${isEditing ? (isDarkMode ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' : 'bg-gray-50 border-gray-300 focus:border-indigo-500') : isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-800'}`}
                    />
                  </div>
                ))}
              </div>
            </div>
            <div className={`mt-6 rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
                <h2 className="flex items-center">
                  <Target className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
                  About Me
                </h2>
              </div>
              <div className="p-6">
                <textarea
                  name="bio"
                  value={profile.bio || ''}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  rows="4"
                  placeholder="Tell us about your basketball journey and goals..."
                  className={`w-full px-4 py-3 rounded-lg border ${isEditing ? (isDarkMode ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-300') : isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-100 border-gray-200 text-gray-800'}`}
                />
              </div>
            </div>
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700'} text-white px-6 py-3 rounded-lg font-medium flex items-center shadow-lg ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {saving ? <><div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>Saving...</> : <><Save className="h-5 w-5 mr-2" />Save Changes</>}
                </button>
              </div>
            )}
          </form>
        </div>
        <div className="space-y-6">
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`px-6 py-4 text-xl font-semibold ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}`}>
              <h2 className="flex items-center">
                <Trophy className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                Player Highlights
              </h2>
            </div>
            <div className="p-6 space-y-4">
              <div className={`rounded-lg p-4 flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>
                  <Target className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Position</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{profile.position || 'Not set'}</p>
                </div>
              </div>
              <div className={`rounded-lg p-4 flex items-center ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                  <Award className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Experience</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>{profile.experience || '0'} years</p>
                </div>
              </div>
            </div>
          </div>
          <div className={`rounded-xl shadow-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="p-6 text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member since</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>{formatDate(profile.createdAt) || '—'}</p>
              <div className="mt-4 flex justify-center">
                <div className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}`}>
                  <Clock className="h-4 w-4 mr-2" />
                  BAKO Player
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-400 mt-8"></div>
    </div>
  );
};

export default PlayerProfile;
