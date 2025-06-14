import { Container, Texture } from "pixi.js";
import { Cell } from "./Cell";
import { Config, GetConfig,  } from "../Constants/Configt";
import { Symbol } from "../Symbol/Symbol";

export class Board extends Container {
  readonly cellSize: number;
  readonly gridRows: number;
  readonly gridColumns: number;
  readonly textureCapsule = [];
  readonly texture: Texture;
  private config: Config;

  constructor(customConfig?: Partial<Config>) {
    super();
    this.config = GetConfig(customConfig);
    this.cellSize = this.config.tileSize;
    this.gridRows = this.config.rows;
    this.gridColumns = this.config.columns;
    this.texture = Texture.from(this.config.cellTexture);
    this.createGrid();
  }

  private createGrid() {
    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridColumns; col++) {
        const cell = new Cell(this.texture);
        cell.width = this.cellSize;
        cell.height = this.cellSize;

        cell.x = col * this.cellSize;
        cell.y = row * this.cellSize;

        let symbol = new Symbol();
        symbol.width = this.cellSize;
        symbol.height = this.cellSize;

        symbol.x = col * this.cellSize;
        symbol.y = row * this.cellSize;

        this.addChild(cell);
        this.addChild(symbol);
      }
    }
  }
}
