import { Container } from "pixi.js";
import { Board } from "./core/Board/Board";
export class CreationGame extends Container {
  constructor() {
    super();
    console.log("GameContainer initialized");
  }
  
  public init() {
    const grid = new Board();
    this.addChild(grid);
  }
} 
