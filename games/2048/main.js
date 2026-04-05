/**
 * 2048 游戏 - 主入口模块（UI 渲染 & 交互控制）
 *
 * 功能模块：
 *   1. 游戏状态管理（分数/最高分/撤销栈/连击计数/计时器）
 *   2. 棋盘渲染（DOM 方块定位 + CSS 动画类挂载）
 *   3. 动画特效系统：
 *      - 方块出现/合并/撞墙/阻挡果冻动画
 *      - 合并光环 + 粒子爆发
 *      - 棋盘内加分弹出 → 吸入粒子飞向分数框
 *      - 分数框果冻反馈 + 冲击波
 *      - 连击提示 / 棋盘震动
 *   4. 计分板翻转动画（逐位数字滚动）
 *   5. 输入处理（键盘 WASD/方向键 + 触摸滑动 + 鼠标拖拽）
 *
 * 依赖 game.js 提供纯逻辑计算。
 */
import {
  createEmptyGrid, cloneGrid, addRandomTile, move,
  hasAvailableMoves, hasWon, getMaxTile, getEmptyCells
} from './game.js';

const SIZE = 4;

// ===== 游戏状态 =====
let grid = createEmptyGrid();
let score = 0;
let bestScore = parseInt(localStorage.getItem('2048-best') || '0');
let moveCount = 0;
let gameOver = false;
let gameWon = false;
let keepPlaying = false;   // 达到 2048 后选择继续挑战
let isAnimating = false;   // 移动动画锁，防止快速连按
let startTime = null;
let timerInterval = null;
let comboCount = 0;        // 连续合并计数
let lastMoveHadMerge = false;

// 撤销栈（最多保留 10 步）
let undoStack = [];
const MAX_UNDO = 10;

// 待加分数队列（飞行粒子到达分数框后才真正刷新 UI）
let pendingScore = 0;

// 计分板翻转动画 - 上一次的数字字符串
let lastScoreStr = '0';
let lastBestScoreStr = '0';

/**
 * 方块颜色映射表（用于粒子 & 光环特效着色）
 * 键为方块数值，值为 HEX 颜色
 */
const TILE_COLORS = {
  2: '#94a3b8', 4: '#fcd34d', 8: '#f97316', 16: '#ea580c',
  32: '#ef4444', 64: '#dc2626', 128: '#a855f7', 256: '#7c3aed',
  512: '#6366f1', 1024: '#ec4899', 2048: '#f59e0b'
};

function getTileColor(value) {
  return TILE_COLORS[value] || '#4338ca';
}

// ===== DOM 元素引用 =====
const scoreEl = document.getElementById('score');
const bestScoreEl = document.getElementById('best-score');
const moveCountEl = document.getElementById('move-count');
const maxTileEl = document.getElementById('max-tile');
const gameTimeEl = document.getElementById('game-time');
const finalScoreEl = document.getElementById('final-score');
const tileContainer = document.getElementById('tile-container');
const gridBackground = document.getElementById('grid-background');
const gameBoard = document.getElementById('game-board');
const gameOverOverlay = document.getElementById('game-over-overlay');
const gameWinOverlay = document.getElementById('game-win-overlay');
const scorePopupContainer = document.getElementById('score-popup-container');
const effectsLayer = document.getElementById('effects-layer');


// =====================================================================
// 计分板翻转动画系统
// =====================================================================

/**
 * 逐位翻转更新分数显示
 * 对比新旧字符串，变化的位播放上→下翻转动画，未变的位直接显示。
 *
 * @param {HTMLElement} el - 分数容器
 * @param {number} newValue - 新分数值
 * @param {string} lastStr - 上一次的字符串
 * @returns {string} 新的字符串（供下次对比）
 */
