import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Phone, MapPin, Edit, Save, X, Camera, CheckCircle, Sparkles } from 'lucide-react';
import { adminAPI } from '../../services/api';
import toast from 'react-hot-toast';

// Function to compress image
const compressImage = async (imageFile, maxSizeMB = 0.8) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(imageFile);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        const maxSize = 800; // max dimension
        if (width > height && width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        } else if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to blob with quality setting
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas to Blob conversion failed'));
              return;
            }
            resolve(blob);
          },
          'image/jpeg',
          0.7 // Quality (0.7 = 70% quality)
        );
      };
      img.onerror = (error) => reject(error);
    };
    reader.onerror = (error) => reject(error);
  });
};

const AdminProfile = () => {
  const { user, updateUser } = useAuth();
  const { isDarkMode } = useTheme();
  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);
  const [profile, setProfile] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    address: '',
    role: 'admin',
    profilePicture: null
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [previewImage, setPreviewImage] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setIsLoading(true);

        // Fetch profile from API
        const response = await adminAPI.getProfile();
        const adminData = response.data;

        if (adminData) {
          // Set profile data from API response
          setProfile({
            firstName: adminData.firstName || '',
            lastName: adminData.lastName || '',
            email: adminData.email || '',
            phoneNumber: adminData.phone || '',
            address: adminData.address || '',
            role: adminData.role || 'admin',
            profilePicture: adminData.profilePicture || null
          });
          setPreviewImage(adminData.profilePicture || null);
        } else {
          // Fallback to user context if API doesn't return data
          if (user) {
            // Split the name into first and last name if available
            const nameParts = user.name ? user.name.split(' ') : ['Admin', 'User'];
            const firstName = nameParts[0] || 'Admin';
            const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

            setProfile({
              firstName: firstName,
              lastName: lastName,
              email: user.email || 'admin@daystar.com',
              phoneNumber: user.phoneNumber || '',
              address: user.address || '',
              role: user.role || 'admin',
              profilePicture: user.profilePicture || null
            });
            setPreviewImage(user.profilePicture || null);
          }
        }
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load profile data');
        setIsLoading(false);

        // Fallback to user context if API call fails
        if (user) {
          const nameParts = user.name ? user.name.split(' ') : ['Admin', 'User'];
          const firstName = nameParts[0] || 'Admin';
          const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : 'User';

          setProfile({
            firstName: firstName,
            lastName: lastName,
            email: user.email || 'admin@daystar.com',
            phoneNumber: user.phoneNumber || '',
            address: user.address || '',
            role: user.role || 'admin',
            profilePicture: user.profilePicture || null
          });
          setPreviewImage(user.profilePicture || null);
        }
      }
    };

    fetchProfile();
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit for initial check
        setError('Image size should be less than 10MB');
        return;
      }

      try {
        setUploadProgress(10);
        // Compress the image to reduce size
        const compressedBlob = await compressImage(file);
        setUploadProgress(50);

        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
          setProfile(prev => ({
            ...prev,
            profilePicture: reader.result
          }));
          setUploadProgress(100);

          // Reset progress bar after a delay
          setTimeout(() => {
            setUploadProgress(0);
          }, 1000);
        };
        reader.readAsDataURL(compressedBlob);
      } catch (err) {
        console.error('Error processing image:', err);
        setError('Failed to process the image. Please try a different image.');
        setUploadProgress(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);

      // Prepare the profile data for the API
      const profileData = {
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        // Only send the profile picture if it's changed (to reduce payload size)
        profilePicture: profile.profilePicture
      };

      // Call the API to update the profile
      const response = await adminAPI.updateProfile(profileData);

      // Update the user context with the new profile data
      const updatedUserData = {
        name: `${profile.firstName} ${profile.lastName}`,
        email: profile.email,
        phoneNumber: profile.phoneNumber,
        address: profile.address,
        profilePicture: profile.profilePicture
      };

      updateUser(updatedUserData);

      // Update local storage with new user data
      localStorage.setItem('userName', `${profile.firstName} ${profile.lastName}`);
      localStorage.setItem('userProfilePicture', profile.profilePicture);

      // Show success message with toast
      toast.success('Profile updated successfully!');
      setSuccessMessage('Profile updated successfully');
      setTimeout(() => setSuccessMessage(''), 3000);

      // Exit edit mode
      setIsEditing(false);
      setIsLoading(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      toast.error(err.response?.data?.message || 'Failed to update profile');
      setError(err.response?.data?.message || 'Failed to update profile');
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className={`animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 ${isDarkMode ? 'border-yellow-400' : 'border-purple-600'
          }`}></div>
      </div>
    );
  }

  return (
    <div className={`max-w-5xl mx-auto ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 right-0 bottom-0 -z-10 overflow-hidden">
        <div className={`w-64 h-64 rounded-full absolute -top-20 -left-20 ${isDarkMode ? 'bg-purple-900/20' : 'bg-blue-200/30'
          }`}></div>
        <div className={`w-96 h-96 rounded-full absolute -bottom-48 -right-48 ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-100/30'
          }`}></div>
      </div>

      {/* Floating decoration elements */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-full">
          <div className={`w-20 h-20 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute top-10 -left-10 opacity-20 animate-float-slow`}></div>
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'} rounded-full absolute top-40 right-10 opacity-20 animate-float-medium`}></div>
          <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'} rounded-full absolute bottom-10 left-1/4 opacity-20 animate-float-fast`}></div>
          <div className={`w-24 h-24 ${isDarkMode ? 'bg-green-600' : 'bg-green-300'} rounded-full absolute -bottom-10 right-1/3 opacity-10 animate-bounce-slow`}></div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
        <div className="flex items-center">
          <Sparkles className={`h-8 w-8 mr-3 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'}`} />
          <h1 className={`text-3xl font-bold ${isDarkMode
              ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400'
              : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500'
            } animate-gradient`}>
            Team Admin Profile
          </h1>
        </div>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className={`flex items-center px-5 py-2.5 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${isDarkMode
                ? 'bg-gradient-to-r from-yellow-500 to-amber-600 text-gray-900 hover:from-yellow-600 hover:to-amber-700'
                : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600'
              }`}
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit Profile
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setPreviewImage(profile.profilePicture);
              }}
              className={`flex items-center px-5 py-2.5 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${isDarkMode
                  ? 'bg-gray-700 text-white hover:bg-gray-600'
                  : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
            >
              <X className="h-5 w-5 mr-2" />
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className={`flex items-center px-5 py-2.5 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${isDarkMode
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
                }`}
            >
              <Save className="h-5 w-5 mr-2" />
              Save Changes
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-2xl shadow-md border border-red-200 animate-fade-in">
          {error}
        </div>
      )}

      {successMessage && (
        <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-2xl shadow-md border border-green-200 flex items-center animate-fade-in">
          <CheckCircle className="h-6 w-6 mr-3 text-green-500" />
          {successMessage}
        </div>
      )}

      <div className={`rounded-2xl shadow-xl overflow-hidden transition-all duration-300 ${isDarkMode
          ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-purple-900/50'
          : 'bg-white/90 border border-purple-100 shadow-purple-100/20'
        }`}>
        {/* Header section with profile image */}
        <div className={`p-8 ${isDarkMode
            ? 'bg-gradient-to-r from-purple-900/30 to-indigo-900/30'
            : 'bg-gradient-to-r from-purple-50 to-pink-50'
          } border-b ${isDarkMode ? 'border-gray-700' : 'border-purple-100'
          }`}>
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className={`h-36 w-36 rounded-full overflow-hidden 
                ${isDarkMode
                  ? 'bg-gray-700 ring-4 ring-yellow-500/50'
                  : 'bg-purple-100 ring-4 ring-purple-200'
                } shadow-xl transition-all duration-300 group-hover:shadow-2xl`}>
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Profile"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <User className={`h-20 w-20 ${isDarkMode ? 'text-gray-500' : 'text-purple-300'
                      }`} />
                  </div>
                )}
              </div>

              {/* Upload progress indicator */}
              {uploadProgress > 0 && (
                <div className="absolute bottom-0 left-0 right-0 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              {isEditing && (
                <>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className={`absolute bottom-2 right-2 p-3 rounded-full 
                      ${isDarkMode
                        ? 'bg-yellow-500 text-gray-900 hover:bg-yellow-400'
                        : 'bg-purple-600 text-white hover:bg-purple-700'
                      } shadow-lg transition-all duration-200 transform hover:scale-110`}
                    title="Upload profile picture"
                  >
                    <Camera className="h-5 w-5" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </>
              )}

              {/* Decorative ring */}
              <div className={`absolute -inset-1 rounded-full ${isDarkMode
                  ? 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20'
                  : 'bg-gradient-to-r from-purple-200/50 to-pink-200/50'
                } -z-10 blur-sm animate-pulse-slow`}></div>
            </div>

            <div className="flex flex-col text-center md:text-left">
              <h2 className={`text-3xl font-bold mb-2 ${isDarkMode
                  ? 'text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-yellow-400'
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-purple-700 to-pink-600'
                }`}>
                {isEditing ? (
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      name="firstName"
                      value={profile.firstName}
                      onChange={handleChange}
                      placeholder="First Name"
                      className={`px-4 py-2.5 border rounded-xl ${isDarkMode
                          ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-purple-200 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-purple-400'
                        } shadow-sm`}
                    />
                    <input
                      type="text"
                      name="lastName"
                      value={profile.lastName}
                      onChange={handleChange}
                      placeholder="Last Name"
                      className={`px-4 py-2.5 border rounded-xl ${isDarkMode
                          ? 'bg-gray-700/80 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-purple-200 text-gray-900 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-purple-400'
                        } shadow-sm`}
                    />
                  </div>
                ) : (
                  `${profile.firstName} ${profile.lastName}`
                )}
              </h2>
              <div className={`flex items-center justify-center md:justify-start mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-purple-600'
                }`}>
                <span className={`px-4 py-1.5 text-sm rounded-full ${isDarkMode
                    ? 'bg-gray-800/80 text-yellow-400 border border-yellow-500/30'
                    : 'bg-purple-100 text-purple-700 font-medium'
                  }`}>
                  {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile information cards */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`p-5 rounded-xl shadow-sm transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${isDarkMode
                ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-800/30'
                : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/80'
              }`}>
              <div className="flex items-start">
                <Mail className={`h-6 w-6 mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'
                  }`} />
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                    Email
                  </p>
                  {isEditing ? (
                    <input
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleChange}
                      className={`w-full mt-1.5 px-4 py-2.5 border rounded-xl ${isDarkMode
                          ? 'bg-gray-800/90 border-gray-700 text-white'
                          : 'bg-white border-purple-200 text-gray-900'
                        } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-purple-400'
                        } shadow-sm`}
                    />
                  ) : (
                    <p className={`mt-1.5 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
                      } font-medium`}>
                      {profile.email}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl shadow-sm transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${isDarkMode
                ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-800/30'
                : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/80'
              }`}>
              <div className="flex items-start">
                <Phone className={`h-6 w-6 mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'
                  }`} />
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                    Phone Number
                  </p>
                  {isEditing ? (
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={profile.phoneNumber}
                      onChange={handleChange}
                      className={`w-full mt-1.5 px-4 py-2.5 border rounded-xl ${isDarkMode
                          ? 'bg-gray-800/90 border-gray-700 text-white'
                          : 'bg-white border-purple-200 text-gray-900'
                        } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-purple-400'
                        } shadow-sm`}
                    />
                  ) : (
                    <p className={`mt-1.5 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
                      } font-medium`}>
                      {profile.phoneNumber || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-xl shadow-sm transform transition-all duration-300 hover:shadow-md hover:-translate-y-1 ${isDarkMode
                ? 'bg-gradient-to-br from-purple-900/40 to-indigo-900/40 border border-purple-800/30'
                : 'bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100/80'
              }`}>
              <div className="flex items-start">
                <MapPin className={`h-6 w-6 mt-1 ${isDarkMode ? 'text-yellow-400' : 'text-purple-500'
                  }`} />
                <div className="ml-3 flex-1">
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                    Address
                  </p>
                  {isEditing ? (
                    <input
                      type="text"
                      name="address"
                      value={profile.address}
                      onChange={handleChange}
                      className={`w-full mt-1.5 px-4 py-2.5 border rounded-xl ${isDarkMode
                          ? 'bg-gray-800/90 border-gray-700 text-white'
                          : 'bg-white border-purple-200 text-gray-900'
                        } focus:outline-none focus:ring-2 ${isDarkMode ? 'focus:ring-yellow-500' : 'focus:ring-purple-400'
                        } shadow-sm`}
                    />
                  ) : (
                    <p className={`mt-1.5 text-lg ${isDarkMode ? 'text-white' : 'text-gray-900'
                      } font-medium`}>
                      {profile.address || 'Not specified'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional info or footer for the profile section */}
            <div className={`p-5 rounded-xl shadow-sm ${isDarkMode
                ? 'bg-gradient-to-br from-amber-900/30 to-yellow-900/30 border border-amber-800/30'
                : 'bg-gradient-to-br from-amber-50 to-yellow-50 border border-amber-100/80'
              }`}>
              <div className="text-center">
                <h3 className={`font-medium text-lg mb-2 ${isDarkMode ? 'text-yellow-400' : 'text-amber-700'
                  }`}>BAKO Analytics</h3>
                <p className={isDarkMode ? 'text-gray-300' : 'text-gray-700'}>
                  Organization management portal
                </p>
                <div className="mt-3 text-xs text-center">
                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    Last login: {new Date().toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile; 