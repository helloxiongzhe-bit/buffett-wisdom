// 五子棋游戏 - 核心逻辑
export class Game {
    constructor(size) {
        this.size = size;
        this.reset();
    }

    reset() {
        this.board = Array.from({ length: this.size }, () => Array(this.size).fill(0));
        this.currentPlayer = 1; // 1=黑, 2=白
        this.moveHistory = [];
        this.isGameOver = false;
        this.winner = null;
    }

    makeMove(row, col) {
        if (this.isGameOver) return null;
        if (row < 0 || row >= this.size || col < 0 || col >= this.size) return null;
        if (this.board[row][col] !== 0) return null;

        const player = this.currentPlayer;
        this.board[row][col] = player;
        this.moveHistory.push({ row, col, player });

        const winLine = this.checkWin(row, col, player);
        if (winLine) {
            this.isGameOver = true;
            this.winner = player;
            return { player, winner: player, winLine };
        }

        if (this.moveHistory.length === this.size * this.size) {
            this.isGameOver = true;
            this.winner = 0;
            return { player, winner: 0, winLine: null };
        }

        this.currentPlayer = player === 1 ? 2 : 1;
        return { player, winner: null, winLine: null };
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;
        const last = this.moveHistory.pop();
        this.board[last.row][last.col] = 0;
        this.currentPlayer = last.player;
        this.isGameOver = false;
        this.winner = null;
        return true;
    }

    checkWin(row, col, player) {
        const directions = [
            [0, 1],
            [1, 0],
            [1, 1],
            [1, -1],
        ];

        for (const [dr, dc] of directions) {
            const line = [{ row, col }];

            for (let i = 1; i < 5; i++) {
                const r = row + dr * i;
                const c = col + dc * i;
                if (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) {
                    line.push({ row: r, col: c });
                } else break;
            }

            for (let i = 1; i < 5; i++) {
                const r = row - dr * i;
                const c = col - dc * i;
                if (r >= 0 && r < this.size && c >= 0 && c < this.size && this.board[r][c] === player) {
                    line.push({ row: r, col: c });
                } else break;
            }

            if (line.length >= 5) return line;
        }

        return null;
    }
}