function animateScoreDigits(el, newValue, lastStr) {
  const newStr = String(newValue);
  const maxLen = Math.max(newStr.length, lastStr.length);
  const paddedOld = lastStr.padStart(maxLen, ' ');
  const paddedNew = newStr.padStart(maxLen, ' ');

  el.innerHTML = '';
  el.style.display = 'inline-flex';
  el.style.justifyContent = 'center';

  for (let i = 0; i < maxLen; i++) {
    const oldChar = paddedOld[i];
    const newChar = paddedNew[i];

    const digitWrapper = document.createElement('span');
    digitWrapper.className = 'score-digit';

    if (oldChar !== newChar) {
      // 变化位：创建上/下两层，延迟触发 translateY(-50%)
      const inner = document.createElement('span');
      inner.className = 'score-digit-inner';

      const oldDigit = document.createElement('span');
      oldDigit.className = 'score-digit-old';
      oldDigit.textContent = oldChar === ' ' ? '' : oldChar;

      const newDigit = document.createElement('span');
      newDigit.className = 'score-digit-new';
      newDigit.textContent = newChar === ' ' ? '' : newChar;

      inner.appendChild(oldDigit);
      inner.appendChild(newDigit);
      digitWrapper.appendChild(inner);

      // 位间错开 20ms，加速翻转
      const delay = i * 20;
      setTimeout(() => {
        inner.style.transform = 'translateY(-50%)';
      }, delay + 15);
    } else {
      digitWrapper.textContent = newChar === ' ' ? '' : newChar;
    }

    el.appendChild(digitWrapper);
  }

  return newStr;
}


// =====================================================================
// 棋盘渲染
// =====================================================================

/** 初始化 4×4 背景网格 */
function initGridBackground() {
  gridBackground.innerHTML = '';
  for (let i = 0; i < SIZE * SIZE; i++) {
    const cell = document.createElement('div');
    cell.className = 'grid-cell';
    gridBackground.appendChild(cell);
  }
}

/**
 * 计算方块的像素位置
 * @param {number} row
 * @param {number} col
 * @returns {{ left: number, top: number, cellSize: number }}
 */
function getTilePosition(row, col) {
  const boardRect = gridBackground.getBoundingClientRect();
  const cellGap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));
  const cellSize = (boardRect.width - cellGap * (SIZE - 1)) / SIZE;

  return {
    left: col * (cellSize + cellGap),
    top: row * (cellSize + cellGap),
    cellSize: cellSize
  };
}

/**
 * 渲染整个棋盘
 * 遍历 grid 创建方块 DOM，并根据参数挂载对应的动画 CSS 类。
 *
 * @param {object|null} newTile - 新生成的方块信息
 * @param {Array} mergeInfo - 合并位置列表
 * @param {string|null} direction - 移动方向
 * @param {Array} wallHits - 撞墙位置列表
 */
function renderGrid(newTile = null, mergeInfo = [], direction = null, wallHits = []) {
  tileContainer.innerHTML = '';

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const value = grid[r][c];
      if (value === 0) continue;

      const tile = document.createElement('div');
      const pos = getTilePosition(r, c);

      // 基础样式类
      let tileClass = 'tile';
      if (value <= 2048) {
        tileClass += ` tile-${value}`;
      } else {
        tileClass += ' tile-super';
      }

      // 新方块果冻出现动画
      if (newTile && newTile.r === r && newTile.c === c) {
        tileClass += ' tile-new';
      }

      // 合并果冻动画（带方向）
      const isMerged = mergeInfo.some(info => info.row === r && info.col === c);
      if (isMerged) {
        tileClass += ' tile-merged';
        if (direction) tileClass += ` jelly-${direction}`;
      }

      // 撞墙果冻
      const isWallHit = wallHits.some(info => info.row === r && info.col === c);
      if (isWallHit && !isMerged) {
        tileClass += ` tile-wall-${direction}`;
      }

      // 被阻挡方块的微果冻
      if (!isMerged && !isWallHit && direction && !newTile) {
        if (checkIfBlocked(r, c, direction)) {
          tileClass += ` tile-jelly-${direction}`;
        }
      }

      tile.className = tileClass;
      tile.style.left = `${pos.left}px`;
      tile.style.top = `${pos.top}px`;
      tile.textContent = value;

      tileContainer.appendChild(tile);
    }
  }
}

/**
 * 检查方块在指定方向上是否被阻挡（用于微果冻动画判定）
 */
function checkIfBlocked(row, col, direction) {
  switch (direction) {
    case 'left':
      return col > 0 && grid[row][col - 1] !== 0 && grid[row][col - 1] !== grid[row][col];
    case 'right':
      return col < SIZE - 1 && grid[row][col + 1] !== 0 && grid[row][col + 1] !== grid[row][col];
    case 'up':
      return row > 0 && grid[row - 1][col] !== 0 && grid[row - 1][col] !== grid[row][col];
    case 'down':
      return row < SIZE - 1 && grid[row + 1][col] !== 0 && grid[row + 1][col] !== grid[row][col];
    default:
      return false;
  }
}


