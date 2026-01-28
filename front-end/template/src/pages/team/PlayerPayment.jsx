import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import api, { adminAPI } from '../../services/api';
import {
  Search,
  Filter,
  DollarSign,
  CheckCircle,
  Calendar,
  Users,
  Clock,
  AlertTriangle,
  Download,
  X
} from 'lucide-react';
import { showToast } from '../../components/shared/Toast';

const PlayerPayment = () => {
  const [childrenList, setPlayersList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSession, setFilterSession] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash',
    reference: '',
    description: 'Daycare fee payment'
  });
  const { isDarkMode } = useTheme();
  const [paymentHistory, setPaymentHistory] = useState([]);
  const [showPaymentHistory, setShowPaymentHistory] = useState(false);
  const [currentPlayerForHistory, setCurrentPlayerForHistory] = useState(null);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [revenueBySession, setRevenueBySession] = useState({
    'full-day': 0,
    'half-day': 0
  });

  // Fetch children when component mounts
  useEffect(() => {
    fetchPlayersWithSessionInfo();
    fetchTotalRevenue();
  }, []);

  const fetchPlayersWithSessionInfo = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPlayers();
      
      // Enhance children data with session type and payment status
      const enhancedPlayersList = response.data.map(player => {
        // Use player's own sessionType property instead of trying to fetch a schedule
        const sessionType = player.sessionType || 'full-day';
        const paymentStatus = player.lastPaymentDate ? 'paid' : 'unpaid';
        
        return {
          ...player,
          sessionType,
          isEnrolled: true,
          paymentStatus,
          paymentAmount: sessionType === 'full-day' ? 5000 : 2000 // Default payment amount based on session
        };
      });
      
      setPlayersList(enhancedPlayersList);
    } catch (error) {
      console.error('Error fetching children:', error);
      setError('Failed to load children. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const fetchTotalRevenue = async () => {
    try {
      const response = await adminAPI.getPaymentStats();
      if (response.data) {
        setTotalRevenue(response.data.totalRevenue || 0);
        setRevenueBySession({
          'full-day': response.data.revenueBySession?.['full-day'] || 0,
          'half-day': response.data.revenueBySession?.['half-day'] || 0
        });
      }
    } catch (error) {
      console.error('Error fetching revenue data:', error);
    }
  };

  const fetchPlayerPaymentHistory = async (playerId) => {
    try {
      setLoading(true);
      const response = await adminAPI.getPlayerPayments(playerId);
      
      // Check the structure of the response data
      if (response.data && response.data.payments) {
        // Handle case where API returns { payments: [...] }
        setPaymentHistory(response.data.payments);
      } else if (Array.isArray(response.data)) {
        // Handle case where API returns the array directly
        setPaymentHistory(response.data);
      } else {
        // If response format is unexpected, use empty array
        setPaymentHistory([]);
        console.warn('Unexpected payment history format:', response.data);
      }
      
      setShowPaymentHistory(true);
    } catch (error) {
      console.error('Error fetching payment history:', error);
      // Set empty array to handle gracefully
      setPaymentHistory([]);
      setShowPaymentHistory(true); // Still show the modal with empty state
      
      // Show more informative error message
      let errorMessage = 'No payment records found for this player';
      
      if (error.response) {
        if (error.response.status === 500) {
          errorMessage = 'Server error - The system encountered an issue when retrieving payment data';
        }
      }
      
      showToast(errorMessage, 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenPaymentModal = (player) => {
    setSelectedPlayer(player);
    setPaymentForm({
      ...paymentForm,
      amount: player.paymentAmount || 5000
    });
    setShowPaymentModal(true);
  };

  const handleViewPaymentHistory = (player) => {
    setCurrentPlayerForHistory(player);
    fetchPlayerPaymentHistory(player._id);
  };

  const handlePaymentSubmit = async () => {
    if (!selectedPlayer) return;
    
    try {
      setLoading(true);
      
      const paymentData = {
        playerId: selectedPlayer._id,
        amount: parseFloat(paymentForm.amount),
        paymentDate: paymentForm.paymentDate,
        paymentMethod: paymentForm.paymentMethod,
        description: paymentForm.description || 'Daycare fee payment',
        sessionType: selectedPlayer.sessionType
      };
      
      const response = await adminAPI.recordPlayerPayment(paymentData);
      
      if (response.data) {
        showToast('Payment recorded successfully', 'success');
        setShowPaymentModal(false);
        
        // Reset form
        setPaymentForm({
          amount: '',
          paymentDate: new Date().toISOString().split('T')[0],
          paymentMethod: 'cash',
          reference: '',
          description: 'Daycare fee payment'
        });
        
        // Refresh data
        fetchPlayersWithSessionInfo();
        fetchTotalRevenue();
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      showToast(error.response?.data?.message || 'Failed to record payment', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Filter children based on search term and session type
  const filteredPlayers = childrenList.filter(player => {
    const fullName = `${player.firstName} ${player.lastName}`.toLowerCase();
    const searchMatch = fullName.includes(searchTerm.toLowerCase());
    const sessionMatch = filterSession === 'all' || player.sessionType === filterSession;
    
    return searchMatch && sessionMatch;
  });

  if (loading && childrenList.length === 0) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${
        isDarkMode 
          ? 'bg-gradient-to-b from-gray-900 to-indigo-950' 
          : 'bg-gradient-to-b from-blue-50 to-indigo-100'
      }`}>
        <div className="flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-primary-500"></div>
          <p className={`mt-4 text-lg ${isDarkMode ? 'text-white' : 'text-indigo-700'}`}>Loading children...</p>
        </div>
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
            }`}>Player Payment Management</h1>
            <p className={`mt-1 text-sm ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Record payments for children based on their enrollment session
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

        {/* Revenue Overview */}
        <div className={`grid grid-cols-1 md:grid-cols-3 gap-6 mb-6`}>
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Total Revenue
            </h3>
            <p className="text-4xl font-bold text-green-500">${totalRevenue.toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Full-Day Revenue
            </h3>
            <p className="text-4xl font-bold text-blue-500">${revenueBySession['full-day'].toLocaleString()}</p>
          </div>
          <div className={`p-6 rounded-xl shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h3 className={`text-lg font-semibold mb-2 ${
              isDarkMode ? 'text-gray-200' : 'text-gray-800'
            }`}>
              Half-Day Revenue
            </h3>
            <p className="text-4xl font-bold text-purple-500">${revenueBySession['half-day'].toLocaleString()}</p>
          </div>
        </div>

        {/* Filter and search controls */}
        <div className={`flex flex-col sm:flex-row justify-between items-center p-4 rounded-xl mb-6 ${
          isDarkMode ? 'bg-gray-800' : 'bg-white shadow-lg'
        }`}>
          <div className="mb-4 sm:mb-0 flex items-center">
            <Filter className={`h-5 w-5 mr-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
            <select
              value={filterSession}
              onChange={(e) => setFilterSession(e.target.value)}
              className={`rounded-lg text-sm py-2 px-3 border ${
                isDarkMode 
                  ? 'bg-gray-700 border-gray-600 text-white' 
                  : 'bg-white border-gray-300 text-gray-700'
              }`}
            >
              <option value="all">All Sessions</option>
              <option value="full-day">Full Day</option>
              <option value="half-day">Half Day</option>
            </select>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className={`absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-500'
            }`} />
            <input
              type="text"
              placeholder="Search by player name..."
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

        {/* Players payment table */}
        <div className={`rounded-lg overflow-hidden ${
          isDarkMode ? 'bg-gray-800' : 'bg-white'
        } shadow-md`}>
          <table className="min-w-full divide-y divide-gray-200">
            <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Player Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Contact
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Session Type
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Payment Amount
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Last Payment
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPlayers.length === 0 ? (
                <tr className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                  <td colSpan="7" className="px-6 py-4 text-center text-sm">
                    No children found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPlayers.map((player) => (
                  <tr key={player._id} className={isDarkMode ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">
                        {player.firstName} {player.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        {player.contactName || (player.contact ? `${player.contact.firstName} ${player.contact.lastName}` : 'Not assigned')}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        player.sessionType === 'full-day'
                          ? isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'
                          : isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-800'
                      }`}>
                        {player.sessionType === 'full-day' ? 'Full Day' : 'Half Day'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`text-sm font-medium ${isDarkMode ? 'text-green-400' : 'text-green-600'}`}>
                        ${player.paymentAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        player.paymentStatus === 'paid'
                          ? isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'
                          : isDarkMode ? 'bg-yellow-900 text-yellow-300' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {player.paymentStatus === 'paid' ? 'Paid' : 'Unpaid'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {player.lastPaymentDate ? new Date(player.lastPaymentDate).toLocaleDateString() : 'No payment record'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex space-x-2">
                        <button 
                          onClick={() => handleOpenPaymentModal(player)}
                          className={`px-3 py-1 rounded-md ${
                            isDarkMode ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'
                          }`}>
                          <DollarSign className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleViewPaymentHistory(player)}
                          className={`px-3 py-1 rounded-md ${
                            isDarkMode ? 'bg-gray-600 text-white' : 'bg-gray-100 text-gray-700'
                          }`}>
                          <Clock className="h-4 w-4" />
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

      {/* Payment Modal */}
      {showPaymentModal && selectedPlayer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-md p-6 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <h2 className={`text-xl font-bold mb-4 ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>
              Record Payment for {selectedPlayer.firstName} {selectedPlayer.lastName}
            </h2>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Session Type
              </label>
              <div className={`py-2 px-3 bg-opacity-50 rounded ${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
              }`}>
                {selectedPlayer.sessionType === 'full-day' ? 'Full Day' : 'Half Day'}
              </div>
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Amount ($)
              </label>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                className={`w-full py-2 px-3 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Payment Date
              </label>
              <input
                type="date"
                value={paymentForm.paymentDate}
                onChange={(e) => setPaymentForm({...paymentForm, paymentDate: e.target.value})}
                className={`w-full py-2 px-3 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              />
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Payment Method
              </label>
              <select
                value={paymentForm.paymentMethod}
                onChange={(e) => setPaymentForm({...paymentForm, paymentMethod: e.target.value})}
                className={`w-full py-2 px-3 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="bank_transfer">Bank Transfer</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-1 ${
                isDarkMode ? 'text-gray-300' : 'text-gray-700'
              }`}>
                Description
              </label>
              <textarea
                value={paymentForm.description}
                onChange={(e) => setPaymentForm({...paymentForm, description: e.target.value})}
                className={`w-full py-2 px-3 rounded border ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-900'
                }`}
                rows="2"
              ></textarea>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className={`px-4 py-2 rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Cancel
              </button>
              <button
                onClick={handlePaymentSubmit}
                disabled={loading}
                className={`px-4 py-2 rounded ${
                  isDarkMode 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Processing...' : 'Record Payment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Payment History Modal */}
      {showPaymentHistory && currentPlayerForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className={`w-full max-w-4xl p-6 rounded-lg shadow-lg ${
            isDarkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className={`text-xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                Payment History: {currentPlayerForHistory.firstName} {currentPlayerForHistory.lastName}
              </h2>
              <button
                onClick={() => setShowPaymentHistory(false)}
                className={`p-1 rounded-full ${
                  isDarkMode ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            
            {paymentHistory.length === 0 ? (
              <div className={`py-8 text-center ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <AlertTriangle className="h-10 w-10 mx-auto mb-2" />
                <p>No payment records found for this player.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className={isDarkMode ? 'bg-gray-700' : 'bg-gray-50'}>
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Date
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Amount
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Method
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Session
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {paymentHistory.map(payment => (
                      <tr key={payment._id} className={isDarkMode ? 'bg-gray-800' : 'bg-white'}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${
                            isDarkMode ? 'text-green-400' : 'text-green-600'
                          }`}>
                            ${payment.amount.toLocaleString()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.paymentMethod === 'cash' ? 'Cash' : 
                           payment.paymentMethod === 'check' ? 'Check' : 'Bank Transfer'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {payment.sessionType === 'full-day' ? 'Full Day' : 'Half Day'}
                        </td>
                        <td className="px-6 py-4 text-sm">
                          {payment.description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowPaymentHistory(false)}
                className={`px-4 py-2 rounded ${
                  isDarkMode 
                    ? 'bg-gray-700 text-white hover:bg-gray-600' 
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlayerPayment; 