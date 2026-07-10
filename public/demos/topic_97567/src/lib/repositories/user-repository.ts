// User repository: user profile operations.

import { readData, withTransaction } from './base';
import type { User } from '../types/entities';

export function getUser(userId: string): User | null {
  const data = readData();
  return data.users.find((u) => u.id === userId) || null;
}

export function updateUser(userId: string, updates: Record<string, any>): User {
  return withTransaction((data) => {
    const idx = data.users.findIndex((u) => u.id === userId);
    if (idx === -1) throw new Error('User not found');
    data.users[idx] = { ...data.users[idx], ...updates, updated_at: new Date().toISOString() };
    return data.users[idx];
  });
}