// =====================================================================
// 动画特效系统
// =====================================================================

/** 合并光环特效（径向渐变扩散圆） */
function showMergeGlow(row, col, value) {
  const pos = getTilePosition(row, col);
  const color = getTileColor(value);
  const gapVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

  const glow = document.createElement('div');
  glow.className = 'tile-merge-glow';
  const size = pos.cellSize * 0.8;
  glow.style.width = `${size}px`;
  glow.style.height = `${size}px`;
  glow.style.left = `${gapVal + pos.left + (pos.cellSize - size) / 2}px`;
  glow.style.top = `${gapVal + pos.top + (pos.cellSize - size) / 2}px`;
  glow.style.background = `radial-gradient(circle, ${color}88 0%, ${color}00 70%)`;

  effectsLayer.appendChild(glow);
  setTimeout(() => glow.remove(), 600);
}

/** 合并粒子爆发特效（多方向散射小圆点） */
function showMergeParticles(row, col, value) {
  const pos = getTilePosition(row, col);
  const color = getTileColor(value);
  const gapVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));
  const cx = gapVal + pos.left + pos.cellSize / 2;
  const cy = gapVal + pos.top + pos.cellSize / 2;

  const particleCount = Math.min(6 + Math.log2(value), 16);

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'merge-particle';

    const angle = (Math.PI * 2 * i) / particleCount + (Math.random() - 0.5) * 0.5;
    const distance = 25 + Math.random() * 35;
    const px = Math.cos(angle) * distance;
    const py = Math.sin(angle) * distance;

    particle.style.left = `${cx}px`;
    particle.style.top = `${cy}px`;
    particle.style.background = color;
    particle.style.boxShadow = `0 0 6px ${color}`;
    particle.style.setProperty('--px', `${px}px`);
    particle.style.setProperty('--py', `${py}px`);

    const size = 4 + Math.random() * 5;
    particle.style.width = `${size}px`;
    particle.style.height = `${size}px`;

    effectsLayer.appendChild(particle);
    setTimeout(() => particle.remove(), 500);
  }
}

/** 棋盘内加分弹出（从合并方块位置蹦出，分级字号） */
function showBoardScorePopup(row, col, points) {
  const pos = getTilePosition(row, col);
  const gapVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

  const popup = document.createElement('div');

  // 根据分数大小分级字号
  let sizeClass = 'score-small';
  if (points >= 16) sizeClass = 'score-medium';
  if (points >= 64) sizeClass = 'score-large';
  if (points >= 256) sizeClass = 'score-huge';
  if (points >= 1024) sizeClass = 'score-mega';

  popup.className = `board-score-popup ${sizeClass}`;
  popup.textContent = `+${points}`;

  popup.style.left = `${gapVal + pos.left + pos.cellSize / 2}px`;
  popup.style.top = `${gapVal + pos.top + pos.cellSize / 3}px`;
  popup.style.transform = 'translateX(-50%)';

  effectsLayer.appendChild(popup);

  // 弹出后发射吸入粒子飞向分数框
  const popPhase = points >= 512 ? 450 : points >= 128 ? 380 : 300;
  setTimeout(() => {
    launchScoreSuckFromBoard(row, col, points);
  }, popPhase);

  setTimeout(() => popup.remove(), 1600);
}

