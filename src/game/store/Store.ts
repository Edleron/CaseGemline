import { createStore } from "zustand/vanilla";

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
}

export const Store = createStore<GameState>((set) => ({
  score: 0,
  moves: 25,
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
    moves: 25, 
    isGameOver: false,
    draggedSymbol: null,
    isSwapInProgress: false
  }),
  
  // Logic Actions
  setLogicContext: (logicContext) => set({ logicContext }),
  setDraggedSymbol: (draggedSymbol) => set({ draggedSymbol }),
  setSwapInProgress: (isSwapInProgress) => set({ isSwapInProgress }),
  clearLogicState: () => set({ 
    draggedSymbol: null, 
    isSwapInProgress: false 
  })
}));

// State change subscribers
Store.subscribe((state: GameState) => {
  // console.log("Game State Updated:", state);
});
