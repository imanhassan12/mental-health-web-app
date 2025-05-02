// client/src/AppRouter.js

import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import ClientForm from './pages/ClientForm';
import SessionNotesPage from './pages/SessionNotesPage';
import ResourcesPage from './pages/ResourcesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import ClientDetailPage from './pages/ClientDetailPage';
import MoodAnalyticsPage from './pages/MoodAnalyticsPage';
import ProtectedRoute from './components/ProtectedRoute';
import AuthService from './services/auth.service';
import TasksPage from './pages/TasksPage';
import RemindersPage from './pages/RemindersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import MessagingPage from './pages/MessagingPage';
import TestPage from './pages/TestPage';

console.log('AppRouter mounted');

const AppRouter = ({ setCurrentUser }) => {
  const [isReady, setIsReady] = useState(false);

  // Verify auth token on initial load
  useEffect(() => {
    const checkAuth = async () => {
      try {
        if (AuthService.isAuthenticated()) {
          await AuthService.checkToken();
        }
      } catch (error) {
        console.error('Auth token validation failed:', error);
        // Token is invalid, logout
        AuthService.logout();
      } finally {
        setIsReady(true);
      }
    };

    checkAuth();
  }, []);

  if (!isReady) {
    return <div className="loading-app">Loading application...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage setCurrentUser={setCurrentUser} />} />

        {/* Protected routes wrapped in Layout */}
        <Route element={<Layout />}>
          {/* Dashboard/Home */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />

          {/* Clients */}
          <Route 
            path="/clients" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'practitioner']}>
                <ClientsPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients/new" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'practitioner']}>
                <ClientForm isEdit={false} />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients/:clientId" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'practitioner']}>
                <ClientDetailPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients/:clientId/edit" 
            element={
              <ProtectedRoute requiredRoles={['admin', 'practitioner']}>
                <ClientForm isEdit={true} />
              </ProtectedRoute>
            } 
          />

          {/* Session Notes */}
          <Route 
            path="/notes" 
            element={
              <ProtectedRoute>
                <SessionNotesPage />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/clients/:clientId/notes/new" 
            element={
              <ProtectedRoute>
                <SessionNotesPage />
              </ProtectedRoute>
            } 
          />

          {/* Resources */}
          <Route 
            path="/resources" 
            element={
              <ProtectedRoute>
                <ResourcesPage />
              </ProtectedRoute>
            } 
          />

          {/* Appointments */}
          <Route 
            path="/appointments" 
            element={
              <ProtectedRoute>
                <AppointmentsPage />
              </ProtectedRoute>
            } 
          />
          
          {/* Mood Analytics */}
          <Route 
            path="/mood-analytics" 
            element={
              <ProtectedRoute>
                <MoodAnalyticsPage />
              </ProtectedRoute>
            } 
          />

          {/* Tasks */}
          <Route 
            path="/tasks" 
            element={
              <ProtectedRoute>
                <TasksPage />
              </ProtectedRoute>
            }
          />

          {/* Reminders */}
          <Route 
            path="/reminders" 
            element={
              <ProtectedRoute>
                <RemindersPage />
              </ProtectedRoute>
            }
          />
          
          {/* Analytics */}
          <Route 
            path="/analytics" 
            element={
              <ProtectedRoute>
                <AnalyticsPage />
              </ProtectedRoute>
            }
          />

          {/* Messaging */}
          <Route 
            path="/messaging" 
            element={
              <ProtectedRoute>
                <MessagingPage />
              </ProtectedRoute>
            }
          />

          {/* Test Page for remount debugging */}
          <Route 
            path="/test" 
            element={<TestPage />} 
          />

          {/* Catch all - redirect to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
