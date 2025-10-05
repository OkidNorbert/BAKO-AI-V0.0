import React, { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import { useAutoRefreshSettings } from '../context/AutoRefreshContext';

export const AutoRefreshSettings: React.FC = () => {
  const { darkMode } = useTheme();
  const { settings, updateSettings, globalPause, setGlobalPause } = useAutoRefreshSettings();
  const [isOpen, setIsOpen] = useState(false);

  const intervalOptions = [
    { value: 30000, label: '30 seconds' },
    { value: 60000, label: '1 minute' },
    { value: 120000, label: '2 minutes' },
    { value: 300000, label: '5 minutes' },
    { value: 600000, label: '10 minutes' },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors
          ${darkMode 
            ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' 
            : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
          }
        `}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm">Auto-refresh</span>
        {globalPause && (
          <div className="w-2 h-2 bg-orange-500 rounded-full" title="Paused due to inactivity" />
        )}
      </button>

      {isOpen && (
        <div className={`
          absolute right-0 mt-2 w-80 rounded-lg shadow-lg border z-50
          ${darkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
        `}>
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
                Auto-refresh Settings
              </h3>
              <button
                onClick={() => setIsOpen(false)}
                className={`p-1 rounded-md ${darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              {/* Enable/Disable */}
              <div className="flex items-center justify-between">
                <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Enable auto-refresh
                </label>
                <button
                  onClick={() => updateSettings({ enabled: !settings.enabled })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.enabled ? 'bg-orange-600' : 'bg-gray-400'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.enabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Interval */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Refresh interval
                </label>
                <select
                  value={settings.interval}
                  onChange={(e) => updateSettings({ interval: parseInt(e.target.value) })}
                  className={`
                    w-full px-3 py-2 rounded-md border text-sm
                    ${darkMode 
                      ? 'bg-gray-700 border-gray-600 text-white' 
                      : 'bg-white border-gray-300 text-gray-900'
                    }
                  `}
                >
                  {intervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Respect user activity */}
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pause when user is active
                  </label>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Prevents refreshing while you're using the app
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ respectUserActivity: !settings.respectUserActivity })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.respectUserActivity ? 'bg-orange-600' : 'bg-gray-400'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.respectUserActivity ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Respect visibility */}
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Pause when tab is hidden
                  </label>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Stops refreshing when you switch tabs
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ respectVisibility: !settings.respectVisibility })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.respectVisibility ? 'bg-orange-600' : 'bg-gray-400'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.respectVisibility ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Show indicator */}
              <div className="flex items-center justify-between">
                <div>
                  <label className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                    Show refresh indicator
                  </label>
                  <p className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Display refresh status in the corner
                  </p>
                </div>
                <button
                  onClick={() => updateSettings({ showIndicator: !settings.showIndicator })}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                    ${settings.showIndicator ? 'bg-orange-600' : 'bg-gray-400'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${settings.showIndicator ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>

              {/* Global pause status */}
              {globalPause && (
                <div className={`p-3 rounded-md ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-orange-500 rounded-full" />
                    <span className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                      Auto-refresh paused due to inactivity
                    </span>
                  </div>
                  <button
                    onClick={() => setGlobalPause(false)}
                    className={`mt-2 text-sm text-orange-600 hover:text-orange-700`}
                  >
                    Resume now
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
