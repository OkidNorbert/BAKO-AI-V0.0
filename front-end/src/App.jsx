import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { NotificationProvider } from '@/context/NotificationContext';
import { ToastContainer } from 'react-toastify';
import { Toaster } from 'react-hot-toast';
import 'react-toastify/dist/ReactToastify.css';

import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/shared/Layout/Layout';
import AdminLayout from '@/components/shared/Layout/AdminLayout';
import PlayerLayout from '@/layouts/PlayerLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Team / Organization Pages
import TeamDashboard from '@/pages/admin/TeamDashboard';
import TeamRoster from '@/pages/admin/TeamRoster';
import MatchAnalysis from '@/pages/admin/MatchAnalysis';
import TeamAnalytics from '@/pages/admin/TeamAnalytics';
import TeamSettings from '@/pages/admin/TeamSettings';
import TeamSchedule from '@/pages/admin/TeamSchedule';

// Personal Player Pages
import PlayerDashboard from '@/pages/player/PlayerDashboard';
import PlayerProfile from '@/pages/player/PlayerProfile';
import SkillAnalytics from '@/pages/player/SkillAnalytics';
import TrainingVideos from '@/pages/player/TrainingVideos';

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
          <Toaster />
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="login" element={<Login />} />
              <Route path="register" element={<Register />} />
            </Route>

            {/* Team / Organization Routes */}
            <Route path="/team" element={<ProtectedRoute allowedRoles={['team']} />}>
              <Route element={<AdminLayout />}>
                <Route index element={<TeamDashboard />} />
                <Route path="dashboard" element={<TeamDashboard />} />
                <Route path="roster" element={<TeamRoster />} />
                <Route path="matches" element={<MatchAnalysis />} />
                <Route path="schedule" element={<TeamSchedule />} />
                <Route path="analytics" element={<TeamAnalytics />} />
                <Route path="settings" element={<TeamSettings />} />
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
              </Route>
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