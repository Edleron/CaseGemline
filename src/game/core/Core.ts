import { Container } from "pixi.js";
import { createActor } from "xstate";
import { Board } from "./Board/Board";
import { Symbol } from "./Symbol/Symbol";
import { Config, GetConfig } from "./Constants/Configt";
import { UIStateMachine } from "./State/Machine";
import { animate } from "motion";

export class Core extends Container {
  private config: Config;
  private mainBoard: Board;
  private viewerBoard: Board;
  private mainSymbols: Symbol[][] = [];
  private viewerSymbols: Symbol[] = [];
  private stateMachine: ReturnType<typeof createActor>;
  private lastLoggedState: string = '';

  constructor(customConfig?: Partial<Config>) {
    super();
    this.config = GetConfig(customConfig);
    
    // Initialize state machine
    this.stateMachine = createActor(UIStateMachine);
    this.stateMachine.start();
    
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
    this.setupStateMachineListeners();
  }

  private setupStateMachineListeners(): void {
    // Subscribe to state machine changes - but filter out spam
    this.stateMachine.subscribe((state) => {
      const currentState = String(state.value);
      
      // Only log if state actually changed
      if (currentState !== this.lastLoggedState) {
        console.log('[State Machine] State changed:', currentState);
        console.log('[State Machine] Context:', state.context);
        this.lastLoggedState = currentState;
      }
    });
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
    
    // Setup symbol event handlers for state machine (ONLY for viewer symbols)
    this.setupSymbolEventHandlers(symbol);
    
    this.viewerSymbols[col] = symbol;
    this.viewerBoard.addChild(symbol);
  }

  private setupSymbolEventHandlers(symbol: Symbol): void {
    // Handle symbol drag start
    symbol.on('dragStart', (symbolInstance: Symbol) => {
      console.log('[Symbol Event] Drag Start');
      this.stateMachine.send({
        type: 'symboldragstart',
        symbol: symbolInstance
      });
    });

    // Handle symbol drag move - REMOVE this to reduce spam
    // symbol.on('dragMove', (symbolInstance: Symbol, position: { x: number; y: number }) => {
    //   this.stateMachine.send({
    //     type: 'symboldragmove',
    //     position
    //   });
    // });

    // Handle symbol drag end
    symbol.on('dragEnd', (symbolInstance: Symbol, position: { x: number; y: number }) => {
      console.log('[Symbol Event] Drag End');
      this.handleSymbolDrop(symbolInstance, position);
      this.stateMachine.send({
        type: 'symboldragend',
        symbol: symbolInstance,
        position
      });
    });

    // Handle symbol hover start
    symbol.on('hoverStart', (symbolInstance: Symbol) => {
      console.log('[Symbol Event] Hover Start');
      this.stateMachine.send({
        type: 'symbolhoverstart',
        symbol: symbolInstance
      });
    });

    // Handle symbol hover end
    symbol.on('hoverEnd', (symbolInstance: Symbol) => {
      console.log('[Symbol Event] Hover End');
      this.stateMachine.send({
        type: 'symbolhoverend',
        symbol: symbolInstance
      });
    });
  }

  private handleSymbolDrop(symbol: Symbol, globalPosition: { x: number; y: number }): void {
    // Convert global position to main board local position
    const localPosition = this.mainBoard.toLocal(globalPosition, this.parent);
    const gridPosition = this.mainBoard.getGridPositionFromCoords(localPosition.x, localPosition.y);
    
    // Check if drop position is valid (within board bounds)
    if (this.isValidDropPosition(gridPosition.row, gridPosition.col)) {
      // Check if the cell is empty
      if (!this.mainSymbols[gridPosition.row][gridPosition.col]) {
        // Place symbol on main board
        this.placeSymbolOnMainBoard(symbol, gridPosition.row, gridPosition.col);
      } else {
        // Return symbol to original position
        symbol.returnToOriginalPosition();
      }
    } else {
      // Return symbol to original position
      symbol.returnToOriginalPosition();
    }
  }

  private isValidDropPosition(row: number, col: number): boolean {
    return row >= 0 && row < this.config.rows && col >= 0 && col < this.config.columns;
  }

  private placeSymbolOnMainBoard(symbol: Symbol, row: number, col: number): void {
    const cellPosition = this.mainBoard.getCellPosition(row, col);
    
    // Convert from main board local coordinates to symbol's parent coordinates
    const globalPos = this.mainBoard.toGlobal(cellPosition);
    const finalPos = symbol.parent!.toLocal(globalPos);
    
    // Animate symbol to final position
    animate(symbol, { x: finalPos.x, y: finalPos.y }, { duration: 0.3 }).then(() => {
      // Remove from viewer board and add to main board
      this.viewerBoard.removeChild(symbol);
      this.mainBoard.addChild(symbol);
      
      // Update symbol position and board reference
      symbol.x = cellPosition.x;
      symbol.y = cellPosition.y;
      symbol.setBoardPosition(row, col);
      symbol.snapToPosition(cellPosition.x, cellPosition.y);
      
      // Update main symbols array
      this.mainSymbols[row][col] = symbol;
      
      // Remove from viewer symbols array and create new symbol
      const viewerIndex = this.viewerSymbols.indexOf(symbol);
      if (viewerIndex !== -1) {
        this.createViewerBoardSymbolAt(viewerIndex);
        this.animateViewerBoardSymbolDrop(this.viewerSymbols[viewerIndex], viewerIndex);
      }
    });
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
          symbol.setupInteractivity();
          // Only setup event handlers once per symbol
          if (!symbol.hasEventListeners) {
            this.setupSymbolEventHandlers(symbol);
            symbol.hasEventListeners = true;
          }
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

  public getStateMachine() {
    return this.stateMachine;
  }
}
