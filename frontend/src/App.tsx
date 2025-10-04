import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './components/Toast'
import { ModernHomepage } from './components/ModernHomepage'
import { EnhancedDashboard } from './components/EnhancedDashboard'
import { ModernAuthPage } from './components/ModernAuthPage'
import { PlayerProfile } from './components/PlayerProfile'
import { SessionView } from './components/SessionView'
import { Training } from './components/Training'
import { VideoUpload } from './components/VideoUpload'
import { WearableData } from './components/WearableData'
import { LiveStreaming } from './components/LiveStreaming'
import { ImprovedNavbar } from './components/ImprovedNavbar'
import { LoadingSpinner } from './components/LoadingSpinner'
import { FeaturesPage } from './components/pages/FeaturesPage'
import { PricingPage } from './components/pages/PricingPage'
import { AboutPage } from './components/pages/AboutPage'
import { ContactPage } from './components/pages/ContactPage'
import { SettingsPage } from './components/pages/SettingsPage'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />;
  }
  
  return user ? <>{children}</> : <Navigate to="/login" />;
}

function AppContent() {
  const { user } = useAuth();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      <ImprovedNavbar />
      <main className={`${user ? 'container mx-auto px-4 py-8' : ''}`}>
        <Routes>
          <Route path="/login" element={<ModernAuthPage />} />
          <Route path="/" element={<ModernHomepage />} />
          <Route path="/features" element={<FeaturesPage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <EnhancedDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/upload"
            element={
              <ProtectedRoute>
                <VideoUpload />
              </ProtectedRoute>
            }
          />
          <Route
            path="/players/:id"
            element={
              <ProtectedRoute>
                <PlayerProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions/:id"
            element={
              <ProtectedRoute>
                <SessionView />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training"
            element={
              <ProtectedRoute>
                <Training />
              </ProtectedRoute>
            }
          />
          <Route
            path="/wearables"
            element={
              <ProtectedRoute>
                <WearableData />
              </ProtectedRoute>
            }
          />
          <Route
            path="/live"
            element={
              <ProtectedRoute>
                <LiveStreaming />
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <AppContent />
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
