import { HanziSweeperGame } from './game.js';
import { StrokeGame } from './stroke/game.js';

const game = new HanziSweeperGame();
window.game = game;

const dungeonGame = new StrokeGame();
window.dungeonGame = dungeonGame;
