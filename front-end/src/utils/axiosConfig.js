import axios from 'axios';
import { toast } from 'react-hot-toast';
// Create axios instance with default config
const api = axios.create({
  baseURL: 'http://localhost:5000/api',  // Explicitly point to server port
  headers: {
    'Content-Type': 'application/json',
  },
});

// Track refresh attempts to prevent infinite loops
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;
let isRefreshing = false;
let failedQueue = [];

// Process queue of failed requests
const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Add request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    const isPublicEndpoint = config.url.includes('/public/');

    // Log all API requests for debugging
    console.log('API Request:', {
      url: config.url,
      method: config.method,
      baseURL: config.baseURL,
      hasToken: !!token,
      isPublicEndpoint
    });

    if (token) {
      // Log token details for debugging
      try {
        const tokenPayload = JSON.parse(atob(token.split('.')[1]));
        console.log('Request interceptor: Token payload:', {
          userId: tokenPayload.user?.id || tokenPayload.id,
          role: tokenPayload.user?.role || tokenPayload.role,
          exp: new Date(tokenPayload.exp * 1000).toISOString(),
          path: config.url
        });
      } catch (error) {
        console.warn('Request interceptor: Error parsing token:', error);
      }

      config.headers.Authorization = `Bearer ${token}`;
    } else if (!isPublicEndpoint) {
      console.warn('Request interceptor: No access token found in localStorage');
    }
    return config;
  },
  (error) => {
    console.error('Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't tried to refresh token yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('Response interceptor: Received 401 error, attempting to refresh token');

      if (isRefreshing) {
        console.log('Response interceptor: Token refresh already in progress, adding request to queue');
        // If refreshing, add request to queue
        try {
          const token = await new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          });
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        } catch (err) {
          return Promise.reject(err);
        }
      }

      // Check if we've exceeded max refresh attempts
      if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
        console.log('Response interceptor: Max refresh attempts exceeded, clearing auth data and redirecting to login');
        // Clear auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      originalRequest._retry = true;
      isRefreshing = true;
      refreshAttempts++;

      try {
        const refreshToken = localStorage.getItem('refreshToken');

        if (!refreshToken) {
          console.warn('Response interceptor: No refresh token available');
          throw new Error('No refresh token available');
        }

        console.log('Response interceptor: Attempting to refresh token');

        // Create a new axios instance for the refresh call to avoid interceptors loop
        const refreshResponse = await axios.post(
          'http://localhost:5000/api/auth/refresh-token',
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        if (refreshResponse.data && refreshResponse.data.accessToken) {
          const { accessToken } = refreshResponse.data;

          // Log new token details
          try {
            const tokenPayload = JSON.parse(atob(accessToken.split('.')[1]));
            console.log('Response interceptor: New token payload:', {
              userId: tokenPayload.user?.id || tokenPayload.id,
              role: tokenPayload.user?.role || tokenPayload.role,
              exp: new Date(tokenPayload.exp * 1000).toISOString()
            });
          } catch (error) {
            console.warn('Response interceptor: Error parsing new token:', error);
          }

          // Save new token
          localStorage.setItem('accessToken', accessToken);

          // Update authorization header
          api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;

          // Process any queued requests
          processQueue(null, accessToken);

          // Reset refresh attempts on successful refresh
          refreshAttempts = 0;

          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        console.error('Response interceptor: Token refresh failed:', refreshError);
        processQueue(refreshError, null);

        // Clear auth data and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    // Handle 403 errors
    if (error.response?.status === 403) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        try {
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          console.log('Response interceptor: Access forbidden. Current token payload:', {
            token: token.substring(0, 50) + '...',
            userRole: tokenPayload.user?.role || tokenPayload.role,
            userId: tokenPayload.user?.id || tokenPayload.id
          });
        } catch (error) {
          console.warn('Response interceptor: Error parsing token in 403 handler:', error);
        }
      }
    }

    // Handle errors generically
    const errorMessage = error.response?.data?.message || 'An error occurred. Please try again later.';

    // Suppress toasts if this is a developer bypass session
    if (localStorage.getItem('isDevSession') !== 'true') {
      toast.error(errorMessage);
    } else {
      console.log('Suppressing error toast in dev session:', errorMessage);
    }
    return Promise.reject(error);
  }
);

export default api; 