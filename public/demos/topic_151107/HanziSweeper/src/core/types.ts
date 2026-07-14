// 格子类型
export enum CellType {
  Radical,  // 部首格（藏有部首组件）
  Number,   // 数字格
}

// 格子状态
export enum CellState {
  Hidden,   // 未翻开
  Revealed, // 已翻开
  Flagged,  // 已标记
}

// 格子
export interface Cell {
  type: CellType;
  state: CellState;
  number: number;         // 仅 Number 格有效：周围8格中有多少个 Radical 格
  radicalIndex: number;   // 仅 Radical 格有效：指向 components 数组中的索引
}

// 棋盘
export interface Board {
  width: number;
  height: number;
  grid: Cell[][];
  totalRadicals: number;
  characters: CharDecomp[];  // 本局使用的汉字拆解
}

// 汉字拆解
export interface CharDecomp {
  char: string;
  left: string;
  right: string;
}
