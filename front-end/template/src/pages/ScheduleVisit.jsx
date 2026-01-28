import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { Calendar, Clock, CalendarCheck, ArrowLeft, Baby, Star, Check } from 'lucide-react';
import axios from 'axios';
import api from '../utils/axiosConfig';
import { toast } from 'react-hot-toast';

const ScheduleVisit = () => {
  const { isDarkMode } = useTheme();
  const navigate = useNavigate();
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    playerAge: '',
    visitDate: '',
    visitTime: '',
    additionalInfo: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Format the date and time for better readability
      const formattedDate = new Date(formData.visitDate).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      // Create notification for admin
      const notificationData = {
        title: 'New Visit Request',
        message: `${formData.fullName} has requested a visit on ${formattedDate} at ${formData.visitTime} for a player in the ${formData.playerAge} age group. Contact: ${formData.email}, ${formData.phone}`,
        type: 'info',
        recipients: 'admin',
        priority: 'high'
      };
      
      // Use a direct axios call with the correct server port
      await axios.post('http://localhost:5000/api/public/visit-request', { 
        visitRequest: formData,
        notification: notificationData
      }, {
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      toast.success('Visit request submitted successfully!');
      
      // Show success message
      setFormSubmitted(true);
      
      // Reset form
      setFormData({
        fullName: '',
        email: '',
        phone: '',
        playerAge: '',
        visitDate: '',
        visitTime: '',
        additionalInfo: ''
      });
      
      // After 3 seconds, redirect to home page
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (error) {
      console.error('Error submitting visit request:', error);
      console.error('Error details:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      });
      
      // More descriptive error message
      const errorMsg = error.response?.data?.message || 
                      'Failed to submit your visit request. Please try again later.';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-blue-50 text-gray-900'}`}>
      {/* Hero Section */}
      <div className={`w-full py-12 px-4 ${isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'}`}>
        <div className="max-w-7xl mx-auto">
          <button 
            onClick={goBack} 
            className={`mb-4 flex items-center text-sm font-medium ${
              isDarkMode ? 'text-indigo-300 hover:text-white' : 'text-indigo-700 hover:text-indigo-900'
            }`}
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </button>
          
          <h1 className={`text-4xl md:text-5xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-800'}`}>
            Schedule a Visit
          </h1>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>
            We'd love to show you around our academy center and answer any questions you might have.
          </p>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left side - Form */}
          <div className="lg:col-span-2">
            {formSubmitted ? (
              <div className={`p-8 rounded-lg ${isDarkMode ? 'bg-green-900' : 'bg-green-100'} flex flex-col items-center justify-center text-center`}>
                <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${isDarkMode ? 'bg-green-700' : 'bg-green-200'}`}>
                  <Check className={`w-8 h-8 ${isDarkMode ? 'text-green-300' : 'text-green-600'}`} />
                </div>
                <h2 className={`text-2xl font-bold mb-2 ${isDarkMode ? 'text-white' : 'text-green-800'}`}>
                  Visit Request Submitted!
                </h2>
                <p className={`mb-4 ${isDarkMode ? 'text-green-300' : 'text-green-700'}`}>
                  Thank you for your interest in Daystar Daycare. We'll contact you shortly to confirm your visit.
                </p>
                <p className={`text-sm ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                  Redirecting you to the homepage in a few seconds...
                </p>
              </div>
            ) : (
              <div className={`p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-6 ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                  Book Your Visit
                </h2>
                
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="fullName" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      className={`block w-full px-4 py-3 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="email" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Email Address
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        className={`block w-full px-4 py-3 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                        placeholder="Your email address"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="phone" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                        className={`block w-full px-4 py-3 rounded-lg ${
                          isDarkMode 
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500' 
                            : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                        }`}
                        placeholder="Your phone number"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="playerAge" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Player's Age
                    </label>
                    <select
                      id="playerAge"
                      name="playerAge"
                      value={formData.playerAge}
                      onChange={handleChange}
                      required
                      className={`block w-full px-4 py-3 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                    >
                      <option value="">Select age group</option>
                      <option value="0-1">Infant (0-1 years)</option>
                      <option value="1-2">Toddler (1-2 years)</option>
                      <option value="2-3">Early Preschool (2-3 years)</option>
                      <option value="3-4">Preschool (3-4 years)</option>
                      <option value="4-5">Pre-K (4-5 years)</option>
                      <option value="multiple">Multiple Players</option>
                    </select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="visitDate" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Preferred Visit Date
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Calendar className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        </div>
                        <input
                          type="date"
                          id="visitDate"
                          name="visitDate"
                          value={formData.visitDate}
                          onChange={handleChange}
                          required
                          min={new Date().toISOString().split('T')[0]}
                          className={`block w-full pl-10 pr-3 py-3 rounded-lg ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="visitTime" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                        Preferred Time
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Clock className={`h-5 w-5 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-500'}`} />
                        </div>
                        <select
                          id="visitTime"
                          name="visitTime"
                          value={formData.visitTime}
                          onChange={handleChange}
                          required
                          className={`block w-full pl-10 pr-3 py-3 rounded-lg ${
                            isDarkMode 
                              ? 'bg-gray-700 border-gray-600 text-white focus:ring-indigo-500 focus:border-indigo-500' 
                              : 'bg-white border-gray-300 text-gray-900 focus:ring-indigo-500 focus:border-indigo-500'
                          }`}
                        >
                          <option value="">Select time</option>
                          <option value="9:00 AM">9:00 AM</option>
                          <option value="10:00 AM">10:00 AM</option>
                          <option value="11:00 AM">11:00 AM</option>
                          <option value="1:00 PM">1:00 PM</option>
                          <option value="2:00 PM">2:00 PM</option>
                          <option value="3:00 PM">3:00 PM</option>
                          <option value="4:00 PM">4:00 PM</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="additionalInfo" className={`block text-sm font-medium mb-1 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Additional Information
                    </label>
                    <textarea
                      id="additionalInfo"
                      name="additionalInfo"
                      rows="4"
                      value={formData.additionalInfo}
                      onChange={handleChange}
                      className={`block w-full px-4 py-3 rounded-lg ${
                        isDarkMode 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400 focus:ring-indigo-500 focus:border-indigo-500'
                      }`}
                      placeholder="Tell us any specific requests or questions you may have..."
                    ></textarea>
                  </div>
                  
                  <div>
                    <button
                      type="submit"
                      disabled={loading}
                      className={`w-full py-3 px-4 border border-transparent rounded-lg shadow-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 text-lg font-semibold transition duration-150 flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                      {loading ? (
                        <span className="inline-block h-5 w-5 mr-2 border-t-2 border-b-2 border-white rounded-full animate-spin"></span>
                      ) : (
                        <CalendarCheck className="h-5 w-5 mr-2" />
                      )}
                      {loading ? 'Submitting...' : 'Schedule My Visit'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
          
          {/* Right side - Info */}
          <div className="lg:col-span-1">
            <div className={`p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} mb-6`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Baby className="h-5 w-5 mr-2 text-indigo-500" />
                Why Visit Us?
              </h3>
              <ul className="space-y-3">
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Tour our state-of-the-art facilities
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Meet our dedicated caregivers and teachers
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Learn about our educational programs
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    See our engaging play areas and classrooms
                  </p>
                </li>
                <li className="flex items-start">
                  <div className="flex-shrink-0 h-6 w-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Star className="h-4 w-4 text-indigo-600" />
                  </div>
                  <p className={`ml-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Get answers to all your playercare questions
                  </p>
                </li>
              </ul>
            </div>
            
            <div className={`p-8 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-xl font-bold mb-4 flex items-center ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                <Clock className="h-5 w-5 mr-2 text-indigo-500" />
                Visit Hours
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Monday - Friday</span>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>9:00 AM - 4:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Saturday</span>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>9:00 AM - 12:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'} font-medium`}>Sunday</span>
                  <span className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Closed</span>
                </div>
              </div>
              
              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  <strong>Note:</strong> Visits typically last 30-45 minutes. For your convenience, we recommend scheduling at least 24 hours in advance.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleVisit; 