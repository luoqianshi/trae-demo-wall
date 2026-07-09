// ====== 弈智 YIZHI - 自适应AI象棋训练系统 Demo ======

const PIECE_CHARS = {
  'R':'俥','N':'傌','B':'相','A':'仕','K':'帥','C':'炮','P':'兵',
  'r':'車','n':'馬','b':'象','a':'士','k':'将','c':'砲','p':'卒'
};

function isRed(p) { return p && p === p.toUpperCase() && p !== '.'; }
function isBlack(p) { return p && p === p.toLowerCase() && p !== '.'; }
function sameSide(a, b) {
  if (!a || !b || a === '.' || b === '.') return false;
  return (isRed(a) && isRed(b)) || (isBlack(a) && isBlack(b));
}

// ====== 象棋引擎 ======
class XiangqiEngine {
  constructor() { this.reset(); }
  reset() {
    this.board = [
      ['r','n','b','a','k','a','b','n','r'],
      ['.','.','.','.','.','.','.','.','.'],
      ['.','c','.','.','.','.','.','c','.'],
      ['p','.','p','.','p','.','p','.','p'],
      ['.','.','.','.','.','.','.','.','.'],
      ['.','.','.','.','.','.','.','.','.'],
      ['P','.','P','.','P','.','P','.','P'],
      ['.','C','.','.','.','.','.','C','.'],
      ['.','.','.','.','.','.','.','.','.'],
      ['R','N','B','A','K','A','B','N','R']
    ];
    this.history = [];
  }
  get(x, y) { return (y>=0&&y<10&&x>=0&&x<9) ? this.board[y][x] : '.'; }
  set(x, y, p) { if(y>=0&&y<10&&x>=0&&x<9) this.board[y][x] = p; }

  inPalace(x, y, black) {
    if (black) return x>=3 && x<=5 && y>=0 && y<=2;
    return x>=3 && x<=5 && y>=7 && y<=9;
  }
  crossedRiver(y, black) {
    return black ? y>=5 : y<=4;
  }

  countBetween(x1, y1, x2, y2) {
    let cnt = 0;
    if (x1 === x2) {
      let sy = Math.min(y1, y2), ey = Math.max(y1, y2);
      for (let y = sy+1; y < ey; y++) if (this.get(x1, y) !== '.') cnt++;
    } else if (y1 === y2) {
      let sx = Math.min(x1, x2), ex = Math.max(x1, x2);
      for (let x = sx+1; x < ex; x++) if (this.get(x, y1) !== '.') cnt++;
    }
    return cnt;
  }

  isValidMove(fx, fy, tx, ty) {
    const p = this.get(fx, fy);
    if (p === '.') return false;
    const t = this.get(tx, ty);
    if (sameSide(p, t)) return false;
    const dx = tx - fx, dy = ty - fy;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);

