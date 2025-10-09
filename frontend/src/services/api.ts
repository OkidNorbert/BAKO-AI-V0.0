import axios from 'axios';

// Auto-detect backend URL based on current host
const getBackendUrl = () => {
  // If environment variable is set, use it
  if ((import.meta as any).env?.VITE_BACKEND_URL) {
    return (import.meta as any).env.VITE_BACKEND_URL;
  }
  
  // Auto-detect based on current host
  const currentHost = window.location.hostname;
  
  // If accessing via localhost, use localhost for backend
  if (currentHost === 'localhost' || currentHost === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // If accessing via network IP, use the same IP for backend
  return `http://${currentHost}:8000`;
};

const API_URL = getBackendUrl();

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

// Suppress console logging for 503 errors and SilentError globally
const originalConsoleError = console.error;
const originalConsoleLog = console.log;
const originalConsoleWarn = console.warn;

// Override console methods to filter out service unavailable errors
const filterServiceErrors = (...args: any[]) => {
  const errorMessage = args[0];
  if (typeof errorMessage === 'string') {
    // Check for various patterns of service unavailable errors
    if (errorMessage.includes('503 (Service Unavailable)') ||
        errorMessage.includes('SilentError: Service unavailable') ||
        errorMessage.includes('Service unavailable') ||
        errorMessage.includes('503') && errorMessage.includes('Service Unavailable')) {
      // Don't log service unavailable errors
      return;
    }
  }
  // Log all other errors normally
  originalConsoleError.apply(console, args);
};

console.error = filterServiceErrors;
console.log = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('503')) {
    return; // Don't log 503 errors
  }
  originalConsoleLog.apply(console, args);
};
console.warn = (...args: any[]) => {
  const message = args[0];
  if (typeof message === 'string' && message.includes('503')) {
    return; // Don't log 503 errors
  }
  originalConsoleWarn.apply(console, args);
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
    getTeamPlayers: () => axios.get('/api/v1/team/players/'),
    getTeamPlayer: (playerId: number) => axios.get(`/api/v1/team/players/team/${playerId}`),
    updateTeamPlayer: (playerId: number, data: any) => axios.put(`/api/v1/team/players/team/${playerId}`, data),
    addTeamPlayer: (data: any) => axios.post('/api/v1/team/players/team', data),
    removeTeamPlayer: (playerId: number) => axios.delete(`/api/v1/team/players/team/${playerId}`),
  },

  // Sessions
  sessions: {
    getPlayerSessions: (playerId: number) => 
      axios.get(`/api/v1/events/player/${playerId}`),
    getSessionDetails: (sessionId: number) =>
      axios.get(`/api/v1/events/session/${sessionId}`),
    getTeamSessions: () =>
      axios.get('/api/v1/team/sessions/sessions'),
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
    getAnalysisResult: (videoId: number) =>
      axios.get(`/api/v1/videos/${videoId}/analysis-result`),
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
      axios.get('/api/v1/team/analytics/stats'),
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
    getHeartRateData: (playerId: number) =>
      axios.get(`/api/v1/wearables/heart-rate/${playerId}`),
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
      axios.get('/api/v1/team/training/plans'),
  },

  // Team Communication
  communication: {
    getAnnouncements: () => axios.get('/api/v1/team/announcements'),
    createAnnouncement: (data: any) => axios.post('/api/v1/team/announcements', data),
    getMessages: () => axios.get('/api/v1/team/messages'),
    sendMessage: (data: any) => axios.post('/api/v1/team/messages', data),
  },

  // Team Schedule
  schedule: {
    getEvents: () => axios.get('/api/v1/team/events'),
    createEvent: (data: any) => axios.post('/api/v1/team/events', data),
    updateEvent: (eventId: number, data: any) => axios.put(`/api/v1/team/events/${eventId}`, data),
    deleteEvent: (eventId: number) => axios.delete(`/api/v1/team/events/${eventId}`),
  },
};

export default api;
