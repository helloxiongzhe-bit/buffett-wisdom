/**
 * 五子棋游戏 - 棋盘渲染器（侘寂风格 / Wabi-Sabi）
 *
 * 使用三层 Canvas 分离绘制：
 *   - boardCanvas:  棋盘底图（木色纹理、网格线、星位、坐标标签）
 *   - pieceCanvas:  棋子层（黑棋深墨色、白棋温润玉色、落子标记、胜利连线）
 *   - hoverCanvas:  悬停预览层（半透明棋子 + 赤陶色十字指示器）
 *
 * 色彩设计遵循侘寂美学：
 *   - 棋盘背景: #E8DFD0（素雅木色）
 *   - 黑棋渐变: #4A4540 → #2A2623（深沉墨色）
 *   - 白棋渐变: #FDFCFA → #E8E0D4（温润玉色）
 *   - 落子/胜利标记: #C4745A（赤陶色）
 */
export class BoardRenderer {
    constructor(boardCanvas, pieceCanvas, hoverCanvas, config) {
        this.boardCtx = boardCanvas.getContext('2d');
        this.pieceCtx = pieceCanvas.getContext('2d');
        this.hoverCtx = hoverCanvas.getContext('2d');
        this.config = config;
        this.lastHover = null;
    }

    drawBoard() {
        const ctx = this.boardCtx;
        const { boardSize, cellSize, padding } = this.config;
        const size = cellSize * (boardSize - 1) + padding * 2;

        // 素雅木色背景
        ctx.fillStyle = '#E8DFD0';
        ctx.fillRect(0, 0, size, size);

        // 极淡纹理
        ctx.save();
        ctx.globalAlpha = 0.04;
        for (let i = 0; i < size; i += 4) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.015) * 3);
            ctx.lineTo(size, i + Math.sin(i * 0.015 + 1.5) * 3);
            ctx.strokeStyle = '#8B7D6B';
            ctx.lineWidth = 0.5;
            ctx.stroke();
        }
        ctx.restore();

        // 网格线 - 极细
        ctx.strokeStyle = 'rgba(100, 90, 75, 0.35)';
        ctx.lineWidth = 0.5;

        for (let i = 0; i < boardSize; i++) {
            const pos = padding + i * cellSize;
            ctx.beginPath();
            ctx.moveTo(padding, pos);
            ctx.lineTo(padding + (boardSize - 1) * cellSize, pos);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(pos, padding);
            ctx.lineTo(pos, padding + (boardSize - 1) * cellSize);
            ctx.stroke();
        }

        // 外框 - 含蓄
        ctx.strokeStyle = 'rgba(100, 90, 75, 0.25)';
        ctx.lineWidth = 1;
        ctx.strokeRect(
            padding - 0.5,
            padding - 0.5,
            (boardSize - 1) * cellSize + 1,
            (boardSize - 1) * cellSize + 1
        );

        // 星位 - 小而精致
        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11],
            [7, 7],
            [3, 7], [7, 3], [7, 11], [11, 7],
        ];

        ctx.fillStyle = 'rgba(100, 90, 75, 0.5)';
        const dotR = Math.max(2, Math.round(cellSize * 0.08));
        for (const [r, c] of starPoints) {
            const x = padding + c * cellSize;
            const y = padding + r * cellSize;
            ctx.beginPath();
            ctx.arc(x, y, dotR, 0, Math.PI * 2);
            ctx.fill();
        }

        // 坐标标签 - 淡雅
        ctx.fillStyle = 'rgba(138, 132, 120, 0.5)';
        ctx.font = '9px "LXGW WenKai", "Noto Serif SC", serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const colLabels = 'ABCDEFGHIJKLMNO';
        for (let i = 0; i < boardSize; i++) {
            const x = padding + i * cellSize;
            ctx.fillText(colLabels[i], x, padding - 12);
            ctx.fillText(colLabels[i], x, padding + (boardSize - 1) * cellSize + 12);
        }

        ctx.textAlign = 'right';
        for (let i = 0; i < boardSize; i++) {
            const y = padding + i * cellSize;
            const label = (boardSize - i).toString();
            ctx.fillText(label, padding - 8, y);
            ctx.textAlign = 'left';
            ctx.fillText(label, padding + (boardSize - 1) * cellSize + 8, y);
            ctx.textAlign = 'right';
        }
    }

    drawPiece(row, col, player, isLast = false) {
        const ctx = this.pieceCtx;
        const { cellSize, padding, pieceRadius } = this.config;
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

        ctx.save();

        if (player === 1) {
            // 黑棋 - 深沉墨色
            ctx.shadowColor = 'rgba(0,0,0,0.15)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, pieceRadius);
            grad.addColorStop(0, '#4A4540');
            grad.addColorStop(0.6, '#36322E');
            grad.addColorStop(1, '#2A2623');
            ctx.fillStyle = grad;
        } else {
            // 白棋 - 温润玉色
            ctx.shadowColor = 'rgba(0,0,0,0.1)';
            ctx.shadowBlur = 3;
            ctx.shadowOffsetX = 0.5;
            ctx.shadowOffsetY = 1;

            const grad = ctx.createRadialGradient(x - 2, y - 2, 1, x, y, pieceRadius);
            grad.addColorStop(0, '#FDFCFA');
            grad.addColorStop(0.5, '#F5F0E8');
            grad.addColorStop(1, '#E8E0D4');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';

        // 极淡边缘
        ctx.strokeStyle = player === 1 ? 'rgba(0,0,0,0.15)' : 'rgba(150,140,125,0.3)';
        ctx.lineWidth = 0.5;
        ctx.stroke();

        // 含蓄高光
        const hlGrad = ctx.createRadialGradient(x - 3, y - 3, 0, x - 2, y - 2, pieceRadius * 0.4);
        hlGrad.addColorStop(0, player === 1 ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.5)');
        hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hlGrad;
        ctx.beginPath();
        ctx.arc(x - 2, y - 2, pieceRadius * 0.4, 0, Math.PI * 2);
        ctx.fill();

        // 最后落子标记 - 赤陶色小点
        if (isLast) {
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI * 2);
            ctx.fillStyle = '#C4745A';
            ctx.fill();
        }

        ctx.restore();
    }

    drawHover(row, col, player) {
        if (this.lastHover && this.lastHover.row === row && this.lastHover.col === col) return;
        this.clearHover();
        this.lastHover = { row, col };

        const ctx = this.hoverCtx;
        const { cellSize, padding, pieceRadius } = this.config;
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

        ctx.save();
        ctx.globalAlpha = 0.3;

        if (player === 1) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pieceRadius);
            grad.addColorStop(0, '#4A4540');
            grad.addColorStop(1, '#2A2623');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pieceRadius);
            grad.addColorStop(0, '#FDFCFA');
            grad.addColorStop(1, '#E8E0D4');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
        ctx.fill();

        // 十字指示器
        ctx.globalAlpha = 0.4;
        ctx.strokeStyle = '#C4745A';
        ctx.lineWidth = 1;
        const crossSize = 6;

        ctx.beginPath();
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x - 2, y);
        ctx.moveTo(x + 2, y);
        ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y - 2);
        ctx.moveTo(x, y + 2);
        ctx.lineTo(x, y + crossSize);
        ctx.stroke();

        ctx.restore();
    }

    clearHover() {
        const size = this.hoverCtx.canvas.width;
        this.hoverCtx.clearRect(0, 0, size, size);
        this.lastHover = null;
    }

    clearPieces() {
        const size = this.pieceCtx.canvas.width;
        this.pieceCtx.clearRect(0, 0, size, size);
    }

    redrawAllPieces(board, moveHistory) {
        this.clearPieces();
        const size = board.length;
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (board[r][c] !== 0) {
                    const isLast = moveHistory.length > 0 &&
                        moveHistory[moveHistory.length - 1].row === r &&
                        moveHistory[moveHistory.length - 1].col === c;
                    this.drawPiece(r, c, board[r][c], isLast);
                }
            }
        }
    }

    drawWinLine(winLine) {
        if (!winLine || winLine.length < 5) return;
        const ctx = this.pieceCtx;
        const { cellSize, padding } = this.config;

        winLine.sort((a, b) => a.row === b.row ? a.col - b.col : a.row - b.row);

        const startX = padding + winLine[0].col * cellSize;
        const startY = padding + winLine[0].row * cellSize;
        const endX = padding + winLine[winLine.length - 1].col * cellSize;
        const endY = padding + winLine[winLine.length - 1].row * cellSize;

        ctx.save();
        ctx.strokeStyle = '#C4745A';
        ctx.lineWidth = 2.5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.6;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
    }
}
