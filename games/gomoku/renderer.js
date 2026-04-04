// 五子棋游戏 - 棋盘渲染器
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

        const bgGrad = ctx.createLinearGradient(0, 0, size, size);
        bgGrad.addColorStop(0, '#E8C97A');
        bgGrad.addColorStop(0.3, '#D4A843');
        bgGrad.addColorStop(0.7, '#DEB856');
        bgGrad.addColorStop(1, '#C99B35');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, size, size);

        ctx.save();
        ctx.globalAlpha = 0.08;
        for (let i = 0; i < size; i += 3) {
            ctx.beginPath();
            ctx.moveTo(0, i + Math.sin(i * 0.02) * 5);
            ctx.lineTo(size, i + Math.sin(i * 0.02 + 2) * 5);
            ctx.strokeStyle = '#8B6914';
            ctx.lineWidth = 1;
            ctx.stroke();
        }
        ctx.restore();

        ctx.strokeStyle = '#5C4A1E';
        ctx.lineWidth = 1;

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

        ctx.strokeStyle = '#4A3A15';
        ctx.lineWidth = 2;
        ctx.strokeRect(
            padding - 1,
            padding - 1,
            (boardSize - 1) * cellSize + 2,
            (boardSize - 1) * cellSize + 2
        );

        const starPoints = [
            [3, 3], [3, 11], [11, 3], [11, 11],
            [7, 7],
            [3, 7], [7, 3], [7, 11], [11, 7],
        ];

        ctx.fillStyle = '#4A3A15';
        for (const [r, c] of starPoints) {
            const x = padding + c * cellSize;
            const y = padding + r * cellSize;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
        }

        ctx.fillStyle = '#7A6A3A';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        const colLabels = 'ABCDEFGHIJKLMNO';
        for (let i = 0; i < boardSize; i++) {
            const x = padding + i * cellSize;
            ctx.fillText(colLabels[i], x, padding - 14);
            ctx.fillText(colLabels[i], x, padding + (boardSize - 1) * cellSize + 14);
        }

        ctx.textAlign = 'right';
        for (let i = 0; i < boardSize; i++) {
            const y = padding + i * cellSize;
            const label = (boardSize - i).toString();
            ctx.fillText(label, padding - 10, y);
            ctx.textAlign = 'left';
            ctx.fillText(label, padding + (boardSize - 1) * cellSize + 10, y);
            ctx.textAlign = 'right';
        }
    }

    drawPiece(row, col, player, isLast = false) {
        const ctx = this.pieceCtx;
        const { cellSize, padding, pieceRadius } = this.config;
        const x = padding + col * cellSize;
        const y = padding + row * cellSize;

        ctx.save();
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 6;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        if (player === 1) {
            const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, pieceRadius);
            grad.addColorStop(0, '#555');
            grad.addColorStop(0.5, '#333');
            grad.addColorStop(1, '#111');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(x - 3, y - 3, 2, x, y, pieceRadius);
            grad.addColorStop(0, '#FFFFFF');
            grad.addColorStop(0.5, '#F0F0F0');
            grad.addColorStop(1, '#D0D0D0');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowColor = 'transparent';
        ctx.strokeStyle = player === 1 ? '#000' : '#AAA';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        const hlGrad = ctx.createRadialGradient(x - 5, y - 5, 1, x - 3, y - 3, 8);
        hlGrad.addColorStop(0, player === 1 ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.8)');
        hlGrad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = hlGrad;
        ctx.arc(x - 3, y - 3, 8, 0, Math.PI * 2);
        ctx.fill();

        if (isLast) {
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FF6B35';
            ctx.fill();
            ctx.strokeStyle = '#FF8C5A';
            ctx.lineWidth = 1;
            ctx.stroke();
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
        ctx.globalAlpha = 0.4;

        if (player === 1) {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pieceRadius);
            grad.addColorStop(0, '#333');
            grad.addColorStop(1, '#111');
            ctx.fillStyle = grad;
        } else {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, pieceRadius);
            grad.addColorStop(0, '#FFF');
            grad.addColorStop(1, '#DDD');
            ctx.fillStyle = grad;
        }

        ctx.beginPath();
        ctx.arc(x, y, pieceRadius, 0, Math.PI * 2);
        ctx.fill();

        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = '#D97706';
        ctx.lineWidth = 2;
        const crossSize = 8;

        ctx.beginPath();
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x - 3, y);
        ctx.moveTo(x + 3, y);
        ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y - 3);
        ctx.moveTo(x, y + 3);
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
        ctx.shadowColor = '#FF6B35';
        ctx.shadowBlur = 12;
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.strokeStyle = '#FFD700';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        ctx.restore();
    }
}
