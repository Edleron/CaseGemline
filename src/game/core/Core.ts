import { Container } from "pixi.js";
import { createActor } from "xstate";
import { Board } from "./Board/Board";
import { Symbol } from "./Symbol/Symbol";
import { Config, GetConfig } from "./Constants/Configt";
import { UIStateMachine } from "./State/Machine";
import { animate } from "motion";
import { LogicListener } from "./Logic/LogicListener";
import { ILogicContext } from "./Logic/ILogic";

export class Core extends Container {
  private config: Config;
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

    // Initialize logic listener after boards are created
    const logicContext: ILogicContext = {
      mainBoard: this.mainBoard,
      viewerBoard: this.viewerBoard,
      mainSymbols: this.mainSymbols,
      viewerSymbols: this.viewerSymbols,
      config: this.config
    };
    
    this.logicListener = new LogicListener(this.stateMachine, logicContext);
  }

  private setupStateMachineListeners(): void {
    // Subscribe to state machine changes - but filter out spam
    this.stateMachine.subscribe((state) => {
      const currentState = String(state.value);
      
      // Only log if state actually changed
      if (currentState !== this.lastLoggedState) {
        // console.log('[State Machine] State changed:', currentState);
        // console.log('[State Machine] Context:', state.context);
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
    
    // DON'T setup symbol event handlers here - wait for drop animation to complete
    
    this.viewerSymbols[col] = symbol;
    this.viewerBoard.addChild(symbol);
  }

  private setupSymbolEventHandlers(symbol: Symbol): void {
    // Handle symbol drag start
    symbol.on('dragStart', (symbolInstance: Symbol) => {
      // console.log('[Symbol Event] Drag Start');
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
      // console.log('[Symbol Event] Drag End');
      // this.handleSymbolDrop(symbolInstance, position);
      this.stateMachine.send({
        type: 'symboldragend',
        symbol: symbolInstance,
        position
      });
    });

    // Handle symbol hover start
    symbol.on('hoverStart', (symbolInstance: Symbol) => {
      // console.log('[Symbol Event] Hover Start');
      this.stateMachine.send({
        type: 'symbolhoverstart',
        symbol: symbolInstance
      });
    });

    // Handle symbol hover end
    symbol.on('hoverEnd', (symbolInstance: Symbol) => {
      // console.log('[Symbol Event] Hover End');
      this.stateMachine.send({
        type: 'symbolhoverend',
        symbol: symbolInstance
      });
    });
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
        // x: finalX, // TODO çift dupliacate için englendi
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
        // x: finalX, // TODO çift dupliacate için englendi
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

  private onSymbolMainBoardComplete(): void {
    // console.log('[Core] Main symbols dropped - ready for interaction');
  }

  private onSymbolViewerBoardComplete(): void {
    this.isCoreReady = true;
    // console.log('[Core] Viewer symbols dropped - ready for interaction');
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

    // Clear existing symbols from main board
    for (let row = 0; row < this.config.rows; row++) {
      for (let col = 0; col < this.config.columns; col++) {
        const symbol = this.mainSymbols[row][col];
        if (symbol) {
          this.mainBoard.removeChild(symbol);
          symbol.destroy();
          this.mainSymbols[row][col] = null as any;
        }
      }
    }

    // Clear existing symbols from viewer board
    for (let col = 0; col < 3; col++) {
      const symbol = this.viewerSymbols[col];
      if (symbol) {
        this.viewerBoard.removeChild(symbol);
        symbol.destroy();
      }
    }
    this.viewerSymbols = [];

    // Reinitialize all symbols
    this.initializeSymbols();
    
    // Start drop animation
    this.startDropAnimation();
  }
}