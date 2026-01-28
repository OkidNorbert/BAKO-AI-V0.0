import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import {
  FileText,
  Download,
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  CheckCircle,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Info,
  AlertTriangle,
  Sparkles,
  Cpu,
  BarChart2,
  PieChart,
  Save
} from 'lucide-react';
import CoachPaymentReport from '../../components/reports/CoachPaymentReport';
import { toast } from 'react-hot-toast';
import DailyTransactionSummary from '../../components/reports/DailyTransactionSummary';
import FinancialTrendsChart from '../../components/reports/FinancialTrendsChart';

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
    groupBy: 'daily',
    adherenceType: 'fiscal-year'
  });
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const [recentReports, setRecentReports] = useState([]);
  const [reportPreview, setReportPreview] = useState(null);
  const [availableCoachs, setAvailableCoachs] = useState([]);
  const [availablePlayers, setAvailablePlayers] = useState([]);
  const { isDarkMode } = useTheme();
  const [reportType, setReportType] = useState('daily-summaries');

  const reportTypes = [
    {
      id: 'financial',
      title: 'Financial Report',
      description: 'Revenue, expenses, and payment analytics',
      icon: DollarSign,
      color: 'text-green-500'
    },
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Daily attendance and absence records',
      icon: Calendar,
      color: 'text-blue-500'
    },
    {
      id: 'children',
      title: 'Players Report',
      description: 'Enrollment and demographic data',
      icon: Users,
      color: 'text-pink-500'
    },
    {
      id: 'staff',
      title: 'Staff Performance',
      description: 'Coach performance metrics',
      icon: TrendingUp,
      color: 'text-purple-500'
    },
    {
      id: 'budget',
      title: 'Budget Report',
      description: 'Budget allocation and expense tracking',
      icon: DollarSign,
      color: 'text-emerald-500'
    },
    {
      id: 'coach-payments',
      title: 'Coach Payments',
      description: 'Track and manage all coach payments',
      icon: CheckCircle,
      color: 'text-indigo-500'
    },
    {
      id: 'incidents',
      title: 'Incident Management',
      description: 'Health, behavior and safety incidents',
      icon: AlertTriangle,
      color: 'text-amber-500'
    },
    {
      id: 'trends',
      title: 'Trend Analysis',
      description: 'Long-term patterns and insights',
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
        toast.error('Failed to fetch recent reports.');
      }
    };

    const fetchCoachsAndPlayers = async () => {
      try {
        // Fetch coachs
        const coachsResponse = await api.get('/admin/coachs');
        setAvailableCoachs(coachsResponse.data || []);

        // Fetch children
        const childrenResponse = await api.get('/admin/children');
        setAvailablePlayers(childrenResponse.data || []);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast.error('Failed to load filter data.');
      }
    };

    fetchRecentReports();
    fetchCoachsAndPlayers();
  }, []);

  const handleGenerateReport = async () => {
    if (selectedReport === 'coach-payments') {
      return; // No need to generate report for coach payments as it has its own component
    }
    
    if (!selectedReport || !dateRange.startDate || !dateRange.endDate) {
      setError('Please select a report type and date range');
      toast.error('Please select a report type and date range');
      return;
    }

    try {
      setLoading(true);
      setGenerating(true);
      setError('');
      
      console.log('Generating report preview:', {
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });
      
      // Get report preview first
      const previewResponse = await api.post('/admin/reports/preview', {
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });
      
      setReportPreview(previewResponse.data);
      setGenerating(false);
      toast.success('Report preview generated');
      
    } catch (error) {
      console.error('Error generating report preview:', error);
      
      let errorMessage = 'Failed to generate report preview. Please try again later.';
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        errorMessage += ` (${error.response.status}: ${error.response.data.message || 'Unknown error'})`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setGenerating(false);
    } finally {
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
        {
          responseType: 'blob'
        }
      );
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = reportFormat === 'csv' ? 'csv' : 'pdf';
      link.setAttribute('download', `${selectedReport}-report.${fileExtension}`);
      document.body.appendPlayer(link);
      link.click();
      link.remove();
      
      toast.success('Report downloaded successfully');
      
      // Add to recent reports manually since we already have the blob
      const newReport = {
        id: Date.now(),
        title: `${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report`,
        filename: `${selectedReport}-report.${fileExtension}`,
        generatedAt: new Date().toISOString(),
        data: response.data
      };
      
      setRecentReports([newReport, ...recentReports].slice(0, 10));
      
    } catch (error) {
      console.error('Error downloading report:', error);
      setError('Failed to download report. Please try again later.');
      toast.error('Failed to download report');
    } finally {
      setLoading(false);
    }
  };

  const generateReport = async (type) => {
    try {
      setLoading(true);
      setGenerating(true);
      setError('');
      
      console.log('Generating report:', {
        reportType: selectedReport,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });
      
      const response = await api.post('/admin/reports/generate', {
        reportType: selectedReport,
        format: reportFormat,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });
      
      setReportPreview(response.data);
      setGenerating(false);
      toast.success('Report generated successfully');
      
    } catch (error) {
      console.error('Error generating report:', error);
      
      let errorMessage = 'Failed to generate report. Please try again later.';
      if (error.response) {
        console.error('Error response:', error.response.status, error.response.data);
        errorMessage += ` (${error.response.status}: ${error.response.data.message || 'Unknown error'})`;
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
      setGenerating(false);
    } finally {
      setLoading(false);
    }
  };

  const exportReport = async (type, format) => {
    try {
      setLoading(true);
      const response = await api.post('/admin/reports/generate', {
        reportType: selectedReport,
        format: format,
        startDate: dateRange.startDate,
        endDate: dateRange.endDate,
        filters: reportFilters
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileExtension = format === 'csv' ? 'csv' : 'pdf';
      link.setAttribute('download', `${selectedReport}-${type}-report.${fileExtension}`);
      document.body.appendPlayer(link);
      link.click();
      link.remove();
      
      toast.success('Report exported successfully');
      
      // Add to recent reports manually since we already have the blob
      const newReport = {
        id: Date.now(),
        title: `${selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} ${type.charAt(0).toUpperCase() + type.slice(1)} Report`,
        filename: `${selectedReport}-${type}-report.${fileExtension}`,
        generatedAt: new Date().toISOString(),
        data: response.data
      };
      
      setRecentReports([newReport, ...recentReports].slice(0, 10));
      
    } catch (error) {
      console.error('Error exporting report:', error);
      setError('Failed to export report. Please try again later.');
      toast.error('Failed to export report');
    } finally {
      setLoading(false);
    }
  };

  // Render the appropriate content based on selected report
  const renderReportContent = () => {
    if (selectedReport === 'coach-payments') {
      return <CoachPaymentReport />;
    }
    
    return (
      <div className={`p-6 rounded-lg mb-6 shadow-md ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <Sparkles className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
          Report Configuration
        </h2>
        
        {/* Date Range Selection with improved styling */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <div className={`flex items-center rounded-md ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            } px-3 py-2 border ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className={`w-full bg-transparent outline-none ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <div className={`flex items-center rounded-md ${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            } px-3 py-2 border ${
              isDarkMode ? 'border-gray-600' : 'border-gray-300'
            }`}>
              <Calendar className="h-4 w-4 mr-2 text-gray-500" />
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className={`w-full bg-transparent outline-none ${
                  isDarkMode ? 'text-white' : 'text-gray-900'
              }`}
            />
            </div>
          </div>
        </div>
        
        {/* Format Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Report Format</label>
          <div className="flex space-x-4">
            <label className={`flex items-center space-x-2 cursor-pointer ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <input
                type="radio"
                value="pdf"
                checked={reportFormat === 'pdf'}
                onChange={() => setReportFormat('pdf')}
                className="form-radio h-4 w-4"
              />
              <span>PDF</span>
            </label>
            <label className={`flex items-center space-x-2 cursor-pointer ${
              isDarkMode ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <input
                type="radio"
                value="csv"
                checked={reportFormat === 'csv'}
                onChange={() => setReportFormat('csv')}
                className="form-radio h-4 w-4"
              />
              <span>CSV</span>
            </label>
          </div>
        </div>
        
        {/* Conditional Filters Based on Report Type */}
        {selectedReport && (
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-3 flex items-center">
              <Cpu className={`mr-2 h-4 w-4 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
              Report Options
            </h3>
            
            {/* Budget Report Filters */}
            {selectedReport === 'budget' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }">
                <div>
                  <label className="block text-sm font-medium mb-2">Fiscal Year</label>
                  <select
                    value={reportFilters.fiscalYear}
                    onChange={(e) => setReportFilters({...reportFilters, fiscalYear: e.target.value})}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                  >
                    {[...Array(5)].map((_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Department</label>
                  <select
                    value={reportFilters.departmentFilter}
                    onChange={(e) => setReportFilters({...reportFilters, departmentFilter: e.target.value})}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                  >
                    <option value="all">All Departments</option>
                    <option value="operations">Operations</option>
                    <option value="staff">Staff</option>
                    <option value="facilities">Facilities</option>
                    <option value="supplies">Supplies</option>
                  </select>
                </div>
              </div>
            )}
            
            {/* Staff Report Filters */}
            {selectedReport === 'staff' && (
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Status</label>
                <select
                  value={reportFilters.statusFilter}
                  onChange={(e) => setReportFilters({...reportFilters, statusFilter: e.target.value})}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                >
                  <option value="all">All Staff</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Coachs</label>
                  <select
                    multiple
                    size="3"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setReportFilters({...reportFilters, coachIds: selectedOptions});
                    }}
                  >
                    {availableCoachs.map(coach => (
                      <option key={coach._id} value={coach._id}>
                        {coach.firstName} {coach.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Attendance Report Filters */}
            {selectedReport === 'attendance' && (
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Report Type</label>
                <select
                    value={reportFilters.reportType}
                    onChange={(e) => setReportFilters({...reportFilters, reportType: e.target.value})}
                  className={`w-full p-2 rounded-md ${
                    isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                >
                  <option value="summary">Summary Report</option>
                  <option value="detailed">Detailed Report</option>
                  <option value="absences">Absences Only</option>
                </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Player Filter (Optional)</label>
                  <select
                    multiple
                    size="3"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setReportFilters({...reportFilters, playerIds: selectedOptions});
                    }}
                  >
                    {availablePlayers.map(player => (
                      <option key={player._id} value={player._id}>
                        {player.firstName} {player.lastName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}
            
            {/* Incident Report Filters */}
            {selectedReport === 'incidents' && (
              <div className={`p-4 rounded-lg border ${
                isDarkMode ? 'bg-gray-700/50 border-gray-600' : 'bg-gray-50 border-gray-200'
              }`}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={reportFilters.statusFilter}
                      onChange={(e) => setReportFilters({...reportFilters, statusFilter: e.target.value})}
                      className={`w-full p-2 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-800 text-white border-gray-700'
                          : 'bg-white text-gray-900 border-gray-300'
                      } border`}
                    >
                      <option value="all">All Statuses</option>
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Severity</label>
                    <select
                      value={reportFilters.severityFilter}
                      onChange={(e) => setReportFilters({...reportFilters, severityFilter: e.target.value})}
                      className={`w-full p-2 rounded-md ${
                        isDarkMode
                          ? 'bg-gray-800 text-white border-gray-700'
                          : 'bg-white text-gray-900 border-gray-300'
                      } border`}
                    >
                      <option value="all">All Severity Levels</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-4">
                  <label className="block text-sm font-medium mb-2">Player Filter (Optional)</label>
                  <select
                    multiple
                    size="3"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-800 text-white border-gray-700'
                        : 'bg-white text-gray-900 border-gray-300'
                    } border`}
                    onChange={(e) => {
                      const selectedOptions = Array.from(e.target.selectedOptions, option => option.value);
                      setReportFilters({...reportFilters, playerIds: selectedOptions});
                    }}
                  >
                    {availablePlayers.map(player => (
                      <option key={player._id} value={player._id}>
                        {player.firstName} {player.lastName}
                      </option>
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
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
            isDarkMode
              ? 'bg-blue-600 hover:bg-blue-700 text-white'
              : 'bg-blue-500 hover:bg-blue-600 text-white'
            } ${(loading || generating) ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {generating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
            ) : (
              <FileText className="h-4 w-4" />
            )}
            <span>{generating ? 'Generating...' : 'Generate Preview'}</span>
          </button>
          
          {reportPreview && (
            <button
              onClick={handleDownloadReport}
              disabled={loading}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
          } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          {loading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
          ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{loading ? 'Downloading...' : 'Download Report'}</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  // Render report preview if available
  const renderReportPreview = () => {
    if (!reportPreview) return null;
    
    return (
      <div className={`mb-8 p-6 rounded-lg shadow-md ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <h2 className="text-xl font-bold mb-4 flex items-center">
          <FileText className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
          Report Preview
        </h2>
        
        <div className={`border rounded-lg overflow-hidden ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <div className={`p-4 border-b ${
            isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
          }`}>
            <h3 className="font-semibold text-lg">
              {selectedReport.charAt(0).toUpperCase() + selectedReport.slice(1)} Report
            </h3>
            <p className="text-sm text-gray-500">
              {dateRange.startDate} to {dateRange.endDate}
            </p>
          </div>
          
          <div className="p-4">
            {selectedReport === 'incidents' && reportPreview.incidents && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                  }`}>
                    <p className="text-sm text-gray-500">Total Incidents</p>
                    <p className="text-2xl font-bold">{reportPreview.totalCount || 0}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                    <p className="text-sm text-gray-500">Open Incidents</p>
                    <p className="text-2xl font-bold">{reportPreview.openCount || 0}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                  }`}>
                    <p className="text-sm text-gray-500">Resolved</p>
                    <p className="text-2xl font-bold">{reportPreview.resolvedCount || 0}</p>
                  </div>
                </div>
                
                <table className={`w-full border-collapse ${
                  isDarkMode ? 'text-gray-200' : 'text-gray-700'
                }`}>
                  <thead>
                    <tr className={`${
                      isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <th className="p-2 text-left">Date</th>
                      <th className="p-2 text-left">Player</th>
                      <th className="p-2 text-left">Type</th>
                      <th className="p-2 text-left">Severity</th>
                      <th className="p-2 text-left">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportPreview.incidents.slice(0, 5).map((incident, index) => (
                      <tr key={index} className={`${
                        isDarkMode ? 'border-gray-700' : 'border-gray-200'
                      } border-b`}>
                        <td className="p-2">{new Date(incident.date).toLocaleDateString()}</td>
                        <td className="p-2">{incident.playerName || 'Unknown'}</td>
                        <td className="p-2">{incident.type}</td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            incident.severity === 'high' ? 'bg-red-100 text-red-800' :
                            incident.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {incident.severity}
                          </span>
                        </td>
                        <td className="p-2">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            incident.status === 'open' ? 'bg-blue-100 text-blue-800' :
                            incident.status === 'in-progress' ? 'bg-purple-100 text-purple-800' :
                            'bg-green-100 text-green-800'
                          }`}>
                            {incident.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {reportPreview.incidents.length > 5 && (
                  <div className="mt-4 text-center text-sm text-gray-500">
                    Showing 5 of {reportPreview.incidents.length} incidents
                  </div>
                )}
              </div>
            )}
            
            {selectedReport === 'financial' && (
              <div className="mb-6">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
                  <div className="mb-6">
                    <h3 className="text-xl font-semibold mb-3">Comprehensive Financial Reports</h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      Access detailed financial reports with comprehensive analysis, trends, and export options.
                    </p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <button 
                        onClick={() => setReportType('daily-summaries')}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center h-32 ${
                          reportType === 'daily-summaries' 
                            ? 'bg-indigo-50 border-indigo-300 dark:bg-indigo-900/20 dark:border-indigo-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <Calendar className={`h-8 w-8 mb-2 ${
                          reportType === 'daily-summaries' ? 'text-indigo-500' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">Daily Transactions</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Daily financial summaries</span>
                      </button>
                      
                      <button 
                        onClick={() => setReportType('income-expense')}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center h-32 ${
                          reportType === 'income-expense' 
                            ? 'bg-green-50 border-green-300 dark:bg-green-900/20 dark:border-green-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <DollarSign className={`h-8 w-8 mb-2 ${
                          reportType === 'income-expense' ? 'text-green-500' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">Income vs Expenses</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Revenue and expense analysis</span>
                      </button>
                      
                      <button 
                        onClick={() => setReportType('budget-adherence')}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center h-32 ${
                          reportType === 'budget-adherence' 
                            ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <PieChart className={`h-8 w-8 mb-2 ${
                          reportType === 'budget-adherence' ? 'text-blue-500' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">Budget Adherence</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Compare actual vs budget</span>
                      </button>
                      
                      <button 
                        onClick={() => setReportType('financial-trends')}
                        className={`p-4 rounded-lg border flex flex-col items-center justify-center h-32 ${
                          reportType === 'financial-trends' 
                            ? 'bg-purple-50 border-purple-300 dark:bg-purple-900/20 dark:border-purple-700'
                            : 'hover:bg-gray-50 dark:hover:bg-gray-700/30'
                        }`}
                      >
                        <BarChart2 className={`h-8 w-8 mb-2 ${
                          reportType === 'financial-trends' ? 'text-purple-500' : 'text-gray-400'
                        }`} />
                        <span className="font-medium">Financial Trends</span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Visualize spending patterns</span>
                      </button>
                  </div>
                  </div>
                  
                  {/* Daily Transaction Summaries */}
                  {reportType === 'daily-summaries' && (
                    <DailyTransactionSummary />
                  )}
                  
                  {/* Income vs Expense Analysis */}
                  {reportType === 'income-expense' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Income vs Expense Analysis</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportReport('income-expense', 'pdf')}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => exportReport('income-expense', 'csv')}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>CSV</span>
                          </button>
                  </div>
                </div>
                
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Time Period</span>
                          <div className="flex items-center space-x-2 mt-1">
                            <select 
                              className="flex-1 p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={reportFilters.groupBy}
                              onChange={(e) => setReportFilters({...reportFilters, groupBy: e.target.value})}
                            >
                              <option value="daily">Daily</option>
                              <option value="weekly">Weekly</option>
                              <option value="monthly">Monthly</option>
                            </select>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Start Date</span>
                          <div className="mt-1">
                            <input
                              type="date"
                              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={dateRange.startDate}
                              onChange={(e) => setDateRange({...dateRange, startDate: e.target.value})}
                            />
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">End Date</span>
                          <div className="mt-1">
                            <input
                              type="date"
                              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={dateRange.endDate}
                              onChange={(e) => setDateRange({...dateRange, endDate: e.target.value})}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <FinancialTrendsChart 
                          data={reportPreview ? reportPreview.trends : null} 
                          period={reportFilters.groupBy}
                          onRefresh={() => generateReport('income-expense')}
                        />
                      </div>
                    </div>
                  )}
                  
                  {/* Budget Adherence */}
                  {reportType === 'budget-adherence' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Budget Adherence Report</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportReport('budget-adherence', 'pdf')}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => exportReport('budget-adherence', 'csv')}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>CSV</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Fiscal Year</span>
                          <div className="mt-1">
                            <select
                              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={reportFilters.fiscalYear}
                              onChange={(e) => setReportFilters({...reportFilters, fiscalYear: e.target.value})}
                            >
                              {[...Array(5)].map((_, i) => {
                                const year = new Date().getFullYear() - 2 + i;
                                return <option key={year} value={year}>{year}</option>;
                              })}
                            </select>
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Report Type</span>
                          <div className="mt-1">
                            <select
                              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={reportFilters.adherenceType}
                              onChange={(e) => setReportFilters({...reportFilters, adherenceType: e.target.value})}
                            >
                              <option value="fiscal-year">Fiscal Year</option>
                              <option value="date-range">Custom Date Range</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      {/* Add budget adherence visualization component here */}
                    </div>
                  )}
                  
                  {/* Financial Trends */}
                  {reportType === 'financial-trends' && (
                    <div className="space-y-6">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium">Financial Trends Analysis</h3>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => exportReport('financial-trends', 'pdf')}
                            className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 dark:bg-blue-700 dark:text-blue-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>PDF</span>
                          </button>
                          <button
                            onClick={() => exportReport('financial-trends', 'csv')}
                            className="flex items-center space-x-1 px-3 py-1 bg-green-100 text-green-700 dark:bg-green-700 dark:text-green-100 rounded-md text-sm"
                          >
                            <FileText size={14} />
                            <span>CSV</span>
                          </button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                          <span className="text-xs text-gray-500 dark:text-gray-400">Time Period</span>
                          <div className="mt-1">
                            <select
                              className="w-full p-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700"
                              value={reportFilters.trendPeriod}
                              onChange={(e) => setReportFilters({...reportFilters, trendPeriod: e.target.value})}
                            >
                              <option value="3">Last 3 Months</option>
                              <option value="6">Last 6 Months</option>
                              <option value="12">Last 12 Months</option>
                            </select>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-6">
                        <FinancialTrendsChart 
                          data={reportPreview ? reportPreview.trends : null} 
                          period="monthly"
                          onRefresh={() => generateReport('financial-trends')}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {selectedReport === 'attendance' && reportPreview.attendance && (
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
                  }`}>
                    <p className="text-sm text-gray-500">Total Check-ins</p>
                    <p className="text-2xl font-bold">{reportPreview.attendance.totalCheckins || 0}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
                  }`}>
                    <p className="text-sm text-gray-500">Absences</p>
                    <p className="text-2xl font-bold">{reportPreview.attendance.totalAbsences || 0}</p>
                  </div>
                  <div className={`p-4 rounded-lg text-center ${
                    isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
                  }`}>
                    <p className="text-sm text-gray-500">Attendance Rate</p>
                    <p className="text-2xl font-bold">{reportPreview.attendance.attendanceRate || 0}%</p>
                  </div>
                </div>
                
                {/* Add attendance record preview */}
              </div>
            )}
            
            {/* For other report types, display appropriate preview data */}
            {(!reportPreview.incidents && !reportPreview.summary && !reportPreview.attendance) && (
              <div className="text-center py-8">
                <p className="text-gray-500">Preview data is available. Download the full report for detailed information.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        {/* Header with improved styling */}
        <div className={`mb-8 p-6 rounded-t-xl shadow-lg relative z-10 ${
          isDarkMode 
            ? 'bg-gradient-to-r from-gray-900 via-indigo-950 to-purple-900' 
            : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white'
        }`}>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center">
              <div className={`p-3 rounded-full mr-4 ${
                isDarkMode ? 'bg-gray-800' : 'bg-white bg-opacity-20'
              }`}>
                <BarChart2 className={`h-8 w-8 ${
                  isDarkMode ? 'text-blue-400' : 'text-white'
                }`} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Reports & Analytics</h1>
                <p className={`mt-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-blue-50'
                }`}>
                  Generate comprehensive reports for your academy center
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-md flex items-center ${
            isDarkMode ? 'bg-red-900/50 text-red-200 border border-red-800' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            <AlertTriangle className="h-5 w-5 mr-2" />
            {error}
            <button 
              onClick={() => setError('')}
              className="ml-auto text-sm"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Report Types Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {reportTypes.map((report) => (
            <div
              key={report.id}
              className={`p-6 rounded-lg cursor-pointer transition-all duration-200 ${
                isDarkMode 
                  ? 'bg-gray-800 hover:bg-gray-700' 
                  : 'bg-white hover:bg-gray-50 shadow'
              } ${
                selectedReport === report.id 
                  ? isDarkMode 
                    ? 'ring-2 ring-blue-500 transform scale-[1.02]' 
                    : 'ring-2 ring-blue-500 transform scale-[1.02]'
                  : ''
              }`}
              onClick={() => setSelectedReport(report.id)}
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <report.icon className={`h-6 w-6 ${report.color}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{report.title}</h3>
                  <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {report.description}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Report Configuration or Coach Payment Management */}
        {selectedReport && renderReportContent()}
        
        {/* Report Preview (if available) */}
        {reportPreview && selectedReport !== 'coach-payments' && renderReportPreview()}

        {/* Recent Reports - Only show if not on coach payments */}
        {selectedReport !== 'coach-payments' && (
          <div className={`p-6 rounded-lg shadow-md ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <Clock className={`mr-2 h-5 w-5 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
              Recent Reports
            </h2>
            <div className="space-y-4">
              {recentReports.length > 0 ? (
                recentReports.map((report, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-4 rounded-lg ${
                      isDarkMode ? 'bg-gray-700 hover:bg-gray-650' : 'bg-gray-50 hover:bg-gray-100'
                    } transition-colors`}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`p-2 rounded-full ${
                        isDarkMode ? 'bg-gray-600' : 'bg-white'
                      }`}>
                      <FileText className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium">{report.title}</p>
                        <p className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                          Generated on {new Date(report.generatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const url = window.URL.createObjectURL(new Blob([report.data]));
                        const link = document.createElement('a');
                        link.href = url;
                        link.setAttribute('download', report.filename);
                        document.body.appendPlayer(link);
                        link.click();
                        link.remove();
                      }}
                      className={`p-2 rounded-md ${
                        isDarkMode
                          ? 'hover:bg-gray-600 bg-gray-700'
                          : 'hover:bg-blue-100 bg-white'
                      }`}
                    >
                      <Download className="h-4 w-4 text-blue-500" />
                    </button>
                  </div>
                ))
              ) : (
                <div className={`text-center py-8 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                }`}>
                  <FileText className={`h-12 w-12 mx-auto mb-2 ${
                    isDarkMode ? 'text-gray-500' : 'text-gray-400'
                  }`} />
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No recent reports. Generate a report to see it here.
                  </p>
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