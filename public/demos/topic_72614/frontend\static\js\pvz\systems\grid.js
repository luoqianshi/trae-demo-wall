import sceneConfig from '../data/scenes.js';

const GRID_ROWS = 5;
const GRID_COLS = 9;
const CELL_WIDTH = 80;
const CELL_HEIGHT = 80;
const GRID_OFFSET_X = 80;
const GRID_OFFSET_Y = 100;

export class Grid {
  constructor(sceneType = 'lawn') {
    this.sceneType = sceneType;
    this.config = sceneConfig[sceneType] || sceneConfig.lawn;
    this.rows = this.config.rows || GRID_ROWS;
    this.cols = this.config.cols || GRID_COLS;
    this.cells = [];
    this._initCells();
  }

  _initCells() {
    this.cells = [];
    for (let row = 0; row < this.rows; row++) {
      const rowCells = [];
      for (let col = 0; col < this.cols; col++) {
        const cellType = this._determineCellType(row);
        rowCells.push({
          row,
          col,
          x: GRID_OFFSET_X + col * CELL_WIDTH,
          y: GRID_OFFSET_Y + row * CELL_HEIGHT,
          plant: null,
          type: cellType
        });
      }
      this.cells.push(rowCells);
    }
  }

  _determineCellType(row) {
    const waterRows = this.config.waterRows || [];
    if (waterRows.includes(row)) {
      return 'water';
    }
    if (this.config.hasSlope) {
      return 'roof';
    }
    return 'lawn';
  }

  getCell(row, col) {
    if (row < 0 || row >= this.rows || col < 0 || col >= this.cols) {
      return null;
    }
    return this.cells[row][col];
  }

  setPlant(row, col, plant) {
    const cell = this.getCell(row, col);
    if (!cell) return false;

    if (!this.isCellAvailable(row, col, plant)) {
      return false;
    }

    cell.plant = plant;
    return true;
  }

  removePlant(row, col) {
    const cell = this.getCell(row, col);
    if (!cell || !cell.plant) return null;

    const removed = cell.plant;
    cell.plant = null;
    return removed;
  }

  getPlant(row, col) {
    const cell = this.getCell(row, col);
    return cell ? cell.plant : null;
  }

  isCellAvailable(row, col, plant) {
    const cell = this.getCell(row, col);
    if (!cell) return false;

    if (cell.plant) return false;

    if (cell.type === 'water') {
      if (!plant) return false;
      const isLilypad = plant.id === 'lilypad';
      const isAquatic = plant.is_aquatic === true;
      if (!isLilypad && !isAquatic) return false;
    }

    if (cell.type === 'roof') {
      if (!plant) return false;
      if (plant.id === 'flower_pot') return true;
      const hasPot = cell.plant && cell.plant.id === 'flower_pot';
      if (!hasPot && plant.id !== 'flower_pot') return false;
    }

    return true;
  }

  getZombieTargetRow(row) {
    const plants = [];
    for (let col = 0; col < this.cols; col++) {
      const cell = this.getCell(row, col);
      if (cell && cell.plant) {
        plants.push({ plant: cell.plant, row, col });
      }
    }
    return plants;
  }

  getCellsInRange(row, col, range) {
    const result = [];
    const rangeInt = Math.floor(range);

    for (let r = row - rangeInt; r <= row + rangeInt; r++) {
      for (let c = col - rangeInt; c <= col + rangeInt; c++) {
        if (r === row && c === col) continue;
        const cell = this.getCell(r, c);
        if (cell) {
          const dist = Math.abs(r - row) + Math.abs(c - col);
          if (dist <= range) {
            result.push(cell);
          }
        }
      }
    }
    return result;
  }

  reset() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        this.cells[row][col].plant = null;
      }
    }
  }

  serialize() {
    const cellData = [];
    for (let row = 0; row < this.rows; row++) {
      const rowData = [];
      for (let col = 0; col < this.cols; col++) {
        const cell = this.cells[row][col];
        rowData.push({
          row: cell.row,
          col: cell.col,
          x: cell.x,
          y: cell.y,
          plant: cell.plant ? (cell.plant.serialize ? cell.plant.serialize() : { id: cell.plant.id }) : null,
          type: cell.type
        });
      }
      cellData.push(rowData);
    }
    return {
      sceneType: this.sceneType,
      rows: this.rows,
      cols: this.cols,
      cells: cellData
    };
  }

  deserialize(data) {
    this.sceneType = data.sceneType;
    this.config = sceneConfig[data.sceneType] || sceneConfig.lawn;
    this.rows = data.rows;
    this.cols = data.cols;
    this.cells = [];
    for (let row = 0; row < data.cells.length; row++) {
      const rowCells = [];
      for (let col = 0; col < data.cells[row].length; col++) {
        const cd = data.cells[row][col];
        rowCells.push({
          row: cd.row,
          col: cd.col,
          x: cd.x,
          y: cd.y,
          plant: cd.plant,
          type: cd.type
        });
      }
      this.cells.push(rowCells);
    }
  }
}
