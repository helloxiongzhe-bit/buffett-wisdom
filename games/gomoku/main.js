// 五子棋游戏 - 主入口
import { Game } from './game.js';
import { BoardRenderer } from './renderer.js';
import { AI } from './ai.js';

const CONFIG = {
    boardSize: 15,
    cellSize: 36,
    padding: 24,
    pieceRadius: 15,
};

const canvasSize = CONFIG.cellSize * (CONFIG.boardSize - 1) + CONFIG.padding * 2;

const boardCanvas = document.getElementById('board-canvas');
const pieceCanvas = document.getElementById('piece-canvas');
const hoverCanvas = document.getElementById('hover-canvas');
const statusText = document.getElementById('status-text');
const statusDot = document.getElementById('status-dot');
const moveHistory = document.getElementById('move-history');
const btnStart = document.getElementById('btn-start');
const btnUndo = document.getElementById('btn-undo');
const btnRestart = document.getElementById('btn-restart');
const btnRules = document.getElementById('btn-rules');
const btnSettings = document.getElementById('btn-settings');
const modePvp = document.getElementById('mode-pvp');
const modePve = document.getElementById('mode-pve');
const aiDifficulty = document.getElementById('ai-difficulty');
const playerBlack = document.getElementById('player-black');
const playerWhite = document.getElementById('player-white');

[boardCanvas, pieceCanvas, hoverCanvas].forEach(c => {
    c.width = canvasSize;
    c.height = canvasSize;
    c.style.width = canvasSize + 'px';
    c.style.height = canvasSize + 'px';
});

const renderer = new BoardRenderer(boardCanvas, pieceCanvas, hoverCanvas, CONFIG);
const game = new Game(CONFIG.boardSize);
const ai = new AI(CONFIG.boardSize);

let gameState = {
    started: false,
    mode: 'pvp',
    aiLevel: 'easy',
    aiThinking: false,
    blackTime: 0,
    whiteTime: 0,
    timerInterval: null,
    stats: { total: 0, blackWins: 0, whiteWins: 0, totalMoves: 0 },
};

renderer.drawBoard();

function updateStatus() {
    const current = game.currentPlayer;
    if (!gameState.started) {
        statusText.textContent = '点击"开始游戏"开始对局';
        statusDot.className = 'w-4 h-4 rounded-full bg-gray-400';
        playerBlack.classList.remove('active');
        playerWhite.classList.remove('active');
        document.getElementById('black-status').textContent = '等待开始';
        document.getElementById('white-status').textContent = '等待开始';
        return;
    }
    if (current === 1) {
        statusText.textContent = '黑棋思考中...';
        statusDot.className = 'w-4 h-4 rounded-full bg-gray-900 border border-gray-600';
        playerBlack.classList.add('active');
        playerWhite.classList.remove('active');
        document.getElementById('black-status').textContent = '思考中...';
        document.getElementById('white-status').textContent = '等待中';
    } else {
        statusText.textContent = gameState.mode === 'pve' ? 'AI思考中...' : '白棋思考中...';
        statusDot.className = 'w-4 h-4 rounded-full bg-white border-2 border-gray-300';
        playerWhite.classList.add('active');
        playerBlack.classList.remove('active');
        document.getElementById('white-status').textContent = gameState.mode === 'pve' ? 'AI思考中...' : '思考中...';
        document.getElementById('black-status').textContent = '等待中';
    }
}

function updateMoveHistory() {
    const moves = game.moveHistory;
    if (moves.length === 0) {
        moveHistory.innerHTML = '<div class="text-gray-400 text-center py-4">暂无记录</div>';
        return;
    }
    const colLabels = 'ABCDEFGHIJKLMNO';
    moveHistory.innerHTML = moves.map((m, i) => {
        const color = m.player === 1 ? 'black' : 'white';
        const label = m.player === 1 ? '黑' : '白';
        const pos = `${colLabels[m.col]}${CONFIG.boardSize - m.row}`;
        return `<div class="move-item">
            <span class="text-xs text-gray-400 w-6">#${i + 1}</span>
            <span class="move-dot ${color}"></span>
            <span class="text-gray-700">${label}棋 ${pos}</span>
        </div>`;
    }).join('');
    moveHistory.scrollTop = moveHistory.scrollHeight;
}

function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
}

