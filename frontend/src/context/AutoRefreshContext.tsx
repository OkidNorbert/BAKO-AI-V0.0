import React, { createContext, useContext, useState, useEffect } from 'react';

interface AutoRefreshSettings {
  enabled: boolean;
  interval: number; // in milliseconds
  respectUserActivity: boolean;
  respectVisibility: boolean;
  showIndicator: boolean;
}

interface AutoRefreshContextType {
  settings: AutoRefreshSettings;
  updateSettings: (newSettings: Partial<AutoRefreshSettings>) => void;
  globalPause: boolean;
  setGlobalPause: (pause: boolean) => void;
}

const defaultSettings: AutoRefreshSettings = {
  enabled: true,
  interval: 60000, // 1 minute
  respectUserActivity: true,
  respectVisibility: true,
  showIndicator: true,
};

const AutoRefreshContext = createContext<AutoRefreshContextType | undefined>(undefined);

export const useAutoRefreshSettings = () => {
  const context = useContext(AutoRefreshContext);
  if (!context) {
    throw new Error('useAutoRefreshSettings must be used within an AutoRefreshProvider');
  }
  return context;
};

interface AutoRefreshProviderProps {
  children: React.ReactNode;
}

export const AutoRefreshProvider: React.FC<AutoRefreshProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AutoRefreshSettings>(() => {
    // Load from localStorage if available
    const saved = localStorage.getItem('autoRefreshSettings');
    if (saved) {
      try {
        return { ...defaultSettings, ...JSON.parse(saved) };
      } catch {
        return defaultSettings;
      }
    }
    return defaultSettings;
  });

  const [globalPause, setGlobalPause] = useState(false);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('autoRefreshSettings', JSON.stringify(settings));
  }, [settings]);

  const updateSettings = (newSettings: Partial<AutoRefreshSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  };

  // Pause auto-refresh when user is away for too long
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const resetTimeout = () => {
      clearTimeout(timeoutId);
      setGlobalPause(false);
      timeoutId = setTimeout(() => {
        setGlobalPause(true);
      }, 300000); // 5 minutes of inactivity
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, { passive: true });
    });

    resetTimeout();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout);
      });
    };
  }, []);

  return (
    <AutoRefreshContext.Provider
      value={{
        settings,
        updateSettings,
        globalPause,
        setGlobalPause,
      }}
    >
      {children}
    </AutoRefreshContext.Provider>
  );
};
