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

// Video API
export const videoAPI = {
  upload: (formData) => api.post('/videos/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
  list: (params) => api.get('/videos', { params }),
  getById: (videoId) => api.get(`/videos/${videoId}`),
  getStatus: (videoId) => api.get(`/videos/${videoId}/status`),
  download: (videoId) => api.get(`/videos/${videoId}/download`, { responseType: 'blob' }),
  delete: (videoId) => api.delete(`/videos/${videoId}`),
};

// Analysis API
export const analysisAPI = {
  triggerTeamAnalysis: (videoId, options) => api.post('/analysis/team', { video_id: videoId, options }),
  triggerPersonalAnalysis: (videoId, options) => api.post('/analysis/personal', { video_id: videoId, options }),
  getResult: (analysisId) => api.get(`/analysis/${analysisId}`),
  getLastResultByVideo: (videoId) => api.get(`/analysis/by-video/${videoId}`),
  getDetections: (analysisId, params) => api.get(`/analysis/${analysisId}/detections`, { params }),
};

export default api;