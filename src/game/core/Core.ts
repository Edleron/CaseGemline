import { Container } from "pixi.js";
import { createActor } from "xstate";
import { Board } from "./Board/Board";
import { Symbol } from "./Symbol/Symbol";
import { Config, GetConfig } from "./Constants/Configt";
import { UIStateMachine } from "./State/Machine";
import { animate } from "motion";
import { LogicListener } from "./Logic/LogicListener";
import { ILogicContext } from "./Logic/ILogic";
import { Store } from "../Store/Store";

export class Core extends Container {
  private config: Config;
  private mainContainer: Container;
  private viewerContainer: Container;
  private mainBoard: Board;
  private viewerBoard: Board;
  private mainSymbols: Symbol[][] = [];
  private viewerSymbols: Symbol[] = [];
  private stateMachine: ReturnType<typeof createActor>;
  private lastLoggedState: string = '';
  private isCoreReady: boolean = false;
  private logicListener: LogicListener;

  constructor(customConfig?: Partial<Config>) {
    super();
    this.config = GetConfig(customConfig);
    
    // Initialize state machine
    this.stateMachine = createActor(UIStateMachine);
    this.stateMachine.start();
    
    // Store state machine reference in store for global access
    Store.getState().setStateMachine(this.stateMachine);
    
    // Create main board
    this.mainBoard = new Board(this.config);
    this.mainContainer = new Container();
    
    // Create viewer board (1 row, 3 columns)
    const viewerConfig = { ...this.config, rows: 1, columns: 3 };
    this.viewerBoard = new Board(viewerConfig);
    this.viewerContainer = new Container();
    
    // Position viewer board below main board
    this.viewerBoard.x = 128
    this.viewerBoard.y = this.mainBoard.height + 25;
    this.viewerContainer.x = 128;
    this.viewerContainer.y = this.mainBoard.height + 25;
    
    this.addChild(this.mainBoard);
    this.addChild(this.viewerBoard);
    this.addChild(this.mainContainer);
    this.addChild(this.viewerContainer);
    this.initializeSymbols();
    this.setupStateMachineListeners();

    // Initialize logic listener after boards are created
    this.logicListener = new LogicListener(this.stateMachine, this.createLogicContext());
    
    // Initialize store with logic context
    Store.getState().setLogicContext(this.createLogicContext());
  }

  public createLogicContext(): ILogicContext {
    const context = {
      mainBoard: this.mainBoard,
      viewerBoard: this.viewerBoard,
      mainContainer: this.mainContainer,
      viewerContainer: this.viewerContainer,
      mainSymbols: this.mainSymbols,
      viewerSymbols: this.viewerSymbols,
      config: this.config,
      setupSymbolEventHandlers: this.setupSymbolEventHandlers.bind(this),
      removeSymbolEventHandlers: this.removeSymbolEventHandlers.bind(this)
    };
    
    // Update store whenever context is created
    Store.getState().setLogicContext(context);
    
    return context;
  }

  private setupStateMachineListeners(): void {
    // Subscribe to state machine changes - but filter out spam
    this.stateMachine.subscribe((state) => {
      const currentState = String(state.value);
      
      // Only log if state actually changed
      if (currentState !== this.lastLoggedState) {
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
    symbol.name = `mainSymbol-${row}-${col}`;
    
    this.mainSymbols[row][col] = symbol;
    this.mainContainer.addChild(symbol);
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
    symbol.name = `mainSymbol-${col}`;
    
    // DON'T setup symbol event handlers here - wait for drop animation to complete
    
    this.viewerSymbols[col] = symbol;
    this.viewerContainer.addChild(symbol);
  }

  private setupSymbolEventHandlers(symbol: Symbol): void {
    // Handle symbol drag start
    symbol.on('dragStart', (symbolInstance: Symbol) => {
      this.stateMachine.send({
        type: 'symboldragstart',
        symbol: symbolInstance
      });
    });

    // Handle symbol drag end
    symbol.on('dragEnd', (symbolInstance: Symbol, position: { x: number; y: number }) => {
      // this.handleSymbolDrop(symbolInstance, position);
      this.stateMachine.send({
        type: 'symboldragend',
        symbol: symbolInstance,
        position
      });
    });

    // Handle symbol hover start
    symbol.on('hoverStart', (symbolInstance: Symbol) => {
      this.stateMachine.send({
        type: 'symbolhoverstart',
        symbol: symbolInstance
      });
    });

    // Handle symbol hover end
    symbol.on('hoverEnd', (symbolInstance: Symbol) => {
      this.stateMachine.send({
        type: 'symbolhoverend',
        symbol: symbolInstance
      });
    });
  }

  private removeSymbolEventHandlers(symbol: Symbol): void {
    symbol.off('dragStart');
    symbol.off('dragEnd');
    symbol.off('hoverStart');
    symbol.off('hoverEnd');
    symbol.hasEventListeners = false;
  }


  private onSymbolMainBoardComplete(): void {
  }

  private onSymbolViewerBoardComplete(): void {
    this.isCoreReady = true;
  }

  public startDropAnimation(): void {
    this.isCoreReady = false; // Reset ready state

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
        // x: finalX, // X koordinatını da animate et
        y: finalY 
      },
      {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onComplete: () => {
          symbol.snapToPosition(finalX, finalY);
          symbol.setBoardPosition(row, col);
          this.onSymbolMainBoardComplete();
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
        // x: finalX, // X koordinatını da animate et
        y: finalY 
      },
      {
        duration,
        ease: [0.25, 0.46, 0.45, 0.94],
        onComplete: () => {
          symbol.snapToPosition(finalX, finalY);
          
          // Setup interactivity and event handlers ONLY after drop animation completes
          symbol.setupInteractivity();
          this.setupSymbolEventHandlers(symbol);
          symbol.hasEventListeners = true;
          this.onSymbolViewerBoardComplete();
        }
      }
    );
  }

  public getIsDropping(): boolean {
    return this.isCoreReady;
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

  public resetAndRedrop(): void {
    // Prevent multiple calls during dropping
    if (!this.isCoreReady) {
      console.warn('[Core] Already dropping symbols, ignoring reset request');
      return;
    }

    // Clear stale references in logic listener BEFORE destroying symbols
    this.logicListener.clearStaleReferences();

    // Clear existing symbols from main board
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.columns; col++) {
        const symbol = this.mainSymbols[row][col];
        if (symbol) {
          this.removeSymbolEventHandlers(symbol);
          this.mainContainer.removeChild(symbol);
          symbol.destroy();
          this.mainSymbols[row][col] = null as any;
        }
      }
    }

    // Clear existing symbols from viewer board
    for (let col = 0; col < 3; col++) {
      const symbol = this.viewerSymbols[col];
      if (symbol) {
        this.removeSymbolEventHandlers(symbol);
        this.viewerContainer.removeChild(symbol);
        symbol.destroy();
      }
    }
    this.viewerSymbols = [];

    // Reinitialize all symbols
    this.initializeSymbols();
    
    // Update store with new context instead of directly updating LogicListener
    this.createLogicContext();
    
    // Start drop animation
    this.startDropAnimation();
  }
}