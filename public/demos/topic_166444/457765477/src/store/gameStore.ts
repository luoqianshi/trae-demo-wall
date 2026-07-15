import { create } from 'zustand';
import { GameState, GameConfig, Question, GameHistory } from '@/types';

interface GameStore extends GameState {
  setConfig: (config: GameConfig) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentIndex: (index: number) => void;
  setAnswer: (answer: number) => void;
  incrementScore: (points: number) => void;
  incrementCorrectCount: () => void;
  incrementTimeUsed: () => void;
  setTimeUsed: (time: number) => void;
  setStreak: (streak: number) => void;
  startGame: (config: GameConfig, questions: Question[]) => void;
  resetGame: () => void;
  saveHistory: () => void;
  getHistory: () => GameHistory[];
}

const initialState: GameState = {
  config: {
    operationType: 'add',
    difficulty: 'easy',
    questionCount: 10,
  },
  questions: [],
  currentIndex: 0,
  score: 0,
  correctCount: 0,
  timeUsed: 0,
  isPlaying: false,
  streak: 0,
};

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialState,

  setConfig: (config) => set({ config }),

  setQuestions: (questions) => set({ questions }),

  setCurrentIndex: (index) => set({ currentIndex: index }),

  setAnswer: (answer) => {
    const { questions, currentIndex } = get();
    const question = questions[currentIndex];
    const isCorrect = answer === question.answer;
    
    const newQuestions = [...questions];
    newQuestions[currentIndex] = {
      ...question,
      userAnswer: answer,
      isCorrect,
    };
    
    set({ questions: newQuestions });
  },

  incrementScore: (points) => set((state) => ({ score: state.score + points })),

  incrementCorrectCount: () => set((state) => ({ correctCount: state.correctCount + 1 })),

  incrementTimeUsed: () => set((state) => ({ timeUsed: state.timeUsed + 1 })),

  setTimeUsed: (time) => set({ timeUsed: time }),

  setStreak: (streak) => set({ streak }),

  startGame: (config, questions) => {
    set({
      config,
      questions,
      currentIndex: 0,
      score: 0,
      correctCount: 0,
      timeUsed: 0,
      isPlaying: true,
      streak: 0,
    });
  },

  resetGame: () => set(initialState),

  saveHistory: () => {
    const { config, score, correctCount, timeUsed, questions } = get();
    const history: GameHistory = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      operationType: config.operationType,
      difficulty: config.difficulty,
      score,
      accuracy: questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0,
      timeUsed,
      questionCount: questions.length,
    };

    const existingHistory = get().getHistory();
    localStorage.setItem('mathGameHistory', JSON.stringify([history, ...existingHistory].slice(0, 20)));
  },

  getHistory: () => {
    const history = localStorage.getItem('mathGameHistory');
    return history ? JSON.parse(history) : [];
  },
}));