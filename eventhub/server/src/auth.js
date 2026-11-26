import jwt from 'jsonwebtoken';
import { httpError } from './util.js';

export const secret = () => {
  if (!process.env.JWT_SECRET) throw new Error('JWT_SECRET missing in server/.env');
  return process.env.JWT_SECRET;
};

export const signToken = (admin) =>
  jwt.sign({ sub: admin.id, username: admin.username }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });

export function requireAdmin(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) return next(httpError(401, 'Authentication required'));
  try {
    req.admin = jwt.verify(token, secret());
    next();
  } catch {
    next(httpError(401, 'Session expired, please log in again'));
  }
}
