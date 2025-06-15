# 💎 CaseGemline - Match-3 Gem Game

A modern match-3 puzzle game built with **PixiJS v8**, **TypeScript**, and **Vite**. Features drag-and-drop gameplay, state management with Zustand, and smooth animations with Motion.

## 🎮 Game Features

- **Match-3 Gameplay**: Drag gems from the viewer board to the main board to create matches
- **Score System**: Earn points with the formula `(N - 2)² × 10` where N is the number of matched gems
- **Move Limit**: Complete objectives within 25 moves
- **Hint System**: Get hints after failed moves to help find matches
- **Win/Lose Conditions**: Reach 500+ points to win, or lose when moves run out
- **Multiple Difficulty Modes**: Easy (2 gem types), Normal (3 types), Hard (4 types)

## 🛠️ Tech Stack

- **PixiJS v8** - 2D rendering engine
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool and dev server
- **Zustand** - State management
- **XState** - State machine for game logic
- **Motion** - Animation library
- **@pixi/sound** - Audio management
- **@pixi/ui** - UI components

## 📁 Project Structure

```
src/
├── app/                    # Application layer
│   ├── screens/           # Game screens (Main, Load)
│   ├── popups/            # Game popups (Pause, Win, GameOver)
│   ├── ui/                # Reusable UI components
│   └── utils/             # App utilities
├── engine/                # Core engine systems
│   ├── audio/             # Audio management
│   ├── navigation/        # Screen navigation
│   ├── resize/            # Responsive design
│   └── utils/             # Engine utilities
├── game/                  # Game logic
│   ├── core/              # Core game systems
│   │   ├── Board/         # Game board management
│   │   ├── Symbol/        # Gem/Symbol classes
│   │   ├── Logic/         # Game logic (Validation, Matching)
│   │   ├── Rules/         # Game rules and scoring
│   │   ├── State/         # State machine definitions
│   │   └── Constants/     # Game configuration
│   └── store/             # Global state management
└── assets/                # Game assets (images, sounds)
```

## 🚀 Quick Start

### Prerequisites

- **Node.js** (v16 or higher)
- **npm** or **yarn**

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CaseGemline
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Start development server**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

4. **Open your browser**
   ```
   http://localhost:5173
   ```

## 🎯 How to Play

1. **Objective**: Score 500+ points within 25 moves to win
2. **Gameplay**: 
   - Drag gems from the bottom viewer board (3 gems)
   - Drop them onto the main board (5x5 grid)
   - Create matches of 3+ gems horizontally or vertically
   - Matched gems disappear and new ones fall from the top
3. **Scoring**: 
   - 3 gems = 10 points
   - 4 gems = 40 points  
   - 5 gems = 90 points
   - Formula: `(N - 2)² × 10`
4. **Hints**: After 2 failed moves, the game highlights potential matches

## 🎮 Controls

- **Mouse/Touch**: Drag and drop gems
- **Pause Button**: Top-left corner
- **Settings**: Top-right corner  
- **Restart**: Bottom button (when game is ready)

## 🔧 Development Commands

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Run linting
npm run lint

# Start development (alias)
npm start
```

## 🏗️ Build & Deploy

```bash
# Build for production
npm run build

# Output will be in the 'dist' folder
# Deploy the contents of 'dist' to your web server
```

## 🎨 Game Configuration

Game settings can be modified in `src/game/core/Constants/Configt.ts`:

```typescript
const defaultConfig = {
    rows: 5,           // Main board rows
    columns: 5,        // Main board columns  
    tileSize: 128,     // Gem size in pixels
    mode: 'normal',    // Difficulty: 'easy' | 'normal' | 'hard'
    maxMoves: 25,      // Maximum moves allowed
    winScore: 500,     // Score needed to win
};
```

## 🎵 Audio

The game includes:
- **Background Music**: Plays during gameplay
- **Sound Effects**: For interactions and matches
- **Volume Control**: Accessible through settings

## 🧩 Core Game Systems

### State Management
- **Zustand Store**: Manages game state (score, moves, game over)
- **XState Machine**: Handles game flow and user interactions

### Game Logic
- **ValidationLogic**: Validates moves and swaps
- **MatchingLogic**: Detects and processes matches
- **MatchRules**: Defines scoring and match validation rules

### Rendering
- **PixiJS Engine**: High-performance 2D rendering
- **Responsive Design**: Adapts to different screen sizes
- **Smooth Animations**: Motion-powered transitions

## 🐛 Troubleshooting

**Game won't start?**
- Check console for errors
- Ensure all dependencies are installed
- Try clearing browser cache

**Performance issues?**
- Close other browser tabs
- Check if hardware acceleration is enabled
- Lower game quality in settings (if available)

**Audio not working?**
- Check browser audio permissions
- Ensure volume is not muted
- Try refreshing the page

## 📄 License

This project is a test case development. All rights reserved.

## 🤝 Contributing

This is a test case project. For development purposes only.

---

**Made with ❤️ using PixiJS and TypeScript**
