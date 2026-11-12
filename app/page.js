'use client';

import { useState, useEffect } from 'react';
import { 
  verifyToken, getWorkers, createWorker, getWorkerCode, 
  deployWorker, deleteWorker, getSubdomain, updateSubdomain 
} from './actions';

export default function Home() {
  const [token, setToken] = useState('');
  const [accountId, setAccountId] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: '', msg: '' });
  
  const [workers, setWorkers] = useState([]);
  const [subdomain, setSubdomain] = useState('');
  const [newSubdomain, setNewSubdomain] = useState('');
  const [newWorkerName, setNewWorkerName] = useState('');

  const [editingWorker, setEditingWorker] = useState(null);
  const [code, setCode] = useState('');

  // Auto Load from LocalStorage
  useEffect(() => {
    const savedToken = localStorage.getItem('cf_token');
    const savedAcc = localStorage.getItem('cf_acc');
    if (savedToken && savedAcc) {
      setToken(savedToken);
      setAccountId(savedAcc);
      autoConnect(savedToken, savedAcc);
    }
  }, []);

  const autoConnect = async (tk, acc) => {
    setLoading(true);
    const res = await verifyToken(tk);
    if (res.success) {
      setIsConnected(true);
      loadData(tk, acc);
    } else {
      disconnect(); // Auto clear invalid tokens
    }
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!token || !accountId) return setStatus({ type: 'error', msg: 'Token और ID डालें' });
    setLoading(true);
    const res = await verifyToken(token);
    if (res.success) {
      localStorage.setItem('cf_token', token);
      localStorage.setItem('cf_acc', accountId);
      setIsConnected(true);
      loadData(token, accountId);
    } else {
      setStatus({ type: 'error', msg: res.message });
    }
    setLoading(false);
  };

  const disconnect = () => {
    localStorage.removeItem('cf_token');
    localStorage.removeItem('cf_acc');
    setIsConnected(false);
    setToken('');
    setAccountId('');
    setWorkers([]);
    setStatus({ type: '', msg: '' });
  };

  const loadData = async (tk = token, acc = accountId) => {
    setStatus({ type: 'info', msg: 'डेटा लोड हो रहा है...' });
    const wRes = await getWorkers(tk, acc);
    if (wRes.success) {
      setWorkers(wRes.data);
      const sRes = await getSubdomain(tk, acc);
      if (sRes.success) setSubdomain(sRes.data);
      setStatus({ type: '', msg: '' });
    } else {
      setStatus({ type: 'error', msg: wRes.message });
    }
  };

  const handleCreateWorker = async () => {
    if (!newWorkerName.match(/^[a-z0-9-]+$/)) return setStatus({ type: 'error', msg: 'सिर्फ lowercase, numbers, hyphens' });
    setStatus({ type: 'info', msg: 'बन रहा है...' });
    const res = await createWorker(token, accountId, newWorkerName);
    if (res.success) {
      setNewWorkerName('');
      setStatus({ type: 'success', msg: 'Worker बन गया! Domain ऑटो-एनेबल है।' });
      loadData(); // Refresh list to show new domain
    } else {
      setStatus({ type: 'error', msg: res.message });
    }
  };

  const handleEdit = async (name) => {
    setStatus({ type: 'info', msg: 'कोड लोड हो रहा है...' });
    const res = await getWorkerCode(token, accountId, name);
    if (res.success) {
      setCode(res.data);
      setEditingWorker(name);
      setStatus({ type: '', msg: '' });
    } else {
      setStatus({ type: 'error', msg: res.message });
    }
  };

  const handleDeploy = async () => {
    setStatus({ type: 'info', msg: 'Deploy हो रहा है...' });
    const res = await deployWorker(token, accountId, editingWorker, code);
    if (res.success) {
      setStatus({ type: 'success', msg: 'Deploy सफल!' });
      setEditingWorker(null);
    } else {
      setStatus({ type: 'error', msg: res.message });
    }
  };

  const handleDelete = async (name) => {
    if (!confirm(`${name} को डिलीट करें?`)) return;
    setStatus({ type: 'info', msg: 'डिलीट हो रहा है...' });
    const res = await deleteWorker(token, accountId, name);
    if (res.success) { loadData(); setStatus({ type: 'success', msg: 'डिलीट हो गया' }); }
  };

  const handleDownload = async (name) => {
    setStatus({ type: 'info', msg: 'डाउनलोड हो रहा है...' });
    const res = await getWorkerCode(token, accountId, name);
    if (res.success) {
      const blob = new Blob([res.data], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'success', msg: 'डाउनलोड शुरू!' });
    }
  };

  // UI Render
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '15px', paddingBottom: '80px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#f38020', margin: 0 }}>⚡ CF Manager</h2>
        {isConnected && <button onClick={disconnect} style={btnLogout}>Disconnect</button>}
      </div>

      {/* Status Box */}
      {status.msg && (
        <div style={{ padding: '10px', borderRadius: '8px', marginBottom: '15px', fontSize: '13px', background: status.type === 'error' ? '#fee2e2' : status.type === 'success' ? '#dcfce7' : '#dbeafe', color: status.type === 'error' ? '#991b1b' : status.type === 'success' ? '#166534' : '#1e40af' }}>
          {status.msg}
        </div>
      )}

      {/* Login Screen */}
      {!isConnected ? (
        <div style={cardStyle}>
          <h3 style={{ marginTop: 0 }}>🔐 Login</h3>
          <input type="password" placeholder="API Token" value={token} onChange={e => setToken(e.target.value)} style={inputStyle} />
          <input type="text" placeholder="Account ID" value={accountId} onChange={e => setAccountId(e.target.value)} style={inputStyle} />
          <button onClick={handleConnect} disabled={loading} style={{ ...btnPrimary, width: '100%' }}>
            {loading ? 'Connecting...' : 'Connect & Save'}
          </button>
        </div>
      ) : editingWorker ? (
        
        /* Editor Screen */
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
            <h3 style={{ margin: 0 }}>✏️ {editingWorker}</h3>
            <button onClick={() => setEditingWorker(null)} style={btnSmall}>Close</button>
          </div>
          <textarea 
            value={code} onChange={e => setCode(e.target.value)} 
            style={{ width: '100%', height: '400px', fontFamily: 'monospace', padding: '10px', borderRadius: '8px', border: '1px solid #ccc', fontSize: '12px', boxSizing: 'border-box' }} 
          />
          <button onClick={handleDeploy} style={{ ...btnPrimary, width: '100%', marginTop: '10px' }}>🚀 Save & Deploy</button>
        </div>

      ) : (
        
        /* Dashboard Screen */
        <>
          {/* Subdomain Manager */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: '15px' }}>🌐 Subdomain</h3>
            <p style={{ fontSize: '13px', color: '#555' }}>वर्तमान: <b>{subdomain ? `*.${subdomain}.workers.dev` : 'कोई नहीं'}</b></p>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" placeholder="नया Subdomain" value={newSubdomain} onChange={e => setNewSubdomain(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
              <button onClick={async () => { await updateSubdomain(token, accountId, newSubdomain); loadData(); setNewSubdomain(''); }} style={btnPrimary}>Save</button>
            </div>
          </div>

          {/* Create Worker */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: '15px' }}>➕ New Worker</h3>
            <div style={{ display: 'flex', gap: '5px' }}>
              <input type="text" placeholder="worker-name" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} style={{ ...inputStyle, marginBottom: 0, flex: 1 }} />
              <button onClick={handleCreateWorker} style={btnPrimary}>Create</button>
            </div>
          </div>

          {/* Workers List */}
          <div style={cardStyle}>
            <h3 style={{ marginTop: 0, fontSize: '15px', marginBottom: '15px' }}>📋 Your Workers ({workers.length})</h3>
            {workers.length === 0 && <p style={{ textAlign: 'center', color: '#888' }}>कोई Worker नहीं है</p>}
            {workers.map(w => (
              <div key={w.id} style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '10px' }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>⚡ {w.id}</div>
                <a href={`https://${w.id}.${subdomain}.workers.dev`} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#0066ff', display: 'block', marginTop: '2px', wordBreak: 'break-all' }}>
                  https://{w.id}.{subdomain}.workers.dev
                </a>
                <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                  <button onClick={() => handleEdit(w.id)} style={btnSmall}>✏️ Edit</button>
                  <button onClick={() => handleDownload(w.id)} style={{ ...btnSmall, color: '#0066ff', borderColor: '#93c5fd' }}>⬇️ Download</button>
                  <button onClick={() => handleDelete(w.id)} style={{ ...btnSmall, color: '#dc2626', borderColor: '#fca5a5' }}>🗑️ Delete</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Styles
const cardStyle = { background: '#fff', padding: '15px', borderRadius: '10px', marginBottom: '15px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' };
const inputStyle = { width: '100%', padding: '12px', marginBottom: '10px', border: '1px solid #ccc', borderRadius: '8px', boxSizing: 'border-box', fontSize: '14px' };
const btnPrimary = { background: '#f38020', color: '#fff', border: 'none', padding: '12px 15px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' };
const btnSmall = { background: '#fff', color: '#333', border: '1px solid #ccc', padding: '6px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' };
const btnLogout = { background: '#fee2e2', color: '#991b1b', border: 'none', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' };