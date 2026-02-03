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

const BabysitterManagement = () => {
  const [babysitters, setBabysitters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchBabysitters();
  }, []);

  const fetchBabysitters = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/admin/babysitters');
      setBabysitters(response.data || []);
      // toast.success('Babysitters loaded successfully');
    } catch (error) {
      console.error('Error fetching babysitters:', error);
      setError('Failed to fetch babysitters. Please try again later.');
      toast.error('Failed to load babysitters');
      setBabysitters([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (babysitter) => {
    try {
      const newStatus = babysitter.status === 'active' ? 'inactive' : 'active';
      await api.patch(`/admin/babysitters/${babysitter._id}/status`, { status: newStatus });
      
      setBabysitters(babysitters.map(b => 
        b._id === babysitter._id ? { ...b, status: newStatus } : b
      ));
      
      toast.success(`Babysitter ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      console.error('Error updating babysitter status:', error);
      toast.error('Failed to update babysitter status');
    }
  };

  const handleViewSchedule = (babysitterId) => {
    // Navigate to schedule view
    window.location.href = `/admin/babysitters/${babysitterId}/schedule`;
  };

  const handleViewPayments = (babysitterId) => {
    // Navigate to payments view
    window.location.href = `/admin/babysitters/${babysitterId}/payments`;
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

  const filteredBabysitters = sortData(babysitters.filter(babysitter => {
    const matchesSearch = 
      (babysitter.firstName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (babysitter.lastName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (babysitter.email?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    
    const matchesStatusFilter = statusFilter === 'all' || babysitter.status === statusFilter;
    
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
              <h1 className="text-2xl font-bold">Babysitter Management</h1>
              <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Manage daycare babysitters, their schedules, and payments
              </p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={fetchBabysitters}
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
                to="/admin/babysitters/add"
                className={`flex items-center px-3 py-2 rounded-lg transition ${
                  isDarkMode 
                    ? 'bg-indigo-600 hover:bg-indigo-700 text-white' 
                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                <Plus size={16} className="mr-2" />
                Add Babysitter
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
                    Total Babysitters
                  </p>
                  <p className="text-2xl font-bold">{babysitters.length}</p>
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
                    Active Babysitters
                  </p>
                  <p className="text-2xl font-bold">
                    {babysitters.filter(b => b.status === 'active').length}
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
                    Inactive Babysitters
                  </p>
                  <p className="text-2xl font-bold">
                    {babysitters.filter(b => b.status === 'inactive').length}
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
                    ${babysitters.length > 0 
                      ? (babysitters.reduce((acc, b) => acc + Number(b.hourlyRate || 0), 0) / babysitters.length).toFixed(2)
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
                  placeholder="Search babysitters..."
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

          {/* Babysitters Table */}
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
                  {filteredBabysitters.length > 0 ? (
                    filteredBabysitters.map((babysitter) => (
                      <tr key={babysitter._id} className={`${
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
                                {babysitter.firstName} {babysitter.lastName}
                              </div>
                              <div className={`text-sm ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                ID: {babysitter._id}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                            {babysitter.email}
                          </div>
                          <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                            {babysitter.phoneNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button
                            onClick={() => handleToggleStatus(babysitter)}
                            className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                              babysitter.status === 'active' 
                                ? isDarkMode 
                                  ? 'bg-green-900/50 text-green-400 hover:bg-green-800/70' 
                                  : 'bg-green-100 text-green-800 hover:bg-green-200'
                                : babysitter.status === 'inactive'
                                  ? isDarkMode
                                    ? 'bg-red-900/50 text-red-400 hover:bg-red-800/70'
                                    : 'bg-red-100 text-red-800 hover:bg-red-200'
                                  : isDarkMode
                                    ? 'bg-yellow-900/50 text-yellow-400 hover:bg-yellow-800/70'
                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                            }`}
                          >
                            {babysitter.status === 'active' ? (
                              <UserCheck size={14} className="mr-1 inline" />
                            ) : (
                              <UserX size={14} className="mr-1 inline" />
                            )}
                            {babysitter.status}
                          </button>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-white' : 'text-gray-900'
                          }`}>
                            ${babysitter.hourlyRate || '0.00'}/hr
                          </div>
                          <div className={`text-xs ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }`}>
                            Max: {babysitter.maxChildren || 5} children
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-1">
                            <Link
                              to={`/admin/babysitters/${babysitter._id}/edit`}
                              className={`p-1 rounded-md ${
                                isDarkMode
                                  ? 'text-blue-400 hover:bg-gray-700'
                                  : 'text-blue-600 hover:bg-blue-100'
                              }`}
                              title="Edit Babysitter"
                            >
                              <Edit size={18} />
                            </Link>
                            <button
                              onClick={() => handleViewSchedule(babysitter._id)}
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
                              onClick={() => handleViewPayments(babysitter._id)}
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
                              to={`/admin/babysitters/${babysitter._id}`}
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
                            No babysitters found matching your filters
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

export default BabysitterManagement; 