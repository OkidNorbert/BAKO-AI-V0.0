import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import { useToast } from './Toast'
import { LoadingSpinner } from './LoadingSpinner'
import api from '../services/api'

interface PlayerData {
  id: number;
  name: string;
  position: string;
  team: string;
  shooting_accuracy: number;
  jump_height: number;
  speed: number;
  last_session: string;
  total_sessions: number;
  improvement_rate: number;
}

interface SessionData {
  id: number;
  date: string;
  type: string;
  duration: number;
  performance_score: number;
}

export const PlayerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const { darkMode } = useTheme()
  const { showToast } = useToast()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [sessions, setSessions] = useState<SessionData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      fetchPlayerData()
    }
  }, [id])

  const fetchPlayerData = async () => {
    try {
      setLoading(true)
      
      // Fetch player profile data from backend
      const playerResponse = await api.players.getPlayer(parseInt(id!))
      const player = playerResponse.data
      
      setPlayerData({
        id: player.id,
        name: player.name || `Player ${id}`,
        position: player.position || 'Guard',
        team: player.team?.name || 'Team',
        shooting_accuracy: player.shooting_accuracy || 0,
        jump_height: player.jump_height || 0,
        speed: player.speed || 0,
        last_session: player.last_session || '',
        total_sessions: player.total_sessions || 0,
        improvement_rate: player.improvement_rate || 0
      })

      // Fetch recent sessions
      const sessionsResponse = await api.sessions.getPlayerSessions(parseInt(id!))
      setSessions(sessionsResponse.data || [])

      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching player data:', error)
      showToast('Failed to load player data', 'error')
      setLoading(false)
    }
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading player profile..." />
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-6">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                {playerData?.name || `Player ${id}`}
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                {playerData?.position} • {playerData?.team}
              </p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                {playerData?.total_sessions || 0}
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Total Sessions
              </div>
            </div>
          </div>
        </div>
        
        {/* Performance Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🎯 Shooting Accuracy
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                {playerData?.shooting_accuracy || 0}%
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${playerData?.shooting_accuracy || 0}%` }}
              ></div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                ⬆️ Jump Height
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                {playerData?.jump_height || 0}"
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((playerData?.jump_height || 0) / 40 * 100, 100)}%` }}
              ></div>
            </div>
          </div>

          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                🏃 Speed
              </h3>
              <div className={`text-2xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                {playerData?.speed || 0}s
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-purple-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(100 - (playerData?.speed || 0) / 5 * 100, 0)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Recent Sessions */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-6`}>
            Recent Training Sessions
          </h3>
          <div className="space-y-4">
            {sessions.length > 0 ? (
              sessions.slice(0, 5).map((session) => (
                <div key={session.id} className={`${darkMode ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg p-4 flex items-center justify-between`}>
                  <div>
                    <div className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                      {session.type}
                    </div>
                    <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {new Date(session.date).toLocaleDateString()} • {session.duration} minutes
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold ${session.performance_score >= 80 ? (darkMode ? 'text-green-400' : 'text-green-600') : session.performance_score >= 60 ? (darkMode ? 'text-yellow-400' : 'text-yellow-600') : (darkMode ? 'text-red-400' : 'text-red-600')}`}>
                      {session.performance_score}%
                    </div>
                    <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      Performance
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                <div className="text-4xl mb-4">🏀</div>
                <p>No training sessions yet</p>
                <p className="text-sm">Start training to see your progress here!</p>
              </div>
            )}
          </div>
        </div>

        {/* Improvement Rate */}
        {playerData?.improvement_rate && playerData.improvement_rate > 0 && (
          <div className={`${darkMode ? 'bg-gradient-to-r from-green-900 to-green-800' : 'bg-gradient-to-r from-green-100 to-green-200'} rounded-xl shadow-lg p-6`}>
            <div className="flex items-center">
              <div className="text-4xl mr-4">📈</div>
              <div>
                <h3 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-green-900'}`}>
                  Great Progress!
                </h3>
                <p className={`${darkMode ? 'text-green-200' : 'text-green-700'}`}>
                  You've improved by {playerData.improvement_rate}% this month
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
