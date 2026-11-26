import { useState } from 'react';
import { api } from '../api';
import { useToast } from '../components/Toast.jsx';
import { ErrorBox, Spinner } from '../components/ui.jsx';
import PassCard from '../components/PassCard.jsx';

export default function MyPass() {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [passes, setPasses] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const search = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setPasses(null);
    try { setPasses(await api(`/passes?email=${encodeURIComponent(email.trim())}`)); }
    catch (err) { setError(err.message); toast(err.message, 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="text-2xl font-extrabold">Get My Pass</h1>
      <p className="mb-4 text-slate-500">Enter the email you registered with to see all your passes.</p>
      <form onSubmit={search} className="mb-6 flex gap-2">
        <input type="email" required className="input" placeholder="you@college.edu" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn-primary" disabled={loading}>Find passes</button>
      </form>
      {loading && <Spinner />}
      {error && <ErrorBox message={error} />}
      {passes && (passes.length === 0
        ? <p className="py-10 text-center text-slate-500">No registrations found for this email.</p>
        : <div className="grid gap-5 md:grid-cols-2">{passes.map((p) => <PassCard key={p.id} pass={p} />)}</div>)}
    </div>
  );
}
