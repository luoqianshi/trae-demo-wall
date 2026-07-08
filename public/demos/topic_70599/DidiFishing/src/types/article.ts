// 社区文章相关类型定义
export type ArticleCategory = 'tech' | 'spot' | 'gear' | 'experience';

export interface Article {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  authorLevel: number;
  authorYears: number;
  title: string;
  summary: string;
  content: string;
  cover: string;
  category: ArticleCategory;
  tags: string[];
  location: string;
  likes: number;
  comments: number;
  views: number;
  liked: boolean;
  createdAt: string;
}

export interface ArticleComment {
  id: string;
  articleId: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  likes: number;
}
