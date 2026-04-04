// 五子棋游戏 - AI模块
export class AI {
    constructor(size) {
        this.size = size;
        this.scores = {
            FIVE: 1000000,
            LIVE_FOUR: 100000,
            RUSH_FOUR: 10000,
            LIVE_THREE: 5000,
            SLEEP_THREE: 500,
            LIVE_TWO: 200,
            SLEEP_TWO: 20,
            LIVE_ONE: 10,
        };
    }

    getMove(board, level) {
        switch (level) {
            case 'easy': return this.getEasyMove(board);
            case 'medium': return this.getMediumMove(board);
            case 'hard': return this.getHardMove(board);
            default: return this.getEasyMove(board);
        }
    }

    getEasyMove(board) {
        if (Math.random() < 0.3) {
            return this.getRandomMove(board);
        }
        return this.getBestMove(board, 1);
    }

    getMediumMove(board) {
        return this.getBestMove(board, 2);
    }

    getHardMove(board) {
        return this.getBestMove(board, 3);
    }

    getRandomMove(board) {
        const candidates = this.getCandidates(board, 1);
        if (candidates.length === 0) {
            return { row: Math.floor(this.size / 2), col: Math.floor(this.size / 2) };
        }
        return candidates[Math.floor(Math.random() * candidates.length)];
    }

    getCandidates(board, range) {
        const candidates = new Set();
        const hasStone = board.some(row => row.some(cell => cell !== 0));

        if (!hasStone) {
            return [{ row: Math.floor(this.size / 2), col: Math.floor(this.size / 2) }];
        }

        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (board[r][c] !== 0) {
                    for (let dr = -range; dr <= range; dr++) {
                        for (let dc = -range; dc <= range; dc++) {
                            const nr = r + dr;
                            const nc = c + dc;
                            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size && board[nr][nc] === 0) {
                                candidates.add(`${nr},${nc}`);
                            }
                        }
                    }
                }
            }
        }

        return Array.from(candidates).map(s => {
            const [row, col] = s.split(',').map(Number);
            return { row, col };
        });
    }

    getBestMove(board, depth) {
        const candidates = this.getCandidates(board, 2);
        if (candidates.length === 0) {
            return { row: Math.floor(this.size / 2), col: Math.floor(this.size / 2) };
        }

        let bestScore = -Infinity;
        let bestMove = candidates[0];

        const scored = candidates.map(pos => {
            const score = this.evaluatePosition(board, pos.row, pos.col, 2) +
                          this.evaluatePosition(board, pos.row, pos.col, 1) * 0.9;
            return { ...pos, score };
        });

        scored.sort((a, b) => b.score - a.score);
        const topN = scored.slice(0, Math.min(depth === 3 ? 15 : 10, scored.length));

        for (const pos of topN) {
            let score = pos.score;

            if (depth >= 2) {
                board[pos.row][pos.col] = 2;
                score += this.evaluateBoard(board, 2) * 0.5;

                if (depth >= 3) {
                    const opponentCandidates = this.getCandidates(board, 1);
                    let worstOpponent = 0;
                    for (const opp of opponentCandidates.slice(0, 5)) {
                        board[opp.row][opp.col] = 1;
                        const oppScore = this.evaluateBoard(board, 1);
                        worstOpponent = Math.max(worstOpponent, oppScore);
                        board[opp.row][opp.col] = 0;
                    }
                    score -= worstOpponent * 0.3;
                }

                board[pos.row][pos.col] = 0;
            }

            if (score > bestScore) {
                bestScore = score;
                bestMove = pos;
            }
        }

        return bestMove;
    }

    evaluatePosition(board, row, col, player) {
        let totalScore = 0;
        const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];

        for (const [dr, dc] of directions) {
            totalScore += this.evaluateLine(board, row, col, dr, dc, player);
        }

        const center = Math.floor(this.size / 2);
        const dist = Math.abs(row - center) + Math.abs(col - center);
        totalScore += Math.max(0, (this.size - dist)) * 2;

        return totalScore;
    }

    evaluateLine(board, row, col, dr, dc, player) {
        let count = 1;
        let block = 0;
        let empty = 0;

        for (let i = 1; i <= 4; i++) {
            const r = row + dr * i;
            const c = col + dc * i;
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) {
                block++;
                break;
            }
            if (board[r][c] === player) {
                count++;
            } else if (board[r][c] === 0) {
                empty++;
                break;
            } else {
                block++;
                break;
            }
        }

        for (let i = 1; i <= 4; i++) {
            const r = row - dr * i;
            const c = col - dc * i;
            if (r < 0 || r >= this.size || c < 0 || c >= this.size) {
                block++;
                break;
            }
            if (board[r][c] === player) {
                count++;
            } else if (board[r][c] === 0) {
                empty++;
                break;
            } else {
                block++;
                break;
            }
        }

        if (count >= 5) return this.scores.FIVE;
        if (count === 4) {
            if (block === 0) return this.scores.LIVE_FOUR;
            if (block === 1) return this.scores.RUSH_FOUR;
            return 0;
        }
        if (count === 3) {
            if (block === 0) return this.scores.LIVE_THREE;
            if (block === 1) return this.scores.SLEEP_THREE;
            return 0;
        }
        if (count === 2) {
            if (block === 0) return this.scores.LIVE_TWO;
            if (block === 1) return this.scores.SLEEP_TWO;
            return 0;
        }
        if (count === 1) {
            if (block === 0) return this.scores.LIVE_ONE;
            return 0;
        }
        return 0;
    }

    evaluateBoard(board, player) {
        let score = 0;
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (board[r][c] === player) {
                    score += this.evaluatePosition(board, r, c, player) * 0.1;
                }
            }
        }
        return score;
    }
}
