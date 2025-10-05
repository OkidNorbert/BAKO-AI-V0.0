import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useTheme } from '../context/ThemeContext';

interface LiveMetrics {
  timestamp: number;
  heart_rate: number;
  speed: number;
  performance_score: number;
}

interface CoachFeedback {
  id: number;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning';
}

export const LiveStreaming: React.FC = () => {
  const { darkMode } = useTheme();
  const [isStreaming, setIsStreaming] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<LiveMetrics[]>([]);
  const [currentMetrics, setCurrentMetrics] = useState({
    heart_rate: 0,
    speed: 0,
    performance_score: 0,
    duration: 0,
  });
  const [coachFeedback, setCoachFeedback] = useState<CoachFeedback[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const startStreaming = () => {
    setIsStreaming(true);
    
    // Simulate WebSocket connection
    // In real app: wsRef.current = new WebSocket('ws://localhost:8000/ws/live/1');
    
    // Simulate real-time data updates
    intervalRef.current = setInterval(() => {
      const newMetric: LiveMetrics = {
        timestamp: Date.now(),
        heart_rate: 60 + Math.random() * 60,
        speed: 10 + Math.random() * 10,
        performance_score: 70 + Math.random() * 25,
      };

      setLiveMetrics((prev) => {
        const updated = [...prev, newMetric];
        return updated.slice(-20); // Keep last 20 data points
      });

      setCurrentMetrics((prev) => ({
        heart_rate: Math.round(newMetric.heart_rate),
        speed: Math.round(newMetric.speed * 10) / 10,
        performance_score: Math.round(newMetric.performance_score),
        duration: prev.duration + 1,
      }));

      // Randomly add coach feedback
      if (Math.random() > 0.95) {
        const feedbackMessages = [
          { message: 'Great form on that shot!', type: 'success' as const },
          { message: 'Increase your defensive intensity', type: 'warning' as const },
          { message: 'Good footwork, keep it up', type: 'success' as const },
          { message: 'Watch your spacing on offense', type: 'info' as const },
          { message: 'Excellent transition defense!', type: 'success' as const },
        ];
        
        const randomFeedback = feedbackMessages[Math.floor(Math.random() * feedbackMessages.length)];
        setCoachFeedback((prev) => [
          {
            id: Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            ...randomFeedback,
          },
          ...prev.slice(0, 9), // Keep last 10 feedback items
        ]);
      }
    }, 1000);
  };

  const stopStreaming = () => {
    setIsStreaming(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Live Training Session</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Real-time performance monitoring and coaching</p>
          </div>
        {!isStreaming ? (
          <button
            onClick={startStreaming}
            className="px-6 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="8" />
            </svg>
            Start Live Session
          </button>
        ) : (
          <button
            onClick={stopStreaming}
            className="px-6 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <rect x="6" y="6" width="12" height="12" />
            </svg>
            Stop Session
          </button>
        )}
      </div>

        {!isStreaming ? (
          /* Pre-stream view */
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-12 text-center`}>
            <svg className={`w-24 h-24 ${darkMode ? 'text-gray-500' : 'text-gray-400'} mx-auto mb-6`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Ready to Start Your Live Session?</h2>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-8 max-w-2xl mx-auto`}>
              Connect your wearable device and prepare for your training session. Your coach can monitor your performance in real-time and provide instant feedback.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
              <div className={`p-6 ${darkMode ? 'bg-orange-900' : 'bg-orange-50'} rounded-lg`}>
                <svg className="w-12 h-12 text-orange-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Real-time Metrics</h3>
                <p className={`text-sm ${darkMode ? 'text-orange-200' : 'text-gray-600'}`}>Heart rate, speed, and performance scores updated every second</p>
              </div>
              <div className={`p-6 ${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-lg`}>
                <svg className="w-12 h-12 text-blue-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Coach Feedback</h3>
                <p className={`text-sm ${darkMode ? 'text-blue-200' : 'text-gray-600'}`}>Receive instant feedback from your coach during training</p>
              </div>
              <div className={`p-6 ${darkMode ? 'bg-green-900' : 'bg-green-50'} rounded-lg`}>
                <svg className="w-12 h-12 text-green-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <h3 className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Performance Tracking</h3>
                <p className={`text-sm ${darkMode ? 'text-green-200' : 'text-gray-600'}`}>All session data is saved for later analysis</p>
              </div>
            </div>
        </div>
      ) : (
        /* Live streaming view */
        <>
          {/* Live Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-red-100 text-sm font-medium">Heart Rate</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-200 rounded-full animate-pulse mr-2"></div>
                  <span className="text-red-100 text-xs">LIVE</span>
                </div>
              </div>
              <p className="text-5xl font-bold mb-1">{currentMetrics.heart_rate}</p>
              <p className="text-red-100 text-sm">bpm</p>
            </div>

            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-blue-100 text-sm font-medium">Speed</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-blue-200 rounded-full animate-pulse mr-2"></div>
                  <span className="text-blue-100 text-xs">LIVE</span>
                </div>
              </div>
              <p className="text-5xl font-bold mb-1">{currentMetrics.speed}</p>
              <p className="text-blue-100 text-sm">mph</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-green-100 text-sm font-medium">Performance</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-green-200 rounded-full animate-pulse mr-2"></div>
                  <span className="text-green-100 text-xs">LIVE</span>
                </div>
              </div>
              <p className="text-5xl font-bold mb-1">{currentMetrics.performance_score}</p>
              <p className="text-green-100 text-sm">score</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
              <div className="flex items-center justify-between mb-2">
                <p className="text-purple-100 text-sm font-medium">Duration</p>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-purple-200 rounded-full animate-pulse mr-2"></div>
                  <span className="text-purple-100 text-xs">LIVE</span>
                </div>
              </div>
              <p className="text-5xl font-bold mb-1">{formatDuration(currentMetrics.duration)}</p>
              <p className="text-purple-100 text-sm">elapsed</p>
            </div>
          </div>

          {/* Live Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Heart Rate Chart */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-2"></div>
                Heart Rate (Live)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={liveMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={[40, 180]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="heart_rate" stroke="#ef4444" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Score Chart */}
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
              <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
                Performance Score (Live)
              </h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={liveMetrics}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" hide />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line type="monotone" dataKey="performance_score" stroke="#10b981" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Coach Feedback */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4 flex items-center`}>
              <svg className="w-6 h-6 text-orange-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              Coach Feedback
            </h2>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {coachFeedback.length === 0 ? (
                <p className={`${darkMode ? 'text-gray-500' : 'text-gray-500'} text-center py-8`}>Waiting for coach feedback...</p>
              ) : (
                coachFeedback.map((feedback) => (
                  <div
                    key={feedback.id}
                    className={`p-4 rounded-lg border-l-4 ${
                      feedback.type === 'success'
                        ? darkMode 
                          ? 'bg-green-900 border-green-600' 
                          : 'bg-green-50 border-green-600'
                        : feedback.type === 'warning'
                        ? darkMode
                          ? 'bg-yellow-900 border-yellow-600'
                          : 'bg-yellow-50 border-yellow-600'
                        : darkMode
                          ? 'bg-blue-900 border-blue-600'
                          : 'bg-blue-50 border-blue-600'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{feedback.timestamp}</span>
                      <span className={`text-xs font-medium ${
                        feedback.type === 'success'
                          ? 'text-green-600'
                          : feedback.type === 'warning'
                          ? 'text-yellow-600'
                          : 'text-blue-600'
                      }`}>
                        {feedback.type.toUpperCase()}
                      </span>
                    </div>
                    <p className={`${darkMode ? 'text-white' : 'text-gray-900'}`}>{feedback.message}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
        )}
      </div>
    </div>
  );
};
