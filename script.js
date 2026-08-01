// Core board configuration and persistence keys.
const BOARD_SIZE = 8;
const STORAGE_KEY = "chess-master-save-v1";

const PIECE_SYMBOLS = {
  classic: {
    w: { p: "♙", r: "♖", n: "♘", b: "♗", q: "♕", k: "♔" },
    b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }
  },
  modern: {
    w: { p: "⟁", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" },
    b: { p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚" }
  },
  neon: {
    w: { p: "◉", r: "◈", n: "⬡", b: "◊", q: "◆", k: "⬢" },
    b: { p: "◎", r: "⬢", n: "⬢", b: "◇", q: "✦", k: "⬡" }
  }
};

const MATERIAL_VALUES = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 20000 };
const POSITION_TABLE = {
  p: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [5, 5, 5, 5, 5, 5, 5, 5],
    [2, 3, 4, 5, 5, 4, 3, 2],
    [1, 2, 3, 4, 4, 3, 2, 1],
    [0, 1, 2, 3, 3, 2, 1, 0],
    [0, 0, 1, 2, 2, 1, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  n: [
    [-5, -4, -3, -3, -3, -3, -4, -5],
    [-4, -2, 0, 0, 0, 0, -2, -4],
    [-3, 0, 2, 3, 3, 2, 0, -3],
    [-3, 1, 3, 4, 4, 3, 1, -3],
    [-3, 1, 3, 4, 4, 3, 1, -3],
    [-3, 0, 2, 3, 3, 2, 0, -3],
    [-4, -2, 0, 0, 0, 0, -2, -4],
    [-5, -4, -3, -3, -3, -3, -4, -5]
  ],
  b: [
    [-2, -1, -1, -1, -1, -1, -1, -2],
    [-1, 0, 1, 1, 1, 1, 0, -1],
    [-1, 1, 2, 2, 2, 2, 1, -1],
    [-1, 1, 2, 3, 3, 2, 1, -1],
    [-1, 1, 2, 3, 3, 2, 1, -1],
    [-1, 1, 2, 2, 2, 2, 1, -1],
    [-1, 0, 1, 1, 1, 1, 0, -1],
    [-2, -1, -1, -1, -1, -1, -1, -2]
  ],
  r: [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1],
    [0, 0, 0, 0, 0, 0, 0, 0]
  ],
  q: [
    [-2, -1, -1, -1, -1, -1, -1, -2],
    [-1, 0, 0, 0, 0, 0, 0, -1],
    [-1, 0, 1, 1, 1, 1, 0, -1],
    [-1, 0, 1, 2, 2, 1, 0, -1],
    [-1, 0, 1, 2, 2, 1, 0, -1],
    [-1, 0, 1, 1, 1, 1, 0, -1],
    [-1, 0, 0, 0, 0, 0, 0, -1],
    [-2, -1, -1, -1, -1, -1, -1, -2]
  ],
  k: [
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-3, -4, -4, -5, -5, -4, -4, -3],
    [-2, -3, -3, -4, -4, -3, -3, -2],
    [-1, -2, -2, -2, -2, -2, -2, -1],
    [2, 2, 0, 0, 0, 0, 2, 2],
    [2, 3, 1, 0, 0, 1, 3, 2]
  ]
};

function cloneBoard(board) {
  return board.map((piece) => (piece ? { ...piece } : null));
}

function indexToCoord(index) {
  const row = Math.floor(index / BOARD_SIZE);
  const col = index % BOARD_SIZE;
  return { row, col };
}

function coordToIndex(row, col) {
  return row * BOARD_SIZE + col;
}

function isInside(row, col) {
  return row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;
}

function getOpposite(color) {
  return color === "w" ? "b" : "w";
}

class ChessGame {
  constructor() {
    this.board = this.createInitialBoard();
    this.turn = "w";
    this.castlingRights = { wk: true, wq: true, bk: true, bq: true };
    this.enPassantTarget = null;
    this.halfmoveClock = 0;
    this.fullmoveNumber = 1;
    this.moveHistory = [];
    this.capturedPieces = { w: [], b: [] };
    this.lastMove = null;
    this.status = "playing";
    this.gameOver = false;
    this.undoStack = [];
    this.repetitionMap = new Map();
    this.positionKey = this.getPositionKey();
    this.repetitionMap.set(this.positionKey, 1);
    this.aiDepth = 3;
  }

  createInitialBoard() {
    const board = Array(64).fill(null);
    const initialLayout = [
      ["b", "r"], ["b", "n"], ["b", "b"], ["b", "q"], ["b", "k"], ["b", "b"], ["b", "n"], ["b", "r"],
      ["b", "p"], ["b", "p"], ["b", "p"], ["b", "p"], ["b", "p"], ["b", "p"], ["b", "p"], ["b", "p"],
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      null, null, null, null, null, null, null, null,
      ["w", "p"], ["w", "p"], ["w", "p"], ["w", "p"], ["w", "p"], ["w", "p"], ["w", "p"], ["w", "p"],
      ["w", "r"], ["w", "n"], ["w", "b"], ["w", "q"], ["w", "k"], ["w", "b"], ["w", "n"], ["w", "r"]
    ];

    initialLayout.forEach((entry, idx) => {
      if (entry) {
        const [color, type] = entry;
        board[idx] = { id: `${color}-${type}-${idx}`, color, type };
      }
    });
    return board;
  }

