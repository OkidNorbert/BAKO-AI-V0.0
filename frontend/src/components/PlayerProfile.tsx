import React from 'react'
import { useParams } from 'react-router-dom'

export const PlayerProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Player Profile - {id}
        </h1>
        <p className="text-gray-600">
          This will show detailed player metrics, performance charts, and training history.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Performance Metrics
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-600">Shooting Accuracy</span>
              <span className="font-medium">85%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Jump Height</span>
              <span className="font-medium">32 inches</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Speed</span>
              <span className="font-medium">4.2s (40-yard dash)</span>
            </div>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Recent Sessions
          </h3>
          <div className="space-y-2">
            <div className="text-sm text-gray-600">
              Training Session - Dec 15, 2023
            </div>
            <div className="text-sm text-gray-600">
              Game Analysis - Dec 12, 2023
            </div>
            <div className="text-sm text-gray-600">
              Practice Session - Dec 10, 2023
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
