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
import AdminLayout from '@/components/shared/Layout/AdminLayout'; // Will be renamed to TeamLayout eventually
import BabysitterLayout from '@/layouts/BabysitterLayout'; // Will be renamed to PlayerLayout eventually

// Public Pages
import Home from '@/pages/Home';
import Login from '@/pages/Login';
import Register from '@/pages/Register';

// Team / Organization Pages (formerly Admin)
import AdminHome from '@/pages/admin/AdminHome'; // TeamDashboard
import BabysitterManagement from '@/pages/admin/BabysitterManagement'; // TeamRoster
import ChildManagement from '@/pages/admin/ChildManagement'; // MatchAnalysis
import Analytics from '@/pages/admin/Analytics'; // TeamAnalytics
import SystemSettings from '@/pages/admin/SystemSettings'; // TeamSettings
import Schedule from '@/pages/admin/Schedule'; // TeamSchedule

// Personal Player Pages (formerly Babysitter)
import BabysitterHome from '@/pages/babysitter/BabysitterHome'; // PlayerDashboard
import BabysitterProfile from '@/pages/babysitter/BabysitterProfile'; // PlayerProfile
// import TrainingVideos from '@/pages/player/TrainingVideos'; // To be created
import BabysitterReports from '@/pages/babysitter/BabysitterReports'; // SkillAnalytics

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
                <Route index element={<AdminHome />} />
                <Route path="dashboard" element={<AdminHome />} />
                <Route path="roster" element={<BabysitterManagement />} />
                <Route path="matches" element={<ChildManagement />} />
                <Route path="schedule" element={<Schedule />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<SystemSettings />} />
              </Route>
            </Route>

            {/* Personal Player Routes */}
            <Route path="/player" element={<ProtectedRoute allowedRoles={['player']} />}>
              <Route element={<BabysitterLayout />}>
                <Route index element={<BabysitterHome />} />
                <Route path="dashboard" element={<BabysitterHome />} />
                <Route path="profile" element={<BabysitterProfile />} />
                <Route path="skills" element={<BabysitterReports />} />
                {/* <Route path="training" element={<TrainingVideos />} /> */}
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