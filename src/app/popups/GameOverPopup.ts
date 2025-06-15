import { animate } from "motion";
import { BlurFilter, Container, Sprite, Texture } from "pixi.js";

import { engine } from "../getEngine";
import { game } from "../getGame";
import { Button } from "../ui/Button";
import { Label } from "../ui/Label";
import { RoundedBox } from "../ui/RoundedBox";

/** Popup that shows up when game is over (no moves left) */
export class GameOverPopup extends Container {
  /** The dark semi-transparent background covering current screen */
  private bg: Sprite;
  /** Container for the popup UI components */
  private panel: Container;
  /** The popup title label */
  private title: Label;
  /** Button that restarts the game */
  private restartButton: Button;
  /** The panel background */
  private panelBase: RoundedBox;

  constructor() {
    super();

    this.bg = new Sprite(Texture.WHITE);
    this.bg.tint = 0x0;
    this.bg.interactive = true;
    this.addChild(this.bg);

    this.panel = new Container();
    this.addChild(this.panel);

    this.panelBase = new RoundedBox({ height: 300 });
    this.panel.addChild(this.panelBase);

    this.title = new Label({
      text: "Game Over",
      style: { fill: 0xec1561, fontSize: 50 },
    });
    this.title.y = -80;
    this.panel.addChild(this.title);

    this.restartButton = new Button({ text: "Restart Game" });
    this.restartButton.y = 70;
    this.restartButton.onPress.connect(this.handleRestart);
    this.panel.addChild(this.restartButton);
  }

  private handleRestart = async () => {
    // Dismiss popup first
    await engine().navigation.dismissPopup();
    
    // Reset game state and restart
    if (game().isReady()) {
      game().reset();
    }
  };

  /** Resize the popup, fired whenever window size changes */
  public resize(width: number, height: number) {
    this.bg.width = width;
    this.bg.height = height;
    this.panel.x = width * 0.5;
    this.panel.y = height * 0.5;
  }

  /** Present the popup, animated */
  public async show() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [
        new BlurFilter({ strength: 5 }),
      ];
    }
    this.bg.alpha = 0;
    this.panel.pivot.y = -400;
    animate(this.bg, { alpha: 0.8 }, { duration: 0.2, ease: "linear" });
    await animate(
      this.panel.pivot,
      { y: 0 },
      { duration: 0.3, ease: "backOut" },
    );
  }

  /** Dismiss the popup, animated */
  public async hide() {
    const currentEngine = engine();
    if (currentEngine.navigation.currentScreen) {
      currentEngine.navigation.currentScreen.filters = [];
    }
    animate(this.bg, { alpha: 0 }, { duration: 0.2, ease: "linear" });
    await animate(
      this.panel.pivot,
      { y: -500 },
      { duration: 0.3, ease: "backIn" },
    );
  }
}
