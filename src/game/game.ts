import { Container } from "pixi.js";
import { Core } from "./core/Core";
import { Store } from "./Store/Store";

export class CreationGame extends Container {
  private core: Core | undefined;
  private gameStateUnsubscribe?: () => void;

  constructor() {
    super();
  }
  
  public init() {
    this.core = new Core();
    this.addChild(this.core);
    this.setupGameStateMonitoring();
  }

  private setupGameStateMonitoring(): void {
    this.gameStateUnsubscribe = Store.subscribe((state, previousState) => {
      // Check moves changed to 0 (lose condition)
      if (state.moves !== previousState.moves && state.moves === 0) {
        console.log('🔴 KAYBETTINIZ! Hamle sayınız bitti.');
      }
      
      // Check score reached 500+ (win condition)
      if (state.score !== previousState.score && state.score >= 500 && previousState.score < 500) {
        console.log('🎉 KAZANDINIZ! 500+ puana ulaştınız!');
      }
    });
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

  public destroy() {
    if (this.gameStateUnsubscribe) {
      this.gameStateUnsubscribe();
      this.gameStateUnsubscribe = undefined;
    }
    super.destroy();
  }
}
