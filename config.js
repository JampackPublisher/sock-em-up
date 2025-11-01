// Default animation frames for full 36-frame spritesheets (0-35)
const DEFAULT_SPRITESHEET_FRAMES = [
  0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21,
  22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
];

const GameConfig = {
  // ========== DEVELOPER MODE ==========
  // Set to true to unlock all levels and difficulties for QA/testing
  DEV_MODE: false,

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
    frameWidth: 269,
    frameHeight: 275,
  },

  MARTHA_LAUGHING_SPRITESHEET: {
    filename: "martha-laughing-spritesheet.png",
    frameWidth: 202,
    frameHeight: 283,
    fps: 24,
  },

  MARTHA_SOCKBALLS_SPRITESHEET: {
    filename: "martha-sockballs-spritesheet.png",
    frameWidth: 215,
    frameHeight: 321,
  },

  MARTHA_LOSING_SPRITESHEET: {
    filename: "martha-losing-spritesheet.png",
    frameWidth: 173,
    frameHeight: 263,
  },

  MARTHA_RUMBLE_SPRITESHEET: {
    filename: "martha-rumble-spritesheet.png",
    frameWidth: 253,
    frameHeight: 259,
  },

  MARTHA_FATSOP_SPRITESHEET: {
    filename: "martha-fatsop-spritesheet.png",
    frameWidth: 341,
    frameHeight: 341,
  },

  MARTHA_CRAWLING_SPRITESHEET: {
    filename: "martha-crawling-spritesheet.png",
    frameWidth: 335,
    frameHeight: 238,
  },

  MARTHA_RUMBLERUN_SPRITESHEET: {
    filename: "martha-rumblerun-spritesheet.png",
    frameWidth: 281,
    frameHeight: 275,
  },

  MARTHA_FATRUN_SPRITESHEET: {
    filename: "martha-fatrun-spritesheet.png",
    frameWidth: 361,
    frameHeight: 348,
    animationFrames: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20,
      21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 34, 33, 32,
      31, 30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14,
      13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1,
    ],
  },

  MARTHA_STORY1_SPRITESHEET: {
    filename: "martha-story1-spritesheet.png",
    frameWidth: 260,
    frameHeight: 220,
  },

  MARTHA_STORY2_SPRITESHEET: {
    filename: "martha-story2-spritesheet.png",
    frameWidth: 265,
    frameHeight: 216,
  },

  MARTHA_STORY3_SPRITESHEET: {
    filename: "martha-story3-spritesheet.png",
    frameWidth: 277,
    frameHeight: 267,
  },

  MARTHA_STORY4_SPRITESHEET: {
    filename: "martha-story4-spritesheet.png",
    frameWidth: 264,
    frameHeight: 299,
  },

  MARTHA_STORY5_SPRITESHEET: {
    filename: "martha-story5-spritesheet.png",
    frameWidth: 172,
    frameHeight: 259,
  },

  MARTHA_STORY6_SPRITESHEET: {
    filename: "martha-story6-spritesheet.png",
    frameWidth: 257,
    frameHeight: 259,
  },

  MARTHA_UNLOCK1_SPRITESHEET: {
    filename: "martha-unlock1-spritesheet.png",
    frameWidth: 268,
    frameHeight: 280,
    fps: 24,
  },

  MARTHA_UNLOCK2_SPRITESHEET: {
    filename: "martha-unlock2-spritesheet.png",
    frameWidth: 166,
    frameHeight: 269,
    fps: 24,
  },

  MARTHA_UNLOCK3_SPRITESHEET: {
    filename: "martha-unlock3-spritesheet.png",
    frameWidth: 403,
    frameHeight: 225,
    fps: 24,
  },

  MARTHA_UNLOCK4_SPRITESHEET: {
    filename: "martha-unlock4-spritesheet.png",
    frameWidth: 178,
    frameHeight: 261,
    fps: 24,
  },

  MARTHA_UNLOCK5_SPRITESHEET: {
    filename: "martha-unlock5-spritesheet.png",
    frameWidth: 339,
    frameHeight: 208,
    fps: 24,
  },

  MARTHA_UNLOCK7_SPRITESHEET: {
    filename: "martha-unlock7-spritesheet.png",
    frameWidth: 433,
    frameHeight: 383,
    fps: 24,
  },

  MARTHA_UNLOCK8_SPRITESHEET: {
    filename: "martha-unlock8-spritesheet.png",
    frameWidth: 229,
    frameHeight: 276,
    fps: 24,
  },

  MARTHA_UNLOCK9_SPRITESHEET: {
    filename: "martha-unlock9-spritesheet.png",
    frameWidth: 310,
    frameHeight: 345,
    fps: 24,
  },

  YOU_WIN_SPRITESHEET: {
    filename: "you-win-spritesheet.png",
    frameWidth: 376,
    frameHeight: 337,
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
  SOCKBALL_THROW_COOLDOWN: 750,
  SOCKBALL_LAUNCH_POSITION: { x: 50, y: 750 }, // bottom left corner

  // Martha movement patterns
  MARTHA_PATTERNS: {
    HORIZONTAL: {
      name: "horizontal",
      baseSpeed: 1,
      description: "Moves left and right",
    },
    VERTICAL: {
      name: "vertical",
      baseSpeed: 1,
      description: "Moves up and down",
    },
    DIAGONAL: {
      name: "diagonal",
      baseSpeed: 1,
      description: "Moves in diagonal patterns",
    },
    CIRCULAR: {
      name: "circular",
      baseSpeed: 1,
      description: "Moves in circular patterns",
    },
    RANDOM: {
      name: "random",
      baseSpeed: 1,
      description: "Moves randomly",
    },
    FIGURE_EIGHT: {
      name: "figure-eight",
      baseSpeed: 1,
      description: "Moves in a figure-8 pattern",
    },
    ZIGZAG_HORIZONTAL: {
      name: "zigzag-horizontal",
      baseSpeed: 1,
      description: "Zigzags horizontally across the screen",
    },
    ZIGZAG_VERTICAL: {
      name: "zigzag-vertical",
      baseSpeed: 1,
      description: "Zigzags vertically down the screen",
    },
    SPIRAL: {
      name: "spiral",
      baseSpeed: 1,
      description: "Spirals outward or inward",
    },
    BOUNCE: {
      name: "bounce",
      baseSpeed: 1,
      description: "Bounces around like a DVD screensaver",
    },
    SQUARE: {
      name: "square",
      baseSpeed: 1,
      description: "Moves in a square pattern",
    },
    WAVE: {
      name: "wave",
      baseSpeed: 1,
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
    {
      marthaSpeed: 0.7,
      sockPairs: 3,
      typesAvailable: [1],
      matchingTime: 12,
      marthaWantsSockballs: 1,
      marthaPatterns: ["horizontal", "vertical"],
    },
    {
      marthaSpeed: 0.75,
      sockPairs: 4,
      typesAvailable: [1, 2],
      matchingTime: 15,
      marthaWantsSockballs: 2,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "zigzag-horizontal",
        "zigzag-vertical",
      ],
    },
    {
      marthaSpeed: 0.8,
      sockPairs: 6,
      typesAvailable: [1, 2, 3],
      matchingTime: 22,
      marthaWantsSockballs: 3,
      marthaPatterns: [
        "square",
        "zigzag-horizontal",
        "zigzag-vertical",
        "diagonal",
        "circular",
        "spiral",
        "figure-eight",
      ],
    },
    {
      marthaSpeed: 0.85,
      sockPairs: 8,
      typesAvailable: [1, 2, 3, 4],
      matchingTime: 30,
      marthaWantsSockballs: 5,
      marthaPatterns: [
        "zigzag-horizontal",
        "square",
        "spiral",
        "diagonal",
        "circular",
        "wave",
      ],
    },
    {
      marthaSpeed: 0.9,
      sockPairs: 10,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 34,
      marthaWantsSockballs: 7,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "square",
        "figure-eight",
      ],
    },
    {
      marthaSpeed: 0.95,
      sockPairs: 12,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 45,
      marthaWantsSockballs: 9,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "wave",
        "square",
        "figure-eight",
        "zigzag-horizontal",
        "bounce",
      ],
    },
    {
      marthaSpeed: 0.98,
      sockPairs: 12,
      typesAvailable: [2, 3, 4, 5],
      matchingTime: 40,
      marthaWantsSockballs: 9,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "wave",
        "spiral",
        "figure-eight",
        "zigzag-horizontal",
        "zigzag-vertical",
      ],
    },
    {
      marthaSpeed: 1,
      sockPairs: 20,
      typesAvailable: [1, 2, 3, 4, 5],
      matchingTime: 60,
      marthaWantsSockballs: 15,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "wave",
        "figure-eight",
        "zigzag-horizontal",
        "zigzag-vertical",
        "spiral",
      ],
    },
    {
      marthaSpeed: 1,
      sockPairs: 18,
      typesAvailable: [1, 2, 3, 4, 5, 6],
      matchingTime: 60,
      marthaWantsSockballs: 15,
      marthaPatterns: [
        "horizontal",
        "vertical",
        "diagonal",
        "circular",
        "figure-eight",
        "zigzag-horizontal",
        "zigzag-vertical",
        "spiral",
        "bounce",
        "square",
        "wave",
      ],
    },
  ],

  // Level costs and unlock data
  // Smoothed progression: easier early game, better scaling for NEW GAME+ difficulties
  LEVEL_COSTS: [0, 30, 60, 90, 140, 180, 225, 250, 300],

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
      "martha-demand-level-select.png",
      "martha-running-spritesheet.png",
      "martha-laughing-spritesheet.png",
      "martha-sockballs-spritesheet.png",
      "martha-losing-spritesheet.png",
      "martha-rumble-spritesheet.png",
      "martha-fatsop-spritesheet.png",
      "martha-crawling-spritesheet.png",
      "martha-fatrun-spritesheet.png",
      "martha-rumblerun-spritesheet.png",
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
      "logo.png",
      "star.png",
      "throw-bg.jpg",
      "throw-bg-2.jpg",
      "throw-bg-5.jpg",
      "throw-bg-9.jpg",
      "level-select-bg.jpg",
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
      "icon-diamondtrophy.png",
      "icon-goblin.png",
      "icon-eyeball.png",
      "icon-poke.png",
      "icon-diamondsock.png",
      "icon-fullwizard.png",
      "icon-teeth.png",
      "icon-vhs.png",
      "icon-tv.png",
      "icon-wand.png",
      "icon-brain.png",
      "icon-asteroid.png",
      "icon-musicnote.png",
      "icon-record.png",
      "icon-radio.png",
      "icon-cdplayer.png",

      "icon-housefire.png",
      "icon-sonic.png",
      "icon-shoes.png",
      "icon-stroller.png",
      "icon-wall.png",
      "icon-book.png",
      "icon-barbell.png",
      "icon-heartbreak.png",

      "icon-shock.png",
      "icon-beetle.png",
      "icon-crying.png",
      "icon-goldensocks.png",
      "icon-thumbsdown.png",
      "icon-thumbsup.png",
      "icon-upset.png",
      "icon-wolf.png",

      "icon-skull.png",
      "icon-snappy.png",
      "icon-goldsnap.png",
      "icon-diamondsnap.png",
      "icon-goldenorb.png",
      "icon-diamondheart.png",
      "icon-stagbeetle.png",
      "icon-gift.png",
      "icon-gauntlet.png",
      "icon-washingmac.png",
      "icon-mismatchsock.png",
      "icon-laundrypile.png",
      "icon-basket.png",

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
      "btn-favorite.png",
      "btn-repeat.png",
      "btn-shuffle.png",
      "btn-audioplayer.png",
      "btn-audioback.png",
      "btn-audionext.png",
      "btn-audiopause.png",
      "btn-audioplay.png",

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
    PERFECT_CATCH_THRESHOLD: 0.45,
    GOOD_CATCH_THRESHOLD: 1.1,
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
      throwSpeedMultiplier: 1.0,
      catchRadiusMultiplier: 1.0,
      displayName: "Normal",
      stars: 0,
    },
    PLUS_1: {
      name: "NEW GAME+1",
      speedMultiplier: 1.3,
      timeMultiplier: 0.9,
      throwCooldownMultiplier: 0.9,
      throwSpeedMultiplier: 1.1,
      catchRadiusMultiplier: 0.85,
      displayName: "★",
      stars: 1,
    },
    PLUS_2: {
      name: "NEW GAME+2",
      speedMultiplier: 1.5,
      timeMultiplier: 0.82,
      throwCooldownMultiplier: 0.85,
      throwSpeedMultiplier: 1.2,
      catchRadiusMultiplier: 0.75,
      displayName: "★★",
      stars: 2,
    },
    PLUS_3: {
      name: "NEW GAME+3",
      speedMultiplier: 1.75,
      timeMultiplier: 0.78,
      throwCooldownMultiplier: 0.75,
      throwSpeedMultiplier: 1.4,
      catchRadiusMultiplier: 0.6,
      displayName: "★★★",
      stars: 3,
    },
    PLUS_4: {
      name: "NEW GAME+4",
      speedMultiplier: 1.85,
      timeMultiplier: 0.75,
      throwCooldownMultiplier: 0.5,
      throwSpeedMultiplier: 1.7,
      catchRadiusMultiplier: 0.45,
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
    const flatIncrease = 30; // Add 30 per difficulty level
    return baseCost + difficulty * flatIncrease;
  },

  // Calculate catch quality points adjusted for difficulty
  // Higher difficulties reward more points for good throws
  getCatchQualityPoints: function (quality, difficulty = 0) {
    const pointsByDifficulty = {
      0: { nice: 5, good: 10, perfect: 15 }, // Normal
      1: { nice: 6, good: 12, perfect: 18 }, // +1
      2: { nice: 8, good: 15, perfect: 22 }, // +2
      3: { nice: 10, good: 20, perfect: 30 }, // +3
      4: { nice: 15, good: 30, perfect: 45 }, // +4
    };

    const difficultyPoints =
      pointsByDifficulty[Math.min(difficulty, 4)] || pointsByDifficulty[0];

    if (quality === "perfect" || quality === "PERFECT")
      return difficultyPoints.perfect;
    if (quality === "good" || quality === "GOOD") return difficultyPoints.good;
    if (quality === "nice" || quality === "regular" || quality === "REGULAR")
      return difficultyPoints.nice;

    return difficultyPoints.nice; // Default to nice/regular
  },

  // Level background mappings
  LEVEL_BACKGROUNDS: [
    "throw-bg.jpg", // Level 1
    "throw-bg.jpg", // Level 2
    "throw-bg-2.jpg", // Level 3
    "throw-bg-2.jpg", // Level 4
    "throw-bg-5.jpg", // Level 5
    "throw-bg-5.jpg", // Level 6
    "throw-bg-9.jpg", // Level 7
    "throw-bg-9.jpg", // Level 8
    "throw-bg-9.jpg", // Level 9
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
      name: "Speed Demon",
      description: "15+ seconds remaining",
      icon: "icon-demon.png",
      unlocked: false,
      threshold: 15,
    },
    MARTHAS_FAVORITE: {
      id: "marthas_favorite",
      name: "Martha's Favorite",
      description: "Don't miss any throws on level 9",
      icon: "icon-heart.png",
      unlocked: false,
    },
    SOCK_MASTER: {
      id: "sock_master",
      name: "Sock Master",
      description: "Complete all 9 levels",
      icon: "icon-crown.png",
      unlocked: false,
      threshold: 9,
    },
    DEADEYE: {
      id: "deadeye",
      name: "Lint Lord",
      description: "Hit Martha 10 times in a row",
      icon: "icon-hat.png",
      unlocked: false,
      threshold: 10,
    },
    QUICK_HANDS: {
      id: "quick_hands",
      name: "Quick Hands",
      description: "Match 5 pairs in 14 seconds",
      icon: "icon-hands.png",
      unlocked: false,
      pairs: 5,
      timeLimit: 14,
    },
    STREAK_KING: {
      id: "streak_king",
      name: "Streak King",
      description: "Get a 10x match streak",
      icon: "icon-fire2.png",
      unlocked: false,
      threshold: 10,
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
      icon: "icon-diamondtrophy.png",
      unlocked: false,
    },
    SPEED_DEMON: {
      id: "speed_demon",
      name: "Speedy Matcher",
      description: "10+ seconds remaining",
      icon: "icon-clock.png",
      unlocked: false,
      threshold: 10,
    },
    SOCK_SNIPER: {
      id: "sock_sniper",
      name: "Sock Sniper",
      description: "Hit Martha with 3 perfect throws in a row",
      icon: "icon-bullseye.png",
      unlocked: false,
      threshold: 3,
    },
    COMBO_MASTER: {
      id: "combo_master",
      name: "Combo Master",
      description: "Get a 18x match streak",
      icon: "icon-brain.png",
      unlocked: false,
      threshold: 18,
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
      description: "Match 500 socks total",
      icon: "icon-washingmac.png",
      unlocked: false,
      threshold: 500,
    },
    DEEP_POCKETS: {
      id: "deep_pockets",
      name: "Deep Pockets",
      description: "Have 9999+ money at once",
      icon: "icon-money.png",
      unlocked: false,
      threshold: 9999,
    },
    BIG_SPENDER: {
      id: "big_spender",
      name: "Big Spender",
      description: "Spend 7500 money total",
      icon: "icon-goldbar.png",
      unlocked: false,
      threshold: 7500,
    },
    MARTHAS_MILLIONAIRE: {
      id: "marthas_millionaire",
      name: "Martha's Millionaire",
      description: "Earn 1000 sockballs total",
      icon: "icon-diamondsock.png",
      unlocked: false,
      threshold: 1000,
    },
    HALFWAY_THERE: {
      id: "halfway_there",
      name: "Halfway There",
      description: "Complete levels 1-5",
      icon: "icon-glass.png",
      unlocked: false,
      threshold: 5,
    },
    VETERAN_TENANT: {
      id: "veteran_tenant",
      name: "Veteran Tenant",
      description: "Play 50 levels (including replays)",
      icon: "icon-house.png",
      unlocked: false,
      threshold: 50,
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
      threshold: 10,
    },
    LOGO_CLICKER: {
      id: "logo_clicker",
      name: "Logo Clicker",
      description: "Click the logo 25 times",
      icon: "icon-mouse.png",
      unlocked: false,
      threshold: 25,
    },
    BUTTERFINGERS: {
      id: "butterfingers",
      name: "Butterfingers",
      description: "Miss 5 throws in a row",
      icon: "icon-butter.png",
      unlocked: false,
      threshold: 5,
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
      icon: "icon-fullwizard.png",
      unlocked: false,
      threshold: 3,
    },
    PINBALL_KING: {
      id: "pinball_king",
      name: "Pinball King",
      description: "Get 25 total wall bounce catches",
      icon: "icon-trophy.png",
      unlocked: false,
      threshold: 25,
    },
    BONUS_HUNTER: {
      id: "bonus_hunter",
      name: "Bonus Hunter",
      description: "Hit Martha with a bonus sockball",
      icon: "icon-goblin.png",
      unlocked: false,
    },
    BONUS_MASTER: {
      id: "bonus_master",
      name: "Bonus Master",
      description: "Get 10 bonus hits",
      icon: "icon-poke.png",
      unlocked: false,
      threshold: 10,
    },
    HOW_DID_YOU: {
      id: "how_did_you",
      name: "How Did You...",
      description: "Double bounce before hitting Martha",
      icon: "icon-wand.png",
      unlocked: false,
    },
    SPACE_SHOOTER: {
      id: "space_shooter",
      name: "Space Shooter",
      description: "Double bounce before hitting Martha 10 times",
      icon: "icon-asteroid.png",
      unlocked: false,
      threshold: 10,
    },
    THATS_NOT_POSSIBLE: {
      id: "thats_not_possible",
      name: "That's Not Possible",
      description: "Hit Martha with a sockball that bounced 3+ times",
      icon: "icon-shock.png",
      unlocked: false,
      bounceThreshold: 3,
    },
    SECRET_VIDEO_WATCHER: {
      id: "secret_video_watcher",
      name: "Secret Video Watcher",
      description: "Watch a secret bonus video",
      icon: "icon-vhs.png",
      unlocked: false,
    },
    VIDEO_COMPLETIONIST: {
      id: "video_completionist",
      name: "Video Completionist",
      description: "Watch all secret bonus videos",
      icon: "icon-tv.png",
      unlocked: false,
      threshold: 5,
    },
    PERFECT_TIMING: {
      id: "perfect_timing",
      name: "Nail Biter",
      description: "Finish matching with exactly 0 seconds left",
      icon: "icon-teeth.png",
      unlocked: false,
    },
    MOMENTUM_KILLER: {
      id: "momentum_killer",
      name: "Momentum Killer",
      description: "Break a 15+ match streak by missing a match",
      icon: "icon-wall.png",
      unlocked: false,
      threshold: 15,
    },
    BABY_SPEED_RUN: {
      id: "baby_speed_run",
      name: "Baby Speed Run",
      description: "Win 3 levels in a row",
      icon: "icon-stroller.png",
      unlocked: false,
      threshold: 3,
    },
    SPEED_RUN: {
      id: "speed_run",
      name: "Speed Run",
      description: "Win 9 levels in a row",
      icon: "icon-shoes.png",
      unlocked: false,
      threshold: 9,
    },
    SPEED_ROYALTY: {
      id: "speed_royalty",
      name: "Speed Royalty",
      description: "Win 18 levels in a row",
      icon: "icon-sonic.png",
      unlocked: false,
      threshold: 18,
    },
    TRIAL_BY_FIRE: {
      id: "trial_by_fire",
      name: "Trial By Fire",
      description: "Complete level 9 on +2 difficulty",
      icon: "icon-housefire.png",
      unlocked: false,
    },
    DISASTER_PRONE: {
      id: "disaster_prone",
      name: "Disaster Prone",
      description: "Lose 10 times total",
      icon: "icon-heartbreak.png",
      unlocked: false,
      threshold: 10,
    },
    LORE_MASTER: {
      id: "lore_master",
      name: "Lore Master",
      description: "Unlock and read all 9 story panels",
      icon: "icon-book.png",
      unlocked: false,
      threshold: 9,
    },
    GRIND_MASTER: {
      id: "grind_master",
      name: "Grind Master",
      description: "Complete 100 total levels",
      icon: "icon-barbell.png",
      unlocked: false,
      threshold: 100,
    },
    MY_FAVORITE: {
      id: "my_favorite",
      name: "My Favorite",
      description: "Favorite a song and play it",
      icon: "icon-musicnote.png",
      unlocked: false,
    },
    CD_PLAYER: {
      id: "cd_player",
      name: "CD Player",
      description: "Open the audio player and play a song",
      icon: "icon-cdplayer.png",
      unlocked: false,
    },
    THATS_MY_SONG: {
      id: "thats_my_song",
      name: "That's My Song",
      description: "Listen to a single song 10 times",
      icon: "icon-record.png",
      unlocked: false,
      threshold: 10,
    },
    AUDIOPHILE: {
      id: "audiophile",
      name: "Audiophile",
      description: "Unlock and listen to all songs",
      icon: "icon-radio.png",
      unlocked: false,
    },
    PERFECT_BOUNCE_SHOT: {
      id: "perfect_bounce_shot",
      name: "Perfect Bounce Shot",
      description: "Get a perfect from a bounce shot",
      icon: "icon-gift.png",
      unlocked: false,
    },
    KINDA_PERFECT: {
      id: "kinda_perfect",
      name: "Kinda Perfect",
      description: "25 total perfects",
      icon: "icon-goldensocks.png",
      unlocked: false,
      threshold: 25,
    },
    PERFECTION: {
      id: "perfection",
      name: "Perfection",
      description: "100 perfect shots",
      icon: "icon-diamondheart.png",
      unlocked: false,
      threshold: 100,
    },
    GOOD_ENOUGH: {
      id: "good_enough",
      name: "Good Enough",
      description: "250 good shots",
      icon: "icon-thumbsup.png",
      unlocked: false,
      threshold: 250,
    },
    FLUBBED_IT: {
      id: "flubbed_it",
      name: "Flubbed It",
      description: "Miss on the final sockball when you would have won",
      icon: "icon-thumbsdown.png",
      unlocked: false,
    },
    FLUB_KING: {
      id: "flub_king",
      name: "Flub King",
      description: "Flub 5 times",
      icon: "icon-upset.png",
      unlocked: false,
      threshold: 5,
    },
    PINCER: {
      id: "pincer",
      name: "Pincer",
      description: "Hit Martha within 0.5 seconds with 2 sockballs",
      icon: "icon-beetle.png",
      unlocked: false,
      timeWindow: 0.65, // seconds
    },
    PINCER_ADDICT: {
      id: "pincer_addict",
      name: "Pincer Addict",
      description: "Do 5 lifetime pincers",
      icon: "icon-stagbeetle.png",
      unlocked: false,
      threshold: 5,
    },
    NO_HOPE: {
      id: "no_hope",
      name: "Lone Wolf",
      description: "Miss 10 sockballs in a single game",
      icon: "icon-wolf.png",
      unlocked: false,
      threshold: 10,
    },
    MISS_MISS_MISS: {
      id: "miss_miss_miss",
      name: "Miss Miss Miss",
      description: "Miss 100 sockballs",
      icon: "icon-skull.png",
      unlocked: false,
      threshold: 100,
    },
    MISMATCHED: {
      id: "mismatched",
      name: "Mismatched",
      description: "Mismatch a pair of socks",
      icon: "icon-crying.png",
      unlocked: false,
    },
    MISMATCH_CHAOS: {
      id: "mismatch_chaos",
      name: "Mismatch Chaos",
      description: "Mismatch 5 times in a single level",
      icon: "icon-mismatchsock.png",
      unlocked: false,
      threshold: 5,
    },
    MISMATCH_QUEEN: {
      id: "mismatch_queen",
      name: "Mismatch Queen",
      description: "Mismatch 25 times lifetime",
      icon: "icon-laundrypile.png",
      unlocked: false,
      threshold: 25,
    },
    ONE_AT_A_TIME: {
      id: "one_at_a_time",
      name: "One at a Time",
      description: "Match the same sock type 4x in a row",
      icon: "icon-basket.png",
      unlocked: false,
      threshold: 4,
    },
    SNAPPY: {
      id: "snappy",
      name: "Snappy",
      description: "Finish a pair without dragging - click only",
      icon: "icon-snappy.png",
      unlocked: false,
    },
    PURE_SNAP: {
      id: "pure_snap",
      name: "Pure Snap",
      description: "Match a pair with both socks placed without dragging",
      icon: "icon-diamondsnap.png",
      unlocked: false,
    },
    DOUBLE_SNAP: {
      id: "double_snap",
      name: "Double Snap",
      description: "Get 2 snap placements in 1 game",
      icon: "icon-goldsnap.png",
      unlocked: false,
      threshold: 2,
    },
    SNAP_MASTER: {
      id: "snap_master",
      name: "Snap Master",
      description: "Get 10 snap placements total",
      icon: "icon-gauntlet.png",
      unlocked: false,
      threshold: 10,
    },
  },

  STORY_SLIDES: [
    {
      id: "meet_martha",
      title: "Meet Martha",
      text: "This is Martha, your landlord. She loves three things: raising rent, collecting rent, and socks. Unfortunately, you're the one paying.",
      spritesheet: "MARTHA_STORY1_SPRITESHEET",
    },
    {
      id: "rent_problem",
      title: "The Rent Problem",
      text: "Bad news: your rent is due. Worse news: Martha doesn't want cash anymore—she wants sockballs. Bundles of two matching socks that she swears are 'the only valid currency left.'",
      spritesheet: "MARTHA_STORY2_SPRITESHEET",
    },
    {
      id: "sock_power",
      title: "Sock Power",
      text: "Turns out, matching two socks creates a sockball—a surprisingly potent fusion of fabric, static, and stress. Match fast, or Martha starts tapping her foot.",
      spritesheet: "MARTHA_STORY3_SPRITESHEET",
    },
    {
      id: "how_to_play",
      title: "How to Play",
      text: "Select the pile to reveal socks, match pairs to create sockballs, then toss them at Martha before she loses patience. Hit her center mass for bonus points — face shots still count!",
      spritesheet: "MARTHA_STORY4_SPRITESHEET",
    },
    {
      id: "good_luck",
      title: "Good Luck",
      text: "Keep up the good throws, pay your rent in sockballs, and maybe — just maybe — Martha won't raise rent again next week. Or she will. She usually does.",
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
      spritesheet: "MARTHA_UNLOCK1_SPRITESHEET",
    },
    {
      id: "panel_2",
      title: "The Incident",
      text: "It all unraveled when a prototype sockball exploded at the factory. The enchanted fibers compressed Marthilda's entire body down to half size. Her family said, 'Well, she's easier to store.' She said, 'You'll regret folding me away.'",
      spritesheet: "MARTHA_UNLOCK2_SPRITESHEET",
    },
    {
      id: "panel_3",
      title: "The Betrayal",
      text: "Her cousin Reginald seized the company, rebranded it Reginald's Remarkable Sockballs, and kicked Martha out for being 'too small to manage big business.' She swore revenge—not on him directly, but on every sockball that reminded her of him.",
      spritesheet: "MARTHA_UNLOCK3_SPRITESHEET",
    },
    {
      id: "panel_4",
      title: "The Property Scheme",
      text: "With her shrunken inheritance, Martha bought the cheapest building in town—haunted, leaning, and allegedly cursed. She evicted the ghosts within a day (they left politely). Her plan: rebuild her sockball empire, one rent payment at a time.",
      spritesheet: "MARTHA_UNLOCK4_SPRITESHEET",
    },
    {
      id: "panel_5",
      title: "The Science",
      text: "Late at night, she experimented with sockball physics. If thrown with exact velocity and perfect spin, they released something she called 'size essence.' Hence the rent policy: every sockball you throw helps fund her… personal expansion project.",
      spritesheet: "MARTHA_UNLOCK5_SPRITESHEET",
    },
    {
      id: "panel_6",
      title: "The Secret Lab",
      text: "Hidden behind the drywall of your apartment is a labyrinth of pipes, beakers, and laundry chutes—Martha's Sockball Research Facility. Those 'maintenance visits'? She's collecting data on your matching speed. And possibly your detergent choices.",
      spritesheet: "MARTHA_STORY6_SPRITESHEET",
    },
    {
      id: "panel_7",
      title: "The Competition",
      text: "Martha claims Reginald is building a sockball factory right across town. She says his socks smell of betrayal and cheap fabric softener. No one's seen him yet—but every time a new sock pattern shows up, she glares at the ceiling and whispers, 'Nice try, Reggie.'",
      spritesheet: "MARTHA_UNLOCK7_SPRITESHEET",
    },
    {
      id: "panel_8",
      title: "The Truth",
      text: "Martha doesn't dodge your throws—she's trying to catch them. Her arms are just tragically short. When a sockball hits her square in the chest, she beams with pride. When it hits her face, she just laughs and mutters, 'Reggie could never aim like that.' Turns out, every throw—face shot included—helps her absorb more sockball magic.",
      spritesheet: "MARTHA_UNLOCK8_SPRITESHEET",
    },
    {
      id: "panel_9",
      title: "The Transformation",
      text: "At last, her collection is complete. Thousands of sockballs whirl around her in a glowing cyclone. Then—FLASH!—she grows half an inch taller. 'HALF AN INCH?!' she roars. She raises your rent by 50%. Congratulations, you've unlocked New Game+ and eternal tenancy.",
      spritesheet: "MARTHA_UNLOCK9_SPRITESHEET",
    },
  ],
};

// Apply defaults to spritesheets
// Default: 6x6 grid (36 frames), all frames used, 12 fps
Object.values(GameConfig).forEach((value) => {
  if (
    typeof value === "object" &&
    value !== null &&
    value.filename &&
    value.frameWidth &&
    value.frameHeight
  ) {
    // Set defaults for common spritesheet properties
    if (!value.columns) value.columns = 6;
    if (!value.rows) value.rows = 6;
    if (!value.totalFrames) value.totalFrames = 36;
    if (!value.fps) value.fps = 12;
    if (!value.animationFrames)
      value.animationFrames = DEFAULT_SPRITESHEET_FRAMES;
  }
});