/** 从棋盘方块位置发射吸入粒子飞向分数框 */
function launchScoreSuckFromBoard(row, col, points) {
  const pos = getTilePosition(row, col);
  const gapVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

  const boardRect = gameBoard.getBoundingClientRect();
  const startX = boardRect.left + gapVal + pos.left + pos.cellSize / 2;
  const startY = boardRect.top + gapVal + pos.top + pos.cellSize / 4 - 30;

  const scoreBoxEl = scoreEl.closest('.score-box');
  const scoreBoxRect = scoreBoxEl.getBoundingClientRect();
  const endX = scoreBoxRect.left + scoreBoxRect.width / 2;
  const endY = scoreBoxRect.top + scoreBoxRect.height / 2;

  const dx = endX - startX;
  const dy = endY - startY;

  // 根据分数决定粒子数量和颜色
  let particleCount = 1;
  let color = '#fbbf24';  // 默认金色
  let megaColor = false;
  if (points >= 32) particleCount = 2;
  if (points >= 128) particleCount = 3;
  if (points >= 512) particleCount = 4;
  if (points >= 1024) { color = '#ff6b6b'; megaColor = true; }

  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'score-suck-particle';

    if (i === 0) {
      // 主粒子：带分数文字
      particle.textContent = `+${points}`;
      let flyFontSize = '2.2rem';
      if (points >= 16) flyFontSize = '2.8rem';
      if (points >= 64) flyFontSize = '3.4rem';
      if (points >= 256) flyFontSize = '4.0rem';
      if (points >= 1024) flyFontSize = '4.8rem';
      particle.style.fontSize = flyFontSize;
      particle.style.fontFamily = "'Orbitron', 'Righteous', 'Nunito', sans-serif";
      particle.style.fontWeight = '900';
      particle.style.letterSpacing = '2px';
      particle.style.color = color;
      if (megaColor) {
        particle.style.textShadow = `0 0 30px rgba(255, 107, 107, 1), 0 0 60px rgba(255, 107, 107, 0.7), 0 0 100px rgba(255, 107, 107, 0.4), 0 4px 10px rgba(0, 0, 0, 0.7)`;
        particle.style.webkitTextStroke = '2px rgba(255, 100, 100, 0.3)';
      } else {
        particle.style.textShadow = `0 0 25px rgba(251, 191, 36, 1), 0 0 50px rgba(251, 191, 36, 0.7), 0 0 80px rgba(251, 191, 36, 0.4), 0 3px 8px rgba(0, 0, 0, 0.6)`;
        particle.style.webkitTextStroke = '1px rgba(255, 200, 0, 0.3)';
      }
      particle.style.width = 'auto';
      particle.style.height = 'auto';
      particle.style.background = 'none';
      particle.style.whiteSpace = 'nowrap';
    } else {
      // 伴随光球
      const ballSize = 6 + Math.random() * 10;
      particle.style.width = `${ballSize}px`;
      particle.style.height = `${ballSize}px`;
      particle.style.background = `radial-gradient(circle, ${color}, ${color}88)`;
      particle.style.boxShadow = `0 0 12px ${color}, 0 0 24px ${color}88`;
    }

    particle.style.left = `${startX + (i > 0 ? (Math.random() - 0.5) * 30 : 0)}px`;
    particle.style.top = `${startY + (i > 0 ? (Math.random() - 0.5) * 15 : 0)}px`;

    const offsetX = i > 0 ? (Math.random() - 0.5) * 15 : 0;
    const offsetY = i > 0 ? (Math.random() - 0.5) * 8 : 0;
    particle.style.setProperty('--dx', `${dx + offsetX}px`);
    particle.style.setProperty('--dy', `${dy + offsetY}px`);

    const flyDuration = 280 + i * 40;
    particle.style.setProperty('--suck-duration', `${flyDuration}ms`);

    document.body.appendChild(particle);

    setTimeout(() => {
      particle.remove();
      if (i === 0) triggerScoreBoxJelly(points);
    }, flyDuration);
  }
}

/** 移动轨迹残影特效 */
function showMoveTrails(oldGrid, newGrid, direction) {
  const gapVal = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--cell-gap'));

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (oldGrid[r][c] !== 0 && oldGrid[r][c] !== newGrid[r][c]) {
        const pos = getTilePosition(r, c);
        const trail = document.createElement('div');
        trail.className = 'move-trail';
        trail.style.width = `${pos.cellSize}px`;
        trail.style.height = `${pos.cellSize}px`;
        trail.style.left = `${gapVal + pos.left}px`;
        trail.style.top = `${gapVal + pos.top}px`;

        const color = getTileColor(oldGrid[r][c]);
        trail.style.background = `${color}33`;

        effectsLayer.appendChild(trail);
        setTimeout(() => trail.remove(), 300);
      }
    }
  }
}

