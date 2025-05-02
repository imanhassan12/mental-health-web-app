// App.js
import React, { useState, useEffect, useRef } from 'react';
import AppRouter from './AppRouter';
import './styles/App.css';    // your global styling or theming
import { SocketProvider } from './contexts/SocketContext';
import PrivacyConsentModal from './components/PrivacyConsentModal';
import AuthService from './services/auth.service';
import api from './services/api';
import { isTokenExpired } from './services/auth.service';

function App() {
  const [currentUser, setCurrentUser] = useState(AuthService.getCurrentUser());
  console.log("App.js mounted", currentUser);
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [timeoutSecondsLeft, setTimeoutSecondsLeft] = useState(60);
  const inactivityTimeout = 30 * 60 * 1000; // 30 minutes
  const warningDuration = 60 * 1000; // 1 minute
  let logoutTimer = useRef();
  let warningTimer = useRef();
  let countdownInterval = useRef();

  // Helper: logout and clear sensitive data
  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('privacyConsentVersion');
    setShowConsent(false);
    setConsentChecked(false);
    setCurrentUser(null);
    window.location.href = '/login';
  };

  // Listen for login/logout and update currentUser
  useEffect(() => {
    const syncUser = () => {
      setCurrentUser(AuthService.getCurrentUser());
    };
    window.addEventListener('storage', syncUser);
    return () => window.removeEventListener('storage', syncUser);
  }, []);

  // After login, update currentUser
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    setCurrentUser(user);
  }, []);

  // Reset inactivity timer
  const resetInactivityTimer = () => {
    if (logoutTimer.current) clearTimeout(logoutTimer.current);
    if (warningTimer.current) clearTimeout(warningTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
    setShowTimeoutWarning(false);
    // Set warning timer for 1 minute before logout
    warningTimer.current = setTimeout(() => {
      setShowTimeoutWarning(true);
      setTimeoutSecondsLeft(60);
      countdownInterval.current = setInterval(() => {
        setTimeoutSecondsLeft((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }, inactivityTimeout - warningDuration);
    // Set logout timer
    logoutTimer.current = setTimeout(() => {
      handleLogout();
    }, inactivityTimeout);
  };

  useEffect(() => {
    // Listen for user activity
    const events = ['mousemove', 'keydown', 'mousedown', 'touchstart'];
    events.forEach(evt => window.addEventListener(evt, resetInactivityTimer));
    resetInactivityTimer();
    return () => {
      events.forEach(evt => window.removeEventListener(evt, resetInactivityTimer));
      if (logoutTimer.current) clearTimeout(logoutTimer.current);
      if (warningTimer.current) clearTimeout(warningTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, []);

  // Check JWT expiration on mount and on activity
  useEffect(() => {
    const user = AuthService.getCurrentUser();
    if (user && user.token && isTokenExpired(user.token)) {
      handleLogout();
    }
  });

  // Consent check runs whenever currentUser changes
  useEffect(() => {
    // Only run if user is present (authenticated)
    if (!currentUser) {
      setConsentChecked(true);
      return;
    }
    console.log("Consent check useEffect running");
    const checkConsent = async () => {
      const user = AuthService.getCurrentUser();
      console.log("User in consent check:", user);
      if (!user) { setConsentChecked(true); return; }
      const localVersion = localStorage.getItem('privacyConsentVersion');
      console.log("Local privacyConsentVersion:", localVersion);
      const res = await api.get('/practitioners/privacy-policy');
      console.log("Fetched privacy policy:", res.data);
      const latestVersion = res.data.version;
      if (localVersion === latestVersion) { setConsentChecked(true); return; }
      // Optionally, check backend for consent
      const consentRes = await api.get('/practitioners/consent/me');
      console.log("Backend consent response:", consentRes.data);
      if (consentRes.data && consentRes.data.version === latestVersion) {
        localStorage.setItem('privacyConsentVersion', latestVersion);
        setConsentChecked(true);
        return;
      }
      setShowConsent(true);
    };
    checkConsent();
  }, [currentUser]);

  if (showConsent) {
    return <PrivacyConsentModal open={true} onAccept={() => { setShowConsent(false); setConsentChecked(true); }} />;
  }
  if (!consentChecked) return null;

  if (showTimeoutWarning) {
    return (
      <div className="modal-overlay" style={{ position: 'fixed', zIndex: 2000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="modal" style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 400, width: '90%' }}>
          <h2>Session Timeout Warning</h2>
          <div style={{ marginBottom: 16 }}>
            You will be logged out in {timeoutSecondsLeft} seconds due to inactivity.<br />
            Please interact with the app to stay logged in.
          </div>
          <button className="btn primary" onClick={() => { resetInactivityTimer(); setShowTimeoutWarning(false); }}>Stay Logged In</button>
        </div>
      </div>
    );
  }

  return (
    <SocketProvider>
      <div className="App">
        <AppRouter setCurrentUser={setCurrentUser} />
      </div>
    </SocketProvider>
  );
}

export default App;
