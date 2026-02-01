import React, { useState, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import api from '../../../utils/axiosConfig';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  Activity,
  Clock,
  CheckCircle,
  AlertTriangle,
  Sparkles,
  Cpu,
  BarChart2,
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [reportFormat, setReportFormat] = useState('pdf');
  const [reportFilters, setReportFilters] = useState({
    coachIds: [],
    playerIds: [],
    statusFilter: 'all',
    fiscalYear: new Date().getFullYear(),
    departmentFilter: 'all',
    reportType: 'summary',
    severityFilter: 'all',
    groupBy: 'daily'
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [reportPreview, setReportPreview] = useState(null);
  const [availableCoaches, setAvailableCoaches] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const { isDarkMode } = useTheme();

  const reportTypes = [
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Player stats, game efficiency, and scoring analytics',
      icon: Activity,
      color: 'text-green-500'
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Daily training and match attendance records',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      id: 'players',
      title: 'Roster Report',
      description: 'Player registration and demographic data',
      icon: Users,
      color: 'text-pink-500'
    },
    {
      id: 'coach',
      title: 'Staff Performance',
      description: 'Coaching impact and team lead metrics',
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      id: 'skills',
      title: 'Skill Analysis',
      description: 'In-depth breakdown of player skill progression',
      icon: BarChart2,
      color: 'text-emerald-500'
    },
    {
      id: 'team-attendance',
      title: 'Team Attendance',
      description: 'Track and manage overall roster participation',
      icon: CheckCircle,
      color: 'text-indigo-500'
    },
    {
      id: 'injuries',
      title: 'Injury Reports',
      description: 'Health, recovery, and player availability',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    {
      id: 'trends',
      title: 'Season Trend Analysis',
      description: 'Long-term team pattern and performance insights',
      icon: BarChart2,
      color: 'text-orange-500'
    }
  ];

  useEffect(() => {
    const fetchRecentReports = async () => {
      try {
        const response = await api.get('/admin/reports/recent');
        setRecentReports(response.data || []);
      } catch (error) {
        console.error('Error fetching recent reports:', error);
      }
    };

    const fetchCoachesAndPlayers = async () => {
      try {
        const [coachesRes, playersRes] = await Promise.all([
          api.get('/admin/coaches'),
          api.get('/admin/players')
        ]);
        setAvailableCoaches(coachesRes.data || []);
        setAvailablePlayers(playersRes.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      }
    };

    fetchRecentReports();
    fetchCoachesAndPlayers();
  }, []);

  const handleGenerateReport = async () => {
    if (selectedReport === 'team-attendance') return;

    if (!selectedReport || !dateRange.startDate || !dateRange.endDate) {
      toast.error('Please select a report type and date range');
      return;
    }

    try {
      setLoading(true);
      setGenerating(true);
      setError('');

      const previewResponse = await api.post('/admin/reports/preview', {
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });

      setReportPreview(previewResponse.data);
      toast.success('Report preview generated');
    } catch (error) {
      setError('Failed to generate report preview.');
      toast.error('Failed to generate report preview');
    } finally {
      setGenerating(false);
      setLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    try {
      setLoading(true);
      const response = await api.post('/admin/reports/generate',
        {
          reportType: selectedReport,
          format: reportFormat,
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          filters: reportFilters
        },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = reportFormat === 'csv' ? 'csv' : 'pdf';
      link.setAttribute('download', `${selectedReport}-report.${fileExtension}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (error) {
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const renderReportContent = () => {
    if (selectedReport === 'team-attendance') {
      return (
        <div className={`p-6 rounded-lg mb-6 shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
          <Calendar className="h-12 w-12 mx-auto mb-4 text-indigo-500" />
          <h2 className="text-xl font-bold mb-2">Team Attendance Overview</h2>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            To manage daily check-ins and view detailed participation logs, please visit the main Attendance module.
          </p>
          <a
            href="/team/players/attendance"
            className={`inline-flex items-center space-x-2 px-6 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-indigo-500 hover:bg-indigo-600'} text-white`}
          >
            <Users className="h-4 w-4" />
            <span>Go to Attendance Module</span>
          </a>
        </div>
      );
    }

    return (
      <div className={`p-6 rounded-lg mb-6 shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Sparkles className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          Report Configuration
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <div className={`flex items-center rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className={`w-full bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <div className={`flex items-center rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'} px-3 py-2 border ${isDarkMode ? 'border-gray-600' : 'border-gray-300'}`}>
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className={`w-full bg-transparent outline-none ${isDarkMode ? 'text-white' : 'text-gray-900'}`}
              />
            </div>
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Report Format</label>
          <div className="flex space-x-4">
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="pdf" checked={reportFormat === 'pdf'} onChange={() => setReportFormat('pdf')} className="form-radio h-4 w-4 text-blue-600" />
              <span>PDF</span>
            </label>
            <label className="flex items-center space-x-2 cursor-pointer">
              <input type="radio" value="csv" checked={reportFormat === 'csv'} onChange={() => setReportFormat('csv')} className="form-radio h-4 w-4 text-blue-600" />
              <span>CSV</span>
            </label>
          </div>
        </div>

        {selectedReport && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 flex items-center">
              <Cpu className={`mr-2 h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
              Report Options
            </h3>

            {selectedReport === 'skills' && (
              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div>
                  <label className="block text-sm font-medium mb-2">Season</label>
                  <select
                    value={reportFilters.fiscalYear}
                    onChange={(e) => setReportFilters({ ...reportFilters, fiscalYear: e.target.value })}
                    className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border`}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}-{year + 1} Season</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Age Group</label>
                  <select
                    value={reportFilters.departmentFilter}
                    onChange={(e) => setReportFilters({ ...reportFilters, departmentFilter: e.target.value })}
                    className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border`}
                  >
                    <option value="all">All Groups</option>
                    <option value="u12">U12 Development</option>
                    <option value="u14">U14 Intermediate</option>
                    <option value="u16">U16 Elite</option>
                    <option value="u18">U18 Academy</option>
                  </select>
                </div>
              </div>
            )}

            {selectedReport === 'coach' && (
              <div className={`p-4 rounded-lg border ${isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'}`}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Status</label>
                  <select
                    value={reportFilters.statusFilter}
                    onChange={(e) => setReportFilters({ ...reportFilters, statusFilter: e.target.value })}
                    className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border`}
                  >
                    <option value="all">All Staff</option>
                    <option value="active">Active Only</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Staff Members</label>
                  <select
                    multiple
                    size="3"
                    className={`w-full p-2 rounded-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} border`}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setReportFilters({ ...reportFilters, coachIds: selectedOptions });
                    }}
                  >
                    {availableCoaches.map(coach => (
                      <option key={coach._id} value={coach._id}>{coach.firstName} {coach.lastName}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="flex mt-6 space-x-3">
          <button
            onClick={handleGenerateReport}
            disabled={loading || generating}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white ${(loading || generating) ? 'opacity-50' : ''}`}
          >
            {generating ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> : <FileText className="h-4 w-4" />}
            <span>{generating ? 'Processing...' : 'Generate Preview'}</span>
          </button>

          {reportPreview && (
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${isDarkMode ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white ${loading ? 'opacity-50' : ''}`}
            >
              <Download className="h-4 w-4" />
              <span>Export File</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  const renderReportPreview = () => {
    if (!reportPreview) return null;

    return (
      <div className={`mb-8 p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FileText className="mr-2 h-5 w-5 text-green-500" />
          Report Preview
        </h2>
        <div className={`border rounded-lg overflow-hidden ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className={`p-4 border-b ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <h3 className="font-semibold text-lg">{reportTypes.find(r => r.id === selectedReport)?.title || 'Analytics'} Report</h3>
            <p className="text-sm text-gray-500">{dateRange.startDate} to {dateRange.endDate}</p>
          </div>
          <div className="p-4">
            <div className="text-center py-8">
              <p className="text-gray-500">Preview data generated. Export the full file to see complete details and visualizations.</p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className={`mb-8 p-6 rounded-xl shadow-lg ${isDarkMode ? 'bg-indigo-950 text-white' : 'bg-blue-500 text-white'}`}>
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="mt-1 opacity-80">Generate comprehensive basketball analytics and roster reports</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`p-6 rounded-lg cursor-pointer transition-all ${isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50 shadow'} ${selectedReport === report.id ? 'ring-2 ring-blue-500 transform scale-[1.02]' : ''}`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}><report.icon className={`h-6 w-6 ${report.color}`} /></div>
                <div>
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className="text-sm opacity-60">{report.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {selectedReport && renderReportContent()}
        {reportPreview && selectedReport !== 'team-attendance' && renderReportPreview()}

        {selectedReport !== 'team-attendance' && (
          <div className={`p-6 rounded-lg shadow-md ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Clock className="mr-2 h-5 w-5 text-purple-500" />
              Recent Reports
            </h2>
            <div className="space-y-4">
              {recentReports.length > 0 ? recentReports.map((report, index) => (
                <div key={index} className={`flex items-center justify-between p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex items-center space-x-4">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{report.title}</p>
                      <p className="text-sm opacity-60">Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 opacity-40">
                  <FileText className="h-12 w-12 mx-auto mb-2" />
                  <p>No recent reports found.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reports;