    switch (p.toUpperCase()) {
      case 'R': // 车
        if (fx !== tx && fy !== ty) return false;
        if (this.countBetween(fx, fy, tx, ty) !== 0) return false;
        break;
      case 'N': { // 马
        if (!((absDx===1&&absDy===2) || (absDx===2&&absDy===1))) return false;
        let bx = fx + (dx > 0 ? 1 : dx < 0 ? -1 : 0);
        let by = fy + (dy > 0 ? 1 : dy < 0 ? -1 : 0);
        if (absDx === 2) bx = fx + dx/2;
        if (absDy === 2) by = fy + dy/2;
        if (this.get(bx, by) !== '.') return false;
        break;
      }
      case 'B': { // 相/象
        if (absDx !== 2 || absDy !== 2) return false;
        if (isRed(p) && ty > 4) return false;
        if (isBlack(p) && ty < 5) return false;
        if (this.get(fx + dx/2, fy + dy/2) !== '.') return false;
        break;
      }
      case 'A': // 仕/士
        if (absDx !== 1 || absDy !== 1) return false;
        if (!this.inPalace(tx, ty, isBlack(p))) return false;
        break;
      case 'K': { // 将/帅
        if (absDx + absDy !== 1) {
          // 将对脸
          if (dx === 0) {
            let ok = true, enemyK = isRed(p) ? 'k' : 'K';
            if (this.get(tx, ty) !== enemyK) ok = false;
            if (this.countBetween(fx, fy, tx, ty) !== 0) ok = false;
            if (!ok) return false;
          } else return false;
        } else {
          if (!this.inPalace(tx, ty, isBlack(p))) return false;
        }
        break;
      }
      case 'C': { // 炮
        if (fx !== tx && fy !== ty) return false;
        let between = this.countBetween(fx, fy, tx, ty);
        if (t === '.' && between !== 0) return false;
        if (t !== '.' && between !== 1) return false;
        break;
      }
      case 'P': { // 兵/卒
        if (isRed(p)) {
          if (dy > 0) return false;
          if (fy >= 5 && dx !== 0) return false; // 未过河不能横走
          if (fy < 5 && absDx > 1) return false;
          if (fy < 5 && absDx === 1 && dy !== 0) return false;
          if (absDx + absDy !== 1) return false;
        } else {
          if (dy < 0) return false;
          if (fy <= 4 && dx !== 0) return false;
          if (fy > 4 && absDx > 1) return false;
          if (fy > 4 && absDx === 1 && dy !== 0) return false;
          if (absDx + absDy !== 1) return false;
        }
        break;
      }
      default: return false;
    }
    // 检查走完后自己是否被将军
    const side = isRed(p) ? 'red' : 'black';
    return !this.isCheckAfterMove(fx, fy, tx, ty, side);
  }

  isInCheck(side) {
    let kx = -1, ky = -1, k = side === 'red' ? 'K' : 'k';
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        if (this.get(x, y) === k) { kx = x; ky = y; break; }
      }
      if (kx >= 0) break;
    }
    if (kx < 0) return false;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = this.get(x, y);
        if (p === '.' || p === k) continue;
        if (side === 'red' && isRed(p)) continue;
        if (side === 'black' && isBlack(p)) continue;
        // 临时检查：不考虑将军的情况下能否走到将的位置
        if (this._canAttack(x, y, kx, ky)) return true;
      }
    }
    return false;
  }

  _canAttack(fx, fy, tx, ty) {
    const p = this.get(fx, fy);
    const t = this.get(tx, ty);
    if (sameSide(p, t)) return false;
    const dx = tx - fx, dy = ty - fy;
    const absDx = Math.abs(dx), absDy = Math.abs(dy);
    switch (p.toUpperCase()) {
      case 'R':
        if (fx !== tx && fy !== ty) return false;
        return this.countBetween(fx, fy, tx, ty) === 0;
      case 'N': {
        if (!((absDx===1&&absDy===2) || (absDx===2&&absDy===1))) return false;
        let bx = fx, by = fy;
        if (absDx === 2) bx = fx + dx/2;
        if (absDy === 2) by = fy + dy/2;
        return this.get(bx, by) === '.';
      }
      case 'B':
        if (absDx !== 2 || absDy !== 2) return false;
        if (isRed(p) && ty > 4) return false;
        if (isBlack(p) && ty < 5) return false;
        return this.get(fx + dx/2, fy + dy/2) === '.';
      case 'A':
        return absDx === 1 && absDy === 1 && this.inPalace(tx, ty, isBlack(p));
      case 'K':
        return absDx + absDy === 1 && this.inPalace(tx, ty, isBlack(p));
      case 'C': {
        if (fx !== tx && fy !== ty) return false;
        let between = this.countBetween(fx, fy, tx, ty);
        return t === '.' ? between === 0 : between === 1;
      }
      case 'P': {
        if (isRed(p)) {
          if (dy > 0) return false;
          if (fy >= 5 && dx !== 0) return false;
          if (fy < 5 && absDx > 1) return false;
          if (fy < 5 && absDx === 1 && dy !== 0) return false;
          return absDx + absDy === 1;
        } else {
          if (dy < 0) return false;
          if (fy <= 4 && dx !== 0) return false;
          if (fy > 4 && absDx > 1) return false;
          if (fy > 4 && absDx === 1 && dy !== 0) return false;
          return absDx + absDy === 1;
        }
      }
    }
    return false;
  }

  isCheckAfterMove(fx, fy, tx, ty, side) {
    const fromPiece = this.get(fx, fy);
    const toPiece = this.get(tx, ty);
    this.set(tx, ty, fromPiece);
    this.set(fx, fy, '.');
    const inCheck = this.isInCheck(side);
    this.set(fx, fy, fromPiece);
    this.set(tx, ty, toPiece);
    return inCheck;
  }

  generateMoves(side) {
    const moves = [];
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = this.get(x, y);
        if (p === '.') continue;
        if (side === 'red' && !isRed(p)) continue;
        if (side === 'black' && !isBlack(p)) continue;
        for (let ty = 0; ty < 10; ty++) {
          for (let tx = 0; tx < 9; tx++) {
            if (this.isValidMove(x, y, tx, ty)) {
              moves.push({fx: x, fy: y, tx: tx, ty: ty, piece: p, captured: this.get(tx, ty)});
            }
          }
        }
      }
    }
    return moves;
  }

  makeMove(fx, fy, tx, ty) {
    const fromPiece = this.get(fx, fy);
    const toPiece = this.get(tx, ty);
    this.history.push({fx, fy, tx, ty, from: fromPiece, to: toPiece});
    this.set(tx, ty, fromPiece);
    this.set(fx, fy, '.');
    return toPiece;
  }

  undo() {
    if (this.history.length === 0) return false;
    const h = this.history.pop();
    this.set(h.fx, h.fy, h.from);
    this.set(h.tx, h.ty, h.to);
    return true;
  }

  findKing(side) {
    const k = side === 'red' ? 'K' : 'k';
    for (let y = 0; y < 10; y++)
      for (let x = 0; x < 9; x++)
        if (this.get(x, y) === k) return {x, y};
    return null;
  }
}

// ====== AI ======
class XiangqiAI {
  constructor(engine) { this.engine = engine; }

  evaluate() {
    const pieceValue = {R:500, N:300, B:150, A:150, K:10000, C:450, P:80,
                        r:500, n:300, b:150, a:150, k:10000, c:450, p:80};
    let score = 0;
    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = this.engine.get(x, y);
        if (p === '.') continue;
        let v = pieceValue[p] || 0;
        // 位置奖励
        if (p === 'P' && y < 5) v += 30;
        if (p === 'p' && y > 4) v += 30;
        if (isRed(p)) score -= v; else score += v;
      }
    }
    return score;
  }

  think() {
    const moves = this.engine.generateMoves('black');
    if (moves.length === 0) return null;

    // 简单搜索：优先吃子，其次中心控制
    let bestMoves = [];
    let bestScore = -99999;

    for (const m of moves) {
      let score = 0;
      // 吃子奖励
      if (m.captured !== '.') {
        const cv = {R:500, N:300, B:150, A:150, C:450, P:80,
                    r:500, n:300, b:150, a:150, c:450, p:80}[m.captured] || 0;
        score += cv;
      }
      // 位置奖励
      score += (4 - Math.abs(m.tx - 4)) * 5;
      score += (m.ty > 3 && m.ty < 7) ? 10 : 0;

      this.engine.makeMove(m.fx, m.fy, m.tx, m.ty);
      // 检查能否吃将
      const redK = this.engine.findKing('red');
      if (redK && this.engine._canAttack(m.tx, m.ty, redK.x, redK.y)) {
        score += 5000;
      }
      // 避免被吃
      const myK = this.engine.findKing('black');
      if (myK && this.engine.isInCheck('black')) score -= 3000;

      this.engine.undo();

      if (score > bestScore) { bestScore = score; bestMoves = [m]; }
      else if (score === bestScore) { bestMoves.push(m); }
    }

    return bestMoves[Math.floor(Math.random() * bestMoves.length)];
  }
}