  clone() {
    const next = new ChessGame();
    next.board = cloneBoard(this.board);
    next.turn = this.turn;
    next.castlingRights = { ...this.castlingRights };
    next.enPassantTarget = this.enPassantTarget;
    next.halfmoveClock = this.halfmoveClock;
    next.fullmoveNumber = this.fullmoveNumber;
    next.moveHistory = this.moveHistory.map((move) => ({ ...move }));
    next.capturedPieces = { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] };
    next.lastMove = this.lastMove ? { ...this.lastMove } : null;
    next.status = this.status;
    next.gameOver = this.gameOver;
    next.undoStack = this.undoStack.map((entry) => ({ ...entry }));
    next.repetitionMap = new Map(this.repetitionMap);
    next.positionKey = this.positionKey;
    next.aiDepth = this.aiDepth;
    return next;
  }

  getPieceAt(index) {
    return this.board[index] || null;
  }

  getPositionKey() {
    const values = [];
    this.board.forEach((piece) => {
      values.push(piece ? `${piece.color}${piece.type}` : "--");
    });
    return [values.join(""), this.turn, this.castlingRights.wk ? "1" : "0", this.castlingRights.wq ? "1" : "0", this.castlingRights.bk ? "1" : "0", this.castlingRights.bq ? "1" : "0", this.enPassantTarget || "-"].join("");
  }

  updateRepetition() {
    const key = this.getPositionKey();
    const count = this.repetitionMap.get(key) || 0;
    this.repetitionMap.set(key, count + 1);
    this.positionKey = key;
  }

  makeMove(move, options = {}) {
    const { recordHistory = true, storeUndo = false } = options;
    if (storeUndo) {
      this.undoStack.push(this.createSnapshot());
    }

    const piece = this.getPieceAt(move.from);
    const targetPiece = this.getPieceAt(move.to);
    if (piece) {
      if (targetPiece) {
        this.capturedPieces[piece.color === "w" ? "b" : "w"].push(targetPiece.type);
      }
      if (move.flags?.includes("ep")) {
        const captureRow = piece.color === "w" ? move.to + 8 : move.to - 8;
        const captured = this.getPieceAt(captureRow);
        if (captured) {
          this.capturedPieces[piece.color === "w" ? "b" : "w"].push(captured.type);
          this.board[captureRow] = null;
        }
      }
    }

    this.board[move.from] = null;
    let newPiece = { ...piece };

    // Castle the rook to the correct square on the proper side of the board.
    if (move.flags?.includes("castle")) {
      if (piece.color === "w" && move.to === 62) {
        this.board[63] = null;
        this.board[61] = { id: `w-r-61`, color: "w", type: "r" };
      } else if (piece.color === "w" && move.to === 58) {
        this.board[56] = null;
        this.board[59] = { id: `w-r-59`, color: "w", type: "r" };
      } else if (piece.color === "b" && move.to === 6) {
        this.board[7] = null;
        this.board[5] = { id: `b-r-5`, color: "b", type: "r" };
      } else if (piece.color === "b" && move.to === 2) {
        this.board[0] = null;
        this.board[3] = { id: `b-r-3`, color: "b", type: "r" };
      }
    }

    if (move.promotion) {
      newPiece.type = move.promotion;
      newPiece.id = `${newPiece.color}-${newPiece.type}-${move.to}`;
    }

    this.board[move.to] = newPiece;
    this.lastMove = { from: move.from, to: move.to };

    const initialRights = { ...this.castlingRights };
    if (piece?.type === "k") {
      if (piece.color === "w") {
        this.castlingRights.wk = false;
        this.castlingRights.wq = false;
      } else {
        this.castlingRights.bk = false;
        this.castlingRights.bq = false;
      }
    }

    if (piece?.type === "r") {
      if (piece.color === "w" && move.from === 56) this.castlingRights.wq = false;
      if (piece.color === "w" && move.from === 63) this.castlingRights.wk = false;
      if (piece.color === "b" && move.from === 0) this.castlingRights.bq = false;
      if (piece.color === "b" && move.from === 7) this.castlingRights.bk = false;
    }

    if (targetPiece?.type === "r") {
      if (targetPiece.color === "w" && move.to === 56) this.castlingRights.wq = false;
      if (targetPiece.color === "w" && move.to === 63) this.castlingRights.wk = false;
      if (targetPiece.color === "b" && move.to === 0) this.castlingRights.bq = false;
      if (targetPiece.color === "b" && move.to === 7) this.castlingRights.bk = false;
    }

    this.enPassantTarget = null;
    if (piece?.type === "p" && Math.abs(move.to - move.from) === 16) {
      this.enPassantTarget = move.to + (piece.color === "w" ? 8 : -8);
    }

    if (piece?.type === "p" || targetPiece) {
      this.halfmoveClock = 0;
    } else {
      this.halfmoveClock += 1;
    }

    if (this.turn === "b") {
      this.fullmoveNumber += 1;
    }
    this.turn = this.turn === "w" ? "b" : "w";

    if (recordHistory) {
      const san = this.generateSan(move, initialRights, piece, targetPiece);
      this.moveHistory.push({ san, move, rights: { ...initialRights } });
      this.updateRepetition();
    }

    this.updateStatus();
  }

  createSnapshot() {
    return {
      board: cloneBoard(this.board),
      turn: this.turn,
      castlingRights: { ...this.castlingRights },
      enPassantTarget: this.enPassantTarget,
      halfmoveClock: this.halfmoveClock,
      fullmoveNumber: this.fullmoveNumber,
      moveHistory: this.moveHistory.map((entry) => ({ ...entry })),
      capturedPieces: { w: [...this.capturedPieces.w], b: [...this.capturedPieces.b] },
      lastMove: this.lastMove ? { ...this.lastMove } : null,
      status: this.status,
      gameOver: this.gameOver,
      repetitionMap: new Map(this.repetitionMap),
      positionKey: this.positionKey
    };
  }

  restoreSnapshot(snapshot) {
    this.board = cloneBoard(snapshot.board);
    this.turn = snapshot.turn;
    this.castlingRights = { ...snapshot.castlingRights };
    this.enPassantTarget = snapshot.enPassantTarget;
    this.halfmoveClock = snapshot.halfmoveClock;
    this.fullmoveNumber = snapshot.fullmoveNumber;
    this.moveHistory = snapshot.moveHistory.map((entry) => ({ ...entry }));
    this.capturedPieces = { w: [...snapshot.capturedPieces.w], b: [...snapshot.capturedPieces.b] };
    this.lastMove = snapshot.lastMove ? { ...snapshot.lastMove } : null;
    this.status = snapshot.status;
    this.gameOver = snapshot.gameOver;
    this.repetitionMap = new Map(snapshot.repetitionMap);
    this.positionKey = snapshot.positionKey;
  }

  undoLastPlayerMove() {
    if (!this.undoStack.length) return false;
    const snapshot = this.undoStack.pop();
    this.restoreSnapshot(snapshot);
    return true;
  }

  getLegalMoves() {
    const moves = [];
    this.board.forEach((piece, index) => {
      if (!piece || piece.color !== this.turn) return;
      const pseudoMoves = this.generatePseudoMoves(index, piece);
      pseudoMoves.forEach((move) => {
        if (this.isMoveLegal(index, move)) {
          moves.push(move);
        }
      });
    });
    return this.orderMoves(moves);
  }

  generatePseudoMoves(index, piece) {
    const moves = [];
    const { row, col } = indexToCoord(index);
    if (!piece) return moves;

    if (piece.type === "p") {
      const dir = piece.color === "w" ? -1 : 1;
      const startRow = piece.color === "w" ? 6 : 1;
      const oneStep = row + dir;
      if (oneStep >= 0 && oneStep < BOARD_SIZE) {
        const oneIndex = coordToIndex(oneStep, col);
        if (!this.getPieceAt(oneIndex)) {
          if (oneStep === (piece.color === "w" ? 0 : 7)) {
            ["q", "r", "b", "n"].forEach((promotion) => moves.push({ from: index, to: oneIndex, promotion }));
          } else {
            moves.push({ from: index, to: oneIndex });
          }

          const twoStepRow = row + dir * 2;
          if (row === startRow && !this.getPieceAt(coordToIndex(twoStepRow, col))) {
            moves.push({ from: index, to: coordToIndex(twoStepRow, col) });
          }
        }
      }

      for (const deltaCol of [-1, 1]) {
        const newCol = col + deltaCol;
        if (newCol < 0 || newCol >= BOARD_SIZE) continue;
        const targetRow = row + dir;
        const targetIndex = coordToIndex(targetRow, newCol);
        const targetPiece = this.getPieceAt(targetIndex);
        if (targetPiece && targetPiece.color !== piece.color) {
          if (targetRow === (piece.color === "w" ? 0 : 7)) {
            ["q", "r", "b", "n"].forEach((promotion) => moves.push({ from: index, to: targetIndex, promotion, capture: true }));
          } else {
            moves.push({ from: index, to: targetIndex, capture: true });
          }
        }
        if (this.enPassantTarget !== null && targetIndex === this.enPassantTarget) {
          moves.push({ from: index, to: targetIndex, capture: true, flags: ["ep"] });
        }
      }
      return moves;
    }

    if (piece.type === "n") {
      const offsets = [
        [-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]
      ];
      offsets.forEach(([dr, dc]) => {
        const targetRow = row + dr;
        const targetCol = col + dc;
        if (!isInside(targetRow, targetCol)) return;
        const targetIndex = coordToIndex(targetRow, targetCol);
        const targetPiece = this.getPieceAt(targetIndex);
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ from: index, to: targetIndex, capture: !!targetPiece });
        }
      });
      return moves;
    }

    if (piece.type === "b" || piece.type === "r" || piece.type === "q") {
      const directions = piece.type === "b" || piece.type === "q"
        ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
        : [];
      const rookDirs = piece.type === "r" || piece.type === "q"
        ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
        : [];
      [...directions, ...rookDirs].forEach(([dr, dc]) => {
        let step = 1;
        while (true) {
          const targetRow = row + dr * step;
          const targetCol = col + dc * step;
          if (!isInside(targetRow, targetCol)) break;
          const targetIndex = coordToIndex(targetRow, targetCol);
          const targetPiece = this.getPieceAt(targetIndex);
          if (!targetPiece) {
            moves.push({ from: index, to: targetIndex });
          } else {
            if (targetPiece.color !== piece.color) {
              moves.push({ from: index, to: targetIndex, capture: true });
            }
            break;
          }
          step += 1;
        }
      });
      return moves;
    }

    if (piece.type === "k") {
      const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
      offsets.forEach(([dr, dc]) => {
        const targetRow = row + dr;
        const targetCol = col + dc;
        if (!isInside(targetRow, targetCol)) return;
        const targetIndex = coordToIndex(targetRow, targetCol);
        const targetPiece = this.getPieceAt(targetIndex);
        if (!targetPiece || targetPiece.color !== piece.color) {
          moves.push({ from: index, to: targetIndex, capture: !!targetPiece });
        }
      });

      if (piece.color === "w") {
        if (this.castlingRights.wk && !this.getPieceAt(61) && !this.getPieceAt(62) && !this.isSquareAttacked(60, "b") && !this.isSquareAttacked(61, "b") && !this.isSquareAttacked(62, "b")) {
          moves.push({ from: 60, to: 62, flags: ["castle"] });
        }
        if (this.castlingRights.wq && !this.getPieceAt(59) && !this.getPieceAt(58) && !this.getPieceAt(57) && !this.isSquareAttacked(60, "b") && !this.isSquareAttacked(59, "b") && !this.isSquareAttacked(58, "b")) {
          moves.push({ from: 60, to: 58, flags: ["castle"] });
        }
      } else {
        if (this.castlingRights.bk && !this.getPieceAt(5) && !this.getPieceAt(6) && !this.isSquareAttacked(4, "w") && !this.isSquareAttacked(5, "w") && !this.isSquareAttacked(6, "w")) {
          moves.push({ from: 4, to: 6, flags: ["castle"] });
        }
        if (this.castlingRights.bq && !this.getPieceAt(1) && !this.getPieceAt(2) && !this.getPieceAt(3) && !this.isSquareAttacked(4, "w") && !this.isSquareAttacked(3, "w") && !this.isSquareAttacked(2, "w")) {
          moves.push({ from: 4, to: 2, flags: ["castle"] });
        }
      }
      return moves;
    }

    return moves;
  }

  orderMoves(moves) {
    return moves.sort((a, b) => {
      const aPriority = (a.capture ? 100 : 0) + (a.promotion ? 200 : 0) + (a.flags?.includes("castle") ? 50 : 0);
      const bPriority = (b.capture ? 100 : 0) + (b.promotion ? 200 : 0) + (b.flags?.includes("castle") ? 50 : 0);
      return bPriority - aPriority;
    });
  }

  isMoveLegal(from, move) {
    const next = this.clone();
    next.makeMove({ ...move, from, to: move.to }, { recordHistory: false });
    return !next.isKingInCheck(this.turn);
  }

  isKingInCheck(color) {
    const kingIndex = this.findKing(color);
    return kingIndex !== -1 && this.isSquareAttacked(kingIndex, getOpposite(color));
  }

  findKing(color) {
    return this.board.findIndex((piece) => piece && piece.color === color && piece.type === "k");
  }

  isSquareAttacked(index, byColor) {
    const { row, col } = indexToCoord(index);
    const opponent = byColor;

    for (let r = 0; r < BOARD_SIZE; r += 1) {
      for (let c = 0; c < BOARD_SIZE; c += 1) {
        const piece = this.board[coordToIndex(r, c)];
        if (!piece || piece.color !== opponent) continue;
        const from = coordToIndex(r, c);
        if (piece.type === "p") {
          const dir = piece.color === "w" ? -1 : 1;
          if (c + 1 < BOARD_SIZE && r + dir === row && c + 1 === col) return true;
          if (c - 1 >= 0 && r + dir === row && c - 1 === col) return true;
        } else if (piece.type === "n") {
          const offsets = [[-2, -1], [-2, 1], [-1, -2], [-1, 2], [1, -2], [1, 2], [2, -1], [2, 1]];
          if (offsets.some(([dr, dc]) => r + dr === row && c + dc === col)) return true;
        } else if (piece.type === "b" || piece.type === "r" || piece.type === "q") {
          if (piece.type === "b" || piece.type === "q") {
            const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
            for (const [dr, dc] of directions) {
              let step = 1;
              while (true) {
                const rr = r + dr * step;
                const cc = c + dc * step;
                if (!isInside(rr, cc)) break;
                const target = this.board[coordToIndex(rr, cc)];
                if (target) {
                  if (coordToIndex(rr, cc) === index) return true;
                  break;
                }
                step += 1;
              }
            }
          }
          if (piece.type === "r" || piece.type === "q") {
            const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
            for (const [dr, dc] of directions) {
              let step = 1;
              while (true) {
                const rr = r + dr * step;
                const cc = c + dc * step;
                if (!isInside(rr, cc)) break;
                const target = this.board[coordToIndex(rr, cc)];
                if (target) {
                  if (coordToIndex(rr, cc) === index) return true;
                  break;
                }
                step += 1;
              }
            }
          }
        } else if (piece.type === "k") {
          const offsets = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]];
          if (offsets.some(([dr, dc]) => r + dr === row && c + dc === col)) return true;
        }
      }
    }

    return false;
  }

  updateStatus() {
    const legalMoves = this.getLegalMoves();
    const inCheck = this.isKingInCheck(this.turn);
    if (!legalMoves.length) {
      this.status = inCheck ? "checkmate" : "stalemate";
      this.gameOver = true;
    } else if (inCheck) {
      this.status = "check";
      this.gameOver = false;
    } else if (this.isInsufficientMaterial() || this.isThreefoldRepetition() || this.halfmoveClock >= 100) {
      this.status = "draw";
      this.gameOver = true;
    } else {
      this.status = "playing";
      this.gameOver = false;
    }
  }

  isInsufficientMaterial() {
    const pieces = this.board.filter(Boolean);
    if (pieces.length <= 2) return true;
    const types = pieces.map((piece) => piece.type);
    const hasMajor = types.some((type) => ["q", "r"].includes(type));
    const hasPawns = types.some((type) => type === "p");
    if (hasPawns || hasMajor) return false;
    const bishops = pieces.filter((piece) => piece.type === "b");
    const knights = pieces.filter((piece) => piece.type === "n");
    if (bishops.length > 1) return true;
    if (bishops.length === 1 && knights.length === 0) return true;
    return pieces.length <= 3;
  }

  isThreefoldRepetition() {
    return Array.from(this.repetitionMap.values()).some((count) => count >= 3);
  }

  generateSan(move, initialRights, piece, targetPiece) {
    if (move.flags?.includes("castle")) return move.to === 62 || move.to === 6 ? "O-O" : "O-O-O";
    let san = "";
    if (piece.type !== "p") {
      san += piece.type.toUpperCase();
    }
    if (move.capture) {
      if (piece.type === "p") san += this.fileName(move.from);
      san += "x";
    }
    san += this.squareName(move.to);
    if (move.promotion) san += `=${move.promotion.toUpperCase()}`;
    return san;
  }

  squareName(index) {
    const row = Math.floor(index / 8);
    const col = index % 8;
    return `${String.fromCharCode(97 + col)}${8 - row}`;
  }

  fileName(index) {
    const col = index % 8;
    return String.fromCharCode(97 + col);
  }

  evaluatePosition() {
    let score = 0;
    this.board.forEach((piece, index) => {
      if (!piece) return;
      const { row, col } = indexToCoord(index);
      const sign = piece.color === "w" ? 1 : -1;
      score += sign * MATERIAL_VALUES[piece.type];
      score += sign * this.positionTable(piece, row, col);
      score += sign * this.centerControl(piece, row, col);
      score += sign * this.mobilityScore(piece, index);
      score += sign * this.kingSafety(piece, index);
      score += sign * this.pawnStructure(piece, index);
    });
    return score;
  }

  positionTable(piece, row, col) {
    const table = POSITION_TABLE[piece.type];
    if (!table) return 0;
    const displayRow = piece.color === "w" ? 7 - row : row;
    return table[displayRow][col] * (piece.color === "w" ? 1 : -1);
  }

  centerControl(piece, row, col) {
    if (piece.type === "p") {
      const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
      return centerSquares.some(([r, c]) => row === r && col === c) ? 8 : 0;
    }
    return 0;
  }

  mobilityScore(piece, index) {
    if (piece.type === "k") return 0;
    const moves = this.generatePseudoMoves(index, piece).length;
    return piece.color === "w" ? moves : -moves;
  }

  kingSafety(piece, index) {
    if (piece.type !== "k") return 0;
    const { row, col } = indexToCoord(index);
    let safety = 0;
    if (piece.color === "w") {
      safety += row < 6 ? 8 : 0;
      safety += col > 0 && col < 7 ? 4 : 0;
    } else {
      safety += row > 1 ? 8 : 0;
      safety += col > 0 && col < 7 ? 4 : 0;
    }
    return safety;
  }

  pawnStructure(piece, index) {
    if (piece.type !== "p") return 0;
    const { col } = indexToCoord(index);
    return col === 3 || col === 4 ? 2 : 0;
  }

  findBestMove(depth = this.aiDepth) {
    const legalMoves = this.getLegalMoves();
    if (!legalMoves.length) return null;
    let bestMove = legalMoves[0];
    let bestScore = -Infinity;
    const alpha = -Infinity;
    const beta = Infinity;
    const color = this.turn;

    legalMoves.forEach((move) => {
      const next = this.clone();
      next.makeMove({ ...move, from: move.from, to: move.to }, { recordHistory: false });
      const score = -this.minimax(next, depth - 1, -beta, -alpha, color);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    });

    return bestMove;
  }

  minimax(node, depth, alpha, beta, rootColor) {
    if (depth === 0) return node.evaluatePosition();
    const moves = node.getLegalMoves();
    if (!moves.length) {
      return node.isKingInCheck(node.turn) ? -200000 : 0;
    }
    let best = -Infinity;
    for (const move of moves) {
      const child = node.clone();
      child.makeMove({ ...move, from: move.from, to: move.to }, { recordHistory: false });
      const score = -this.minimax(child, depth - 1, -beta, -alpha, rootColor);
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
      if (alpha >= beta) break;
    }
    return best;
  }
}

