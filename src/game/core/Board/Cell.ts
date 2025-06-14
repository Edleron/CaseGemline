import { Sprite, Texture } from "pixi.js";

export class Cell extends Sprite {
  constructor(texture: Texture) {
    super(texture);
    this.name = "Cell";
  }
}
