import { Link, useParams } from 'react-router-dom';
import { fmtDate, useFetch } from '../api';
import { ErrorBox, Spinner, TypeBadge } from '../components/ui.jsx';

const Section = ({ title, text }) => text ? (
  <section className="card p-5">
    <h2 className="mb-2 text-lg font-bold">{title}</h2>
    <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{text}</p>
  </section>
) : null;

export default function EventDetail() {
  const { id } = useParams();
  const { data: e, error, loading, reload } = useFetch(`/events/${id}`);
  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const canRegister = e.registration_open && e.seats_left > 0;
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-5 lg:col-span-2">
        <div className="h-56 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-500 to-purple-600 sm:h-72">
          {e.banner_url && <img src={e.banner_url} alt="" className="h-full w-full object-cover" onError={(ev) => (ev.currentTarget.style.display = 'none')} />}
        </div>
        <div className="flex items-center gap-3"><TypeBadge type={e.type} />
          {e.type === 'team' && <span className="text-sm text-slate-500">Team size {e.min_team_size}–{e.max_team_size} (incl. leader)</span>}</div>
        <h1 className="text-3xl font-extrabold">{e.title}</h1>
        <Section title="About" text={e.description} />
        <Section title="Schedule" text={e.schedule} />
        <Section title="Rules" text={e.rules} />
      </div>
      <aside className="card h-fit space-y-4 p-5 lg:sticky lg:top-20">
        <div><p className="label">When</p><p className="font-medium">{fmtDate(e.date_time)}</p></div>
        <div><p className="label">Venue</p><p className="font-medium">{e.venue}</p></div>
        <div><p className="label">Seats</p><p className="font-medium">{e.seats_left} of {e.capacity} left</p>
          <div className="mt-2 h-2 rounded bg-slate-100"><div className="h-2 rounded bg-brand-500" style={{ width: `${Math.min(100, (e.registered / e.capacity) * 100)}%` }} /></div></div>
        {canRegister
          ? <Link to={`/events/${e.id}/register`} className="btn-primary w-full">Register now</Link>
          : <button className="btn-primary w-full" disabled>{e.registration_open ? 'Event is full' : 'Registration closed'}</button>}
        <Link to="/my-pass" className="block text-center text-sm text-brand-600 hover:underline">Already registered? Get my pass</Link>
      </aside>
    </div>
  );
}