// ====== 游戏控制器 ======
class GameController {
  constructor() {
    this.engine = new XiangqiEngine();
    this.ai = new XiangqiAI(this.engine);
    this.selected = null;
    this.turn = 'red';
    this.moveCount = 0;
    this.moves = [];
    this.boardEl = document.getElementById('chessboard');
    this.statusEl = document.getElementById('statusBadge');
    this.moveListEl = document.getElementById('moveList');
    this.hintEl = document.getElementById('battleHint');
    this.lastMove = null;
  }

  init() {
    this.engine.reset();
    this.selected = null;
    this.turn = 'red';
    this.moveCount = 0;
    this.moves = [];
    this.lastMove = null;
    this.renderBoard();
    this.renderPieces();
    this.updateStatus();
    this.moveListEl.innerHTML = '';
    // 绑定棋盘空位点击
    this.boardEl.onclick = (e) => this.onBoardClick(e);
  }

  renderBoard() {
    // SVG棋盘背景
    const w = 9, h = 10;
    let svg = `<svg viewBox="0 0 900 1000" preserveAspectRatio="xMidYMid meet">`;
    // 背景
    svg += `<rect x="0" y="0" width="900" height="1000" fill="#e8c8a0" rx="8"/>`;
    // 外框
    svg += `<rect x="45" y="45" width="810" height="910" fill="none" stroke="#5c3a1e" stroke-width="3"/>`;
    // 横线
    for (let y = 0; y < h; y++) {
      svg += `<line x1="45" y1="${45+y*100}" x2="855" y2="${45+y*100}" stroke="#5c3a1e" stroke-width="2"/>`;
    }
    // 竖线（上下分开）
    for (let x = 0; x < w; x++) {
      svg += `<line x1="${45+x*100}" y1="45" x2="${45+x*100}" y2="445" stroke="#5c3a1e" stroke-width="2"/>`;
      svg += `<line x1="${45+x*100}" y1="545" x2="${45+x*100}" y2="955" stroke="#5c3a1e" stroke-width="2"/>`;
    }
    // 九宫斜线
    svg += `<line x1="345" y1="45" x2="555" y2="255" stroke="#5c3a1e" stroke-width="2"/>`;
    svg += `<line x1="555" y1="45" x2="345" y2="255" stroke="#5c3a1e" stroke-width="2"/>`;
    svg += `<line x1="345" y1="955" x2="555" y2="745" stroke="#5c3a1e" stroke-width="2"/>`;
    svg += `<line x1="555" y1="955" x2="345" y2="745" stroke="#5c3a1e" stroke-width="2"/>`;
    // 楚河汉界
    svg += `<text x="450" y="505" text-anchor="middle" fill="#5c3a1e" font-size="36" font-family="serif" font-weight="bold">楚 河　　　　汉 界</text>`;
    // 炮位/兵位标记点
    const dots = [
      [1,2],[7,2],[0,3],[2,3],[4,3],[6,3],[8,3],
      [1,7],[7,7],[0,6],[2,6],[4,6],[6,6],[8,6]
    ];
    for (const [dx, dy] of dots) {
      const cx = 45 + dx*100, cy = 45 + dy*100;
      const s = 6;
      if (dx > 0) svg += `<line x1="${cx-s}" y1="${cy-s}" x2="${cx-s}" y2="${cy-s*2}" stroke="#5c3a1e" stroke-width="1.5"/><line x1="${cx-s}" y1="${cy-s}" x2="${cx-s*2}" y2="${cy-s}" stroke="#5c3a1e" stroke-width="1.5"/>`;
      if (dx < 8) svg += `<line x1="${cx+s}" y1="${cy-s}" x2="${cx+s}" y2="${cy-s*2}" stroke="#5c3a1e" stroke-width="1.5"/><line x1="${cx+s}" y1="${cy-s}" x2="${cx+s*2}" y2="${cy-s}" stroke="#5c3a1e" stroke-width="1.5"/>`;
      if (dx > 0) svg += `<line x1="${cx-s}" y1="${cy+s}" x2="${cx-s}" y2="${cy+s*2}" stroke="#5c3a1e" stroke-width="1.5"/><line x1="${cx-s}" y1="${cy+s}" x2="${cx-s*2}" y2="${cy+s}" stroke="#5c3a1e" stroke-width="1.5"/>`;
      if (dx < 8) svg += `<line x1="${cx+s}" y1="${cy+s}" x2="${cx+s}" y2="${cy+s*2}" stroke="#5c3a1e" stroke-width="1.5"/><line x1="${cx+s}" y1="${cy+s}" x2="${cx+s*2}" y2="${cy+s}" stroke="#5c3a1e" stroke-width="1.5"/>`;
    }
    svg += `</svg>`;
    this.boardEl.innerHTML = svg;
  }

