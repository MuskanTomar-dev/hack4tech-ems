import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { v4 as uuid } from 'uuid';
import { z } from 'zod';
import { db } from '../db.js';
import { httpError, parse } from '../util.js';

const r = Router();
const limiter = (max) => rateLimit({ windowMs: 15 * 60 * 1000, max, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many requests, try again later' } });

const EVENT_SQL = `SELECT e.*, (SELECT COUNT(*) FROM registrations x WHERE x.event_id = e.id) AS registered FROM events e`;
const shape = (e) => ({ ...e, registration_open: !!e.registration_open, seats_left: Math.max(e.capacity - e.registered, 0) });

r.get('/events', (_req, res) => {
  const since = new Date(Date.now() - 6 * 3600 * 1000).toISOString();
  res.json(db.prepare(`${EVENT_SQL} WHERE e.date_time >= ? ORDER BY e.date_time`).all(since).map(shape));
});

r.get('/events/:id', (req, res) => {
  const e = db.prepare(`${EVENT_SQL} WHERE e.id = ?`).get(req.params.id);
  if (!e) throw httpError(404, 'Event not found');
  res.json(shape(e));
});

const email = z.string().trim().toLowerCase().email('invalid email').max(120);
const name = z.string().trim().min(2, 'too short').max(80);
const phone = z.string().trim().regex(/^\+?[\d\s-]{7,18}$/, 'invalid phone number');
const college = z.string().trim().min(2, 'too short').max(120);
const individualSchema = z.object({ name, email, phone, college });
const teamSchema = z.object({
  team_name: z.string().trim().min(2).max(80),
  leader_name: name,
  email,
  phone: phone.optional().or(z.literal('')),
  college: college.optional().or(z.literal('')),
  members: z.array(z.object({ name, email })).max(49).default([]),
});

const PASS_SQL = `SELECT r.id, r.type, r.team_name, r.leader_name, r.email, r.pass_token, r.created_at,
  e.id AS event_id, e.title, e.date_time, e.venue
  FROM registrations r JOIN events e ON e.id = r.event_id`;
const toPass = (p) => ({ ...p, holder: p.team_name || p.leader_name });

r.post('/events/:id/register', limiter(30), (req, res) => {
  const ev = db.prepare('SELECT * FROM events WHERE id = ?').get(req.params.id);
  if (!ev) throw httpError(404, 'Event not found');
  if (!ev.registration_open) throw httpError(403, 'Registration is closed for this event');

  let d, members = [];
  if (ev.type === 'team') {
    d = parse(teamSchema, req.body);
    members = d.members;
    // team size includes the leader
    const total = members.length + 1;
    if (total < ev.min_team_size || total > ev.max_team_size)
      throw httpError(400, `Team size (including leader) must be between ${ev.min_team_size} and ${ev.max_team_size}`);
    const emails = [d.email, ...members.map((m) => m.email)];
    if (new Set(emails).size !== emails.length) throw httpError(400, 'Duplicate email addresses within the team');
  } else {
    d = parse(individualSchema, req.body);
    d.leader_name = d.name;
  }

  const token = uuid();
  const tx = db.transaction(() => {
    const count = db.prepare('SELECT COUNT(*) c FROM registrations WHERE event_id = ?').get(ev.id).c;
    if (count >= ev.capacity) throw httpError(409, 'Sorry, this event is full');
    const dup = db.prepare('SELECT 1 FROM registrations WHERE event_id = ? AND lower(email) = ?').get(ev.id, d.email);
    if (dup) throw httpError(409, 'This email is already registered for this event');
    const info = db
      .prepare(`INSERT INTO registrations (event_id, type, team_name, leader_name, email, phone, college, pass_token)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .run(ev.id, ev.type, ev.type === 'team' ? d.team_name : null, d.leader_name, d.email, d.phone || null, d.college || null, token);
    const ins = db.prepare('INSERT INTO team_members (registration_id, name, email) VALUES (?, ?, ?)');
    members.forEach((m) => ins.run(info.lastInsertRowid, m.name, m.email));
    return info.lastInsertRowid;
  });
  const id = tx();
  res.status(201).json(toPass(db.prepare(`${PASS_SQL} WHERE r.id = ?`).get(id)));
});

r.get('/passes', limiter(60), (req, res) => {
  const { email: raw } = parse(z.object({ email }), { email: req.query.email });
  const rows = db.prepare(`${PASS_SQL} WHERE lower(r.email) = ? ORDER BY e.date_time`).all(raw);
  res.json(rows.map(toPass));
});

export default r;
