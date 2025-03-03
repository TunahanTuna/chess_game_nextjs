"use client";
import { useState, useEffect } from "react";
import { Chess } from "chess.js";

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

  useEffect(() => {
    const newGame = new Chess();
    setGame(newGame);
    setBoard(newGame.board());
  }, []);

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
    const moves = game.moves({ square: position, verbose: true });
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
    <div className="w-[min(80vw,600px)] aspect-square grid grid-cols-8 grid-rows-8 border border-gray-300 dark:border-gray-600 shadow-lg">
      {Array(8)
        .fill(null)
        .map((_, i) =>
          Array(8)
            .fill(null)
            .map((_, j) => renderSquare(i, j))
        )}
    </div>
  );
}
