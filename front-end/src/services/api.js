import axios from 'axios';
import { showToast } from '../components/shared/Toast';

// Create axios instance with default config
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle errors and token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get the refresh token from localStorage
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          // No refresh token available, redirect to login
          handleLogout('Your session has expired. Please log in again.');
          return Promise.reject(error);
        }

        // Try to refresh the token directly
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL || '/api'}/auth/refresh-token`,
          { refreshToken }
        );

        if (response.data && response.data.accessToken) {
          const newToken = response.data.accessToken;
          // Save the new token
          localStorage.setItem('accessToken', newToken);
          // Update the authorization header
          originalRequest.headers.Authorization = `Bearer ${newToken}`;

          // Retry the original request
          return api(originalRequest);
        } else {
          // If refresh failed, redirect to login
          handleLogout('Your session has expired. Please log in again.');
          return Promise.reject(error);
        }
      } catch (refreshError) {
        // If refresh failed, redirect to login
        handleLogout('An error occurred while refreshing your session. Please log in again.');
        return Promise.reject(refreshError);
      }
    }

    // Handle different types of errors
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const { status, data } = error.response;

      // Handle specific error cases
      switch (status) {
        case 401:
          // Unauthorized - clear token and redirect to login
          handleLogout('Your session has expired. Please log in again.');
          break;
        case 403:
          showToast('You do not have permission to perform this action.', 'error');
          break;
        case 404:
          showToast('The requested resource was not found.', 'error');
          break;
        case 500:
          showToast('Server error. Please try again later.', 'error');
          break;
        default:
          // Show the error message from the server if available
          const errorMessage = data.message || 'An error occurred. Please try again.';
          showToast(errorMessage, 'error');
      }
    } else if (error.request) {
      // The request was made but no response was received
      showToast('Network error. Please check your connection.', 'error');
    } else {
      // Something happened in setting up the request that triggered an Error
      showToast('An unexpected error occurred.', 'error');
    }

    return Promise.reject(error);
  }
);

// Helper function for handling logout
function handleLogout(message) {
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userName');
  localStorage.removeItem('userId');
  showToast(message, 'error');
  window.location.href = '/login';
}

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken }),
};

// Incident API
export const incidentAPI = {
  getAllIncidents: () => api.get('/incidents'),
  getIncidentById: (id) => api.get(`/incidents/${id}`),
  createIncident: (data) => api.post('/incidents', data),
  updateIncident: (id, data) => api.put(`/incidents/${id}`, data),
  deleteIncident: (id) => api.delete(`/incidents/${id}`),
  getIncidentStats: () => api.get('/incidents/stats'),
};

// Admin API
export const adminAPI = {
  getUsers: () => api.get('/admin/users'),
  updateUserRole: (userId, role) => api.put(`/admin/users/${userId}/role`, { role }),
  getStats: () => api.get('/admin/stats'),

  // Schedule endpoints
  getSchedule: () => api.get('/admin/schedule'),
  getPlayers: () => api.get('/admin/users?role=player'),
  getRoster: async () => {
    return api.get('/admin/players');
  },
  updatePlayerStatus: (playerId, status) => api.patch(`/admin/players/${playerId}/status`, { status }),
  createScheduleEvent: (eventData) => api.post('/admin/schedule', eventData),
  updateScheduleEvent: (eventId, eventData) => api.put(`/admin/schedule/${eventId}`, eventData),
  deleteScheduleEvent: (eventId) => api.delete(`/admin/schedule/${eventId}`),

  // Match endpoints
  getMatches: () => api.get('/admin/matches'),
  getMatchById: (matchId) => api.get(`/admin/matches/${matchId}`),
  updateMatch: (matchId, data) => api.put(`/admin/matches/${matchId}`, data),
  deleteMatch: (matchId) => api.delete(`/admin/matches/${matchId}`),

  // Attendance endpoints
  getAttendance: (date) => {
    const formattedDate = encodeURIComponent(date);
    console.log(`Making request to /admin/attendance with date=${formattedDate}`);
    return api.get(`/admin/attendance?date=${formattedDate}`);
  },
  addAttendanceRecord: (record) => api.post('/admin/attendance', record),
  updateAttendanceStatus: (id, status) => api.patch(`/admin/attendance/${id}/status`, { status }),
  deleteAttendanceRecord: (id) => api.delete(`/admin/attendance/${id}`),
  getAttendanceReport: (date) => {
    const formattedDate = encodeURIComponent(date);
    console.log(`Making request to /admin/attendance/report with date=${formattedDate}`);
    return api.get(`/admin/attendance/report?date=${formattedDate}`, { responseType: 'blob' });
  },

  // Payment endpoints
  getPayments: async () => {
    return api.get('/admin/payments');
  },
  processPayment: (paymentData) => api.post('/admin/payments', paymentData),
  updatePaymentStatus: (paymentId, status) => api.patch(`/admin/payments/${paymentId}/status`, { status }),
  getPaymentReceipt: (paymentId) => api.get(`/admin/payments/${paymentId}/receipt`, { responseType: 'blob' }),
  markPlayerAsPaid: (playerId, paymentData) => api.post(`/admin/payments/player/${playerId}/paid`, paymentData),
  // Player payment endpoints
  getPlayerPayments: (playerId) => api.get(`/payments/player/${playerId}/history`),
  recordPlayerPayment: (paymentData) => api.post(`/payments/player`, paymentData),
  getPaymentStats: () => api.get('/payments/stats'),
  sendPaymentReminder: (parentId) => api.post(`/payments/parent/${parentId}/reminder`),
  getOverduePayments: async () => {
    return api.get('/admin/payments/overdue');
  },
  deletePayment: (paymentId) => api.delete(`/admin/payments/${paymentId}`),
  updatePayment: (paymentId, paymentData) => api.put(`/admin/payments/${paymentId}`, paymentData),

  // Security endpoints
  getSecuritySettings: () => api.get('/admin/security/settings'),
  updateSecuritySettings: (settings) => api.put('/admin/security/settings', settings),
  getSecurityLogs: (params) => api.get('/admin/security/logs', { params }),

  // Profile endpoints
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (profileData) => api.put('/admin/profile', profileData),

  // Notification endpoints
  getNotifications: () => api.get('/admin/notifications'),
  createNotification: (notificationData) => api.post('/admin/notifications', notificationData),
  updateNotification: (notificationId, notificationData) => api.put(`/admin/notifications/${notificationId}`, notificationData),
  deleteNotification: (notificationId) => api.delete(`/admin/notifications/${notificationId}`),
  markNotificationAsRead: (notificationId) => api.put(`/admin/notifications/${notificationId}/mark-as-read`),

  // Communications endpoints
  getCommunications: () => api.get('/admin/communications'),
  createCommunication: (communicationData) => api.post('/admin/communications', communicationData),
  deleteCommunication: (communicationId) => api.delete(`/admin/communications/${communicationId}`),

  // Reports
  getReports: () => api.get('/admin/reports'),
  generateReport: (reportType, params) => api.post('/admin/reports', { type: reportType, ...params }),

  // Budget Management
  getBudgets: () => api.get('/admin/budgets'),
  getBudgetById: (id) => api.get(`/admin/budgets/${id}`),
  createBudget: (budgetData) => api.post('/admin/budgets', budgetData),
  updateBudget: (id, budgetData) => api.put(`/admin/budgets/${id}`, budgetData),
  deleteBudget: (id) => api.delete(`/admin/budgets/${id}`),
};

// Player API
export const playerAPI = {
  // Player endpoints
  getPlayers: () => api.get('/player/players'),
  getPlayerById: (playerId) => api.get(`/player/players/${playerId}`),
  addActivity: (playerId, activityData) => api.post(`/player/players/${playerId}/activities`, activityData),
  getPlayerActivities: (playerId) => api.get(`/player/players/${playerId}/activities`),

  // Schedule endpoints
  getSchedule: () => api.get('/player/schedule'),

  // Training endpoints
  recordTraining: (trainingData) => api.post('/player/training', trainingData),
  getTraining: (date) => {
    const formattedDate = encodeURIComponent(date);
    console.log(`Making request to /player/training with date=${formattedDate}`);
    return api.get(`/player/training?date=${formattedDate}`);
  },

  // Profile endpoints
  getProfile: () => api.get('/player/profile'),
  updateProfile: (profileData) => api.put('/player/profile', profileData),

  // Notification endpoints
  getNotifications: () => api.get('/player/notifications'),
  markNotificationAsRead: (notificationId) => api.put(`/player/notifications/${notificationId}/read`),
  markAllNotificationsAsRead: () => api.put(`/player/notifications/read-all`),
  deleteNotification: (notificationId) => api.delete(`/player/notifications/${notificationId}`),
};

export default api;