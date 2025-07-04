import { createStore } from "zustand/vanilla";
import { GetConfig } from "../core/Constants/Configt";

interface GameState {
  score: number;
  moves: number;
  isGameOver: boolean;
  
  // Logic Context State
  logicContext: any | null;
  draggedSymbol: any | null;
  isSwapInProgress: boolean;
  
  // Actions
  incrementScore: (amount: number) => void;
  decrementMove: () => void;
  setGameOver: (state: boolean) => void;
  resetGame: () => void;
  
  // Logic Actions
  setLogicContext: (context: any) => void;
  setDraggedSymbol: (symbol: any) => void;
  setSwapInProgress: (inProgress: boolean) => void;
  clearLogicState: () => void;

  moveFailedCount: number;
  incrementMoveFailedCount: () => void;
  resetMoveFailedCount: () => void;

  // State Machine
  stateMachine: any | null;
  setStateMachine: (machine: any) => void;

  // Score
  setScore: (score: number) => void;
}

const config = GetConfig();

export const Store = createStore<GameState>((set) => ({
  score: 0,
  moves: config.maxMoves,
  isGameOver: false,
  
  // Logic Context State
  logicContext: null,
  draggedSymbol: null,
  isSwapInProgress: false,
  
  // Game Actions
  incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
  decrementMove: () => set((state) => ({ moves: state.moves - 1 })),
  setGameOver: (isGameOver) => set({ isGameOver }),
  resetGame: () => set({ 
    score: 0, 
    moves: config.maxMoves, 
    isGameOver: false,
    draggedSymbol: null,
    isSwapInProgress: false,
    moveFailedCount: 0
  }),
  
  // Logic Actions
  setLogicContext: (logicContext) => set({ logicContext }),
  setDraggedSymbol: (draggedSymbol) => set({ draggedSymbol }),
  setSwapInProgress: (isSwapInProgress) => set({ isSwapInProgress }),
  clearLogicState: () => set({ 
    draggedSymbol: null, 
    isSwapInProgress: false 
  }),

  // Move Count
  moveFailedCount: 0,
  incrementMoveFailedCount: () => set((state) => ({ moveFailedCount: state.moveFailedCount + 1 })),
  resetMoveFailedCount: () => set({ moveFailedCount: 0 }),

  // State Machine
  stateMachine: null,
  setStateMachine: (machine) => set({ stateMachine: machine }),

  // Score
  setScore: (score) => set({ score }),
}));