class AudioManager {
  constructor() {
    this.enabled = true;
    this.context = null;
  }

  init() {
    if (!this.context) {
      this.context = new (window.AudioContext || window.webkitAudioContext)();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();
    const ctx = this.context;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    const frequencyMap = {
      move: 540,
      capture: 720,
      check: 880,
      checkmate: 980,
      castling: 650,
      promotion: 1120
    };
    oscillator.type = "sine";
    oscillator.frequency.value = frequencyMap[type] || 500;
    gain.gain.setValueAtTime(0.03, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
  }
}

class UIController {
  constructor() {
    this.game = new ChessGame();
    this.audio = new AudioManager();
    this.selectedIndex = null;
    this.legalMoves = [];
    this.difficulty = "medium";
    this.animationSpeed = 220;
    this.pieceStyle = "classic";
    this.boardColor = "classic";
    this.isFlipped = false;
    this.pendingPromotion = null;
    this.boardElement = document.getElementById("board");
    this.draggingPiece = null;
    this.draggingIndex = null;
    this.overlay = document.getElementById("overlay");
    this.modal = document.getElementById("modal");
    this.promotionModal = document.getElementById("promotion-modal");
    this.modalTitle = document.getElementById("modal-title");
    this.modalContent = document.getElementById("modal-content");
    this.statusDisplay = document.getElementById("status-display");
    this.turnDisplay = document.getElementById("turn-display");
    this.gameStatus = document.getElementById("game-status");
    this.moveHistoryList = document.getElementById("move-history-list");
    this.capturedWhite = document.getElementById("captured-white");
    this.capturedBlack = document.getElementById("captured-black");
    this.clockDisplay = document.getElementById("clock-display");
    this.timerSelect = document.getElementById("timer-select");
    this.pieceLayer = null;
    this.pieceElements = new Map();
    this.clockTimerId = null;
    this.clockBySide = { w: 0, b: 0 };
    this.init();
  }

  init() {
    this.attachEvents();
    this.buildBoard();
    this.loadSettings();
    this.loadGame();
    this.render();
    this.openMenu();
  }

  attachEvents() {
    document.getElementById("menu-btn").addEventListener("click", () => this.openMenu());
    document.getElementById("new-game-btn").addEventListener("click", () => this.startNewGame());
    document.getElementById("flip-btn").addEventListener("click", () => this.flipBoard());
    document.getElementById("undo-btn").addEventListener("click", () => this.handleUndo());
    document.getElementById("restart-btn").addEventListener("click", () => this.restartGame());
    document.getElementById("settings-open-btn").addEventListener("click", () => this.openSettings());
    document.getElementById("play-ai-btn").addEventListener("click", () => this.startGameAndCloseMenu());
    document.getElementById("difficulty-menu-btn").addEventListener("click", () => this.openDifficulty());
    document.getElementById("instructions-btn").addEventListener("click", () => this.openInstructions());
    document.getElementById("settings-menu-btn").addEventListener("click", () => this.openSettings());
    document.getElementById("resume-btn").addEventListener("click", () => this.resumeSavedGame());
    document.getElementById("modal-close").addEventListener("click", () => this.closeModal());
    this.timerSelect.addEventListener("change", (event) => this.setTimer(parseInt(event.target.value, 10)));

    document.querySelectorAll("[data-promotion]").forEach((button) => {
      button.addEventListener("click", () => this.promote(button.dataset.promotion));
    });

    this.boardElement.addEventListener("click", (event) => this.handleBoardClick(event));
    this.boardElement.addEventListener("pointerdown", (event) => this.handlePointerDown(event));
    this.boardElement.style.touchAction = "none";
    window.addEventListener("pointermove", (event) => this.handlePointerMove(event));
    window.addEventListener("pointerup", (event) => this.handlePointerUp(event));
    window.addEventListener("pointercancel", (event) => this.handlePointerUp(event));
    window.addEventListener("resize", () => this.render());
  }

  buildBoard() {
    this.boardElement.innerHTML = "";
    const pieceLayer = document.createElement("div");
    pieceLayer.className = "piece-layer";
    this.boardElement.appendChild(pieceLayer);
    this.pieceLayer = pieceLayer;
    for (let index = 0; index < 64; index += 1) {
      const square = document.createElement("button");
      square.className = "square";
      square.dataset.index = index;
      square.type = "button";
      const row = Math.floor(index / 8);
      const col = index % 8;
      square.classList.add((row + col) % 2 === 0 ? "light" : "dark");
      this.boardElement.appendChild(square);
    }
    this.boardElement.appendChild(pieceLayer);
  }

  loadSettings() {
    const defaults = {
      difficulty: "medium",
      animationSpeed: 220,
      pieceStyle: "classic",
      boardColor: "classic",
      sound: true
    };
    const stored = JSON.parse(localStorage.getItem("chess-master-settings") || "null") || defaults;
    this.difficulty = stored.difficulty || defaults.difficulty;
    this.animationSpeed = stored.animationSpeed || defaults.animationSpeed;
    this.pieceStyle = stored.pieceStyle || defaults.pieceStyle;
    this.boardColor = stored.boardColor || defaults.boardColor;
    this.audio.enabled = stored.sound !== undefined ? stored.sound : true;
    this.applyTheme();
  }

  saveSettings() {
    localStorage.setItem("chess-master-settings", JSON.stringify({
      difficulty: this.difficulty,
      animationSpeed: this.animationSpeed,
      pieceStyle: this.pieceStyle,
      boardColor: this.boardColor,
      sound: this.audio.enabled
    }));
  }

  loadGame() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored) {
      this.game.restoreSnapshot(stored);
      this.game.aiDepth = this.getDepthFromDifficulty(this.difficulty);
      this.render();
      this.showMessage("Resumed the saved game.");
    }
  }

