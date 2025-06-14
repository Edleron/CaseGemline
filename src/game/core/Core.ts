import { Container } from "pixi.js";
import { Board } from "./Board/Board";
import { Symbol } from "./Symbol/Symbol";
import { Config, GetConfig } from "./Constants/Configt";
import { animate } from "motion";

export class Core extends Container {
  private config: Config;
  private mainBoard: Board;
  private viewerBoard: Board;
  private mainSymbols: Symbol[][] = [];
  private viewerSymbols: Symbol[] = [];

  constructor(customConfig?: Partial<Config>) {
    super();
    this.config = GetConfig(customConfig);
    
    // Create main board
    this.mainBoard = new Board(this.config);
    
    // Create viewer board (1 row, 3 columns)
    const viewerConfig = { ...this.config, rows: 1, columns: 3 };
    this.viewerBoard = new Board(viewerConfig);
    
    // Position viewer board below main board
    this.viewerBoard.x = 128
    this.viewerBoard.y = this.mainBoard.height + 50;
    
    this.addChild(this.mainBoard);
    this.addChild(this.viewerBoard);
    this.initializeSymbols();
  }

  private initializeSymbols(): void {
    this.initializeMainBoardSymbols();
    this.initializeViewerBoardSymbols();
  }

  private initializeMainBoardSymbols(): void {
    // Initialize main board symbols array
    for (let row = 0; row < this.config.rows; row++) {
      this.mainSymbols[row] = [];
    }

    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.columns; col++) {
        this.createMainBoardSymbolAt(row, col);
      }
    }
  }

  private initializeViewerBoardSymbols(): void {
    for (let col = 0; col < 3; col++) {
      this.createViewerBoardSymbolAt(col);
    }
  }

  private createMainBoardSymbolAt(row: number, col: number): void {
    const symbol = new Symbol(undefined, this.config.mode);
    symbol.width = this.config.tileSize;
    symbol.height = this.config.tileSize;
    
    const finalX = col * this.config.tileSize;
    const finalY = row * this.config.tileSize;
    
    symbol.x = finalX;
    symbol.y = finalY - (this.config.rows + 2) * this.config.tileSize;
    symbol.alpha = 0;
    
    this.mainSymbols[row][col] = symbol;
    this.mainBoard.addChild(symbol);
  }

  private createViewerBoardSymbolAt(col: number): void {
    const symbol = new Symbol(undefined, this.config.mode);
    symbol.width = this.config.tileSize;
    symbol.height = this.config.tileSize;
    
    const finalX = col * this.config.tileSize;
    const finalY = 0;
    
    symbol.x = finalX;
    symbol.y = finalY - this.config.tileSize * 2;
    symbol.alpha = 0;
    
    this.viewerSymbols[col] = symbol;
    this.viewerBoard.addChild(symbol);
  }

  public startDropAnimation(): void {
    // Start main board symbols drop animation
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.columns; col++) {
        const symbol = this.mainSymbols[row][col];
        if (symbol) {
          this.animateMainBoardSymbolDrop(symbol, row, col);
        }
      }
    }
    
    // Start viewer board symbols drop animation with delay
    setTimeout(() => {
      for (let col = 0; col < 3; col++) {
        const symbol = this.viewerSymbols[col];
        if (symbol) {
          this.animateViewerBoardSymbolDrop(symbol, col);
        }
      }
    }, 500);
  }

  private animateMainBoardSymbolDrop(symbol: Symbol, row: number, col: number): void {
    const finalX = col * this.config.tileSize;
    const finalY = row * this.config.tileSize;
    const duration = 0.8;
    
    // First fade in the symbol
    animate(symbol, { alpha: 1 }, { duration: 0.2 });
    
    // Then animate the drop with realistic bounce
    animate(
      symbol,
      { 
        x: finalX, 
        y: finalY 
      },
      {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onComplete: () => {
          symbol.snapToPosition(finalX, finalY);
          symbol.setBoardPosition(row, col);
          // DON'T setup interactivity for main board symbols
        }
      }
    );
  }

  private animateViewerBoardSymbolDrop(symbol: Symbol, col: number): void {
    const finalX = col * this.config.tileSize;
    const finalY = 0;
    const duration = 0.6;
    
    // First fade in the symbol
    animate(symbol, { alpha: 1 }, { duration: 0.2 });
    
    // Then animate the drop with realistic bounce
    animate(
      symbol,
      { 
        x: finalX, 
        y: finalY 
      },
      {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onComplete: () => {
          symbol.snapToPosition(finalX, finalY);
          symbol.setupInteractivity(); // Enable dragging for viewer symbols
        }
      }
    );
  }

  public getMainBoard(): Board {
    return this.mainBoard;
  }

  public getViewerBoard(): Board {
    return this.viewerBoard;
  }

  public getViewerSymbolAt(col: number): Symbol | null {
    return this.viewerSymbols[col] || null;
  }
}