/** 棋盘震动（大合并时触发） */
function shakeBoard(intensity) {
  gameBoard.classList.remove('board-shake');
  void gameBoard.offsetWidth; // 强制重排以重置动画
  gameBoard.classList.add('board-shake');
  setTimeout(() => gameBoard.classList.remove('board-shake'), 300);
}

/** 连击提示文字 */
function showComboText(count) {
  const oldCombo = gameBoard.querySelector('.combo-text');
  if (oldCombo) oldCombo.remove();

  const texts = ['', '', 'COMBO x2 🔥', 'COMBO x3 ⚡', 'COMBO x4 💥', 'COMBO x5 🌟'];
  const text = count >= 5 ? `COMBO x${count} 🌟` : (texts[count] || '');
  if (!text) return;

  const combo = document.createElement('div');
  combo.className = 'combo-text';
  combo.textContent = text;
  gameBoard.appendChild(combo);
  setTimeout(() => combo.remove(), 1000);
}


// =====================================================================
// 分数系统
// =====================================================================

/** 累积待加分数（不立即更新 UI） */
function accumulateScore(addedScore) {
  pendingScore += addedScore;
}

/** 真正刷新分数显示（飞行粒子到达分数框时调用） */
function flushScoreDisplay(addedScore) {
  score += addedScore;
  pendingScore = Math.max(0, pendingScore - addedScore);

  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem('2048-best', bestScore.toString());
  }

  adjustScoreFontSize(scoreEl, score);
  adjustScoreFontSize(bestScoreEl, bestScore);

  lastScoreStr = animateScoreDigits(scoreEl, score, lastScoreStr);
  lastBestScoreStr = animateScoreDigits(bestScoreEl, bestScore, lastBestScoreStr);

  if (addedScore > 0) {
    scoreEl.classList.remove('score-number-bump');
    void scoreEl.offsetWidth;
    scoreEl.classList.add('score-number-bump');
  }
}

/** 根据位数动态缩小字体（防止溢出分数框） */
function adjustScoreFontSize(el, value) {
  const digits = String(value).length;
  el.classList.remove('score-digits-1', 'score-digits-2', 'score-digits-3', 'score-digits-4', 'score-digits-5', 'score-digits-6', 'score-digits-7');
  if (digits <= 3) el.classList.add('score-digits-3');
  else if (digits === 4) el.classList.add('score-digits-4');
  else if (digits === 5) el.classList.add('score-digits-5');
  else if (digits === 6) el.classList.add('score-digits-6');
  else el.classList.add('score-digits-7');
}

/** 立即更新分数（用于撤销、新游戏等非动画场景） */
function updateScoreImmediate() {
  adjustScoreFontSize(scoreEl, score);
  adjustScoreFontSize(bestScoreEl, bestScore);
  lastScoreStr = animateScoreDigits(scoreEl, score, lastScoreStr);
  lastBestScoreStr = animateScoreDigits(bestScoreEl, bestScore, lastBestScoreStr);
}

/** 分数框果冻吸入效果 + 刷新分数显示 */
function triggerScoreBoxJelly(points) {
  const scoreBoxEl = scoreEl.closest('.score-box');
  if (!scoreBoxEl) return;

  flushScoreDisplay(points);

  scoreBoxEl.classList.remove('score-box-jelly');
  void scoreBoxEl.offsetWidth;
  scoreBoxEl.classList.add('score-box-jelly');
  setTimeout(() => scoreBoxEl.classList.remove('score-box-jelly'), 600);

  // 大分数时加冲击波
  if (points >= 64) showScoreBoxShockwave(scoreBoxEl, points);
}

/** 分数框冲击波特效 */
function showScoreBoxShockwave(scoreBoxEl, points) {
  const rect = scoreBoxEl.getBoundingClientRect();
  const wave = document.createElement('div');
  wave.className = 'score-shockwave';

  let waveColor = 'rgba(168, 85, 247, 0.6)';
  let waveSize = 120;
  if (points >= 128) { waveColor = 'rgba(251, 191, 36, 0.7)'; waveSize = 160; }
  if (points >= 512) { waveColor = 'rgba(244, 63, 94, 0.8)'; waveSize = 200; }

  wave.style.left = `${rect.left + rect.width / 2}px`;
  wave.style.top = `${rect.top + rect.height / 2}px`;
  wave.style.width = `${waveSize}px`;
  wave.style.height = `${waveSize}px`;
  wave.style.borderColor = waveColor;
  wave.style.boxShadow = `0 0 20px ${waveColor}, inset 0 0 20px ${waveColor}`;

  document.body.appendChild(wave);
  setTimeout(() => wave.remove(), 600);
}


