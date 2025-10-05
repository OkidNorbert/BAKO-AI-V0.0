import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const AI_SERVICE_URL = import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8001';

// Configure axios defaults
axios.defaults.baseURL = API_URL;

// Add auth token to requests
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Suppress console logging for 503 errors globally
const originalConsoleError = console.error;
console.error = (...args) => {
  // Check if the error is a 503 Service Unavailable
  const errorMessage = args[0];
  if (typeof errorMessage === 'string' && errorMessage.includes('503 (Service Unavailable)')) {
    // Don't log 503 errors to console
    return;
  }
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

// Handle auth errors and service unavailable errors
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    // Don't log 503 errors to console - they're expected when services are unavailable
    if (error.response?.status === 503) {
      // Return a custom error that won't be logged by the browser
      const silentError = new Error('Service unavailable');
      silentError.name = 'SilentError';
      return Promise.reject(silentError);
    }
    return Promise.reject(error);
  }
);

// API Service
export const api = {
  // Auth
  auth: {
    login: (email: string, password: string) =>
      axios.post('/api/v1/auth/login', { email, password }),
    signup: (email: string, password: string, role: string) =>
      axios.post('/api/v1/auth/signup', { email, password, role }),
    me: () => axios.get('/api/v1/auth/me'),
  },

  // Players
  players: {
    get: (playerId: number) => axios.get(`/api/v1/players/${playerId}`),
    getStats: (playerId: number, days: number = 30) =>
      axios.get(`/api/v1/analytics/performance/${playerId}?days=${days}`),
    getTeamPlayers: () => axios.get('/api/v1/players/team'),
  },

  // Sessions
  sessions: {
    getPlayerSessions: (playerId: number) => 
      axios.get(`/api/v1/events/player/${playerId}`),
    getSessionDetails: (sessionId: number) =>
      axios.get(`/api/v1/events/session/${sessionId}`),
    getTeamSessions: () =>
      axios.get('/api/v1/events/team/sessions'),
  },

  // Videos
  videos: {
    getUploadMetadata: (sessionId: number, filename: string, size: number) =>
      axios.post('/api/v1/videos/upload-metadata', { session_id: sessionId, filename, size }),
    confirmUpload: (videoId: number) =>
      axios.post(`/api/v1/videos/${videoId}/confirm-upload`),
    getStatus: (videoId: number) =>
      axios.get(`/api/v1/videos/${videoId}/status`),
    getDownloadUrl: (videoId: number) =>
      axios.get(`/api/v1/videos/${videoId}/download-url`),
  },

  // Analytics
  analytics: {
    getPerformance: (playerId: number, days: number = 30) =>
      axios.get(`/api/v1/analytics/performance/${playerId}?days=${days}`),
    getRecommendations: (playerId: number, days: number = 30) =>
      axios.get(`/api/v1/analytics/recommendations/${playerId}?days=${days}`),
    analyzeWeaknesses: (playerId: number, days: number = 30) =>
      axios.post('/api/v1/analytics/analyze', { player_id: playerId, days }),
    compareWithBenchmarks: (playerId: number) =>
      axios.get(`/api/v1/analytics/comparison/${playerId}`),
    getTeamStats: () =>
      axios.get('/api/v1/analytics/team/stats'),
  },

  // Wearables
  wearables: {
    getDevices: () => axios.get('/api/v1/wearables/devices'),
    createDevice: (deviceType: string, deviceName: string, deviceIdentifier: string) =>
      axios.post('/api/v1/wearables/devices', { device_type: deviceType, device_name: deviceName, device_identifier: deviceIdentifier }),
    syncHealthKit: (playerId: number, samples: any[]) =>
      axios.post('/api/v1/wearables/healthkit/sync', { player_id: playerId, samples }),
    syncBLE: (playerId: number, deviceIdentifier: string, heartRate: number, timestamp: string) =>
      axios.post('/api/v1/wearables/ble/sync', { player_id: playerId, device_identifier: deviceIdentifier, heart_rate: heartRate, timestamp }),
    getMetrics: (playerId: number, startDate?: string, endDate?: string) =>
      axios.get(`/api/v1/wearables/metrics/${playerId}`, { params: { start_date: startDate, end_date: endDate } }),
  },

  // Events
  events: {
    create: (playerId: string, sessionId: number, timestamp: number, type: string, meta: any) =>
      axios.post('/api/v1/events/', { player_id: playerId, session_id: sessionId, timestamp, type, meta }),
    getPlayerEvents: (playerId: string) =>
      axios.get(`/api/v1/events/player/${playerId}`),
  },

  // Streaming
  streaming: {
    sendLiveEvent: (eventData: any) =>
      axios.post('/api/v1/streaming/live/event', eventData),
    sendWearableData: (wearableData: any) =>
      axios.post('/api/v1/streaming/live/wearable', wearableData),
    getSessionSummary: (playerId: string) =>
      axios.get(`/api/v1/streaming/live/session/${playerId}`),
  },

  // Feedback
  feedback: {
    create: (feedbackData: any) =>
      axios.post('/api/v1/feedback/feedback', feedbackData),
    getAll: (limit: number = 10, offset: number = 0) =>
      axios.get('/api/v1/feedback/feedback', { params: { limit, offset } }),
    submitSurvey: (surveyId: string, responses: any) =>
      axios.post('/api/v1/feedback/survey', responses, { params: { survey_id: surveyId } }),
    getUsageSummary: (days: number = 30) =>
      axios.get('/api/v1/feedback/analytics/summary', { params: { days } }),
  },

  // Training (AI Service) - Use backend as proxy to avoid CORS issues
  training: {
    triggerTraining: (trainingType: string = 'incremental') =>
      axios.post('/api/v1/training/train/manual', null, { params: { training_type: trainingType } }),
    getStatus: () =>
      axios.get('/api/v1/training/status'),
    getModelsStatus: () =>
      axios.get('/api/v1/training/models/status'),
    getMetrics: () =>
      axios.get('/api/v1/training/metrics'),
    getRecommendations: (playerId: number, days: number = 30) =>
      axios.get(`/api/v1/training/recommendations/${playerId}?days=${days}`),
    getTrainingProgress: (playerId: number) =>
      axios.get(`/api/v1/training/progress/${playerId}`),
    getTeamPlans: () =>
      axios.get('/api/v1/training/team/plans'),
  },
};

export default api;
