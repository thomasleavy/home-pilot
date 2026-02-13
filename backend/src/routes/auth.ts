import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { createUser, findUserByEmail, findUserByUsername, findUserById, deleteUser, updateUser, updateUserPassword } from '../db';
import { signToken, requireAuth } from '../middleware/auth';

const router = Router();
const SALT_ROUNDS = 10;

router.post('/register', (req: Request, res: Response) => {
  const { username, email, password } = req.body as { username?: string; email?: string; password?: string };
  if (!username || !email || !password || typeof username !== 'string' || typeof email !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Username, email and password required' });
    return;
  }
  const u = username.trim();
  const e = email.trim().toLowerCase();
  const p = password;
  if (u.length < 2) {
    res.status(400).json({ error: 'Username too short' });
    return;
  }
  if (p.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }
  if (findUserByUsername(u)) {
    res.status(409).json({ error: 'Username already taken' });
    return;
  }
  if (findUserByEmail(e)) {
    res.status(409).json({ error: 'Email already registered' });
    return;
  }
  const passwordHash = bcrypt.hashSync(p, SALT_ROUNDS);
  const user = createUser(u, e, passwordHash);
  const token = signToken({ userId: user.id, username: user.username, email: user.email });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.post('/login', (req: Request, res: Response) => {
  const { login, password } = req.body as { login?: string; password?: string };
  if (!login || !password || typeof login !== 'string' || typeof password !== 'string') {
    res.status(400).json({ error: 'Login (username or email) and password required' });
    return;
  }
  const user = login.includes('@') ? findUserByEmail(login.trim().toLowerCase()) : findUserByUsername(login.trim());
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ error: 'Invalid login or password' });
    return;
  }
  const token = signToken({ userId: user.id, username: user.username, email: user.email });
  res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
});

router.get('/me', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = findUserById(userId);
  if (!user) {
    res.status(401).json({ error: 'User not found or session invalid' });
    return;
  }
  res.json({ id: user.id, username: user.username, email: user.email });
});

router.patch('/profile', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { email } = req.body as { email?: string };
  const updates: { username?: string; email?: string } = {};
  if (email !== undefined && typeof email === 'string') updates.email = email;
  const updated = updateUser(userId, updates);
  if (!updated) {
    res.status(400).json({ error: 'Update failed (username/email may be taken or invalid)' });
    return;
  }
  const token = signToken({ userId: updated.id, username: updated.username, email: updated.email });
  res.json({ token, user: { id: updated.id, username: updated.username, email: updated.email } });
});

router.post('/change-password', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const { currentPassword, newPassword } = req.body as { currentPassword?: string; newPassword?: string };
  if (!currentPassword || !newPassword || typeof currentPassword !== 'string' || typeof newPassword !== 'string') {
    res.status(400).json({ error: 'Current password and new password required' });
    return;
  }
  const user = findUserById(userId);
  if (!user || !bcrypt.compareSync(currentPassword, user.password_hash)) {
    res.status(401).json({ error: 'Current password is incorrect' });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: 'New password must be at least 6 characters' });
    return;
  }
  const passwordHash = bcrypt.hashSync(newPassword, SALT_ROUNDS);
  if (!updateUserPassword(userId, passwordHash)) {
    res.status(500).json({ error: 'Failed to update password' });
    return;
  }
  res.json({ ok: true });
});

router.delete('/account', requireAuth, (req: Request, res: Response) => {
  const userId = req.user!.userId;
  deleteUser(userId);
  res.status(204).send();
});

export default router;
