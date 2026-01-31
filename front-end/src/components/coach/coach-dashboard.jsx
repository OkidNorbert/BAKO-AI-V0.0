import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { 
  Calendar, 
  Clock, 
  Users, 
  ClipboardCheck, 
  Baby, 
  CheckCircle, 
  XCircle, 
  Clock3, 
  RefreshCw,
  BookOpen,
  Coffee
} from 'lucide-react';
import { format } from 'date-fns';
import { useToast } from '../ui/use-toast';
import { useTheme } from '../../context/ThemeContext';

const CoachDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [children, setPlayers] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState({
    present: 0,
    absent: 0,
    late: 0,
  });
  const [currentTime, setCurrentTime] = useState(new Date());
  const { toast } = useToast();
  const { isDarkMode } = useTheme();

  //Time is updated every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timer);
  }, []);

  // Fetch coach data
  const fetchCoachData = async () => {
    setLoading(true);
    try {
      // TODO: Replace with actual API calls
      // For demo, we'll create some mock data
      setTimeout(() => {
        const mockPlayers = [
          { id: 1, name: 'Emma Johnson', age: 4, contactName: 'Sarah Johnson', status: 'present' },
          { id: 2, name: 'Noah Smith', age: 3, contactName: 'Michael Smith', status: 'present' },
          { id: 3, name: 'Olivia Williams', age: 5, contactName: 'Jennifer Williams', status: 'absent' },
          { id: 4, name: 'Liam Brown', age: 4, contactName: 'David Brown', status: 'late' }
        ];
        
        const mockSchedule = [
          { id: 1, activity: 'Morning Circle Time', time: '9:00 AM', duration: '30 min', status: 'completed' },
          { id: 2, activity: 'Snack Time', time: '10:30 AM', duration: '20 min', status: 'completed' },
          { id: 3, activity: 'Art Activity', time: '11:00 AM', duration: '45 min', status: 'current' },
          { id: 4, activity: 'Lunch', time: '12:00 PM', duration: '45 min', status: 'upcoming' },
          { id: 5, activity: 'Nap Time', time: '1:00 PM', duration: '90 min', status: 'upcoming' }
        ];
        
        const mockAttendance = {
          present: 2,
          absent: 1,
          late: 1
        };
        
        setPlayers(mockPlayers);
        setSchedule(mockSchedule);
        setAttendance(mockAttendance);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching Coach data:', error);
      toast({
        title: 'Error',
        description: 'Failing to load dashboard data. Please try again.',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoachData();
  }, []);

  const handleTakeAttendance = async () => {
    try {
      // TODO: This will replace with actual API call
      toast({
        title: 'Navigating',
        description: 'Taking you towards the attendance page...',
      });
      
      // In a real app, this would navigate to the attendance page
      // window.location.href = '/coach/attendance';
    } catch (error) {
      console.error('Error loading attendance page:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance page. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewSchedule = async () => {
    try {
      // TODO: Replace with actual API call
      toast({
        title: 'Navigating',
        description: 'Taking you to the schedule page...',
      });
      
      // In a real app, this would navigate to the schedule page
      // window.location.href = '/coach/schedule';
    } catch (error) {
      console.error('Error occuring while loading schedule page:', error);
      toast({
        title: 'Error',
        description: 'Failed to load schedule. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const refreshDashboard = () => {
    fetchCoachData();
    toast({
      title: 'Refreshing',
      description: 'Dashboard data is being updated....',
    });
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
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch(status) {
      case 'present':
        return isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800';
      case 'absent':
        return isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800';
      case 'late':
        return isDarkMode ? 'bg-amber-900 text-amber-300' : 'bg-amber-100 text-amber-800';
      case 'completed':
        return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
      case 'current':
        return isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800';
      case 'upcoming':
        return isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800';
      default:
        return isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status) => {
    switch(status) {
      case 'present':
        return <CheckCircle className="h-4 w-4" />;
      case 'absent':
        return <XCircle className="h-4 w-4" />;
      case 'late':
        return <Clock3 className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-purple-950' 
        : 'bg-gradient-to-b from-blue-100 to-purple-100'
    }`}>
      {/* The Decorative elements */}
      <div className="absolute top-0 left-0 right-0 h-full pointer-events-none overflow-hidden">
        <div className={`w-24 h-24 ${isDarkMode ? 'bg-pink-500' : 'bg-pink-300'} rounded-full absolute top-20 left-10 opacity-20 animate-float-slow`}></div>
        <div className={`w-16 h-16 ${isDarkMode ? 'bg-green-600' : 'bg-green-400'} rounded-full absolute top-40 right-20 opacity-20 animate-float-medium`}></div>
        <div className={`w-20 h-20 ${isDarkMode ? 'bg-yellow-500' : 'bg-yellow-300'} rounded-full absolute bottom-20 left-1/4 opacity-20 animate-float-fast`}></div>
      </div>

     

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className={`text-3xl sm:text-4xl font-bold mb-2 ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-pink-600 via-purple-500 to-indigo-600'
            } animate-gradient`}>
              Coach Dashboard
            </h1>
            <p className={`${isDarkMode ? 'text-gray-300' : 'text-indigo-800'} text-lg`}>
              Welcome to your daily overview
            </p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <button
              onClick={handleTakeAttendance}
              className={`px-4 py-2.5 rounded-full text-sm font-medium flex items-center ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-green-600 to-teal-700 text-white hover:from-green-700 hover:to-teal-800' 
                  : 'bg-gradient-to-r from-green-500 to-teal-600 text-white hover:from-green-600 hover:to-teal-700'
              } transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              {/* Handles clipboard check */}
              <ClipboardCheck className="h-4 w-4 mr-2" />
              Take Attendance
            </button>
            <button
              onClick={handleViewSchedule}
              className={`px-4 py-2.5 rounded-full text-sm font-medium flex items-center ${
                isDarkMode 
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-700 text-white hover:from-blue-700 hover:to-indigo-800' 
                  : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
              } transition-all duration-200 transform hover:scale-105 shadow-lg`}
            >
              <Calendar className="h-4 w-4 mr-2" />
              View Schedule
            </button>
            <button
              onClick={refreshDashboard}
              className={`p-2.5 rounded-full ${
                isDarkMode 
                  ? 'bg-gray-800 text-white hover:bg-gray-700' 
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              } transition-all duration-200 transform hover:scale-105 shadow-lg`}
              title="Refresh Dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* African-inspired decorative element */}
        <div className="flex justify-center mb-6">
          <svg className="w-40 h-8" viewBox="0 0 200 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0,12 C8,6 16,3 24,6 C32,9 40,18 48,18 C56,18 64,12 72,9 C80,6 88,6 96,9 C104,12 112,18 120,18 C128,18 136,12 144,9 C152,6 160,6 168,9 C176,12 184,18 192,18 C200,18 200,12 200,12" 
              stroke={isDarkMode ? "#EC4899" : "#DB2777"} 
              strokeWidth="4" 
              strokeLinecap="round"/>
          </svg>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className={`transform transition duration-300 hover:scale-105 p-6 rounded-2xl shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${
                isDarkMode ? 'from-green-600 to-green-800' : 'from-green-400 to-green-600'
              } text-white`}>
                <Baby size={24} />
              </div>
              <span className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {children.length}
              </span>
            </div>
            <h3 className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Players Today
            </h3>
            <p className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              Total children assigned to you
            </p>
          </div>

          <div 
            className={`transform transition duration-300 hover:scale-105 p-6 rounded-2xl shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${
                isDarkMode ? 'from-blue-600 to-blue-800' : 'from-blue-400 to-blue-600'
              } text-white`}>
                <ClipboardCheck size={24} />
              </div>
              <span className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {attendance.present}
              </span>
            </div>
            <h3 className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Attendance
            </h3>
            <div className={`flex gap-3 mt-2 text-sm ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              <span className="flex items-center">
                <XCircle className="h-3 w-3 mr-1 text-red-500" /> 
                {attendance.absent} absent
              </span>
              <span className="flex items-center">
                <Clock3 className="h-3 w-3 mr-1 text-amber-500" /> 
                {attendance.late} late
              </span>
            </div>
          </div>


          <div 
            className={`transform transition duration-300 hover:scale-105 p-6 rounded-2xl shadow-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="flex justify-between items-center mb-4">
              <div className={`p-3 rounded-full bg-gradient-to-r ${
                isDarkMode ? 'from-purple-600 to-purple-800' : 'from-purple-400 to-purple-600'
              } text-white`}>
                <Clock size={24} />
              </div>
              <span className={`text-3xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-800'
              }`}>
                {format(currentTime, 'h:mm a')}
              </span>
            </div>
            <h3 className={`text-lg font-medium ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>
              Current Time
            </h3>
            <p className={`text-sm mt-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>
              {format(currentTime, 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Players Section */}
          <div 
            className={`rounded-2xl shadow-lg overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${
                  isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
                }`}>
                  My Players
                </h2>
                <Baby className={`h-5 w-5 ${
                  isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
                }`} />
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {children.length > 0 ? (
                  children.map((player) => (
                    <div 
                      key={player.id} 
                      className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                        isDarkMode ? 'bg-gray-750 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center space-x-4">
                        <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <Baby className={`h-6 w-6 ${
                            player.status === 'present' 
                              ? 'text-green-500' 
                              : player.status === 'absent' 
                                ? 'text-red-500' 
                                : 'text-amber-500'
                          }`} />
                        </div>
                        <div>
                          <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {player.name}
                          </h3>
                          <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            Age: {player.age} | Contact: {player.contactName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center ${
                          getStatusColor(player.status)
                        }`}>
                          {getStatusIcon(player.status)}
                          <span className="ml-1 capitalize">{player.status}</span>
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className={`flex flex-col items-center justify-center py-10 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Baby className="h-12 w-12 mb-4 opacity-40" />
                    <p className="text-center">No children assigned today</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* The Schedule Section */}
          <div 
            className={`rounded-2xl shadow-lg overflow-hidden ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className={`text-xl font-bold ${
                  isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
                }`}>
                  Today's Schedule
                </h2>
                <Calendar className={`h-5 w-5 ${
                  isDarkMode ? 'text-yellow-400' : 'text-indigo-600'
                }`} />
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                {schedule.length > 0 ? (
                  schedule.map((item) => {
                    const getActivityIcon = () => {
                      if (item.activity.includes('Circle')) return <BookOpen className="h-5 w-5" />;
                      if (item.activity.includes('Snack') || item.activity.includes('Lunch')) return <Coffee className="h-5 w-5" />;
                      if (item.activity.includes('Nap')) return <Clock className="h-5 w-5" />;
                      return <Calendar className="h-5 w-5" />;
                    };
                    
                    return (
                      <div 
                        key={item.id} 
                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 ${
                          isDarkMode 
                            ? item.status === 'current' ? 'bg-blue-900/30' : 'bg-gray-750 hover:bg-gray-700'
                            : item.status === 'current' ? 'bg-blue-50' : 'bg-gray-50 hover:bg-gray-100'
                        }`}
                      >
                        <div className="flex items-center space-x-4">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-gray-700' : 'bg-white'
                          }`}>
                            {getActivityIcon()}
                          </div>
                          <div>
                            <h3 className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                              {item.activity}
                            </h3>
                            <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                              {item.time} ({item.duration})
                            </p>
                          </div>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(item.status)
                        }`}>
                          {item.status}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className={`flex flex-col items-center justify-center py-10 ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    <Calendar className="h-12 w-12 mb-4 opacity-40" />
                    <p className="text-center">No schedule available for today</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachDashboard; 