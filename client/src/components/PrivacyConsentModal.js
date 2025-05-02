import React, { useEffect, useState } from 'react';
import api from '../services/api';
import AuthService from '../services/auth.service';

export default function PrivacyConsentModal({ open, onAccept }) {
  const [policy, setPolicy] = useState('');
  const [version, setVersion] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    api.get('/practitioners/privacy-policy')
      .then(res => {
        setPolicy(res.data.text);
        setVersion(res.data.version);
        setLoading(false);
      })
      .catch(() => {
        setError('Could not load privacy policy.');
        setLoading(false);
      });
  }, [open]);

  const handleAccept = async () => {
    try {
      const user = AuthService.getCurrentUser();
      await api.post('/practitioners/consent', { userId: user.id, version });
      localStorage.setItem('privacyConsentVersion', version);
      onAccept();
    } catch {
      setError('Failed to record consent.');
    }
  };

  if (!open) return null;
  return (
    <div className="privacy-modal-overlay" style={{ position: 'fixed', zIndex: 3000, top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div className="privacy-modal" style={{ background: '#fff', borderRadius: 8, padding: 24, maxWidth: 600, minWidth: 320, width: '90%', zIndex: 3100, position: 'relative', boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
        <h2>Privacy Policy & Consent</h2>
        {loading ? <div>Loading...</div> : error ? <div style={{ color: 'red' }}>{error}</div> : (
          <>
            <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 16, whiteSpace: 'pre-wrap', border: '1px solid #eee', padding: 12 }}>{policy}</div>
            <button className="btn primary" onClick={handleAccept}>I Accept</button>
          </>
        )}
      </div>
    </div>
  );
} 