  renderPieces() {
    // 清除旧的棋子（保留SVG）
    const old = this.boardEl.querySelectorAll('.piece, .dot-indicator');
    old.forEach(el => el.remove());

    for (let y = 0; y < 10; y++) {
      for (let x = 0; x < 9; x++) {
        const p = this.engine.get(x, y);
        if (p === '.') continue;
        const el = document.createElement('div');
        el.className = `piece ${isRed(p) ? 'piece-red' : 'piece-black'}`;
        el.style.left = ((x + 0.5) / 9 * 100) + '%';
        el.style.top = ((y + 0.5) / 10 * 100) + '%';
        el.style.transform = 'translate(-50%, -50%)';
        if (this.lastMove && ((this.lastMove.fx === x && this.lastMove.fy === y) || (this.lastMove.tx === x && this.lastMove.ty === y))) {
          el.classList.add('last-move');
        }
        el.innerHTML = `<div class="piece-inner">${PIECE_CHARS[p]}</div>`;
        el.onclick = (e) => { e.stopPropagation(); this.onPieceClick(x, y); };
        this.boardEl.appendChild(el);
      }
    }
  }

  onBoardClick(e) {
    if (this.turn !== 'red') return;
    // 获取点击坐标对应的棋盘位置
    const rect = this.boardEl.getBoundingClientRect();
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const bx = Math.floor(relX * 9);
    const by = Math.floor(relY * 10);
    if (bx < 0 || bx > 8 || by < 0 || by > 9) return;
    this.onPieceClick(bx, by);
  }

  onPieceClick(x, y) {
    if (this.turn !== 'red') return;
    const p = this.engine.get(x, y);

    if (this.selected) {
      const {sx, sy} = this.selected;
      if (sx === x && sy === y) {
        this.clearSelection();
        return;
      }
      if (this.engine.isValidMove(sx, sy, x, y)) {
        this.doMove(sx, sy, x, y);
        return;
      }
      // 点击了不合法的位置，如果点击的是另一个己方棋子，切换选择
      if (isRed(p)) {
        this.selectPiece(x, y);
        return;
      }
      // 其他情况清除选择
      this.clearSelection();
      return;
    }

    if (isRed(p)) {
      this.selectPiece(x, y);
    }
  }

  selectPiece(x, y) {
    this.clearSelection();
    this.selected = {sx: x, sy: y};
    // 高亮选中的棋子
    const pieces = this.boardEl.querySelectorAll('.piece');
    pieces.forEach(el => {
      const px = Math.round((parseFloat(el.style.left) / 100 * 9) - 0.5);
      const py = Math.round((parseFloat(el.style.top) / 100 * 10) - 0.5);
      if (px === x && py === y) el.classList.add('selected');
    });
    // 显示可行走法
    for (let ty = 0; ty < 10; ty++) {
      for (let tx = 0; tx < 9; tx++) {
        if (this.engine.isValidMove(x, y, tx, ty)) {
          const dot = document.createElement('div');
          dot.className = 'dot-indicator';
          dot.style.left = ((tx + 0.5) / 9 * 100) + '%';
          dot.style.top = ((ty + 0.5) / 10 * 100) + '%';
          dot.style.transform = 'translate(-50%, -50%)';
          this.boardEl.appendChild(dot);
        }
      }
    }
  }

  clearSelection() {
    this.selected = null;
    this.boardEl.querySelectorAll('.piece.selected').forEach(el => el.classList.remove('selected'));
    this.boardEl.querySelectorAll('.dot-indicator').forEach(el => el.remove());
  }

  doMove(fx, fy, tx, ty) {
    const captured = this.engine.makeMove(fx, fy, tx, ty);
    this.lastMove = {fx, fy, tx, ty};
    this.moves.push({fx, fy, tx, ty, piece: this.engine.get(tx, ty), captured});
    this.clearSelection();
    this.renderPieces();
    this.addMoveRecord(fx, fy, tx, ty);

    if (captured.toUpperCase() === 'K') {
      showModal('对局结束', '你吃掉了对方的将，获得胜利！');
      this.turn = 'over';
      this.updateStatus();
      return;
    }

    this.turn = 'black';
    this.updateStatus();
    setTimeout(() => this.aiTurn(), 600);
  }

  aiTurn() {
    if (this.turn !== 'black') return;
    this.statusEl.className = 'status-badge status-thinking';
    this.statusEl.textContent = 'AI 思考中...';

    setTimeout(() => {
      const move = this.ai.think();
      if (!move) {
        showModal('对局结束', 'AI 无棋可走，你赢了！');
        this.turn = 'over';
        this.updateStatus();
        return;
      }
      const captured = this.engine.makeMove(move.fx, move.fy, move.tx, move.ty);
      this.lastMove = {fx: move.fx, fy: move.fy, tx: move.tx, ty: move.ty};
      this.moves.push({fx: move.fx, fy: move.fy, tx: move.tx, ty: move.ty, piece: this.engine.get(move.tx, move.ty), captured});
      this.renderPieces();
      this.addMoveRecord(move.fx, move.fy, move.tx, move.ty);

      if (captured.toUpperCase() === 'K') {
        showModal('对局结束', 'AI吃掉了你的帅，你输了。再接再厉！');
        this.turn = 'over';
        this.updateStatus();
        return;
      }

      this.turn = 'red';
      this.updateStatus();
    }, 400);
  }

  addMoveRecord(fx, fy, tx, ty) {
    // 每两步（红黑各一）添加一条记录
    if (this.moves.length % 2 !== 0) return;
    const num = this.moves.length / 2;
    const redMove = this.moves[this.moves.length - 2];
    const blackMove = this.moves[this.moves.length - 1];
    const row = document.createElement('div');
    row.className = 'move-row';
    row.innerHTML = `<span class="move-num">${num}.</span><span class="move-red">${PIECE_CHARS[redMove.piece]}${String.fromCharCode(97+redMove.fx)}${10-redMove.fy}-${String.fromCharCode(97+redMove.tx)}${10-redMove.ty}</span><span class="move-black">${PIECE_CHARS[blackMove.piece]}${String.fromCharCode(97+blackMove.fx)}${10-blackMove.fy}-${String.fromCharCode(97+blackMove.tx)}${10-blackMove.ty}</span>`;
    this.moveListEl.appendChild(row);
    this.moveListEl.scrollTop = this.moveListEl.scrollHeight;
  }

