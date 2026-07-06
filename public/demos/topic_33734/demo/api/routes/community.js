import express from 'express';
import { readStore, writeStore, uid } from '../lib/store.js';

const router = express.Router();

router.get('/posts', (_req, res) => {
  const posts = readStore('posts', []);
  const users = readStore('users', []);
  const withAuthor = posts.map((p) => {
    const author = users.find((u) => u.id === p.authorId);
    return {
      ...p,
      author: author
        ? { id: author.id, username: author.username, avatar: author.avatar }
        : { id: p.authorId, username: '匿名', avatar: '' },
    };
  });
  withAuthor.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  res.json({ posts: withAuthor.slice(0, 50) });
});

router.post('/posts', (req, res) => {
  const { authorId, title, content, courseCode, tags = [] } = req.body || {};
  if (!authorId || !title || !content) {
    return res.status(400).json({ error: 'authorId, title and content are required' });
  }
  const posts = readStore('posts', []);
  const post = {
    id: uid(),
    authorId,
    title,
    content,
    courseCode: courseCode || null,
    tags,
    likes: [],
    comments: [],
    createdAt: new Date().toISOString(),
  };
  posts.push(post);
  writeStore('posts', posts);
  res.json({ post });
});

router.post('/posts/:id/like', (req, res) => {
  const { userId } = req.body || {};
  if (!userId) return res.status(400).json({ error: 'userId required' });
  const posts = readStore('posts', []);
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  if (!posts[idx].likes.includes(userId)) {
    posts[idx].likes.push(userId);
  } else {
    posts[idx].likes = posts[idx].likes.filter((u) => u !== userId);
  }
  writeStore('posts', posts);
  res.json({ likes: posts[idx].likes.length, liked: posts[idx].likes.includes(userId) });
});

router.post('/posts/:id/comment', (req, res) => {
  const { userId, text } = req.body || {};
  if (!userId || !text) return res.status(400).json({ error: 'userId and text required' });
  const posts = readStore('posts', []);
  const idx = posts.findIndex((p) => p.id === req.params.id);
  if (idx < 0) return res.status(404).json({ error: 'Not found' });
  const users = readStore('users', []);
  const author = users.find((u) => u.id === userId);
  posts[idx].comments.push({
    id: uid(),
    userId,
    username: author?.username || '用户',
    avatar: author?.avatar || '',
    text,
    createdAt: new Date().toISOString(),
  });
  writeStore('posts', posts);
  res.json({ post: posts[idx] });
});

export { router as communityRouter };
