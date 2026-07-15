import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useGameStore } from './gameStore';

vi.useFakeTimers();

describe('gameStore', () => {
  beforeEach(() => {
    useGameStore.getState().resetGame();
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const state = useGameStore.getState();
      expect(state.gameState.wave).toBe(1);
      expect(state.gameState.score).toBe(0);
      expect(state.gameState.lives).toBe(10);
      expect(state.gameState.heroPositions).toEqual([]);
      expect(state.gameState.enemies).toEqual([]);
      expect(state.gameState.isGameOver).toBe(false);
      expect(state.gameState.isVictory).toBe(false);
      expect(state.gridSize).toBe(5);
      expect(state.isTestMode).toBe(false);
    });
  });

  describe('startGame', () => {
    it('should initialize game with a word', () => {
      useGameStore.getState().startGame();
      const state = useGameStore.getState();
      expect(state.gameState.currentWord).not.toBeNull();
      expect(state.gameState.currentWord?.difficulty).toBe(1);
    });

    it('should reset game state', () => {
      const store = useGameStore.getState();
      store.startGame();
      store.addScore(100);
      store.startGame();
      const state = useGameStore.getState();
      expect(state.gameState.score).toBe(0);
      expect(state.gameState.wave).toBe(1);
    });
  });

  describe('addScore', () => {
    it('should increase score', () => {
      const store = useGameStore.getState();
      store.addScore(50);
      expect(store.gameState.score).toBe(50);
      store.addScore(30);
      expect(store.gameState.score).toBe(80);
    });

    it('should update lastScore', () => {
      const store = useGameStore.getState();
      store.addScore(50);
      expect(store.lastScore).toBe(50);
      store.addScore(30);
      expect(store.lastScore).toBe(30);
    });
  });

  describe('loseLife', () => {
    it('should decrease lives', () => {
      const store = useGameStore.getState();
      store.loseLife();
      expect(store.gameState.lives).toBe(9);
      store.loseLife();
      expect(store.gameState.lives).toBe(8);
    });

    it('should end game when lives reach 0', () => {
      const store = useGameStore.getState();
      for (let i = 0; i < 10; i++) {
        store.loseLife();
      }
      expect(store.gameState.lives).toBe(0);
      expect(store.gameState.isGameOver).toBe(true);
      expect(store.gameState.isVictory).toBe(false);
    });
  });

  describe('addHero', () => {
    it('should add hero to valid position', () => {
      const store = useGameStore.getState();
      store.addScore(100);
      const result = store.addHero('h1', 1, 1);
      expect(result).toBe(true);
      expect(store.gameState.heroPositions.length).toBe(1);
      expect(store.gameState.score).toBe(90);
    });

    it('should not add hero to occupied position', () => {
      const store = useGameStore.getState();
      store.addScore(100);
      store.addHero('h1', 1, 1);
      const result = store.addHero('h2', 1, 1);
      expect(result).toBe(false);
      expect(store.gameState.heroPositions.length).toBe(1);
    });

    it('should not add hero with insufficient score', () => {
      const store = useGameStore.getState();
      const result = store.addHero('h1', 1, 1);
      expect(result).toBe(false);
      expect(store.gameState.heroPositions.length).toBe(0);
    });

    it('should not add hero outside grid', () => {
      const store = useGameStore.getState();
      store.addScore(100);
      const result1 = store.addHero('h1', -1, 1);
      const result2 = store.addHero('h1', 5, 1);
      const result3 = store.addHero('h1', 1, -1);
      const result4 = store.addHero('h1', 1, 5);
      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
      expect(result4).toBe(false);
    });

    it('should not add non-existent hero', () => {
      const store = useGameStore.getState();
      store.addScore(100);
      const result = store.addHero('invalid', 1, 1);
      expect(result).toBe(false);
    });
  });

  describe('removeHero', () => {
    it('should remove hero by placement ID', () => {
      const store = useGameStore.getState();
      store.addScore(100);
      store.addHero('h1', 1, 1);
      const placementId = store.gameState.heroPositions[0].id;
      store.removeHero(placementId);
      expect(store.gameState.heroPositions.length).toBe(0);
    });
  });

  describe('selectHero', () => {
    it('should select a hero', () => {
      const store = useGameStore.getState();
      store.selectHero('h1');
      expect(store.gameState.selectedHero).toBe('h1');
    });

    it('should deselect hero when null is passed', () => {
      const store = useGameStore.getState();
      store.selectHero('h1');
      store.selectHero(null);
      expect(store.gameState.selectedHero).toBe(null);
    });
  });

  describe('spawnEnemy', () => {
    it('should spawn a normal enemy', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('normal');
      expect(store.gameState.enemies.length).toBe(1);
      const enemy = store.gameState.enemies[0];
      expect(enemy.type).toBe('normal');
      expect(enemy.x).toBe(-1);
      expect(enemy.y).toBeGreaterThanOrEqual(0);
      expect(enemy.y).toBeLessThan(5);
    });

    it('should spawn different enemy types', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('fast');
      store.spawnEnemy('tank');
      store.spawnEnemy('boss');
      expect(store.gameState.enemies.length).toBe(3);
      expect(store.gameState.enemies[0].type).toBe('fast');
      expect(store.gameState.enemies[1].type).toBe('tank');
      expect(store.gameState.enemies[2].type).toBe('boss');
    });

    it('should scale enemy health with wave', () => {
      const store = useGameStore.getState();
      store.nextWave();
      store.nextWave();
      expect(store.gameState.wave).toBe(3);
      store.spawnEnemy('normal');
      const enemy = store.gameState.enemies[0];
      expect(enemy.health).toBeGreaterThan(30);
    });
  });

  describe('updateEnemies', () => {
    it('should move enemies forward', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('normal');
      const initialX = store.gameState.enemies[0].x;
      store.updateEnemies(1);
      const newX = store.gameState.enemies[0].x;
      expect(newX).toBeGreaterThan(initialX);
    });

    it('should remove enemies that reach the base', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('normal');
      for (let i = 0; i < 20; i++) {
        store.updateEnemies(1);
      }
      expect(store.gameState.enemies.length).toBe(0);
      expect(store.gameState.lives).toBeLessThan(10);
    });
  });

  describe('damageEnemy', () => {
    it('should damage enemy', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('normal');
      const enemy = store.gameState.enemies[0];
      const initialHealth = enemy.health;
      store.damageEnemy(enemy.id, 10, 0, 0, '#F97316');
      const newEnemy = store.gameState.enemies[0];
      expect(newEnemy.health).toBe(initialHealth - 10);
    });

    it('should remove enemy when health reaches 0', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('fast');
      const enemy = store.gameState.enemies[0];
      store.damageEnemy(enemy.id, enemy.health + 1, 0, 0, '#F97316');
      expect(store.gameState.enemies.length).toBe(0);
    });

    it('should add score when enemy is killed', () => {
      const store = useGameStore.getState();
      store.spawnEnemy('normal');
      const enemy = store.gameState.enemies[0];
      store.damageEnemy(enemy.id, enemy.health + 1, 0, 0, '#F97316');
      expect(store.gameState.score).toBe(10);
    });
  });

  describe('nextWave', () => {
    it('should increase wave number', () => {
      const store = useGameStore.getState();
      store.nextWave();
      expect(store.gameState.wave).toBe(2);
      store.nextWave();
      expect(store.gameState.wave).toBe(3);
    });

    it('should update current word', () => {
      const store = useGameStore.getState();
      const initialWord = store.gameState.currentWord;
      store.nextWave();
      expect(store.gameState.currentWord).not.toBe(initialWord);
    });

    it('should end game with victory at wave 16', () => {
      const store = useGameStore.getState();
      for (let i = 0; i < 15; i++) {
        store.nextWave();
      }
      expect(store.gameState.wave).toBe(16);
      expect(store.gameState.isGameOver).toBe(true);
      expect(store.gameState.isVictory).toBe(true);
    });
  });

  describe('checkSpelling', () => {
    it('should return true for correct spelling', () => {
      const store = useGameStore.getState();
      store.startGame();
      const word = store.gameState.currentWord;
      if (word) {
        const result = store.checkSpelling(word.word);
        expect(result).toBe(true);
        expect(store.gameState.score).toBeGreaterThan(0);
      }
    });

    it('should return false for incorrect spelling', () => {
      const store = useGameStore.getState();
      store.startGame();
      const result = store.checkSpelling('wrong');
      expect(result).toBe(false);
      expect(store.gameState.lives).toBe(9);
    });

    it('should be case insensitive', () => {
      const store = useGameStore.getState();
      store.startGame();
      const word = store.gameState.currentWord;
      if (word) {
        const result = store.checkSpelling(word.word.toUpperCase());
        expect(result).toBe(true);
      }
    });

    it('should trim whitespace', () => {
      const store = useGameStore.getState();
      store.startGame();
      const word = store.gameState.currentWord;
      if (word) {
        const result = store.checkSpelling(`  ${word.word}  `);
        expect(result).toBe(true);
      }
    });
  });

  describe('getAvailableHeroes', () => {
    it('should return all heroes', () => {
      const store = useGameStore.getState();
      const heroes = store.getAvailableHeroes();
      expect(heroes.length).toBe(6);
    });
  });

  describe('showDamage', () => {
    it('should add damage number', () => {
      const store = useGameStore.getState();
      store.showDamage(1, 1, 10, '#F97316');
      expect(store.damageNumbers.length).toBe(1);
      expect(store.damageNumbers[0].damage).toBe(10);
    });

    it('should remove damage number after timeout', () => {
      const store = useGameStore.getState();
      store.showDamage(1, 1, 10, '#F97316');
      expect(store.damageNumbers.length).toBe(1);
      vi.advanceTimersByTime(800);
      expect(store.damageNumbers.length).toBe(0);
    });
  });

  describe('test mode', () => {
    it('should toggle test mode', () => {
      const store = useGameStore.getState();
      store.toggleTestMode();
      expect(store.isTestMode).toBe(true);
      store.toggleTestMode();
      expect(store.isTestMode).toBe(false);
    });

    it('should initialize test game with preset data', () => {
      const store = useGameStore.getState();
      store.initTestGame();
      expect(store.isTestMode).toBe(true);
      expect(store.gameState.score).toBe(100);
      expect(store.gameState.wave).toBe(3);
      expect(store.gameState.heroPositions.length).toBe(3);
    });

    it('should add test score', () => {
      const store = useGameStore.getState();
      store.addTestScore(50);
      expect(store.gameState.score).toBe(50);
    });

    it('should spawn test enemy at specified position', () => {
      const store = useGameStore.getState();
      store.spawnTestEnemy('normal', 2, 3);
      const enemy = store.gameState.enemies[0];
      expect(enemy.x).toBe(2);
      expect(enemy.y).toBe(3);
    });

    it('should place test hero without cost', () => {
      const store = useGameStore.getState();
      store.placeTestHero('h1', 1, 1);
      expect(store.gameState.heroPositions.length).toBe(1);
    });

    it('should skip wave', () => {
      const store = useGameStore.getState();
      store.startGame();
      store.spawnEnemy('normal');
      store.skipWave();
      expect(store.gameState.wave).toBe(2);
      expect(store.gameState.enemies.length).toBe(0);
    });
  });
});
