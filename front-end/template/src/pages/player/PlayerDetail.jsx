import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { coachAPI } from '../../services/api';
import {
  AlertCircle,
  Calendar,
  Clock,
  ChevronLeft,
  User,
  Phone,
  Mail,
  Heart,
  AlertTriangle,
  FileText,
  CheckCircle,
  PlusCircle,
  Activity as ActivityIcon
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const PlayerDetail = () => {
  const { id } = useParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({
    type: 'meal',
    notes: ''
  });
  const [showAddActivityForm, setShowAddActivityForm] = useState(false);
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchPlayerDetails();
  }, [id]);

  const fetchPlayerDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await coachAPI.getPlayerById(id);
      setPlayer(response.data);
      
      if (response.data.recentActivities) {
        setActivities(response.data.recentActivities);
      }
    } catch (error) {
      console.error('Error fetching player details:', error);
      setError('Failed to load player information. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const formatTime = (dateString) => {
    const options = { hour: '2-digit', minute: '2-digit' };
    return new Date(dateString).toLocaleTimeString(undefined, options);
  };

  const handleAddActivity = async (e) => {
    e.preventDefault();
    
    if (!newActivity.type || !newActivity.notes) {
      toast.error('Please fill in all fields');
      return;
    }
    
    try {
      const response = await coachAPI.addActivity(id, newActivity);
      
      // Add the new activity to the list
      setActivities([response.data, ...activities]);
      
      // Reset form
      setNewActivity({
        type: 'meal',
        notes: ''
      });
      
      setShowAddActivityForm(false);
      toast.success('Activity recorded successfully');
    } catch (error) {
      console.error('Error adding activity:', error);
      toast.error('Failed to record activity');
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p className="text-xl font-semibold mb-2">Error Loading Player Information</p>
        <p className="text-center max-w-md mb-6">{error}</p>
        <button
          onClick={fetchPlayerDetails}
          className={`px-4 py-2 rounded-lg ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-medium`}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!player) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
      }`}>
        <AlertCircle className="h-12 w-12 text-yellow-500 mb-4" />
        <p className="text-xl font-semibold mb-2">Player Not Found</p>
        <p className="text-center max-w-md mb-6">The requested player information could not be found.</p>
        <Link
          to="/coach/schedule"
          className={`px-4 py-2 rounded-lg ${
            isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
          } text-white font-medium flex items-center`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Schedule
        </Link>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-800'}`}>
      <div className="max-w-6xl mx-auto p-4 md:p-6">
        {/* Back Button */}
        <Link 
          to="/coach/schedule"
          className={`inline-flex items-center mb-6 px-3 py-2 rounded-lg transition-colors ${
            isDarkMode 
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' 
              : 'bg-white hover:bg-gray-100 text-gray-700'
          }`}
        >
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Schedule
        </Link>
        
        {/* Player Profile Header */}
        <div className={`p-6 rounded-xl shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex flex-col md:flex-row gap-6">
            {/* Player Avatar */}
            <div className={`flex-shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center ${
              player.gender === 'male' 
                ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                : isDarkMode ? 'bg-pink-900 text-pink-200' : 'bg-pink-100 text-pink-800'
            }`}>
              <span className="text-4xl font-bold">
                {player.firstName.charAt(0)}
              </span>
            </div>
            
            {/* Player Info */}
            <div className="flex-grow">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {player.firstName} {player.lastName}
              </h1>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <span className={`px-2 py-1 rounded-lg text-sm ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  {player.age} years old
                </span>
                <span className={`px-2 py-1 rounded-lg text-sm ${
                  player.gender === 'male'
                    ? isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                    : isDarkMode ? 'bg-pink-900/30 text-pink-200' : 'bg-pink-100 text-pink-800'
                }`}>
                  {player.gender.charAt(0).toUpperCase() + player.gender.slice(1)}
                </span>
                <span className={`px-2 py-1 rounded-lg text-sm ${
                  player.ageGroup === 'infant'
                    ? isDarkMode ? 'bg-purple-900/30 text-purple-200' : 'bg-purple-100 text-purple-800'
                    : player.ageGroup === 'toddler'
                      ? isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'
                      : player.ageGroup === 'preschool'
                        ? isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                        : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
                }`}>
                  {player.ageGroup ? player.ageGroup.charAt(0).toUpperCase() + player.ageGroup.slice(1) : 'Unknown Age Group'}
                </span>
                <span className={`px-2 py-1 rounded-lg text-sm ${
                  player.duration === 'full-day'
                    ? isDarkMode ? 'bg-indigo-900/30 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                    : player.duration === 'half-day-morning'
                      ? isDarkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-100 text-amber-800'
                      : isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800'
                }`}>
                  {player.duration === 'full-day' 
                    ? 'Full Day' 
                    : player.duration === 'half-day-morning' 
                      ? 'Half Day (Morning)' 
                      : 'Half Day (Afternoon)'}
                </span>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  <span className="text-sm">Birth Date: {formatDate(player.dateOfBirth)}</span>
                </div>
                
                {player.enrollmentDate && (
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-2" />
                    <span className="text-sm">Enrolled: {formatDate(player.enrollmentDate)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {/* Contact Information */}
          <div className={`p-6 rounded-xl shadow-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Contact Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Contact Name</h3>
                <p>{player.contactName}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Contact Details</h3>
                <div className="flex items-center mb-2">
                  <Phone className="h-4 w-4 mr-2" />
                  <p>{player.contactPhone}</p>
                </div>
                
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" />
                  <p>{player.contactEmail}</p>
                </div>
              </div>
              
              {player.emergencyContact && player.emergencyContact.name && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Emergency Contact</h3>
                  <p>{player.emergencyContact.name}</p>
                  {player.emergencyContact.relationship && (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      ({player.emergencyContact.relationship})
                    </p>
                  )}
                  {player.emergencyContact.phone && (
                    <div className="flex items-center mt-1">
                      <Phone className="h-4 w-4 mr-2" />
                      <p>{player.emergencyContact.phone}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
          
          {/* Medical Information */}
          <div className={`p-6 rounded-xl shadow-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Heart className="h-5 w-5 mr-2" />
              Medical Information
            </h2>
            
            <div className="space-y-4">
              {(player.allergies && player.allergies.length > 0) && (
                <div>
                  <h3 className="text-sm font-medium flex items-center mb-2">
                    <AlertTriangle className="h-4 w-4 mr-1 text-red-500" />
                    Allergies
                  </h3>
                  <ul className="list-disc list-inside space-y-1">
                    {player.allergies.map((allergy, index) => (
                      <li key={index} className={`px-2 py-1 rounded ${
                        isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-50 text-red-800'
                      }`}>{allergy}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(player.medications && player.medications.length > 0) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Medications</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {player.medications.map((medication, index) => (
                      <li key={index}>{medication}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {(player.conditions && player.conditions.length > 0) && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Medical Conditions</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {player.conditions.map((condition, index) => (
                      <li key={index}>{condition}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              {player.specialNeeds && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Special Needs</h3>
                  <p className={`p-2 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>{player.specialNeeds}</p>
                </div>
              )}
              
              {player.medicalNotes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Medical Notes</h3>
                  <p className={`p-2 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>{player.medicalNotes}</p>
                </div>
              )}
              
              {(!player.allergies || player.allergies.length === 0) && 
               (!player.medications || player.medications.length === 0) && 
               (!player.conditions || player.conditions.length === 0) && 
               !player.specialNeeds && 
               !player.medicalNotes && (
                <p className="text-center py-4 text-gray-500">
                  No medical information provided
                </p>
              )}
            </div>
          </div>
          
          {/* Schedule Information */}
          <div className={`p-6 rounded-xl shadow-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Calendar className="h-5 w-5 mr-2" />
              Schedule Information
            </h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-2">Attendance Days</h3>
                <div className="grid grid-cols-5 gap-2">
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => {
                    const dayKey = day.toLowerCase();
                    const isAttending = player.attendanceDays && player.attendanceDays[dayKey];
                    
                    return (
                      <div 
                        key={day} 
                        className={`text-center p-2 rounded ${
                          isAttending
                            ? isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-500'
                        }`}
                      >
                        <div className="text-xs">{day.slice(0, 3)}</div>
                        {isAttending ? (
                          <CheckCircle className="h-4 w-4 mx-auto mt-1" />
                        ) : (
                          <span className="text-xs">-</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-2">Care Duration</h3>
                <div className={`p-2 rounded text-center ${
                  player.duration === 'full-day'
                    ? isDarkMode ? 'bg-indigo-900/30 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                    : player.duration === 'half-day-morning'
                      ? isDarkMode ? 'bg-amber-900/30 text-amber-200' : 'bg-amber-100 text-amber-800'
                      : isDarkMode ? 'bg-orange-900/30 text-orange-200' : 'bg-orange-100 text-orange-800'
                }`}>
                  {player.duration === 'full-day' 
                    ? 'Full Day (8:00 AM - 5:00 PM)' 
                    : player.duration === 'half-day-morning' 
                      ? 'Half Day Morning (8:00 AM - 12:00 PM)' 
                      : 'Half Day Afternoon (1:00 PM - 5:00 PM)'}
                </div>
              </div>
              
              {player.notes && (
                <div>
                  <h3 className="text-sm font-medium mb-2">Additional Notes</h3>
                  <p className={`p-2 rounded ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                  }`}>{player.notes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Activity Log */}
        <div className={`mt-6 p-6 rounded-xl shadow-md ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold flex items-center">
              <ActivityIcon className="h-5 w-5 mr-2" />
              Recent Activities
            </h2>
            
            <button
              onClick={() => setShowAddActivityForm(!showAddActivityForm)}
              className={`flex items-center px-3 py-1.5 rounded-lg ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <PlusCircle className="h-4 w-4 mr-1" />
              <span>Add Activity</span>
            </button>
          </div>
          
          {/* Add Activity Form */}
          {showAddActivityForm && (
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
            }`}>
              <h3 className="text-lg font-medium mb-3">Record New Activity</h3>
              
              <form onSubmit={handleAddActivity} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Activity Type</label>
                  <select
                    value={newActivity.type}
                    onChange={(e) => setNewActivity({...newActivity, type: e.target.value})}
                    required
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-600 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                  >
                    <option value="meal">Meal/Feeding</option>
                    <option value="nap">Nap/Sleep</option>
                    <option value="diaper">Diaper Change</option>
                    <option value="bathroom">Bathroom</option>
                    <option value="activity">Learning Activity</option>
                    <option value="play">Playtime</option>
                    <option value="medication">Medication</option>
                    <option value="incident">Incident</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Notes</label>
                  <textarea
                    value={newActivity.notes}
                    onChange={(e) => setNewActivity({...newActivity, notes: e.target.value})}
                    required
                    rows="3"
                    className={`w-full px-3 py-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-600 text-white border-gray-600 focus:ring-blue-500 focus:border-blue-500'
                        : 'bg-white text-gray-900 border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                    }`}
                    placeholder="Describe the activity..."
                  ></textarea>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <button
                    type="button"
                    onClick={() => setShowAddActivityForm(false)}
                    className={`px-3 py-1.5 rounded-lg ${
                      isDarkMode
                        ? 'bg-gray-600 hover:bg-gray-500 text-white'
                        : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`px-3 py-1.5 rounded-lg ${
                      isDarkMode
                        ? 'bg-green-600 hover:bg-green-700 text-white'
                        : 'bg-green-500 hover:bg-green-600 text-white'
                    }`}
                  >
                    Save Activity
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {/* Activity List */}
          {activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div 
                  key={activity.id} 
                  className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}
                >
                  <div className="flex justify-between mb-1">
                    <div className="flex items-center">
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        activity.type === 'meal'
                          ? isDarkMode ? 'bg-green-900/30 text-green-200' : 'bg-green-100 text-green-800'
                          : activity.type === 'nap'
                            ? isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : activity.type === 'diaper' || activity.type === 'bathroom'
                              ? isDarkMode ? 'bg-yellow-900/30 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                              : activity.type === 'incident'
                                ? isDarkMode ? 'bg-red-900/30 text-red-200' : 'bg-red-100 text-red-800'
                                : isDarkMode ? 'bg-indigo-900/30 text-indigo-200' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {activity.type.charAt(0).toUpperCase() + activity.type.slice(1)}
                      </span>
                    </div>
                    
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(activity.timestamp)} at {formatTime(activity.timestamp)}
                    </span>
                  </div>
                  
                  <p className="mt-1">{activity.notes}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className={`text-center p-6 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No activities recorded yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerDetail; 