  setTimer(seconds) {
    this.clockBySide = { w: seconds, b: seconds };
    clearInterval(this.clockTimerId);
    if (seconds > 0) {
      this.clockTimerId = window.setInterval(() => this.tickClock(), 1000);
    }
    this.render();
  }

  tickClock() {
    const seconds = this.clockBySide[this.game.turn];
    if (seconds <= 0) {
      return;
    }
    this.clockBySide[this.game.turn] = seconds - 1;
    this.render();
  }

  saveGame() {
    const snapshot = this.game.createSnapshot();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  }

  clearSavedGame() {
    localStorage.removeItem(STORAGE_KEY);
  }

  startNewGame() {
    this.game = new ChessGame();
    this.game.aiDepth = this.getDepthFromDifficulty(this.difficulty);
    this.selectedIndex = null;
    this.legalMoves = [];
    this.clearSavedGame();
    const timerSeconds = Number(this.timerSelect.value);
    this.setTimer(timerSeconds);
    this.render();
    this.closeMenu();
    this.showMessage("A fresh game is ready.");
  }

  restartGame() {
    this.game = new ChessGame();
    this.game.aiDepth = this.getDepthFromDifficulty(this.difficulty);
    this.selectedIndex = null;
    this.legalMoves = [];
    this.clearSavedGame();
    const timerSeconds = Number(this.timerSelect.value);
    this.setTimer(timerSeconds);
    this.render();
    this.showMessage("Game restarted.");
  }

