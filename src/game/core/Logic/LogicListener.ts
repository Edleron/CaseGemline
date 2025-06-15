import { Actor } from 'xstate';
import { ILogicContext } from './ILogic';
import { ValidationLogic } from './ValidationLogic';
import { Store } from '../../Store/Store';

export class LogicListener {
  private stateMachine: Actor<any>;
  private validationLogic: ValidationLogic;
  private lastState: string = '';
  private unsubscribe: () => void;
  
  constructor(stateMachine: Actor<any>, _initialContext: ILogicContext) {
    this.stateMachine = stateMachine;
    this.validationLogic = new ValidationLogic();
    this.setupListeners();
    
    // Subscribe to store changes for logic context updates
    this.unsubscribe = Store.subscribe((state, previousState) => {
      // Check if logic context changed
      if (state.logicContext !== previousState.logicContext) {
        console.log('[LogicListener] Context updated from store');
        // Context is now automatically available from store when needed
      }
    });
  }
  
  public clearStaleReferences(): void {
    Store.getState().clearLogicState();
    this.lastState = '';
  }
  
  public updateContext(newContext: ILogicContext): void {
    // No longer needed - store handles this automatically
    Store.getState().setLogicContext(newContext);
  }
  
  private setupListeners(): void {
    this.stateMachine.subscribe((state) => {
      const currentState = String(state.value);
      const context = state.context;
      
      if (currentState !== this.lastState) {
        this.handleStateChange(currentState, context);
        this.lastState = currentState;
      }
    });
  }
  
  private async handleStateChange(currentState: string, context: any): Promise<void> {
    switch (currentState) {
      case 'dragging':
        if (context.draggedSymbol) {
          Store.getState().setDraggedSymbol(context.draggedSymbol);
          this.handleDraggingStarted(context);
        }
        break;
        
      case 'idle':
        if (this.lastState === 'dragging') {
          await this.handleDropCompleted();
          Store.getState().clearLogicState();
        } else if (this.lastState === 'matching') {
          console.log('[LogicListener] Match işlemi tamamlandı, idle durumuna geçildi');
        }
        break;
        
      case 'hovering':
        this.handleHoveringStarted(context);
        break;
        
      case 'matching':
        this.handleMatchingStarted(context);
        break;
    }
  }
  
  private async handleDropCompleted(): Promise<void> {
    try {
      const storeState = Store.getState();
      const draggedSymbol = storeState.draggedSymbol;
      const logicContext = storeState.logicContext; // Her zaman güncel context
      
      if (!draggedSymbol || !logicContext) {
        return;
      }
      
      storeState.setSwapInProgress(true);
      
      const mockContext = { draggedSymbol };
      // ValidationLogic içinde store güncellendiği için context her zaman fresh
      await this.validationLogic.execute(mockContext, logicContext);
      
      storeState.setSwapInProgress(false);
    } catch (error) {
      console.error('[LogicListener] Error in drop validation logic:', error);
      Store.getState().setSwapInProgress(false);
    }
  }
  
  private handleDraggingStarted(_context: any): void {
    // console.log('[LogicListener] Dragging started');
  }
  
  private handleHoveringStarted(_context: any): void {
    // console.log('[LogicListener] Hovering started');
  }
  
  private handleMatchingStarted(context: any): void {
    console.log('[LogicListener] Match işlemi başlatıldı');
    if (context.pendingMatches) {
      console.log('[LogicListener] Pending matches:', context.pendingMatches);
    }
  }
  
  public destroy(): void {
    this.unsubscribe();
  }
}
