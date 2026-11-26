import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { api, getToken, setToken } from '../../api';
import { useToast } from '../../components/Toast.jsx';

export default function Login() {
  const nav = useNavigate();
  const toast = useToast();
  const [f, setF] = useState({ username: '', password: '' });
  const [busy, setBusy] = useState(false);
  if (getToken()) return <Navigate to="/admin" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await api('/admin/login', { method: 'POST', body: f });
      setToken(r.token);
      toast(`Welcome, ${r.username}`);
      nav('/admin', { replace: true });
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-600 to-purple-700 p-4">
      <form onSubmit={submit} className="card w-full max-w-sm space-y-4 p-7">
        <h1 className="text-2xl font-extrabold">Admin Login</h1>
        <div><label className="label">Username</label><input className="input" autoFocus value={f.username} onChange={(e) => setF({ ...f, username: e.target.value })} /></div>
        <div><label className="label">Password</label><input type="password" className="input" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></div>
        <button className="btn-primary w-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
      </form>
    </div>
  );
}
