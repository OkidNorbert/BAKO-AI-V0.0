import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { adminAPI } from '../../services/api';
import {
  BarChart as BarChartIcon,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Users,
  Target,
  Calendar,
  TrendingUp,
  Filter,
  Download,
  AlertCircle,
  RefreshCw,
  Trophy,
  Activity,
  Clock,
  Zap,
  Award,

  Timer,
  Eye
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

const TeamAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState('month');
  const [selectedMetric, setSelectedMetric] = useState('overview');
  const [analyticsData, setAnalyticsData] = useState({
    teamPerformance: {
      wins: 0,
      losses: 0,
      winPercentage: 0,
      pointsPerGame: 0,
      pointsAllowed: 0,
      trend: []
    },
    playerStats: {
      totalPlayers: 0,
      activePlayers: 0,
      averageRating: 0,
      topPerformers: [],
      positionBreakdown: []
    },
    shootingAnalytics: {
      fieldGoalPercentage: 0,
      threePointPercentage: 0,
      freeThrowPercentage: 0,
      shootingTrends: [],
      shotDistribution: []
    },
    gameMetrics: {
      gamesPlayed: 0,
      averageDuration: 0,
      possessionAnalysis: [],
      turnoverAnalysis: [],
      reboundingStats: []
    },
    trainingData: {
      sessionsCompleted: 0,
      hoursTrained: 0,
      skillImprovement: [],
      attendanceRate: 0
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

      const response = await adminAPI.getReports();
      if (response.data) {
        setAnalyticsData(prevData => ({ ...prevData, ...response.data }));
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to fetch analytics. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      setError('');

      // Mock download functionality
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Create a mock CSV report
      const csvContent = [
        ['Metric', 'Value'],
        ['Wins', analyticsData.teamPerformance.wins],
        ['Losses', analyticsData.teamPerformance.losses],
        ['Win Percentage', `${analyticsData.teamPerformance.winPercentage}%`],
        ['Points Per Game', analyticsData.teamPerformance.pointsPerGame],
        ['Field Goal %', `${analyticsData.shootingAnalytics.fieldGoalPercentage}%`],
        ['3-Point %', `${analyticsData.shootingAnalytics.threePointPercentage}%`],
        ['Free Throw %', `${analyticsData.shootingAnalytics.freeThrowPercentage}%`]
      ].map(row => row.join(',')).join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `basketball-analytics-${dateRange}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Basketball-specific chart configurations
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
          color: isDarkMode ? '#444' : '#ddd'
        }
      },
      y: {
        ticks: {
          color: isDarkMode ? '#ccc' : '#666'
        },
        grid: {
          color: isDarkMode ? '#444' : '#ddd'
        }
      }
    }
  };

  // Team performance trend chart data
  const teamPerformanceChartData = {
    labels: analyticsData.teamPerformance.trend.map(item => item.date),
    datasets: [
      {
        label: 'Win Percentage',
        data: analyticsData.teamPerformance.trend.map(item => item.winPercentage),
        borderColor: 'rgba(34, 197, 94, 1)',
        backgroundColor: 'rgba(34, 197, 94, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Shooting trends chart data
  const shootingTrendsChartData = {
    labels: analyticsData.shootingAnalytics.shootingTrends.map(item => item.date),
    datasets: [
      {
        label: 'Field Goal %',
        data: analyticsData.shootingAnalytics.shootingTrends.map(item => item.fg),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: '3-Point %',
        data: analyticsData.shootingAnalytics.shootingTrends.map(item => item.three),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
      {
        label: 'Free Throw %',
        data: analyticsData.shootingAnalytics.shootingTrends.map(item => item.ft),
        borderColor: 'rgba(245, 158, 11, 1)',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.4
      }
    ]
  };

  // Shot distribution pie chart data
  const shotDistributionChartData = {
    labels: analyticsData.shootingAnalytics.shotDistribution.map(item => item.type),
    datasets: [
      {
        data: analyticsData.shootingAnalytics.shotDistribution.map(item => item.percentage),
        backgroundColor: [
          'rgba(34, 197, 94, 0.7)',
          'rgba(59, 130, 246, 0.7)',
          'rgba(239, 68, 68, 0.7)',
          'rgba(245, 158, 11, 0.7)'
        ],
        borderColor: [
          'rgba(34, 197, 94, 1)',
          'rgba(59, 130, 246, 1)',
          'rgba(239, 68, 68, 1)',
          'rgba(245, 158, 11, 1)'
        ],
        borderWidth: 1
      }
    ]
  };

  // Position breakdown chart data
  const positionBreakdownChartData = {
    labels: analyticsData.playerStats.positionBreakdown.map(item => item.position),
    datasets: [
      {
        label: 'Average Rating',
        data: analyticsData.playerStats.positionBreakdown.map(item => item.avgRating),
        backgroundColor: 'rgba(168, 85, 247, 0.7)',
        borderColor: 'rgba(168, 85, 247, 1)',
        borderWidth: 1
      }
    ]
  };

  // Skill improvement chart data
  const skillImprovementChartData = {
    labels: analyticsData.trainingData.skillImprovement.map(item => item.date),
    datasets: [
      {
        label: 'Shooting',
        data: analyticsData.trainingData.skillImprovement.map(item => item.shooting),
        borderColor: 'rgba(239, 68, 68, 1)',
        backgroundColor: 'rgba(239, 68, 68, 0.1)',
        tension: 0.4
      },
      {
        label: 'Dribbling',
        data: analyticsData.trainingData.skillImprovement.map(item => item.dribbling),
        borderColor: 'rgba(59, 130, 246, 1)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        tension: 0.4
      },
      {
        label: 'Defense',
        data: analyticsData.trainingData.skillImprovement.map(item => item.defense),
        borderColor: 'rgba(34, 197, 94, 1)',
      }
    ]
  };

  if (loading && Object.values(analyticsData).every(v => !v || (Array.isArray(v) && v.length === 0))) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center">
              <Activity className="mr-3 h-8 w-8 text-orange-500" />
              Basketball Analytics
            </h1>
            <p className={`mt-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Comprehensive team performance insights and metrics
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`rounded-md px-4 py-2 ${isDarkMode
                ? 'bg-gray-700 text-white border-gray-600'
                : 'bg-white text-gray-900 border-gray-300'
                } border`}
            >
              <option value="week">Last Week</option>
              <option value="month">Last Month</option>
              <option value="quarter">Last Quarter</option>
              <option value="year">Last Year</option>
            </select>
            <button
              onClick={fetchAnalytics}
              className={`p-2 rounded-md ${isDarkMode
                ? 'bg-gray-700 hover:bg-gray-600 text-white'
                : 'bg-white hover:bg-gray-100 text-gray-900'
                } border`}
            >
              <RefreshCw className="h-5 w-5" />
            </button>
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className={`flex items-center px-4 py-2 rounded-md ${loading
                ? 'bg-gray-400 cursor-not-allowed'
                : isDarkMode
                  ? 'bg-orange-600 hover:bg-orange-700 text-white'
                  : 'bg-orange-500 hover:bg-orange-600 text-white'
                }`}
            >
              <Download className="h-4 w-4 mr-2" />
              {loading ? 'Downloading...' : 'Download Report'}
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded-lg bg-red-100 text-red-800 border-l-4 border-red-500 flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            <span>{error}</span>
          </div>
        )}

        {/* Key Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Win Rate</p>
                <p className="text-2xl font-bold">{analyticsData.teamPerformance.winPercentage}%</p>
                <p className={`text-sm ${analyticsData.teamPerformance.winPercentage >= 60 ? 'text-green-500' : 'text-red-500'}`}>
                  {analyticsData.teamPerformance.wins}W - {analyticsData.teamPerformance.losses}L
                </p>
              </div>
              <Trophy className={`h-8 w-8 ${analyticsData.teamPerformance.winPercentage >= 60 ? 'text-green-500' : 'text-red-500'}`} />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Points Per Game</p>
                <p className="text-2xl font-bold">{analyticsData.teamPerformance.pointsPerGame}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  {analyticsData.teamPerformance.pointsAllowed} allowed
                </p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Field Goal %</p>
                <p className="text-2xl font-bold">{analyticsData.shootingAnalytics.fieldGoalPercentage}%</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  3PT: {analyticsData.shootingAnalytics.threePointPercentage}%
                </p>
              </div>
              <Activity className="h-8 w-8 text-orange-500" />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Active Players</p>
                <p className="text-2xl font-bold">{analyticsData.playerStats.activePlayers}</p>
                <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                  Avg Rating: {analyticsData.playerStats.averageRating}
                </p>
              </div>
              <Users className="h-8 w-8 text-purple-500" />
            </div>
          </div>
        </div>

        {/* Basketball-Specific Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Team Performance Trend */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-green-500" />
              Team Performance Trend
            </h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Line data={teamPerformanceChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Shooting Trends */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="mr-2 h-5 w-5 text-blue-500" />
              Shooting Trends
            </h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Line data={shootingTrendsChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Shot Distribution */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-orange-500" />
              Shot Distribution
            </h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Pie data={shotDistributionChartData} options={chartOptions} />
              )}
            </div>
          </div>

          {/* Position Breakdown */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Users className="mr-2 h-5 w-5 text-purple-500" />
              Position Performance
            </h2>
            <div className="h-64">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
                </div>
              ) : (
                <Bar data={positionBreakdownChartData} options={chartOptions} />
              )}
            </div>
          </div>
        </div>

        {/* Additional Analytics Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Top Performers */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Trophy className="mr-2 h-5 w-5 text-yellow-500" />
              Top Performers
            </h2>
            <div className="space-y-3">
              {analyticsData.playerStats.topPerformers.map((player, index) => (
                <div key={index} className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {player.name}
                      </p>
                      <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.position} • Rating: {player.rating}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {player.points} PPG
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                        {player.assists || player.rebounds} {player.assists ? 'AST' : 'REB'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Metrics */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-blue-500" />
              Game Metrics
            </h2>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Games Played</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.gameMetrics.gamesPlayed}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Avg Duration</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.gameMetrics.averageDuration} min
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Offensive Rebounds</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.gameMetrics.reboundingStats?.[0]?.count || 0}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Defensive Rebounds</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.gameMetrics.reboundingStats?.[1]?.count || 0}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Training Analytics */}
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
            <h2 className="text-lg font-semibold mb-4 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-green-500" />
              Training Analytics
            </h2>
            <div className="space-y-3">
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Sessions Completed</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.trainingData.sessionsCompleted}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Hours Trained</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.trainingData.hoursTrained}
                  </span>
                </div>
              </div>
              <div className={`p-3 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <div className="flex justify-between">
                  <span className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>Attendance Rate</span>
                  <span className={`font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                    {analyticsData.trainingData.attendanceRate}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Skill Improvement Chart */}
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow-md'}`}>
          <h2 className="text-lg font-semibold mb-4 flex items-center">
            <Zap className="mr-2 h-5 w-5 text-yellow-500" />
            Skill Improvement Trends
          </h2>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-orange-500"></div>
              </div>
            ) : (
              <Line data={skillImprovementChartData} options={chartOptions} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamAnalytics; 