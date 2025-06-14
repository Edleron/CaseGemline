import { ILogic, ILogicContext } from "./ILogic";
import { animate } from "motion";
import { Store } from "../../Store/Store";
import { MatchRules, MatchResult } from "../Rules/MatchRules";

export class ValidationLogic implements ILogic {
  
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
    dragSymbol: any, 
    targetSymbol: any, 
    gridPosition: { row: number; col: number },
    logicContext: ILogicContext
  ): Promise<void> {    
    // Store target's original index and name BEFORE changing z-index
    const targetOriginalIndex = targetSymbol.parent.getChildIndex(targetSymbol);
    const targetOriginalName = targetSymbol.name;
    const dragOriginalName = dragSymbol.name;
    
    // Bring target symbol to front for proper z-index during animation
    targetSymbol.parent.setChildIndex(targetSymbol, targetSymbol.parent.children.length - 1);
    
    // Execute both animations in parallel
    await Promise.all([
      this.moveDragSymbolToMainBoard(dragSymbol, gridPosition, logicContext, targetOriginalIndex, targetOriginalName),
      this.moveTargetSymbolToViewerBoard(targetSymbol, dragSymbol, logicContext, dragOriginalName)
    ]);
    
    // Update data structures
    this.updateSymbolArrays(dragSymbol, targetSymbol, gridPosition, logicContext);

    // Update interactivity
    this.updateSymbolInteractivity(dragSymbol, targetSymbol, logicContext);
    
    // Check for matches after swap
    const matchResult = this.checkMatchesAroundPosition(gridPosition, logicContext);
    if (matchResult.hasMatches) {
      console.log('🎉 MATCH BULUNDU!', matchResult.matches.length, 'adet match');
      matchResult.matches.forEach((match, index) => {
        console.log(`Match ${index + 1}:`, match.direction, match.positions.length, 'symbol', match.symbolType);
        console.log('Pozisyonlar:', match.positions.map(pos => `(${pos.row},${pos.col})`).join(' '));
      });
      console.log('Tüm match pozisyonları:', matchResult.allMatchedPositions.map(pos => `(${pos.row},${pos.col})`).join(' '));
    } else {
      console.log('❌ Match bulunamadı');
    }
  }
  
  private checkMatchesAroundPosition(position: { row: number; col: number }, logicContext: ILogicContext): MatchResult {
    const matches: any[] = [];
    const allMatchedPositions: { row: number; col: number }[] = [];
    
    // Yatay match kontrolü
    const horizontalMatch = this.checkHorizontalMatch(position, logicContext);
    if (horizontalMatch) {
      matches.push(horizontalMatch);
      allMatchedPositions.push(...horizontalMatch.positions);
    }
    
    // Dikey match kontrolü
    const verticalMatch = this.checkVerticalMatch(position, logicContext);
    if (verticalMatch) {
      matches.push(verticalMatch);
      allMatchedPositions.push(...verticalMatch.positions);
    }
    
    return {
      hasMatches: matches.length > 0,
      matches,
      allMatchedPositions
    };
  }
  
  private checkHorizontalMatch(position: { row: number; col: number }, logicContext: ILogicContext): any | null {
    const centerSymbol = logicContext.mainSymbols[position.row]?.[position.col];
    if (!MatchRules.isValidSymbol(centerSymbol)) return null;
    
    const symbolType = centerSymbol.getSymbolType();
    const matchPositions: { row: number; col: number }[] = [position];
    
    // Sola doğru kontrol et
    for (let col = position.col - 1; col >= 0; col--) {
      if (!MatchRules.isValidPosition(position.row, col, logicContext.config.rows, logicContext.config.columns)) break;
      
      const leftSymbol = logicContext.mainSymbols[position.row]?.[col];
      if (!MatchRules.isValidSymbol(leftSymbol) || !MatchRules.isValidMatch(symbolType, leftSymbol.getSymbolType())) break;
      
      matchPositions.unshift({ row: position.row, col });
    }
    
    // Sağa doğru kontrol et
    for (let col = position.col + 1; col < logicContext.config.columns; col++) {
      if (!MatchRules.isValidPosition(position.row, col, logicContext.config.rows, logicContext.config.columns)) break;
      
      const rightSymbol = logicContext.mainSymbols[position.row]?.[col];
      if (!MatchRules.isValidSymbol(rightSymbol) || !MatchRules.isValidMatch(symbolType, rightSymbol.getSymbolType())) break;
      
      matchPositions.push({ row: position.row, col });
    }
    
    // 3+ match var mı kontrol et
    if (MatchRules.hasMinimumCount(matchPositions.length)) {
      return {
        positions: matchPositions,
        symbolType,
        direction: 'horizontal'
      };
    }
    
    return null;
  }
  
  private checkVerticalMatch(position: { row: number; col: number }, logicContext: ILogicContext): any | null {
    const centerSymbol = logicContext.mainSymbols[position.row]?.[position.col];
    if (!MatchRules.isValidSymbol(centerSymbol)) return null;
    
    const symbolType = centerSymbol.getSymbolType();
    const matchPositions: { row: number; col: number }[] = [position];
    
    // Yukarı doğru kontrol et
    for (let row = position.row - 1; row >= 0; row--) {
      if (!MatchRules.isValidPosition(row, position.col, logicContext.config.rows, logicContext.config.columns)) break;
      
      const upSymbol = logicContext.mainSymbols[row]?.[position.col];
      if (!MatchRules.isValidSymbol(upSymbol) || !MatchRules.isValidMatch(symbolType, upSymbol.getSymbolType())) break;
      
      matchPositions.unshift({ row, col: position.col });
    }
    
    // Aşağı doğru kontrol et
    for (let row = position.row + 1; row < logicContext.config.rows; row++) {
      if (!MatchRules.isValidPosition(row, position.col, logicContext.config.rows, logicContext.config.columns)) break;
      
      const downSymbol = logicContext.mainSymbols[row]?.[position.col];
      if (!MatchRules.isValidSymbol(downSymbol) || !MatchRules.isValidMatch(symbolType, downSymbol.getSymbolType())) break;
      
      matchPositions.push({ row, col: position.col });
    }
    
    // 3+ match var mı kontrol et
    if (MatchRules.hasMinimumCount(matchPositions.length)) {
      return {
        positions: matchPositions,
        symbolType,
        direction: 'vertical'
      };
    }
    
    return null;
  }

  private async moveDragSymbolToMainBoard(
    dragSymbol: any, 
    gridPosition: { row: number; col: number }, 
    logicContext: ILogicContext,
    targetOriginalIndex: number,
    targetOriginalName: string
  ): Promise<void> {
    const mainBoardCellPos = logicContext.mainBoard.getCellPosition(gridPosition.row, gridPosition.col);
    const mainBoardGlobalPos = logicContext.mainBoard.toGlobal(mainBoardCellPos);
    const finalPos = dragSymbol.parent.toLocal(mainBoardGlobalPos);
    
    // Animate to final position
    await dragSymbol.position.set(finalPos.x, finalPos.y);
    
    // Move to main container and set final position
    logicContext.viewerContainer.removeChild(dragSymbol);
    logicContext.mainContainer.addChild(dragSymbol);
    
    // Set dragSymbol to target's original index position and name
    logicContext.mainContainer.setChildIndex(dragSymbol, targetOriginalIndex);
    dragSymbol.name = targetOriginalName;
    
    dragSymbol.x = mainBoardCellPos.x;
    dragSymbol.y = mainBoardCellPos.y;
    dragSymbol.setBoardPosition(gridPosition.row, gridPosition.col);
    dragSymbol.snapToPosition(mainBoardCellPos.x, mainBoardCellPos.y);
  }
  
  private async moveTargetSymbolToViewerBoard(
    targetSymbol: any, 
    dragSymbol: any, 
    logicContext: ILogicContext,
    dragOriginalName: string
  ): Promise<void> {
    const viewerIndex = logicContext.viewerSymbols.indexOf(dragSymbol);
    const viewerCellPos = logicContext.viewerBoard.getCellPosition(0, viewerIndex);
    const viewerBoardGlobalPos = logicContext.viewerBoard.toGlobal(viewerCellPos);
    const finalPos = targetSymbol.parent.toLocal(viewerBoardGlobalPos);
    
    console.log(targetSymbol.position, finalPos, viewerBoardGlobalPos, viewerCellPos, viewerIndex);
    // Animate to final position

    // TODO -> viewer 0 al, 2 kere 4 - 0 gönder, hatayı göreceksin, target position başlangıç noktası hatalı !
    await animate(targetSymbol, {
      x: finalPos.x,
      y: finalPos.y
    }, { duration: 0.4 });
    
    // Move to viewer container and set final position
    logicContext.mainContainer.removeChild(targetSymbol);
    logicContext.viewerContainer.addChild(targetSymbol);
    
    // Set target symbol's name to drag symbol's original name
    targetSymbol.name = dragOriginalName;
    
    targetSymbol.x = viewerCellPos.x;
    targetSymbol.y = viewerCellPos.y;
    targetSymbol.removeBoardPosition();
    targetSymbol.snapToPosition(viewerCellPos.x, viewerCellPos.y);
    targetSymbol.originalPosition = { x: viewerCellPos.x, y: viewerCellPos.y };
  }
  
  private updateSymbolArrays(
    dragSymbol: any, 
    targetSymbol: any, 
    gridPosition: { row: number; col: number }, 
    logicContext: ILogicContext
  ): void {
    const viewerIndex = logicContext.viewerSymbols.indexOf(dragSymbol);
    
    logicContext.mainSymbols[gridPosition.row][gridPosition.col] = dragSymbol;
    logicContext.viewerSymbols[viewerIndex] = targetSymbol;

    // IMPORTANT: Update store context after symbol arrays are modified
    const currentStoreState = Store.getState();
    const updatedContext = {
      ...currentStoreState.logicContext,
      mainSymbols: logicContext.mainSymbols,
      viewerSymbols: logicContext.viewerSymbols
    };
    
    Store.getState().setLogicContext(updatedContext);
  }
  
  private updateSymbolInteractivity(
    newMainBoardSymbol: any,
    newViewerSymbol: any,
    logicContext: ILogicContext
  ): void {
    // Remove event handlers from symbol that moved to main board using Core's method
    if (newMainBoardSymbol && newMainBoardSymbol.hasEventListeners) {
      newMainBoardSymbol.destroyInteractive();
      logicContext.removeSymbolEventHandlers(newMainBoardSymbol);
    }
    
    // Setup event handlers for symbol that moved to viewer board using Core's method
    if (newViewerSymbol && !newViewerSymbol.hasEventListeners) {
      newViewerSymbol.setupInteractivity();
      logicContext.setupSymbolEventHandlers(newViewerSymbol);
      newViewerSymbol.hasEventListeners = true;
    }
  }
}
