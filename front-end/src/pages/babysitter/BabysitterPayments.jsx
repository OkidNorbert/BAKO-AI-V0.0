import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import axios from 'axios';
import {
  DollarSign,
  Calendar,
  Download,
  Search,
  Filter,
  AlertCircle,
  TrendingUp,
  Clock,
  CheckCircle
} from 'lucide-react';

const BabysitterPayments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stats, setStats] = useState({
    totalEarnings: 0,
    pendingPayments: 0,
    completedPayments: 0,
    averagePerShift: 0
  });
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchPayments();
    fetchStats();
  }, [dateRange]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/babysitter/payments', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setPayments(response.data || []);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to fetch payments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get('/api/babysitter/payments/stats', {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching payment stats:', error);
    }
  };

  const handleDownload = async (paymentId) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await axios.get(`/api/babysitter/payments/${paymentId}/receipt`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment-receipt-${paymentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      alert('Failed to download receipt. Please try again later.');
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;
    
    const description = (payment.description || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = description.includes(searchTermLower);
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">My Payments</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Earnings</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.totalEarnings)}</p>
              </div>
              <DollarSign className={`h-8 w-8 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Payments</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.pendingPayments)}</p>
              </div>
              <Clock className={`h-8 w-8 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Completed Payments</p>
                <p className="text-2xl font-bold mt-1">{stats.completedPayments}</p>
              </div>
              <CheckCircle className={`h-8 w-8 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
          </div>

          <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Average per Shift</p>
                <p className="text-2xl font-bold mt-1">{formatCurrency(stats.averagePerShift)}</p>
              </div>
              <TrendingUp className={`h-8 w-8 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />
            </div>
          </div>
        </div>

        {/* Search, Filter, and Date Range */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
                  placeholder="Search payments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white placeholder-gray-400'
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                  }`}
                />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className={`rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className={`h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className={`rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
                <span>to</span>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className={`rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 text-white'
                      : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Payments List */}
        <div className="space-y-4">
          {filteredPayments.length > 0 ? (
            filteredPayments.map((payment) => (
              <div
                key={payment.id}
                className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-start space-x-4">
                    <div>
                      <h3 className="text-lg font-semibold">{formatCurrency(payment.amount)}</h3>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs ${
                          payment.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : payment.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status}
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(payment.date).toLocaleDateString()}
                        </span>
                      </div>
                      {payment.description && (
                        <p className="mt-2 text-sm text-gray-600">{payment.description}</p>
                      )}
                    </div>
                  </div>
                  {payment.status === 'completed' && (
                    <button
                      onClick={() => handleDownload(payment.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
                        isDarkMode
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : 'bg-blue-500 hover:bg-blue-600'
                      } text-white transition-colors`}
                    >
                      <Download className="h-4 w-4" />
                      <span>Receipt</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">No payments found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BabysitterPayments; 