import { Container } from "pixi.js";
import { Core } from "./core/Core";
import { Store } from "./Store/Store";

export class CreationGame extends Container {
  private core: Core | undefined;

  constructor() {
    super();
  }
  
  public init() {
    this.core = new Core();
    this.addChild(this.core);
  }

  public fade() {
    if (this.core) {
      this.core.startDropAnimation();
    }
  }

  public reset() {
    if (this.core) {
      this.core.resetAndRedrop();
    }
  }

  public isReady(): boolean {
    return this.core ? this.core.getIsDropping() : false;
  }

  public subscribeToScore(callback: (score: number) => void): () => void {
    return Store.subscribe((state, previousState) => {
      if (state.score !== previousState.score) {
        callback(state.score);
      }
    });
  }

  public getCurrentScore(): number {
    return Store.getState().score;
  }

  public subscribeToMove(callback: (move: number) => void): () => void {
    return Store.subscribe((state, previousState) => {
      if (state.moves !== previousState.moves) {
        callback(state.moves);
      }
    });
  }

  public getCurrentMove(): number {
    return Store.getState().moves;
  }
}
