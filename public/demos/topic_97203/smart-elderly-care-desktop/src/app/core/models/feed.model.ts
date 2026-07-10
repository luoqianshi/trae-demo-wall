export type FeedType = 'text' | 'photo' | 'voice';

export interface FamilyFeed {
  id: number;
  elderId: number;
  userId: number;
  userName: string;
  userAvatar: string | null;
  type: FeedType;
  content: string | null;
  photoUrl: string | null;
  voiceUrl: string | null;
  voiceDuration: number | null;
  createdAt: Date;
}

export interface CommunityActivity {
  id: number;
  title: string;
  description: string | null;
  category: string;
  icon: string;
  schedule?: string;
  remindable?: boolean;
  location?: string;
  maxParticipants?: number;
  currentParticipants?: number;
  imageUrl?: string;
  status?: string;
}
