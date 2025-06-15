import { ILogic, ILogicContext } from "./ILogic";
import { animate } from "motion";
import { Store } from "../../Store/Store";
import { MatchRules, MatchResult } from "../Rules/MatchRules";
import { Symbol } from "../Symbol/Symbol";

export class MatchingLogic implements ILogic {
  
  async execute(matchResult: MatchResult, logicContext: ILogicContext): Promise<void> {
    if (!matchResult.hasMatches) {
      return;
    }

    // 1. Match'leri highlight et
    // await this.highlightMatches(matchResult, logicContext);
    
    // 2. Match'leri yok et
    await this.destroyMatches(matchResult, logicContext);
    
    // 3. Yeni symbol'leri düşür
    await this.dropNewSymbols(matchResult, logicContext);
    
    // 4. Store'u güncelle
    this.updateStore(matchResult, logicContext);
  }
  
  /*
  private async highlightMatches(matchResult: MatchResult, logicContext: ILogicContext): Promise<void> {    
    const highlightPromises: Promise<void>[] = [];
    
    for (const position of matchResult.allMatchedPositions) {
      const symbol = logicContext.mainSymbols[position.row]?.[position.col];
      if (symbol) {
        const highlightAnimation = animate(symbol, {
          alpha: [1, 0.3, 1, 0.3, 1]
        }, { 
          duration: 0.6,
          ease: "easeInOut"
        }).then(() => {
        });
        
        highlightPromises.push(highlightAnimation);
      }
    }
    
    await Promise.all(highlightPromises);
  }
  */
  
  private async destroyMatches(matchResult: MatchResult, logicContext: ILogicContext): Promise<void> {
    const destroyPromises: Promise<void>[] = [];
    for (const position of matchResult.allMatchedPositions) {
      const symbol = logicContext.mainSymbols[position.row]?.[position.col];
      if (symbol) {
        const destroyAnimation = animate(symbol, {
          alpha: 0,
        }, { 
          duration: 0.4,
          ease: "easeInOut"
        }).then(() => {
          logicContext.mainContainer.removeChild(symbol);
          symbol.destroy();
          logicContext.mainSymbols[position.row][position.col] = null as any;
        });
        
        destroyPromises.push(destroyAnimation);
      }
    }
    
    await Promise.all(destroyPromises);
  }
  
  private async dropNewSymbols(matchResult: MatchResult, logicContext: ILogicContext): Promise<void> {
    const columnsToProcess = new Set<number>();
    for (const position of matchResult.allMatchedPositions) {
      columnsToProcess.add(position.col);
    }
    
    const dropPromises: Promise<void>[] = [];
    
    for (const col of columnsToProcess) {
      const dropPromise = this.processColumn(col, logicContext);
      dropPromises.push(dropPromise);
    }
    
    await Promise.all(dropPromises);
  }
  
  private async processColumn(col: number, logicContext: ILogicContext): Promise<void> {
    const emptyPositions: number[] = [];
    
    for (let row = 0; row < logicContext.config.rows; row++) {
      if (!logicContext.mainSymbols[row][col]) {
        emptyPositions.push(row);
      }
    }
    
    if (emptyPositions.length === 0) return;
    await this.moveExistingSymbolsDown(col, emptyPositions, logicContext);
    await this.createAndDropNewSymbols(col, emptyPositions.length, logicContext);
  }
  
  private async moveExistingSymbolsDown(col: number, emptyPositions: number[], logicContext: ILogicContext): Promise<void> {
    const movePromises: Promise<void>[] = [];
    for (let row = logicContext.config.rows - 1; row >= 0; row--) {
      const symbol = logicContext.mainSymbols[row][col];
      if (symbol) {
        const fallDistance = emptyPositions.filter(emptyRow => emptyRow > row).length;
        
        if (fallDistance > 0) {
          const newRow = row + fallDistance;
          const newPosition = logicContext.mainBoard.getCellPosition(newRow, col);
          logicContext.mainSymbols[newRow][col] = symbol;
          logicContext.mainSymbols[row][col] = null as any;
          symbol.setBoardPosition(newRow, col);
          const moveAnimation = animate(symbol, {
            y: newPosition.y
          }, {
            duration: 0.5,
            ease: "easeOut"
          }).then(() => {
            symbol.snapToPosition(newPosition.x, newPosition.y);
          });
          
          movePromises.push(moveAnimation);
        }
      }
    }
    
    await Promise.all(movePromises);
  }
  
  private async createAndDropNewSymbols(col: number, count: number, logicContext: ILogicContext): Promise<void> {
    const dropPromises: Promise<void>[] = [];
    
    for (let i = 0; i < count; i++) {
      const row = i;
      const symbol = new Symbol(undefined, logicContext.config.mode);
      
      symbol.width = logicContext.config.tileSize;
      symbol.height = logicContext.config.tileSize;
      
      const finalPosition = logicContext.mainBoard.getCellPosition(row, col);
      symbol.x = finalPosition.x;
      symbol.y = finalPosition.y - (count + 2) * logicContext.config.tileSize;
      symbol.alpha = 1;
      symbol.name = `mainSymbol-${row}-${col}`;
      logicContext.mainSymbols[row][col] = symbol;
      logicContext.mainContainer.addChild(symbol);
      const dropAnimation = animate(symbol, {
        y: finalPosition.y
      }, {
        duration: 0.8,
        ease: [0.25, 0.46, 0.45, 0.94],
        delay: i * 0.1
      }).then(() => {
        symbol.snapToPosition(finalPosition.x, finalPosition.y);
        symbol.setBoardPosition(row, col);
      });
      
      dropPromises.push(dropAnimation);
    }
    
    await Promise.all(dropPromises);
  }
  
  private updateStore(matchResult: MatchResult, logicContext: ILogicContext): void {
    const scoreGained = MatchRules.calculateTotalScore(matchResult.matches);
    const currentScore = Store.getState().score || 0;
    Store.getState().setScore(currentScore + scoreGained);
    const updatedContext = {
      ...logicContext,
      mainSymbols: logicContext.mainSymbols,
      viewerSymbols: logicContext.viewerSymbols
    };
    
    Store.getState().setLogicContext(updatedContext);
    
    const matchDetails = matchResult.matches.map(match => 
      `${match.positions.length} taş = ${MatchRules.calculateScore(match.positions.length)} puan`
    ).join(', ');
    
    console.log(`Puan detayı: ${matchDetails}`);
    console.log(`Toplam kazanılan: +${scoreGained} puan`);
    console.log(`Toplam skor: ${currentScore + scoreGained}`);
  }
}
