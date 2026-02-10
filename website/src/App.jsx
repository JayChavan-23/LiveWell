import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Userdetails from './sections/onboarding/Userdetails';
import HealthInfo from './sections/onboarding/HealthInfo';
import FrailtyInfo from './sections/onboarding/FrailtyInfo';
import Dashboard from './sections/Dashboard/Dashboard';
import ChatBot from './sections/ChatBot/ChatBot';
import HealthDashboard from './sections/HealthDashboard/HealthDashboard';
import Goals from './sections/Goals/Goals';
import Profile from './sections/Profile/Profile';
import Home from './sections/Home/Home';
import LoginForm from './components/LoginForm';
import { OnboardingProvider } from './contexts/OnboardingContext';

import { AuthProvider, useAuth } from './auth/AuthProvider';
import ProtectedRoute from './auth/ProtectedRoute';

// Wrapper component to force remount when user changes
const AppRoutes = () => {
  const { user } = useAuth();
  const userKey = user?.uid || 'no-user';
  
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/user-details" element={<Userdetails />} />
        <Route path="/health-info" element={<HealthInfo />} />
        <Route path="/frailty-info" element={<FrailtyInfo />} />

        {/* Protected routes - Force remount when user changes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard key={`dashboard-${userKey}`} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatBot key={`chat-${userKey}`} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/health"
          element={
            <ProtectedRoute>
              <HealthDashboard key={`health-${userKey}`} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/goals"
          element={
            <ProtectedRoute>
              <Goals key={`goals-${userKey}`} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile key={`profile-${userKey}`} />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <AuthProvider>
        <OnboardingProvider>
          <AppRoutes />
        </OnboardingProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;
