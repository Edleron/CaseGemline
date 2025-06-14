import { createStore } from "zustand/vanilla";

interface GameState {
  score: number;
  moves: number;
  isGameOver: boolean;
  incrementScore: (amount: number) => void;
  decrementMove: () => void;
  setGameOver: (state: boolean) => void;
  resetGame: () => void;
}

export const Store = createStore<GameState>((set) => ({
  score: 0,
  moves: 25,
  isGameOver: false,
  incrementScore: (amount) => set((state) => ({ score: state.score + amount })),
  decrementMove: () => set((state) => ({ moves: state.moves - 1 })),
  setGameOver: (isGameOver) => set({ isGameOver }),
  resetGame: () => set({ score: 0, moves: 25, isGameOver: false }),
}));

// Vanilla kullanım örneği:
Store.subscribe((state: GameState) => {
  console.log("Yeni skor:", state.score);
});
