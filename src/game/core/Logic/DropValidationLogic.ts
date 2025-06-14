import { ILogic, ILogicContext } from "./ILogic";

export class DropValidationLogic implements ILogic {
  
  async execute(context: any, logicContext: ILogicContext): Promise<void> {
    const { draggedSymbol } = context;
    
    if (!draggedSymbol) {
      console.log('[DropLogic] No dragged symbol found');
      return;
    }
    
    const symbolGlobalPosition = draggedSymbol.parent.toGlobal({ x: draggedSymbol.x, y: draggedSymbol.y });
    const isCollidingWithMainBoard = this.checkCollisionWithMainBoard(
      symbolGlobalPosition, 
      logicContext
    );
    
    if (!isCollidingWithMainBoard) {
      await this.returnSymbolToOriginalPosition(draggedSymbol);
    } else {
      // TODO: Burada hücre kontrolü ve yer değiştirme logic'i gelecek
      await this.returnSymbolToOriginalPosition(draggedSymbol); // Şimdilik geri döndür
    }
  }
  
  private checkCollisionWithMainBoard(
    symbolGlobalPosition: { x: number; y: number }, 
    logicContext: ILogicContext
  ): boolean {
    
    // Main board bounds kontrolü (global koordinatlarda)
    const mainBoard = logicContext.mainBoard;
    const mainBoardGlobalBounds = mainBoard.toGlobal({ x: 0, y: 0 });
    const mainBoardBounds = {
      x: mainBoardGlobalBounds.x,
      y: mainBoardGlobalBounds.y,
      width: mainBoard.width,
      height: mainBoard.height
    };
    
    // Symbol main board alanı içinde mi?
    const isInMainBoardArea = (
      symbolGlobalPosition.x >= mainBoardBounds.x &&
      symbolGlobalPosition.x <= mainBoardBounds.x + mainBoardBounds.width &&
      symbolGlobalPosition.y >= mainBoardBounds.y &&
      symbolGlobalPosition.y <= mainBoardBounds.y + mainBoardBounds.height
    );    
    return isInMainBoardArea;
  }
  
  private async returnSymbolToOriginalPosition(symbol: any): Promise<void> {
    if (symbol && typeof symbol.returnToOriginalPosition === 'function') {
      symbol.returnToOriginalPosition();
    } else {
      console.error('[DropLogic] Symbol does not have returnToOriginalPosition method');
    }
  }
}
