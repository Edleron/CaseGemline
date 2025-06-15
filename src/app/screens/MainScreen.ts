import { FancyButton } from "@pixi/ui";
import { animate } from "motion";
import type { Ticker } from "pixi.js";
import { Container } from "pixi.js";

import { engine } from "../getEngine";
import { game } from "../getGame";
import { PausePopup } from "../popups/PausePopup";
import { SettingsPopup } from "../popups/SettingsPopup";
import { Button } from "../ui/Button";
import { Label } from "../ui/Label";

/** The screen that holds the app */
export class MainScreen extends Container {
  /** Assets bundles required by this screen */
  public static assetBundles = ["main"];

  public uiContainer!       : Container;
  private pauseButton!      : FancyButton;
  private settingsButton!   : FancyButton;
  private addButton!        : FancyButton;
  private score!            : Label;
  private move!             : Label;
  private paused            = false;
  private scoreUnsubscribe?: () => void;
  private moveUnsubscribe?: () => void;

  constructor() {
    super();
    game().init();
    this.addChild(game());
    this.createUI();
    this.setupSubscription();
  }

  private setupSubscription(): void {
    this.scoreUnsubscribe = game().subscribeToScore((score: number) => {
      this.updateScoreDisplay(score);
    });

    this.moveUnsubscribe = game().subscribeToMove((move: number) => {
      this.updateMoveDisplay(move);
    });
    
    // Set initial score display
    this.updateScoreDisplay(game().getCurrentScore());
    this.updateMoveDisplay(game().getCurrentMove());
  }

  private updateScoreDisplay(score: number): void {
    this.score.text = `Toplam Puan: ${score.toLocaleString()}`;
  }

  private updateMoveDisplay(move: number): void {
    this.move.text = `Kalan Hamle: ${move.toLocaleString()}`;
  }

  private createUI(){
    this.uiContainer = new Container();
    this.name = "uiContainer";
    this.addChild(this.uiContainer);

    const buttonAnimations = {
          hover: {
            props: {
              scale: { x: 1.1, y: 1.1 },
            },
            duration: 100,
          },
          pressed: {
            props: {
              scale: { x: 0.9, y: 0.9 },
            },
            duration: 100,
          },
    };
    this.pauseButton = new FancyButton({
      defaultView: "icon-pause.png",
      anchor: 0.5,
      animations: buttonAnimations,
    });
    this.pauseButton.onPress.connect(() =>
      engine().navigation.presentPopup(PausePopup),
    );
    this.uiContainer.addChild(this.pauseButton);

    this.settingsButton = new FancyButton({
          defaultView: "icon-settings.png",
          anchor: 0.5,
          animations: buttonAnimations,
    });
    this.settingsButton.onPress.connect(() =>
      engine().navigation.presentPopup(SettingsPopup),
    );
    this.uiContainer.addChild(this.settingsButton);

    this.addButton = new Button({
      text: "Restart Game",
      width: 268,
      height: 71,
    });
    this.addButton.onPress.connect(() => {
      if (game().isReady()) {
        game().reset();
      }
    });
    this.uiContainer.addChild(this.addButton);

    this.score = new Label({
      text: "Toplam Puan: 0",
      style: { fill: 0xec1561, fontSize: 50 },
    });
    this.score.x = 0;
    this.score.y = 0;
    this.uiContainer.addChild(this.score);

    this.move = new Label({
      text: "Kalan Hamle: 25",
      style: { fill: 0x1565ec, fontSize: 50 },
    });
    this.move.x = 0;
    this.move.y = 0;
    this.uiContainer.addChild(this.move);
  } 

  /** Prepare the screen just before showing */
  public prepare() {}

  /** Update the screen */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  public update(_time: Ticker) {
    if (this.paused) return;
    
    // Update button state based on viewer symbols readiness
    const isViewerReady = game().isReady();
    this.addButton.enabled = isViewerReady;
    
    // Visual feedback for disabled state
    if (!isViewerReady) {
      this.addButton.alpha = 0.5;
      this.addButton.cursor = 'not-allowed';
    } else {
      this.addButton.alpha = 1;
      this.addButton.cursor = 'pointer';
    }
  }

  /** Pause gameplay - automatically fired when a popup is presented */
  public async pause() {
    this.paused = true;
  }

  /** Resume gameplay */
  public async resume() {
    this.paused = false;
  }

  /** Fully reset */
  public reset() {
    if (this.scoreUnsubscribe && this.moveUnsubscribe) {
      this.scoreUnsubscribe();
      this.moveUnsubscribe
      this.scoreUnsubscribe = undefined;
      this.moveUnsubscribe = undefined;
    }
  }

  /** Resize the screen, fired whenever window size changes */
  public resize(width: number, height: number) {
    // const centerX = width * 0.5;
    // const centerY = height * 0.5;

    // this.mainContainer.x = centerX;
    // this.mainContainer.y = centerY;

    game().position.x = (width / 2) - (game().width / 2);
    game().position.y = 25;
    this.pauseButton.x = 30;
    this.pauseButton.y = 30;
    this.settingsButton.x = width - 30;
    this.settingsButton.y = 30;
    this.addButton.x = width / 2;
    this.addButton.y = height - 35;
    this.score.x = width / 2;
    this.score.y = height - 200;
    this.move.x = width / 2;
    this.move.y = height - 125;
  }

  /** Show screen with animations */
  public async show(): Promise<void> {
    engine().audio.bgm.play("main/sounds/bgm-main.mp3", { volume: 0.5 });

    const elementsToAnimate = [
      this.pauseButton,
      this.settingsButton,
      this.addButton,
      game(),
    ];

    let finalPromise!: Promise<void>;
    for (const element of elementsToAnimate) {
      element.alpha = 0;
      finalPromise = animate(
        element,
        { alpha: 1 },
        { duration: 0.3, delay: 0.75, ease: "backOut" },
      ).then(() => {
      });
    }

    await finalPromise;
    game().fade()
  }

  /** Hide screen with animations */
  public async hide() {
    if (this.scoreUnsubscribe && this.moveUnsubscribe) {
      this.scoreUnsubscribe();
      this.moveUnsubscribe();
      this.scoreUnsubscribe = undefined;
      this.moveUnsubscribe = undefined;
    }
  }

  /** Auto pause the app when window go out of focus */
  public blur() {
    if (!engine().navigation.currentPopup) {
      engine().navigation.presentPopup(PausePopup);
    }
  }
}
