import { describe, it, expect } from 'vitest';
import { heroes, getHeroById, getHeroesByCost, getInitialUnlockedHeroes } from './heroes';

describe('heroes.ts', () => {
  describe('heroes array', () => {
    it('should have exactly 6 heroes', () => {
      expect(heroes.length).toBe(6);
    });

    it('should contain heroes with correct structure', () => {
      const hero = heroes[0];
      expect(hero).toHaveProperty('id');
      expect(hero).toHaveProperty('name');
      expect(hero).toHaveProperty('emoji');
      expect(hero).toHaveProperty('skill');
      expect(hero).toHaveProperty('damage');
      expect(hero).toHaveProperty('range');
      expect(hero).toHaveProperty('cost');
      expect(hero).toHaveProperty('element');
      expect(hero).toHaveProperty('color');
      expect(hero).toHaveProperty('description');
    });

    it('should have unique hero IDs', () => {
      const ids = heroes.map(h => h.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have valid damage values (> 0)', () => {
      heroes.forEach(hero => {
        expect(hero.damage).toBeGreaterThan(0);
      });
    });

    it('should have valid range values (>= 1)', () => {
      heroes.forEach(hero => {
        expect(hero.range).toBeGreaterThanOrEqual(1);
      });
    });

    it('should have valid cost values (>= 1)', () => {
      heroes.forEach(hero => {
        expect(hero.cost).toBeGreaterThanOrEqual(1);
      });
    });
  });

  describe('getHeroById', () => {
    it('should return hero with matching ID', () => {
      const hero = getHeroById('h1');
      expect(hero).not.toBeUndefined();
      expect(hero?.id).toBe('h1');
      expect(hero?.name).toBe('火焰战士');
    });

    it('should return undefined for non-existent ID', () => {
      const hero = getHeroById('h99');
      expect(hero).toBeUndefined();
    });

    it('should return correct hero for each ID', () => {
      expect(getHeroById('h2')?.name).toBe('冰霜法师');
      expect(getHeroById('h3')?.name).toBe('大地守护者');
      expect(getHeroById('h4')?.name).toBe('风暴使者');
      expect(getHeroById('h5')?.name).toBe('光明天使');
      expect(getHeroById('h6')?.name).toBe('暗影刺客');
    });
  });

  describe('getHeroesByCost', () => {
    it('should return heroes with cost <= maxCost', () => {
      const cheapHeroes = getHeroesByCost(1);
      expect(cheapHeroes.length).toBe(3);
      cheapHeroes.forEach(hero => {
        expect(hero.cost).toBeLessThanOrEqual(1);
      });
    });

    it('should return all heroes when maxCost is high', () => {
      const allHeroes = getHeroesByCost(10);
      expect(allHeroes.length).toBe(6);
    });

    it('should return empty array when maxCost is 0', () => {
      const heroes = getHeroesByCost(0);
      expect(heroes.length).toBe(0);
    });

    it('should return 5 heroes for maxCost 2', () => {
      const heroes = getHeroesByCost(2);
      expect(heroes.length).toBe(5);
    });
  });

  describe('getInitialUnlockedHeroes', () => {
    it('should return initial unlocked hero IDs', () => {
      const unlocked = getInitialUnlockedHeroes();
      expect(unlocked).toEqual(['h1', 'h2', 'h3']);
    });

    it('should return exactly 3 initial heroes', () => {
      const unlocked = getInitialUnlockedHeroes();
      expect(unlocked.length).toBe(3);
    });
  });
});
