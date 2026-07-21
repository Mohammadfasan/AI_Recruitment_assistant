import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';

// Pages imports
import Login from '../pages/Login';
import Register from '../pages/Register';
import ForgotPassword from '../pages/ForgotPassword';
import ResetPassword from '../pages/ResetPassword';
import Dashboard from '../pages/Dashboard';
import Jobs from '../pages/Jobs';
import Candidates from '../pages/Candidates';
import ResumeUpload from '../pages/ResumeUpload';
import AiMatching from '../pages/AIMatching';
import CandidateRankings from '../pages/CandidateRankings';
import InterviewGenerator from '../pages/InterviewGenerator';
import Analytics from '../pages/Analytics';
import Settings from '../pages/Settings';
import NotFound from '../pages/NotFound';

import Profile from '../pages/Profile';
import CompanyProfile from '../pages/CompanyProfile';
import AppliedJobs from '../pages/AppliedJobs';
import Interviews from '../pages/Interviews';
import NotificationCenter from '../pages/NotificationCenter';

// Layout
import DashboardLayout from '../components/layout/DashboardLayout';

// Guard: Require auth
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage={true} size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

// Guard: Require guest status
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage={true} size="lg" />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return children;
};

// Guard: Require specific user roles
const RoleRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner fullPage={true} size="lg" />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const AppRoutes = () => {
  return (
    <Routes>
      {/* Public routes (Auth) */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        }
      />
      <Route
        path="/forgot-password"
        element={
          <PublicRoute>
            <ForgotPassword />
          </PublicRoute>
        }
      />
      <Route
        path="/reset-password"
        element={
          <PublicRoute>
            <ResetPassword />
          </PublicRoute>
        }
      />

      {/* Protected dashboard shell */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="jobs" element={<Jobs />} />
        <Route
          path="candidates"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <Candidates />
            </RoleRoute>
          }
        />
        <Route
          path="upload"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <ResumeUpload />
            </RoleRoute>
          }
        />
        <Route
          path="ai-matching"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <AiMatching />
            </RoleRoute>
          }
        />
        <Route
          path="rankings"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <CandidateRankings />
            </RoleRoute>
          }
        />
        <Route
          path="interview"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <InterviewGenerator />
            </RoleRoute>
          }
        />
        <Route path="interviews" element={<Interviews />} />
        <Route
          path="profile"
          element={
            <RoleRoute allowedRoles={['Job Seeker']}>
              <Profile />
            </RoleRoute>
          }
        />
        <Route
          path="company-profile"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <CompanyProfile />
            </RoleRoute>
          }
        />
        <Route
          path="applications"
          element={
            <RoleRoute allowedRoles={['Job Seeker']}>
              <AppliedJobs />
            </RoleRoute>
          }
        />
        <Route path="notifications" element={<NotificationCenter />} />
        <Route
          path="analytics"
          element={
            <RoleRoute allowedRoles={['Recruiter', 'Admin']}>
              <Analytics />
            </RoleRoute>
          }
        />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback 404 page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;
