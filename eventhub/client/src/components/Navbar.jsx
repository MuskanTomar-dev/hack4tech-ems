import { Link, NavLink } from 'react-router-dom';

export default function Navbar() {
  const cls = ({ isActive }) => `rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link to="/" className="text-xl font-extrabold text-brand-600">Event<span className="text-slate-800">Hub</span></Link>
        <nav className="flex items-center gap-1">
          <NavLink to="/" end className={cls}>Events</NavLink>
          <NavLink to="/my-pass" className={cls}>Get My Pass</NavLink>
          <NavLink to="/admin" className={cls}>Admin</NavLink>
        </nav>
      </div>
    </header>
  );
}
