import bcrypt from 'bcryptjs';
import { db } from './db.js';

const admin = db.prepare('SELECT 1 FROM admins WHERE username = ?').get('admin');
if (!admin) {
  db.prepare('INSERT INTO admins (username, password_hash) VALUES (?, ?)').run('admin', bcrypt.hashSync('admin123', 10));
  console.log('✔ Created admin  (username: admin / password: admin123)');
} else console.log('• Admin already exists');

if (db.prepare('SELECT COUNT(*) c FROM events').get().c === 0) {
  const day = (n, h) => { const d = new Date(); d.setDate(d.getDate() + n); d.setHours(h, 0, 0, 0); return d.toISOString(); };
  const ins = db.prepare(`INSERT INTO events (title, description, schedule, rules, date_time, venue, banner_url, type, min_team_size, max_team_size, capacity, registration_open)
    VALUES (@title, @description, @schedule, @rules, @date_time, @venue, @banner_url, @type, @min, @max, @capacity, 1)`);
  [
    {
      title: 'Hack4Tech 24h Hackathon', type: 'team', min: 2, max: 4, capacity: 60, date_time: day(10, 9), venue: 'Innovation Lab, Block A',
      banner_url: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?w=1200&q=70',
      description: 'A 24-hour build-a-thon where teams turn ideas into working prototypes. Mentors, snacks and prizes included.',
      schedule: '09:00 Check-in\n10:00 Kick-off & problem statements\n10:30 Hacking begins\n10:00 (next day) Final demos\n12:00 Results',
      rules: 'Teams of 2–4 (leader included).\nAll code must be written during the event.\nOpen-source libraries are allowed.\nBring your own laptop and charger.',
    },
    {
      title: 'AI & ML Workshop', type: 'individual', min: 1, max: 1, capacity: 80, date_time: day(5, 14), venue: 'Seminar Hall 2',
      banner_url: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1200&q=70',
      description: 'A hands-on introduction to machine learning with Python. Build and train your first model in one afternoon.',
      schedule: '14:00 Intro to ML\n15:00 Hands-on: training a classifier\n16:30 Q&A and wrap-up',
      rules: 'Bring a laptop with Python 3 installed.\nNo prior ML experience required.\nCarry a college ID card.',
    },
    {
      title: 'Code Rush – Competitive Programming', type: 'individual', min: 1, max: 1, capacity: 120, date_time: day(18, 11), venue: 'Computer Center, Lab 3',
      banner_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=1200&q=70',
      description: 'Solve algorithmic puzzles against the clock. Rankings are based on problems solved and penalty time.',
      schedule: '11:00 Briefing\n11:15 Contest starts (2 hours)\n13:30 Results & prizes',
      rules: 'Individual participation only.\nNo internet except the provided judge.\nC++, Java and Python are supported.',
    },
  ].forEach((e) => ins.run(e));
  console.log('✔ Created 3 sample events');
} else console.log('• Events already exist, skipping sample events');