  updateStatus() {
    if (this.turn === 'red') {
      this.statusEl.className = 'status-badge status-your-turn';
      this.statusEl.textContent = '轮到你了';
      this.hintEl.textContent = '点击己方棋子，再点击目标位置进行移动。';
    } else if (this.turn === 'black') {
      this.statusEl.className = 'status-badge status-ai-turn';
      this.statusEl.textContent = 'AI 思考中...';
      this.hintEl.textContent = 'AI正在计算最佳走法...';
    } else {
      this.statusEl.className = 'status-badge';
      this.statusEl.textContent = '对局结束';
      this.hintEl.textContent = '对局已结束，可以重新开始或查看复盘。';
    }
  }

  undo() {
    if (this.turn === 'over') return;
    if (this.engine.history.length < 2) return;
    this.engine.undo(); // undo AI
    this.engine.undo(); // undo player
    this.moves.pop(); this.moves.pop();
    // remove last move record
    const rows = this.moveListEl.querySelectorAll('.move-row');
    if (rows.length > 0) rows[rows.length - 1].remove();
    this.turn = 'red';
    this.lastMove = null;
    if (this.moves.length > 0) {
      const last = this.moves[this.moves.length - 1];
      this.lastMove = {fx: last.fx, fy: last.fy, tx: last.tx, ty: last.ty};
    }
    this.renderPieces();
    this.updateStatus();
    showToast('已悔棋');
  }

  restart() {
    this.init();
    showToast('重新开始');
  }
}

// ====== 评估问卷 ======
const QUESTIONS = [
  {
    category: 'opening',
    text: '开局题：红方先行，以下哪种走法最符合中炮开局的基本原理？',
    board: 'opening1',
    options: [
      {text:'炮二平五（当头炮，直取中路）', correct:true},
      {text:'兵七进一（进七兵，过于保守）', correct:false},
      {text:'相三进五（飞相，偏向防守）', correct:false},
      {text:'马二进三（跳马，未控制中心）', correct:false}
    ]
  },
  {
    category: 'tactics',
    text: '战术题：红方「马二进三」跳出后，在开局阶段马的最主要作用是什么？',
    board: 'tactic1',
    options: [
      {text:'配合中炮控制中路，并为炮、车腾出线路', correct:true},
      {text:'直接冲到对方底线进行偷袭', correct:false},
      {text:'与相配合，形成防守阵型', correct:false},
      {text:'尽快过河，威胁对方边路', correct:false}
    ]
  },
  {
    category: 'midgame',
    text: '中局题：中局阶段「兑子」的基本原则是什么？',
    board: 'midgame1',
    options: [
      {text:'己方子力占优时应主动兑子简化局面', correct:true},
      {text:'任何时候都应尽可能兑掉对方的车', correct:false},
      {text:'对方占优时应主动大量兑子以求和', correct:false},
      {text:'兑子没有任何原则，随机选择即可', correct:false}
    ]
  },
  {
    category: 'endgame',
    text: '残局题：以下哪种残局红方必胜？',
    board: 'endgame1',
    options: [
      {text:'单车对单士（车方必胜）', correct:true},
      {text:'单马对单士（和棋）', correct:false},
      {text:'双兵对单士象（取决于具体位置，多为和棋）', correct:false},
      {text:'单车对单马（多为和棋）', correct:false}
    ]
  },
  {
    category: 'position',
    text: '局面感知：在象棋中，「先手」的核心含义是什么？',
    board: 'position1',
    options: [
      {text:'拥有主动权，可以持续威胁对方并迫使对方防守', correct:true},
      {text:'先走第一步的一方，固定拥有优势', correct:false},
      {text:'棋子数量比对方多', correct:false},
      {text:'将帅的安全有保障', correct:false}
    ]
  }
];

