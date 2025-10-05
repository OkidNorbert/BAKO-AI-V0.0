import React, { useState, useEffect } from 'react';
import { useTheme } from '../context/ThemeContext';

interface SmartRefreshIndicatorProps {
  isRefreshing: boolean;
  lastRefresh: Date | null;
  onManualRefresh?: () => void;
  showIndicator?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}

export const SmartRefreshIndicator: React.FC<SmartRefreshIndicatorProps> = ({
  isRefreshing,
  lastRefresh,
  onManualRefresh,
  showIndicator = true,
  position = 'top-right',
}) => {
  const { darkMode } = useTheme();
  const [showTooltip, setShowTooltip] = useState(false);
  const [timeSinceRefresh, setTimeSinceRefresh] = useState<string>('');

  // Update time since refresh
  useEffect(() => {
    if (!lastRefresh) return;

    const updateTime = () => {
      const now = new Date();
      const diff = now.getTime() - lastRefresh.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);

      if (seconds < 60) {
        setTimeSinceRefresh(`${seconds}s ago`);
      } else if (minutes < 60) {
        setTimeSinceRefresh(`${minutes}m ago`);
      } else {
        setTimeSinceRefresh(`${hours}h ago`);
      }
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [lastRefresh]);

  if (!showIndicator) return null;

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50`}>
      <div className="relative">
        {/* Main indicator */}
        <div
          className={`
            flex items-center space-x-2 px-3 py-2 rounded-lg shadow-lg transition-all duration-300
            ${darkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}
            ${isRefreshing ? 'animate-pulse' : ''}
          `}
          onMouseEnter={() => setShowTooltip(true)}
          onMouseLeave={() => setShowTooltip(false)}
        >
          {/* Refresh icon */}
          <div className="flex items-center">
            {isRefreshing ? (
              <div className="w-4 h-4 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg
                className={`w-4 h-4 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            )}
          </div>

          {/* Status text */}
          <span className={`text-sm font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>
            {isRefreshing ? 'Refreshing...' : 'Auto-refresh'}
          </span>

          {/* Manual refresh button */}
          {onManualRefresh && !isRefreshing && (
            <button
              onClick={onManualRefresh}
              className={`
                p-1 rounded-md transition-colors
                ${darkMode 
                  ? 'text-gray-400 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }
              `}
              title="Refresh now"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          )}
        </div>

        {/* Tooltip */}
        {showTooltip && (
          <div className={`
            absolute ${position.includes('right') ? 'right-0' : 'left-0'} top-full mt-2
            px-3 py-2 rounded-md shadow-lg text-sm
            ${darkMode ? 'bg-gray-900 text-gray-300' : 'bg-gray-800 text-white'}
            whitespace-nowrap
          `}>
            {isRefreshing ? (
              'Refreshing data...'
            ) : lastRefresh ? (
              `Last updated: ${timeSinceRefresh}`
            ) : (
              'Auto-refresh enabled'
            )}
          </div>
        )}
      </div>
    </div>
  );
};
