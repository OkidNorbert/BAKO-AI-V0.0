import React from 'react'
import { useParams } from 'react-router-dom'

export const SessionView: React.FC = () => {
  const { id } = useParams<{ id: string }>()

  return (
    <div className="space-y-6">
      <div className="card">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Session Analysis - {id}
        </h1>
        <p className="text-gray-600">
          This will show video player with pose overlay, event timeline, and heart rate data.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Video Player
          </h3>
          <div className="bg-gray-100 rounded-lg h-64 flex items-center justify-center">
            <span className="text-gray-500">Video Player Placeholder</span>
          </div>
        </div>
        
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Event Timeline
          </h3>
          <div className="space-y-2">
            <div className="text-sm p-2 bg-blue-50 rounded">
              <span className="font-medium">Shot Attempt</span> - 2:15
            </div>
            <div className="text-sm p-2 bg-green-50 rounded">
              <span className="font-medium">Jump</span> - 1:45
            </div>
            <div className="text-sm p-2 bg-yellow-50 rounded">
              <span className="font-medium">Sprint</span> - 1:20
            </div>
          </div>
        </div>
      </div>
      
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Heart Rate & Performance Data
        </h3>
        <div className="bg-gray-100 rounded-lg h-32 flex items-center justify-center">
          <span className="text-gray-500">Charts Placeholder</span>
        </div>
      </div>
    </div>
  )
}