  startGameAndCloseMenu() {
    this.closeMenu();
    this.render();
  }

  flipBoard() {
    this.isFlipped = !this.isFlipped;
    this.render();
  }

  handleUndo() {
    if (this.game.turn === "b") return;
    const restored = this.game.undoLastPlayerMove();
    if (restored) {
      this.selectedIndex = null;
      this.legalMoves = [];
      this.render();
      this.showMessage("Undid the last player move.");
    }
  }

  handleBoardClick(event) {
    const pieceElement = event.target.closest(".piece");
    const square = event.target.closest(".square");
    const index = pieceElement ? Number(pieceElement.dataset.index) : square ? Number(square.dataset.index) : null;
    if (index === null || this.game.gameOver || this.pendingPromotion) return;

    const piece = this.game.getPieceAt(index);

    if (this.selectedIndex !== null && this.legalMoves.includes(index)) {
      this.makeMove(this.selectedIndex, index);
      return;
    }

    if (piece && piece.color === this.game.turn) {
      this.selectPiece(index);
      return;
    }

    this.selectedIndex = null;
    this.legalMoves = [];
    this.render();
  }

  handlePointerDown(event) {
    const piece = event.target.closest(".piece");
    if (!piece || !piece.dataset.index || this.game.gameOver || this.pendingPromotion) return;
    const index = Number(piece.dataset.index);
    const boardPiece = this.game.getPieceAt(index);
    if (!boardPiece || boardPiece.color !== this.game.turn) return;

    event.preventDefault();
    this.selectPiece(index);
    piece.classList.add("dragging");
    this.draggingPiece = piece;
    this.draggingIndex = index;
    piece.style.zIndex = "100";
    piece.setPointerCapture(event.pointerId);
  }

