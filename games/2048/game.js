/**
 * 2048 游戏 - 核心逻辑模块
 *
 * 负责：
 *   - 棋盘状态管理（4×4 二维数组，0 表示空格）
 *   - 方块移动与合并（统一转换为"向左合并"再还原方向）
 *   - 随机生成新方块（90% 概率为 2，10% 概率为 4）
 *   - 胜负判断（达到 2048 / 无可用移动）
 *
 * 导出函数供 main.js 调用，纯逻辑无 DOM 依赖。
 */

// 棋盘尺寸常量
const SIZE = 4;

/**
 * 创建空棋盘（4×4 全零矩阵）
 * @returns {number[][]}
 */
export function createEmptyGrid() {
  return Array.from({ length: SIZE }, () => Array(SIZE).fill(0));
}

/**
 * 深拷贝棋盘（避免引用污染）
 * @param {number[][]} grid
 * @returns {number[][]}
 */
export function cloneGrid(grid) {
  return grid.map(row => [...row]);
}

/**
 * 获取所有空位置坐标
 * @param {number[][]} grid
 * @returns {{ r: number, c: number }[]}
 */
export function getEmptyCells(grid) {
  const cells = [];
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] === 0) {
        cells.push({ r, c });
      }
    }
  }
  return cells;
}

/**
 * 在随机空位添加新方块
 * - 90% 概率生成 2，10% 概率生成 4
 * @param {number[][]} grid - 当前棋盘（会被原地修改）
 * @returns {{ r: number, c: number, value: number } | null}
 */
export function addRandomTile(grid) {
  const emptyCells = getEmptyCells(grid);
  if (emptyCells.length === 0) return null;

  const cell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < 0.9 ? 2 : 4;
  grid[cell.r][cell.c] = value;

  return { r: cell.r, c: cell.c, value };
}

// ===== 内部辅助函数 =====

/**
 * 压缩一行：去除零值，向左靠拢
 * @param {number[]} row
 * @returns {number[]}
 */
function compressRow(row) {
  return row.filter(val => val !== 0);
}

/**
 * 合并一行：从左到右合并相邻相同数字
 * @param {number[]} row
 * @returns {{ merged: number[], score: number, mergedIndices: number[] }}
 *   - merged: 合并后的完整行（补零至 SIZE 长度）
 *   - score: 本次合并产生的总分
 *   - mergedIndices: 发生合并的目标索引列表
 */
function mergeRow(row) {
  const compressed = compressRow(row);
  const result = [];
  let score = 0;
  const mergedIndices = [];
  let i = 0;

  while (i < compressed.length) {
    if (i + 1 < compressed.length && compressed[i] === compressed[i + 1]) {
      // 相邻相同 → 合并为双倍值
      const mergedValue = compressed[i] * 2;
      result.push(mergedValue);
      score += mergedValue;
      mergedIndices.push(result.length - 1);
      i += 2; // 跳过已合并的第二个
    } else {
      result.push(compressed[i]);
      i++;
    }
  }

  // 尾部补零
  while (result.length < SIZE) {
    result.push(0);
  }

  return { merged: result, score, mergedIndices };
}

/**
 * 矩阵转置（行列互换）
 * @param {number[][]} grid
 * @returns {number[][]}
 */
function transpose(grid) {
  const result = createEmptyGrid();
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      result[c][r] = grid[r][c];
    }
  }
  return result;
}

/**
 * 反转每一行（左右镜像）
 * @param {number[][]} grid
 * @returns {number[][]}
 */
function reverseRows(grid) {
  return grid.map(row => [...row].reverse());
}

/**
 * 移动棋盘（核心方法）
 *
 * 策略：将所有方向统一转换为"向左合并"，处理后再转换回原方向。
 *   - right → reverseRows → 向左合并 → reverseRows
 *   - up    → transpose   → 向左合并 → transpose
 *   - down  → transpose + reverseRows → 向左合并 → reverseRows + transpose
 *
 * @param {number[][]} grid - 当前棋盘
 * @param {'left'|'right'|'up'|'down'} direction - 移动方向
 * @returns {{ grid: number[][], score: number, moved: boolean, mergeInfo: Array, wallHits: Array }}
 */
