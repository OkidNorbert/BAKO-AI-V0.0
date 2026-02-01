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
import TeamLayout from '@/components/shared/Layout/TeamLayout';
import PlayerLayout from '@/layouts/PlayerLayout';

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Gallery from '@/pages/Gallery';
import AccountTypeSelection from '@/pages/AccountTypeSelection';

// Team Pages
// Team Pages
import TeamHome from '@/pages/team/TeamHome';
import UserManagement from '@/pages/team/Management/UserManagement';
import PlayerManagement from '@/pages/team/Players/PlayerManagement';
import ContactManagement from '@/pages/team/Communications/ContactManagement';
import Schedule from '@/pages/team/Players/Schedule';
import Reports from '@/pages/team/Analysis/Reports';
import SystemSettings from '@/pages/team/Management/SystemSettings';
import Notifications from '@/pages/team/Communications/Notifications';
import Analytics from '@/pages/team/Analysis/Analytics';
import CoachRegistration from '@/pages/team/Coaches/CoachRegistration';
import PlayerRegistration from '@/pages/team/Players/PlayerRegistration';
import Attendance from '@/pages/team/Players/Attendance';
import Communications from '@/pages/team/Communications/Communications';
import Security from '@/pages/team/Management/Security';
import TeamProfile from '@/pages/team/Management/TeamProfile';
import DataManagement from '@/pages/team/Management/DataManagement';
import CoachManagement from '@/pages/team/Coaches/CoachManagement';
import CoachSchedule from '@/pages/team/Coaches/CoachSchedule';
import CoachUpdate from '@/pages/team/Coaches/CoachUpdate';
import IncidentManagement from '@/pages/team/Communications/IncidentManagement';
import MatchAnalysis from '@/pages/team/Analysis/MatchAnalysis';

// Player Pages
import PlayerHome from '@/pages/player/PlayerHome';
import PlayerProfile from '@/pages/player/PlayerProfile';
import MySchedule from '@/pages/player/MySchedule';
import PlayerNotifications from '@/pages/player/PlayerNotifications';
import SkillAnalytics from '@/pages/player/SkillAnalytics';
import TrainingAnalysis from '@/pages/player/TrainingAnalysis';

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
              <Route path="gallery" element={<Gallery />} />
              <Route path="select-account" element={<AccountTypeSelection />} />
            </Route>

            {/* Team Routes (formerly Admin) */}
            <Route path="/team" element={<ProtectedRoute allowedRoles={['admin']} />}>
              <Route element={<TeamLayout />}>
                <Route index element={<TeamHome />} />
                <Route path="dashboard" element={<TeamHome />} />
                <Route path="users" element={<UserManagement />} />
                <Route path="players" element={<PlayerManagement />} />
                <Route path="management" element={<PlayerManagement />} />
                <Route path="analysis" element={<MatchAnalysis />} />
                <Route path="stats" element={<Analytics />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="reports" element={<Reports />} />
                <Route path="settings" element={<SystemSettings />} />
                <Route path="system-settings" element={<SystemSettings />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="coach-registration" element={<CoachRegistration />} />
                <Route path="attendance" element={<Attendance />} />
                <Route path="security" element={<Security />} />
                <Route path="communications" element={<Communications />} />
                <Route path="profile" element={<TeamProfile />} />
                <Route path="data" element={<DataManagement />} />
                <Route path="coaches" element={<CoachManagement />} />
                <Route path="coaches/:id/edit" element={<CoachUpdate />} />
                <Route path="coaches/:id/schedule" element={<CoachSchedule />} />
                <Route path="incidents" element={<IncidentManagement />} />
              </Route>
            </Route>

            {/* Player Routes (formerly Coach) */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={['coach']} />}>
              <Route element={<PlayerLayout />}>
                <Route index element={<PlayerHome />} />
                <Route path="dashboard" element={<PlayerHome />} />
                <Route path="training" element={<TrainingAnalysis />} />
                <Route path="skills" element={<SkillAnalytics />} />
                <Route path="profile" element={<PlayerProfile />} />
                <Route path="notifications" element={<PlayerNotifications />} />
                <Route path="schedule" element={<MySchedule />} />
              </Route>
            </Route>

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 