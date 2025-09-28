import React from 'react'

export const Training: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Training Recommendations
        </h1>
        <p className="text-gray-600">
          AI-powered training programs based on your performance analysis.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🎯 Shooting Drills
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-blue-50 rounded-lg">
              <h4 className="font-medium text-blue-900">Corner 3-Point Practice</h4>
              <p className="text-sm text-blue-700">30 reps, 3x per week</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <h4 className="font-medium text-green-900">Free Throw Routine</h4>
              <p className="text-sm text-green-700">50 reps daily</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            💪 Conditioning
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-red-50 rounded-lg">
              <h4 className="font-medium text-red-900">Sprint Intervals</h4>
              <p className="text-sm text-red-700">10x 40-yard dashes</p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <h4 className="font-medium text-purple-900">Jump Training</h4>
              <p className="text-sm text-purple-700">Plyometric exercises</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            🏀 Ball Handling
          </h3>
          <div className="space-y-3">
            <div className="p-3 bg-yellow-50 rounded-lg">
              <h4 className="font-medium text-yellow-900">Weak Hand Dribbling</h4>
              <p className="text-sm text-yellow-700">20 minutes daily</p>
            </div>
            <div className="p-3 bg-indigo-50 rounded-lg">
              <h4 className="font-medium text-indigo-900">Crossover Drills</h4>
              <p className="text-sm text-indigo-700">15 minutes, 3x per week</p>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            📊 Progress Tracking
          </h3>
          <div className="space-y-3">
            <div className="text-sm">
              <span className="text-gray-600">This week's focus:</span>
              <span className="font-medium ml-2">Shooting accuracy improvement</span>
            </div>
            <div className="text-sm">
              <span className="text-gray-600">Next milestone:</span>
              <span className="font-medium ml-2">85% free throw accuracy</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
