import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import './db.js';
import { secret } from './auth.js';
import publicRoutes from './routes/public.js';
import adminRoutes from './routes/admin.js';

secret(); // fail fast if missing
const app = express();
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: process.env.CLIENT_ORIGIN || true }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/admin', adminRoutes);
app.use('/api', publicRoutes);

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid JSON' });
  if (!err.status) console.error(err);
  res.status(err.status || 500).json({ error: err.status ? err.message : 'Server error', ...(err.extra || {}) });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`EventHub API running on http://localhost:${port}`));
