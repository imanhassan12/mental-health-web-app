// client/src/AppRouter.js

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ClientsPage from './pages/ClientsPage';
import ClientForm from './pages/ClientForm';
import SessionNotesPage from './pages/SessionNotesPage';
import ResourcesPage from './pages/ResourcesPage';
import AppointmentsPage from './pages/AppointmentsPage';
import LoginPage from './pages/LoginPage';
import ClientDetailPage from './pages/ClientDetailPage';

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* Login route (no layout) */}
        <Route path="/login" element={<LoginPage />} />

        {/* Everything else is wrapped by Layout */}
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />

          {/* Clients */}
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/clients/new" element={<ClientForm isEdit={false} />} />
          <Route path="/clients/:clientId" element={<ClientDetailPage />} />
          <Route path="/clients/:clientId/edit" element={<ClientForm isEdit={true} />} />

          {/* Session Notes */}
          <Route path="/notes" element={<SessionNotesPage />} />

          {/* Resources */}
          <Route path="/resources" element={<ResourcesPage />} />

          {/* Appointments */}
          <Route path="/appointments" element={<AppointmentsPage />} />
        </Route>
      </Routes>
    </Router>
  );
};

export default AppRouter;
