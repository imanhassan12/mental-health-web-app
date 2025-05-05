// client/src/pages/ClientsPage.js
import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import ClientService from '../services/client.service';
import '../styles/ClientsPage.css';
import AuthService from '../services/auth.service';
import api from '../services/api';
import { backendUrl } from '../services/api';

const ClientsPage = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [importSummary, setImportSummary] = useState(null);
  const [importError, setImportError] = useState('');
  const fileInputRef = useRef();
  const [fieldPrefs, setFieldPrefs] = useState({ import: [], export: [] });
  const [availableFields] = useState(['id', 'name', 'phone', 'email', 'notes', 'appointments', 'sessionNotes']);
  const [prefsLoading, setPrefsLoading] = useState(false);
  const user = AuthService.getCurrentUser();
  const userRole = user?.role; // primitive string for stable dependency
  const [globalFieldPrefs, setGlobalFieldPrefs] = useState({ import: [], export: [] });
  const [globalPrefsLoading, setGlobalPrefsLoading] = useState(false);
  const [activeFieldPrefs, setActiveFieldPrefs] = useState({ import: [], export: [] });
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditStart, setAuditStart] = useState('');
  const [auditEnd, setAuditEnd] = useState('');
  const [auditAction, setAuditAction] = useState('');
  const [auditLoading, setAuditLoading] = useState(false);
  const auditActions = ['LOGIN_SUCCESS','LOGIN_FAILED','REGISTER','VIEW_CLIENT','CREATE_CLIENT','UPDATE_CLIENT','DELETE_CLIENT','EXPORT_CLIENT_CSV','EXPORT_CLIENT_FHIR','VIEW_APPOINTMENT','CREATE_APPOINTMENT','UPDATE_APPOINTMENT','DELETE_APPOINTMENT','VIEW_SESSION_NOTE','CREATE_SESSION_NOTE','UPDATE_SESSION_NOTE','DELETE_SESSION_NOTE','VIEW_THREAD','CREATE_THREAD','SEND_MESSAGE','UPDATE_THREAD','DELETE_THREAD','VIEW_ALERT','CREATE_ALERT','UPDATE_ALERT','DELETE_ALERT'];

  // Consolidated data fetching & preference setup
  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      const defaultPrefs = { import: availableFields, export: availableFields };

      try {
        setLoading(true);

        if (userRole === 'admin') {
          // Parallel fetches for better performance
          setPrefsLoading(true);
          setGlobalPrefsLoading(true);

          const [clientsData, fieldPrefsRes, globalPrefsRes] = await Promise.all([
            ClientService.getAllClients(),
            api.get('/clients/field-preferences/me').catch(() => ({ data: defaultPrefs })),
            api.get('/clients/field-preferences/global').catch(() => ({ data: defaultPrefs }))
          ]);

          if (!isMounted) return;

          setClients(clientsData);
          setFieldPrefs(fieldPrefsRes.data || defaultPrefs);
          setGlobalFieldPrefs(globalPrefsRes.data || defaultPrefs);
          setActiveFieldPrefs(fieldPrefsRes.data || defaultPrefs);
        } else {
          // Non-admin users: only fetch clients, skip admin-only endpoints
          const clientsData = await ClientService.getAllClients();
          if (!isMounted) return;
          setClients(clientsData);
          setActiveFieldPrefs(defaultPrefs);
        }

        setError(null);
      } catch (err) {
        if (!isMounted) return;
        console.error('Error fetching data:', err);
        setError('Failed to load clients. Please try again later.');
      } finally {
        if (!isMounted) return;
        setLoading(false);
        setPrefsLoading(false);
        setGlobalPrefsLoading(false);
      }
    };

    fetchData();

    return () => {
      isMounted = false; // Prevent state updates after unmount
    };
  }, [userRole, availableFields]);

  const handleImport = async (type) => {
    setImportSummary(null);
    setImportError('');
    const file = fileInputRef.current.files[0];
    if (!file) {
      setImportError('Please select a file to import.');
      return;
    }
    const formData = new FormData();
    formData.append('file', file);
    try {
      const urlBase = backendUrl;
      const res = await fetch(`${urlBase}/api/clients/import/${type}`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Import failed');
      setImportSummary(data);
    } catch (err) {
      setImportError(err.message);
    }
  };

  const handleFieldPrefChange = (type, field) => {
    setFieldPrefs(fp => ({
      ...fp,
      [type]: fp[type].includes(field)
        ? fp[type].filter(f => f !== field)
        : [...fp[type], field]
    }));
  };

  const handleGlobalFieldPrefChange = (type, field) => {
    setGlobalFieldPrefs(fp => ({
      ...fp,
      [type]: fp[type].includes(field)
        ? fp[type].filter(f => f !== field)
        : [...fp[type], field]
    }));
  };

  const saveFieldPrefs = async () => {
    setPrefsLoading(true);
    await api.post('/clients/field-preferences/me', fieldPrefs);
    setPrefsLoading(false);
  };

  const saveGlobalFieldPrefs = async () => {
    setGlobalPrefsLoading(true);
    await api.post('/clients/field-preferences/global', globalFieldPrefs);
    setGlobalPrefsLoading(false);
  };

  const resetToGlobalPrefs = async () => {
    setPrefsLoading(true);
    await api.post('/clients/field-preferences/me', { import: null, export: null, reset: true });
    api.get('/clients/field-preferences/me').then(res => {
      setFieldPrefs(res.data || { import: availableFields, export: availableFields });
      setActiveFieldPrefs(res.data || { import: availableFields, export: availableFields });
    });
    setPrefsLoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    let url = '/clients/audit-logs?';
    if (auditStart) url += `start=${encodeURIComponent(auditStart)}&`;
    if (auditEnd) url += `end=${encodeURIComponent(auditEnd)}&`;
    if (auditAction) url += `action=${encodeURIComponent(auditAction)}&`;
    const res = await api.get(url);
    setAuditLogs(res.data);
    setAuditLoading(false);
  };

  const handleExportAuditCSV = async () => {
    let url = '/clients/audit-logs/csv?';
    if (auditStart) url += `start=${encodeURIComponent(auditStart)}&`;
    if (auditEnd) url += `end=${encodeURIComponent(auditEnd)}&`;
    if (auditAction) url += `action=${encodeURIComponent(auditAction)}&`;
    const token = AuthService.getToken();
    const urlBase = backendUrl;
    const res = await fetch(urlBase + url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Export failed');
    const blob = await res.blob();
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'audit-logs.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (loading) {
    return (
      <div className="clients-page">
        <h2>Clients</h2>
        <div className="loading">Loading clients...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="clients-page">
        <h2>Clients</h2>
        <div className="error">{error}</div>
        <button 
          className="btn secondary" 
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="clients-page">
      <h2>Clients</h2>
      {userRole === 'admin' && (
        <>
          <div style={{ background: '#f0f7ff', borderRadius: 8, padding: 16, marginBottom: 18 }}>
            <strong>Global Import/Export Fields (Default for All Users):</strong>
            <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
              {['import', 'export'].map(type => (
                <div key={type}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{type.charAt(0).toUpperCase() + type.slice(1)} Fields</div>
                  {availableFields.map(field => (
                    <label key={field} style={{ display: 'block', marginBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={globalFieldPrefs[type]?.includes(field)}
                        onChange={() => handleGlobalFieldPrefChange(type, field)}
                        disabled={globalPrefsLoading}
                      />{' '}{field}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button className="btn small" onClick={saveGlobalFieldPrefs} disabled={globalPrefsLoading} style={{ marginTop: 8 }}>Save Global Preferences</button>
          </div>
          <div style={{ background: '#f6faff', borderRadius: 8, padding: 16, marginBottom: 18 }}>
            <strong>Customize Your Import/Export Fields:</strong>
            <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
              {['import', 'export'].map(type => (
                <div key={type}>
                  <div style={{ fontWeight: 600, marginBottom: 4 }}>{type.charAt(0).toUpperCase() + type.slice(1)} Fields</div>
                  {availableFields.map(field => (
                    <label key={field} style={{ display: 'block', marginBottom: 2 }}>
                      <input
                        type="checkbox"
                        checked={fieldPrefs[type]?.includes(field)}
                        onChange={() => handleFieldPrefChange(type, field)}
                        disabled={prefsLoading}
                      />{' '}{field}
                    </label>
                  ))}
                </div>
              ))}
            </div>
            <button className="btn small" onClick={saveFieldPrefs} disabled={prefsLoading} style={{ marginTop: 8, marginRight: 8 }}>Save My Preferences</button>
            <button className="btn small secondary" onClick={resetToGlobalPrefs} disabled={prefsLoading} style={{ marginTop: 8 }}>Reset to Global Default</button>
          </div>
          <button className="btn small" style={{ marginBottom: 12 }} onClick={() => setShowAuditLog(v => !v)}>
            {showAuditLog ? 'Hide' : 'Show'} Audit Log
          </button>
          {showAuditLog && (
            <div style={{ background: '#fff', borderRadius: 8, padding: 16, marginBottom: 18, border: '1px solid #eaf6fa' }}>
              <strong>Audit Log (Admin Only)</strong>
              <div style={{ display: 'flex', gap: 12, margin: '12px 0' }}>
                <label>Start: <input type="date" value={auditStart} onChange={e => setAuditStart(e.target.value)} /></label>
                <label>End: <input type="date" value={auditEnd} onChange={e => setAuditEnd(e.target.value)} /></label>
                <label>Action: <select value={auditAction} onChange={e => setAuditAction(e.target.value)}>
                  <option value="">All</option>
                  {auditActions.map(a => <option key={a} value={a}>{a}</option>)}
                </select></label>
                <button className="btn small" onClick={fetchAuditLogs} disabled={auditLoading}>Filter</button>
                <button className="btn small" onClick={handleExportAuditCSV} disabled={auditLoading}>Export CSV</button>
              </div>
              {auditLoading ? <div>Loading...</div> : (
                <div style={{ maxHeight: 320, overflowY: 'auto' }}>
                  <table style={{ width: '100%', fontSize: 13, borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: '#f6faff' }}>
                        <th>Time</th><th>User</th><th>Role</th><th>Action</th><th>Entity</th><th>Entity ID</th><th>IP</th><th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id}>
                          <td>{new Date(log.timestamp).toLocaleString()}</td>
                          <td>{log.userId}</td>
                          <td>{log.userRole}</td>
                          <td>{log.action}</td>
                          <td>{log.entity}</td>
                          <td>{log.entityId}</td>
                          <td>{log.ip}</td>
                          <td><pre style={{ whiteSpace: 'pre-wrap', fontSize: 11 }}>{JSON.stringify(log.details, null, 1)}</pre></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
      <div style={{ background: '#fffbe6', borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <strong>Currently Active Import/Export Fields for You:</strong>
        <div style={{ display: 'flex', gap: 32, marginTop: 8 }}>
          {['import', 'export'].map(type => (
            <div key={type}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{type.charAt(0).toUpperCase() + type.slice(1)} Fields</div>
              <span>{activeFieldPrefs[type]?.length ? activeFieldPrefs[type].join(', ') : 'None'}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{ background: '#eaf6fa', borderRadius: 8, padding: 16, marginBottom: 18 }}>
        <strong>EHR/EMR Import:</strong> Import client records from CSV or FHIR JSON files exported from other systems.<br />
        <input type="file" ref={fileInputRef} accept=".csv,application/json" style={{ marginTop: 8, marginRight: 8 }} />
        <button className="btn small" onClick={() => handleImport('csv')}>Import CSV</button>
        <button className="btn small" onClick={() => handleImport('fhir')}>Import FHIR JSON</button>
        <span style={{ fontSize: 14, color: '#888', marginLeft: 6 }} title="EHR/EMR Import: Upload client records from other healthcare systems.">ℹ️</span>
        {importError && <div style={{ color: '#d9534f', marginTop: 8 }}>{importError}</div>}
        {importSummary && (
          <div style={{ color: '#1479b8', marginTop: 8 }}>
            Import Summary: {importSummary.successes} added, {importSummary.duplicates} duplicates, {importSummary.errors} errors.
          </div>
        )}
      </div>
      <Link to="/clients/new" className="btn primary">+ Add Client</Link>

      {clients.length === 0 ? (
        <p>No clients found. Add your first client to get started.</p>
      ) : (
        <ul className="client-list">
          {clients.map((client) => (
            <li key={client.id} className="client-item">
              <Link to={`/clients/${client.id}`}>
                {client.name} - {client.phone}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ClientsPage;
