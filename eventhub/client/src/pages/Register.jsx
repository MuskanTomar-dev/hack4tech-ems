import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, useFetch } from '../api';
import { useToast } from '../components/Toast.jsx';
import { ErrorBox, Spinner } from '../components/ui.jsx';
import PassCard from '../components/PassCard.jsx';

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const phoneRe = /^\+?[\d\s-]{7,18}$/;

function Field({ label, error, ...props }) {
  return (
    <div>
      <label className="label">{label}</label>
      <input className={`input ${error ? 'border-red-400' : ''}`} {...props} />
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { id } = useParams();
  const toast = useToast();
  const { data: ev, error, loading, reload } = useFetch(`/events/${id}`);
  const [f, setF] = useState({ name: '', email: '', phone: '', college: '', team_name: '', leader_name: '' });
  const [members, setMembers] = useState(null);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [pass, setPass] = useState(null);

  if (loading) return <Spinner />;
  if (error) return <ErrorBox message={error} onRetry={reload} />;
  const team = ev.type === 'team';
  const minM = Math.max(ev.min_team_size - 1, 0), maxM = ev.max_team_size - 1;
  const rows = members ?? Array.from({ length: minM }, () => ({ name: '', email: '' }));
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setMember = (i, k, v) => setMembers(rows.map((m, j) => (j === i ? { ...m, [k]: v } : m)));

  if (pass) {
    return (
      <div className="mx-auto max-w-2xl space-y-4">
        <div className="rounded-lg bg-emerald-50 p-4 text-emerald-800">🎉 You're registered for <b>{ev.title}</b>! Download your pass and show the QR at the entrance.</div>
        <PassCard pass={pass} />
        <Link to="/" className="btn-ghost w-full">Back to events</Link>
      </div>
    );
  }

  const validate = () => {
    const e = {};
    if (team) {
      if (f.team_name.trim().length < 2) e.team_name = 'Enter a team name';
      if (f.leader_name.trim().length < 2) e.leader_name = 'Enter leader name';
      if (f.phone && !phoneRe.test(f.phone.trim())) e.phone = 'Invalid phone number';
      rows.forEach((m, i) => {
        if (m.name.trim().length < 2) e[`m${i}n`] = 'Required';
        if (!emailRe.test(m.email.trim())) e[`m${i}e`] = 'Valid email required';
      });
    } else {
      if (f.name.trim().length < 2) e.name = 'Enter your name';
      if (!phoneRe.test(f.phone.trim())) e.phone = 'Enter a valid phone number';
      if (f.college.trim().length < 2) e.college = 'Enter your college';
    }
    if (!emailRe.test(f.email.trim())) e.email = 'Enter a valid email';
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const e = validate();
    setErrs(e);
    if (Object.keys(e).length) return toast('Please fix the highlighted fields', 'error');
    setBusy(true);
    try {
      const body = team
        ? { team_name: f.team_name, leader_name: f.leader_name, email: f.email, phone: f.phone, college: f.college, members: rows }
        : { name: f.name, email: f.email, phone: f.phone, college: f.college };
      setPass(await api(`/events/${id}/register`, { method: 'POST', body }));
      toast('Registration successful!');
    } catch (err) {
      toast(err.message, 'error');
    } finally { setBusy(false); }
  };

  return (
    <form onSubmit={submit} noValidate className="card mx-auto max-w-2xl space-y-5 p-6">
      <div><h1 className="text-2xl font-extrabold">Register</h1><p className="text-slate-500">{ev.title}</p></div>
      {team ? (
        <>
          <Field label="Team name" value={f.team_name} onChange={set('team_name')} error={errs.team_name} />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Leader name" value={f.leader_name} onChange={set('leader_name')} error={errs.leader_name} />
            <Field label="Leader email" type="email" value={f.email} onChange={set('email')} error={errs.email} />
            <Field label="Phone (optional)" value={f.phone} onChange={set('phone')} error={errs.phone} />
            <Field label="College (optional)" value={f.college} onChange={set('college')} />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="label !mb-0">Team members ({rows.length + 1}/{ev.max_team_size} incl. leader)</p>
              <button type="button" className="btn-ghost !py-1" disabled={rows.length >= maxM} onClick={() => setMembers([...rows, { name: '', email: '' }])}>+ Add member</button>
            </div>
            <p className="mb-2 text-xs text-slate-500">Team size must be {ev.min_team_size}–{ev.max_team_size} including the leader.</p>
            <div className="space-y-3">
              {rows.map((m, i) => (
                <div key={i} className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <Field label={`Member ${i + 2} name`} value={m.name} onChange={(e) => setMember(i, 'name', e.target.value)} error={errs[`m${i}n`]} />
                  <Field label="Email" type="email" value={m.email} onChange={(e) => setMember(i, 'email', e.target.value)} error={errs[`m${i}e`]} />
                  <button type="button" disabled={rows.length <= minM} className="btn-ghost self-end text-red-600" onClick={() => setMembers(rows.filter((_, j) => j !== i))}>✕</button>
                </div>
              ))}
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" value={f.name} onChange={set('name')} error={errs.name} />
          <Field label="Email" type="email" value={f.email} onChange={set('email')} error={errs.email} />
          <Field label="Phone" value={f.phone} onChange={set('phone')} error={errs.phone} />
          <Field label="College" value={f.college} onChange={set('college')} error={errs.college} />
        </div>
      )}
      <button className="btn-primary w-full" disabled={busy}>{busy ? 'Registering…' : 'Complete registration'}</button>
    </form>
  );
}
