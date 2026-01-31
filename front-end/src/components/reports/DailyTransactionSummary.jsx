import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import { 
  Calendar, 
  Download, 
  Filter, 
  RefreshCw, 
  ChevronDown, 
  ChevronUp,
  Printer,
  FileDown,
  DollarSign,
  ArrowUpDown
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const DailyTransactionSummary = () => {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [expandedSummary, setExpandedSummary] = useState(null);
  const [periodSummary, setPeriodSummary] = useState(null);
  const [sortConfig, setSortConfig] = useState({
    key: 'date',
    direction: 'desc'
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchDailySummaries();
  }, []);

  const fetchDailySummaries = async () => {
    try {
      setLoading(true);
      setError('');
      
      const { startDate, endDate } = dateRange;
      const response = await api.get(`/api/admin/reports/financial/daily-summaries?startDate=${startDate}&endDate=${endDate}`);
      
      setSummaries(response.data.summaries || []);
      setPeriodSummary(response.data.periodSummary || null);
    } catch (error) {
      console.error('Error fetching daily transaction summaries:', error);
      setError('Failed to load transaction summaries. Please try again later.');
      toast.error('Failed to load transaction summaries');
    } finally {
      setLoading(false);
    }
  };

  const generateSummaryForToday = async () => {
    try {
      setLoading(true);
      
      const response = await api.post('/api/admin/reports/financial/daily-summary', {
        date: new Date().toISOString().split('T')[0]
      });
      
      if (response.data.summary) {
        toast.success('Today\'s transaction summary generated successfully');
        fetchDailySummaries(); // Refresh the list
      }
    } catch (error) {
      console.error('Error generating daily summary:', error);
      toast.error('Failed to generate today\'s summary');
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange({
      ...dateRange,
      [name]: value
    });
  };

  const exportSummaries = async (format) => {
    try {
      const { startDate, endDate } = dateRange;
      
      // Open export URL in new window
      window.open(
        `/api/admin/reports/financial/export/${format}?startDate=${startDate}&endDate=${endDate}&reportType=daily-summary`,
        '_blank'
      );
    } catch (error) {
      console.error(`Error exporting summaries as ${format}:`, error);
      toast.error(`Failed to export as ${format}`);
    }
  };

  const toggleExpandSummary = (date) => {
    if (expandedSummary === date) {
      setExpandedSummary(null);
    } else {
      setExpandedSummary(date);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const sortedSummaries = React.useMemo(() => {
    let sortableSummaries = [...summaries];
    if (sortConfig.key) {
      sortableSummaries.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableSummaries;
  }, [summaries, sortConfig]);

  // Format currency values
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value);
  };

  if (loading && summaries.length === 0) {
    return (
      <div className={`flex items-center justify-center p-8 rounded-lg ${
        isDarkMode ? 'bg-gray-800' : 'bg-white'
      }`}>
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <span className="ml-2">Loading summaries...</span>
      </div>
    );
  }

  return (
    <div className={`rounded-lg shadow-md overflow-hidden ${
      isDarkMode ? 'bg-gray-800' : 'bg-white'
    }`}>
      <div className="p-4 border-b border-b-1">
        <h2 className={`text-lg font-medium ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>
          Daily Transaction Summaries
        </h2>
        <p className={`mt-1 text-sm ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          View summaries of all financial transactions on a daily basis
        </p>
      </div>
      
      {/* Filters and Controls */}
      <div className={`p-4 ${
        isDarkMode ? 'bg-gray-750' : 'bg-gray-50'
      }`}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex items-center space-x-2">
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                Start Date
              </label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className={`w-full p-2 text-sm rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            <div>
              <label className={`block text-xs font-medium mb-1 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                End Date
              </label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className={`w-full p-2 text-sm rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white border-gray-600'
                    : 'bg-white text-gray-900 border-gray-300'
                }`}
              />
            </div>
            
            <button
              onClick={fetchDailySummaries}
              className={`mt-4 px-4 py-2 rounded-md ${
                isDarkMode
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <Filter size={16} className="inline mr-1" />
              Filter
            </button>
          </div>
          
          <div className="flex items-end space-x-2 ml-auto">
            <button
              onClick={generateSummaryForToday}
              className={`px-4 py-2 rounded-md ${
                isDarkMode
                  ? 'bg-green-600 hover:bg-green-700 text-white'
                  : 'bg-green-500 hover:bg-green-600 text-white'
              }`}
            >
              <RefreshCw size={16} className="inline mr-1" />
              Generate Today's Summary
            </button>
            
            <div className="relative">
              <button
                className={`px-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-purple-600 hover:bg-purple-700 text-white'
                    : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                <Download size={16} className="inline mr-1" />
                Export
              </button>
              <div className={`absolute right-0 mt-1 w-40 rounded-md shadow-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-white'
              } z-10 hidden group-hover:block hover:block`}>
                <div className="py-1">
                  <button
                    onClick={() => exportSummaries('pdf')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-200 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileDown size={16} className="inline mr-2" />
                    Export as PDF
                  </button>
                  <button
                    onClick={() => exportSummaries('csv')}
                    className={`block w-full text-left px-4 py-2 text-sm ${
                      isDarkMode
                        ? 'text-gray-200 hover:bg-gray-600'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <FileDown size={16} className="inline mr-2" />
                    Export as CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Period Summary Stats */}
      {periodSummary && (
        <div className={`p-4 grid grid-cols-1 md:grid-cols-4 gap-4 ${
          isDarkMode ? 'bg-gray-750/50' : 'bg-gray-50/70'
        }`}>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-green-900/20' : 'bg-green-50'
          }`}>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Total Revenue</p>
            <p className={`text-xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>{formatCurrency(periodSummary.totalRevenue)}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-red-900/20' : 'bg-red-50'
          }`}>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Total Expenses</p>
            <p className={`text-xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{formatCurrency(periodSummary.totalExpenses)}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-blue-900/20' : 'bg-blue-50'
          }`}>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Net Balance</p>
            <p className={`text-xl font-bold ${
              periodSummary.netBalance >= 0 
                ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                : isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{formatCurrency(periodSummary.netBalance)}</p>
          </div>
          <div className={`p-4 rounded-lg ${
            isDarkMode ? 'bg-purple-900/20' : 'bg-purple-50'
          }`}>
            <p className={`text-xs ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`}>Period</p>
            <p className={`text-xl font-bold ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>{periodSummary.days} days</p>
          </div>
        </div>
      )}
      
      {/* Daily Summaries Table */}
      <div className="overflow-x-auto">
        <table className={`min-w-full divide-y ${
          isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
        }`}>
          <thead className={isDarkMode ? 'bg-gray-750' : 'bg-gray-100'}>
            <tr>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('date')}
              >
                <div className="flex items-center">
                  Date <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalRevenue')}
              >
                <div className="flex items-center">
                  Revenue <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('totalExpenses')}
              >
                <div className="flex items-center">
                  Expenses <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('netBalance')}
              >
                <div className="flex items-center">
                  Net <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                onClick={() => handleSort('transactionCount')}
              >
                <div className="flex items-center">
                  Transactions <ArrowUpDown size={14} className="ml-1" />
                </div>
              </th>
              <th
                scope="col"
                className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
              >
                Details
              </th>
            </tr>
          </thead>
          <tbody className={`divide-y ${
            isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
          }`}>
            {sortedSummaries.length === 0 ? (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-sm">
                  <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                    No transaction summaries found for the selected period.
                  </p>
                </td>
              </tr>
            ) : (
              sortedSummaries.map((summary) => (
                <React.Fragment key={summary.date}>
                  <tr 
                    className={`${
                      isDarkMode ? 'hover:bg-gray-750' : 'hover:bg-gray-50'
                    } cursor-pointer`}
                    onClick={() => toggleExpandSummary(summary.date)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>
                        {new Date(summary.date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatCurrency(summary.totalRevenue)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${
                      isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.totalExpenses)}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm font-medium ${
                      summary.netBalance >= 0 
                        ? isDarkMode ? 'text-blue-400' : 'text-blue-600'
                        : isDarkMode ? 'text-red-400' : 'text-red-600'
                    }`}>
                      {formatCurrency(summary.netBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {summary.transactionCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      {expandedSummary === summary.date ? (
                        <ChevronUp size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      ) : (
                        <ChevronDown size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                      )}
                    </td>
                  </tr>
                  
                  {/* Expanded Details Row */}
                  {expandedSummary === summary.date && (
                    <tr>
                      <td colSpan="6" className={`px-6 py-4 ${
                        isDarkMode ? 'bg-gray-750' : 'bg-gray-50'
                      }`}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Revenue Breakdown */}
                          <div>
                            <h3 className={`text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Revenue by Category
                            </h3>
                            <div className={`rounded-md overflow-hidden ${
                              isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                              {Object.entries(summary.revenueByCategory).length > 0 ? (
                                <div className="divide-y divide-gray-700">
                                  {Object.entries(summary.revenueByCategory).map(([category, amount]) => (
                                    <div key={category} className="flex justify-between items-center p-2">
                                      <span className={`text-xs capitalize ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {category}
                                      </span>
                                      <span className={`text-sm ${
                                        isDarkMode ? 'text-green-400' : 'text-green-600'
                                      }`}>
                                        {formatCurrency(amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`p-2 text-xs ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  No revenue data available
                                </p>
                              )}
                            </div>
                          </div>
                          
                          {/* Expense Breakdown */}
                          <div>
                            <h3 className={`text-sm font-medium mb-2 ${
                              isDarkMode ? 'text-gray-300' : 'text-gray-700'
                            }`}>
                              Expenses by Category
                            </h3>
                            <div className={`rounded-md overflow-hidden ${
                              isDarkMode ? 'bg-gray-800' : 'bg-white'
                            }`}>
                              {Object.entries(summary.expenseByCategory).length > 0 ? (
                                <div className="divide-y divide-gray-700">
                                  {Object.entries(summary.expenseByCategory).map(([category, amount]) => (
                                    <div key={category} className="flex justify-between items-center p-2">
                                      <span className={`text-xs capitalize ${
                                        isDarkMode ? 'text-gray-400' : 'text-gray-600'
                                      }`}>
                                        {category}
                                      </span>
                                      <span className={`text-sm ${
                                        isDarkMode ? 'text-red-400' : 'text-red-600'
                                      }`}>
                                        {formatCurrency(amount)}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className={`p-2 text-xs ${
                                  isDarkMode ? 'text-gray-500' : 'text-gray-500'
                                }`}>
                                  No expense data available
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DailyTransactionSummary; 