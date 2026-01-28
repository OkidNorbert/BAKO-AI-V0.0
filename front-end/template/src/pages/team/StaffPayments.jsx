import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { showToast } from '../../components/shared/Toast';

const CoachPayments = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [coach, setCoach] = useState(null);
  const [payments, setPayments] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    date: '',
    sessionType: 'HALF_DAY',
    numberOfPlayers: 1,
    notes: ''
  });

  useEffect(() => {
    fetchCoachDetails();
    fetchPayments();
  }, [id]);

  const fetchCoachDetails = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/coachs/${id}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setCoach(response.data);
    } catch (error) {
      console.error('Error fetching coach details:', error);
      showToast(
        error.response?.data?.error || 'Failed to fetch coach details',
        'error'
      );
    }
  };

  const fetchPayments = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/coachs/${id}/payments`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setPayments(response.data);
    } catch (error) {
      console.error('Error fetching payments:', error);
      showToast(
        error.response?.data?.error || 'Failed to fetch payments',
        'error'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `http://localhost:5000/api/admin/coachs/${id}/payments`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      showToast('Payment created successfully', 'success');
      setShowForm(false);
      setFormData({
        date: '',
        sessionType: 'HALF_DAY',
        numberOfPlayers: 1,
        notes: ''
      });
      fetchPayments();
    } catch (error) {
      console.error('Error creating payment:', error);
      showToast(
        error.response?.data?.error || 'Failed to create payment',
        'error'
      );
    }
  };

  const updatePaymentStatus = async (paymentId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/coachs/payments/${paymentId}`,
        { status },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      showToast('Payment status updated successfully', 'success');
      fetchPayments();
    } catch (error) {
      console.error('Error updating payment status:', error);
      showToast(
        error.response?.data?.error || 'Failed to update payment status',
        'error'
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Coach Payments</h1>
          {coach && coach.user && (
            <p className="text-gray-600 mt-2">
              {`${coach.user.firstName} ${coach.user.lastName}`}
            </p>
          )}
          {coach && !coach.user && (
            <p className="text-gray-600 mt-2">
              {`${coach.firstName} ${coach.lastName}`}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : 'Create Payment'}
        </button>
      </div>

      {showForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Create New Payment</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Session Type</label>
                <select
                  name="sessionType"
                  value={formData.sessionType}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="HALF_DAY">Half Day (2,000K per player)</option>
                  <option value="FULL_DAY">Full Day (5,000K per player)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Number of Players</label>
                <input
                  type="number"
                  name="numberOfPlayers"
                  value={formData.numberOfPlayers}
                  onChange={handleChange}
                  min="1"
                  required
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Notes</label>
                <input
                  type="text"
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Create Payment
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Players
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payments.length === 0 && (
              <tr>
                <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                  No payment records found. Create a new payment.
                </td>
              </tr>
            )}
            {payments.map((payment) => (
              <tr key={payment._id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {new Date(payment.date).toLocaleDateString()}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.sessionType === 'half-day' ? 'Half Day' : 'Full Day'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.numberOfPlayers}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">
                    {payment.totalAmount?.toLocaleString()}K
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    payment.status === 'recorded'
                      ? 'bg-yellow-100 text-yellow-800'
                      : payment.status === 'verified'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {payment.status === 'recorded' ? 'Recorded' : 
                     payment.status === 'verified' ? 'Verified' : 
                     payment.status === 'pending' ? 'Pending' : payment.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  {payment.status === 'recorded' && (
                    <>
                      <button
                        onClick={() => updatePaymentStatus(payment._id, 'verified')}
                        className="text-green-600 hover:text-green-900 mr-4"
                      >
                        Verify
                      </button>
                      <button
                        onClick={() => updatePaymentStatus(payment._id, 'pending')}
                        className="text-red-600 hover:text-red-900"
                      >
                        Hold
                      </button>
                    </>
                  )}
                  {payment.status === 'pending' && (
                    <button
                      onClick={() => updatePaymentStatus(payment._id, 'verified')}
                      className="text-green-600 hover:text-green-900"
                    >
                      Verify
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CoachPayments;