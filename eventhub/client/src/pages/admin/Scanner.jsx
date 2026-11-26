import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { api, fmtTime, useFetch } from '../../api';
import { useToast } from '../../components/Toast.jsx';

export default function Scanner() {
  const toast = useToast();
  const events = useFetch('/admin/events', { auth: true });
  const [eventId, setEventId] = useState('');
  const [result, setResult] = useState(null);
  const [camError, setCamError] = useState('');
  const [manual, setManual] = useState('');
  const busy = useRef(false);
  const last = useRef({ token: '', at: 0 });
  const eventRef = useRef('');
  eventRef.current = eventId || events.data?.[0]?.id || '';

  const submit = async (token) => {
    if (!eventRef.current) return toast('Select an event first', 'error');
    if (busy.current) return;
    if (last.current.token === token && Date.now() - last.current.at < 4000) return; // debounce repeat frames
    busy.current = true;
    last.current = { token, at: Date.now() };
    try {
      const r = await api('/admin/scan', { method: 'POST', body: { event_id: Number(eventRef.current), token }, auth: true });
      setResult({ kind: 'ok', title: 'Checked in ✔', holder: r.holder, detail: `Marked PRESENT at ${fmtTime(r.checked_in_at)}` });
    } catch (e) {
      if (e.status === 409) setResult({ kind: 'warn', title: 'Already checked in', holder: e.data?.holder, detail: `Already checked in at ${fmtTime(e.data?.checked_in_at)}` });
      else setResult({ kind: 'err', title: e.status === 404 ? 'Invalid QR code' : 'Rejected', detail: e.message });
    } finally { setTimeout(() => (busy.current = false), 800); }
  };
  const submitRef = useRef(submit);
  submitRef.current = submit;

  useEffect(() => {
    const scanner = new Html5Qrcode('reader');
    const started = scanner
      .start({ facingMode: 'environment' }, { fps: 10, qrbox: { width: 240, height: 240 } }, (text) => submitRef.current(text.trim()), () => {})
      .catch(() => setCamError('Could not access the camera. Allow camera permission (HTTPS or localhost required) or use manual entry below.'));
    return () => { started.then(() => scanner.stop()).then(() => scanner.clear()).catch(() => {}); };
  }, []);

  const styles = { ok: 'border-emerald-400 bg-emerald-50 text-emerald-800', warn: 'border-amber-400 bg-amber-50 text-amber-800', err: 'border-red-400 bg-red-50 text-red-800' };

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-extrabold">QR Scanner</h1>
      <div><label className="label">Event being scanned</label>
        <select className="input" value={eventRef.current} onChange={(e) => { setEventId(e.target.value); setResult(null); }}>
          {events.data?.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}
        </select></div>
      <div className="card overflow-hidden p-2"><div id="reader" className="w-full" />
        {camError && <p className="p-3 text-sm text-red-600">{camError}</p>}</div>
      {result && (
        <div className={`rounded-xl border-2 p-5 ${styles[result.kind]}`}>
          <p className="text-xl font-extrabold">{result.title}</p>
          {result.holder && <p className="mt-1 text-lg font-semibold">{result.holder}</p>}
          <p className="mt-1">{result.detail}</p>
        </div>
      )}
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (manual.trim()) { submit(manual.trim()); setManual(''); } }}>
        <input className="input" placeholder="Or paste pass token manually" value={manual} onChange={(e) => setManual(e.target.value)} />
        <button className="btn-ghost">Check in</button>
      </form>
    </div>
  );
}
