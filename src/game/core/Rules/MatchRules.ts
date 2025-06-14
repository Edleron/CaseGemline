export interface MatchGroup {
  positions: { row: number; col: number }[];
  symbolType: string;
  direction: 'horizontal' | 'vertical';
}

export interface MatchResult {
  hasMatches: boolean;
  matches: MatchGroup[];
  allMatchedPositions: { row: number; col: number }[];
}

export class MatchRules {
  
  // RULE: 3 veya daha fazla aynı symbol yan yana ise match
  public static readonly MIN_MATCH_COUNT = 3;
  
  // RULE: Sadece yatay ve dikey match'ler geçerli (çapraz değil)
  public static readonly VALID_DIRECTIONS = ['horizontal', 'vertical'] as const;
  
  // RULE: Match başına puan hesabı
  public static readonly POINTS_PER_SYMBOL = 10;
  
  // RULE: Minimum board boyutu
  public static readonly MIN_BOARD_SIZE = { rows: 6, cols: 6 };
  
  // RULE: Maksimum board boyutu
  public static readonly MAX_BOARD_SIZE = { rows: 12, cols: 12 };
  
  // RULE: Geçerli hamle mesafesi (sadece komşu hücreler)
  public static readonly VALID_MOVE_DISTANCE = 1;
  
  
  // RULE: Match için semboller aynı tip olmalı
  public static isValidMatch(symbolType1: string, symbolType2: string): boolean {
    return symbolType1 === symbolType2;
  }
  
  // RULE: Minimum match sayısını kontrol et
  public static hasMinimumCount(count: number): boolean {
    return count >= this.MIN_MATCH_COUNT;
  }
  
  // RULE: Symbol'ün geçerli olup olmadığını kontrol et
  public static isValidSymbol(symbol: any): boolean {
    return symbol && typeof symbol.getSymbolType === 'function';
  }
  
  // RULE: Match gruplarından toplam puan hesapla
  public static calculateScore(matchCount: number): number {
    return matchCount * this.POINTS_PER_SYMBOL;
  }
  
  // RULE: Match grubunun geçerli olup olmadığını kontrol et
  public static isValidMatchGroup(matchGroup: MatchGroup): boolean {
    return this.hasMinimumCount(matchGroup.positions.length) && 
           this.VALID_DIRECTIONS.includes(matchGroup.direction);
  }
  
  // RULE: İki pozisyon komşu mu kontrol et
  public static areAdjacent(pos1: { row: number; col: number }, pos2: { row: number; col: number }): boolean {
    const rowDiff = Math.abs(pos1.row - pos2.row);
    const colDiff = Math.abs(pos1.col - pos2.col);
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }
  
  // RULE: Pozisyon board sınırları içinde mi
  public static isValidPosition(row: number, col: number, boardRows: number, boardCols: number): boolean {
    return row >= 0 && row < boardRows && col >= 0 && col < boardCols;
  }
  
  // RULE: Board boyutu geçerli mi
  public static isValidBoardSize(rows: number, cols: number): boolean {
    return rows >= this.MIN_BOARD_SIZE.rows && 
           cols >= this.MIN_BOARD_SIZE.cols &&
           rows <= this.MAX_BOARD_SIZE.rows && 
           cols <= this.MAX_BOARD_SIZE.cols;
  }
  
  // RULE: Hamle geçerli mi (komşu mu ve sınırlar içinde mi)
  public static isMoveValid(from: { row: number; col: number }, to: { row: number; col: number }, 
                           boardRows: number, boardCols: number): boolean {
    return this.areAdjacent(from, to) && 
           this.isValidPosition(from.row, from.col, boardRows, boardCols) &&
           this.isValidPosition(to.row, to.col, boardRows, boardCols);
  }
}