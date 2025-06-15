import { Container, Texture } from "pixi.js";
import { Cell } from "./Cell";
import { Config, GetConfig } from "../Constants/Configt";

export class Board extends Container {
  readonly cellSize: number;
  readonly gridRows: number;
  readonly gridColumns: number;
  readonly texture: Texture;
  private config: Config;
  private cells: Cell[][] = [];

  constructor(customConfig?: Partial<Config>) {
    super();
    this.config = GetConfig(customConfig);
    this.cellSize = this.config.tileSize;
    this.gridRows = this.config.rows;
    this.gridColumns = this.config.columns;
    this.texture = Texture.from(this.config.cellTexture);
    this.createGrid();
  }

  private createGrid(): void {
    // Initialize cells array
    for (let row = 0; row < this.gridRows; row++) {
      this.cells[row] = [];
    }

    for (let row = 0; row < this.gridRows; row++) {
      for (let col = 0; col < this.gridColumns; col++) {
        const cell = new Cell(this.texture);
        cell.width = this.cellSize;
        cell.height = this.cellSize;
        cell.x = col * this.cellSize;
        cell.y = row * this.cellSize;
        
        this.cells[row][col] = cell;
        this.addChild(cell);
      }
    }
  }

  public getCellAt(row: number, col: number): Cell | null {
    if (row >= 0 && row < this.gridRows && col >= 0 && col < this.gridColumns) {
      return this.cells[row][col];
    }
    return null;
  }

  public getCellPosition(row: number, col: number): { x: number; y: number } {
    return {
      x: col * this.cellSize,
      y: row * this.cellSize
    };
  }

  public getGridPositionFromCoords(x: number, y: number): { row: number; col: number } {
    const col = (x / this.cellSize) % 1 >= 0.5 ? Math.ceil(x / this.cellSize) : Math.floor(x / this.cellSize);
    const row = (y / this.cellSize) % 1 >= 0.5 ? Math.ceil(y / this.cellSize) : Math.floor(y / this.cellSize);
    return { row, col };
  }
}