export function move(grid, direction) {
  let workGrid = cloneGrid(grid);
  let totalScore = 0;
  let moved = false;
  const mergeInfo = [];  // 记录合并位置，用于果冻动画
  const wallHits = [];   // 记录撞墙位置，用于弹跳动画

  // 第一步：统一转换为"向左合并"视角
  if (direction === 'right') {
    workGrid = reverseRows(workGrid);
  } else if (direction === 'up') {
    workGrid = transpose(workGrid);
  } else if (direction === 'down') {
    workGrid = reverseRows(transpose(workGrid));
  }

  // 第二步：逐行合并
  for (let r = 0; r < SIZE; r++) {
    const original = [...workGrid[r]];
    const { merged, score, mergedIndices } = mergeRow(workGrid[r]);
    workGrid[r] = merged;
    totalScore += score;

    // 检测是否发生了移动
    for (let c = 0; c < SIZE; c++) {
      if (original[c] !== merged[c]) {
        moved = true;
      }
    }

    // 记录合并位置
    mergedIndices.forEach(idx => {
      mergeInfo.push({ row: r, col: idx });
    });

    // 检测撞墙：方块移动到了边界位置 0
    if (merged[0] !== 0) {
      let firstNonZero = -1;
      for (let c = 0; c < SIZE; c++) {
        if (original[c] !== 0) { firstNonZero = c; break; }
      }
      if (firstNonZero > 0) {
        wallHits.push({ row: r, col: 0 });
      }
    }
  }

  // 第三步：坐标转换回原方向
  if (direction === 'right') {
    workGrid = reverseRows(workGrid);
    mergeInfo.forEach(info => { info.col = SIZE - 1 - info.col; });
    wallHits.forEach(info => { info.col = SIZE - 1 - info.col; });
  } else if (direction === 'up') {
    workGrid = transpose(workGrid);
    mergeInfo.forEach(info => { const t = info.row; info.row = info.col; info.col = t; });
    wallHits.forEach(info => { const t = info.row; info.row = info.col; info.col = t; });
  } else if (direction === 'down') {
    workGrid = transpose(reverseRows(workGrid));
    mergeInfo.forEach(info => {
      const newRow = SIZE - 1 - info.col;
      const newCol = info.row;
      info.row = newRow;
      info.col = newCol;
    });
    wallHits.forEach(info => {
      const newRow = SIZE - 1 - info.col;
      const newCol = info.row;
      info.row = newRow;
      info.col = newCol;
    });
  }

  return { grid: workGrid, score: totalScore, moved, mergeInfo, wallHits };
}

/**
 * 检查是否还有可用移动（空格 或 相邻同值）
 * @param {number[][]} grid
 * @returns {boolean}
 */
export function hasAvailableMoves(grid) {
  if (getEmptyCells(grid).length > 0) return true;

  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      const val = grid[r][c];
      if (c + 1 < SIZE && grid[r][c + 1] === val) return true; // 右邻相同
      if (r + 1 < SIZE && grid[r + 1][c] === val) return true; // 下邻相同
    }
  }

  return false;
}

/**
 * 检查是否达到 2048
 * @param {number[][]} grid
 * @returns {boolean}
 */
export function hasWon(grid) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] >= 2048) return true;
    }
  }
  return false;
}

/**
 * 获取棋盘上的最大数字
 * @param {number[][]} grid
 * @returns {number}
 */
export function getMaxTile(grid) {
  let max = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (grid[r][c] > max) max = grid[r][c];
    }
  }
  return max;
}

/**
 * 比较两个棋盘是否完全相同
 * @param {number[][]} a
 * @param {number[][]} b
 * @returns {boolean}
 */
export function gridsEqual(a, b) {
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (a[r][c] !== b[r][c]) return false;
    }
  }
  return true;
}
