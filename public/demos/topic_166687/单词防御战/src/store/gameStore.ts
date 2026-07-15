import { create } from 'zustand';
import { GameState, Hero, Word, Enemy } from '@/types';
import { getRandomWord } from '@/data/words';
import { getHeroById, heroes } from '@/data/heroes';

const GRID_SIZE = 5;

interface DamageNumber {
  id: string;
  x: number;
  y: number;
  damage: number;
  color: string;
}

const initialState: GameState = {
  wave: 1,
  score: 0,
  lives: 10,
  heroPositions: [],
  activeWords: [],
  enemies: [],
  currentWord: null,
  isGameOver: false,
  isVictory: false,
  selectedHero: null,
};

const initialDamageNumbers: DamageNumber[] = [];

interface GameStore {
  gameState: GameState;
  gridSize: number;
  damageNumbers: DamageNumber[];
  lastScore: number;
  isTestMode: boolean;
  startGame: () => void;
  setCurrentWord: (word: Word | null) => void;
  checkSpelling: (input: string) => boolean;
  addHero: (heroId: string, x: number, y: number) => boolean;
  removeHero: (placementId: string) => void;
  selectHero: (heroId: string | null) => void;
  spawnEnemy: (type: Enemy['type']) => void;
  updateEnemies: (deltaTime: number) => void;
  damageEnemy: (enemyId: string, damage: number, x: number, y: number, color: string) => void;
  addScore: (points: number) => void;
  loseLife: () => void;
  nextWave: () => void;
  endGame: (victory: boolean) => void;
  resetGame: () => void;
  getAvailableHeroes: () => Hero[];
  showDamage: (x: number, y: number, damage: number, color: string) => void;
  removeDamage: (id: string) => void;
  toggleTestMode: () => void;
  initTestGame: () => void;
  addTestScore: (points: number) => void;
  spawnTestEnemy: (type: Enemy['type'], x?: number, y?: number) => void;
  placeTestHero: (heroId: string, x: number, y: number) => void;
  skipWave: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: initialState,
  gridSize: GRID_SIZE,
  damageNumbers: initialDamageNumbers,
  lastScore: 0,
  isTestMode: false,
  
  startGame: () => {
    const word = getRandomWord(1);
    set({
      gameState: {
        ...initialState,
        currentWord: word,
      },
    });
  },
  
  setCurrentWord: (word) => {
    set((state) => ({
      gameState: { ...state.gameState, currentWord: word },
    }));
  },
  
  checkSpelling: (input) => {
    const { gameState } = get();
    if (!gameState.currentWord) return false;
    
    const isCorrect = input.toLowerCase().trim() === gameState.currentWord.word.toLowerCase();
    
    if (isCorrect) {
      const difficulty = gameState.currentWord.difficulty;
      const points = difficulty * 10 + 5;
      get().addScore(points);
      
      const nextWord = getRandomWord(Math.min(gameState.wave + 1, 5));
      get().setCurrentWord(nextWord);
    } else {
      get().loseLife();
    }
    
    return isCorrect;
  },
  
  addHero: (heroId, x, y) => {
    const { gameState, gridSize } = get();
    
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
      return false;
    }
    
    const isOccupied = gameState.heroPositions.some(
      (pos) => pos.x === x && pos.y === y
    );
    
    if (isOccupied) {
      return false;
    }
    
    const hero = getHeroById(heroId);
    if (!hero) {
      return false;
    }
    
    if (gameState.score < hero.cost * 10) {
      return false;
    }
    
    set((state) => ({
      gameState: {
        ...state.gameState,
        score: state.gameState.score - hero.cost * 10,
        heroPositions: [
          ...state.gameState.heroPositions,
          { id: `placement-${Date.now()}`, heroId, x, y },
        ],
        selectedHero: null,
      },
    }));
    
