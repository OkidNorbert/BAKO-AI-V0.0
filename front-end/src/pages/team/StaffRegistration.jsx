import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { Copy, RefreshCw } from 'lucide-react';

const CoachRegistration = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    phoneNumber: '',
    nin: '',
    dateOfBirth: '',
    nextOfKin: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });
  const [useGeneratedPassword, setUseGeneratedPassword] = useState(true);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [registeredUserInfo, setRegisteredUserInfo] = useState(null);

  const [errors, setErrors] = useState({});

  // Function to generate a secure password
  const generateSecurePassword = () => {
    const length = 12;
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+';
    let password = '';
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
  };

  // Generate a password on component mount
  useEffect(() => {
    if (useGeneratedPassword) {
      const newPassword = generateSecurePassword();
      setFormData(prev => ({...prev, password: newPassword}));
    }
  }, [useGeneratedPassword]);

  const validateForm = () => {
    const newErrors = {};
    
    // Basic validation
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    
    // Email is optional, but if provided, it must be valid
    if (formData.email.trim() && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = 'Phone number is required';
    if (!formData.nin.trim()) newErrors.nin = 'National Identification Number (NIN) is required';
    
    // Password validation
    if (!useGeneratedPassword && (!formData.password || formData.password.length < 8)) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Date of birth validation
    if (!formData.dateOfBirth) {
      newErrors.dateOfBirth = 'Date of birth is required';
    } else {
      // Age validation (21-35 years)
      const dob = new Date(formData.dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const monthDiff = today.getMonth() - dob.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      
      if (age < 21 || age > 35) {
        newErrors.dateOfBirth = 'Coach must be between 21-35 years old';
      }
    }
    
    // Next of kin validation
    if (!formData.nextOfKin.name.trim()) {
      newErrors['nextOfKin.name'] = 'Next of kin name is required';
    }
    if (!formData.nextOfKin.relationship.trim()) {
      newErrors['nextOfKin.relationship'] = 'Next of kin relationship is required';
    }
    if (!formData.nextOfKin.phoneNumber.trim()) {
      newErrors['nextOfKin.phoneNumber'] = 'Next of kin phone number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleNextOfKinChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      nextOfKin: {
        ...prev.nextOfKin,
        [name]: value
      }
    }));
    
    // Clear error when field is modified
    if (errors[`nextOfKin.${name}`]) {
      setErrors(prev => ({
        ...prev,
        [`nextOfKin.${name}`]: undefined
      }));
    }
  };

  const handlePasswordToggle = () => {
    setUseGeneratedPassword(!useGeneratedPassword);
    
    if (!useGeneratedPassword) {
      // Switching to generated password
      const newPassword = generateSecurePassword();
      setFormData(prev => ({...prev, password: newPassword}));
    } else {
      // Switching to manual password
      setFormData(prev => ({...prev, password: ''}));
    }
  };

  const handleRegeneratePassword = () => {
    const newPassword = generateSecurePassword();
    setFormData(prev => ({...prev, password: newPassword}));
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        toast.success('Copied to clipboard!');
      })
      .catch(err => {
        console.error('Failed to copy: ', err);
        toast.error('Failed to copy to clipboard');
      });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);

    try {
      // Create a properly formatted payload
      const payload = {
        ...formData,
        // Ensure phone field is properly named
        phone: formData.phoneNumber,
        // Ensure nextOfKin is properly formatted
        nextOfKin: {
          name: formData.nextOfKin.name,
          relationship: formData.nextOfKin.relationship,
          phoneNumber: formData.nextOfKin.phoneNumber
        }
      };

      const response = await api.post(
        '/admin/coachs/register',
        payload
      );

      toast.success('Coach registered successfully');
      
      // Store the registered user info for display
      setRegisteredUserInfo({
        name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email || 'Not provided',
        nin: formData.nin,
        password: formData.password,
        username: response.data.tempCredentials?.username || `coach-${formData.nin.slice(-6)}` // Include username for login
      });
      
      // Show the password modal
      setShowPasswordModal(true);
      
      // Don't navigate away immediately - let user see the password
      // navigate('/admin/coachs');
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to register coach';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const inputClassName = (fieldName) => `
    mt-1 block w-full rounded-md shadow-sm
    ${isDarkMode 
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
      : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
    }
    focus:ring-primary-500 focus:border-primary-500
    ${errors[fieldName] ? 'border-red-500' : ''}
  `;

  const labelClassName = (fieldName) => `
    block text-sm font-medium
    ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}
    ${errors[fieldName] ? 'text-red-500' : ''}
  `;

  return (
    <div className={`max-w-5xl mx-auto px-4 py-8 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 right-0 bottom-0 -z-10 overflow-hidden">
        <div className={`w-72 h-72 rounded-full absolute -top-20 -left-20 ${
          isDarkMode ? 'bg-purple-900/20' : 'bg-blue-200/30'
        }`}></div>
        <div className={`w-96 h-96 rounded-full absolute -bottom-48 -right-48 ${
          isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-100/30'
        }`}></div>
      </div>

      {/* Floating decoration elements */}
      <div className="relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-full">
          <div className={`w-20 h-20 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute top-10 -left-10 opacity-20 animate-float-slow`}></div>
          <div className={`w-16 h-16 ${isDarkMode ? 'bg-pink-600' : 'bg-pink-400'} rounded-full absolute top-40 right-10 opacity-20 animate-float-medium`}></div>
          <div className={`w-12 h-12 ${isDarkMode ? 'bg-blue-600' : 'bg-blue-400'} rounded-full absolute bottom-10 left-1/4 opacity-20 animate-float-fast`}></div>
        </div>
      </div>

      <div className="mb-8">
        <h1 className={`text-3xl font-bold ${
          isDarkMode 
            ? 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 via-amber-300 to-orange-400' 
            : 'text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-teal-500 to-blue-600'
        } animate-gradient mb-2`}>Register New Coach</h1>
        <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-600'} max-w-3xl`}>
          Create an account for a new coach with their personal and professional details.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Personal Information */}
        <div className={`shadow-xl rounded-2xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-purple-900/30' 
            : 'bg-white/90 border border-teal-100'
        }`}>
          <div className={`p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-teal-900/30 to-indigo-900/30' 
              : 'bg-gradient-to-r from-teal-50 to-blue-50'
          } border-b ${
            isDarkMode ? 'border-gray-700' : 'border-teal-100'
          }`}>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-teal-300' : 'text-teal-700'
            }`}>Personal Information</h2>
          </div>
          
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.firstName ? 'text-red-500' : ''}`}>First Name*</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.firstName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter first name"
              />
              {errors.firstName && (
                <p className="mt-1.5 text-sm text-red-500">{errors.firstName}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.lastName ? 'text-red-500' : ''}`}>Last Name*</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.lastName ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter last name"
              />
              {errors.lastName && (
                <p className="mt-1.5 text-sm text-red-500">{errors.lastName}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.email ? 'text-red-500' : ''}`}>Email (Optional)</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.email ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter email"
              />
              {errors.email && (
                <p className="mt-1.5 text-sm text-red-500">{errors.email}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.phoneNumber ? 'text-red-500' : ''}`}>Phone Number*</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.phoneNumber ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {errors.phoneNumber && (
                <p className="mt-1.5 text-sm text-red-500">{errors.phoneNumber}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.nin ? 'text-red-500' : ''}`}>National Identification Number (NIN)*</label>
              <input
                type="text"
                name="nin"
                value={formData.nin}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.nin ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter NIN"
              />
              {errors.nin && (
                <p className="mt-1.5 text-sm text-red-500">{errors.nin}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors.dateOfBirth ? 'text-red-500' : ''}`}>Date of Birth* (Age must be 21-35)</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors.dateOfBirth ? 'border-red-500 focus:ring-red-500' : ''}`}
              />
              {errors.dateOfBirth && (
                <p className="mt-1.5 text-sm text-red-500">{errors.dateOfBirth}</p>
              )}
            </div>
          </div>
        </div>
        
        {/* Account Information section header */}
        <div className={`shadow-xl rounded-2xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-purple-900/30' 
            : 'bg-white/90 border border-teal-100'
        }`}>
          <div className={`p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-yellow-900/30 to-amber-900/30' 
              : 'bg-gradient-to-r from-yellow-50 to-amber-50'
          } border-b ${
            isDarkMode ? 'border-gray-700' : 'border-amber-100'
          }`}>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-yellow-300' : 'text-amber-700'
            }`}>Account Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className={`block text-sm font-medium mb-1.5 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                } ${errors.password ? 'text-red-500' : ''}`}>Password</label>
                <div className="flex items-center">
                  <label className="text-xs mr-2">Auto-generate</label>
                  <div 
                    onClick={handlePasswordToggle}
                    className={`relative inline-flex items-center h-5 rounded-full w-10 cursor-pointer transition-colors ease-in-out duration-200 ${
                      useGeneratedPassword 
                        ? isDarkMode ? 'bg-indigo-600' : 'bg-indigo-500' 
                        : isDarkMode ? 'bg-gray-600' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`inline-block w-4 h-4 transform rounded-full bg-white transition ease-in-out duration-200 ${
                        useGeneratedPassword ? 'translate-x-5' : 'translate-x-1'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              {useGeneratedPassword ? (
                <div className="relative">
                  <input
                    type="text"
                    value={formData.password}
                    readOnly
                    className={`${inputClassName('password')} pr-20`}
                  />
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex space-x-1">
                    <button
                      type="button"
                      onClick={handleRegeneratePassword}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600 text-gray-300'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(formData.password)}
                      className={`p-1 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600 text-gray-300'
                          : 'hover:bg-gray-200 text-gray-600'
                      }`}
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ) : (
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={inputClassName('password')}
                  required
                />
              )}
              
              <p className="text-xs mt-1 text-gray-500">
                {useGeneratedPassword 
                  ? "A secure password has been generated automatically." 
                  : "Password must be at least 8 characters."}
              </p>
              
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">{errors.password}</p>
              )}
            </div>
          </div>
        </div>

        {/* Next of Kin section header */}
        <div className={`shadow-xl rounded-2xl overflow-hidden ${
          isDarkMode 
            ? 'bg-gradient-to-b from-gray-800/80 to-gray-900/80 border border-purple-900/30' 
            : 'bg-white/90 border border-teal-100'
        }`}>
          <div className={`p-6 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-pink-900/30 to-purple-900/30' 
              : 'bg-gradient-to-r from-pink-50 to-purple-50'
          } border-b ${
            isDarkMode ? 'border-gray-700' : 'border-purple-100'
          }`}>
            <h2 className={`text-2xl font-bold ${
              isDarkMode ? 'text-pink-300' : 'text-purple-700'
            }`}>Next of Kin Information</h2>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors['nextOfKin.name'] ? 'text-red-500' : ''}`}>Name*</label>
              <input
                type="text"
                name="name"
                value={formData.nextOfKin.name}
                onChange={handleNextOfKinChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors['nextOfKin.name'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter next of kin name"
              />
              {errors['nextOfKin.name'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['nextOfKin.name']}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors['nextOfKin.relationship'] ? 'text-red-500' : ''}`}>Relationship*</label>
              <input
                type="text"
                name="relationship"
                value={formData.nextOfKin.relationship}
                onChange={handleNextOfKinChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors['nextOfKin.relationship'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter relationship"
              />
              {errors['nextOfKin.relationship'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['nextOfKin.relationship']}</p>
              )}
            </div>
            <div>
              <label className={`block text-sm font-medium mb-1.5 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              } ${errors['nextOfKin.phoneNumber'] ? 'text-red-500' : ''}`}>Phone Number*</label>
              <input
                type="tel"
                name="phoneNumber"
                value={formData.nextOfKin.phoneNumber}
                onChange={handleNextOfKinChange}
                className={`w-full px-4 py-2.5 rounded-xl shadow-sm ${
                  isDarkMode
                    ? 'bg-gray-700/90 border-gray-600 text-white focus:ring-2 focus:ring-teal-500 focus:border-transparent'
                    : 'bg-white border-teal-200 text-gray-900 focus:ring-2 focus:ring-teal-400 focus:border-transparent'
                } ${errors['nextOfKin.phoneNumber'] ? 'border-red-500 focus:ring-red-500' : ''}`}
                placeholder="Enter phone number"
              />
              {errors['nextOfKin.phoneNumber'] && (
                <p className="mt-1.5 text-sm text-red-500">{errors['nextOfKin.phoneNumber']}</p>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-4 mt-8">
          <button
            type="button"
            onClick={() => navigate('/admin/users')}
            className={`px-6 py-3 rounded-full transition-all duration-200 transform hover:scale-105 ${
              isDarkMode 
                ? 'bg-gray-700 text-white hover:bg-gray-600' 
                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={`px-6 py-3 rounded-full shadow-lg transition-all duration-200 transform hover:scale-105 ${
              isDarkMode 
                ? 'bg-gradient-to-r from-green-600 to-teal-600 text-white hover:from-green-700 hover:to-teal-700' 
                : 'bg-gradient-to-r from-green-500 to-teal-500 text-white hover:from-green-600 hover:to-teal-600'
            }`}
            disabled={loading}
          >
            {loading ? 'Registering...' : 'Register Coach'}
          </button>
        </div>
      </form>

      {/* Password Display Modal */}
      {showPasswordModal && registeredUserInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 max-w-md w-full ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-2">Coach Registered Successfully</h2>
              <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Please save these credentials in a secure place. The password will only be shown once.
              </p>
            </div>
            
            <div className={`p-4 rounded-md mb-4 ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Name:</p>
                <p>{registeredUserInfo.name}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Email:</p>
                <p>{registeredUserInfo.email}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">NIN:</p>
                <p>{registeredUserInfo.nin}</p>
              </div>
              <div className="mb-3">
                <p className="text-sm font-medium mb-1">Username (for login):</p>
                <div className="flex justify-between items-center">
                  <p className="font-mono">{registeredUserInfo.username}</p>
                  <button
                    onClick={() => copyToClipboard(registeredUserInfo.username)}
                    className={`p-1 rounded-md text-xs flex items-center ${
                      isDarkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <div className="flex justify-between items-center mb-1">
                  <p className="text-sm font-medium">Password:</p>
                  <button
                    onClick={() => copyToClipboard(registeredUserInfo.password)}
                    className={`p-1 rounded-md text-xs flex items-center ${
                      isDarkMode
                        ? 'bg-gray-600 text-gray-300 hover:bg-gray-500'
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <Copy className="h-3 w-3 mr-1" />
                    Copy
                  </button>
                </div>
                <div className={`font-mono text-sm p-2 rounded ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white border border-gray-300'
                }`}>
                  {registeredUserInfo.password}
                </div>
              </div>
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  navigate('/admin/coachs');
                }}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                }`}
              >
                Go to Coach List
              </button>
              <button
                onClick={() => setShowPasswordModal(false)}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    : 'bg-indigo-500 hover:bg-indigo-600 text-white'
                }`}
              >
                Register Another
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachRegistration; 