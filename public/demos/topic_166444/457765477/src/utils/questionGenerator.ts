import { OperationType, Difficulty, Question, DIFFICULTY_RANGE } from '@/types';

const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

const generateAddition = (min: number, max: number): Question => {
  const num1 = getRandomInt(min, max);
  const num2 = getRandomInt(min, max);
  return {
    id: Date.now() + Math.random(),
    num1,
    num2,
    operator: '+',
    answer: num1 + num2,
  };
};

const generateSubtraction = (min: number, max: number): Question => {
  const num1 = getRandomInt(min, max);
  const num2 = getRandomInt(min, num1);
  return {
    id: Date.now() + Math.random(),
    num1,
    num2,
    operator: '-',
    answer: num1 - num2,
  };
};

const generateMultiplication = (min: number, max: number): Question => {
  const num1 = getRandomInt(min, Math.min(max, 12));
  const num2 = getRandomInt(min, Math.min(max, 12));
  return {
    id: Date.now() + Math.random(),
    num1,
    num2,
    operator: '×',
    answer: num1 * num2,
  };
};

const generateDivision = (min: number, max: number): Question => {
  const num2 = getRandomInt(Math.max(min, 2), Math.min(max, 12));
  const answer = getRandomInt(min, Math.min(max, 12));
  const num1 = num2 * answer;
  return {
    id: Date.now() + Math.random(),
    num1,
    num2,
    operator: '÷',
    answer,
  };
};

const generateQuestion = (operation: OperationType, min: number, max: number): Question => {
  if (operation === 'add') return generateAddition(min, max);
  if (operation === 'sub') return generateSubtraction(min, max);
  if (operation === 'mul') return generateMultiplication(min, max);
  if (operation === 'div') return generateDivision(min, max);
  
  const operations: OperationType[] = ['add', 'sub', 'mul', 'div'];
  const randomOp = operations[Math.floor(Math.random() * operations.length)];
  return generateQuestion(randomOp, min, max);
};

export const generateQuestions = (
  operationType: OperationType,
  difficulty: Difficulty,
  count: number
): Question[] => {
  const range = DIFFICULTY_RANGE[difficulty];
  const questions: Question[] = [];
  
  for (let i = 0; i < count; i++) {
    questions.push(generateQuestion(operationType, range.min, range.max));
  }
  
  return questions;
};