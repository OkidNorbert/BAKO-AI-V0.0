import React, { useState, useEffect } from 'react';
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useToast } from './Toast';
import { LoadingSpinner } from './LoadingSpinner';

interface Device {
  id: number;
  device_type: string;
  device_identifier: string;
  status: 'connected' | 'disconnected';
  last_sync: string;
  battery_level?: number;
}

interface HeartRateData {
  timestamp: string;
  value: number;
}

interface ActivitySummary {
  steps: number;
  distance: number;
  calories: number;
  active_minutes: number;
  heart_rate_avg: number;
  heart_rate_max: number;
  heart_rate_resting: number;
}

export const WearableData: React.FC = () => {
  const { user } = useAuth();
  const { darkMode } = useTheme();
  const { showToast } = useToast();
  const [devices, setDevices] = useState<Device[]>([]);
  const [heartRateData, setHeartRateData] = useState<HeartRateData[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>({
    steps: 0,
    distance: 0,
    calories: 0,
    active_minutes: 0,
    heart_rate_avg: 0,
    heart_rate_max: 0,
    heart_rate_resting: 0,
  });
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWearableData();
    }
  }, [user]);

  const fetchWearableData = async () => {
    if (!user) return;
    
    try {
      setLoading(true);

      // Fetch real devices from backend
      const devicesResponse = await api.wearables.getDevices();
      const fetchedDevices = devicesResponse.data.map((device: any) => ({
        id: device.id,
        device_type: device.device_name,
        device_identifier: device.device_identifier,
        status: device.is_active ? 'connected' : 'disconnected',
        last_sync: device.created_at,
        battery_level: undefined,
      }));
      setDevices(fetchedDevices);

      // Fetch real wearable metrics
      const metricsResponse = await api.wearables.getMetrics(user.id);
      const metrics = metricsResponse.data;

      setActivitySummary({
        steps: metrics.total_steps || 0,
        distance: metrics.distance_covered || 0,
        calories: metrics.calories_burned || 0,
        active_minutes: metrics.active_minutes || 0,
        heart_rate_avg: metrics.avg_heart_rate || 0,
        heart_rate_max: metrics.max_heart_rate || 0,
        heart_rate_resting: 60, // Calculate from HRV data when available
      });

      // Generate heart rate data (simplified - in production, fetch from backend)
      const mockHeartRate: HeartRateData[] = [];
      for (let i = 0; i < 24; i++) {
        mockHeartRate.push({
          timestamp: `${i}:00`,
          value: metrics.avg_heart_rate ? metrics.avg_heart_rate + (Math.random() - 0.5) * 20 : 70,
        });
      }
      setHeartRateData(mockHeartRate);

      setLoading(false);
      showToast('Wearable data loaded successfully', 'success');
    } catch (error: any) {
      console.error('Error fetching wearable data:', error);
      showToast('Failed to load wearable data', 'error');
      setLoading(false);
    }
  };

  const connectDevice = async (deviceType: string) => {
    if (!user) return;
    
    try {
      // Create device in backend
      const deviceIdentifier = `${deviceType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
      await api.wearables.createDevice(
        deviceType.toLowerCase().replace(/\s+/g, '_'),
        deviceType,
        deviceIdentifier
      );
      
      showToast(`${deviceType} connected successfully!`, 'success');
      setShowConnectModal(false);
      
      // Refresh device list
      fetchWearableData();
    } catch (error: any) {
      console.error('Error connecting device:', error);
      showToast(`Failed to connect ${deviceType}`, 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner size="lg" message="Loading wearable data..." />;
  }

  return (
    <div className={`min-h-screen ${darkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-2`}>Wearable Devices</h1>
            <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Monitor your health and fitness data in real-time</p>
          </div>
        <button
          onClick={() => setShowConnectModal(true)}
          className="px-6 py-3 bg-orange-600 text-white font-semibold rounded-lg hover:bg-orange-700 transition-colors flex items-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Connect Device
        </button>
      </div>

        {/* Connected Devices */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Connected Devices</h2>
        <div className="space-y-4">
          {devices.map((device) => (
            <div
              key={device.id}
              className={`flex items-center justify-between p-4 border ${darkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} rounded-lg transition-colors`}
            >
              <div className="flex items-center">
                <div className={`w-12 h-12 rounded-full ${device.status === 'connected' ? 'bg-green-100' : 'bg-gray-100'} flex items-center justify-center mr-4`}>
                  <svg className={`w-6 h-6 ${device.status === 'connected' ? 'text-green-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{device.device_type}</p>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>{device.device_identifier}</p>
                  <p className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                    Last sync: {new Date(device.last_sync).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                {device.battery_level && (
                  <div className="flex items-center">
                    <svg className={`w-5 h-5 mr-1 ${device.battery_level > 20 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>{device.battery_level}%</span>
                  </div>
                )}
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${device.status === 'connected' ? (darkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800') : (darkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800')}`}>
                  {device.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-orange-100 text-sm font-medium">Steps Today</p>
            <svg className="w-8 h-8 text-orange-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-4xl font-bold mb-1">{activitySummary.steps.toLocaleString()}</p>
          <p className="text-orange-100 text-sm">Target: 10,000</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-blue-100 text-sm font-medium">Distance</p>
            <svg className="w-8 h-8 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold mb-1">{activitySummary.distance}</p>
          <p className="text-blue-100 text-sm">miles</p>
        </div>

        <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-green-100 text-sm font-medium">Calories</p>
            <svg className="w-8 h-8 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            </svg>
          </div>
          <p className="text-4xl font-bold mb-1">{activitySummary.calories.toLocaleString()}</p>
          <p className="text-green-100 text-sm">kcal burned</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg shadow-md p-6 text-white">
          <div className="flex items-center justify-between mb-2">
            <p className="text-purple-100 text-sm font-medium">Active Minutes</p>
            <svg className="w-8 h-8 text-purple-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-4xl font-bold mb-1">{activitySummary.active_minutes}</p>
          <p className="text-purple-100 text-sm">minutes</p>
        </div>
      </div>

        {/* Heart Rate Chart */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'}`}>Heart Rate (24h)</h2>
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg: {activitySummary.heart_rate_avg} bpm</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Max: {activitySummary.heart_rate_max} bpm</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
              <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>Resting: {activitySummary.heart_rate_resting} bpm</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={heartRateData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="timestamp" />
            <YAxis domain={[40, 180]} />
            <Tooltip />
            <Area type="monotone" dataKey="value" stroke="#ef4444" fill="#fee2e2" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

        {/* Heart Rate Zones */}
        <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-6`}>
          <h2 className={`text-xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Heart Rate Zones</h2>
        <div className="space-y-3">
          {[
            { zone: 'Peak', range: '171-190 bpm', percentage: 15, color: 'bg-red-600' },
            { zone: 'Cardio', range: '152-171 bpm', percentage: 25, color: 'bg-orange-600' },
            { zone: 'Fat Burn', range: '133-152 bpm', percentage: 35, color: 'bg-yellow-500' },
            { zone: 'Light', range: '114-133 bpm', percentage: 20, color: 'bg-green-500' },
            { zone: 'Rest', range: '<114 bpm', percentage: 5, color: 'bg-blue-500' },
          ].map((zone) => (
            <div key={zone.zone}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center">
                  <div className={`w-4 h-4 ${zone.color} rounded mr-3`}></div>
                  <span className={`font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>{zone.zone}</span>
                  <span className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} ml-2 text-sm`}>({zone.range})</span>
                </div>
                <span className={`${darkMode ? 'text-white' : 'text-gray-900'} font-medium`}>{zone.percentage}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${zone.color} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${zone.percentage}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>

        {/* Connect Device Modal */}
        {showConnectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className={`${darkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg p-8 max-w-md w-full mx-4`}>
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-gray-900'} mb-4`}>Connect Device</h2>
              <p className={`${darkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>Select a device type to connect</p>
            <div className="space-y-3">
              {['Apple Watch', 'Fitbit', 'Garmin', 'Samsung Galaxy Watch', 'Polar', 'Generic HR Monitor'].map((deviceType) => (
                <button
                  key={deviceType}
                  onClick={() => connectDevice(deviceType)}
                  className={`w-full p-4 border-2 ${darkMode ? 'border-gray-600 hover:border-orange-500 hover:bg-orange-900' : 'border-gray-300 hover:border-orange-600 hover:bg-orange-50'} rounded-lg transition-colors text-left flex items-center`}
                >
                  <svg className="w-6 h-6 text-orange-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className={`font-medium ${darkMode ? 'text-white' : 'text-gray-900'}`}>{deviceType}</span>
                </button>
              ))}
            </div>
            <button
              onClick={() => setShowConnectModal(false)}
              className={`w-full mt-6 px-4 py-2 ${darkMode ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} font-semibold rounded-lg transition-colors`}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};
