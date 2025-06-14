import type { CreationGame } from "../game/game";

let instance: CreationGame | null = null;

/**
 * Get the main application engine
 * This is a simple way to access the engine instance from anywhere in the app
 */
export function game(): CreationGame {
  return instance!;
}

export function setGame(app: CreationGame) {
  instance = app;
}
