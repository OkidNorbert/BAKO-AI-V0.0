import React, { useState, useEffect } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useAuth } from '../context/AuthContext'
import { useToast } from './Toast'
import { LoadingSpinner } from './LoadingSpinner'
import { useAutoRefresh } from '../hooks/useAutoRefresh'
import { SmartRefreshIndicator } from './SmartRefreshIndicator'
import api from '../services/api'

interface TrainingRecommendation {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number;
  frequency: string;
  priority: number;
  progress: number;
}

interface TrainingProgress {
  current_focus: string;
  next_milestone: string;
  completion_rate: number;
  weekly_goal: number;
  achievements: string[];
}

export const Training: React.FC = () => {
  const { darkMode } = useTheme()
  const { user } = useAuth()
  const { showToast } = useToast()
  const [recommendations, setRecommendations] = useState<TrainingRecommendation[]>([])
  const [progress, setProgress] = useState<TrainingProgress | null>(null)
  const [loading, setLoading] = useState(true)

  // Smart auto-refresh with better UX
  const { isRefreshing, lastRefresh, refresh } = useAutoRefresh({
    interval: 120000, // 2 minutes instead of 1 minute
    enabled: !!user?.id,
    onRefresh: fetchTrainingData,
    onError: (error) => {
      console.warn('Auto-refresh failed:', error)
      // Don't show toast for auto-refresh failures to avoid being annoying
    },
    respectUserActivity: true, // Pause when user is active
    respectVisibility: true, // Pause when tab is not visible
  })

  useEffect(() => {
    if (user?.id) {
      fetchTrainingData()
    }
  }, [user?.id])

  const fetchTrainingData = async () => {
    if (!user?.id) {
      console.error('No user ID available. User data:', user)
      setLoading(false)
      return
    }

    console.log('Fetching training data for user ID:', user.id)

    try {
      setLoading(true)
      
      // Fetch AI-powered training recommendations
      console.log('Fetching recommendations...')
      const recommendationsResponse = await api.training.getRecommendations(user.id, 30)
      console.log('Recommendations response:', recommendationsResponse.data)
      setRecommendations(recommendationsResponse.data || [])

      // Fetch training progress
      console.log('Fetching progress...')
      const progressResponse = await api.training.getTrainingProgress(user.id)
      console.log('Progress response:', progressResponse.data)
      setProgress(progressResponse.data || null)

      setLastRefresh(new Date())
      setLoading(false)
    } catch (error: any) {
      if (error.response?.status === 503 || error.name === 'SilentError') {
        // Service unavailable - show empty state silently
        setRecommendations([])
        setProgress(null)
      } else {
        console.error('Error fetching training data:', error)
        showToast('Failed to load training recommendations', 'error')
      }
      setLoading(false)
    }
  }

  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'shooting':
        return '🎯'
      case 'conditioning':
        return '💪'
      case 'ball handling':
        return '🏀'
      case 'defense':
        return '🛡️'
      case 'mental':
        return '🧠'
      default:
        return '🏃'
    }
  }

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
      case 'intermediate':
        return darkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
      case 'advanced':
        return darkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
      default:
        return darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: number) => {
    if (priority >= 8) return darkMode ? 'text-red-400' : 'text-red-600'
    if (priority >= 6) return darkMode ? 'text-orange-400' : 'text-orange-600'
    return darkMode ? 'text-green-400' : 'text-green-600'
  }

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading AI training recommendations..." />
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Smart refresh indicator */}
      <SmartRefreshIndicator
        isRefreshing={isRefreshing}
        lastRefresh={lastRefresh}
        onManualRefresh={refresh}
        showIndicator={!!user?.id}
        position="top-right"
      />
      
      <div className="space-y-6">
        {/* Header */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
                🤖 AI Training Recommendations
              </h1>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                Personalized training programs based on your performance analysis
              </p>
              <p className={`text-sm ${darkMode ? 'text-gray-500' : 'text-gray-500'} mt-1`}>
                Last updated: {lastRefresh.toLocaleTimeString()}
              </p>
              {user && (
                <p className={`text-xs ${darkMode ? 'text-gray-600' : 'text-gray-500'} mt-1`}>
                  User: {user.full_name || user.email} (ID: {user.id})
                </p>
              )}
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className={`text-2xl font-bold ${darkMode ? 'text-orange-400' : 'text-orange-600'}`}>
                  {recommendations.length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Active Programs
                </div>
              </div>
              <button
                onClick={fetchTrainingData}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  darkMode
                    ? 'bg-gray-700 hover:bg-gray-600 text-white disabled:opacity-50'
                    : 'bg-gray-200 hover:bg-gray-300 text-gray-900 disabled:opacity-50'
                }`}
              >
                {loading ? 'Refreshing...' : '🔄 Refresh'}
              </button>
            </div>
          </div>
        </div>

        {/* Progress Overview */}
        {progress && (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>
              📊 Your Training Progress
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-green-400' : 'text-green-600'}`}>
                  {progress.completion_rate}%
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Completion Rate
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                  {progress.weekly_goal}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Weekly Goal
                </div>
              </div>
              <div className="text-center">
                <div className={`text-3xl font-bold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                  {progress.achievements.length}
                </div>
                <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Achievements
                </div>
              </div>
            </div>
            <div className="mt-6 space-y-2">
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">This week's focus:</span>
                <span className="ml-2">{progress.current_focus}</span>
              </div>
              <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                <span className="font-medium">Next milestone:</span>
                <span className="ml-2">{progress.next_milestone}</span>
              </div>
            </div>
          </div>
        )}

        {/* Training Recommendations */}
        {recommendations.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {recommendations.map((recommendation) => (
            <div key={recommendation.id} className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                  {getCategoryIcon(recommendation.category)} {recommendation.title}
                </h3>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recommendation.difficulty)}`}>
                    {recommendation.difficulty}
                  </span>
                  <span className={`text-sm font-bold ${getPriorityColor(recommendation.priority)}`}>
                    P{recommendation.priority}
                  </span>
                </div>
              </div>
              
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
                {recommendation.description}
              </p>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Duration:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {recommendation.duration} minutes
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Frequency:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {recommendation.frequency}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Progress:</span>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                    {recommendation.progress}%
                  </span>
                </div>
              </div>
              
              <div className="mt-4">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${recommendation.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
          </div>
        ) : (
          <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-8 text-center`}>
            <div className="text-6xl mb-4">🤖</div>
            <h3 className={`text-xl font-semibold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
              No Training Recommendations Available
            </h3>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-4`}>
              Start uploading videos and completing training sessions to get personalized AI recommendations
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button 
                onClick={() => window.location.href = '/upload'}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  darkMode 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
              >
                📤 Upload Training Video
              </button>
              <button 
                onClick={() => window.location.href = '/live'}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  darkMode 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                📹 Start Live Session
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
