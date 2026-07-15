import { describe, it, expect } from 'vitest';
import { words, getWordsByDifficulty, getRandomWord, getWordById, getWordsByPartOfSpeech } from './words';

describe('words.ts', () => {
  describe('words array', () => {
    it('should have exactly 110 words', () => {
      expect(words.length).toBe(110);
    });

    it('should contain words with correct structure', () => {
      const word = words[0];
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('meaning');
      expect(word).toHaveProperty('partOfSpeech');
      expect(word).toHaveProperty('difficulty');
      expect(word).toHaveProperty('mastery');
    });

    it('should have unique word IDs', () => {
      const ids = words.map(w => w.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have difficulty values between 1 and 5', () => {
      words.forEach(word => {
        expect(word.difficulty).toBeGreaterThanOrEqual(1);
        expect(word.difficulty).toBeLessThanOrEqual(5);
      });
    });

    it('should have mastery values >= 0', () => {
      words.forEach(word => {
        expect(word.mastery).toBeGreaterThanOrEqual(0);
      });
    });
  });

  describe('getWordsByDifficulty', () => {
    it('should return words with difficulty <= maxDifficulty', () => {
      const easyWords = getWordsByDifficulty(1);
      easyWords.forEach(word => {
        expect(word.difficulty).toBeLessThanOrEqual(1);
      });
    });

    it('should return 19 words for difficulty 1', () => {
      const easyWords = getWordsByDifficulty(1);
      expect(easyWords.length).toBe(19);
    });

    it('should return 39 words for difficulty 2', () => {
      const mediumWords = getWordsByDifficulty(2);
      expect(mediumWords.length).toBe(39);
    });

    it('should return all words for difficulty 5', () => {
      const allWords = getWordsByDifficulty(5);
      expect(allWords.length).toBe(110);
    });

    it('should return empty array for difficulty 0', () => {
      const words = getWordsByDifficulty(0);
      expect(words.length).toBe(0);
    });
  });

  describe('getRandomWord', () => {
    it('should return a word with difficulty <= maxDifficulty', () => {
      const word = getRandomWord(2);
      expect(word.difficulty).toBeLessThanOrEqual(2);
    });

    it('should return a valid word object', () => {
      const word = getRandomWord(3);
      expect(word).toHaveProperty('id');
      expect(word).toHaveProperty('word');
      expect(word).toHaveProperty('meaning');
    });

    it('should return words from the correct difficulty range', () => {
      const word = getRandomWord(1);
      expect(word.difficulty).toBe(1);
    });

    it('should be able to return different words on multiple calls', () => {
      const wordsSet = new Set<string>();
      for (let i = 0; i < 20; i++) {
        wordsSet.add(getRandomWord(5).id);
      }
      expect(wordsSet.size).toBeGreaterThan(1);
    });
  });

  describe('getWordById', () => {
    it('should return word with matching ID', () => {
      const word = getWordById('w1');
      expect(word).not.toBeUndefined();
      expect(word?.id).toBe('w1');
      expect(word?.word).toBe('apple');
      expect(word?.meaning).toBe('苹果');
    });

    it('should return undefined for non-existent ID', () => {
      const word = getWordById('w999');
      expect(word).toBeUndefined();
    });

    it('should return correct word details', () => {
      const word = getWordById('w20');
      expect(word?.word).toBe('beautiful');
      expect(word?.meaning).toBe('美丽的');
      expect(word?.difficulty).toBe(2);
    });
  });

  describe('getWordsByPartOfSpeech', () => {
    it('should return words with matching part of speech', () => {
      const nouns = getWordsByPartOfSpeech('noun');
      nouns.forEach(word => {
        expect(word.partOfSpeech).toBe('noun');
      });
    });

    it('should return verbs correctly', () => {
      const verbs = getWordsByPartOfSpeech('verb');
      verbs.forEach(word => {
        expect(word.partOfSpeech).toBe('verb');
      });
    });

    it('should return adjectives correctly', () => {
      const adjectives = getWordsByPartOfSpeech('adjective');
      adjectives.forEach(word => {
        expect(word.partOfSpeech).toBe('adjective');
      });
    });

    it('should return empty array for invalid part of speech', () => {
      const words = getWordsByPartOfSpeech('invalid' as any);
      expect(words.length).toBe(0);
    });
  });
});
