import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { getToken, setToken } from '../../api';

export default function AdminLayout() {
  const nav = useNavigate();
  if (!getToken()) return <Navigate to="/admin/login" replace />;
  const cls = ({ isActive }) => `whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium ${isActive ? 'bg-brand-100 text-brand-700' : 'text-slate-600 hover:bg-slate-100'}`;
  const logout = () => { setToken(null); nav('/admin/login'); };
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-3">
          <Link to="/admin" className="text-lg font-extrabold text-brand-600">EventHub <span className="text-slate-400">Admin</span></Link>
          <nav className="flex items-center gap-1 overflow-x-auto">
            <NavLink to="/admin" end className={cls}>Dashboard</NavLink>
            <NavLink to="/admin/events" className={cls}>Events</NavLink>
            <NavLink to="/admin/registrations" className={cls}>Registrations</NavLink>
            <NavLink to="/admin/scanner" className={cls}>Scanner</NavLink>
            <button onClick={logout} className="btn-ghost !py-1.5">Logout</button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
    </>
  );
}