  handlePointerMove(event) {
    if (!this.draggingPiece) return;
    const rect = this.boardElement.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    this.draggingPiece.style.left = `${Math.max(0, Math.min(rect.width - 48, x - 24))}px`;
    this.draggingPiece.style.top = `${Math.max(0, Math.min(rect.height - 48, y - 24))}px`;
  }

  handlePointerUp(event) {
    if (!this.draggingPiece) return;
    const target = document.elementFromPoint(event.clientX, event.clientY);
    const square = target?.closest(".square");
    this.draggingPiece.classList.remove("dragging");
    this.draggingPiece.style.zIndex = "";
    const fromIndex = this.draggingIndex;
    this.draggingPiece = null;
    this.draggingIndex = null;

    if (square) {
      const index = Number(square.dataset.index);
      if (this.selectedIndex !== null && this.legalMoves.includes(index)) {
        this.makeMove(this.selectedIndex, index);
      } else if (fromIndex !== null) {
        this.selectPiece(fromIndex);
      }
    } else {
      this.render();
    }
  }

  selectPiece(index) {
    if (this.game.gameOver || this.pendingPromotion) return;
    const piece = this.game.getPieceAt(index);
    if (!piece || piece.color !== this.game.turn) return;

    if (this.selectedIndex === index) {
      this.selectedIndex = null;
      this.legalMoves = [];
    } else {
      this.selectedIndex = index;
      this.legalMoves = this.game.getLegalMoves().filter((move) => move.from === index).map((move) => move.to);
    }
    this.render();
  }

  async makeMove(from, to) {
    const move = this.game.getLegalMoves().find((candidate) => candidate.from === from && candidate.to === to);
    if (!move) return;

    if (move.promotion) {
      this.pendingPromotion = { from, to, move };
      this.openPromotionModal();
      return;
    }

    this.executeMove(move, from, to);
  }