function startTimer() {
    stopTimer();
    gameState.timerInterval = setInterval(() => {
        if (game.currentPlayer === 1) {
            gameState.blackTime++;
            document.getElementById('black-time').textContent = formatTime(gameState.blackTime);
        } else {
            gameState.whiteTime++;
            document.getElementById('white-time').textContent = formatTime(gameState.whiteTime);
        }
    }, 1000);
}

function stopTimer() {
    if (gameState.timerInterval) {
        clearInterval(gameState.timerInterval);
        gameState.timerInterval = null;
    }
}

function updateStats() {
    const s = gameState.stats;
    document.getElementById('stat-total').textContent = s.total;
    document.getElementById('black-wins').textContent = s.blackWins;
    document.getElementById('white-wins').textContent = s.whiteWins;
    const blackRate = s.total > 0 ? Math.round(s.blackWins / s.total * 100) : 0;
    const whiteRate = s.total > 0 ? Math.round(s.whiteWins / s.total * 100) : 0;
    document.getElementById('stat-black-rate').textContent = blackRate + '%';
    document.getElementById('stat-white-rate').textContent = whiteRate + '%';
    document.getElementById('stat-avg-moves').textContent = s.total > 0 ? Math.round(s.totalMoves / s.total) : 0;
    document.getElementById('bar-black').style.width = (s.total > 0 ? blackRate : 50) + '%';
    document.getElementById('bar-white').style.width = (s.total > 0 ? whiteRate : 50) + '%';
}

function showWinModal(winner) {
    const modal = document.getElementById('modal-win');
    const title = document.getElementById('win-title');
    const subtitle = document.getElementById('win-subtitle');
    const winMoves = document.getElementById('win-moves');
    const winTime = document.getElementById('win-time');

    if (winner === 0) {
        title.textContent = '平局！';
        subtitle.textContent = '棋逢对手，势均力敌！';
    } else {
        const name = winner === 1 ? '黑棋' : '白棋';
        title.textContent = `${name}获胜！🏆`;
        subtitle.textContent = winner === 1 ? '先手优势，势如破竹！' : '后发制人，精妙绝伦！';
    }
    winMoves.textContent = game.moveHistory.length;
    const totalTime = gameState.blackTime + gameState.whiteTime;
    winTime.textContent = formatTime(totalTime);

    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('show'));
}

function closeModal(modal) {
    modal.classList.remove('show');
    setTimeout(() => modal.classList.add('hidden'), 300);
}

function handleMove(row, col) {
    if (!gameState.started || game.isGameOver || gameState.aiThinking) return;
    if (gameState.mode === 'pve' && game.currentPlayer === 2) return;

    const result = game.makeMove(row, col);
    if (!result) return;

    renderer.drawPiece(row, col, result.player, true);
    if (game.moveHistory.length > 1) {
        const prev = game.moveHistory[game.moveHistory.length - 2];
        renderer.drawPiece(prev.row, prev.col, prev.player, false);
    }
    updateMoveHistory();
    btnUndo.disabled = false;

    if (result.winner !== null) {
        handleGameEnd(result.winner, result.winLine);
        return;
    }

    updateStatus();

    if (gameState.mode === 'pve' && game.currentPlayer === 2 && !game.isGameOver) {
        gameState.aiThinking = true;
        updateStatus();
        setTimeout(() => {
            const aiMove = ai.getMove(game.board, gameState.aiLevel);
            if (aiMove) {
                const aiResult = game.makeMove(aiMove.row, aiMove.col);
                if (aiResult) {
                    renderer.drawPiece(aiMove.row, aiMove.col, aiResult.player, true);
                    const prev2 = game.moveHistory[game.moveHistory.length - 2];
                    renderer.drawPiece(prev2.row, prev2.col, prev2.player, false);
                    updateMoveHistory();

                    if (aiResult.winner !== null) {
                        handleGameEnd(aiResult.winner, aiResult.winLine);
                    }
                }
            }
            gameState.aiThinking = false;
            updateStatus();
        }, 300 + Math.random() * 400);
    }
}

function handleGameEnd(winner, winLine) {
    stopTimer();
    gameState.started = false;
    gameState.stats.total++;
    gameState.stats.totalMoves += game.moveHistory.length;

    if (winner === 1) {
        gameState.stats.blackWins++;
        statusText.textContent = '🎉 黑棋获胜！';
    } else if (winner === 2) {
        gameState.stats.whiteWins++;
        statusText.textContent = '🎉 白棋获胜！';
    } else {
        statusText.textContent = '🤝 平局！';
    }

    if (winLine) {
        renderer.drawWinLine(winLine);
    }

    updateStats();
    btnUndo.disabled = true;
    setTimeout(() => showWinModal(winner), 600);
}

