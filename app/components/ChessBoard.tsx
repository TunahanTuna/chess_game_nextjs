"use client";
import { useState, useEffect, useRef } from "react";
import { Chess } from "chess.js";
import { motion, AnimatePresence } from "framer-motion";

interface ChessBoardProps {
  theme: "light" | "dark";
}

export default function ChessBoard({ theme }: ChessBoardProps) {
  const [game, setGame] = useState<Chess | null>(null);
  const [selectedPiece, setSelectedPiece] = useState<string | null>(null);
  const [board, setBoard] = useState<any[][]>([]);
  const [draggedPiece, setDraggedPiece] = useState<{
    position: string;
    x: number;
    y: number;
  } | null>(null);
  const [legalMoves, setLegalMoves] = useState<string[]>([]);
  const [moveHistory, setMoveHistory] = useState<any[]>([]);

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
  }, []);

  useEffect(() => {
    if (game) {
      setMoveHistory(game.history({ verbose: true }));
    }
  }, [game]);

  const boardTheme = {
    light: {
      light: "bg-amber-50",
      dark: "bg-amber-900",
    },
    dark: {
      light: "bg-slate-300",
      dark: "bg-slate-900",
    },
  };

  const updateLegalMoves = (position: string) => {
    if (!game) return;
    const moves = game.moves({ square: position as any, verbose: true });
    setLegalMoves(moves.map((move) => move.to));
  };

  const handleDragStart = (e: React.DragEvent, position: string) => {
    if (!game) return;
    const piece = game.get(position as any);
    if (piece && piece.color === (game.turn() === "w" ? "w" : "b")) {
      setSelectedPiece(position);
      setDraggedPiece({ position, x: e.clientX, y: e.clientY });
      updateLegalMoves(position);
    }
  };

  const handleSquareClick = (position: string) => {
    if (!game) return;

    const piece = game.get(position as any);

    if (selectedPiece === null) {
      if (piece && piece.color === (game.turn() === "w" ? "w" : "b")) {
        setSelectedPiece(position);
        updateLegalMoves(position);
      }
    } else {
      try {
        const move = game.move({
          from: selectedPiece,
          to: position,
          promotion: "q",
        });

        if (move) {
          const newGame = new Chess(game.fen());
          setGame(newGame);
          setBoard(newGame.board());
          setMoveHistory(newGame.history({ verbose: true }));
        }
        setSelectedPiece(null);
        setLegalMoves([]);
      } catch (e) {
        if (piece && piece.color === (game.turn() === "w" ? "w" : "b")) {
          setSelectedPiece(position);
          updateLegalMoves(position);
        } else {
          setSelectedPiece(null);
          setLegalMoves([]);
        }
      }
    }
  };

  const handleDrop = (e: React.DragEvent, targetPosition: string) => {
    e.preventDefault();
    if (!game || !selectedPiece) return;

    try {
      const move = game.move({
        from: selectedPiece,
        to: targetPosition,
        promotion: "q",
      });

      if (move) {
        const newGame = new Chess(game.fen());
        setGame(newGame);
        setBoard(newGame.board());
        setMoveHistory(newGame.history({ verbose: true }));
      }
    } catch (e) {
      // Invalid move
    }

    setSelectedPiece(null);
    setDraggedPiece(null);
    setLegalMoves([]);
  };

  const renderSquare = (i: number, j: number) => {
    if (!game) return null;

    const position = `${String.fromCharCode(97 + j)}${8 - i}`;
    const piece = game.get(position as any);
    const isLight = (i + j) % 2 === 0;
    const squareColor = boardTheme[theme][isLight ? "light" : "dark"];
    const isSelected = selectedPiece === position;
    const isLegalMove = legalMoves.includes(position);

    return (
      <div
        key={`${i}-${j}`}
        className={`w-full h-full ${squareColor} ${
          isSelected ? "ring-2 ring-blue-400" : ""
        } ${
          isLegalMove ? "ring-2 ring-green-400" : ""
        } flex items-center justify-center relative`}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => handleDrop(e, position)}
        onClick={() => handleSquareClick(position)}
      >
        {piece && (
          <div
            className="absolute w-full h-full flex items-center justify-center cursor-grab hover:opacity-75 transition-opacity"
            draggable
            onDragStart={(e) => handleDragStart(e, position)}
          >
            {getPieceSymbol(piece)}
          </div>
        )}
        {isLegalMove && !piece && (
          <div className="w-3 h-3 rounded-full bg-green-400 opacity-50" />
        )}
      </div>
    );
  };

  const getPieceSymbol = (piece: { type: string; color: string }) => {
    const symbols: { [key: string]: string } = {
      p: piece.color === "w" ? "♟" : "♟",
      n: piece.color === "w" ? "♞" : "♞",
      b: piece.color === "w" ? "♝" : "♝",
      r: piece.color === "w" ? "♜" : "♜",
      q: piece.color === "w" ? "♛" : "♛",
      k: piece.color === "w" ? "♚" : "♚",
    };
    return (
      <span
        className={`text-4xl select-none ${
          theme === "light"
            ? piece.color === "w"
              ? "text-amber-950 drop-shadow-md"
              : "text-amber-800 drop-shadow-md"
            : piece.color === "w"
            ? "text-slate-100 drop-shadow-lg"
            : "text-slate-400 drop-shadow-lg"
        }`}
      >
        {symbols[piece.type.toLowerCase()]}
      </span>
    );
  };

  if (!game) return <div>Loading...</div>;

  return (
    <div className="flex flex-col md:flex-row gap-4 items-center">
      <div className="w-[min(80vw,600px)] aspect-square grid grid-cols-8 grid-rows-8 border border-gray-300 dark:border-gray-600 shadow-lg">
        {Array(8)
          .fill(null)
          .map((_, i) =>
            Array(8)
              .fill(null)
              .map((_, j) => renderSquare(i, j))
          )}
      </div>

      <div className="w-full md:w-64 border border-gray-300 dark:border-gray-600 rounded-lg p-3 shadow-md">
        <h3 className="font-bold mb-2 text-gray-800 dark:text-gray-200">
          Move History
        </h3>
        <div className="max-h-[400px] overflow-y-auto pr-2">
          {moveHistory.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-4">
              No moves yet
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {moveHistory.map((move, index) => (
                <motion.div
                  key={index}
                  className="col-span-1 flex items-center"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <span className="font-mono text-sm mr-1">
                    {Math.floor(index / 2) + 1}.{index % 2 === 0 ? "" : ".."}
                  </span>
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded text-sm font-medium flex-grow text-center hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                    {move.san}
                  </span>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-4 p-3 bg-slate-100 dark:bg-slate-700 rounded-lg">
          <h4 className="font-semibold mb-2">Game Stats</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div>Moves: {moveHistory.length}</div>
            <div>
              Captures: {moveHistory.filter((move) => move.captured).length}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
