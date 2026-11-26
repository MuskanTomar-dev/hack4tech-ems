import { fmtTime, useFetch } from '../../api';
import { ErrorBox, Spinner, StatusBadge } from '../../components/ui.jsx';

const Stat = ({ label, value, color }) => (
  <div className="card p-5"><p className="label">{label}</p><p className={`text-3xl font-extrabold ${color}`}>{value}</p></div>
);

export default function Dashboard() {
  const { data: s, error, loading, reload } = useFetch('/admin/stats', { auth: true, interval: 5000 });
  if (loading) return <Spinner />;
  if (error && !s) return <ErrorBox message={error} onRetry={reload} />;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold">Dashboard</h1>
        <span className="flex items-center gap-2 text-xs text-slate-500"><span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" /> Live · refreshes every 5s</span>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Total events" value={s.total_events} color="text-brand-600" />
        <Stat label="Registrations" value={s.total_registrations} color="text-sky-600" />
        <Stat label="Checked in" value={s.checked_in} color="text-emerald-600" />
        <Stat label="Absent" value={s.absent} color="text-red-600" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="card overflow-x-auto p-5 lg:col-span-2">
          <h2 className="mb-3 font-bold">Attendance by event</h2>
          <table className="w-full text-sm">
            <thead><tr className="text-left text-xs uppercase text-slate-500"><th className="pb-2">Event</th><th>Reg.</th><th>Present</th><th>Late</th><th>Absent</th><th className="w-32">Checked-in</th></tr></thead>
            <tbody>
              {s.events.map((e) => {
                const pct = e.registered ? Math.round(((e.present + e.late) / e.registered) * 100) : 0;
                return (
                  <tr key={e.id} className="border-t border-slate-100">
                    <td className="py-2 pr-2 font-medium">{e.title}</td><td>{e.registered}</td><td>{e.present}</td><td>{e.late}</td><td>{e.absent}</td>
                    <td><div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-emerald-500" style={{ width: `${pct}%` }} /></div><span className="text-xs text-slate-500">{pct}%</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
        <section className="card p-5">
          <h2 className="mb-3 font-bold">Recent check-ins</h2>
          {s.recent.length === 0 && <p className="text-sm text-slate-500">No check-ins yet.</p>}
          <ul className="space-y-3">
            {s.recent.map((r, i) => (
              <li key={i} className="flex items-start justify-between gap-2 text-sm">
                <div><p className="font-medium">{r.holder}</p><p className="text-xs text-slate-500">{r.title}</p></div>
                <div className="text-right"><StatusBadge status={r.status} /><p className="mt-1 text-xs text-slate-500">{fmtTime(r.checked_in_at)}</p></div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