function drawMiniBoard(type) {
  // 简化棋盘SVG
  let svg = `<svg viewBox="0 0 360 400" width="280" height="auto">`;
  svg += `<rect x="0" y="0" width="360" height="400" fill="#e8c8a0" rx="4"/>`;
  svg += `<rect x="20" y="20" width="320" height="360" fill="none" stroke="#5c3a1e" stroke-width="2"/>`;
  for (let y = 0; y < 10; y++) svg += `<line x1="20" y1="${20+y*40}" x2="340" y2="${20+y*40}" stroke="#5c3a1e" stroke-width="1.5"/>`;
  for (let x = 0; x < 9; x++) {
    svg += `<line x1="${20+x*40}" y1="20" x2="${20+x*40}" y2="180" stroke="#5c3a1e" stroke-width="1.5"/>`;
    svg += `<line x1="${20+x*40}" y1="220" x2="${20+x*40}" y2="380" stroke="#5c3a1e" stroke-width="1.5"/>`;
  }
  svg += `<text x="180" y="205" text-anchor="middle" fill="#5c3a1e" font-size="14" font-family="serif">楚河　　　汉界</text>`;
  // 九宫斜线
  svg += `<line x1="140" y1="20" x2="260" y2="140" stroke="#5c3a1e" stroke-width="1.5"/>`;
  svg += `<line x1="260" y1="20" x2="140" y2="140" stroke="#5c3a1e" stroke-width="1.5"/>`;
  svg += `<line x1="140" y1="260" x2="260" y2="380" stroke="#5c3a1e" stroke-width="1.5"/>`;
  svg += `<line x1="260" y1="260" x2="140" y2="380" stroke="#5c3a1e" stroke-width="1.5"/>`;
  // 根据类型放置示例棋子
  const pieces = [];
  let highlights = []; // [{fx,fy,tx,ty}] 箭头标记
  if (type === 'opening1') {
    // 开局：红方右炮在(7,7)，可平到中路(4,7)形成中炮
    // 展示初始布局中炮的出动路线
    pieces.push({x:7,y:7,p:'C',r:true},{x:1,y:7,p:'C',r:true},
      {x:0,y:9,p:'R',r:true},{x:8,y:9,p:'R',r:true},{x:1,y:9,p:'N',r:true},{x:7,y:9,p:'N',r:true},
      {x:4,y:9,p:'K',r:true},{x:3,y:9,p:'A',r:true},{x:5,y:9,p:'A',r:true},
      {x:0,y:6,p:'P',r:true},{x:2,y:6,p:'P',r:true},{x:4,y:6,p:'P',r:true},{x:6,y:6,p:'P',r:true},{x:8,y:6,p:'P',r:true},
      {x:7,y:2,p:'c',r:false},{x:1,y:2,p:'c',r:false},
      {x:0,y:0,p:'r',r:false},{x:8,y:0,p:'r',r:false},{x:1,y:0,p:'n',r:false},{x:7,y:0,p:'n',r:false},
      {x:4,y:0,p:'k',r:false},{x:3,y:0,p:'a',r:false},{x:5,y:0,p:'a',r:false},
      {x:0,y:3,p:'p',r:false},{x:2,y:3,p:'p',r:false},{x:4,y:3,p:'p',r:false},{x:6,y:3,p:'p',r:false},{x:8,y:3,p:'p',r:false});
    highlights.push({fx:7,fy:7,tx:4,ty:7}); // 炮二平五示意箭头
  } else if (type === 'tactic1') {
    // 马二进三：展示红右马从初始(7,9)跳到(5,8)
    pieces.push({x:7,y:9,p:'N',r:true},{x:1,y:9,p:'N',r:true},
      {x:7,y:7,p:'C',r:true},{x:1,y:7,p:'C',r:true},
      {x:0,y:9,p:'R',r:true},{x:8,y:9,p:'R',r:true},
      {x:4,y:9,p:'K',r:true},{x:3,y:9,p:'A',r:true},{x:5,y:9,p:'A',r:true},
      {x:4,y:0,p:'k',r:false},{x:3,y:0,p:'a',r:false},{x:5,y:0,p:'a',r:false},
      {x:0,y:0,p:'r',r:false},{x:8,y:0,p:'r',r:false});
    highlights.push({fx:7,fy:9,tx:5,ty:8}); // 马二进三示意箭头
  } else if (type === 'midgame1') {
    // 兑子场景：红方多一车，可以主动兑子简化
    pieces.push({x:0,y:5,p:'R',r:true},{x:8,y:5,p:'R',r:true},
      {x:4,y:7,p:'C',r:true},{x:1,y:7,p:'N',r:true},{x:7,y:7,p:'N',r:true},
      {x:4,y:9,p:'K',r:true},{x:3,y:9,p:'A',r:true},{x:5,y:9,p:'A',r:true},
      {x:0,y:0,p:'r',r:false},{x:8,y:0,p:'r',r:false},
      {x:4,y:0,p:'k',r:false},{x:3,y:0,p:'a',r:false},{x:5,y:0,p:'a',r:false},
      {x:1,y:2,p:'n',r:false},{x:7,y:2,p:'n',r:false});
  } else if (type === 'endgame1') {
    // 残局：单车对单士，车方必胜。红帅助阵控制中路
    pieces.push({x:2,y:5,p:'R',r:true},{x:4,y:9,p:'K',r:true},
      {x:3,y:1,p:'a',r:false},{x:4,y:0,p:'k',r:false});
  } else {
    // 先手概念：红方正在进攻，黑方被迫防守
    pieces.push({x:0,y:5,p:'R',r:true},{x:8,y:4,p:'R',r:true},
      {x:4,y:7,p:'C',r:true},{x:1,y:7,p:'N',r:true},{x:7,y:7,p:'N',r:true},
      {x:4,y:9,p:'K',r:true},{x:3,y:9,p:'A',r:true},{x:5,y:9,p:'A',r:true},
      {x:4,y:0,p:'k',r:false},{x:3,y:0,p:'a',r:false},{x:5,y:0,p:'a',r:false},
      {x:0,y:0,p:'r',r:false},{x:8,y:0,p:'r',r:false},
      {x:1,y:2,p:'n',r:false},{x:7,y:2,p:'n',r:false});
  }
  for (const pc of pieces) {
    const cx = 20 + pc.x*40, cy = 20 + pc.y*40;
    svg += `<circle cx="${cx}" cy="${cy}" r="16" fill="${pc.r?'#fff':'#333'}" stroke="${pc.r?'#c41e3a':'#666'}" stroke-width="2"/>`;
    svg += `<text x="${cx}" y="${cy+5}" text-anchor="middle" fill="${pc.r?'#c41e3a':'#e0e0e0'}" font-size="16" font-weight="bold">${PIECE_CHARS[pc.p]}</text>`;
  }
  // 绘制高亮箭头
  for (const h of highlights) {
    const x1 = 20 + h.fx*40, y1 = 20 + h.fy*40;
    const x2 = 20 + h.tx*40, y2 = 20 + h.ty*40;
    // 目标位置闪烁圈
    svg += `<circle cx="${x2}" cy="${y2}" r="18" fill="none" stroke="#d4a843" stroke-width="2.5" stroke-dasharray="4 3"/>`;
    // 移动箭头
    svg += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#d4a843" stroke-width="2" stroke-dasharray="5 4" opacity="0.8"/>`;
    // 箭头头部
    const angle = Math.atan2(y2-y1, x2-x1);
    const ax1 = x2 - 8*Math.cos(angle - 0.5);
    const ay1 = y2 - 8*Math.sin(angle - 0.5);
    const ax2 = x2 - 8*Math.cos(angle + 0.5);
    const ay2 = y2 - 8*Math.sin(angle + 0.5);
    svg += `<polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" fill="#d4a843" opacity="0.8"/>`;
  }
  svg += `</svg>`;
  return svg;
}

