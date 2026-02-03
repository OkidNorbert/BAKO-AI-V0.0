import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import {
  DollarSign,
  Plus,
  Edit,
  Trash,
  Check,
  X,
  Filter,
  Search,
  Download,
  PieChart,
  BarChart2,
  ArrowUp,
  ArrowDown,
  FileText
} from 'lucide-react';

const BudgetManagement = () => {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentBudget, setCurrentBudget] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterFiscalYear, setFilterFiscalYear] = useState('all');
  const { isDarkMode } = useTheme();
  const { isAuthenticated } = useAuth();
  
  const [newBudget, setNewBudget] = useState({
    title: '',
    amount: 0,
    category: 'operational',
    description: '',
    fiscalYear: new Date().getFullYear().toString(),
    status: 'planned'
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchBudgets();
    }
  }, [isAuthenticated]);

  const fetchBudgets = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await adminAPI.getBudgets();
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      setError('Failed to fetch budget data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewBudget({
      ...newBudget,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      await adminAPI.createBudget(newBudget);
      
      setSuccess('Budget created successfully');
      setShowAddModal(false);
      setNewBudget({
        title: '',
        amount: 0,
        category: 'operational',
        description: '',
        fiscalYear: new Date().getFullYear().toString(),
        status: 'planned'
      });
      
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
      setError('Failed to create budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (budget) => {
    setCurrentBudget(budget);
    setShowEditModal(true);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentBudget({
      ...currentBudget,
      [name]: name === 'amount' ? parseFloat(value) || 0 : value
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      await adminAPI.updateBudget(currentBudget.id, currentBudget);
      
      setSuccess('Budget updated successfully');
      setShowEditModal(false);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
      setError('Failed to update budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this budget?')) {
      return;
    }
    
    try {
      setLoading(true);
      
      await adminAPI.deleteBudget(id);
      
      setSuccess('Budget deleted successfully');
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
      setError('Failed to delete budget. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filteredBudgets = budgets.filter(budget => {
    if (!budget) return false;
    
    const matchesSearch = budget.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          budget.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || budget.status === filterStatus;
    const matchesFiscalYear = filterFiscalYear === 'all' || budget.fiscalYear === filterFiscalYear;
    
    return matchesSearch && matchesStatus && matchesFiscalYear;
  });

  const fiscalYears = [...new Set(budgets.map(budget => budget.fiscalYear))].sort();

  // Calculate budget statistics
  const totalBudget = filteredBudgets.reduce((sum, budget) => sum + budget.amount, 0);
  const allocatedBudget = filteredBudgets.filter(b => b.status === 'approved').reduce((sum, budget) => sum + budget.amount, 0);
  const pendingBudget = filteredBudgets.filter(b => b.status === 'planned').reduce((sum, budget) => sum + budget.amount, 0);
  const spentBudget = filteredBudgets.filter(b => b.status === 'spent').reduce((sum, budget) => sum + budget.amount, 0);

  if (loading && budgets.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'}`}>
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Budget Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Plan, track, and manage daycare financial resources
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-md ${
              isDarkMode
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>Add Budget</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-md">
            {success}
          </div>
        )}

        {/* Budget Overview */}
        <div className={`mb-6 p-6 rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-blue-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Total Budget</h3>
              <DollarSign className={`h-5 w-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-500'}`} />
            </div>
            <p className="text-2xl font-bold mt-2">${totalBudget.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-green-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Allocated</h3>
              <Check className={`h-5 w-5 ${isDarkMode ? 'text-green-400' : 'text-green-500'}`} />
            </div>
            <p className="text-2xl font-bold mt-2">${allocatedBudget.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Pending</h3>
              <FileText className={`h-5 w-5 ${isDarkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
            </div>
            <p className="text-2xl font-bold mt-2">${pendingBudget.toLocaleString()}</p>
          </div>
          <div className={`p-4 rounded-lg ${isDarkMode ? 'bg-gray-700' : 'bg-red-50'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-medium">Spent</h3>
              <ArrowDown className={`h-5 w-5 ${isDarkMode ? 'text-red-400' : 'text-red-500'}`} />
            </div>
            <p className="text-2xl font-bold mt-2">${spentBudget.toLocaleString()}</p>
          </div>
        </div>

        {/* Search and Filter */}
        <div className={`mb-6 p-4 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input
                type="text"
                placeholder="Search budgets..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white placeholder-gray-400'
                    : 'bg-gray-50 text-gray-900 placeholder-gray-500'
                }`}
              />
            </div>
            <div className="flex items-center gap-2">
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
                <option value="planned">Planned</option>
                <option value="approved">Approved</option>
                <option value="spent">Spent</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <BarChart2 className={`h-4 w-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <select
                value={filterFiscalYear}
                onChange={(e) => setFilterFiscalYear(e.target.value)}
                className={`rounded-md ${
                  isDarkMode
                    ? 'bg-gray-700 text-white'
                    : 'bg-gray-50 text-gray-900'
                }`}
              >
                <option value="all">All Fiscal Years</option>
                {fiscalYears.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Budgets Table */}
        <div className={`rounded-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-sm`}>
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Fiscal Year
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDarkMode ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {filteredBudgets.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center">
                    <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                      No budget records found.
                    </p>
                  </td>
                </tr>
              ) : (
                filteredBudgets.map((budget) => (
                  <tr key={budget.id} className={isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium">{budget.title}</div>
                      <div className={`text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {budget.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ${budget.amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap capitalize">
                      {budget.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {budget.fiscalYear}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        budget.status === 'approved'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : budget.status === 'planned'
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : budget.status === 'spent'
                              ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}>
                        {budget.status.charAt(0).toUpperCase() + budget.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(budget)}
                          className={`p-1 rounded-md ${
                            isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Edit className="h-4 w-4 text-blue-500" />
                        </button>
                        <button
                          onClick={() => handleDelete(budget.id)}
                          className={`p-1 rounded-md ${
                            isDarkMode ? 'hover:bg-gray-600' : 'hover:bg-gray-200'
                          }`}
                        >
                          <Trash className="h-4 w-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Budget Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`w-full max-w-md p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Add New Budget</h2>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={newBudget.title}
                    onChange={handleInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    value={newBudget.amount}
                    onChange={handleInputChange}
                    required
                    min="0"
                    step="0.01"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={newBudget.category}
                    onChange={handleInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="operational">Operational</option>
                    <option value="supplies">Supplies</option>
                    <option value="salaries">Salaries</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="food">Food</option>
                    <option value="activities">Activities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={newBudget.description}
                    onChange={handleInputChange}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Fiscal Year</label>
                  <input
                    type="text"
                    name="fiscalYear"
                    value={newBudget.fiscalYear}
                    onChange={handleInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={newBudget.status}
                    onChange={handleInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="planned">Planned</option>
                    <option value="approved">Approved</option>
                    <option value="spent">Spent</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Save Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Budget Modal */}
      {showEditModal && currentBudget && (
        <div className="fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50">
          <div className={`w-full max-w-md p-6 rounded-lg ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <h2 className="text-xl font-bold mb-4">Edit Budget</h2>
            <form onSubmit={handleUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <input
                    type="text"
                    name="title"
                    value={currentBudget.title}
                    onChange={handleEditInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Amount ($)</label>
                  <input
                    type="number"
                    name="amount"
                    value={currentBudget.amount}
                    onChange={handleEditInputChange}
                    required
                    min="0"
                    step="0.01"
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Category</label>
                  <select
                    name="category"
                    value={currentBudget.category}
                    onChange={handleEditInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="operational">Operational</option>
                    <option value="supplies">Supplies</option>
                    <option value="salaries">Salaries</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="food">Food</option>
                    <option value="activities">Activities</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    name="description"
                    value={currentBudget.description}
                    onChange={handleEditInputChange}
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                    rows="3"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Fiscal Year</label>
                  <input
                    type="text"
                    name="fiscalYear"
                    value={currentBudget.fiscalYear}
                    onChange={handleEditInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">Status</label>
                  <select
                    name="status"
                    value={currentBudget.status}
                    onChange={handleEditInputChange}
                    required
                    className={`w-full p-2 rounded-md ${
                      isDarkMode
                        ? 'bg-gray-700 text-white'
                        : 'bg-gray-50 text-gray-900'
                    }`}
                  >
                    <option value="planned">Planned</option>
                    <option value="approved">Approved</option>
                    <option value="spent">Spent</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              
              <div className="flex justify-end space-x-2 mt-6">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-gray-700 hover:bg-gray-600'
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 rounded-md ${
                    isDarkMode
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  Update Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BudgetManagement; 