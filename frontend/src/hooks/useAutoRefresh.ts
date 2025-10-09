import { useEffect, useRef, useState } from 'react';

interface AutoRefreshOptions {
  interval?: number; // milliseconds
  enabled?: boolean;
  onRefresh?: () => Promise<void>;
  onError?: (error: any) => void;
  maxRetries?: number;
  retryDelay?: number;
  respectUserActivity?: boolean; // pause when user is active
  respectVisibility?: boolean; // pause when tab is not visible
}

export const useAutoRefresh = (options: AutoRefreshOptions = {}) => {
  const {
    interval = 30000, // 30 seconds default
    enabled = true,
    onRefresh,
    onError,
    maxRetries = 3,
    retryDelay = 5000,
    respectUserActivity = true,
    respectVisibility = true,
  } = options;

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastActivityRef = useRef<number>(Date.now());
  const isVisibleRef = useRef<boolean>(true);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Track user activity
  useEffect(() => {
    if (!respectUserActivity) return;

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
    };
  }, [respectUserActivity]);

  // Track visibility
  useEffect(() => {
    if (!respectVisibility) return;

    const handleVisibilityChange = () => {
      isVisibleRef.current = !document.hidden;
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [respectVisibility]);

  // Check if we should refresh
  const shouldRefresh = () => {
    if (!enabled || isRefreshing || isPaused) return false;
    
    // Don't refresh if user was recently active
    if (respectUserActivity && Date.now() - lastActivityRef.current < 10000) {
      return false;
    }
    
    // Don't refresh if tab is not visible
    if (respectVisibility && !isVisibleRef.current) {
      return false;
    }
    
    return true;
  };

  // Perform refresh
  const performRefresh = async () => {
    if (!shouldRefresh() || !onRefresh) return;

    try {
      setIsRefreshing(true);
      await onRefresh();
      setLastRefresh(new Date());
      setRetryCount(0);
    } catch (error) {
      console.warn('Auto-refresh failed:', error);
      onError?.(error);
      
      // Retry logic
      if (retryCount < maxRetries) {
        setRetryCount(prev => prev + 1);
        retryTimeoutRef.current = setTimeout(() => {
          performRefresh();
        }, retryDelay);
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  // Setup interval
  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      if (shouldRefresh()) {
        performRefresh();
      }
    }, interval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, isPaused]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Manual refresh
  const refresh = async () => {
    await performRefresh();
  };

  // Pause/resume
  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  return {
    isRefreshing,
    lastRefresh,
    retryCount,
    isPaused,
    refresh,
    pause,
    resume,
    setLastRefresh, // Export setLastRefresh
  };
};
