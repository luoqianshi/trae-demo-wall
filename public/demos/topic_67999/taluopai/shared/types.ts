export interface Card {
  id: number;
  name: string;
  nameEn: string;
  type: 'major' | 'minor';
  suit?: 'wands' | 'cups' | 'swords' | 'pentacles';
  number: number;
  keywords: string;
  meaningUpright: string;
  meaningReversed: string;
  element?: string;
  zodiac?: string;
  description: string;
}

export interface Drawing {
  id: number;
  spreadType: string;
  sessionId: string;
  cards: DrawingCard[];
  createdAt: string;
}

export interface DrawingCard {
  id: number;
  cardId: number;
  position: number;
  isReversed: boolean;
  card?: Card;
}

export interface SpreadType {
  id: string;
  name: string;
  count: number;
  description: string;
  positions: string[];
}