// Encouragement repository: posts and likes.

import { readData, withTransaction, generateId } from './base';
import type { EncouragementPost } from '../types/entities';

export function getEncouragementPosts(): EncouragementPost[] {
  const data = readData();
  return data.encouragementPosts.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );
}

export function createEncouragementPost(post: any): EncouragementPost {
  return withTransaction((data) => {
    const newPost: any = {
      id: generateId(),
      ...post,
      likes_count: 0,
      created_at: new Date().toISOString(),
    };
    data.encouragementPosts.push(newPost);
    return newPost;
  });
}

export function toggleEncouragementLike(userId: string, postId: string): boolean {
  return withTransaction((data) => {
    const existingIdx = data.encouragementLikes.findIndex(
      (l) => l.user_id === userId && l.post_id === postId,
    );
    let liked: boolean;
    if (existingIdx !== -1) {
      data.encouragementLikes.splice(existingIdx, 1);
      liked = false;
    } else {
      data.encouragementLikes.push({
        user_id: userId,
        post_id: postId,
        created_at: new Date().toISOString(),
      });
      liked = true;
    }
    const postIdx = data.encouragementPosts.findIndex((p) => p.id === postId);
    if (postIdx !== -1) {
      data.encouragementPosts[postIdx].likes_count = data.encouragementLikes.filter(
        (l) => l.post_id === postId,
      ).length;
    }
    return liked;
  });
}
