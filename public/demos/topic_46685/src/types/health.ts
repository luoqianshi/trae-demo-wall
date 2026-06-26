export interface HealthArticle {
  id: string;
  title: string;
  summary: string;
  category: 'knowledge' | 'recipe' | 'exercise';
  coverUrl: string;
  readTime: string;
}