// ====== 应用控制器 ======
class App {
  constructor() {
    this.qIndex = 0;
    this.answers = [];
    this.scores = { opening: 50, tactics: 50, midgame: 50, endgame: 50, position: 50 };
  }

  startAssessment() {
    this.qIndex = 0;
    this.answers = [];
    this.scores = { opening: 50, tactics: 50, midgame: 50, endgame: 50, position: 50 };
    this.switchPage('page-assess');
    this.showQuestion();
  }

  showQuestion() {
    const q = QUESTIONS[this.qIndex];
    document.getElementById('qCurrent').textContent = this.qIndex + 1;
    document.getElementById('qTotal').textContent = QUESTIONS.length;
    document.getElementById('qProgress').style.width = ((this.qIndex + 1) / QUESTIONS.length * 100) + '%';
    document.getElementById('qText').textContent = q.text;
    document.getElementById('qBoard').innerHTML = drawMiniBoard(q.board);

    const optsEl = document.getElementById('qOptions');
    optsEl.innerHTML = '';
    q.options.forEach((opt, i) => {
      const div = document.createElement('div');
      div.className = 'option' + (this.answers[this.qIndex] === i ? ' selected' : '');
      div.innerHTML = `<div class="option-key">${String.fromCharCode(65+i)}</div><div class="option-text">${opt.text}</div>`;
      div.onclick = () => this.selectOption(i);
      optsEl.appendChild(div);
    });

    document.getElementById('btnPrev').disabled = this.qIndex === 0;
    document.getElementById('btnNext').disabled = this.answers[this.qIndex] === undefined;
    document.getElementById('btnNext').textContent = this.qIndex === QUESTIONS.length - 1 ? '查看结果 →' : '下一题 →';
  }

  selectOption(i) {
    this.answers[this.qIndex] = i;
    const opts = document.querySelectorAll('.option');
    opts.forEach((el, idx) => el.classList.toggle('selected', idx === i));
    document.getElementById('btnNext').disabled = false;
  }

  nextQuestion() {
    if (this.answers[this.qIndex] === undefined) return;
    if (this.qIndex < QUESTIONS.length - 1) {
      this.qIndex++;
      this.showQuestion();
    } else {
      this.calcResult();
      this.showResult();
    }
  }

  prevQuestion() {
    if (this.qIndex > 0) {
      this.qIndex--;
      this.showQuestion();
    }
  }

  calcResult() {
    const base = { opening: 40, tactics: 40, midgame: 40, endgame: 40, position: 40 };
    QUESTIONS.forEach((q, i) => {
      const ans = q.options[this.answers[i]];
      if (ans && ans.correct) this.scores[q.category] = Math.min(95, base[q.category] + 35 + Math.floor(Math.random()*15));
      else this.scores[q.category] = Math.max(25, base[q.category] + Math.floor(Math.random()*20));
    });
  }

  showResult() {
    this.switchPage('page-result');
    const s = this.scores;
    // 雷达图
    const chart = echarts.init(document.getElementById('radarChart'), null, {renderer: 'svg'});
    chart.setOption({
      animation: false,
      tooltip: {
        trigger: 'item', appendToBody: true,
        backgroundColor: '#1a1a1f', borderColor: 'rgba(240,240,245,0.1)',
        textStyle: { color: '#f0f0f5' }
      },
      legend: {
        data: ['当前水平', '同级平均'],
        bottom: 0, textStyle: { color: '#8a8a95' }
      },
      radar: {
        indicator: [
          {name:'开局深度',max:100},{name:'战术敏感度',max:100},{name:'中局计算力',max:100},
          {name:'残局基本功',max:100},{name:'局面感知',max:100}
        ],
        shape: 'polygon', splitNumber: 4,
        axisName: { color: '#8a8a95', fontSize: 12 },
        splitLine: { lineStyle: { color: 'rgba(240,240,245,0.08)' } },
        splitArea: { show: true, areaStyle: { color: ['transparent', 'rgba(240,240,245,0.02)'] } },
        axisLine: { lineStyle: { color: 'rgba(240,240,245,0.08)' } }
      },
      series: [{
        name: '棋力评估', type: 'radar',
        data: [
          { value: [s.opening, s.tactics, s.midgame, s.endgame, s.position], name: '当前水平',
            lineStyle: { color: '#c41e3a', width: 2 }, areaStyle: { color: 'rgba(196,30,58,0.2)' },
            itemStyle: { color: '#c41e3a' }, symbol: 'circle', symbolSize: 6 },
          { value: [60, 55, 58, 52, 56], name: '同级平均',
            lineStyle: { color: '#d4a843', width: 2, type: 'dashed' }, areaStyle: { color: 'transparent' },
            itemStyle: { color: '#d4a843' }, symbol: 'circle', symbolSize: 5 }
        ]
      }]
    });
    window.addEventListener('resize', () => chart.resize());

    // 分析卡片
    this.cats = [
      {key:'opening', name:'开局深度', score:s.opening, desc:s.opening>70?'你对常见开局体系（如中炮、飞相、仙人指路）有较深的理解，能根据对手应对选择正确的后续变化。':'你的开局储备不够丰富，建议系统学习中炮对屏风马、中炮对反宫马等主流开局。'},
      {key:'tactics', name:'战术敏感度', score:s.tactics, desc:s.tactics>70?'你具备较强的战术嗅觉，能发现抽将、牵制、弃子等战术机会。':'你容易错过战术机会，建议每天做10-15道基本战术题（抽将、闪击、双重威胁）。'},
      {key:'midgame', name:'中局计算力', score:s.midgame, desc:s.midgame>70?'你擅长中局计划制定，知道何时兑子、何时保持复杂，计算力表现优秀。':'中局判断力有待提高，建议多观摩大师对局的中局阶段，学习兑子和运子技巧。'},
      {key:'endgame', name:'残局基本功', score:s.endgame, desc:s.endgame>70?'你对基本残局定式（车胜单士、马兵胜单缺象等）掌握扎实。':'残局是你较薄弱的环节，建议从「单车胜单士」「马兵残局」等基本定式开始系统学习。'},
      {key:'position', name:'局面感知', score:s.position, desc:s.position>70?'你对先手、主动权等概念理解清晰，能根据局面特征制定合理战略。':'你对面局面整体判断尚可，但对「先手」「主动权」等核心概念的理解需要加强。'}
    ];
    const cardsEl = document.getElementById('analysisCards');
    cardsEl.innerHTML = this.cats.map(c => `
      <div class="analysis-card">
        <h4>${c.name}</h4>
        <div class="score">${c.score}</div>
        <p>${c.desc}</p>
      </div>
    `).join('');
  }

