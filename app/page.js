'use client';

import { useState, useEffect } from 'react';
import { verifyToken, getWorkers, createWorker, getWorkerCode, deployWorker, deleteWorker, getSubdomain, updateSubdomain } from './actions';

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

  useEffect(() => {
    const t = localStorage.getItem('cf_token');
    const a = localStorage.getItem('cf_acc');
    if (t && a) { setToken(t); setAccountId(a); autoConnect(t, a); }
  }, []);

  const autoConnect = async (t, a) => {
    setLoading(true);
    const r = await verifyToken(t);
    if (r.success) { setIsConnected(true); await loadData(t, a); }
    else disconnect();
    setLoading(false);
  };

  const handleConnect = async () => {
    if (!token || !accountId) return setStatus({ type: 'error', msg: 'API Token aur Account ID enter karein.' });
    setLoading(true);
    const r = await verifyToken(token);
    if (r.success) {
      localStorage.setItem('cf_token', token);
      localStorage.setItem('cf_acc', accountId);
      setIsConnected(true);
      await loadData(token, accountId);
    } else setStatus({ type: 'error', msg: r.message });
    setLoading(false);
  };

  const disconnect = () => {
    localStorage.removeItem('cf_token'); localStorage.removeItem('cf_acc');
    setIsConnected(false); setToken(''); setAccountId(''); setWorkers([]);
    setSubdomain(''); setEditingWorker(null); setStatus({ type: '', msg: '' });
  };

  const loadData = async (t = token, a = accountId) => {
    setStatus({ type: 'info', msg: 'Cloudflare data loading...' });
    const r = await getWorkers(t, a);
    if (r.success) {
      setWorkers(r.data || []);
      const s = await getSubdomain(t, a);
      if (s.success) setSubdomain(s.data);
      setStatus({ type: '', msg: '' });
    } else setStatus({ type: 'error', msg: r.message });
  };

  const handleCreateWorker = async () => {
    if (!/^[a-z0-9-]+$/.test(newWorkerName)) return setStatus({ type: 'error', msg: 'Use lowercase letters, numbers and hyphens only.' });
    setStatus({ type: 'info', msg: 'Creating Worker...' });
    const r = await createWorker(token, accountId, newWorkerName);
    if (r.success) { setNewWorkerName(''); await loadData(); setStatus({ type: 'success', msg: 'Worker created successfully!' }); }
    else setStatus({ type: 'error', msg: r.message });
  };

  const handleEdit = async name => {
    setStatus({ type: 'info', msg: 'Loading Worker code...' });
    const r = await getWorkerCode(token, accountId, name);
    if (r.success) { setCode(r.data); setEditingWorker(name); setStatus({ type: '', msg: '' }); }
    else setStatus({ type: 'error', msg: r.message });
  };

  const handleDeploy = async () => {
    setStatus({ type: 'info', msg: 'Deploying changes...' });
    const r = await deployWorker(token, accountId, editingWorker, code);
    if (r.success) { setEditingWorker(null); setStatus({ type: 'success', msg: 'Worker deployed successfully!' }); }
    else setStatus({ type: 'error', msg: r.message });
  };

  const handleDelete = async name => {
    if (!confirm('Delete ' + name + ' permanently?')) return;
    const r = await deleteWorker(token, accountId, name);
    if (r.success) { await loadData(); setStatus({ type: 'success', msg: 'Worker deleted.' }); }
    else setStatus({ type: 'error', msg: r.message });
  };

  const handleDownload = async name => {
    const r = await getWorkerCode(token, accountId, name);
    if (r.success) {
      const url = URL.createObjectURL(new Blob([r.data], { type: 'text/javascript' }));
      const a = document.createElement('a'); a.href = url; a.download = name + '.js'; a.click();
      URL.revokeObjectURL(url); setStatus({ type: 'success', msg: 'Download started.' });
    } else setStatus({ type: 'error', msg: r.message });
  };

  const handleSubdomain = async () => {
    if (!newSubdomain.trim()) return setStatus({ type: 'error', msg: 'Enter a subdomain first.' });
    const r = await updateSubdomain(token, accountId, newSubdomain.trim());
    if (r.success) { setNewSubdomain(''); await loadData(); setStatus({ type: 'success', msg: 'Subdomain updated!' }); }
    else setStatus({ type: 'error', msg: r.message });
  };

  return (
    <main className="shell">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;600;700&display=swap');
        * { box-sizing: border-box; }
        body { margin:0; background:#080d0c; color:#f5f7ff; font-family:'DM Sans',sans-serif; }
        button,input,textarea { font:inherit; }
        .shell { min-height:100vh; padding:30px 16px 60px; overflow:hidden; position:relative; isolation:isolate; background:radial-gradient(ellipse at 10% 5%,#164b3b38,transparent 35%),radial-gradient(ellipse at 95% 25%,#1dbb8a20,transparent 32%),linear-gradient(145deg,#080d0c,#101b18 55%,#090f0d); }
        .shell:before { content:'';position:fixed;inset:0;z-index:-1;pointer-events:none;background-image:linear-gradient(#b7f7d008 1px,transparent 1px),linear-gradient(90deg,#b7f7d008 1px,transparent 1px);background-size:54px 54px;mask-image:linear-gradient(to bottom,#000 0%,transparent 85%); }
        .shell:after { content:'';position:fixed;width:560px;height:560px;top:-190px;left:-180px;z-index:-1;pointer-events:none;border-radius:50%;background:radial-gradient(circle,#28c58a26 0%,#28c58a0c 38%,transparent 70%);filter:blur(18px);animation:ambientDrift 17s ease-in-out infinite alternate; }
        @keyframes ambientDrift { from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(45vw,28vh,0) scale(1.25)} }
        @keyframes softPulse { 0%,100%{opacity:.45;transform:scale(.96)}50%{opacity:.85;transform:scale(1.05)} }
        .hero { box-shadow:0 22px 55px #0005,inset 0 1px #ffffff19,0 0 55px #2ac58b0b; }
        .logo { animation:softPulse 5s ease-in-out infinite; }
        .glass { transition:border-color .3s,box-shadow .3s,background .3s; }
        .glass:hover { box-shadow:0 24px 60px #0007,inset 0 1px #ffffff22,0 0 34px #2ac58b12; }
        @media(prefers-reduced-motion:reduce) { .shell:after,.logo { animation:none!important; } }
        .wrap { max-width:900px; margin:auto; }
        .top { display:flex; align-items:center; justify-content:space-between; margin-bottom:28px; gap:12px; }
        .brand { display:flex; align-items:center; gap:13px; }
        .logo { width:48px;height:48px;display:grid;place-items:center;border-radius:16px;font-size:25px;background:linear-gradient(145deg,#b9f5d5,#38c98c 65%,#147a56);box-shadow:0 9px 25px #38c98c55,inset 1px 1px 3px #fff9,inset -3px -4px 8px #07563b77;transform:perspective(300px) rotateY(-9deg) rotateX(8deg); }
        h1 { margin:0;font:700 22px 'Space Grotesk',sans-serif;letter-spacing:-.7px; }
        .sub { color:#8994b3;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;margin-top:3px; }
        .glass { background:linear-gradient(135deg,#ffffff19,#ffffff08);border:1px solid #ffffff20;border-top-color:#ffffff38;border-radius:23px;box-shadow:0 22px 55px #0005,inset 0 1px #ffffff19;backdrop-filter:blur(22px);-webkit-backdrop-filter:blur(22px); }
        .hero { padding:27px;margin-bottom:19px;position:relative;overflow:hidden; }
        .hero:after { content:'✦';position:absolute;right:28px;top:-18px;font-size:120px;color:#ffffff09; }
        .eyebrow { color:#a1acca;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase; }
        h2 { font:700 clamp(26px,5vw,37px) 'Space Grotesk',sans-serif;letter-spacing:-1.2px;margin:10px 0 8px; }
        .shine { color: #72e3b0;background:linear-gradient(90deg,#a7f3d0,#52d6a0,#b8f3dc);background-clip:text;-webkit-background-clip:text;-webkit-text-fill-color:transparent; }
        .muted { color:#929dbb;font-size:13px;line-height:1.6; }
        .status { padding:13px 16px;border-radius:13px;margin-bottom:17px;font-size:13px; }
        .success { color:#8df0c1;background:#0d8b5c22;border:1px solid #36d99a55; }
        .error { color:#ff9d9d;background:#f0444422;border:1px solid #ff777755; }
        .info { color:#a9c9ff;background:#4285f422;border:1px solid #6daaff55; }
        .grid { display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:17px;margin-bottom:18px; }
        .panel { padding:22px;min-width:0;transition:.25s; }
        .panel:hover { transform:translateY(-3px);border-color:#ffffff42;box-shadow:0 26px 60px #0007,inset 0 1px #ffffff22; }
        .heading { display:flex;align-items:center;gap:12px;margin-bottom:17px; }
        .ico { width:41px;height:41px;display:grid;place-items:center;border-radius:13px;background:linear-gradient(145deg,#ffffff27,#ffffff09);border:1px solid #ffffff24;box-shadow:inset 1px 1px #ffffff22,0 7px 18px #0004;font-size:18px; }
        h3 { margin:0;font:600 16px 'Space Grotesk',sans-serif; }
        .field { width:100%;height:48px;padding:0 14px;color:#f7f8ff;background:#070c1dcc;border:1px solid #ffffff20;border-radius:13px;outline:none;min-width:0; }
        .field::placeholder { color:#74809f; }
        .field:focus { border-color:#61d9a5;box-shadow:0 0 0 3px #43d99a24; }
        .stack { display:grid;gap:11px; }
        .row { display:flex;gap:9px; }
        .btn { border:0;border-radius:12px;padding:0 16px;min-height:44px;color:#fff;font-weight:700;font-size:12px;cursor:pointer;white-space:nowrap;transition:transform .2s,filter .2s; }
        .btn:hover { transform:translateY(-2px);filter:brightness(1.1); }
        .btn:active { transform:scale(.98); }
        .btn:disabled { opacity:.55;cursor:not-allowed; }
        .primary { background:linear-gradient(135deg,#a8f0cc,#43cb91 70%,#16865d);box-shadow:0 8px 22px #28b98255,inset 0 1px #ffffff99,inset 0 -2px 5px #07583b88; }
        .soft { background:linear-gradient(145deg,#ffffff25,#ffffff0c);border:1px solid #ffffff26;box-shadow:inset 0 1px #ffffff20,0 5px 15px #0003; }
        .danger { color:#ff9caa;background:#ff526222;border:1px solid #ff718355; }
        .stats { display:flex;gap:11px;margin-top:18px; }
        .stat { flex:1;padding:12px 14px;border-radius:14px;background:#ffffff0b;border:1px solid #ffffff15; }
        .stat strong { display:block;font:700 21px 'Space Grotesk',sans-serif; }
        .stat span { color:#929dbb;font-size:10px; }
        .workers { padding:22px; }
        .worker { padding:16px;margin-top:11px;border-radius:16px;background:linear-gradient(135deg,#ffffff13,#ffffff06);border:1px solid #ffffff18;transition:.2s; }
        .worker:hover { border-color:#61d9a577;background:#ffffff14; }
        .wtop { display:flex;justify-content:space-between;gap:10px;align-items:center; }
        .wname { font-weight:700;font-size:14px;overflow-wrap:anywhere; }
        .dot { display:inline-block;width:8px;height:8px;border-radius:50%;background:#42dfa1;box-shadow:0 0 12px #42dfa1;margin-right:9px; }
        .worker a { display:block;color:#82d9b2;font-size:12px;margin:9px 0 13px;overflow-wrap:anywhere;text-decoration:none; }
        .worker a:hover { text-decoration:underline; }
        .actions { display:flex;gap:8px;flex-wrap:wrap; }
        .actions .btn { min-height:34px;padding:0 11px;font-size:11px; }
        .empty { text-align:center;padding:34px 12px;color:#929dbb;border:1px dashed #ffffff2c;border-radius:15px;margin-top:15px; }
        .editor { padding:22px; }
        .editor textarea { width:100%;min-height:420px;resize:vertical;padding:16px;color:#dce5ff;background:#070c1d;border:1px solid #ffffff22;border-radius:14px;outline:none;font:13px/1.7 ui-monospace,monospace; }
        .footer { text-align:center;color:#687493;font-size:10px;letter-spacing:1.5px;margin-top:28px; }
        .login { max-width:480px;margin:8vh auto 0; }
        @media(max-width:650px) { .shell{padding:21px 13px 45px}.grid{grid-template-columns:1fr;gap:13px}.hero{padding:22px}.panel,.workers,.editor{padding:18px}.brand h1{font-size:19px}.logo{width:43px;height:43px}.row .btn{padding:0 12px} }
        @media(prefers-reduced-motion:reduce) { *,*:before,*:after{transition:none!important;animation:none!important} }
      `}</style>

      <div className="wrap">
        <header className="top">
          <div className="brand"><div className="logo">ϟ</div><div><h1>CF Manager</h1><div className="sub">Cloudflare control center</div></div></div>
          {isConnected && <button className="btn soft" onClick={disconnect}>↗ Disconnect</button>}
        </header>

        {status.msg && <div className={'status ' + (status.type || 'info')}>{status.type === 'success' ? '✓  ' : status.type === 'error' ? '⚠  ' : '◌  '}{status.msg}</div>}

        {!isConnected ? (
          <div className="login">
            <section className="glass hero"><div className="eyebrow">Secure access</div><h2>Your edge, <span className="shine">your control.</span></h2><p className="muted">Connect your Cloudflare account to manage Workers from one beautiful dashboard.</p></section>
            <section className="glass panel">
              <div className="heading"><div className="ico">🔐</div><div><h3>Connect account</h3><div className="muted">Enter your Cloudflare credentials</div></div></div>
              <div className="stack">
                <input className="field" type="password" autoComplete="off" placeholder="Cloudflare API Token" value={token} onChange={e => setToken(e.target.value)} />
                <input className="field" placeholder="Account ID" value={accountId} onChange={e => setAccountId(e.target.value)} />
                <button className="btn primary" style={{width:'100%'}} onClick={handleConnect} disabled={loading}>{loading ? 'Connecting...' : 'Connect account  →'}</button>
              </div>
            </section>
          </div>
        ) : editingWorker ? (
          <>
            <section className="glass hero"><div className="eyebrow">Worker editor</div><h2><span className="shine">{editingWorker}</span></h2><p className="muted">Edit your script and deploy the latest version.</p></section>
            <section className="glass editor">
              <div className="heading" style={{justifyContent:'space-between'}}><div className="heading" style={{margin:0}}><div className="ico">⌘</div><div><h3>Source code</h3><div className="muted">JavaScript module</div></div></div><button className="btn soft" onClick={() => setEditingWorker(null)}>✕ Close</button></div>
              <textarea spellCheck="false" value={code} onChange={e => setCode(e.target.value)} />
              <button className="btn primary" style={{width:'100%',marginTop:12}} onClick={handleDeploy}>🚀 Save & Deploy</button>
            </section>
          </>
        ) : (
          <>
            <section className="glass hero">
              <div className="eyebrow">Workspace overview</div><h2>Welcome to your <span className="shine">edge workspace.</span></h2><p className="muted">Manage scripts, domains and deployments — all in one place.</p>
              <div className="stats"><div className="stat"><strong>{workers.length}</strong><span>Total Workers</span></div><div className="stat"><strong>{subdomain ? 'Active' : '—'}</strong><span>Workers domain</span></div><div className="stat"><strong>Live</strong><span>Account status</span></div></div>
            </section>
            <div className="grid">
              <section className="glass panel">
                <div className="heading"><div className="ico">🌐</div><div><h3>Workers domain</h3><div className="muted">Your public workers.dev address</div></div></div>
                <div className="muted" style={{marginBottom:9}}>Current domain</div>
                <div className="field" style={{height:'auto',minHeight:46,display:'flex',alignItems:'center',fontSize:12,overflowWrap:'anywhere'}}>{subdomain ? subdomain + '.workers.dev' : 'No domain configured'}</div>
                <div className="row" style={{marginTop:10}}><input className="field" placeholder="New subdomain" value={newSubdomain} onChange={e => setNewSubdomain(e.target.value)} /><button className="btn primary" onClick={handleSubdomain}>Save</button></div>
              </section>
              <section className="glass panel">
                <div className="heading"><div className="ico">✦</div><div><h3>Create a Worker</h3><div className="muted">Launch a new edge script</div></div></div>
                <div className="muted" style={{marginBottom:9}}>Use lowercase letters, numbers and hyphens</div>
                <div className="stack"><input className="field" placeholder="my-awesome-worker" value={newWorkerName} onChange={e => setNewWorkerName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCreateWorker()} /><button className="btn primary" style={{width:'100%'}} onClick={handleCreateWorker}>＋ Create Worker</button></div>
              </section>
            </div>
            <section className="glass workers">
              <div className="heading" style={{justifyContent:'space-between',marginBottom:0}}><div className="heading" style={{margin:0}}><div className="ico">▤</div><div><h3>Your Workers</h3><div className="muted">{workers.length} script{workers.length === 1 ? '' : 's'} in your account</div></div></div><button className="btn soft" onClick={() => loadData()}>↻ Refresh</button></div>
              {workers.length === 0 ? <div className="empty"><div style={{fontSize:29,marginBottom:8}}>⌁</div><strong>No Workers yet</strong><div className="muted">Create your first Worker to see it here.</div></div> : (
                <div>
                  {workers.map(w => <article className="worker" key={w.id}>
                    <div className="wtop"><div className="wname"><span className="dot" />{w.id}</div><span className="eyebrow">WORKER</span></div>
                    {subdomain ? <a href={'https://' + w.id + '.' + subdomain + '.workers.dev'} target="_blank" rel="noreferrer">↗ https://{w.id}.{subdomain}.workers.dev</a> : <div className="muted" style={{margin:'9px 0 13px'}}>Configure a workers.dev domain to get a public URL.</div>}
                    <div className="actions"><button className="btn soft" onClick={() => handleEdit(w.id)}>✎ Edit code</button><button className="btn soft" onClick={() => handleDownload(w.id)}>↓ Download</button><button className="btn danger" onClick={() => handleDelete(w.id)}>⌫ Delete</button></div>
                  </article>)}
                </div>
              )}
            </section>
          </>
        )}
        <footer className="footer">CF MANAGER · BUILT FOR THE EDGE</footer>
      </div>
    </main>
  );
}
