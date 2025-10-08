import { useCallback } from 'react';
import { useToast } from '../components/Toast';

export interface ErrorDetails {
  code?: string;
  message: string;
  details?: any;
  timestamp?: string;
  requestId?: string;
}

export interface ErrorHandlerOptions {
  showToast?: boolean;
  logError?: boolean;
  fallbackMessage?: string;
  onError?: (error: ErrorDetails) => void;
}

export const useErrorHandler = () => {
  const { showToast } = useToast();

  const handleError = useCallback((
    error: any,
    options: ErrorHandlerOptions = {}
  ) => {
    const {
      showToast: shouldShowToast = true,
      logError = true,
      fallbackMessage = 'An unexpected error occurred',
      onError
    } = options;

    // Extract error details
    let errorDetails: ErrorDetails;

    if (error?.response?.data?.error) {
      // Backend error response
      const backendError = error.response.data.error;
      errorDetails = {
        code: backendError.code,
        message: backendError.message,
        details: backendError.details,
        timestamp: backendError.timestamp,
        requestId: backendError.request_id
      };
    } else if (error?.response?.data) {
      // Generic API error
      errorDetails = {
        code: error.response.status?.toString(),
        message: error.response.data.message || error.response.data.detail || fallbackMessage,
        details: error.response.data
      };
    } else if (error?.message) {
      // JavaScript error
      errorDetails = {
        message: error.message,
        details: error.stack
      };
    } else {
      // Unknown error
      errorDetails = {
        message: fallbackMessage,
        details: error
      };
    }

    // Log error if requested
    if (logError) {
      console.error('Error handled:', {
        ...errorDetails,
        originalError: error,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      });
    }

    // Show toast if requested
    if (shouldShowToast) {
      const toastMessage = errorDetails.message || fallbackMessage;
      const toastType = getErrorToastType(errorDetails.code);
      showToast(toastMessage, toastType);
    }

    // Call custom error handler
    if (onError) {
      onError(errorDetails);
    }

    return errorDetails;
  }, [showToast]);

  const handleApiError = useCallback((
    error: any,
    context: string = 'API call',
    options: ErrorHandlerOptions = {}
  ) => {
    const enhancedOptions = {
      ...options,
      fallbackMessage: `${context} failed. Please try again.`,
      onError: (errorDetails: ErrorDetails) => {
        // Log API-specific error
        console.error(`API Error in ${context}:`, errorDetails);
        options.onError?.(errorDetails);
      }
    };

    return handleError(error, enhancedOptions);
  }, [handleError]);

  const handleSilentError = useCallback((
    error: any,
    fallbackData: any = null
  ) => {
    // Handle errors silently (no toast, minimal logging)
    const errorDetails = handleError(error, {
      showToast: false,
      logError: false,
      fallbackMessage: 'Silent error'
    });

    return { error: errorDetails, data: fallbackData };
  }, [handleError]);

  return {
    handleError,
    handleApiError,
    handleSilentError
  };
};

function getErrorToastType(errorCode?: string): 'error' | 'warning' | 'info' {
  if (!errorCode) return 'error';
  
  const code = parseInt(errorCode);
  
  if (code >= 500) return 'error';
  if (code >= 400) return 'warning';
  return 'info';
}

export default useErrorHandler;
