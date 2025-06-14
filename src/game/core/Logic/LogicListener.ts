import { Actor } from 'xstate';
import { ILogicContext } from './ILogic';
import { DropValidationLogic } from './DropValidationLogic';

export class LogicListener {
  private stateMachine: Actor<any>;
  private logicContext: ILogicContext;
  private dropValidationLogic: DropValidationLogic;
  private lastState: string = '';
  private lastDraggedSymbol: any = null; // Son dragged symbol'ü sakla
  
  constructor(stateMachine: Actor<any>, logicContext: ILogicContext) {
    this.stateMachine = stateMachine;
    this.logicContext = logicContext;
    this.dropValidationLogic = new DropValidationLogic();
    this.setupListeners();
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
          this.lastDraggedSymbol = context.draggedSymbol;
          this.handleDraggingStarted(context);
        }
        break;
        
      case 'idle':
        if (this.lastState === 'dragging' && this.lastDraggedSymbol) {
          await this.handleDropCompleted();
          this.lastDraggedSymbol = null;
        }
        break;
        
      case 'hovering':
        this.handleHoveringStarted(context);
        break;
    }
  }
  
  private async handleDropCompleted(): Promise<void> {
    try {
      const mockContext = { draggedSymbol: this.lastDraggedSymbol };
      await this.dropValidationLogic.execute(mockContext, this.logicContext);
    } catch (error) {
      console.error('[LogicListener] Error in drop validation logic:', error);
    }
  }
  
  private handleDraggingStarted(context: any): void {
    console.log('[LogicListener] Dragging started for symbol:', context.draggedSymbol);
  }
  
  private handleHoveringStarted(context: any): void {
    console.log('[LogicListener] Hovering started for symbol:', context.hoveredSymbol);
  }
}
