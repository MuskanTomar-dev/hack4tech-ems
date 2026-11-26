import { Link } from 'react-router-dom';
import { fmtDate } from '../api';
import { TypeBadge } from './ui';

export default function EventCard({ e }) {
  const full = e.seats_left === 0;
  return (
    <Link to={`/events/${e.id}`} className="card group overflow-hidden transition hover:shadow-md">
      <div className="h-40 bg-gradient-to-br from-brand-500 to-purple-600">
        {e.banner_url && <img src={e.banner_url} alt="" loading="lazy" className="h-full w-full object-cover transition group-hover:scale-105" onError={(ev) => (ev.currentTarget.style.display = 'none')} />}
      </div>
      <div className="space-y-2 p-4">
        <div className="flex items-center justify-between"><TypeBadge type={e.type} />
          <span className={`text-xs font-semibold ${full || !e.registration_open ? 'text-red-600' : 'text-emerald-600'}`}>
            {!e.registration_open ? 'Closed' : full ? 'Full' : `${e.seats_left} seats left`}
          </span>
        </div>
        <h3 className="text-lg font-bold leading-snug">{e.title}</h3>
        <p className="text-sm text-slate-500">📅 {fmtDate(e.date_time)}</p>
        <p className="text-sm text-slate-500">📍 {e.venue}</p>
      </div>
    </Link>
  );
}
