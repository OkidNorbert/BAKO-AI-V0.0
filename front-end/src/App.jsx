import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/shared/Layout/Layout';
import TeamLayout from '@/components/shared/Layout/TeamLayout';
import PlayerLayout from '@/layouts/PlayerLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

import About from '@/pages/About';
import Programs from '@/pages/Programs';
import Gallery from '@/pages/Gallery';
import Contact from '@/pages/Contact';
import FAQ from '@/pages/FAQ';
// Team / Organization Pages
import TeamDashboard from '@/pages/team/TeamDashboard';
import TeamRoster from '@/pages/team/TeamRoster';
import TeamCreateEdit from '@/pages/team/TeamCreateEdit';
import MatchAnalysis from '@/pages/team/MatchAnalysis';
import MatchUpload from '@/pages/team/MatchUpload';
import TeamAnalytics from '@/pages/team/TeamAnalytics';
import TeamSettings from '@/pages/team/TeamSettings';
import TeamSchedule from '@/pages/team/TeamSchedule';

// Personal Player Pages
import PlayerDashboard from '@/pages/player/PlayerDashboard';
import PlayerProfile from '@/pages/player/PlayerProfile';
import SkillAnalytics from '@/pages/player/SkillAnalytics';
import TrainingVideos from '@/pages/player/TrainingVideos';

// Shared Pages
import Profile from '@/pages/shared/Profile';
import Notifications from '@/pages/shared/Notifications';
import Help from '@/pages/shared/Help';
// Helper components for shared routes that need role-based layouts
const ProfileRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'team') return <Navigate to="/team/profile" replace />;
  if (user?.role === 'player') return <Navigate to="/player/profile" replace />;
  return <Navigate to="/login" replace />;
};

const NotificationsRedirect = () => {
  const { user } = useAuth();
  if (user?.role === 'team') return <Navigate to="/team/notifications" replace />;
  if (user?.role === 'player') return <Navigate to="/player/notifications" replace />;
  return <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
              <Route path="about" element={<About />} />
              <Route path="programs" element={<Programs />} />
              <Route path="gallery" element={<Gallery />} />
              <Route path="contact" element={<Contact />} />
              <Route path="faq" element={<FAQ />} />
            </Route>

            {/* Team / Organization Routes */}
            <Route path="/team" element={<ProtectedRoute allowedRoles={['team']} />}>
              <Route element={<TeamLayout />}>
                <Route index element={<TeamDashboard />} />
                <Route path="dashboard" element={<TeamDashboard />} />
                <Route path="roster" element={<TeamRoster />} />
                <Route path="roster/new" element={<TeamCreateEdit />} />
                <Route path="roster/edit/:teamId" element={<TeamCreateEdit />} />
                <Route path="matches" element={<MatchAnalysis />} />
                <Route path="matches/upload" element={<MatchUpload />} />
                <Route path="schedule" element={<TeamSchedule />} />
                <Route path="analytics" element={<TeamAnalytics />} />
                <Route path="reports" element={<TeamAnalytics />} />
                <Route path="settings" element={<TeamSettings />} />
                <Route path="profile" element={<Profile />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Route>

            {/* Personal Player Routes */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={['player']} />}>
              <Route element={<PlayerLayout />}>
                <Route index element={<PlayerDashboard />} />
                <Route path="dashboard" element={<PlayerDashboard />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="skills" element={<SkillAnalytics />} />
                <Route path="training" element={<TrainingVideos />} />
                <Route path="notifications" element={<Notifications />} />
              </Route>
            </Route>

            {/* Shared Routes Redirects */}
            <Route path="/profile" element={<ProtectedRoute allowedRoles={['team', 'player']} />}>
              <Route index element={<ProfileRedirect />} />
            </Route>

            <Route path="/notifications" element={<ProtectedRoute allowedRoles={['team', 'player']} />}>
              <Route index element={<NotificationsRedirect />} />
            </Route>

            <Route path="/help" element={<Layout />}>
              <Route index element={<Help />} />
            </Route>

            {/* Catch all route - Redirect to Login if unknown, or Home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;