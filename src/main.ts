import { setEngine } from "./app/getEngine";
import { setGame } from "./app/getGame";
import { LoadScreen } from "./app/screens/LoadScreen";
import { MainScreen } from "./app/screens/main/MainScreen";
import { userSettings } from "./app/utils/userSettings";
import { CreationEngine } from "./engine/engine";

/**
 * Importing these modules will automatically register there plugins with the engine.
 */
import "@pixi/sound";
import { CreationGame } from "./game/game";
// import "@esotericsoftware/spine-pixi-v8";

// Create a new creation engine instance
const engine = new CreationEngine();
const game = new CreationGame();
setEngine(engine);
setGame(game);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__PIXI_APP__ = engine;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).game = engine;

(async () => {
  // Initialize the creation engine instance
  await engine.init({
    background: "#1E1E1E",
    resizeOptions: { minWidth: 768, minHeight: 1024, letterbox: false },
  });

  // Initialize the user settings
  userSettings.init();

  // Show the load screen
  await engine.navigation.showScreen(LoadScreen);
  // Show the main screen once the load screen is dismissed
  await engine.navigation.showScreen(MainScreen);
})();
