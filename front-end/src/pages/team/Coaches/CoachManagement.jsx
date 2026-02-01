import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '@/utils/axiosConfig';
import { useTheme } from '@/context/ThemeContext';
import { 
  User, 
  Calendar, 
  DollarSign, 
  Search, 
  Filter, 
  Edit,
  Eye,
  Plus,
  RefreshCw,
  UserCheck,
  UserX,
  Clock,
  Shield,
  FileText,
  ArrowUpDown,
  Trash
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CoachManagement = () => {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchCoaches();
  }, []);

  const fetchCoaches = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/coaches');
      setCoaches(response.data || []);
      // toast.success('Coaches loaded successfully');
    } catch (error) {
      console.error('Error fetching coaches:', error);
      setError('Failed to fetch coaches. Please try again later.');
      toast.error('Failed to load coaches');
      setCoaches([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (coach) => {
    try {
      const newStatus = coach.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/coaches/${coach._id}/status`, { status: newStatus });
      
      setCoaches(coaches.map(b => 
        b._id === coach._id ? { ...b, status: newStatus } : b
      ));
      
      toast.success(`Coach ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating coach status:', error);
      toast.error('Failed to update coach status');
    }
  };

  const handleViewSchedule = (coachId) => {
    // Navigate to schedule view
    window.location.href = `/team/coaches/${coachId}/schedule`;
  };

  const handleViewPayments = (coachId) => {
    // Navigate to payments view
    window.location.href = `/team/coaches/${coachId}/payments`;
  };

  const sortData = (data) => {
    return [...data].sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'name':
          comparison = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
          break;
        case 'date':
          comparison = new Date(a.createdAt) - new Date(b.createdAt);
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  const toggleSort = (field) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const filteredCoaches = sortData(coaches.filter(coach => {
    const matchesSearch = 
      (coach.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (coach.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (coach.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = statusFilter === 'all' || coach.status === statusFilter;
    
    return matchesSearch && matchesStatusFilter;
  }));

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className={`${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header with title and actions */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
            <div>
              <h1 className="text-2xl font-bold">Coach Management</h1>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage academy coaches, their schedules, and payments
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchCoaches}
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                    : 'bg-white hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                <RefreshCw size={16} className="mr-2" />
                Refresh
              </button>
              <Link
                to="/team/coaches/add"
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Plus size={16} className="mr-2" />
                Add Coach
              </Link>
              <Link
                to="/team/payments"
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <DollarSign size={16} className="mr-2" />
                Manage Payments
              </Link>
            </div>
          </div>

          {error && (
            <div className={`mb-6 p-4 rounded-lg ${
              isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Total Coaches
                  </p>
                  <p className="text-2xl font-bold">{coaches.length}</p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'
                }`}>
                  <User size={20} />
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Active Coaches
                  </p>
                  <p className="text-2xl font-bold">
                    {coaches.filter(b => b.status === 'active').length}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-green-900/50 text-green-400' : 'bg-green-100 text-green-600'
                }`}>
                  <UserCheck size={20} />
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Inactive Coaches
                  </p>
                  <p className="text-2xl font-bold">
                    {coaches.filter(b => b.status === 'inactive').length}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-red-900/50 text-red-400' : 'bg-red-100 text-red-600'
                }`}>
                  <UserX size={20} />
                </div>
              </div>
            </div>
            
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
            }`}>
              <div className="flex justify-between items-center">
                <div>
                  <p className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    Avg. Hourly Rate
                  </p>
                  <p className="text-2xl font-bold">
                    ${coaches.length > 0 
                      ? (coaches.reduce((acc, b) => acc + Number(b.hourlyRate || 0), 0) / coaches.length).toFixed(2)
                      : '0.00'
                    }
                  </p>
                </div>
                <div className={`p-3 rounded-full ${
                  isDarkMode ? 'bg-yellow-900/50 text-yellow-400' : 'bg-yellow-100 text-yellow-600'
                }`}>
                  <DollarSign size={20} />
                </div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className={`mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} size={20} />
                <input
                  type="text"
                  placeholder="Search coaches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2 rounded-lg focus:ring-2 ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white placeholder-gray-400 focus:ring-indigo-600 border-gray-600' 
                      : 'bg-gray-50 text-gray-900 placeholder-gray-500 focus:ring-blue-500 border border-gray-300'
                  }`}
                />
              </div>

              <div className="flex items-center gap-2">
                <Filter size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className={`rounded-lg ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 text-gray-900 border border-gray-300'
                  }`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
            </div>
          </div>

          {/* Coaches Table */}
          <div className={`rounded-lg overflow-hidden ${
            isDarkMode ? 'bg-gray-800' : 'bg-white shadow-sm'
          }`}>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }">
                <thead className={`${
                  isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                }`}>
                  <tr>
                    <th scope="col" 
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Name</span>
                        {sortBy === 'name' && (
                          <ArrowUpDown size={14} className={`ml-1 ${
                            sortOrder === 'asc' ? 'transform rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </th>
                    <th scope="col" 
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Contact
                    </th>
                    <th scope="col" 
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                      onClick={() => toggleSort('status')}
                    >
                      <div className="flex items-center space-x-1">
                        <span>Status</span>
                        {sortBy === 'status' && (
                          <ArrowUpDown size={14} className={`ml-1 ${
                            sortOrder === 'asc' ? 'transform rotate-180' : ''
                          }`} />
                        )}
                      </div>
                    </th>
                    <th scope="col" 
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Rate
                    </th>
                    <th scope="col" 
                      className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-500'
                      }`}
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className={`${
                  isDarkMode ? 'bg-gray-800 divide-y divide-gray-700' : 'bg-white divide-y divide-gray-200'
                }`}>
                  {filteredCoaches.length > 0 ? (
                    filteredCoaches.map((coach) => (
                      <tr key={coach._id} className={`${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      } transition duration-150`}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                                isDarkMode 
                                  ? 'bg-gray-700 text-indigo-400' 
                                  : 'bg-indigo-100 text-indigo-600'
                              }`}>
                                <User size={20} />
                              </div>
                            </div>
                            <div className="ml-4">
                              <div className={`text-sm font-medium ${
                                isDarkMode ? 'text-white' : 'text-gray-900'
                              }`}>
                                {coach.firstName} {coach.lastName}
                              </div>
                              <div className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                ID: {coach._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {coach.email}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {coach.phoneNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(coach)}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              coach.status === 'active' 
                                ? isDarkMode 
                                  ? 'bg-green-900/50 text-green-400 hover:bg-green-800/70' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                                : coach.status === 'inactive'
                                  ? isDarkMode
                                    ? 'bg-red-900/50 text-red-400 hover:bg-red-800/70'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : isDarkMode
                                    ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-800/70'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {coach.status === 'active' ? (
                              <UserCheck size={14} className="mr-1 inline" />
                            ) : (
                              <UserX size={14} className="mr-1 inline" />
                            )}
                            {coach.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            ${coach.hourlyRate || '0.00'}/hr
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Max: {coach.maxPlayers || 5} players
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Link
                              to={`/team/coaches/${coach._id}/edit`}
                              className={`p-1 rounded-md ${
                                isDarkMode
                                  ? 'text-blue-400 hover:bg-gray-700'
                                  : 'text-blue-600 hover:bg-blue-100'
                              }`}
                              title="Edit Coach"
                            >
                              <Edit size={18} />
                            </Link>
                            <button
                              onClick={() => handleViewSchedule(coach._id)}
                              className={`p-1 rounded-md ${
                                isDarkMode
                                  ? 'text-green-400 hover:bg-gray-700'
                                  : 'text-green-600 hover:bg-green-100'
                              }`}
                              title="View Schedule"
                            >
                              <Calendar size={18} />
                            </button>
                            <button
                              onClick={() => handleViewPayments(coach._id)}
                              className={`p-1 rounded-md ${
                                isDarkMode
                                  ? 'text-purple-400 hover:bg-gray-700'
                                  : 'text-purple-600 hover:bg-purple-100'
                              }`}
                              title="View Payments"
                            >
                              <DollarSign size={18} />
                            </button>
                            <Link
                              to={`/team/coaches/${coach._id}`}
                              className={`p-1 rounded-md ${
                                isDarkMode
                                  ? 'text-gray-400 hover:bg-gray-700'
                                  : 'text-gray-600 hover:bg-gray-100'
                              }`}
                              title="View Details"
                            >
                              <Eye size={18} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-6 py-10 text-center text-sm">
                        <div className="flex flex-col items-center">
                          <User className={`h-10 w-10 ${
                            isDarkMode ? 'text-gray-600' : 'text-gray-400'
                          }`} />
                          <p className={`mt-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            No coaches found matching your filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoachManagement; 