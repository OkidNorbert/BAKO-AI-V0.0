import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from './Toast'
import { LoadingSpinner } from './LoadingSpinner'
import api from '../services/api'

interface SessionData {
  id: number;
  name: string;
  date: string;
  duration: number;
  performance_score: number;
  video_url?: string;
  events: EventData[];
  heart_rate_data: HeartRateData[];
  player_name: string;
}

interface EventData {
  id: number;
  timestamp: number;
  event_type: string;
  confidence: number;
  description: string;
}

interface HeartRateData {
  timestamp: number;
  value: number;
}

export const SessionView: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { darkMode } = useTheme()
  const { showToast } = useToast()
  const [sessionData, setSessionData] = useState<SessionData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchSessionData()
    }
  }, [id])

  const fetchSessionData = async () => {
    try {
      setLoading(true)
      
      // Fetch session data from backend
      const sessionResponse = await api.sessions.getSessionDetails(parseInt(id!))
      const session = sessionResponse.data
      
      setSessionData({
        id: session.id,
        name: session.name || `Session ${id}`,
        date: session.date || new Date().toISOString(),
        duration: session.duration || 0,
        performance_score: session.performance_score || 0,
        video_url: session.video_url,
        events: session.events || [],
        heart_rate_data: session.heart_rate_data || [],
        player_name: session.player?.name || 'Player'
      })

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching session data:', error)
      showToast('Failed to load session data', 'error')
      setLoading(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getEventColor = (eventType: string) => {
    switch (eventType.toLowerCase()) {
      case 'shot':
        return darkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
      case 'jump':
        return darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
      case 'sprint':
        return darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
      case 'defense':
        return darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading session analysis..." />
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {sessionData?.name || `Session ${id}`}
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {sessionData?.player_name} • {new Date(sessionData?.date || '').toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {sessionData?.performance_score || 0}%
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Performance Score
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Player and Timeline */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
                🎬 Video Analysis
              </h3>
              {sessionData?.video_url ? (
                <div className="relative">
                  <video 
                    controls 
                    className="w-full rounded-lg"
                    poster="/api/placeholder/800/450"
                  >
                    <source src={sessionData.video_url} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                  <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                    AI Analysis Active
                  </div>
                </div>
              ) : (
                <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg h-64 flex items-center justify-center`}>
                  <div className="text-center">
                    <div className="text-4xl mb-4">🎥</div>
                    <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Video processing in progress...
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Event Timeline */}
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              📊 Event Timeline
            </h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {sessionData?.events && sessionData.events.length > 0 ? (
                sessionData.events.map((event) => (
                  <div key={event.id} className={`p-3 rounded-lg ${getEventColor(event.event_type)}`}>
                    <div className="flex items-center justify-between">
                      <span className="font-medium capitalize">{event.event_type}</span>
                      <span className="text-sm opacity-75">{formatTime(event.timestamp)}</span>
                    </div>
                    <div className="text-sm mt-1 opacity-75">
                      {event.description}
                    </div>
                    <div className="text-xs mt-1 opacity-60">
                      Confidence: {Math.round(event.confidence * 100)}%
                    </div>
                  </div>
                ))
              ) : (
                <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  <div className="text-2xl mb-2">📈</div>
                  <p>No events detected yet</p>
                  <p className="text-sm">AI is analyzing the video...</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⏱️ Duration
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {sessionData?.duration || 0}m
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((sessionData?.duration || 0) / 60 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Events Detected
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {sessionData?.events?.length || 0}
              </div>
            </div>
            <div className="text-sm text-gray-500">
              AI-powered analysis
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ❤️ Avg Heart Rate
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                {sessionData?.heart_rate_data && sessionData.heart_rate_data.length > 0 
                  ? Math.round(sessionData.heart_rate_data.reduce((sum, hr) => sum + hr.value, 0) / sessionData.heart_rate_data.length)
                  : 0
                } bpm
              </div>
            </div>
            <div className="text-sm text-gray-500">
              Real-time monitoring
            </div>
          </div>
        </div>

        {/* Heart Rate Chart */}
        {sessionData?.heart_rate_data && sessionData.heart_rate_data.length > 0 && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              ❤️ Heart Rate Analysis
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                    {Math.round(Math.max(...sessionData.heart_rate_data.map(hr => hr.value)))}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max HR</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                    {Math.round(sessionData.heart_rate_data.reduce((sum, hr) => sum + hr.value, 0) / sessionData.heart_rate_data.length)}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Average HR</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                    {Math.round(Math.min(...sessionData.heart_rate_data.map(hr => hr.value)))}
                  </div>
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Min HR</div>
                </div>
              </div>
              <div className={`${darkMode ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg h-32 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-2xl mb-2">📈</div>
                  <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Heart rate chart visualization
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
