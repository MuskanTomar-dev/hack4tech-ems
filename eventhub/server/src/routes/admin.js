import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import ExcelJS from 'exceljs';
import { z } from 'zod';
import { db } from '../db.js';
import { requireAdmin, signToken } from '../auth.js';
import { httpError, parse } from '../util.js';

const r = Router();
const DUMMY_HASH = bcrypt.hashSync('dummy-password', 10);

r.post(
  '/login',
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many login attempts, try again in 15 minutes' } }),
  (req, res) => {
    const { username, password } = parse(z.object({ username: z.string().min(1).max(60), password: z.string().min(1).max(200) }), req.body);
    const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
    const ok = bcrypt.compareSync(password, admin ? admin.password_hash : DUMMY_HASH);
    if (!admin || !ok) throw httpError(401, 'Invalid username or password');
    res.json({ token: signToken(admin), username: admin.username });
  }
);

r.use(requireAdmin);

// ---------- Events ----------
const eventSchema = z
  .object({
    title: z.string().trim().min(3).max(120),
    description: z.string().max(5000).default(''),
    schedule: z.string().max(3000).default(''),
    rules: z.string().max(3000).default(''),
    date_time: z.string().refine((s) => !isNaN(Date.parse(s)), 'invalid date'),
    venue: z.string().trim().min(2).max(160),
    banner_url: z.string().trim().max(500).refine((v) => v === '' || /^https?:\/\//i.test(v), 'must be an http(s) URL').default(''),
    type: z.enum(['individual', 'team']),
    min_team_size: z.coerce.number().int().min(1).max(50).default(1),
    max_team_size: z.coerce.number().int().min(1).max(50).default(1),
    capacity: z.coerce.number().int().min(1).max(100000),
    registration_open: z.boolean().default(true),
  })
  .refine((e) => e.max_team_size >= e.min_team_size, { message: 'max team size must be >= min', path: ['max_team_size'] });

const normalize = (e) => ({
  ...e,
  date_time: new Date(e.date_time).toISOString(),
  ...(e.type === 'individual' ? { min_team_size: 1, max_team_size: 1 } : {}),
  registration_open: e.registration_open ? 1 : 0,
});
const COLS = ['title', 'description', 'schedule', 'rules', 'date_time', 'venue', 'banner_url', 'type', 'min_team_size', 'max_team_size', 'capacity', 'registration_open'];
const EV_LIST = `SELECT e.*, (SELECT COUNT(*) FROM registrations x WHERE x.event_id = e.id) AS registered FROM events e`;
const asBool = (e) => ({ ...e, registration_open: !!e.registration_open });

r.get('/events', (_req, res) => res.json(db.prepare(`${EV_LIST} ORDER BY e.date_time DESC`).all().map(asBool)));
r.get('/events/:id', (req, res) => {
  const e = db.prepare(`${EV_LIST} WHERE e.id = ?`).get(req.params.id);
  if (!e) throw httpError(404, 'Event not found');
  res.json(asBool(e));
});
r.post('/events', (req, res) => {
  const e = normalize(parse(eventSchema, req.body));
  const info = db.prepare(`INSERT INTO events (${COLS.join(',')}) VALUES (${COLS.map((c) => '@' + c).join(',')})`).run(e);
  res.status(201).json(asBool(db.prepare(`${EV_LIST} WHERE e.id = ?`).get(info.lastInsertRowid)));
});
r.put('/events/:id', (req, res) => {
  if (!db.prepare('SELECT 1 FROM events WHERE id = ?').get(req.params.id)) throw httpError(404, 'Event not found');
  const e = normalize(parse(eventSchema, req.body));
  db.prepare(`UPDATE events SET ${COLS.map((c) => `${c} = @${c}`).join(', ')} WHERE id = @id`).run({ ...e, id: Number(req.params.id) });
  res.json(asBool(db.prepare(`${EV_LIST} WHERE e.id = ?`).get(req.params.id)));
});
r.delete('/events/:id', (req, res) => {
  const info = db.prepare('DELETE FROM events WHERE id = ?').run(req.params.id);
  if (!info.changes) throw httpError(404, 'Event not found');
  res.json({ ok: true });
});

// ---------- Registrations ----------
const REG_SQL = `SELECT r.id, r.event_id, r.type, r.team_name, r.leader_name, r.email, r.phone, r.college, r.created_at,
  a.status, a.checked_in_at, a.marked_by,
  (SELECT json_group_array(json_object('name', m.name, 'email', m.email)) FROM team_members m WHERE m.registration_id = r.id) AS members
  FROM registrations r LEFT JOIN attendance a ON a.registration_id = r.id WHERE r.event_id = ? ORDER BY r.created_at DESC`;
const regRows = (eventId) => db.prepare(REG_SQL).all(eventId).map((x) => ({ ...x, members: JSON.parse(x.members || '[]') }));

r.get('/events/:id/registrations', (req, res) => {
  if (!db.prepare('SELECT 1 FROM events WHERE id = ?').get(req.params.id)) throw httpError(404, 'Event not found');
  res.json(regRows(req.params.id));
});

// ---------- Attendance ----------
const upsertAttendance = db.prepare(`INSERT INTO attendance (registration_id, status, checked_in_at, marked_by) VALUES (@rid, @status, @at, @by)
  ON CONFLICT(registration_id) DO UPDATE SET status = excluded.status, checked_in_at = excluded.checked_in_at, marked_by = excluded.marked_by`);

r.post('/scan', (req, res) => {
  const { event_id, token } = parse(z.object({ event_id: z.coerce.number().int(), token: z.string().trim().min(8).max(100) }), req.body);
  const reg = db.prepare('SELECT * FROM registrations WHERE pass_token = ?').get(token);
  if (!reg) throw httpError(404, 'Invalid QR code – no matching pass found');
  if (reg.event_id !== event_id) {
    const other = db.prepare('SELECT title FROM events WHERE id = ?').get(reg.event_id);
    throw httpError(400, `Wrong event – this pass is for "${other?.title}"`);
  }
  const holder = reg.team_name || reg.leader_name;
  const att = db.prepare('SELECT * FROM attendance WHERE registration_id = ?').get(reg.id);
  if (att && att.checked_in_at && att.status !== 'absent')
    throw httpError(409, 'Already checked in', { already: true, checked_in_at: att.checked_in_at, holder, status: att.status });
  const at = new Date().toISOString();
  upsertAttendance.run({ rid: reg.id, status: 'present', at, by: req.admin.username });
  res.json({ ok: true, holder, checked_in_at: at, status: 'present', email: reg.email });
});

r.patch('/attendance/:registrationId', (req, res) => {
  const { status } = parse(z.object({ status: z.enum(['present', 'absent', 'late']) }), req.body);
  if (!db.prepare('SELECT 1 FROM registrations WHERE id = ?').get(req.params.registrationId)) throw httpError(404, 'Registration not found');
  const at = status === 'absent' ? null : new Date().toISOString();
  upsertAttendance.run({ rid: Number(req.params.registrationId), status, at, by: req.admin.username });
  res.json({ ok: true, status, checked_in_at: at });
});

// ---------- Stats ----------
r.get('/stats', (_req, res) => {
  const one = (sql) => db.prepare(sql).get().c;
  const events = db
    .prepare(`SELECT e.id, e.title, e.capacity, COUNT(r.id) AS registered,
      COALESCE(SUM(a.status = 'present'), 0) AS present, COALESCE(SUM(a.status = 'late'), 0) AS late, COALESCE(SUM(a.status = 'absent'), 0) AS absent
      FROM events e LEFT JOIN registrations r ON r.event_id = e.id LEFT JOIN attendance a ON a.registration_id = r.id
      GROUP BY e.id ORDER BY e.date_time`)
    .all();
  const recent = db
    .prepare(`SELECT COALESCE(r.team_name, r.leader_name) AS holder, e.title, a.status, a.checked_in_at, a.marked_by
      FROM attendance a JOIN registrations r ON r.id = a.registration_id JOIN events e ON e.id = r.event_id
      WHERE a.checked_in_at IS NOT NULL ORDER BY a.checked_in_at DESC LIMIT 10`)
    .all();
  res.json({
    total_events: one('SELECT COUNT(*) c FROM events'),
    total_registrations: one('SELECT COUNT(*) c FROM registrations'),
    checked_in: one("SELECT COUNT(*) c FROM attendance WHERE status IN ('present','late')"),
    absent: one("SELECT COUNT(*) c FROM attendance WHERE status = 'absent'"),
    events,
    recent,
  });
});

// ---------- Export ----------
const csvCell = (v) => {
  let s = v == null ? '' : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; // formula-injection guard
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

r.get('/events/:id/export', async (req, res) => {
  const format = req.query.format === 'xlsx' ? 'xlsx' : 'csv';
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!ev) throw httpError(404, 'Event not found');
  const header = ['Reg ID', 'Type', 'Team / Participant', 'Leader / Name', 'Email', 'Phone', 'College', 'Team Members', 'Registered At', 'Attendance', 'Check-in Time', 'Marked By'];
  const rows = regRows(ev.id).map((x) => [
    x.id, x.type, x.team_name || x.leader_name, x.leader_name, x.email, x.phone || '', x.college || '',
    x.members.map((m) => `${m.name} <${m.email}>`).join('; '), x.created_at, x.status || 'not marked', x.checked_in_at || '', x.marked_by || '',
  ]);
  const base = `${ev.title.replace(/[^\w-]+/g, '_').slice(0, 40)}_attendance`;

  if (format === 'csv') {
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${base}.csv"`);
    return res.send('\uFEFF' + [header, ...rows].map((row) => row.map(csvCell).join(',')).join('\r\n'));
  }
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Attendance');
  ws.addRow(header).font = { bold: true };
  rows.forEach((row) => ws.addRow(row));
  ws.columns.forEach((c) => (c.width = 22));
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${base}.xlsx"`);
  await wb.xlsx.write(res);
  res.end();
});

export default r;
