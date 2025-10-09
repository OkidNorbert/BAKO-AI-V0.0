import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

declare module 'axios' {
  export interface AxiosRequestConfig {
    metadata?: { 
      requestId: string; 
      startTime: number 
    };
  }
}

interface CustomError extends Error {
  details?: any;
}

// Enhanced API configuration
const API_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

// Create axios instance with enhanced configuration
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000, // 30 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for adding auth token and request tracking
apiClient.interceptors.request.use(
  (config) => {
    // Add auth token if available
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request ID for tracking
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    config.headers['X-Request-ID'] = requestId;
    config.metadata = { requestId, startTime: Date.now() };

    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for enhanced error handling
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Log successful requests in development
    if (import.meta.env.DEV) {
      const requestId = response.config.metadata?.requestId;
      const duration = Date.now() - (response.config.metadata?.startTime || 0);
      console.log(`✅ API Success: ${response.config.method?.toUpperCase()} ${response.config.url} (${duration}ms)`, {
        requestId,
        status: response.status,
        data: response.data
      });
    }
    return response;
  },
  (error: AxiosError) => {
    const requestId = error.config?.metadata?.requestId;
    const duration = Date.now() - (error.config?.metadata?.startTime || 0);

    // Enhanced error logging
    console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url} (${duration}ms)`, {
      requestId,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      message: error.message
    });

    // Handle specific error types
    if (error.response) {
      if (error.response.status === 401) {
        // Token expired or invalid - redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(error);
      }
  
      if (error.response.status === 403) {
        // Forbidden - user doesn't have permission
        const silentError: CustomError = new Error('Access denied');
        silentError.name = 'AuthorizationError';
        return Promise.reject(silentError);
      }
  
      if (error.response.status === 404) {
        // Not found - resource doesn't exist
        const silentError: CustomError = new Error('Resource not found');
        silentError.name = 'NotFoundError';
        return Promise.reject(silentError);
      }
  
      if (error.response.status === 422) {
        // Validation error - show specific validation messages
        const validationError: CustomError = new Error('Validation failed');
        validationError.name = 'ValidationError';
        validationError.details = error.response.data;
        return Promise.reject(validationError);
      }
  
      if (error.response.status === 429) {
        // Rate limited
        const rateLimitError: CustomError = new Error('Too many requests. Please try again later.');
        rateLimitError.name = 'RateLimitError';
        return Promise.reject(rateLimitError);
      }
  
      if (error.response.status >= 500) {
        // Server error
        const serverError: CustomError = new Error('Server error. Please try again later.');
        serverError.name = 'ServerError';
        return Promise.reject(serverError);
      }
    }

    if (error.code === 'NETWORK_ERROR' || error.code === 'ECONNABORTED') {
      // Network error
      const networkError: CustomError = new Error('Network error. Please check your connection.');
      networkError.name = 'NetworkError';
      return Promise.reject(networkError);
    }

    // Return original error for other cases
    return Promise.reject(error);
  }
);

// Enhanced API service with better error handling
export const enhancedApi = {
  // Generic request methods with error handling
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Auth endpoints
  auth: {
    login: (credentials: { email: string; password: string }) =>
      enhancedApi.post('/api/v1/auth/login', credentials),
    
    signup: (userData: { email: string; password: string; role: string }) =>
      enhancedApi.post('/api/v1/auth/signup', userData),
    
    logout: () => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      return Promise.resolve();
    },
    
    getCurrentUser: () =>
      enhancedApi.get('/api/v1/auth/me'),
  },

  // Players endpoints
  players: {
    getPlayer: (playerId: number) =>
      enhancedApi.get(`/api/v1/players/${playerId}`),
    
    getTeamPlayers: () =>
      enhancedApi.get('/api/v1/team/players'),
    
    updatePlayer: (playerId: number, data: any) =>
      enhancedApi.put(`/api/v1/players/${playerId}`, data),
  },

  // Analytics endpoints
  analytics: {
    getTeamStats: () =>
      enhancedApi.get('/api/v1/team/analytics/stats'),
    
    getPlayerMetrics: (playerId: number, days: number = 30) =>
      enhancedApi.get(`/api/v1/analytics/performance/${playerId}?days=${days}`),
    
    getRecommendations: (playerId: number, days: number = 30) =>
      enhancedApi.get(`/api/v1/analytics/recommendations/${playerId}?days=${days}`),
  },

  // Videos endpoints
  videos: {
    uploadMetadata: (data: any) =>
      enhancedApi.post('/api/v1/videos/upload-metadata', data),
    
    confirmUpload: (videoId: number) =>
      enhancedApi.post(`/api/v1/videos/${videoId}/confirm-upload`),
    
    getAnalysis: (videoId: number) =>
      enhancedApi.get(`/api/v1/videos/${videoId}/analysis`),
  },

  // Events endpoints
  events: {
    createEvent: (data: any) =>
      enhancedApi.post('/api/v1/events', data),
    
    getPlayerEvents: (playerId: string) =>
      enhancedApi.get(`/api/v1/events/player/${playerId}`),
  },

  // Communication endpoints
  communication: {
    getAnnouncements: () =>
      enhancedApi.get('/api/v1/team/announcements'),
    
    createAnnouncement: (data: any) =>
      enhancedApi.post('/api/v1/team/announcements', data),
    
    getMessages: () =>
      enhancedApi.get('/api/v1/team/messages'),
    
    sendMessage: (data: any) =>
      enhancedApi.post('/api/v1/team/messages', data),
  },

  // Health check
  health: () =>
    enhancedApi.get('/health'),
};

export default enhancedApi;
