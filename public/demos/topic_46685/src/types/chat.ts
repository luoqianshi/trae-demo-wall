export interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  time: string;
}

export interface QuickQuestion {
  id: string;
  text: string;
}
