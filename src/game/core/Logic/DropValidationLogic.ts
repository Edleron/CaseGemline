import { ILogic, ILogicContext } from "./ILogic";
import { animate } from "motion";

export class DropValidationLogic implements ILogic {
  
  async execute(context: any, logicContext: ILogicContext): Promise<void> {
    const { draggedSymbol } = context;
    
    if (!draggedSymbol) {
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

      const mainBoardLocalPos = logicContext.mainBoard.toLocal(symbolGlobalPosition);
      const gridPosition = logicContext.mainBoard.getGridPositionFromCoords(mainBoardLocalPos.x, mainBoardLocalPos.y);

      const targetSymbol = logicContext.mainSymbols[gridPosition.row]?.[gridPosition.col];
      console.log(mainBoardLocalPos, gridPosition, targetSymbol);

      if (targetSymbol) {
        await this.swapSymbols(draggedSymbol, targetSymbol, gridPosition, logicContext);
      } else {
        await this.returnSymbolToOriginalPosition(draggedSymbol);
      }
    }
  }
  
  private checkCollisionWithMainBoard(
    symbolGlobalPosition: { x: number; y: number }, 
    logicContext: ILogicContext
  ): boolean {
    
    const mainBoard = logicContext.mainBoard;
    const mainBoardGlobalBounds = mainBoard.toGlobal({ x: 0, y: 0 });
    const mainBoardBounds = {
      x: mainBoardGlobalBounds.x,
      y: mainBoardGlobalBounds.y,
      width: mainBoard.width,
      height: mainBoard.height
    };

    
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
  
  private async swapSymbols(
    viewerSymbol: any, 
    mainBoardSymbol: any, 
    targetGridPosition: { row: number; col: number },
    logicContext: ILogicContext
  ): Promise<void> {    
    // Bring main board symbol to front for proper z-index during animation
    if (mainBoardSymbol.parent) {
      mainBoardSymbol.parent.setChildIndex(mainBoardSymbol, mainBoardSymbol.parent.children.length - 1);
    }
    
    // Get positions
    const viewerOriginalPos = viewerSymbol.originalPosition;
    const mainBoardCellPos = logicContext.mainBoard.getCellPosition(targetGridPosition.row, targetGridPosition.col);
    
    const viewerIndex = logicContext.viewerSymbols.indexOf(viewerSymbol);
    const viewerCellPos = logicContext.viewerBoard.getCellPosition(0, viewerIndex);
    
    const mainBoardGlobalPos = logicContext.mainBoard.toGlobal(mainBoardCellPos);
    const viewerSymbolFinalPos = viewerSymbol.parent.toLocal(mainBoardGlobalPos);
    

    const viewerBoardGlobalPos = logicContext.viewerBoard.toGlobal(viewerCellPos);
    const mainBoardSymbolFinalPos = mainBoardSymbol.parent.toLocal(viewerBoardGlobalPos);
    
    
    const viewerAnimation = animate(viewerSymbol, {
      x: viewerSymbolFinalPos.x,
      y: viewerSymbolFinalPos.y
    }, { duration: 0 });
    
    
    const mainBoardAnimation = animate(mainBoardSymbol, {
      x: mainBoardSymbolFinalPos.x,
      y: mainBoardSymbolFinalPos.y
    }, { duration: 0.4 });
    
    await Promise.all([viewerAnimation, mainBoardAnimation]);
    
    logicContext.viewerContainer.removeChild(viewerSymbol);
    logicContext.mainContainer.removeChild(mainBoardSymbol);
    
    logicContext.mainContainer.addChild(viewerSymbol);
    logicContext.viewerContainer.addChild(mainBoardSymbol);
    
    viewerSymbol.x = mainBoardCellPos.x;
    viewerSymbol.y = mainBoardCellPos.y;
    viewerSymbol.setBoardPosition(targetGridPosition.row, targetGridPosition.col);
    viewerSymbol.snapToPosition(mainBoardCellPos.x, mainBoardCellPos.y);
    
    mainBoardSymbol.x = viewerCellPos.x;
    mainBoardSymbol.y = viewerCellPos.y;
    mainBoardSymbol.removeBoardPosition();
    mainBoardSymbol.snapToPosition(viewerCellPos.x, viewerCellPos.y);
    mainBoardSymbol.originalPosition = { x: viewerCellPos.x, y: viewerCellPos.y };
    
    logicContext.mainSymbols[targetGridPosition.row][targetGridPosition.col] = viewerSymbol;
    logicContext.viewerSymbols[viewerIndex] = mainBoardSymbol;
  }
}
