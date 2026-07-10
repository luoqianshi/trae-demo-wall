// Conversation repository: chat messages tied to records.

import { readData, withTransaction, generateId } from './base';
import type { Conversation } from '../types/entities';

export function getConversations(recordId: string): Conversation[] {
  const data = readData();
  return data.conversations
    .filter((c) => c.record_id === recordId)
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
}

export function createConversation(conversationData: {
  record_id: string;
  role: 'assistant' | 'user';
  content: string;
}): Conversation {
  return withTransaction((data) => {
    const newConv: Conversation = {
      id: generateId(),
      record_id: conversationData.record_id,
      role: conversationData.role,
      content: conversationData.content,
      created_at: new Date().toISOString(),
    };
    data.conversations.push(newConv);
    return newConv;
  });
}
