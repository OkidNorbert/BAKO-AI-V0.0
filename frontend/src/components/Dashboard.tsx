import React from 'react'

export const Dashboard: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Basketball Performance Dashboard
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered performance tracking and analysis for basketball players
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            🏀 Video Analysis
          </h3>
          <p className="text-gray-600">
            Upload training videos for AI-powered pose detection and movement analysis
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📊 Performance Metrics
          </h3>
          <p className="text-gray-600">
            Track shooting accuracy, jump height, speed, and other key performance indicators
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            💪 Training Recommendations
          </h3>
          <p className="text-gray-600">
            Get personalized training programs based on your performance data
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            ⌚ Wearable Integration
          </h3>
          <p className="text-gray-600">
            Sync with Apple Watch and other fitness trackers for comprehensive health data
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📈 Progress Tracking
          </h3>
          <p className="text-gray-600">
            Monitor your improvement over time with detailed analytics and reports
          </p>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            👥 Team Management
          </h3>
          <p className="text-gray-600">
            Coaches can manage multiple players and track team performance
          </p>
        </div>
      </div>
      
      <div className="text-center mt-12">
        <p className="text-gray-500">
          This is a placeholder dashboard. The full system will include interactive charts, 
          video players, and real-time analytics.
        </p>
      </div>
    </div>
  )
}
