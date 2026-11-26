import { useMemo, useState } from 'react';
import { useFetch } from '../api';
import EventCard from '../components/EventCard.jsx';
import { ErrorBox, Spinner } from '../components/ui.jsx';

export default function Home() {
  const { data, error, loading, reload } = useFetch('/events');
  const [q, setQ] = useState('');
  const [type, setType] = useState('all');
  const [openOnly, setOpenOnly] = useState(false);

  const list = useMemo(() => (data || []).filter((e) =>
    (type === 'all' || e.type === type) &&
    (!openOnly || (e.registration_open && e.seats_left > 0)) &&
    `${e.title} ${e.venue} ${e.description}`.toLowerCase().includes(q.toLowerCase())), [data, q, type, openOnly]);

  return (
    <>
      <section className="mb-8 rounded-2xl bg-gradient-to-r from-brand-600 to-purple-600 p-8 text-white">
        <h1 className="text-3xl font-extrabold sm:text-4xl">Discover. Register. Show up.</h1>
        <p className="mt-2 max-w-xl text-indigo-100">Browse upcoming campus events, register in seconds and get a QR pass for instant check-in.</p>
      </section>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row">
        <input className="input sm:flex-1" placeholder="Search events, venues…" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="input sm:w-44" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">All types</option><option value="individual">Individual</option><option value="team">Team</option>
        </select>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={openOnly} onChange={(e) => setOpenOnly(e.target.checked)} /> Open only</label>
      </div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (list.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{list.map((e) => <EventCard key={e.id} e={e} />)}</div>
      ) : <p className="py-16 text-center text-slate-500">No events match your search.</p>)}
    </>
  );
}
