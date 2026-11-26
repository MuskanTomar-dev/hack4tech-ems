import { useCallback, useEffect, useState } from 'react';

export const getToken = () => localStorage.getItem('eh_token');
export const setToken = (t) => (t ? localStorage.setItem('eh_token', t) : localStorage.removeItem('eh_token'));

function authHeaders(auth) {
  const t = getToken();
  return auth && t ? { Authorization: `Bearer ${t}` } : {};
}

function handle401(res, auth) {
  if (res.status === 401 && auth) {
    setToken(null);
    if (!location.pathname.startsWith('/admin/login')) location.href = '/admin/login';
  }
}

export async function api(path, { method = 'GET', body, auth = false } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...authHeaders(auth) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try { data = await res.json(); } catch { /* empty body */ }
  if (!res.ok) {
    handle401(res, auth);
    throw Object.assign(new Error(data?.error || `Request failed (${res.status})`), { status: res.status, data });
  }
  return data;
}

export async function downloadFile(path, fallbackName) {
  const res = await fetch('/api' + path, { headers: authHeaders(true) });
  if (!res.ok) {
    handle401(res, true);
    throw new Error('Export failed');
  }
  const cd = res.headers.get('Content-Disposition') || '';
  const name = /filename="([^"]+)"/.exec(cd)?.[1] || fallbackName;
  const url = URL.createObjectURL(await res.blob());
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useFetch(path, { auth = false, interval = 0 } = {}) {
  const [state, setState] = useState({ data: null, error: null, loading: !!path });
  const load = useCallback(async () => {
    if (!path) return setState({ data: null, error: null, loading: false });
    try {
      const data = await api(path, { auth });
      setState({ data, error: null, loading: false });
    } catch (e) {
      setState((s) => ({ ...s, error: e.message, loading: false }));
    }
  }, [path, auth]);
  useEffect(() => {
    setState({ data: null, error: null, loading: !!path });
    load();
    if (!interval) return;
    const t = setInterval(load, interval);
    return () => clearInterval(t);
  }, [load, interval, path]);
  return { ...state, reload: load };
}

export const fmtDate = (iso) => (iso ? new Date(iso).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '—');
export const fmtTime = (iso) => (iso ? new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—');
