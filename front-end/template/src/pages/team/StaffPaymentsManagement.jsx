import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api, { adminAPI } from '../../services/api';
import axios from 'axios';
import {
  Search,
  Filter,
  DollarSign,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  X,
  Calendar,
  Users,
  Clock,
  BarChart,
  AlertTriangle,
  Send,
  Mail,
  Edit3,
  Baby,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [showMarkPaidModal, setShowMarkPaidModal] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDescription, setPaymentDescription] = useState('');
  const [showOverduePayments, setShowOverduePayments] = useState(false);
  const [overduePayments, setOverduePayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    amount: '',
    description: '',
    paymentMethod: 'cash',
    status: '',
    date: ''
  });
  const [editLoading, setEditLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingPayment, setDeletingPayment] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const { isDarkMode } = useTheme();
  const [adminUsers, setAdminUsers] = useState([]);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await adminAPI.getPayments();
        setPayments(response.data);
      } catch (error) {
        console.error('Error fetching payments:', error);
        setError('Failed to load payments. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
    fetchOverduePayments();
  }, []);

  const fetchOverduePayments = async () => {
    try {
      const response = await adminAPI.getOverduePayments();
      setOverduePayments(response.data || []);
    } catch (error) {
      console.error('Error fetching overdue payments:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    if (!payment) return false;
    
    const coachName = (payment.coachName || '').toLowerCase();
    const searchTermLower = searchTerm.toLowerCase();
    
    const matchesSearch = coachName.includes(searchTermLower);
    const matchesStatus = filterStatus === 'all' || payment.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  const handleDownloadReceipt = async (paymentId) => {
    try {
      const response = await adminAPI.getPaymentReceipt(paymentId);
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `receipt-${paymentId}.pdf`);
      document.body.appendPlayer(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading receipt:', error);
      setError('Failed to download receipt. Please try again later.');
    }
  };

  const handleShowMarkPaidModal = (coach) => {
    setSelectedCoach(coach);
    setShowMarkPaidModal(true);
  };

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);
      
      // Confirm with user that this is only a record, not an actual payment
      if (!window.confirm('This will only record the payment in the system. The actual payment must be collected separately through cash, check, or bank transfer. Continue?')) {
        setLoading(false);
        return;
      }
      
      const response = await axios.post(
        `${API_BASE_URL}/api/admin/payments/mark-paid/${selectedPayment._id}`,
        {
          amount: paymentAmount,
          datePaid: paymentDate,
          method: paymentMethod,
          reference: paymentReference,
          description: paymentDescription || `Manual payment record - ${paymentMethod}`,
          notify: true
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        }
      );
      
      if (response.status === 200) {
        toast.success("Payment record added successfully and notification sent!");
        setShowPaymentModal(false);
        fetchPayments(); // Refresh payment data
      }
    } catch (error) {
      console.error("Error recording payment:", error);
      toast.error(error.response?.data?.message || "Failed to record payment. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSendReminder = async (contactId) => {
    try {
      setLoading(true);
      
      await adminAPI.sendPaymentReminder(contactId);
      
      setSuccess('Payment reminder sent successfully');
      
    } catch (error) {
      console.error('Error sending payment reminder:', error);
      setError('Failed to send payment reminder. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const openPaymentModal = (payment) => {
    setSelectedPayment(payment);
    setPaymentAmount(payment.amount || '');
    setShowPaymentModal(true);
  };

  const handleDeletePayment = async () => {
    if (!deletingPayment) return;
    
    try {
      setDeleteLoading(true);
      const response = await adminAPI.deletePayment(deletingPayment.id);
      
      if (response.status === 200) {
        toast.success("Payment deleted successfully");
        
        // Remove the deleted payment from the state
        setPayments(payments.filter(payment => payment.id !== deletingPayment.id));
        
        // Close the delete modal
        setShowDeleteModal(false);
        setDeletingPayment(null);
      }
    } catch (error) {
      console.error("Error deleting payment:", error);
      toast.error(error.response?.data?.message || "Failed to delete payment. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleEditPayment = async () => {
    if (!editingPayment) return;
    
    try {
      setEditLoading(true);
      
      const response = await adminAPI.updatePayment(editingPayment.id, editPaymentForm);
      
      if (response.data) {
        toast.success("Payment updated successfully");
        
        // Update the payment in the state
        const updatedPayments = payments.map(payment => 
          payment.id === editingPayment.id ? response.data : payment
        );
        
        setPayments(updatedPayments);
        
        // Close the edit modal
        setShowEditModal(false);
        setEditingPayment(null);
      }
    } catch (error) {
      console.error("Error updating payment:", error);
      toast.error(error.response?.data?.message || "Failed to update payment. Please try again.");
    } finally {
      setEditLoading(false);
    }
  };

  const openEditModal = (payment) => {
    setEditingPayment(payment);
    setEditPaymentForm({
      amount: payment.amount || '',
      description: payment.description || '',
      paymentMethod: payment.paymentMethod || 'cash',
      status: payment.status || 'pending',
      date: payment.paymentDate ? new Date(payment.paymentDate).toISOString().split('T')[0] : ''
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (payment) => {
    setDeletingPayment(payment);
    setShowDeleteModal(true);
  };

  // Function to load admin users during component mount
  useEffect(() => {
    const loadAdminUsers = async () => {
      try {
        // This will get admin users that can be used for coachId
        const response = await api.get('/admin/users?role=admin');
        if (response.data && response.data.length > 0) {
          setAdminUsers(response.data);
        }
      } catch (error) {
        console.error('Error loading admin users:', error);
      }
    };

    loadAdminUsers();
  }, []);

  if (loading && payments.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading payment reports...</p>
        </div>
      </div>
    );
  }

  if (error && payments.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
      }`}>
        <div className="text-red-500 text-xl mb-4">{error}</div>
        <button 
          onClick={() => window.location.reload()}
          className={`px-6 py-3 rounded-full shadow-lg transform transition-all duration-200 hover:scale-105 ${
            isDarkMode 
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700' 
              : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700'
          }`}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${
      isDarkMode 
        ? 'bg-gradient-to-b from-gray-900 to-indigo-950 text-white' 
        : 'bg-gradient-to-b from-blue-50 to-indigo-100 text-gray-900'
    }`}>
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className={`text-2xl font-bold ${
              isDarkMode 
                ? 'text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400' 
                : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600'
            }`}>Payment Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Manage all incoming and outgoing payments
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className={`flex items-center space-x-2 px-4 py-2 rounded-full shadow-md transition-all duration-200 hover:shadow-lg hover:scale-105 ${
              isDarkMode
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'
                : 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Export Report</span>
          </button>
        </div>

        {/* Payment information banner */}
        <div className={`mb-6 p-4 rounded-lg ${
          isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
        }`}>
          <div className="flex items-start">
            <Info className={`h-5 w-5 mt-0.5 mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
            <div>
              <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
                Payment System Note
              </h3>
              <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
                This system only records payment information. Actual payments to coachs must be processed 
                manually outside the system via cash, check, or bank transfer. The generate payment function 
                creates payment records for tracking purposes only.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className={`mb-6 p-4 rounded-lg ${
            isDarkMode ? 'bg-red-900/50 text-red-200' : 'bg-red-100 text-red-700'
          }`}>
            {error}
          </div>
        )}
        
        {/* Filter and search controls */}
        <div className={`flex flex-col sm:flex-row justify-between items-center p-4 rounded-xl mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
        }`}>
          <div className="mb-4 sm:mb-0 flex items-center">
            <Filter className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className={`rounded-lg text-sm py-2 px-3 border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value="all">All Payments</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="cancelled">Cancelled</option>
            </select>
        </div>

          <div className="relative w-full sm:w-64">
                <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-500'
                }`} />
                <input
                  type="text"
              placeholder="Search coach name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
              className={`w-full py-2 pl-10 pr-4 rounded-lg text-sm ${
                    isDarkMode
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border border-gray-300 text-gray-700 placeholder-gray-400'
                  }`}
                />
          </div>
        </div>

        {/* Coach Payments Section */}
        <div className={`overflow-hidden rounded-xl shadow-lg ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        }`}>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Coach
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
              </tr>
            </thead>
              <tbody className={`divide-y ${
                isDarkMode ? 'divide-gray-700' : 'divide-gray-200'
              }`}>
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td 
                      colSpan="6" 
                      className={`px-6 py-10 text-center ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}
                    >
                      No payment records found
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment, index) => (
                    <tr 
                      key={payment.id || index}
                      className={isDarkMode 
                        ? 'hover:bg-gray-700 transition-colors' 
                        : 'hover:bg-gray-50 transition-colors'
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-gray-700' : 'bg-blue-100'
                          }`}>
                            <span className={isDarkMode ? 'text-blue-400' : 'text-blue-600'}>
                              {payment.coachName ? payment.coachName.charAt(0) : 'U'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium">
                              {payment.coachName || 'Unknown Coach'}
                            </div>
                            {payment.playerName && (
                              <div className={`text-xs ${
                                isDarkMode ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                For: {payment.playerName}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {new Date(payment.paymentDate).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className={`text-sm font-medium ${
                          isDarkMode ? 'text-green-400' : 'text-green-600'
                        }`}>
                          ${parseFloat(payment.amount).toFixed(2)}
                        </div>
                        <div className={`text-xs ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {payment.paymentMethod === 'cash' ? 'Cash' : 
                           payment.paymentMethod === 'check' ? 'Check' : 'Bank Transfer'}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.status === 'completed'
                            ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          : payment.status === 'pending'
                            ? isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                            : isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status === 'completed' ? (
                            <CheckCircle className="mr-1 h-3 w-3" />
                          ) : payment.status === 'pending' ? (
                            <Clock className="mr-1 h-3 w-3" />
                          ) : (
                            <XCircle className="mr-1 h-3 w-3" />
                          )}
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="line-clamp-2">
                          {payment.description || 'No description provided'}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleDownloadReceipt(payment.id)}
                            className={`p-1 rounded-full ${
                              isDarkMode
                                ? 'text-blue-400 hover:bg-gray-700' 
                                : 'text-blue-600 hover:bg-gray-100'
                            }`}
                            title="Download Receipt"
                          >
                            <FileText className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openEditModal(payment)}
                            className={`p-1 rounded-full ${
                              isDarkMode
                                ? 'text-yellow-400 hover:bg-gray-700' 
                                : 'text-yellow-600 hover:bg-gray-100'
                            }`}
                            title="Edit Payment"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>

                          <button
                            onClick={() => openDeleteModal(payment)}
                            className={`p-1 rounded-full ${
                              isDarkMode
                                ? 'text-red-400 hover:bg-gray-700' 
                                : 'text-red-600 hover:bg-gray-100'
                            }`}
                            title="Delete Payment"
                          >
                            <X className="h-4 w-4" />
                          </button>

                        {payment.status !== 'Paid' && (
                          <button
                            onClick={() => openPaymentModal(payment)}
                            className={`px-3 py-1 rounded-md transition ${
                              isDarkMode 
                                ? 'bg-green-700 hover:bg-green-600 text-white' 
                                : 'bg-green-500 hover:bg-green-600 text-white'
                            }`}
                          >
                            <Edit3 className="inline-block h-3 w-3 mr-1" />
                              Mark as Paid
                          </button>
                        )}
                        {payment.status !== 'Paid' && (
                          <button
                            onClick={() => handleSendReminder(payment._id)}
                            className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition"
                          >
                            Send Reminder
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>

        {/* Payment statistics */}
        <div className={`mt-8 p-6 rounded-xl ${
          isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
        }`}>
          <h2 className={`text-xl font-semibold mb-4 ${
            isDarkMode ? 'text-gray-200' : 'text-gray-800'
          }`}>
            <BarChart className="inline-block mr-2 h-5 w-5" />
            Payment Statistics
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Payments
              </div>
              <div className={`text-2xl font-bold ${
                isDarkMode ? 'text-gray-100' : 'text-gray-900'
              }`}>
                {filteredPayments.length}
              </div>
                </div>
                
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-green-50'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Total Amount
              </div>
              <div className={`text-2xl font-bold ${
                isDarkMode ? 'text-green-400' : 'text-green-600'
              }`}>
                ${filteredPayments
                  .reduce((sum, payment) => sum + (parseFloat(payment.amount) || 0), 0)
                  .toFixed(2)}
              </div>
                </div>
                
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Pending Payments
              </div>
              <div className={`text-2xl font-bold ${
                isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
              }`}>
                {filteredPayments.filter(payment => payment.status === 'pending').length}
              </div>
                </div>
                
            <div className={`p-4 rounded-lg ${
              isDarkMode ? 'bg-gray-700' : 'bg-indigo-50'
            }`}>
              <div className={`text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>
                Coachs Paid
                </div>
              <div className={`text-2xl font-bold ${
                isDarkMode ? 'text-indigo-400' : 'text-indigo-600'
              }`}>
                {new Set(filteredPayments
                  .filter(payment => payment.status === 'completed')
                  .map(payment => payment.coachId)
                ).size}
                </div>
            </div>
          </div>
        </div>
      </div>
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`rounded-lg p-6 w-full max-w-md ${isDarkMode ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Mark Payment as Paid</h2>
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`p-1 rounded-md ${isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="border-t border-b py-3 mb-4 text-sm">
              <div className={`rounded-md p-3 mb-4 ${isDarkMode ? 'bg-blue-900/30 text-blue-200' : 'bg-blue-50 text-blue-800'}`}>
                <p><strong>Note:</strong> This will only record the payment in the system. The actual payment must be collected separately through cash, check, or bank transfer.</p>
              </div>
              
              <p><strong>Coach:</strong> {selectedPayment?.coachName}</p>
              {selectedPayment?.playerName && <p><strong>For Player:</strong> {selectedPayment.playerName}</p>}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Amount ($)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={(e) => setPaymentDate(e.target.value)}
                  required
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Method
                </label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                >
                  <option value="cash">Cash</option>
                  <option value="check">Check</option>
                  <option value="bank transfer">Bank Transfer</option>
                </select>
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Reference
                </label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
              
              <div>
                <label className={`block mb-2 text-sm font-medium ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                  Payment Description
                </label>
                <textarea
                  value={paymentDescription}
                  onChange={(e) => setPaymentDescription(e.target.value)}
                  className={`w-full px-3 py-2 rounded-md ${
                    isDarkMode ? 'bg-gray-700 text-white' : 'bg-gray-50 text-gray-900'
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleMarkAsPaid}
                className={`px-4 py-2 rounded-md ${
                  isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                }`}
              >
                Mark as Paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments; 