// =====================================================================
// 统计 & 计时
// =====================================================================

function updateStats() {
  moveCountEl.textContent = moveCount;
  maxTileEl.textContent = getMaxTile(grid);
}

function startTimer() {
  if (timerInterval) clearInterval(timerInterval);
  startTime = Date.now();
  timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
  if (!startTime) return;
  const elapsed = Math.floor((Date.now() - startTime) / 1000);
  const minutes = Math.floor(elapsed / 60);
  const seconds = elapsed % 60;
  gameTimeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function stopTimer() {
  if (timerInterval) { clearInterval(timerInterval); timerInterval = null; }
}


// =====================================================================
// 撤销系统
// =====================================================================

function saveUndoState() {
  undoStack.push({ grid: cloneGrid(grid), score, moveCount });
  if (undoStack.length > MAX_UNDO) undoStack.shift();
}

function undo() {
  if (undoStack.length === 0 || gameOver) return;

  const state = undoStack.pop();
  grid = state.grid;
  score = state.score;
  moveCount = state.moveCount;
  pendingScore = 0;

  updateScoreImmediate();
  updateStats();
  renderGrid();

  gameOverOverlay.classList.add('hidden');
  gameWinOverlay.classList.add('hidden');
  gameOver = false;
}


// =====================================================================
// 核心游戏流程
// =====================================================================

/** 处理一次移动（方向键/滑动触发） */
function handleMove(direction) {
  if (gameOver || isAnimating) return;
  if (gameWon && !keepPlaying) return;

  saveUndoState();

  const oldGrid = cloneGrid(grid);
  const result = move(grid, direction);

  if (!result.moved) {
    undoStack.pop(); // 未移动则撤销保存
    return;
  }

  isAnimating = true;
  grid = result.grid;
  moveCount++;

  // 移动轨迹
  showMoveTrails(oldGrid, grid, direction);

  // 累积分数（等飞行粒子到达才刷新 UI）
  accumulateScore(result.score);
  updateStats();

  // 合并特效处理
  const hasMerge = result.mergeInfo.length > 0;
  if (hasMerge) {
    comboCount = lastMoveHadMerge ? comboCount + 1 : 1;
    lastMoveHadMerge = true;

    result.mergeInfo.forEach(info => {
      const mergedValue = grid[info.row][info.col];
      showMergeGlow(info.row, info.col, mergedValue);
      if (mergedValue >= 8) showMergeParticles(info.row, info.col, mergedValue);
      showBoardScorePopup(info.row, info.col, mergedValue);
    });

    // 大合并震动
    const maxMergedValue = Math.max(...result.mergeInfo.map(info => grid[info.row][info.col]));
    if (maxMergedValue >= 64) shakeBoard(maxMergedValue);

    // 连击提示
    if (comboCount >= 2) showComboText(comboCount);
  } else {
    lastMoveHadMerge = false;
    comboCount = 0;
  }

  // 渲染移动后状态（带合并/撞墙果冻动画）
  renderGrid(null, result.mergeInfo, direction, result.wallHits || []);

  // 延迟添加新方块
  setTimeout(() => {
    const newTile = addRandomTile(grid);
    renderGrid(newTile, [], null, []);

    if (!gameWon && !keepPlaying && hasWon(grid)) {
      gameWon = true;
      showWinOverlay();
    }

    if (!hasAvailableMoves(grid)) {
      gameOver = true;
      showGameOverOverlay();
      stopTimer();
    }

    isAnimating = false;
  }, 160);
}

function showGameOverOverlay() {
  finalScoreEl.textContent = score;
  gameOverOverlay.classList.remove('hidden');
}

function showWinOverlay() {
  gameWinOverlay.classList.remove('hidden');
}

/** 新游戏（重置一切状态） */
function newGame() {
  grid = createEmptyGrid();
  score = 0;
  moveCount = 0;
  gameOver = false;
  gameWon = false;
  keepPlaying = false;
  isAnimating = false;
  undoStack = [];
  comboCount = 0;
  lastMoveHadMerge = false;
  lastScoreStr = '0';
  lastBestScoreStr = String(bestScore);
  pendingScore = 0;

  updateScoreImmediate();
  updateStats();
  effectsLayer.innerHTML = '';

  gameOverOverlay.classList.add('hidden');
  gameWinOverlay.classList.add('hidden');

  addRandomTile(grid);
  const secondTile = addRandomTile(grid);
  renderGrid(secondTile);

  startTimer();
}


// =====================================================================
// 输入处理
// =====================================================================

/** 键盘事件：方向键 + WASD */
function handleKeyDown(e) {
  const keyMap = {
    'ArrowLeft': 'left', 'ArrowRight': 'right', 'ArrowUp': 'up', 'ArrowDown': 'down',
    'a': 'left', 'A': 'left', 'd': 'right', 'D': 'right',
    'w': 'up', 'W': 'up', 's': 'down', 'S': 'down'
  };

  const direction = keyMap[e.key];
  if (direction) {
    e.preventDefault();
    handleMove(direction);
  }
}

/** 触摸滑动 */
let touchStartX = 0;
let touchStartY = 0;
let touchStartTime = 0;
const MIN_SWIPE_DISTANCE = 30;
const MAX_SWIPE_TIME = 500;

function handleTouchStart(e) {
  if (e.touches.length !== 1) return;
  const touch = e.touches[0];
  touchStartX = touch.clientX;
  touchStartY = touch.clientY;
  touchStartTime = Date.now();
  e.preventDefault();
}

function handleTouchEnd(e) {
  if (e.changedTouches.length !== 1) return;
  const touch = e.changedTouches[0];
  const dx = touch.clientX - touchStartX;
  const dy = touch.clientY - touchStartY;
  const dt = Date.now() - touchStartTime;

  if (dt > MAX_SWIPE_TIME) return;

  const absDx = Math.abs(dx);
  const absDy = Math.abs(dy);

  if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return;

  let direction;
  if (absDx > absDy) {
    direction = dx > 0 ? 'right' : 'left';
  } else {
    direction = dy > 0 ? 'down' : 'up';
  }

  handleMove(direction);
  e.preventDefault();
}


// =====================================================================
// 事件绑定
// =====================================================================

function bindEvents() {
  // 键盘
  document.addEventListener('keydown', handleKeyDown);

  // 触摸
  gameBoard.addEventListener('touchstart', handleTouchStart, { passive: false });
  gameBoard.addEventListener('touchend', handleTouchEnd, { passive: false });
  gameBoard.addEventListener('touchmove', (e) => e.preventDefault(), { passive: false });

  // 鼠标拖拽（桌面端兼容）
  let mouseDown = false;
  let mouseStartX = 0;
  let mouseStartY = 0;

  gameBoard.addEventListener('mousedown', (e) => {
    mouseDown = true;
    mouseStartX = e.clientX;
    mouseStartY = e.clientY;
    e.preventDefault();
  });

  document.addEventListener('mousemove', (e) => {
    if (!mouseDown) return;
    e.preventDefault();
  });

  document.addEventListener('mouseup', (e) => {
    if (!mouseDown) return;
    mouseDown = false;

    const dx = e.clientX - mouseStartX;
    const dy = e.clientY - mouseStartY;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);

    if (Math.max(absDx, absDy) < MIN_SWIPE_DISTANCE) return;

    let direction;
    if (absDx > absDy) {
      direction = dx > 0 ? 'right' : 'left';
    } else {
      direction = dy > 0 ? 'down' : 'up';
    }

    handleMove(direction);
  });

  // 按钮
  document.getElementById('btn-new').addEventListener('click', newGame);
  document.getElementById('btn-retry').addEventListener('click', newGame);
  document.getElementById('btn-win-retry').addEventListener('click', newGame);
  document.getElementById('btn-undo').addEventListener('click', undo);
  document.getElementById('btn-continue').addEventListener('click', () => {
    keepPlaying = true;
    gameWinOverlay.classList.add('hidden');
  });

  // 窗口 resize 时重绘
  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => renderGrid(), 100);
  });
}


// =====================================================================
// 初始化
// =====================================================================

function init() {
  initGridBackground();
  bindEvents();
  bestScoreEl.textContent = bestScore;
  newGame();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