    return true;
  },
  
  removeHero: (placementId) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        heroPositions: state.gameState.heroPositions.filter(
          (pos) => pos.id !== placementId
        ),
      },
    }));
  },
  
  selectHero: (heroId) => {
    set((state) => ({
      gameState: { ...state.gameState, selectedHero: heroId },
    }));
  },
  
  spawnEnemy: (type) => {
    const { gameState } = get();
    const baseHealth = { normal: 30, fast: 20, tank: 80, boss: 200 };
    const speed = { normal: 0.5, fast: 1.2, tank: 0.2, boss: 0.3 };
    const reward = { normal: 10, fast: 15, tank: 30, boss: 100 };
    
    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      health: baseHealth[type] * (1 + (gameState.wave - 1) * 0.2),
      maxHealth: baseHealth[type] * (1 + (gameState.wave - 1) * 0.2),
      speed: speed[type],
      x: -1,
      y: Math.floor(Math.random() * get().gridSize),
      reward: reward[type],
      type,
    };
    
    set((state) => ({
      gameState: {
        ...state.gameState,
        enemies: [...state.gameState.enemies, enemy],
      },
    }));
  },
  
  updateEnemies: (deltaTime) => {
    const { gameState, gridSize } = get();
    
    const updatedEnemies = gameState.enemies.map((enemy) => ({
      ...enemy,
      x: enemy.x + enemy.speed * deltaTime,
    }));
    
    const reachedBase = updatedEnemies.filter((e) => e.x >= gridSize);
    const remainingEnemies = updatedEnemies.filter((e) => e.x < gridSize && e.health > 0);
    
    set((state) => ({
      gameState: {
        ...state.gameState,
        enemies: remainingEnemies,
      },
    }));
    
    reachedBase.forEach(() => get().loseLife());
  },
  
  damageEnemy: (enemyId, damage, x, y, color) => {
    set((state) => {
      const updatedEnemies = state.gameState.enemies.map((enemy) => {
        if (enemy.id === enemyId) {
          const newHealth = enemy.health - damage;
          if (newHealth <= 0) {
            get().addScore(enemy.reward);
          }
          return { ...enemy, health: newHealth };
        }
        return enemy;
      });
      
      return {
        gameState: {
          ...state.gameState,
          enemies: updatedEnemies.filter((e) => e.health > 0),
        },
      };
    });
    
    get().showDamage(x, y, damage, color);
  },
  
  addScore: (points) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        score: state.gameState.score + points,
      },
      lastScore: points,
    }));
  },
  
  loseLife: () => {
    set((state) => {
      const newLives = state.gameState.lives - 1;
      if (newLives <= 0) {
        get().endGame(false);
      }
      return {
        gameState: { ...state.gameState, lives: Math.max(0, newLives) },
      };
    });
  },
  
  nextWave: () => {
    set((state) => {
      const newWave = state.gameState.wave + 1;
      const newWord = getRandomWord(Math.min(newWave + 1, 5));
      
      if (newWave > 15) {
        get().endGame(true);
      }
      
      return {
        gameState: {
          ...state.gameState,
          wave: newWave,
          currentWord: newWord,
        },
      };
    });
  },
  
  endGame: (victory) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        isGameOver: true,
        isVictory: victory,
      },
    }));
  },
  
  resetGame: () => {
    set({ gameState: initialState });
  },
  
  getAvailableHeroes: () => {
    return heroes;
  },
  
  showDamage: (x, y, damage, color) => {
    const id = `${Date.now()}-${Math.random()}`;
    set((state) => ({
      damageNumbers: [...state.damageNumbers, { id, x, y, damage, color }],
    }));
    setTimeout(() => {
      get().removeDamage(id);
    }, 800);
  },
  
  removeDamage: (id) => {
    set((state) => ({
      damageNumbers: state.damageNumbers.filter((d) => d.id !== id),
    }));
  },
  
  toggleTestMode: () => {
    set((state) => ({ isTestMode: !state.isTestMode }));
  },
  
  initTestGame: () => {
    const word = getRandomWord(1);
    set({
      isTestMode: true,
      gameState: {
        ...initialState,
        score: 100,
        lives: 10,
        wave: 3,
        heroPositions: [
          { id: 'test-h1', heroId: 'h1', x: 1, y: 1 },
          { id: 'test-h2', heroId: 'h2', x: 2, y: 2 },
          { id: 'test-h3', heroId: 'h3', x: 1, y: 3 },
        ],
        currentWord: word,
      },
    });
  },
  
  addTestScore: (points) => {
    set((state) => ({
      gameState: {
        ...state.gameState,
        score: state.gameState.score + points,
      },
    }));
  },
  
  spawnTestEnemy: (type, x = -1, y = 2) => {
    const { gameState } = get();
    const baseHealth = { normal: 30, fast: 20, tank: 80, boss: 200 };
    const speed = { normal: 0.5, fast: 1.2, tank: 0.2, boss: 0.3 };
    const reward = { normal: 10, fast: 15, tank: 30, boss: 100 };
    
    const enemy: Enemy = {
      id: `enemy-${Date.now()}-${Math.random()}`,
      health: baseHealth[type] * (1 + (gameState.wave - 1) * 0.2),
      maxHealth: baseHealth[type] * (1 + (gameState.wave - 1) * 0.2),
      speed: speed[type],
      x,
      y,
      reward: reward[type],
      type,
    };
    
    set((state) => ({
      gameState: {
        ...state.gameState,
        enemies: [...state.gameState.enemies, enemy],
      },
    }));
  },
  
  placeTestHero: (heroId, x, y) => {
    const { gridSize } = get();
    
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) {
      return;
    }
    
    set((state) => {
      const isOccupied = state.gameState.heroPositions.some(
        (pos) => pos.x === x && pos.y === y
      );
      
      if (isOccupied) {
        return state;
      }
      
      return {
        gameState: {
          ...state.gameState,
          heroPositions: [
            ...state.gameState.heroPositions,
            { id: `placement-${Date.now()}`, heroId, x, y },
          ],
        },
      };
    });
  },
  
  skipWave: () => {
    set((state) => {
      const newWave = state.gameState.wave + 1;
      const newWord = getRandomWord(Math.min(newWave + 1, 5));
      
      return {
        gameState: {
          ...state.gameState,
          wave: newWave,
          currentWord: newWord,
          enemies: [],
        },
      };
    });
  },
}));