  startBattle() {
    this.switchPage('page-battle');
    game.init();
  }

  finishBattle() {
    this.showReview();
  }

  showReview() {
    this.switchPage('page-review');
    const s = this.scores;
    const totalMoves = game.moves.length;
    const captures = game.moves.filter(m => m.captured !== '.').length;

    // 对局统计
    document.getElementById('battleStats').innerHTML = `
      <div class="analysis-card"><h4>总步数</h4><div class="score">${totalMoves}</div><p>你与AI共走了${totalMoves}步</p></div>
      <div class="analysis-card"><h4>吃子数</h4><div class="score">${captures}</div><p>对局中发生${captures}次吃子</p></div>
      <div class="analysis-card"><h4>对战时长</h4><div class="score">~${Math.ceil(totalMoves * 0.5)}分</div><p>预估对局用时</p></div>
      <div class="analysis-card"><h4>综合评分</h4><div class="score">${Math.round((s.opening+s.tactics+s.midgame+s.endgame+s.position)/5)}</div><p>基于评估测试的预估等级分</p></div>
    `;

    // 失误分析（基于评估结果模拟）
    const mistakes = [];
    if (s.tactics < 65) mistakes.push({title:'战术嗅觉不足', desc:'对局中出现了几次明显的战术机会（如抽将、闪击），但未能及时捕捉。这是业余棋手最常见的薄弱环节。', sug:'建议每天做15-20道基本战术题，从最简单的「一步杀」开始，逐步提升到「两步杀」和复合战术。'});
    if (s.opening < 65) mistakes.push({title:'开局体系不完善', desc:'前几步棋没有遵循经典的开局原则，导致出子速度慢、阵型松散。中局初期就处于被动。', sug:'建议选定一种先手开局（推荐中炮体系）深入学习，记住前5-8步的 standard 变化。'});
    if (s.endgame < 65) mistakes.push({title:'残局定式不熟悉', desc:'在进入残局阶段后，未能将微弱的优势转化为胜势，或者未能正确防守劣势残局。', sug:'重点练习「单车胜单士」「马兵残局」等必胜/必和定式，培养残局的精确计算能力。'});
    if (s.position < 65) mistakes.push({title:'主动权意识薄弱', desc:'对局中多次将主动权拱手让给对方，自己的棋子各自为战，缺乏整体协调。', sug:'学习「先手」概念——每步棋都要思考：这步棋是否在威胁对方？是否迫使对方被动应对？'});
    if (mistakes.length === 0) mistakes.push({title:'整体表现良好', desc:'你的棋力基础扎实，各维度均衡发展。建议继续保持日常训练，向更高水平迈进。', sug:'尝试开启更高难度的AI对战，挑战自己的极限，并在复盘时注意深入分析每步棋的 alternatives。'});

    document.getElementById('mistakeList').innerHTML = mistakes.map((m, i) => `
      <div class="review-mistake">
        <div class="num">${i+1}</div>
        <div>
          <h4>${m.title}</h4>
          <p>${m.desc}</p>
          <div class="suggestion">💡 ${m.sug}</div>
        </div>
      </div>
    `).join('');

    // 训练计划
    const weakCats = this.cats.filter(c => s[c.key] < 70).map(c => c.name);
    const plan = [
      {text:`${weakCats[0] || '综合'}专项训练`, tag:'每日 15 分钟'},
      {text:`${weakCats[1] || '战术'}强化题集`, tag:'每日 10 题'},
      {text:'AI自适应对战 3 盘', tag:'实战检验'},
      {text:'经典对局复盘学习', tag:'每周 2 局'}
    ];
    document.getElementById('trainingPlan').innerHTML = `
      <h4>本周训练计划</h4>
      ${plan.map(p => `
        <div class="training-item">
          <div class="training-check">✓</div>
          <div class="training-text">${p.text}</div>
          <div class="training-tag">${p.tag}</div>
        </div>
      `).join('')}
    `;
  }

  switchPage(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    window.scrollTo(0, 0);
  }
}

// ====== UI 工具 ======
function showToast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2000);
}
function showModal(title, text) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalText').textContent = text;
  document.getElementById('modal').classList.add('active');
}
function closeModal() {
  document.getElementById('modal').classList.remove('active');
}

// ====== 初始化 ======
window.app = new App();
window.game = new GameController();
