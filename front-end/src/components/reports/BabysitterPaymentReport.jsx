import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api from '../../utils/axiosConfig';
import { 
  DollarSign, 
  AlertCircle, 
  RefreshCw, 
  Calendar, 
  Users, 
  CheckCircle, 
  Clock,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import { toast } from 'react-hot-toast';

const CoachPaymentReport = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coachs, setCoachs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [sessionType, setSessionType] = useState('full-day');
  const [childrenCount, setPlayersCount] = useState(1);
  const [selectedCoach, setSelectedCoach] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const [expandedPayment, setExpandedPayment] = useState(null);
  const { isDarkMode } = useTheme();

  const fetchPayments = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initially fetch all coach payment records
      const response = await api.get('/payments/coach/history');
      
      // Handle the case where no payments have been generated yet
      if (!response.data || !response.data.payments) {
        setPayments([]);
      } else {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching coach payments:', error);
      if (error.response && error.response.status === 404) {
        // No payments found yet, set empty array
        setPayments([]);
      } else {
        setError('Failed to load coach payment data. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCoachs = async () => {
    try {
      const response = await api.get('/admin/coachs');
      setCoachs(response.data || []);
    } catch (error) {
      console.error('Error fetching coachs:', error);
      toast.error('Failed to load coachs');
    }
  };

  useEffect(() => {
    fetchPayments();
    fetchCoachs();
  }, []);

  const handleGeneratePayment = async () => {
    if (!selectedCoach) {
      toast.error('Please select a coach');
      return;
    }
    
    if (!childrenCount || childrenCount < 1) {
      toast.error('Please enter a valid number of children');
      return;
    }

    // Validate that the coachId is a valid MongoDB ObjectId (24 hex characters)
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(selectedCoach);
    if (!isValidObjectId) {
      toast.error('Invalid coach selection. Please select a coach from the dropdown.');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await api.post('/admin/payments/coach/generate', {
        coachId: selectedCoach,
        date: selectedDate,
        sessionType,
        childrenCount: parseInt(childrenCount)
      });
      
      toast.success('Payment record generated successfully');
      fetchPayments();
    } catch (error) {
      console.error('Error generating payment:', error);
      toast.error(error.response?.data?.message || 'Failed to generate payment record');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAutoGeneratePayments = async () => {
    try {
      setIsAutoGenerating(true);
      
      const response = await api.post('/admin/payments/coach/auto-generate', {
        date: selectedDate
      });
      
      toast.success(`Generated ${response.data.totalPaymentsGenerated} payment records`);
      fetchPayments();
    } catch (error) {
      console.error('Error auto-generating payments:', error);
      toast.error(error.response?.data?.message || 'Failed to auto-generate payment records');
    } finally {
      setIsAutoGenerating(false);
    }
  };

  const handleVerifyPayment = async (paymentId) => {
    try {
      await api.put(`/admin/payments/coach/${paymentId}/verify`);
      toast.success('Payment verified successfully');
      
      // Update the payment in the state
      setPayments(payments.map(payment => 
        payment._id === paymentId ? { ...payment, status: 'verified', verifiedAt: new Date() } : payment
      ));
    } catch (error) {
      console.error('Error verifying payment:', error);
      toast.error('Failed to verify payment');
    }
  };

  const toggleExpandPayment = (paymentId) => {
    setExpandedPayment(expandedPayment === paymentId ? null : paymentId);
  };

  return (
    <div>
      {/* Payment information banner */}
      <div className={`mb-6 p-4 rounded-lg ${
        isDarkMode ? 'bg-blue-900/30 border border-blue-800' : 'bg-blue-50 border border-blue-200'
      }`}>
        <div className="flex items-start">
          <Info className={`h-5 w-5 mt-0.5 mr-2 ${isDarkMode ? 'text-blue-300' : 'text-blue-500'}`} />
          <div>
            <h3 className={`text-sm font-medium ${isDarkMode ? 'text-blue-300' : 'text-blue-700'}`}>
              Manual Payment System
            </h3>
            <p className={`text-sm mt-1 ${isDarkMode ? 'text-blue-200' : 'text-blue-600'}`}>
              This system only records payment information. Actual payments to coachs must be processed 
              manually outside the system via cash, check, or bank transfer. The generate payment function 
              creates payment records for tracking purposes only.
            </p>
          </div>
        </div>
      </div>

      {/* Payment generation sections */}
      <div className={`rounded-xl mb-6 ${isDarkMode ? 'bg-gray-800' : 'bg-white shadow'} p-6`}>
        <h2 className="text-lg font-semibold mb-4">Record Payment Information</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Manual payment generation */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className="text-md font-medium mb-3">Manual Payment Record</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Coach</label>
                <select
                  value={selectedCoach}
                  onChange={(e) => setSelectedCoach(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                >
                  <option value="">Select Coach</option>
                  {coachs.map(coach => (
                    <option key={coach._id} value={coach._id}>
                      {coach.firstName} {coach.lastName}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
              
              <div>
                <label className="block text-sm mb-1">Session Type</label>
                <select
                  value={sessionType}
                  onChange={(e) => setSessionType(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                >
                  <option value="half-day">Half Day (2,000K per player)</option>
                  <option value="full-day">Full Day (5,000K per player)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm mb-1">Number of Players</label>
                <input
                  type="number"
                  min="1"
                  value={childrenCount}
                  onChange={(e) => setPlayersCount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </div>
              
            <div className="mt-4">
              <button
                onClick={handleGeneratePayment}
                disabled={isGenerating || !selectedCoach}
                className={`w-full py-2 rounded-lg flex items-center justify-center ${
                  isGenerating || !selectedCoach
                    ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                    : isDarkMode ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'
                }`}
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Recording...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Record Payment
                  </>
                )}
              </button>
            </div>
          </div>
          
          {/* Auto payment generation */}
          <div className={`p-4 rounded-lg border ${isDarkMode ? 'border-gray-700 bg-gray-800/50' : 'border-gray-200 bg-gray-50'}`}>
            <h3 className="text-md font-medium mb-3">Bulk Payment Records</h3>
            <p className="text-sm mb-3 text-gray-500">
              Automatically generate payment records for all active coachs based on their scheduled sessions for the selected date.
            </p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-1">Date</label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className={`w-full px-3 py-2 rounded-lg ${
                    isDarkMode
                      ? 'bg-gray-700 text-white border-gray-600'
                      : 'bg-white text-gray-900 border-gray-300'
                  }`}
                />
              </div>
            </div>
            
            <div className="mt-4">
              <button
                onClick={handleAutoGeneratePayments}
                disabled={isAutoGenerating}
                className={`w-full py-2 rounded-lg flex items-center justify-center ${
                  isAutoGenerating
                    ? isDarkMode ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                    : isDarkMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-purple-500 hover:bg-purple-600 text-white'
                }`}
              >
                {isAutoGenerating ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <DollarSign className="w-4 h-4 mr-2" />
                    Auto-Generate Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Payment records list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <RefreshCw className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
          <p className="text-lg">Loading payment data...</p>
        </div>
      ) : error ? (
        <div className={`rounded-lg p-6 ${isDarkMode ? 'bg-red-900/50' : 'bg-red-100'} mb-6`}>
          <div className="flex items-center">
            <AlertCircle className={`w-6 h-6 mr-3 ${isDarkMode ? 'text-red-300' : 'text-red-500'}`} />
            <p className={isDarkMode ? 'text-red-300' : 'text-red-700'}>{error}</p>
          </div>
          <button
            onClick={fetchPayments}
            className={`mt-4 px-4 py-2 rounded-lg ${
              isDarkMode
                ? 'bg-red-700 hover:bg-red-600 text-white'
                : 'bg-red-600 hover:bg-red-700 text-white'
            }`}
          >
            Try Again
          </button>
        </div>
      ) : payments.length === 0 ? (
        <div className={`rounded-lg p-12 ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} mb-6 text-center`}>
          <DollarSign className={`w-16 h-16 mx-auto mb-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-300'}`} />
          <h2 className="text-xl font-semibold mb-2">No Payment Records Found</h2>
          <p className={`mb-6 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            There are no coach payment records yet. Generate payments using the controls above.
          </p>
        </div>
      ) : (
        <div className={`rounded-lg ${isDarkMode ? 'bg-gray-800/70' : 'bg-white'} mb-6 overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={isDarkMode ? 'bg-gray-700/50' : 'bg-gray-50'}>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Coach
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Session
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Players
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payments.map(payment => (
                  <React.Fragment key={payment._id}>
                    <tr 
                      className={`cursor-pointer ${
                        isDarkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-50'
                      }`}
                      onClick={() => toggleExpandPayment(payment._id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className={`flex-shrink-0 h-10 w-10 rounded-full flex items-center justify-center ${
                            isDarkMode ? 'bg-indigo-900' : 'bg-indigo-100'
                          }`}>
                            <span className={`text-lg font-medium ${
                              isDarkMode ? 'text-indigo-300' : 'text-indigo-600'
                            }`}>
                              {payment.coachId?.firstName?.charAt(0) || 'B'}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium">
                              {payment.coachId?.firstName} {payment.coachId?.lastName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {new Date(payment.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.sessionType === 'half-day'
                            ? isDarkMode ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'
                            : isDarkMode ? 'bg-purple-900 text-purple-200' : 'bg-purple-100 text-purple-800'
                        }`}>
                          {payment.sessionType === 'half-day' ? 'Half Day' : 'Full Day'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Users className="h-4 w-4 mr-1" />
                          <span>{payment.numberOfPlayers}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-medium">
                        <span className={isDarkMode ? 'text-green-400' : 'text-green-600'}>
                          {payment.totalAmount.toLocaleString()}K
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          payment.status === 'verified'
                            ? isDarkMode ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800'
                            : isDarkMode ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex justify-end items-center space-x-2">
                          {payment.status !== 'verified' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleVerifyPayment(payment._id);
                              }}
                              className={`p-1.5 rounded-full ${
                                isDarkMode
                                  ? 'bg-green-900 text-green-300 hover:bg-green-800'
                                  : 'bg-green-100 text-green-600 hover:bg-green-200'
                              }`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpandPayment(payment._id);
                            }}
                            className={`p-1.5 rounded-full ${
                              isDarkMode
                                ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {expandedPayment === payment._id ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedPayment === payment._id && (
                      <tr className={isDarkMode ? 'bg-gray-750' : 'bg-gray-50'}>
                        <td colSpan="7" className="px-6 py-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="font-medium mb-2">Payment Details</h3>
                              <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Amount per player:</span>
                                  <span>{payment.amountPerPlayer}K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Number of children:</span>
                                  <span>{payment.numberOfPlayers}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Total amount:</span>
                                  <span className="font-medium">{payment.totalAmount.toLocaleString()}K</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Recorded at:</span>
                                  <span>{new Date(payment.recordedAt).toLocaleString()}</span>
                                </div>
                                {payment.verifiedAt && (
                                  <div className="flex justify-between">
                                    <span className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>Verified at:</span>
                                    <span>{new Date(payment.verifiedAt).toLocaleString()}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            <div>
                              <h3 className="font-medium mb-2">Actions</h3>
                              {payment.status !== 'verified' ? (
                                <button
                                  onClick={() => handleVerifyPayment(payment._id)}
                                  className={`flex items-center space-x-2 px-3 py-2 rounded-md ${
                                    isDarkMode
                                      ? 'bg-green-700 hover:bg-green-600 text-white'
                                      : 'bg-green-600 hover:bg-green-700 text-white'
                                  }`}
                                >
                                  <CheckCircle className="h-4 w-4" />
                                  <span>Verify Payment</span>
                                </button>
                              ) : (
                                <p className={isDarkMode ? 'text-gray-400' : 'text-gray-500'}>
                                  This payment has been verified and cannot be modified.
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CoachPaymentReport; 