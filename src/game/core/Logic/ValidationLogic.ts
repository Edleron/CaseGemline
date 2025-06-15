import { ILogic, ILogicContext } from "./ILogic";
import { animate } from "motion";
import { Store } from "../../Store/Store";
import { MatchRules, MatchResult } from "../Rules/MatchRules";
import { MatchingLogic } from "./MatchingLogic";

export class ValidationLogic implements ILogic {
  private matchingLogic: MatchingLogic;
  private wouldHaveMatch: MatchResult | null = null;
  
  constructor() {
    this.matchingLogic = new MatchingLogic();
  }
  
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
        this.wouldHaveMatch = this.checkPotentialMatch(draggedSymbol, targetSymbol, gridPosition, logicContext);
        
        if (this.wouldHaveMatch.hasMatches) {
          console.log('🎉 MATCH BULUNABİLİR - Swap yapılıyor');
          await this.swapSymbols(draggedSymbol, targetSymbol, gridPosition, logicContext);
          
          // Hamle sayısını artır
          Store.getState().incrementMoveCount();
          console.log('Hamle sayısı:', Store.getState().moveCount);
          
        } else {
          console.log('❌ Match bulunamaz - Swap yapılmıyor');
          
          // Başarısız hamle sayısını artır
          Store.getState().incrementMoveFailedCount();
          this.checkFailedMoveLimit();
          
          await this.returnSymbolToOriginalPosition(draggedSymbol);
        }
      } else {
        await this.returnSymbolToOriginalPosition(draggedSymbol);
      }
    }
  }
  
  private async processMatches(matchResult: MatchResult, logicContext: ILogicContext): Promise<void> {
    console.log('🔄 Match işlemi başlatılıyor...');
    
    // MatchingLogic'i çalıştır (Store methods'ları kaldırıldı)
    await this.matchingLogic.execute(matchResult, logicContext);
    
    console.log('✅ Match işlemi tamamlandı');
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

    if (this.wouldHaveMatch !== null && this.wouldHaveMatch.hasMatches) {
      await this.processMatches(this.wouldHaveMatch, logicContext);
    }
  }
  
  private checkPotentialMatch(
    dragSymbol: any,
    _targetSymbol: any, // Underscore prefix to indicate unused
    gridPosition: { row: number; col: number }, 
    logicContext: ILogicContext
  ): MatchResult {
    // Geçici olarak swap simülasyonu yap (sadece tip kontrolü için)
    const dragSymbolType = dragSymbol.getSymbolType();
    
    // Drag symbol'ün o pozisyona koyulduğunu varsayarak match kontrol et
    return this.checkMatchesAroundPositionWithSymbolType(gridPosition, dragSymbolType, logicContext);
  }
  
  private checkMatchesAroundPositionWithSymbolType(
    position: { row: number; col: number }, 
    symbolType: string,
    logicContext: ILogicContext
  ): MatchResult {
    const matches: any[] = [];
    const allMatchedPositions: { row: number; col: number }[] = [];
    
    // Yatay match kontrolü
    const horizontalMatch = this.checkHorizontalMatchWithType(position, symbolType, logicContext);
    if (horizontalMatch) {
      matches.push(horizontalMatch);
      allMatchedPositions.push(...horizontalMatch.positions);
    }
    
    // Dikey match kontrolü
    const verticalMatch = this.checkVerticalMatchWithType(position, symbolType, logicContext);
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
  
  private checkHorizontalMatchWithType(
    position: { row: number; col: number }, 
    symbolType: string,
    logicContext: ILogicContext
  ): any | null {
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
  
  private checkVerticalMatchWithType(
    position: { row: number; col: number }, 
    symbolType: string,
    logicContext: ILogicContext
  ): any | null {
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

  private checkFailedMoveLimit(): void {
    const failedCount = Store.getState().moveFailedCount;
    
    if (failedCount % 2 === 0) {
      console.log('🚨 UYARI: 2 başarısız hamle yapıldı! İpucu gösteriliyor...');
      this.showHint();
    } else {
      console.log(`Başarısız hamle sayısı: ${failedCount}`);
    }
  }
  
  private showHint(): void {
    const logicContext = Store.getState().logicContext;
    if (!logicContext) return;
    
    const allHints = [];
    
    // Tüm mümkün hint'leri topla
    for (let row = 0; row < logicContext.config.rows; row++) {
      for (let col = 0; col < logicContext.config.columns; col++) {
        const symbol = logicContext.mainSymbols[row]?.[col];
        if (!symbol) continue;
        
        // Yatay kontrol
        const horizontalGroup = this.getHorizontalGroup(row, col, logicContext);
        if (horizontalGroup.length >= MatchRules.MIN_HINT_GROUP_COUNT) {
          allHints.push({
            type: 'horizontal',
            group: horizontalGroup,
            startPosition: { row, col }
          });
        }
        
        // Dikey kontrol
        const verticalGroup = this.getVerticalGroup(row, col, logicContext);
        if (verticalGroup.length >= MatchRules.MIN_HINT_GROUP_COUNT) {
          allHints.push({
            type: 'vertical',
            group: verticalGroup,
            startPosition: { row, col }
          });
        }
      }
    }
    
    // Eğer hint varsa rastgele birini seç
    if (allHints.length > 0) {
      const randomIndex = Math.floor(Math.random() * allHints.length);
      const selectedHint = allHints[randomIndex];
      
      this.highlightGroup(selectedHint.group, logicContext);
      console.log(`💡 İpucu: (${selectedHint.startPosition.row},${selectedHint.startPosition.col}) pozisyonunda ${selectedHint.group.length}'li ${selectedHint.type} grup var`);
    } else {
      console.log('😞 Hiç hint bulunamadı');
    }
  }
  
  private getHorizontalGroup(row: number, col: number, logicContext: ILogicContext): {row: number, col: number}[] {
    const symbol = logicContext.mainSymbols[row]?.[col];
    if (!symbol) return [];
    
    const group = [{ row, col }];
    const symbolType = symbol.getSymbolType();
    
    // Sağa doğru grup elemanlarını topla
    for (let c = col + 1; c < logicContext.config.columns; c++) {
      const rightSymbol = logicContext.mainSymbols[row]?.[c];
      if (rightSymbol && MatchRules.isValidMatch(symbolType, rightSymbol.getSymbolType())) {
        group.push({ row, col: c });
      } else break;
    }
    
    return group;
  }
  
  private getVerticalGroup(row: number, col: number, logicContext: ILogicContext): {row: number, col: number}[] {
    const symbol = logicContext.mainSymbols[row]?.[col];
    if (!symbol) return [];
    
    const group = [{ row, col }];
    const symbolType = symbol.getSymbolType();
    
    // Aşağı doğru grup elemanlarını topla
    for (let r = row + 1; r < logicContext.config.rows; r++) {
      const downSymbol = logicContext.mainSymbols[r]?.[col];
      if (downSymbol && MatchRules.isValidMatch(symbolType, downSymbol.getSymbolType())) {
        group.push({ row: r, col });
      } else break;
    }
    
    return group;
  }
  
  private highlightGroup(group: {row: number, col: number}[], logicContext: ILogicContext): void {
    for (const pos of group) {
      const symbol = logicContext.mainSymbols[pos.row]?.[pos.col];
      if (symbol) {
        symbol.alpha = 0.5; // Tüm grubu highlight et
      }

      setTimeout(() => {
        symbol.alpha = 1; // 1 saniye sonra normalleştir
      }, 1000);
    }
  }
}