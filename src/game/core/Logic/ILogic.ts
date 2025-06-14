export interface ILogicContext {
  mainBoard: any;
  viewerBoard: any;
  mainContainer: any;
  viewerContainer: any;
  mainSymbols: any[][];
  viewerSymbols: any[];
  config: any;
}

export interface ILogic {
  execute(context: any, logicContext: ILogicContext): Promise<void>;
}