function resetGame() {
    stopTimer();
    game.reset();
    gameState.started = false;
    gameState.blackTime = 0;
    gameState.whiteTime = 0;
    gameState.aiThinking = false;
    renderer.clearPieces();
    renderer.clearHover();
    updateStatus();
    updateMoveHistory();
    document.getElementById('black-time').textContent = '00:00';
    document.getElementById('white-time').textContent = '00:00';
    btnUndo.disabled = true;
    btnStart.innerHTML = '<i class="ri-play-circle-line"></i> 开始游戏';
}

function getBoardPos(e) {
    const rect = hoverCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const col = Math.round((x - CONFIG.padding) / CONFIG.cellSize);
    const row = Math.round((y - CONFIG.padding) / CONFIG.cellSize);
    if (row >= 0 && row < CONFIG.boardSize && col >= 0 && col < CONFIG.boardSize) {
        return { row, col };
    }
    return null;
}

hoverCanvas.addEventListener('mousemove', (e) => {
    if (!gameState.started || game.isGameOver || gameState.aiThinking) {
        renderer.clearHover();
        return;
    }
    if (gameState.mode === 'pve' && game.currentPlayer === 2) {
        renderer.clearHover();
        return;
    }
    const pos = getBoardPos(e);
    if (pos && game.board[pos.row][pos.col] === 0) {
        renderer.drawHover(pos.row, pos.col, game.currentPlayer);
    } else {
        renderer.clearHover();
    }
});

hoverCanvas.addEventListener('mouseleave', () => {
    renderer.clearHover();
});

hoverCanvas.addEventListener('click', (e) => {
    const pos = getBoardPos(e);
    if (pos) {
        handleMove(pos.row, pos.col);
    }
});

hoverCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    const touch = e.changedTouches[0];
    const pos = getBoardPos(touch);
    if (pos) {
        handleMove(pos.row, pos.col);
    }
});

btnStart.addEventListener('click', () => {
    if (gameState.started) return;
    resetGame();
    gameState.started = true;
    updateStatus();
    startTimer();
    btnStart.innerHTML = '<i class="ri-play-circle-line"></i> 游戏中...';
});

btnUndo.addEventListener('click', () => {
    if (!gameState.started || game.isGameOver || gameState.aiThinking) return;
    if (gameState.mode === 'pve') {
        game.undoMove();
        game.undoMove();
    } else {
        game.undoMove();
    }
    renderer.redrawAllPieces(game.board, game.moveHistory);
    updateMoveHistory();
    updateStatus();
    if (game.moveHistory.length === 0) btnUndo.disabled = true;
});

btnRestart.addEventListener('click', resetGame);

modePvp.addEventListener('click', () => {
    gameState.mode = 'pvp';
    modePvp.classList.add('active');
    modePve.classList.remove('active');
    aiDifficulty.classList.add('hidden');
    resetGame();
});

modePve.addEventListener('click', () => {
    gameState.mode = 'pve';
    modePve.classList.add('active');
    modePvp.classList.remove('active');
    aiDifficulty.classList.remove('hidden');
    resetGame();
});

document.querySelectorAll('.ai-level-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.ai-level-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.aiLevel = btn.dataset.level;
    });
});

btnRules.addEventListener('click', () => {
    const modal = document.getElementById('modal-rules');
    modal.classList.remove('hidden');
    requestAnimationFrame(() => modal.classList.add('show'));
});

document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => {
        const modal = btn.closest('.modal-overlay');
        closeModal(modal);
    });
});

document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal(modal);
    });
});

document.getElementById('btn-play-again').addEventListener('click', () => {
    closeModal(document.getElementById('modal-win'));
    setTimeout(() => {
        resetGame();
        gameState.started = true;
        updateStatus();
        startTimer();
        btnStart.innerHTML = '<i class="ri-play-circle-line"></i> 游戏中...';
    }, 300);
});

document.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        if (!gameState.started) btnStart.click();
    }
    if (e.ctrlKey && e.key === 'z') {
        e.preventDefault();
        btnUndo.click();
    }
    if (e.ctrlKey && e.key === 'r') {
        e.preventDefault();
        btnRestart.click();
    }
});

updateStatus();
updateStats();
