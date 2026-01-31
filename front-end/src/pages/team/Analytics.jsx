import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Users,
  DollarSign,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
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
import { Line, Bar, Pie } from 'react-chartjs-2';

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

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [analyticsData, setAnalyticsData] = useState({
    enrollment: {
      total: 0,
      trend: [],
      byAge: []
    },
    revenue: {
      total: 0,
      trend: [],
      byType: []
    },
    attendance: {
      average: 0,
      trend: [],
      byDay: []
    },
    performance: {
      metrics: [],
      trends: []
    }
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/analytics?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAnalyticsData(response.data || analyticsData);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      if (error.response) {
        setError(`Failed to fetch analytics: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to fetch analytics: No response from server. Please check your connection.');
      } else {
        setError(`Failed to fetch analytics: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const response = await axios.get(`/api/admin/analytics/report?range=${dateRange}`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `analytics-report-${dateRange}.pdf`);
      document.body.appendPlayer(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading report:', error);
      if (error.response) {
        setError(`Failed to download report: ${error.response.data.message || error.response.statusText}`);
      } else if (error.request) {
        setError('Failed to download report: No response from server. Please check your connection.');
      } else {
        setError(`Failed to download report: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Chart configurations
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: isDarkMode ? '#fff' : '#333'
        }
      },
      title: {
        display: false
      }
    },
    scales: {
      x: {
        ticks: {
          color: isDarkMode ? '#ccc' : '#666'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#ccc' : '#666'
        },
        grid: {
          color: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
        }
      }
    }
  };

  // Enrollment trend chart data
  const enrollmentChartData = {
    labels: analyticsData.enrollment.trend.map(item => item.date),
    datasets: [
      {
        label: 'Enrollment',
        data: analyticsData.enrollment.trend.map(item => item.value),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        tension: 0.3
      }
    ]
  };

  // Revenue chart data
  const revenueChartData = {
    labels: analyticsData.revenue.byType.map(item => item.type),
    datasets: [
      {
        label: 'Revenue Distribution',
        data: analyticsData.revenue.byType.map(item => item.amount),
        backgroundColor: [
          'rgba(59, 130, 246, 0.7)',
          'rgba(34, 197, 94, 0.7)',
          'rgba(249, 115, 22, 0.7)',
          'rgba(168, 85, 247, 0.7)'
        ],
        borderColor: [
          'rgba(59, 130, 246, 1)',
          'rgba(34, 197, 94, 1)',
          'rgba(249, 115, 22, 1)',
          'rgba(168, 85, 247, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Attendance by day chart data
  const attendanceByDayChartData = {
    labels: analyticsData.attendance.byDay.map(item => item.day),
    datasets: [
      {
        label: 'Attendance %',
        data: analyticsData.attendance.byDay.map(item => item.value),
        backgroundColor: 'rgba(234, 179, 8, 0.7)',
        borderColor: 'rgba(234, 179, 8, 1)',
        borderWidth: 1
      }
    ]
  };

  // Performance metrics chart data
  const performanceChartData = {
    labels: analyticsData.performance.metrics.map(metric => metric.name),
    datasets: [
      {
        label: 'Performance Score',
        data: analyticsData.performance.metrics.map(metric => metric.value),
        backgroundColor: 'rgba(34, 197, 94, 0.7)',
        borderColor: 'rgba(34, 197, 94, 1)',
        borderWidth: 1
      }
    ]
  };

  if (loading && Object.values(analyticsData).every(v => !v || (Array.isArray(v) && v.length === 0))) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Team Performance Analytics</h1>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`rounded-md ${isDarkMode
                  ? 'bg-gray-700 text-white'
                  : 'bg-gray-50 text-gray-900'
                }`}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className={`flex items-center space-x-2 px-3 py-2 rounded-md ${isDarkMode
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-200 hover:bg-gray-300 text-gray-900'
                }`}
              disabled={loading}
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleDownloadReport}
              className={`flex items-center space-x-2 px-4 py-2 rounded-md ${isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              disabled={loading}
            >
              <Download className="h-4 w-4" />
              <span>Download Report</span>
            </button>
          </div>
        </div>

        {error && (
          <div className={`mb-4 p-4 rounded-md flex items-center ${isDarkMode ? 'bg-red-900/30 text-red-400' : 'bg-red-100 text-red-700'
            }`}>
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Possessions Analyzed</p>
                <p className="text-2xl font-bold">{analyticsData.enrollment.total}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Points Per Possession</p>
                <p className="text-2xl font-bold">1.12</p>
              </div>
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Shooting Accuracy</p>
                <p className="text-2xl font-bold">48.5%</p>
              </div>
              <BarChartIcon className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Defensive Rating</p>
                <p className="text-2xl font-bold text-red-500">-4.2</p>
              </div>
              <Users className="h-8 w-8 text-red-500" />
            </div>
          </div>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Enrollment Trend */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Enrollment Trend</h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Line data={enrollmentChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Revenue Distribution */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Revenue Distribution</h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-green-500"></div>
                </div>
              ) : (
                <Pie data={revenueChartData} options={{
                  ...chartOptions,
                  maintainAspectRatio: false,
                  plugins: {
                    ...chartOptions.plugins,
                    legend: {
                      ...chartOptions.plugins.legend,
                      position: 'right'
                    }
                  }
                }} />
              )}
            </div>
          </div>

          {/* Attendance by Day */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Attendance by Day</h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-yellow-500"></div>
                </div>
              ) : (
                <Bar data={attendanceByDayChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Performance Metrics */}
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-lg font-semibold mb-4">Performance Metrics</h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : (
                <Bar
                  data={performanceChartData}
                  options={{
                    ...chartOptions,
                    indexAxis: 'y',
                    scales: {
                      ...chartOptions.scales,
                      x: {
                        ...chartOptions.scales.x,
                        suggestedMax: 100
                      }
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 