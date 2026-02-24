import api from '../utils/axiosConfig';

// Re-export endpoints using the unified axios instance

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
  getStaff: () => api.get('/admin/staff'),
  getRoster: () => api.get('/admin/players'),
  createPlayer: (playerData) => api.post('/admin/players', playerData),
  updatePlayer: (playerId, playerData) => api.put(`/admin/players/${playerId}`, playerData),
  updatePlayerStatus: (playerId, status) => api.patch(`/admin/players/${playerId}/status`, { status }),
  deletePlayer: (playerId) => api.delete(`/admin/players/${playerId}`),
  linkPlayerAccount: (playerId, email) => api.post(`/admin/players/${playerId}/link`, { email }),
  linkStaffMember: (email, role) => api.post('/admin/staff/link', { email, role }),
  removeStaffMember: (userId) => api.delete(`/admin/staff/${userId}`),
  createScheduleEvent: (eventData) => api.post('/admin/schedule', eventData),
  updateScheduleEvent: (eventId, eventData) => api.put(`/admin/schedule/${eventId}`, eventData),
  deleteScheduleEvent: (eventId) => api.delete(`/admin/schedule/${eventId}`),

  // Match endpoints
  getMatches: () => api.get('/admin/matches'),
  getMatchById: (matchId) => api.get(`/admin/matches/${matchId}`),
  createMatch: (data) => api.post('/admin/matches', data),
  updateMatch: (matchId, data) => api.put(`/admin/matches/${matchId}`, data),
  deleteMatch: (matchId) => api.delete(`/admin/matches/${matchId}`),

  // Match Stats Import endpoints
  uploadMatchStats: (matchId, formData) =>
    api.post(`/admin/matches/${matchId}/stats-upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getStatUpload: (uploadId) => api.get(`/admin/stats-upload/${uploadId}`),
  confirmStatUpload: (uploadId, extractedJson) =>
    api.post(`/admin/stats-upload/${uploadId}/confirm`, { extracted_json: extractedJson }),
  retryStatUpload: (uploadId) => api.post(`/admin/stats-upload/${uploadId}/retry`),

  // Get player stats for a specific match
  getMatchPlayerStats: (matchId) => api.get(`/admin/matches/${matchId}/player-stats`),

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

// Advanced Analytics API
export const advancedAnalyticsAPI = {
  getClips: (videoId) => api.get(`/analytics/advanced/clips/${videoId}`),
  getTeamSummary: (videoId) => api.get(`/analytics/advanced/team-summary/${videoId}`),
  getPlayerAnalysis: (videoId, trackId) => api.get(`/analytics/advanced/player/${videoId}/${trackId}`),
  getLineups: (videoId) => api.get(`/analytics/advanced/lineups/${videoId}`),
};

export default api;