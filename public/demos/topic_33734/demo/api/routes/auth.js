import express from 'express';
import { readStore, writeStore, uid } from '../lib/store.js';

const router = express.Router();

router.post('/register', (req, res) => {
  const { username, email, password } = req.body || {};
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Username, email and password are required' });
  }
  const users = readStore('users', []);
  if (users.find((u) => u.email === email)) {
    return res.status(400).json({ error: 'Email already registered' });
  }
  const user = {
    id: uid(),
    username,
    email,
    password,
    avatar: `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(username)}`,
    level: 1,
    xp: 0,
    streak: 0,
    lastActive: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    preferences: { languages: ['en'], dailyGoal: 20 },
  };
  users.push(user);
  writeStore('users', users);
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser, token: 'demo-token-' + user.id });
});

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};
  const users = readStore('users', []);
  const user = users.find((u) => u.email === email && u.password === password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }
  user.lastActive = new Date().toISOString();
  writeStore('users', users);
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser, token: 'demo-token-' + user.id });
});

router.get('/profile/:id', (req, res) => {
  const users = readStore('users', []);
  const user = users.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ error: 'Not found' });
  const { password: _pw, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.patch('/profile/:id', (req, res) => {
  const users = readStore('users', []);
  const idx = users.findIndex((u) => u.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  users[idx] = { ...users[idx], ...req.body, id: users[idx].id };
  writeStore('users', users);
  const { password: _pw, ...safeUser } = users[idx];
  res.json({ user: safeUser });
});

export { router as authRouter };
