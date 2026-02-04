import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Trophy, TrendingUp, RefreshCw, Calendar } from 'lucide-react';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

const BasketballTrendsChart = ({ data, period = 'monthly', onRefresh, chartTitle = 'Performance Trends' }) => {
  const { isDarkMode } = useTheme();
  const [chartType, setChartType] = useState('line');
  
  // Set default options for charts based on dark/light mode
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#e5e7eb' : '#1f2937',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: `${period.charAt(0).toUpperCase() + period.slice(1)} ${chartTitle}`,
        color: isDarkMode ? '#e5e7eb' : '#1f2937',
        font: {
          size: 16
        }
      },
      tooltip: {
        backgroundColor: isDarkMode ? 'rgba(17, 24, 39, 0.9)' : 'rgba(255, 255, 255, 0.9)',
        titleColor: isDarkMode ? '#e5e7eb' : '#1f2937',
        bodyColor: isDarkMode ? '#e5e7eb' : '#1f2937',
        borderColor: isDarkMode ? 'rgba(75, 85, 99, 0.5)' : 'rgba(209, 213, 219, 0.5)',
        borderWidth: 1
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#4b5563'
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.2)'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#9ca3af' : '#4b5563'
        },
        grid: {
          color: isDarkMode ? 'rgba(75, 85, 99, 0.2)' : 'rgba(209, 213, 219, 0.2)'
        },
        beginAtZero: true
      }
    }
  };
  
  // Prepare player position data for pie chart
  const playerPositionData = {
    labels: data?.playerPositions?.map(pos => pos.position) || [],
    datasets: [
      {
        label: 'Players by Position',
        data: data?.playerPositions?.map(pos => pos.count) || [],
        backgroundColor: [
          'rgba(255, 99, 132, 0.7)',  // Point Guard - Red
          'rgba(54, 162, 235, 0.7)',  // Shooting Guard - Blue
          'rgba(255, 206, 86, 0.7)',  // Small Forward - Yellow
          'rgba(75, 192, 192, 0.7)',  // Power Forward - Teal
          'rgba(153, 102, 255, 0.7)', // Center - Purple
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
        ],
        borderWidth: 1
      }
    ]
  };
  
  // Render appropriate chart based on type
  const renderChart = () => {
    if (!data || !data.monthly || !data.monthly.labels) {
      return (
        <div className={`flex items-center justify-center h-64 rounded-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-gray-100'
        }`}>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            No data available
          </p>
        </div>
      );
    }
    
    switch (chartType) {
      case 'bar':
        return (
          <Bar 
            data={data.monthly} 
            options={chartOptions} 
            height={300}
          />
        );
      case 'pie':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Players by Position
              </h3>
              <Pie 
                data={playerPositionData} 
                options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                }} 
                height={250}
              />
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-2 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Performance Summary
              </h3>
              <Bar 
                data={{
                  labels: ['Wins', 'Losses', 'Games Played'],
                  datasets: [
                    {
                      data: [
                        data.monthly.datasets[0].data.reduce((sum, val) => sum + val, 0),
                        data.monthly.datasets[1].data.reduce((sum, val) => sum + val, 0),
                        data.monthly.datasets[2].data.reduce((sum, val) => sum + val, 0)
                      ],
                      backgroundColor: [
                        'rgba(16, 185, 129, 0.7)',  // Wins - Green
                        'rgba(239, 68, 68, 0.7)',   // Losses - Red
                        'rgba(59, 130, 246, 0.7)'   // Games - Blue
                      ]
                    }
                  ]
                }}
                options={{
                  ...chartOptions,
                  plugins: {
                    ...chartOptions.plugins,
                    title: {
                      ...chartOptions.plugins.title,
                      text: 'Team Performance Summary'
                    }
                  },
                  indexAxis: 'y'
                }}
                height={250}
              />
            </div>
          </div>
        );
      case 'line':
      default:
        return (
          <Line 
            data={data.monthly} 
            options={chartOptions} 
            height={300}
          />
        );
    }
  };
  
  return (
    <div className={`p-4 rounded-lg shadow-md ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-lg font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Basketball Performance Trends
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setChartType('line')}
            className={`px-3 py-1 text-xs rounded-md ${
              chartType === 'line' 
                ? isDarkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            Line
          </button>
          <button
            onClick={() => setChartType('bar')}
            className={`px-3 py-1 text-xs rounded-md ${
              chartType === 'bar' 
                ? isDarkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            Bar
          </button>
          <button
            onClick={() => setChartType('pie')}
            className={`px-3 py-1 text-xs rounded-md ${
              chartType === 'pie' 
                ? isDarkMode 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-blue-100 text-blue-700'
                : isDarkMode
                  ? 'bg-gray-700 text-gray-300'
                  : 'bg-gray-100 text-gray-600'
            }`}
          >
            Summary
          </button>
          
          <button
            onClick={onRefresh}
            className={`ml-2 p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Refresh data"
          >
            <RefreshCw size={18} />
          </button>
          
          <button
            className={`p-1 rounded-md ${
              isDarkMode 
                ? 'text-gray-300 hover:bg-gray-700' 
                : 'text-gray-600 hover:bg-gray-100'
            }`}
            title="Download chart"
          >
            <TrendingUp size={18} />
          </button>
        </div>
      </div>
      
      <div className="h-80">
        {renderChart()}
      </div>
    </div>
  );
};

export default BasketballTrendsChart; 