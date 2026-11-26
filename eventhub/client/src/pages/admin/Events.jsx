import { useState } from 'react';
import { api, fmtDate, useFetch } from '../../api';
import { useToast } from '../../components/Toast.jsx';
import { ErrorBox, Spinner, TypeBadge } from '../../components/ui.jsx';

const toLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
const blank = { title: '', description: '', schedule: '', rules: '', date_time: '', venue: '', banner_url: '', type: 'individual', min_team_size: 1, max_team_size: 1, capacity: 100, registration_open: true };

function EventForm({ initial, onClose, onSaved }) {
  const toast = useToast();
  const [f, setF] = useState(initial ? { ...initial, date_time: toLocal(initial.date_time) } : blank);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const body = { ...f, date_time: f.date_time ? new Date(f.date_time).toISOString() : '', min_team_size: +f.min_team_size, max_team_size: +f.max_team_size, capacity: +f.capacity };
      delete body.id; delete body.registered; delete body.created_at;
      await api(initial ? `/admin/events/${initial.id}` : '/admin/events', { method: initial ? 'PUT' : 'POST', body, auth: true });
      toast(initial ? 'Event updated' : 'Event created');
      onSaved();
    } catch (err) { toast(err.message, 'error'); }
    finally { setBusy(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4">
      <form onSubmit={submit} className="card my-8 w-full max-w-2xl space-y-4 p-6">
        <h2 className="text-xl font-bold">{initial ? 'Edit event' : 'New event'}</h2>
        <div><label className="label">Title</label><input required className="input" value={f.title} onChange={set('title')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Date & time</label><input required type="datetime-local" className="input" value={f.date_time} onChange={set('date_time')} /></div>
          <div><label className="label">Venue</label><input required className="input" value={f.venue} onChange={set('venue')} /></div>
          <div><label className="label">Type</label><select className="input" value={f.type} onChange={set('type')}><option value="individual">Individual</option><option value="team">Team</option></select></div>
          <div><label className="label">Capacity (registrations)</label><input required type="number" min="1" className="input" value={f.capacity} onChange={set('capacity')} /></div>
          {f.type === 'team' && <>
            <div><label className="label">Min team size</label><input type="number" min="1" className="input" value={f.min_team_size} onChange={set('min_team_size')} /></div>
            <div><label className="label">Max team size</label><input type="number" min="1" className="input" value={f.max_team_size} onChange={set('max_team_size')} /></div>
          </>}
        </div>
        <div><label className="label">Banner URL</label><input className="input" placeholder="https://…" value={f.banner_url} onChange={set('banner_url')} /></div>
        <div><label className="label">Description</label><textarea rows="3" className="input" value={f.description} onChange={set('description')} /></div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label className="label">Schedule (one item per line)</label><textarea rows="4" className="input" value={f.schedule} onChange={set('schedule')} /></div>
          <div><label className="label">Rules (one per line)</label><textarea rows="4" className="input" value={f.rules} onChange={set('rules')} /></div>
        </div>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.registration_open} onChange={set('registration_open')} /> Registration open</label>
        <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save event'}</button></div>
      </form>
    </div>
  );
}

export default function AdminEvents() {
  const toast = useToast();
  const { data, error, loading, reload } = useFetch('/admin/events', { auth: true });
  const [editing, setEditing] = useState(null); // null | 'new' | event

  const remove = async (e) => {
    if (!confirm(`Delete "${e.title}" and its ${e.registered} registrations? This cannot be undone.`)) return;
    try { await api(`/admin/events/${e.id}`, { method: 'DELETE', auth: true }); toast('Event deleted'); reload(); }
    catch (err) { toast(err.message, 'error'); }
  };
  const toggle = async (e) => {
    try {
      const { id, registered, created_at, ...rest } = e;
      await api(`/admin/events/${id}`, { method: 'PUT', body: { ...rest, registration_open: !e.registration_open }, auth: true });
      reload();
    } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-extrabold">Events</h1><button className="btn-primary" onClick={() => setEditing('new')}>+ New event</button></div>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} onRetry={reload} />}
      {data && (
        <div className="card overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500"><tr><th className="p-3">Event</th><th>Date</th><th>Type</th><th>Registered</th><th>Status</th><th className="pr-3 text-right">Actions</th></tr></thead>
            <tbody>
              {data.map((e) => (
                <tr key={e.id} className="border-t border-slate-100">
                  <td className="p-3"><p className="font-medium">{e.title}</p><p className="text-xs text-slate-500">{e.venue}</p></td>
                  <td>{fmtDate(e.date_time)}</td><td><TypeBadge type={e.type} /></td><td>{e.registered}/{e.capacity}</td>
                  <td><button onClick={() => toggle(e)} className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${e.registration_open ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{e.registration_open ? 'Open' : 'Closed'}</button></td>
                  <td className="space-x-2 whitespace-nowrap pr-3 text-right"><button className="btn-ghost !py-1" onClick={() => setEditing(e)}>Edit</button><button className="btn-danger !py-1" onClick={() => remove(e)}>Delete</button></td>
                </tr>
              ))}
              {!data.length && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No events yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      {editing && <EventForm initial={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); reload(); }} />}
    </div>
  );
}
