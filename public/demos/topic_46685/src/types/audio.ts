export interface AudioItem {
  id: string;
  title: string;
  description: string;
  category: 'news' | 'book' | 'music';
  duration: string;
  coverUrl: string;
}

export interface AudioCategory {
  id: string;
  name: string;
  icon: string;
}
