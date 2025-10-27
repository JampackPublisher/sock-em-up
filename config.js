const GameConfig = {
  // Target canvas dimensions and aspect ratio
  TARGET_WIDTH: 1200,
  TARGET_HEIGHT: 800,
  TARGET_ASPECT_RATIO: 1200 / 800, // 1.5 (3:2 ratio)

  // Canvas sizing constraints
  MIN_WIDTH: 600,
  MIN_HEIGHT: 400,
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,

  // Original canvas dimensions for backwards compatibility
  CANVAS_WIDTH: 1200,
  CANVAS_HEIGHT: 800,

  // Canvas sizing utility functions
  calculateCanvasSize: function (viewportWidth, viewportHeight) {
    const viewportRatio = viewportWidth / viewportHeight;
    const targetRatio = this.TARGET_ASPECT_RATIO;

    let canvasWidth, canvasHeight;

    if (viewportRatio > targetRatio) {
      // Viewport is wider than target ratio - fit to height
      canvasHeight = Math.min(viewportHeight, this.MAX_HEIGHT);
      canvasWidth = canvasHeight * targetRatio;
    } else {
      // Viewport is taller than target ratio - fit to width
      canvasWidth = Math.min(viewportWidth, this.MAX_WIDTH);
      canvasHeight = canvasWidth / targetRatio;
    }

    // Ensure minimum size constraints
    if (canvasWidth < this.MIN_WIDTH) {
      canvasWidth = this.MIN_WIDTH;
      canvasHeight = canvasWidth / targetRatio;
    }
    if (canvasHeight < this.MIN_HEIGHT) {
      canvasHeight = this.MIN_HEIGHT;
      canvasWidth = canvasHeight * targetRatio;
    }

    return {
      width: Math.round(canvasWidth),
      height: Math.round(canvasHeight),
      scale: canvasWidth / this.TARGET_WIDTH,
    };
  },

  // Get scale factor for responsive UI elements
  getScaleFactor: function (currentWidth) {
    return currentWidth / this.TARGET_WIDTH;
  },

  // Physics bounds (adjust these to match your background graphic)
  PHYSICS_BOUNDS: {
    LEFT: 50,
    RIGHT: 1300,
    TOP: 70,
    BOTTOM: 700,
  },

  // Game settings
  POINTS_PER_SOCKBALL_PAID: 5,
  POINTS_PER_SOCK: 10,
  GRAVITY: 0.2,
  FRICTION: 0.98,
  BOUNCE_DAMPING: 0.8,

  // Sock settings
  SOCK_SIZE: 80,
  SOCKBALL_SIZE: 30,
  SOCK_SHOOT_SPEED: 37,

  // dropssss
  DROP_TARGET_PAIRS: 3,

  // Martha settings
  MARTHA_SIZE: { width: 84, height: 86 }, // 20% larger + matching spritesheet aspect ratio (269:275)
  MARTHA_HIT_EFFECT_DURATION: 60, // frames
  MARTHA_SPRITESHEET: {
    filename: "martha-running-spritesheet.png",
    frameWidth: 269, // Width of each frame in the spritesheet (1614 / 6)
    frameHeight: 275, // Height of each frame in the spritesheet (1650 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], // Which frames to use in the animation sequence
    fps: 12, // 12 frames per second for running animation
  },

  MARTHA_LAUGHING_SPRITESHEET: {
    filename: "martha-laughing-spritesheet.png",
    frameWidth: 202, // Width of each frame in the spritesheet (1212 / 6)
    frameHeight: 283, // Height of each frame in the spritesheet (1698 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // 24 frames per second
  },

  MARTHA_SOCKBALLS_SPRITESHEET: {
    filename: "martha-sockballs-spritesheet.png",
    frameWidth: 215, // Width of each frame in the spritesheet (1290 / 6)
    frameHeight: 321, // Height of each frame in the spritesheet (1926 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for juggling animation
  },

  MARTHA_LOSING_SPRITESHEET: {
    filename: "martha-losing-spritesheet.png",
    frameWidth: 173, // Width of each frame in the spritesheet (1038 / 6)
    frameHeight: 263, // Height of each frame in the spritesheet (1578 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for losing animation
  },

  MARTHA_RUMBLE_SPRITESHEET: {
    filename: "martha-rumble-spritesheet.png",
    frameWidth: 253, // Width of each frame in the spritesheet (1518 / 6)
    frameHeight: 259, // Height of each frame in the spritesheet (1554 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for rumble animation (NEW GAME+ 1-2)
  },

  MARTHA_FATSOP_SPRITESHEET: {
    filename: "martha-fatsop-spritesheet.png",
    frameWidth: 341, // Width of each frame in the spritesheet (2046 / 6)
    frameHeight: 341, // Height of each frame in the spritesheet (2046 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for fatsop animation (NEW GAME+ 3-4)
  },

  MARTHA_CRAWLING_SPRITESHEET: {
    filename: "martha-crawling-spritesheet.png",
    frameWidth: 335, // Width of each frame in the spritesheet (2010 / 6)
    frameHeight: 238, // Height of each frame in the spritesheet (1428 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 18, // 18 frames per second for faster crawling animation
  },

  MARTHA_STORY1_SPRITESHEET: {
    filename: "martha-story1-spritesheet.png",
    frameWidth: 260, // Width of each frame in the spritesheet (1560 / 6)
    frameHeight: 220, // Height of each frame in the spritesheet (1320 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_STORY2_SPRITESHEET: {
    filename: "martha-story2-spritesheet.png",
    frameWidth: 265, // Width of each frame in the spritesheet (1590 / 6)
    frameHeight: 216, // Height of each frame in the spritesheet (1296 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_STORY3_SPRITESHEET: {
    filename: "martha-story3-spritesheet.png",
    frameWidth: 277, // Width of each frame in the spritesheet (1662 / 6)
    frameHeight: 267, // Height of each frame in the spritesheet (1602 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_STORY4_SPRITESHEET: {
    filename: "martha-story4-spritesheet.png",
    frameWidth: 264, // Width of each frame in the spritesheet (1584 / 6)
    frameHeight: 299, // Height of each frame in the spritesheet (1794 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_STORY5_SPRITESHEET: {
    filename: "martha-story5-spritesheet.png",
    frameWidth: 172, // Width of each frame in the spritesheet (1032 / 6)
    frameHeight: 259, // Height of each frame in the spritesheet (1554 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_STORY6_SPRITESHEET: {
    filename: "martha-story6-spritesheet.png",
    frameWidth: 257, // Width of each frame in the spritesheet (1542 / 6)
    frameHeight: 259, // Height of each frame in the spritesheet (1554 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // 12 frames per second for story animation
  },

  MARTHA_UNLOCK1_SPRITESHEET: {
    filename: "martha-unlock1-spritesheet.png",
    frameWidth: 268, // Width of each frame in the spritesheet (1608 / 6)
    frameHeight: 280, // Height of each frame in the spritesheet (1680 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Increased to match How to Play animation speed
  },

  MARTHA_UNLOCK2_SPRITESHEET: {
    filename: "martha-unlock2-spritesheet.png",
    frameWidth: 166, // Width of each frame in the spritesheet (996 / 6)
    frameHeight: 269, // Height of each frame in the spritesheet (1614 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK3_SPRITESHEET: {
    filename: "martha-unlock3-spritesheet.png",
    frameWidth: 403, // Width of each frame in the spritesheet (2418 / 6)
    frameHeight: 225, // Height of each frame in the spritesheet (1350 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK4_SPRITESHEET: {
    filename: "martha-unlock4-spritesheet.png",
    frameWidth: 178, // Width of each frame in the spritesheet (1068 / 6)
    frameHeight: 261, // Height of each frame in the spritesheet (1566 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK5_SPRITESHEET: {
    filename: "martha-unlock5-spritesheet.png",
    frameWidth: 339, // Width of each frame in the spritesheet (2034 / 6)
    frameHeight: 208, // Height of each frame in the spritesheet (1248 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK7_SPRITESHEET: {
    filename: "martha-unlock7-spritesheet.png",
    frameWidth: 433, // Width of each frame in the spritesheet (2598 / 6)
    frameHeight: 383, // Height of each frame in the spritesheet (2298 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK8_SPRITESHEET: {
    filename: "martha-unlock8-spritesheet.png",
    frameWidth: 229, // Width of each frame in the spritesheet (1374 / 6)
    frameHeight: 276, // Height of each frame in the spritesheet (1656 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  MARTHA_UNLOCK9_SPRITESHEET: {
    filename: "martha-unlock9-spritesheet.png",
    frameWidth: 310, // Width of each frame in the spritesheet (1860 / 6)
    frameHeight: 345, // Height of each frame in the spritesheet (2070 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 24, // Match How to Play animation speed
  },

  YOU_WIN_SPRITESHEET: {
    filename: "you-win-spritesheet.png",
    frameWidth: 376, // Width of each frame in the spritesheet (2256 / 6)
    frameHeight: 337, // Height of each frame in the spritesheet (2022 / 6)
    columns: 6,
    rows: 6,
    totalFrames: 36,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
    ], // All 36 frames
    fps: 12, // Animation speed for victory screen
  },

  // Throwing screen settings
  THROWING_BOUNDS: {
    LEFT: 0,
    RIGHT: 1200,
    TOP: 240, // Bottom 70% of screen (30% from top = 800 * 0.3 = 240)
    BOTTOM: 800,
  },

  // Sockball throwing settings
  SOCKBALL_THROW_SPEED: 20,
  SOCKBALL_THROW_COOLDOWN: 1000, // milliseconds (reduced by 50% from 2000)
  SOCKBALL_LAUNCH_POSITION: { x: 50, y: 750 }, // bottom left corner

  // Martha movement patterns
  MARTHA_PATTERNS: {
    HORIZONTAL: {
      name: "horizontal",
      baseSpeed: 1.5,
      description: "Moves left and right",
    },
    VERTICAL: {
      name: "vertical",
      baseSpeed: 1.5,
      description: "Moves up and down",
    },
    DIAGONAL: {
      name: "diagonal",
      baseSpeed: 1.5,
      description: "Moves in diagonal patterns",
    },
    CIRCULAR: {
      name: "circular",
      baseSpeed: 1.5,
      description: "Moves in circular patterns",
    },
    RANDOM: {
      name: "random",
      baseSpeed: 1.5,
      description: "Moves randomly",
    },
    FIGURE_EIGHT: {
      name: "figure-eight",
      baseSpeed: 1.5,
      description: "Moves in a figure-8 pattern",
    },
    ZIGZAG_HORIZONTAL: {
      name: "zigzag-horizontal",
      baseSpeed: 1.5,
      description: "Zigzags horizontally across the screen",
    },
    ZIGZAG_VERTICAL: {
      name: "zigzag-vertical",
      baseSpeed: 1.5,
      description: "Zigzags vertically down the screen",
    },
    SPIRAL: {
      name: "spiral",
      baseSpeed: 1.5,
      description: "Spirals outward or inward",
    },
    BOUNCE: {
      name: "bounce",
      baseSpeed: 1.5,
      description: "Bounces around like a DVD screensaver",
    },
    SQUARE: {
      name: "square",
      baseSpeed: 1.5,
      description: "Moves in a square pattern",
    },
    WAVE: {
      name: "wave",
      baseSpeed: 1.5,
      description: "Moves in a sine wave pattern",
    },
  },

  // Martha hit effects
  MARTHA_HIT_EFFECTS: {
    FLASH_DURATION: 300, // milliseconds
    KNOCKBACK_DISTANCE: 20,
    POINT_POP_DURATION: 1000,
  },

  // Bottom UI Bar Configuration
  UI_BAR: {
    height: 80,
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    borderColor: "rgba(255, 255, 255, 0.3)",
    borderWidth: 2,
    padding: 10,
    itemSpacing: 20,
    panelPadding: 12,
    panelSpacing: 15,
  },

  // UI positions - Updated for full-width drawer and 3 pairs of drop zones
  SOCK_PILE_POS: { x: 600, y: 700 }, // Will be calculated dynamically for full width

  // Sock pile image thresholds
  SOCK_PILE_THRESHOLDS: {
    IMAGE_1: 40, // Full pile
    IMAGE_2: 28, // 3/4 pile
    IMAGE_3: 16, // 1/2 pile
    IMAGE_4: 4, // Almost empty
  },

  // Animation settings
  SOCKBALL_ANIMATION_SPEED: 5,
  SHAKE_DURATION: 12, // frames
  POP_DURATION: 30, // frames

  // Debug settings
  DEBUG_PHYSICS_BOUNDS: false, // Set to false to hide bounds

  // Game levels
  LEVELS: [
    //DEMO stats
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    //   {
    //     marthaSpeed: 1,
    //     sockPairs: 1,
    //     typesAvailable: [1],
    //     matchingTime: 60,
    //     marthaWantsSockballs: 1,
    //     marthaPatterns: ["random", "circular"],
    //     marthaPatternSpeed: 1,
    //   },
    // ],
    //good stats
    {
      marthaSpeed: 0.5,
      sockPairs: 3,
      typesAvailable: [1],
      matchingTime: 10,
      marthaWantsSockballs: 1,
      marthaPatterns: ["horizontal", "vertical"],
      marthaPatternSpeed: 0.5,
    },
    {
      marthaSpeed: 0.65,
      sockPairs: 4,
      typesAvailable: [1, 2],
      matchingTime: 12,
      marthaWantsSockballs: 3,
      marthaPatterns: ["horizontal", "vertical", "diagonal"],
      marthaPatternSpeed: 0.75,
    },
    {
      marthaSpeed: 0.85,
      sockPairs: 6,
      typesAvailable: [1, 2, 3],
      matchingTime: 15,
      marthaWantsSockballs: 4,
      marthaPatterns: ["horizontal", "vertical", "diagonal", "circular"],
      marthaPatternSpeed: 0.85,
    },
    {
      marthaSpeed: 1,
      sockPairs: 8,
      typesAvailable: [1, 2, 3, 4],
      matchingTime: 20,
      marthaWantsSockballs: 5,
      marthaPatterns: ["horizontal", "vertical", "diagonal", "circular"],
      marthaPatternSpeed: 1,
    },
    {
      marthaSpeed: 1.15,
      sockPairs: 10,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 25,
      marthaWantsSockballs: 8,
      marthaPatterns: ["diagonal", "circular", "random"],
      marthaPatternSpeed: 1.1,
    },
    {
      marthaSpeed: 1.2,
      sockPairs: 12,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 30,
      marthaWantsSockballs: 10,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "random",
      ],
      marthaPatternSpeed: 1.2,
    },
    {
      marthaSpeed: 1.3,
      sockPairs: 16,
      typesAvailable: [2, 3, 4, 5],
      matchingTime: 40,
      marthaWantsSockballs: 12,
      marthaPatterns: ["diagonal", "circular"],
      marthaPatternSpeed: 1.3,
    },
    {
      marthaSpeed: 1.45,
      sockPairs: 15,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 45,
      marthaWantsSockballs: 13,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "random",
      ],
      marthaPatternSpeed: 1.35,
    },
    {
      marthaSpeed: 1.6,
      sockPairs: 24,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 60,
      marthaWantsSockballs: 21,
      marthaPatterns: ["random", "circular"],
      marthaPatternSpeed: 1.4,
    },
  ],

  // Level costs and unlock data
  // Smoothed progression: easier early game, better scaling for NEW GAME+ difficulties
  LEVEL_COSTS: [0, 20, 50, 90, 140, 200, 270, 350, 450],
  //LEVEL_COSTS: [0, 1, 2, 3, 4, 5, 6, 7, 8],

  INITIAL_UNLOCKED_LEVELS: [
    true,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],
  INITIAL_COMPLETED_LEVELS: [
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
    false,
  ],

  // Image files
  IMAGES: {
    SOCKS: [
      "sock1.png",
      "sock2.png",
      "sock3.png",
      "sock4.png",
      "sock5.png",
      "sock6.png",
    ],
    SOCK_BALLS: [
      "sockball1.png",
      "sockball2.png",
      "sockball3.png",
      "sockball4.png",
      "sockball5.png",
      "sockball6.png",
    ],
    SOCK_PILES: [
      "sockpile1.png",
      "sockpile2.png",
      "sockpile3.png",
      "sockpile4.png",
    ],
    CHARACTERS: [
      "martha.png",
      "martha2.png",
      "martha3.png",
      "martha3.png",
      "martha-rentdue.png",
      "martha-win.png",
      "martha-demand.png",
      "martha-demand-level-select.png",
      "htp-1.png",
      "htp-2.png",
      "htp-3.png",
      "htp-4.png",
      "htp-5.png",
      "story-1.png",
      "story-2.png",
      "story-3.png",
      "story-4.png",
      "story-5.png",
      "story-6.png",
      "story-7.png",
      "story-8.png",
      "story-9.png",
      "martha-running-spritesheet.png",
      "martha-laughing-spritesheet.png",
      "martha-sockballs-spritesheet.png",
      "martha-losing-spritesheet.png",
      "martha-rumble-spritesheet.png",
      "martha-fatsop-spritesheet.png",
      "martha-crawling-spritesheet.png",
      "martha-story1-spritesheet.png",
      "martha-story2-spritesheet.png",
      "martha-story3-spritesheet.png",
      "martha-story4-spritesheet.png",
      "martha-story5-spritesheet.png",
      "martha-story6-spritesheet.png",
      "martha-unlock1-spritesheet.png",
      "martha-unlock2-spritesheet.png",
      "martha-unlock3-spritesheet.png",
      "martha-unlock4-spritesheet.png",
      "martha-unlock5-spritesheet.png",
      "martha-unlock7-spritesheet.png",
      "martha-unlock8-spritesheet.png",
      "martha-unlock9-spritesheet.png",
    ],
    UI: [
      "background.png",
      "logo.png",
      "star.png",
      "throw-bg.png",
      "throw-bg-2.png",
      "throw-bg-5.png",
      "throw-bg-9.png",
      "level-select-bg.png",
      "you-win.png",
      "you-win-spritesheet.png",

      "icon-money.png",
      "icon-lock.png",
      "icon-sock.png",
      "icon-clock.png",
      "icon-fire1.png",
      "icon-fire2.png",
      "icon-fire3.png",
      "icon-coin.png",
      "icon-egg.png",
      "icon-wizard.png",
      "icon-mouse.png",
      "icon-goldbar.png",
      "icon-1stmedal.png",
      "icon-bullseye.png",
      "icon-butter.png",
      "icon-crown.png",
      "icon-demon.png",
      "icon-diamond.png",
      "icon-glass.png",
      "icon-hands.png",
      "icon-hat.png",
      "icon-heart.png",
      "icon-house.png",
      "icon-lightning.png",
      "icon-redx.png",
      "icon-sparkles.png",
      "icon-trophy.png",
      "icon-star.png",

      "btn-next.png",
      "btn-back.png",
      "btn-pause.png",
      "btn-resume.png",
      "btn-difficulty.png",
      "btn-exit.png",
      "btn-trophies.png",
      "btn-htp.png",
      "btn-story.png",
      "btn-credits.png",
      "btn-skip.png",
      "btn-continue.png",
      "secret-video-button.png",
      "arrow-no-pixel.png",
    ],
  },

  // Sockball queue management utilities
  SOCKBALL_QUEUE_METHODS: {
    // Initialize the sockball queue
    initializeSockballQueue: function () {
      this.sockballQueue = [];
    },

    // Add a sockball type to the queue (called when socks are matched)
    addSockballToQueue: function (sockType) {
      this.sockballQueue.push(sockType);
      // Don't increment sockBalls here - it's incremented when animation completes in sockmanager.js
    },

    // Get the next sockball type from the queue (for throwing)
    getNextSockballFromQueue: function () {
      if (this.sockballQueue.length > 0) {
        return this.sockballQueue.shift(); // Remove and return first item (FIFO)
      }
      return null;
    },

    // Preview the next sockball type without removing it
    getNextSockballType: function () {
      if (this.sockballQueue.length > 0) {
        return this.sockballQueue[0]; // Return first item without removing
      }
      return null;
    },

    // Clear the sockball queue (called when starting a new level)
    clearSockballQueue: function () {
      this.sockballQueue = [];
    },

    // Get the remaining sockballs in queue
    getSockballQueueLength: function () {
      return this.sockballQueue.length;
    },
  },

  // ========== ENHANCED GAME CONFIGURATION - PHASE 1.1 ==========

  // Martha catch mechanics settings
  CATCH_MECHANICS: {
    CATCH_RADIUS_MULTIPLIER: 2.5,
    PERFECT_CATCH_THRESHOLD: 0.6,
    GOOD_CATCH_THRESHOLD: 1.25,
    PERFECT_CATCH_BONUS: 15,
    GOOD_CATCH_BONUS: 10,
    REGULAR_CATCH_BONUS: 5,
  },

  // Perfect catch scoring thresholds
  CATCH_QUALITY: {
    PERFECT: {
      name: "Perfect!",
      points: 15,
      color: "#FFD700", // Gold
      particleColor: "#FFD700",
    },
    GOOD: {
      name: "Good!",
      points: 10,
      color: "#00FF00", // Green
      particleColor: "#00FF00",
    },
    REGULAR: {
      name: "Nice!",
      points: 5,
      color: "#FFFFFF", // White
      particleColor: "#FFFFFF",
    },
  },

  // NEW GAME+ Difficulty multipliers
  DIFFICULTY_MODES: {
    BASE: {
      name: "Normal",
      speedMultiplier: 1.0,
      timeMultiplier: 1.0,
      throwCooldownMultiplier: 1.0,
      catchRadiusMultiplier: 1.0,
      displayName: "Normal",
      stars: 0,
    },
    PLUS_1: {
      name: "NEW GAME+1",
      speedMultiplier: 1.5,
      timeMultiplier: 0.98,
      throwCooldownMultiplier: 0.95,
      catchRadiusMultiplier: 0.8,
      displayName: "★",
      stars: 1,
    },
    PLUS_2: {
      name: "NEW GAME+2",
      speedMultiplier: 2,
      timeMultiplier: 0.95,
      throwCooldownMultiplier: 0.9,
      catchRadiusMultiplier: 0.6,
      displayName: "★★",
      stars: 2,
    },
    PLUS_3: {
      name: "NEW GAME+3",
      speedMultiplier: 3,
      timeMultiplier: 0.92,
      throwCooldownMultiplier: 0.85,
      catchRadiusMultiplier: 0.45,
      displayName: "★★★",
      stars: 3,
    },
    PLUS_4: {
      name: "NEW GAME+4",
      speedMultiplier: 4,
      timeMultiplier: 0.9,
      throwCooldownMultiplier: 0.8,
      catchRadiusMultiplier: 0.3,
      displayName: "★★★★",
      stars: 4,
    },
  },

  // Get difficulty mode by level
  getDifficultyMode: function (difficultyLevel) {
    const modes = [
      this.DIFFICULTY_MODES.BASE,
      this.DIFFICULTY_MODES.PLUS_1,
      this.DIFFICULTY_MODES.PLUS_2,
      this.DIFFICULTY_MODES.PLUS_3,
      this.DIFFICULTY_MODES.PLUS_4,
    ];
    return modes[Math.min(difficultyLevel, modes.length - 1)];
  },

  // Calculate level cost adjusted for difficulty
  // Flat cost increase per difficulty level for better NEW GAME+ scaling
  getLevelCost: function (levelIndex, difficulty = 0) {
    const baseCost = this.LEVEL_COSTS[levelIndex];
    const flatIncrease = 75; // Add 75 per difficulty level
    return baseCost + difficulty * flatIncrease;
  },

  // Level background mappings
  LEVEL_BACKGROUNDS: [
    "throw-bg.png", // Level 1
    "throw-bg.png", // Level 2
    "throw-bg-2.png", // Level 3
    "throw-bg-2.png", // Level 4
    "throw-bg-5.png", // Level 5
    "throw-bg-5.png", // Level 6
    "throw-bg-9.png", // Level 7
    "throw-bg-9.png", // Level 8
    "throw-bg-9.png", // Level 9
  ],

  // Achievement definitions
  ACHIEVEMENTS: {
    FIRST_MATCH: {
      id: "first_match",
      name: "First Match",
      description: "Match your first pair of socks",
      icon: "icon-1stmedal.png",
      unlocked: false,
    },
    PERFECT_THROW: {
      id: "perfect_throw",
      name: "Perfect Throw",
      description: "Hit Martha in the center",
      icon: "icon-sparkles.png",
      unlocked: false,
    },
    SPEEDY_MATCHER: {
      id: "speedy_matcher",
      name: "Speedy Matcher",
      description: "30+ seconds remaining",
      icon: "icon-lightning.png",
      unlocked: false,
    },
    MARTHAS_FAVORITE: {
      id: "marthas_favorite",
      name: "Martha's Favorite",
      description: "Don't miss any throws",
      icon: "icon-heart.png",
      unlocked: false,
    },
    SOCK_MASTER: {
      id: "sock_master",
      name: "Sock Master",
      description: "Complete all 9 levels",
      icon: "icon-crown.png",
      unlocked: false,
    },
    DEADEYE: {
      id: "deadeye",
      name: "Lint Lord",
      description: "Hit Martha 10 times in a row",
      icon: "icon-hat.png",
      unlocked: false,
    },
    QUICK_HANDS: {
      id: "quick_hands",
      name: "Quick Hands",
      description: "Match 5 pairs in 15 seconds",
      icon: "icon-hands.png",
      unlocked: false,
    },
    STREAK_KING: {
      id: "streak_king",
      name: "Streak King",
      description: "Get a 5x match streak",
      icon: "icon-fire2.png",
      unlocked: false,
    },
    NEW_GAME_PLUS_HERO: {
      id: "new_game_plus_hero",
      name: "NEW GAME+ Hero",
      description: "Complete any level on +1 difficulty",
      icon: "icon-star.png",
      unlocked: false,
    },
    ULTIMATE_CHAMPION: {
      id: "ultimate_champion",
      name: "Ultimate Champion",
      description: "Complete all levels on +4 difficulty",
      icon: "icon-trophy.png",
      unlocked: false,
    },
    SPEED_DEMON: {
      id: "speed_demon",
      name: "Speed Demon",
      description: "Match all socks in under 10 seconds",
      icon: "icon-clock.png",
      unlocked: false,
    },
    SOCK_SNIPER: {
      id: "sock_sniper",
      name: "Sock Sniper",
      description: "Hit Martha with 3 perfect throws in a row",
      icon: "icon-bullseye.png",
      unlocked: false,
    },
    COMBO_MASTER: {
      id: "combo_master",
      name: "Combo Master",
      description: "Get a 10x match streak",
      icon: "icon-fire3.png",
      unlocked: false,
    },
    EVICTION_NOTICE: {
      id: "eviction_notice",
      name: "Eviction Notice",
      description: "Lose a level",
      icon: "icon-redx.png",
      unlocked: false,
    },
    SOCK_HOARDER: {
      id: "sock_hoarder",
      name: "Sock Hoarder",
      description: "Match 100 socks total",
      icon: "icon-sock.png",
      unlocked: false,
    },
    DEEP_POCKETS: {
      id: "deep_pockets",
      name: "Deep Pockets",
      description: "Have 500 money at once",
      icon: "icon-money.png",
      unlocked: false,
    },
    BIG_SPENDER: {
      id: "big_spender",
      name: "Big Spender",
      description: "Spend 1000 money total",
      icon: "icon-goldbar.png",
      unlocked: false,
    },
    MARTHAS_MILLIONAIRE: {
      id: "marthas_millionaire",
      name: "Martha's Millionaire",
      description: "Earn 2000 sockballs total (lifetime)",
      icon: "icon-diamond.png",
      unlocked: false,
    },
    HALFWAY_THERE: {
      id: "halfway_there",
      name: "Halfway There",
      description: "Complete levels 1-5",
      icon: "icon-glass.png",
      unlocked: false,
    },
    VETERAN_TENANT: {
      id: "veteran_tenant",
      name: "Veteran Tenant",
      description: "Play 50 levels (including replays)",
      icon: "icon-house.png",
      unlocked: false,
    },
    EASTER_EGG_HUNTER: {
      id: "easter_egg_hunter",
      name: "Easter Egg Hunter",
      description: "Unlock the easter egg",
      icon: "icon-egg.png",
      unlocked: false,
    },
    SOCKBALL_WIZARD: {
      id: "sockball_wizard",
      name: "Sockball Wizard",
      description: "Use the easter egg to create 10 sockballs",
      icon: "icon-wizard.png",
      unlocked: false,
    },
    LOGO_CLICKER: {
      id: "logo_clicker",
      name: "Logo Clicker",
      description: "Click the logo 10 times",
      icon: "icon-mouse.png",
      unlocked: false,
    },
    BUTTERFINGERS: {
      id: "butterfingers",
      name: "Butterfingers",
      description: "Miss 5 throws in a row",
      icon: "icon-butter.png",
      unlocked: false,
    },
    BANK_SHOT: {
      id: "bank_shot",
      name: "Bank Shot",
      description: "Bounce off a wall and hit Martha",
      icon: "icon-coin.png",
      unlocked: false,
    },
    PINBALL_WIZARD: {
      id: "pinball_wizard",
      name: "Pinball Wizard",
      description: "Get 3 wall bounce catches in one level",
      icon: "icon-demon.png",
      unlocked: false,
    },
    PINBALL_KING: {
      id: "pinball_king",
      name: "Pinball King",
      description: "Get 25 total wall bounce catches (lifetime)",
      icon: "icon-trophy.png",
      unlocked: false,
    },
    BONUS_HUNTER: {
      id: "bonus_hunter",
      name: "Bonus Hunter",
      description: "Hit Martha with a bonus sockball",
      icon: "icon-fire1.png",
      unlocked: false,
    },
    BONUS_MASTER: {
      id: "bonus_master",
      name: "Bonus Master",
      description: "Get 10 bonus hits (lifetime)",
      icon: "icon-fire3.png",
      unlocked: false,
    },
  },

  STORY_SLIDES: [
    {
      id: "meet_martha",
      title: "Meet Martha",
      text: "This is Martha, your landlord. She loves three things: raising rent, collecting rent, and socks. Unfortunately, you're the one paying.",
      image: "htp-1.png",
      spritesheet: "MARTHA_STORY1_SPRITESHEET",
    },
    {
      id: "rent_problem",
      title: "The Rent Problem",
      text: "Bad news: your rent is due. Worse news: Martha doesn't want cash anymore—she wants sockballs. Bundles of two matching socks that she swears are 'the only valid currency left.'",
      image: "htp-2.png",
      spritesheet: "MARTHA_STORY2_SPRITESHEET",
    },
    {
      id: "sock_power",
      title: "Sock Power",
      text: "Turns out, matching two socks creates a sockball—a surprisingly potent fusion of fabric, static, and stress. Match fast, or Martha starts tapping her foot.",
      image: "htp-3.png",
      spritesheet: "MARTHA_STORY3_SPRITESHEET",
    },
    {
      id: "how_to_play",
      title: "How to Play",
      text: "Select the pile to reveal socks, match pairs to create sockballs, then toss them at Martha before she loses patience. Hit her center mass for bonus points — face shots still count!",
      image: "htp-4.png",
      spritesheet: "MARTHA_STORY4_SPRITESHEET",
    },
    {
      id: "good_luck",
      title: "Good Luck",
      text: "Keep up the good throws, pay your rent in sockballs, and maybe — just maybe — Martha won't raise rent again next week. Or she will. She usually does.",
      image: "htp-5.png",
      spritesheet: "MARTHA_STORY5_SPRITESHEET",
    },
  ],

  // Encouraging feedback messages
  ENCOURAGEMENT_MESSAGES: {
    PERFECT_CATCH: [
      "Incredible aim!",
      "You're a natural!",
      "Amazing throw!",
      "Perfect shot!",
      "That was beautiful!",
    ],
    GOOD_CATCH: [
      "Great throw!",
      "Nice one!",
      "Well done!",
      "Keep it up!",
      "Excellent!",
    ],
    MATCH_MADE: [
      "Nice match!",
      "Great pairing!",
      "You're doing great!",
      "Keep matching!",
      "Fantastic!",
    ],
    LEVEL_START: [
      "You can do this!",
      "Let's go!",
      "Time to shine!",
      "Show me what you got!",
      "Ready to rock!",
    ],
    STRUGGLING: [
      "Keep trying!",
      "You're getting there!",
      "Don't give up!",
      "You've got this!",
      "Stay focused!",
    ],
    LEVEL_COMPLETE: [
      "You're amazing!",
      "Fantastic work!",
      "You did it!",
      "Incredible job!",
      "You're the best!",
    ],
  },

  // Get random encouragement message
  getRandomEncouragement: function (category) {
    const messages = this.ENCOURAGEMENT_MESSAGES[category] || [];
    if (messages.length === 0) return "";
    return messages[Math.floor(Math.random() * messages.length)];
  },

  // Martha's Sockball Saga - Unlockable Story Panels
  STORY_PANELS: [
    {
      id: "panel_1",
      title: "The Collection",
      text: "Before she was your landlord, she was Marthilda Socksworth III, heiress to the Socksworth Sockball fortune—a glittering empire of luxury stress-toys for stressed-out fantasy executives. But she always dreamed of something bigger… literally.",
      image: "story-1.png",
      spritesheet: "MARTHA_UNLOCK1_SPRITESHEET",
    },
    {
      id: "panel_2",
      title: "The Incident",
      text: "It all unraveled when a prototype sockball exploded at the factory. The enchanted fibers compressed Marthilda's entire body down to half size. Her family said, 'Well, she's easier to store.' She said, 'You'll regret folding me away.'",
      image: "story-2.png",
      spritesheet: "MARTHA_UNLOCK2_SPRITESHEET",
    },
    {
      id: "panel_3",
      title: "The Betrayal",
      text: "Her cousin Reginald seized the company, rebranded it Reginald's Remarkable Sockballs, and kicked Martha out for being 'too small to manage big business.' She swore revenge—not on him directly, but on every sockball that reminded her of him.",
      image: "story-3.png",
      spritesheet: "MARTHA_UNLOCK3_SPRITESHEET",
    },
    {
      id: "panel_4",
      title: "The Property Scheme",
      text: "With her shrunken inheritance, Martha bought the cheapest building in town—haunted, leaning, and allegedly cursed. She evicted the ghosts within a day (they left politely). Her plan: rebuild her sockball empire, one rent payment at a time.",
      image: "story-4.png",
      spritesheet: "MARTHA_UNLOCK4_SPRITESHEET",
    },
    {
      id: "panel_5",
      title: "The Science",
      text: "Late at night, she experimented with sockball physics. If thrown with exact velocity and perfect spin, they released something she called 'size essence.' Hence the rent policy: every sockball you throw helps fund her… personal expansion project.",
      image: "story-5.png",
      spritesheet: "MARTHA_UNLOCK5_SPRITESHEET",
    },
    {
      id: "panel_6",
      title: "The Secret Lab",
      text: "Hidden behind the drywall of your apartment is a labyrinth of pipes, beakers, and laundry chutes—Martha's Sockball Research Facility. Those 'maintenance visits'? She's collecting data on your matching speed. And possibly your detergent choices.",
      image: "story-6.png",
      spritesheet: "MARTHA_STORY6_SPRITESHEET",
    },
    {
      id: "panel_7",
      title: "The Competition",
      text: "Martha claims Reginald is building a sockball factory right across town. She says his socks smell of betrayal and cheap fabric softener. No one's seen him yet—but every time a new sock pattern shows up, she glares at the ceiling and whispers, 'Nice try, Reggie.'",
      image: "story-7.png",
      spritesheet: "MARTHA_UNLOCK7_SPRITESHEET",
    },
    {
      id: "panel_8",
      title: "The Truth",
      text: "Martha doesn't dodge your throws—she's trying to catch them. Her arms are just tragically short. When a sockball hits her square in the chest, she beams with pride. When it hits her face, she just laughs and mutters, 'Reggie could never aim like that.' Turns out, every throw—face shot included—helps her absorb more sockball magic.",
      image: "story-8.png",
      spritesheet: "MARTHA_UNLOCK8_SPRITESHEET",
    },
    {
      id: "panel_9",
      title: "The Transformation",
      text: "At last, her collection is complete. Thousands of sockballs whirl around her in a glowing cyclone. Then—FLASH!—she grows half an inch taller. 'HALF AN INCH?!' she roars. She raises your rent by 50%. Congratulations, you've unlocked New Game+ and eternal tenancy.",
      image: "story-9.png",
      spritesheet: "MARTHA_UNLOCK9_SPRITESHEET",
    },
  ],
};
