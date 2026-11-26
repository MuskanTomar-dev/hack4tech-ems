import { useMemo, useState } from 'react';
import { api, downloadFile, fmtDate, fmtTime, useFetch } from '../../api';
import { useToast } from '../../components/Toast.jsx';
import { ErrorBox, Spinner, StatusBadge } from '../../components/ui.jsx';

export default function Registrations() {
  const toast = useToast();
  const events = useFetch('/admin/events', { auth: true });
  const [eventId, setEventId] = useState('');
  const sel = eventId || events.data?.[0]?.id || '';
  const regs = useFetch(sel ? `/admin/events/${sel}/registrations` : null, { auth: true, interval: 5000 });
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('all');

  const rows = useMemo(() => (regs.data || []).filter((r) =>
    (status === 'all' || (status === 'none' ? !r.status : r.status === status)) &&
    `${r.team_name || ''} ${r.leader_name} ${r.email} ${r.phone || ''} ${r.college || ''} ${r.members.map((m) => m.name + m.email).join(' ')}`.toLowerCase().includes(q.toLowerCase())), [regs.data, q, status]);

  const mark = async (r, s) => {
    try { await api(`/admin/attendance/${r.id}`, { method: 'PATCH', body: { status: s }, auth: true }); toast(`${r.team_name || r.leader_name} marked ${s}`); regs.reload(); }
    catch (e) { toast(e.message, 'error'); }
  };
  const exp = async (fmt) => {
    try { await downloadFile(`/admin/events/${sel}/export?format=${fmt}`, `attendance.${fmt}`); }
    catch (e) { toast(e.message, 'error'); }
  };

  if (events.loading) return <Spinner />;
  if (events.error) return <ErrorBox message={events.error} onRetry={events.reload} />;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold">Registrations</h1>
        <div className="flex gap-2"><button className="btn-ghost" disabled={!sel} onClick={() => exp('csv')}>Export CSV</button><button className="btn-primary" disabled={!sel} onClick={() => exp('xlsx')}>Export Excel</button></div>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <select className="input sm:w-72" value={sel} onChange={(e) => setEventId(e.target.value)}>{events.data.map((e) => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
        <input className="input sm:flex-1" placeholder="Search name, email, college…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-44" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option><option value="present">Present</option><option value="late">Late</option><option value="absent">Absent</option><option value="none">Not marked</option>
        </select>
      </div>
      {regs.loading && <Spinner />}
      {regs.error && <ErrorBox message={regs.error} onRetry={regs.reload} />}
      {regs.data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Participant / Team</th><th>Contact</th><th>Registered</th><th>Status</th><th>Check-in</th><th className="pr-3">Mark</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t border-slate-100 align-top">
                  <td className="p-3"><p className="font-medium">{r.team_name || r.leader_name}</p>
                    {r.team_name && <p className="text-xs text-slate-500">Leader: {r.leader_name}</p>}
                    {r.members.map((m, i) => <p key={i} className="text-xs text-slate-500">• {m.name} ({m.email})</p>)}</td>
                  <td><p>{r.email}</p><p className="text-xs text-slate-500">{r.phone} {r.college && `· ${r.college}`}</p></td>
                  <td className="whitespace-nowrap">{fmtDate(r.created_at)}</td>
                  <td><StatusBadge status={r.status} /></td>
                  <td>{fmtTime(r.checked_in_at)}</td>
                  <td className="whitespace-nowrap pr-3">
                    {[['present', 'P'], ['late', 'L'], ['absent', 'A']].map(([s, l]) => (
                      <button key={s} title={`Mark ${s}`} onClick={() => mark(r, s)} className={`mr-1 h-8 w-8 rounded-md border text-xs font-bold ${r.status === s ? 'border-brand-600 bg-brand-600 text-white' : 'border-slate-300 hover:bg-slate-100'}`}>{l}</button>
                    ))}
                  </td>
                </tr>
              ))}
              {!rows.length && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No registrations found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs text-slate-400">P = Present · L = Late · A = Absent. Table refreshes every 5 seconds.</p>
    </div>
  );
}
