// client/src/AppRouter.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CheckInPage from './pages/CheckInPage';
import SkillsPage from './pages/SkillsPage';
import AudioJournal from './pages/AudioJournal';
import Progress from './pages/Progress';
import NavBar from './components/NavBar';

const AppRouter = () => {
  return (
    <Router>
      <NavBar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/checkin" element={<CheckInPage />} />
        <Route path="/skills" element={<SkillsPage />} />
        <Route path="/audio" element={<AudioJournal />} />
        <Route path="/progress" element={<Progress />} />
      </Routes>
    </Router>
  );
};

export default AppRouter;
