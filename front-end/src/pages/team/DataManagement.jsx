import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import { toast } from 'react-hot-toast';
import {
  Users,
  Baby,
  User,
  Search,
  Download,
  Filter,
  RefreshCw,
  FileText,
  Trash2,
  Edit2,
  Eye,
  X
} from 'lucide-react';

const DataManagement = () => {
  const { isDarkMode } = useTheme();
  const [activeTab, setActiveTab] = useState('coachs');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOptions, setFilterOptions] = useState({
    status: 'all',
    role: 'all',
    sort: 'newest'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Data states
  const [coachs, setCoachs] = useState([]);
  const [guardians, setGuardians] = useState([]);
  const [children, setPlayers] = useState([]);
  
  // Modal states
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, [activeTab, page, filterOptions]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      let response;
      
      switch (activeTab) {
        case 'coachs':
          response = await api.get('/admin/coachs');
          setCoachs(response.data || []);
          break;
        case 'guardians':
          response = await api.get('/guardians');
          setGuardians(response.data || []);
          break;
        case 'children':
          response = await api.get('/admin/children');
          setPlayers(response.data || []);
          break;
        default:
          break;
      }
      
      // Calculate total pages
      const totalItems = response?.data?.length || 0;
      setTotalPages(Math.ceil(totalItems / itemsPerPage));
      
    } catch (error) {
      console.error(`Error fetching ${activeTab}:`, error);
      setError(`Failed to fetch ${activeTab}. Please try again.`);
      toast.error(`Failed to fetch ${activeTab}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchData();
    toast.success('Data refreshed successfully');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPage(1); // Reset to first page on new search
  };

  const handleFilterChange = (key, value) => {
    setFilterOptions(prev => ({
      ...prev,
      [key]: value
    }));
    setPage(1); // Reset to first page on filter change
  };

  const handleViewDetails = (item) => {
    setSelectedItem(item);
    setShowDetailsModal(true);
  };

  const exportToCSV = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/admin/export/${activeTab}`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${activeTab}-data.csv`);
      document.body.appendPlayer(link);
      link.click();
      link.remove();
      
      toast.success(`${activeTab} data exported successfully`);
    } catch (error) {
      console.error(`Error exporting ${activeTab}:`, error);
      toast.error(`Failed to export ${activeTab} data`);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on search term and filters
  const filterData = (data) => {
    if (!data) return [];
    
    return data.filter(item => {
      // Search term filter
      const fullName = `${item.firstName || ''} ${item.lastName || ''}`.toLowerCase();
      const email = (item.email || '').toLowerCase();
      const searchLower = searchTerm.toLowerCase();
      
      const matchesSearch = !searchTerm || 
        fullName.includes(searchLower) || 
        email.includes(searchLower);
      
      // Status filter (if applicable)
      const matchesStatus = filterOptions.status === 'all' || 
        (item.status === filterOptions.status);
      
      return matchesSearch && matchesStatus;
    });
  };

  // Get paginated data
  const getPaginatedData = () => {
    let filteredData;
    
    switch (activeTab) {
      case 'coachs':
        filteredData = filterData(coachs);
        break;
      case 'guardians':
        filteredData = filterData(guardians);
        break;
      case 'children':
        filteredData = filterData(children);
        break;
      default:
        filteredData = [];
    }
    
    // Sort data
    if (filterOptions.sort === 'newest') {
      filteredData.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    } else if (filterOptions.sort === 'oldest') {
      filteredData.sort((a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0));
    } else if (filterOptions.sort === 'alphabetical') {
      filteredData.sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`));
    }
    
    // Paginate
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    return filteredData.slice(startIndex, endIndex);
  };

  const renderDetailsModal = () => {
    if (!selectedItem) return null;
    
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className={`rounded-lg p-6 max-w-2xl w-full ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              {activeTab === 'children' ? 'Player Details' : 
               activeTab === 'guardians' ? 'Guardian Details' : 'Coach Details'}
            </h2>
            <button
              onClick={() => setShowDetailsModal(false)}
              className={`p-1 rounded-full ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
            >
              <X size={24} />
            </button>
          </div>
          
          <div className={`overflow-y-auto max-h-[70vh] p-4 rounded-md ${isDarkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
            {Object.entries(selectedItem).map(([key, value]) => {
              // Skip complex objects or irrelevant fields
              if (typeof value === 'object' || key === '_id' || key === '__v') return null;
              
              return (
                <div key={`detail-${key}`} className="mb-3">
                  <h3 className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</h3>
                  <p className="mt-1">
                    {typeof value === 'string' && (value.includes('T') && new Date(value).toString() !== 'Invalid Date')
                      ? new Date(value).toLocaleString()
                      : String(value)}
                  </p>
                </div>
              );
            })}
            
            {/* Special handling for children or other relations */}
            {activeTab === 'guardians' && selectedItem.children && (
              <div className="mt-4">
                <h3 className="text-lg font-medium mb-2">Players</h3>
                {selectedItem.children.length > 0 ? (
                  <ul className="space-y-2">
                    {selectedItem.children.map((player, index) => (
                      <li key={player._id || `player-${index}`} className="flex items-center">
                        <Baby size={16} className="mr-2" />
                        {player.firstName} {player.lastName}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No children assigned</p>
                )}
              </div>
            )}
          </div>
          
          <div className="flex justify-end mt-4">
            <button
              onClick={() => setShowDetailsModal(false)}
              className={`px-4 py-2 rounded-md ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
              }`}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderTabContent = () => {
    const data = getPaginatedData();
    
    if (loading) {
      return (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
        </div>
      );
    }
    
    if (error) {
      return (
        <div className={`p-6 rounded-lg ${isDarkMode ? 'bg-red-900/30' : 'bg-red-100'} text-center`}>
          <p>{error}</p>
          <button
            onClick={handleRefresh}
            className={`mt-4 px-4 py-2 rounded-md ${
              isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-200 hover:bg-gray-300'
            }`}
          >
            Try Again
          </button>
        </div>
      );
    }
    
    if (data.length === 0) {
      return (
        <div className={`p-12 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} text-center`}>
          <Users size={48} className={`mx-auto mb-4 ${isDarkMode ? 'text-gray-600' : 'text-gray-400'}`} />
          <h3 className="text-xl font-medium mb-2">No data found</h3>
          <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
            {searchTerm 
              ? `No results match your search "${searchTerm}"`
              : `No ${activeTab} available`}
          </p>
        </div>
      );
    }
    
    return (
      <div className={`rounded-lg overflow-hidden ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Contact</th>
                {activeTab === 'children' && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Guardian</th>
                )}
                {activeTab === 'guardians' && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Players</th>
                )}
                {activeTab === 'coachs' && (
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Schedule</th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {data.map((item) => (
                <tr key={item._id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                        isDarkMode ? 'bg-indigo-600' : 'bg-indigo-100'
                      }`}>
                        {activeTab === 'children' ? (
                          <Baby className={isDarkMode ? 'text-white' : 'text-indigo-600'} size={18} />
                        ) : activeTab === 'guardians' ? (
                          <User className={isDarkMode ? 'text-white' : 'text-indigo-600'} size={18} />
                        ) : (
                          <User className={isDarkMode ? 'text-white' : 'text-indigo-600'} size={18} />
                        )}
                      </div>
                      <div className="ml-4">
                        <div className="font-medium">
                          {item.firstName} {item.lastName}
                        </div>
                        <div className="text-sm text-gray-500">
                          {activeTab === 'children' ? `Age: ${item.age || 'N/A'}` : null}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm">
                      {item.email || 'No email'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {item.phone || item.phoneNumber || 'No phone'}
                    </div>
                  </td>
                  {activeTab === 'children' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.guardian ? (
                        <div className="text-sm">
                          {item.guardian.firstName} {item.guardian.lastName}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">Not assigned</span>
                      )}
                    </td>
                  )}
                  {activeTab === 'guardians' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {item.children?.length || 0} children
                      </div>
                    </td>
                  )}
                  {activeTab === 'coachs' && (
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button className="text-sm text-indigo-600 hover:text-indigo-800">
                        View Schedule
                      </button>
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (item.status === 'active' || item.isActive) 
                        ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                        : isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                    }`}>
                      {(item.status === 'active' || item.isActive) ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button 
                        onClick={() => handleViewDetails(item)}
                        className={`p-1 rounded-full ${
                          isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <div>
              <p className="text-sm text-gray-500">
                Showing <span className="font-medium">{((page - 1) * itemsPerPage) + 1}</span> to{' '}
                <span className="font-medium">{Math.min(page * itemsPerPage, 
                  (activeTab === 'coachs' ? coachs : activeTab === 'guardians' ? guardians : children).length)}</span> of{' '}
                <span className="font-medium">{
                  (activeTab === 'coachs' ? coachs : activeTab === 'guardians' ? guardians : children).length
                }</span> results
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                disabled={page === 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className={`px-3 py-1 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-600' 
                    : 'bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-400'
                }`}
              >
                Previous
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className={`px-3 py-1 rounded-md ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white disabled:bg-gray-800 disabled:text-gray-600' 
                    : 'bg-white text-gray-700 disabled:bg-gray-100 disabled:text-gray-400'
                }`}
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-gray-800 text-white' 
        : 'bg-gradient-to-b from-gray-50 to-white text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Data Management</h1>
          <div className="flex space-x-2">
            <button
              onClick={handleRefresh}
              className={`p-2 rounded-md ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
              }`}
              title="Refresh Data"
            >
              <RefreshCw size={18} />
            </button>
            <button
              onClick={exportToCSV}
              className={`p-2 rounded-md ${
                isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
              }`}
              title="Export Data"
            >
              <Download size={18} />
            </button>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex space-x-1 mb-6 overflow-x-auto">
          <button
            onClick={() => setActiveTab('coachs')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'coachs'
                ? isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
            }`}
          >
            Coachs
          </button>
          <button
            onClick={() => setActiveTab('guardians')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'guardians'
                ? isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
            }`}
          >
            Guardians
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-4 py-2 rounded-md transition-colors ${
              activeTab === 'children'
                ? isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-100 text-indigo-800'
                : isDarkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-white hover:bg-gray-100'
            }`}
          >
            Players
          </button>
        </div>
        
        {/* Search and Filters */}
        <div className={`p-4 rounded-lg mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search size={18} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
              </div>
              <input
                type="text"
                placeholder={`Search ${activeTab}...`}
                value={searchTerm}
                onChange={handleSearch}
                className={`pl-10 pr-4 py-2 w-full rounded-lg ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white border-gray-600 focus:border-indigo-500' 
                    : 'bg-gray-50 text-gray-900 border-gray-300 focus:border-indigo-500'
                } border focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
              />
            </div>
            <div className="flex space-x-4">
              <div className="relative">
                <select
                  value={filterOptions.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className={`py-2 pl-3 pr-8 rounded-lg appearance-none ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </div>
              </div>
              <div className="relative">
                <select
                  value={filterOptions.sort}
                  onChange={(e) => handleFilterChange('sort', e.target.value)}
                  className={`py-2 pl-3 pr-8 rounded-lg appearance-none ${
                    isDarkMode 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-gray-50 text-gray-900 border-gray-300'
                  } border focus:ring-2 focus:ring-indigo-200 transition-colors duration-200`}
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="alphabetical">Alphabetical</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                  <Filter size={16} className={isDarkMode ? 'text-gray-400' : 'text-gray-500'} />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content */}
        {renderTabContent()}
        
        {/* Details Modal */}
        {showDetailsModal && renderDetailsModal()}
      </div>
    </div>
  );
};

export default DataManagement; 