  executeMove(move, from, to) {
    this.game.makeMove({ ...move, from, to }, { storeUndo: this.game.turn === "w" });
    this.audio.play(this.getSoundTypeForMove(move));
    this.selectedIndex = null;
    this.legalMoves = [];
    this.render();
    this.saveGame();
    if (this.game.gameOver) {
      this.audio.play(this.game.status === "checkmate" ? "checkmate" : "check");
    }

    if (!this.game.gameOver && this.game.turn === "b") {
      window.setTimeout(() => this.aiMove(), 650);
    }
  }

  promote(type) {
    if (!this.pendingPromotion) return;
    const move = { ...this.pendingPromotion.move, promotion: type };
    this.game.makeMove({ ...move, from: this.pendingPromotion.from, to: this.pendingPromotion.to }, { storeUndo: this.game.turn === "w" });
    this.audio.play("promotion");
    this.pendingPromotion = null;
    this.selectedIndex = null;
    this.legalMoves = [];
    this.closePromotionModal();
    this.render();
    this.saveGame();
    if (!this.game.gameOver && this.game.turn === "b") {
      window.setTimeout(() => this.aiMove(), 650);
    }
  }

  aiMove() {
    if (this.game.gameOver || this.game.turn !== "b") return;
    const legalMoves = this.game.getLegalMoves();
    if (!legalMoves.length) return;

    const move = this.game.findBestMove(this.getDepthFromDifficulty(this.difficulty)) || legalMoves[0];
    const from = move.from;
    const to = move.to;
    const legalMove = legalMoves.find((candidate) => candidate.from === from && candidate.to === to) || legalMoves[0];
    if (!legalMove) return;

    if (legalMove.promotion) {
      const promotion = ["q", "r", "b", "n"][Math.floor(Math.random() * 4)];
      this.game.makeMove({ ...legalMove, from, to, promotion }, { recordHistory: true, storeUndo: false });
      this.audio.play("move");
      this.selectedIndex = null;
      this.legalMoves = [];
      this.render();
      this.saveGame();
      return;
    }

    this.game.makeMove({ ...legalMove, from, to }, { recordHistory: true, storeUndo: false });
    this.audio.play(this.getSoundTypeForMove(legalMove));
    this.selectedIndex = null;
    this.legalMoves = [];
    this.render();
    this.saveGame();
  }

  getSoundTypeForMove(move) {
    if (move.flags?.includes("castle")) return "castling";
    if (move.capture) return "capture";
    return "move";
  }

  getDepthFromDifficulty(difficulty) {
    if (difficulty === "easy") return 2;
    if (difficulty === "medium") return 3;
    return 4;
  }

  render() {
    this.updateStatusPanel();
    this.updateMoveHistory();
    this.updateCapturedPieces();
    this.updateClock();
    this.renderBoard();
    this.applyTheme();
  }

  updateStatusPanel() {
    this.turnDisplay.textContent = this.game.turn === "w" ? "White" : "Black";
    const label = this.game.status === "checkmate"
      ? "Checkmate"
      : this.game.status === "stalemate"
        ? "Stalemate"
        : this.game.status === "check"
          ? "Check"
          : this.game.status === "draw"
            ? "Draw"
            : "Playing";
    this.statusDisplay.textContent = label;
    this.gameStatus.textContent = `${this.game.turn === "w" ? "White" : "Black"} to move${this.game.status === "check" ? " – Check" : ""}`;
  }

  updateMoveHistory() {
    this.moveHistoryList.innerHTML = "";
    const pairs = [];
    for (let i = 0; i < this.game.moveHistory.length; i += 2) {
      const whiteMove = this.game.moveHistory[i];
      const blackMove = this.game.moveHistory[i + 1];
      if (whiteMove) {
        const item = document.createElement("li");
        item.textContent = `${Math.floor(i / 2) + 1}. ${whiteMove.san}${blackMove ? ` ${blackMove.san}` : ""}`;
        this.moveHistoryList.appendChild(item);
      }
    }
  }

  updateCapturedPieces() {
    this.capturedWhite.innerHTML = this.game.capturedPieces.w.map((piece) => `<span>${piece.toUpperCase()}</span>`).join("");
    this.capturedBlack.innerHTML = this.game.capturedPieces.b.map((piece) => `<span>${piece.toUpperCase()}</span>`).join("");
  }

