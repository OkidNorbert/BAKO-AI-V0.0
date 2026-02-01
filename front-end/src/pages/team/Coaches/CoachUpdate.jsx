import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import { useTheme } from '../../context/ThemeContext';
import { User, Mail, Phone, Calendar, Save } from 'lucide-react';

const CoachUpdate = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { isDarkMode } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    nextOfKin: {
      name: '',
      relationship: '',
      phoneNumber: ''
    }
  });

  useEffect(() => {
    fetchCoachDetails();
  }, [id]);

  const fetchCoachDetails = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/team/coaches/${id}`);
      const { firstName, lastName, email, phoneNumber, nextOfKin } = response.data;
      setFormData({
        firstName,
        lastName,
        email,
        phoneNumber,
        nextOfKin: {
          name: nextOfKin.name || '',
          relationship: nextOfKin.relationship || '',
          phoneNumber: nextOfKin.phoneNumber || ''
        }
      });
    } catch (error) {
      console.error('Error fetching coach details:', error);
      toast.error('Failed to fetch coach details');
      navigate('/team/coaches');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put(`/api/team/coaches/${id}`, formData);
      toast.success('Coach updated successfully');
      navigate('/team/coaches');
    } catch (error) {
      console.error('Error updating coach:', error);
      toast.error(error.response?.data?.message || 'Failed to update coach');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-purple-950' 
          : 'bg-gradient-to-b from-blue-100 to-purple-100'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-purple-950' 
        : 'bg-gradient-to-b from-blue-100 to-purple-100'
    }`}>
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          <h1 className="text-2xl font-bold mb-6">Update Coach Information</h1>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium mb-2">First Name</label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Last Name</label>
                <div className="relative">
                  <User className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Email</label>
                <div className="relative">
                  <Mail className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} />
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`w-full pl-10 pr-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
              <h2 className="text-lg font-semibold mb-4">Next of Kin Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.nextOfKin.name}
                    onChange={handleNextOfKinChange}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Relationship</label>
                  <input
                    type="text"
                    name="relationship"
                    value={formData.nextOfKin.relationship}
                    onChange={handleNextOfKinChange}
                    className={`w-full px-4 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} />
                    <input
                      type="tel"
                      name="phoneNumber"
                      value={formData.nextOfKin.phoneNumber}
                      onChange={handleNextOfKinChange}
                      className={`w-full pl-10 pr-4 py-2 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-700 text-white'
                          : 'bg-gray-50 text-gray-900'
                      }`}
                      required
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/team/coaches')}
                className={`px-6 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white hover:bg-gray-600'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                } transition-colors`}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`flex items-center px-6 py-2 rounded-md ${
                  saving
                    ? 'bg-gray-400 cursor-not-allowed'
                    : isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700'
                      : 'bg-blue-500 hover:bg-blue-600'
                } text-white transition-colors`}
              >
                <Save className="h-5 w-5 mr-2" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CoachUpdate; 