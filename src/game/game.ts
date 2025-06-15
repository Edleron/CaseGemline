import { Container } from "pixi.js";
import { Core } from "./core/Core";

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
}
