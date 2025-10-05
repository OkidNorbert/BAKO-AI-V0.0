import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from './Toast'
import { LoadingSpinner } from './LoadingSpinner'
import api from '../services/api'

interface PlayerData {
  id: number;
  user_id: number;
  height_cm?: number;
  weight_kg?: number;
  position?: string;
  team_id?: number;
  team_name?: string;
}

interface PerformanceMetrics {
  player_id: number;
  date_range: string;
  total_sessions: number;
  total_training_time: number;
  shot_attempts: number;
  shot_accuracy: number;
  three_point_accuracy: number;
  free_throw_accuracy: number;
  avg_heart_rate: number;
  max_heart_rate: number;
  avg_jump_height: number;
  max_jump_height: number;
  avg_sprint_speed: number;
  total_distance: number;
  total_calories_burned: number;
  avg_workload: number;
  recovery_time: number;
  weaknesses: string[];
  improvement_areas: string[];
}

interface EventData {
  id: number;
  player_id: string;
  session_id: number;
  timestamp: number;
  type: string;
  meta: any;
}

export const PlayerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { darkMode } = useTheme()
  const { showToast } = useToast()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null)
  const [recentEvents, setRecentEvents] = useState<EventData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (id) {
      fetchPlayerData()
    }
  }, [id])

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Fetch player profile data from backend
      const playerResponse = await api.players.get(parseInt(id!))
      const player = playerResponse.data
      
      setPlayerData({
        id: player.id,
        user_id: player.user_id,
        height_cm: player.height_cm,
        weight_kg: player.weight_kg,
        position: player.position,
        team_id: player.team_id,
        team_name: 'Team' // Will be fetched from team endpoint if needed
      })

      // Fetch performance metrics
      const metricsResponse = await api.players.getStats(parseInt(id!), 30)
      setPerformanceMetrics(metricsResponse.data)

      // Fetch recent events/sessions
      const eventsResponse = await api.sessions.getPlayerSessions(parseInt(id!))
      setRecentEvents(eventsResponse.data || [])

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching player data:', error)
      setError('Failed to load player data')
      showToast('Failed to load player data', 'error')
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading player profile..." />
  }

  if (error) {
    return (
      <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'} flex items-center justify-center`}>
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 text-center`}>
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Error Loading Player Data
          </h2>
          <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
            {error}
          </p>
          <button
            onClick={fetchPlayerData}
            className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                Player {id}
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {playerData?.position || 'Position not set'} • {playerData?.team_name || 'No team'}
              </p>
              {playerData?.height_cm && playerData?.weight_kg && (
                <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                  {playerData.height_cm}cm • {playerData.weight_kg}kg
                </p>
              )}
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {performanceMetrics?.total_sessions || 0}
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Sessions
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🎯 Shooting Accuracy
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {performanceMetrics.shot_accuracy.toFixed(1)}%
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(performanceMetrics.shot_accuracy, 100)}%` }}
                ></div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                {performanceMetrics.shot_attempts} attempts
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ⬆️ Jump Height
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {performanceMetrics.avg_jump_height.toFixed(1)}"
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((performanceMetrics.avg_jump_height / 40) * 100, 100)}%` }}
                ></div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                Max: {performanceMetrics.max_jump_height.toFixed(1)}"
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🏃 Sprint Speed
                </h3>
                  <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                    {performanceMetrics.avg_sprint_speed.toFixed(1)} mph
                  </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min((performanceMetrics.avg_sprint_speed / 20) * 100, 100)}%` }}
                ></div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mt-2`}>
                {performanceMetrics.total_distance.toFixed(1)} miles total
              </div>
            </div>
          </div>
        )}

        {/* Additional Metrics */}
        {performanceMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ❤️ Heart Rate
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-red-400' : 'text-red-600'}`}>
                  {performanceMetrics.avg_heart_rate.toFixed(0)} bpm
                </div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Max: {performanceMetrics.max_heart_rate.toFixed(0)} bpm
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  🔥 Calories
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {performanceMetrics.total_calories_burned.toFixed(0)}
                </div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total burned
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  ⏱️ Training Time
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {performanceMetrics.total_training_time.toFixed(1)}h
                </div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total hours
              </div>
            </div>

            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  💪 Workload
                </h3>
                <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {performanceMetrics.avg_workload.toFixed(1)}
                </div>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Average intensity
              </div>
            </div>
          </div>
        )}

        {/* Recent Events */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            Recent Training Events
          </h3>
          <div className="space-y-4">
            {recentEvents.length > 0 ? (
              recentEvents.slice(0, 10).map((event) => (
                <div key={event.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} capitalize`}>
                      {event.type.replace('_', ' ')}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Session {event.session_id} • {new Date(event.timestamp * 1000).toLocaleString()}
                    </div>
                    {event.meta && Object.keys(event.meta).length > 0 && (
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                        {Object.entries(event.meta).slice(0, 2).map(([key, value]) => (
                          <span key={key} className="mr-2">
                            {key}: {typeof value === 'number' ? value.toFixed(1) : value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                      #{event.id}
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Event ID
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="text-4xl mb-4">🏀</div>
                <p>No training events yet</p>
                <p className="text-sm">Start training to see your events here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Weaknesses and Improvement Areas */}
        {performanceMetrics && (performanceMetrics.weaknesses.length > 0 || performanceMetrics.improvement_areas.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {performanceMetrics.weaknesses.length > 0 && (
              <div className={`${darkMode ? 'bg-red-900' : 'bg-red-50'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">⚠️</div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-red-900'}`}>
                    Areas to Focus On
                  </h3>
                </div>
                <ul className="space-y-2">
                  {performanceMetrics.weaknesses.map((weakness, index) => (
                    <li key={index} className={`flex items-start ${darkMode ? 'text-red-200' : 'text-red-700'}`}>
                      <span className="mr-2">•</span>
                      <span>{weakness}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {performanceMetrics.improvement_areas.length > 0 && (
              <div className={`${darkMode ? 'bg-blue-900' : 'bg-blue-50'} rounded-xl shadow-lg p-6`}>
                <div className="flex items-center mb-4">
                  <div className="text-2xl mr-3">🎯</div>
                  <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-blue-900'}`}>
                    Improvement Opportunities
                  </h3>
                </div>
                <ul className="space-y-2">
                  {performanceMetrics.improvement_areas.map((area, index) => (
                    <li key={index} className={`flex items-start ${darkMode ? 'text-blue-200' : 'text-blue-700'}`}>
                      <span className="mr-2">•</span>
                      <span>{area}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Performance Summary */}
        {performanceMetrics && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              📊 Performance Summary ({performanceMetrics.date_range})
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {performanceMetrics.total_sessions}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Training Sessions
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {performanceMetrics.total_training_time.toFixed(1)}h
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Total Training Time
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {performanceMetrics.avg_workload.toFixed(1)}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Average Workload
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
