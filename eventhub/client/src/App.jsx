import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar.jsx';
import Home from './pages/Home.jsx';
import EventDetail from './pages/EventDetail.jsx';
import Register from './pages/Register.jsx';
import MyPass from './pages/MyPass.jsx';
import AdminLogin from './pages/admin/Login.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import Dashboard from './pages/admin/Dashboard.jsx';
import AdminEvents from './pages/admin/Events.jsx';
import Registrations from './pages/admin/Registrations.jsx';
import Scanner from './pages/admin/Scanner.jsx';

const PublicLayout = () => (
  <>
    <Navbar />
    <main className="mx-auto max-w-6xl px-4 py-8"><Outlet /></main>
  </>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/events/:id" element={<EventDetail />} />
        <Route path="/events/:id/register" element={<Register />} />
        <Route path="/my-pass" element={<MyPass />} />
      </Route>
      <Route path="/admin/login" element={<AdminLogin />} />
      <Route path="/admin" element={<AdminLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="events" element={<AdminEvents />} />
        <Route path="registrations" element={<Registrations />} />
        <Route path="scanner" element={<Scanner />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