  updateClock() {
    const timerSeconds = Number(this.timerSelect.value);
    if (!timerSeconds) {
      this.clockDisplay.textContent = "--:--";
      return;
    }
    const currentSide = this.game.turn;
    const remaining = this.clockBySide[currentSide] ?? timerSeconds;
    const minutes = Math.floor(remaining / 60);
    const seconds = remaining % 60;
    this.clockDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  renderBoard() {
    const squares = this.boardElement.querySelectorAll(".square");
    const pieceLayer = this.pieceLayer;
    const boardSize = this.boardElement.clientWidth || 560;
    const cellSize = boardSize / 8;
    const legalSet = new Set(this.legalMoves);
    const lastMove = this.game.lastMove ? new Set([this.game.lastMove.from, this.game.lastMove.to]) : new Set();
    const checkKingIndex = this.game.isKingInCheck(this.game.turn) ? this.game.findKing(this.game.turn) : -1;

    squares.forEach((square) => {
      const index = Number(square.dataset.index);
      square.classList.toggle("selected", this.selectedIndex === index);
      square.classList.toggle("legal", legalSet.has(index));
      square.classList.toggle("last-move", lastMove.has(index));
      square.classList.toggle("check", checkKingIndex === index);
    });

    const pieceIds = new Set();
    this.game.board.forEach((piece, index) => {
      if (!piece) return;
      pieceIds.add(piece.id);
      const displayIndex = this.isFlipped ? 63 - index : index;
      const row = Math.floor(displayIndex / 8);
      const col = displayIndex % 8;
      const x = col * cellSize;
      const y = row * cellSize;
      let element = this.pieceElements.get(piece.id);
      if (!element) {
        element = document.createElement("div");
        element.className = "piece";
        element.dataset.index = index;
        pieceLayer.appendChild(element);
        this.pieceElements.set(piece.id, element);
      }
      element.textContent = this.getSymbol(piece);
      element.dataset.index = index;
      element.style.left = `${x}px`;
      element.style.top = `${y}px`;
      element.style.fontSize = `${cellSize * 0.75}px`;
      element.style.width = `${cellSize}px`;
      element.style.height = `${cellSize}px`;
    });

    this.pieceElements.forEach((element, id) => {
      if (!pieceIds.has(id)) {
        element.remove();
        this.pieceElements.delete(id);
      }
    });
  }

  getSymbol(piece) {
    const style = PIECE_SYMBOLS[this.pieceStyle] || PIECE_SYMBOLS.classic;
    return style[piece.color][piece.type] || "";
  }

  applyTheme() {
    document.documentElement.style.setProperty("--light-square", this.boardColor === "classic" ? "#f6e7c7" : this.boardColor === "ocean" ? "#dbeafe" : this.boardColor === "forest" ? "#d1fae5" : "#1f2937");
    document.documentElement.style.setProperty("--dark-square", this.boardColor === "classic" ? "#5d4037" : this.boardColor === "ocean" ? "#2563eb" : this.boardColor === "forest" ? "#166534" : "#0f172a");
    document.documentElement.style.setProperty("--accent", this.boardColor === "midnight" ? "#fb923c" : "#38bdf8");
  }

  openMenu() {
    this.overlay.classList.remove("hidden");
  }

  closeMenu() {
    this.overlay.classList.add("hidden");
  }

  openSettings() {
    this.modalTitle.textContent = "Settings";
    this.modalContent.innerHTML = `
      <div class="field-row">
        <label class="field-label" for="difficulty-select">AI difficulty</label>
        <select id="difficulty-select">
          <option value="easy" ${this.difficulty === "easy" ? "selected" : ""}>Easy</option>
          <option value="medium" ${this.difficulty === "medium" ? "selected" : ""}>Medium</option>
          <option value="hard" ${this.difficulty === "hard" ? "selected" : ""}>Hard</option>
        </select>
      </div>
      <div class="field-row">
        <label class="field-label" for="board-color-select">Board colors</label>
        <select id="board-color-select">
          <option value="classic" ${this.boardColor === "classic" ? "selected" : ""}>Classic</option>
          <option value="ocean" ${this.boardColor === "ocean" ? "selected" : ""}>Ocean</option>
          <option value="forest" ${this.boardColor === "forest" ? "selected" : ""}>Forest</option>
          <option value="midnight" ${this.boardColor === "midnight" ? "selected" : ""}>Midnight</option>
        </select>
      </div>
      <div class="field-row">
        <label class="field-label" for="piece-style-select">Piece style</label>
        <select id="piece-style-select">
          <option value="classic" ${this.pieceStyle === "classic" ? "selected" : ""}>Classic</option>
          <option value="modern" ${this.pieceStyle === "modern" ? "selected" : ""}>Modern</option>
          <option value="neon" ${this.pieceStyle === "neon" ? "selected" : ""}>Neon</option>
        </select>
      </div>
      <div class="field-row">
        <label class="field-label" for="animation-range">Animation speed</label>
        <input id="animation-range" type="range" min="120" max="400" step="20" value="${this.animationSpeed}" />
      </div>
      <div class="field-row">
        <label><input id="sound-toggle" type="checkbox" ${this.audio.enabled ? "checked" : ""} /> Sound on</label>
      </div>
    `;
    this.modal.classList.remove("hidden");
    document.getElementById("difficulty-select").addEventListener("change", (event) => {
      this.difficulty = event.target.value;
      this.game.aiDepth = this.getDepthFromDifficulty(this.difficulty);
      this.saveSettings();
      this.render();
    });
    document.getElementById("board-color-select").addEventListener("change", (event) => {
      this.boardColor = event.target.value;
      this.applyTheme();
      this.saveSettings();
    });
    document.getElementById("piece-style-select").addEventListener("change", (event) => {
      this.pieceStyle = event.target.value;
      this.render();
      this.saveSettings();
    });
    document.getElementById("animation-range").addEventListener("input", (event) => {
      this.animationSpeed = Number(event.target.value);
      document.documentElement.style.setProperty("--transition-duration", `${this.animationSpeed}ms`);
      this.saveSettings();
    });
    document.getElementById("sound-toggle").addEventListener("change", (event) => {
      this.audio.enabled = event.target.checked;
      this.saveSettings();
    });
  }

  openDifficulty() {
    this.modalTitle.textContent = "Difficulty";
    this.modalContent.innerHTML = `
      <div class="field-row">
        <button class="secondary" data-difficulty="easy">Easy</button>
        <button class="secondary" data-difficulty="medium">Medium</button>
        <button class="secondary" data-difficulty="hard">Hard</button>
      </div>
    `;
    this.modal.classList.remove("hidden");
    this.modalContent.querySelectorAll("[data-difficulty]").forEach((button) => {
      button.addEventListener("click", () => {
        this.difficulty = button.dataset.difficulty;
        this.game.aiDepth = this.getDepthFromDifficulty(this.difficulty);
        this.saveSettings();
        this.render();
        this.closeModal();
      });
    });
  }

  openInstructions() {
    this.modalTitle.textContent = "Instructions";
    this.modalContent.innerHTML = `
      <p>Click a piece to select it. Click a highlighted square to move. Drag pieces on desktop for quick play.</p>
      <p>Use the menu to change difficulty, board style, and sound. The AI will play as Black and uses minimax with alpha-beta pruning.</p>
      <p>Castling, en passant, promotion, check, checkmate, stalemate, and draw rules are all implemented.</p>
    `;
    this.modal.classList.remove("hidden");
  }

  openPromotionModal() {
    this.promotionModal.classList.remove("hidden");
  }

  closePromotionModal() {
    this.promotionModal.classList.add("hidden");
  }

  closeModal() {
    this.modal.classList.add("hidden");
  }

  resumeSavedGame() {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored) {
      this.game.restoreSnapshot(stored);
      this.selectedIndex = null;
      this.legalMoves = [];
      this.closeMenu();
      this.render();
      this.showMessage("Loaded your saved game.");
    } else {
      this.showMessage("No saved game found.");
    }
  }

  showMessage(message) {
    this.gameStatus.textContent = message;
    window.setTimeout(() => this.render(), 1200);
  }
}

const ui = new UIController();

window.addEventListener("load", () => {
  ui.render();
});
