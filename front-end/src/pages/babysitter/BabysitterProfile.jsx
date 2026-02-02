import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
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
  Heart,
  Star,
  Briefcase,
  Edit,
  Baby
} from 'lucide-react';

const BabysitterProfile = () => {
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    dateOfBirth: '',
    qualifications: '',
    experience: '',
    availability: '',
    bio: '',
    profileImage: null
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/babysitter/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      setError('Failed to fetch profile. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Set loading state and clear messages
    setSaving(true);
    setError('');
    setSuccess('');

    console.log('File selected:', {
      name: file.name,
      type: file.type,
      size: `${(file.size / 1024).toFixed(2)}KB`
    });

    // Validate file size
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      setSaving(false);
      return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Only image files (JPG, PNG, GIF) are allowed');
      setSaving(false);
      return;
    }

    try {
      // Create form data
      const formData = new FormData();
      formData.append('image', file);
      
      console.log('Attempting to upload image...');
      
      // Make API call with correct headers and configuration
      const response = await api.post('/babysitter/profile/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          // Don't set any other headers that might interfere with the multipart form data
        },
        // Important: These settings ensure proper file upload
        transformRequest: [function (data) {
          // Don't transform FormData - return as is
          return data;
        }],
        timeout: 30000 // 30 seconds timeout for larger files
      });
      
      console.log('Upload successful:', response.data);
      
      if (response.data && response.data.imageUrl) {
        // Update profile state with the new image URL
      setProfile(prev => ({
        ...prev,
        profileImage: response.data.imageUrl
      }));
      setSuccess('Profile image updated successfully');
      } else {
        console.error('Unexpected server response:', response.data);
        setError('Failed to upload image: Invalid server response');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      
      // Enhanced error handling with detailed information
      if (error.response) {
        // Server responded with an error status
        console.error('Server error details:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data
        });
        
        // Extract meaningful error message
        const errorMsg = error.response.data?.message || 
                         error.response.statusText || 
                         `Server error (${error.response.status})`;
                         
        setError(`Upload failed: ${errorMsg}`);
        
        if (error.response.status === 403) {
          setError('Permission denied. Make sure you are logged in and have permission to upload images.');
        }
      } else if (error.request) {
        // No response received
        console.error('No response received:', error.request);
        setError('Upload failed: No response from server. Please check your connection.');
      } else {
        // Something else went wrong
        console.error('Request error:', error.message);
        setError(`Upload failed: ${error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');
      await api.put('/babysitter/profile', profile);
      setSuccess('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again later.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-r from-blue-500 to-indigo-600">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white"></div>
      </div>
    );
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gray-900 text-white' 
        : 'bg-blue-50 text-gray-800'
    }`}>
      {/* African pattern decoration - top decoration */}
      <div className="h-2 w-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500"></div>

      {/* Profile header */}
      <div className={`
        ${isDarkMode 
          ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900' 
          : 'bg-gradient-to-r from-blue-500 to-indigo-600'
        }
        py-10 px-6 shadow-lg relative z-10
      `}>
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-6">
          {/* Profile image */}
              <div className="relative">
            <div className="w-36 h-36 rounded-full border-4 border-white overflow-hidden shadow-lg">
                  {profile.profileImage ? (
                    <img
                      src={profile.profileImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${
                  isDarkMode ? 'bg-indigo-800' : 'bg-indigo-300'
                    }`}>
                  <User className="h-20 w-20 text-white" />
                </div>
              )}
              <label className="absolute bottom-2 right-2 p-2 rounded-full cursor-pointer bg-yellow-400 hover:bg-yellow-300 text-gray-900 shadow-lg transition-all duration-200 transform hover:scale-110">
                <Camera className="h-5 w-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

          {/* Profile name and title */}
          <div className="text-center md:text-left md:flex-1">
            <h1 className="text-3xl md:text-4xl font-bold text-white">
              {profile.firstName} {profile.lastName}
            </h1>
            <div className="flex items-center justify-center md:justify-start mt-2 text-indigo-100">
              <Baby className="h-5 w-5 mr-2" />
              <span className="font-medium">Daystar Babysitter</span>
            </div>
            
            {/* Quick stats */}
            <div className="flex flex-wrap gap-4 mt-4 justify-center md:justify-start">
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center text-white">
                <Award className="h-5 w-5 mr-2 text-yellow-300" />
                <span>{profile.experience || 0} years experience</span>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur-sm px-4 py-2 rounded-lg flex items-center text-white">
                <Heart className="h-5 w-5 mr-2 text-pink-400" />
                <span>Caring Professional</span>
              </div>
            </div>
          </div>

          {/* Edit button */}
          <button 
            onClick={() => setIsEditing(!isEditing)}
            className={`
              ${isDarkMode 
                ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                : 'bg-yellow-400 hover:bg-yellow-500 text-gray-900'
              }
              px-6 py-3 rounded-lg font-medium flex items-center shadow-lg transition-all duration-200 transform hover:scale-105
            `}
          >
            <Edit className="h-5 w-5 mr-2" />
            {isEditing ? 'Cancel Edit' : 'Edit Profile'}
          </button>
        </div>
      </div>

      {/* Message alerts */}
      <div className="max-w-6xl mx-auto mt-6 px-6">
        {error && (
          <div className="mb-6 p-4 bg-red-500 bg-opacity-10 border-l-4 border-red-500 text-red-700 rounded-md flex items-center animate-fade-in">
            <AlertCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-500 bg-opacity-10 border-l-4 border-green-500 text-green-700 rounded-md flex items-center animate-fade-in">
            <CheckCircle className="h-6 w-6 mr-3 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}
      </div>

      {/* Profile content */}
      <div className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left side: Information */}
        <div className="md:col-span-2 space-y-6">
          <form onSubmit={handleSubmit}>
            <div className={`
              rounded-xl shadow-lg overflow-hidden
              ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
              <div className={`
                px-6 py-4 text-xl font-semibold
                ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
              `}>
                <h2 className="flex items-center">
                  <User className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`} />
                  Personal Information
                </h2>
              </div>
              
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* First Name */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    First Name
                  </label>
                  <input
                    type="text"
                    name="firstName"
                    value={profile.firstName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`
                      w-full px-4 py-3 rounded-lg border 
                      ${isEditing 
                        ? isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-800'
                      }
                      transition-colors
                    `}
                    required
                  />
              </div>

                {/* Last Name */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Last Name
                  </label>
                  <input
                    type="text"
                    name="lastName"
                    value={profile.lastName}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className={`
                      w-full px-4 py-3 rounded-lg border 
                      ${isEditing 
                        ? isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                          : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                        : isDarkMode
                          ? 'bg-gray-800 border-gray-700 text-gray-300'
                          : 'bg-gray-100 border-gray-200 text-gray-800'
                      }
                      transition-colors
                    `}
                    required
                  />
              </div>

                {/* Email */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Email Address
                  </label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={profile.email}
                    onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border 
                        ${isEditing 
                          ? isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                            : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }
                        transition-colors
                      `}
                    required
                  />
                </div>
              </div>

                {/* Phone */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Phone Number
                  </label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="tel"
                    name="phone"
                    value={profile.phone}
                    onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border 
                        ${isEditing 
                          ? isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                            : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }
                        transition-colors
                      `}
                    required
                  />
                </div>
              </div>

                {/* Date of Birth */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Date of Birth
                  </label>
                <div className="relative">
                  <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="date"
                    name="dateOfBirth"
                    value={profile.dateOfBirth}
                    onChange={handleInputChange}
                      disabled={!isEditing}
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border 
                        ${isEditing 
                          ? isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                            : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }
                        transition-colors
                      `}
                    required
                  />
                </div>
              </div>

                {/* Experience */}
              <div>
                  <label className={`block text-sm font-medium mb-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                    Experience (years)
                  </label>
                <div className="relative">
                    <Briefcase className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="number"
                    name="experience"
                    value={profile.experience}
                    onChange={handleInputChange}
                      disabled={!isEditing}
                    min="0"
                      className={`
                        w-full pl-10 pr-4 py-3 rounded-lg border 
                        ${isEditing 
                          ? isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                            : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                          : isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-gray-100 border-gray-200 text-gray-800'
                        }
                        transition-colors
                      `}
                    required
                  />
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section */}
            <div className={`
              mt-6 rounded-xl shadow-lg overflow-hidden
              ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
            `}>
              <div className={`
                px-6 py-4 text-xl font-semibold
                ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
              `}>
                <h2 className="flex items-center">
                  <Heart className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
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
                  placeholder="Tell us about yourself, your background, and your passion for childcare..."
                  className={`
                    w-full px-4 py-3 rounded-lg border 
                    ${isEditing 
                      ? isDarkMode 
                        ? 'bg-gray-700 border-gray-600 text-white focus:border-indigo-500' 
                        : 'bg-gray-50 border-gray-300 focus:border-indigo-500'
                      : isDarkMode
                        ? 'bg-gray-800 border-gray-700 text-gray-300'
                        : 'bg-gray-100 border-gray-200 text-gray-800'
                    }
                    transition-colors
                  `}
                ></textarea>
              </div>
            </div>

            {/* Save button */}
            {isEditing && (
              <div className="mt-6 flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className={`
                    ${isDarkMode 
                      ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                      : 'bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white'
                    }
                    px-6 py-3 rounded-lg font-medium flex items-center shadow-lg transition-all duration-200
                    ${saving ? 'opacity-70 cursor-not-allowed' : 'transform hover:scale-105'}
                  `}
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-2"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-5 w-5 mr-2" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right side: Stats and highlights */}
        <div className="space-y-6">
          {/* Quick info card */}
          <div className={`
            rounded-xl shadow-lg overflow-hidden
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          `}>
            <div className={`
              px-6 py-4 text-xl font-semibold
              ${isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'}
            `}>
              <h2 className="flex items-center">
                <Star className={`h-6 w-6 mr-2 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                Highlights
              </h2>
            </div>
            
            <div className="p-6 space-y-4">
              <div className={`
                rounded-lg p-4 flex items-center
                ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}
              `}>
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-600'}
                `}>
                  <Award className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Qualified Professional</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {profile.qualifications || 'Early Childhood Education'}
                  </p>
                </div>
              </div>

              <div className={`
                rounded-lg p-4 flex items-center
                ${isDarkMode ? 'bg-gray-700' : 'bg-purple-50'}
              `}>
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-600'}
                `}>
                  <Heart className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Passionate Caregiver</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Dedicated to children's wellbeing
                  </p>
                </div>
              </div>

              <div className={`
                rounded-lg p-4 flex items-center
                ${isDarkMode ? 'bg-gray-700' : 'bg-pink-50'}
              `}>
                <div className={`
                  w-12 h-12 rounded-full flex items-center justify-center
                  ${isDarkMode ? 'bg-pink-900 text-pink-300' : 'bg-pink-100 text-pink-600'}
                `}>
                  <Baby className="h-6 w-6" />
                </div>
                <div className="ml-4">
                  <h3 className={`font-medium ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Child Development</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Specialized in early learning
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Join date card */}
          <div className={`
            rounded-xl shadow-lg overflow-hidden
            ${isDarkMode ? 'bg-gray-800' : 'bg-white'}
          `}>
            <div className="p-6 text-center">
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Member since</p>
              <p className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-800'}`}>
                {formatDate(profile.createdAt) || 'January 2023'}
              </p>
              <div className="mt-4 flex justify-center">
                <div className={`
                  flex items-center px-4 py-2 rounded-full text-sm font-medium
                  ${isDarkMode ? 'bg-indigo-900 text-indigo-200' : 'bg-indigo-100 text-indigo-700'}
                `}>
                  <Clock className="h-4 w-4 mr-2" />
                  Trusted Daystar babysitter
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* African pattern decoration - bottom */}
      <div className="h-2 w-full bg-gradient-to-r from-pink-500 via-red-500 to-yellow-400 mt-8"></div>
    </div>
  );
};

export default BabysitterProfile; 