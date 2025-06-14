import { Sprite, Texture, FederatedPointerEvent } from "pixi.js";
import { GetSymbols, Mode } from "../Constants/Configt";
import { randomItem } from "../../../engine/utils/random";

export class Symbol extends Sprite {
  public symbolType: string;
  public originalPosition: { x: number; y: number } = { x: 0, y: 0 };
  public isDragging: boolean = false;
  public isOnBoard: boolean = false;
  public boardPosition: { row: number; col: number } = { row: -1, col: -1 };

  private dragOffset: { x: number; y: number } = { x: 0, y: 0 };
  private originalAlpha: number;
  public hasEventListeners: boolean = false;
  private dragMoveThrottle: boolean = false;

  constructor(symbolType?: string, mode: Mode = "easy") {
    // Get random symbol type if not provided
    const availableSymbols = GetSymbols(mode);
    const selectedSymbol = symbolType || randomItem(availableSymbols);

    super(Texture.from(String(selectedSymbol)));

    this.symbolType = String(selectedSymbol);
    this.name = "Symbol";
    this.anchor.set(0);
    this.originalAlpha = 1;
  }

  public setupInteractivity(): void {
    // Prevent double setup
    if (this.hasEventListeners) return;
    
    this.eventMode = "static";
    this.cursor = "pointer";

    this.on("pointerdown", this.onDragStart);
    this.on("pointerup", this.onDragEnd);
    this.on("pointerupoutside", this.onDragEnd);
    this.on("pointermove", this.onDragMove);
    this.on("pointerover", this.onHover);
    this.on("pointerout", this.onHoverEnd);
    
    this.hasEventListeners = true;
  }

  private onHover = (): void => {
    if (!this.isDragging) {
      this.alpha = 0.75;
      // Emit hover start event for state machine
      this.emit('hoverStart', this);
    }
  };

  private onHoverEnd = (): void => {
    if (!this.isDragging) {
      this.alpha = this.originalAlpha;
      // Emit hover end event for state machine
      this.emit('hoverEnd', this);
    }
  };

  private onDragStart = (event: FederatedPointerEvent): void => {
    this.isDragging = true;
    this.alpha = 0.5;

    // Store the original position
    this.originalPosition = { x: this.x, y: this.y };

    // Calculate drag offset
    const localPosition = event.getLocalPosition(this.parent);
    this.dragOffset.x = localPosition.x - this.x;
    this.dragOffset.y = localPosition.y - this.y;

    // Bring to front
    if (this.parent) {
      this.parent.setChildIndex(this, this.parent.children.length - 1);
    }

    // Emit drag start event for state machine
    this.emit('dragStart', this);
  };

  private onDragMove = (event: FederatedPointerEvent): void => {
    if (this.isDragging) {
      const localPosition = event.getLocalPosition(this.parent);
      this.x = localPosition.x - this.dragOffset.x;
      this.y = localPosition.y - this.dragOffset.y;

      // Throttle drag move events to reduce spam
      if (!this.dragMoveThrottle) {
        this.dragMoveThrottle = true;
        setTimeout(() => {
          if (this.isDragging) {
            const globalPosition = event.getLocalPosition(this.parent.parent);
            this.emit('dragMove', this, { x: globalPosition.x, y: globalPosition.y });
          }
          this.dragMoveThrottle = false;
        }, 50); // Throttle to 20fps
      }
    }
  };

  private onDragEnd = (event: FederatedPointerEvent): void => {
    if (!this.isDragging) return;

    this.isDragging = false;
    this.alpha = this.originalAlpha;

    // Get global position for drop handling
    const globalPosition = event.getLocalPosition(this.parent.parent);
    
    // Emit drag end event for state machine
    this.emit('dragEnd', this, { x: globalPosition.x, y: globalPosition.y });

    // Emit legacy event for backward compatibility
    this.emit("symbolDropped", this);
  };

  public snapToPosition(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.originalPosition = { x, y };
  }

  public returnToOriginalPosition(): void {
    this.x = this.originalPosition.x;
    this.y = this.originalPosition.y;
  }

  public setBoardPosition(row: number, col: number): void {
    this.boardPosition = { row, col };
    this.isOnBoard = true;
  }

  public removeBoardPosition(): void {
    this.boardPosition = { row: -1, col: -1 };
    this.isOnBoard = false;
  }

  public setAlpha(alpha: number): void {
    this.originalAlpha = alpha;
    this.alpha = alpha;
  }

  public getSymbolType(): string {
    return this.symbolType;
  }

  public destroyInteractive(): void {
    this.hasEventListeners = false;
    this.off("pointerdown", this.onDragStart);
    this.off("pointerup", this.onDragEnd);
    this.off("pointerupoutside", this.onDragEnd);
    this.off("pointermove", this.onDragMove);
    this.off("pointerover", this.onHover);
    this.off("pointerout", this.onHoverEnd);
    this.eventMode = "none";
    this.cursor = "auto";
  }

  public destroy(): void {
    this.destroyInteractive();
    super.destroy();
  }
}
