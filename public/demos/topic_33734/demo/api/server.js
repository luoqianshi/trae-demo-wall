import express from 'express';
import cors from 'cors';
import { authRouter } from './routes/auth.js';
import { coursesRouter } from './routes/courses.js';
import { progressRouter } from './routes/progress.js';
import { communityRouter } from './routes/community.js';
import { achievementsRouter } from './routes/achievements.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'LinguaHub API running' });
});

app.use('/api/auth', authRouter);
app.use('/api/courses', coursesRouter);
app.use('/api/progress', progressRouter);
app.use('/api/community', communityRouter);
app.use('/api/achievements', achievementsRouter);

app.listen(PORT, () => {
  console.log(`LinguaHub API server listening on http://localhost:${PORT}`);
});
