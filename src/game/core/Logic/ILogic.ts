export interface ILogicContext {
  mainBoard: any;
  viewerBoard: any;
  mainContainer: any;
  viewerContainer: any;
  mainSymbols: any[][];
  viewerSymbols: any[];
  config: any;
  setupSymbolEventHandlers: (symbol: any) => void;
  removeSymbolEventHandlers: (symbol: any) => void;
}

export interface ILogic {
  execute(context: any, logicContext: ILogicContext): Promise<void>;
}
