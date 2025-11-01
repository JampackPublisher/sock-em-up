class SockGame {
  constructor() {
    this.canvas = document.getElementById("gameCanvas");
    if (!this.canvas) {
      throw new Error("Canvas element 'gameCanvas' not found");
    }

    this.ctx = this.canvas.getContext("2d");
    if (!this.ctx) {
      throw new Error("Cannot get 2D context from canvas");
    }

    this.gameState = "menu";
    this.previousGameState = "menu";
    this.currentLevel = 0;
    this.playerPoints = 0;
    this.sockBalls = 0;
    this.totalSockMatches = 0; // Lifetime total sock matches across all levels
    this.matchingTime = 60;
    // Tracks elapsed time during matching phase (counts up from 0)
    this.timeElapsed = 0;
    // Track if time bonus was earned (finished before time limit)
    this.timeBonusEarned = false;

    // New achievement stat tracking
    this.totalSockballsEarned = 0; // Lifetime sockballs earned (for Martha's Millionaire)
    this.totalMoneySpent = 0; // Total money spent unlocking levels (for Big Spender)
    this.levelsPlayed = 0; // Total levels played including replays (for Veteran Tenant)
    this.totalWallBounceCatches = 0; // Lifetime wall bounce catches (for Pinball King)
    this.totalBonusHits = 0; // Lifetime bonus hits (for Bonus Master)
    this.totalDoubleBounces = 0; // Lifetime double bounce catches (for Space Shooter)
    this.consecutivePerfectThrows = 0; // Current streak of perfect throws (for Sock Sniper)
    this.consecutiveMisses = 0; // Current streak of misses (for Butterfingers)
    this.easterEggSockballsCreated = 0; // Sockballs created via easter egg (lifetime) (for Sockball Wizard)
    this.logoClickCount = 0; // Times logo has been clicked (for Logo Clicker)
    this.consecutiveLevelWins = 0; // Current streak of consecutive level wins (for speed run achievements)
    this.totalLevelsPlayed = 0; // Total levels completed (wins + losses) (for Grind Master)
    this.totalLevelLosses = 0; // Total level losses (for Disaster Prone)
    this.totalPerfectShots = 0; // Lifetime perfect shots (for Kinda Perfect, Perfection)
    this.totalGoodShots = 0; // Lifetime good shots (for Good Enough)
    this.totalFlubs = 0; // Total flubs lifetime (for Flub King)
    this.totalMisses = 0; // Total misses lifetime (for Miss Miss Miss)
    this.currentGameMisses = 0; // Misses in current level (for No Hope)
    this.totalSnapPlacements = 0; // Total snap placements lifetime (for Snap Master)
    this.currentGameSnapPlacements = 0; // Snap placements in current level (for Double Snap)
    this.lastHitTime = 0; // Timestamp of last Martha hit (for Pincer)
    this.totalPincers = 0; // Total lifetime pincers (for Pincer Addict)
    this.currentLevelMismatches = 0; // Mismatches in current level (for Mismatch Chaos)
    this.lifetimeMismatches = 0; // Total mismatches lifetime (for Mismatch Queen)
    this.currentMatchTypeStreak = []; // Array tracking recent match types for "One at a time"

    this.images = {};
    this.loadedImages = 0;
    this.totalImages = 0;

    // NEW GAME+ System - Per-difficulty tracking
    this.selectedDifficulty = 0; // Currently selected difficulty in UI (0 = base, 1-4 = +1 to +4)
    this.highestUnlockedDifficulty = 0; // 0-4 for base through +4

    // Per-difficulty level progress
    // Format: { difficulty: [unlocked levels array] }
    this.unlockedLevelsByDifficulty = {
      0: [...GameConfig.INITIAL_UNLOCKED_LEVELS], // Base game starts with level 1 unlocked
    };

    // Per-difficulty level completions
    // Format: { difficulty: [completed levels array] }
    this.completedLevelsByDifficulty = {
      0: [...GameConfig.INITIAL_COMPLETED_LEVELS],
    };

    // Legacy arrays for backwards compatibility (point to currently selected difficulty)
    // Will be updated after loadGameState() to reflect selectedDifficulty
    this.unlockedLevels = this.unlockedLevelsByDifficulty[0];
    this.completedLevels = this.completedLevelsByDifficulty[0];

    // Phase 1.2 - Enhanced save system properties
    this.currentDifficulty = 0; // Difficulty of currently playing level
    this.achievements = this.initializeAchievements();
    this.tutorialCompleted = false;
    this.storyViewed = false; // Track if intro story has been shown
    this.bestScores = {}; // Format: {levelIndex: {difficulty: score}}
    this.perfectCatchStats = {
      total: 0,
      byLevel: {},
    };

    // NEW GAME+ notification
    this.showNewGamePlusNotification = false;
    this.newGamePlusUnlockedLevel = 0; // Store which NG+ level was just unlocked (1-4)
    this.hasShownNewGamePlusBanner = [false, false, false, false]; // Track which NG+ levels have shown banner (indices 0-3 for NG+ 1-4)

    // Story panel unlocks (one per level completed)
    this.unlockedStoryPanels = Array(9).fill(false);
    this.viewedStoryPanels = Array(9).fill(false); // Track which panels have been viewed
    this.newStoryPanelUnlocked = -1; // Index of newly unlocked panel to animate

    // Secret video tracking (videos 0-4: base game + NG+ 1-4)
    this.watchedVideos = []; // Array of watched video numbers (0-4)

    // Audio player unlocked tracks
    this.unlockedTracks = ["menu-music"]; // Start with menu music unlocked

    // Audio player favorite tracks
    this.favoriteTracks = []; // Player's favorite music tracks

    // Audio player track play counts
    this.trackPlayCounts = {}; // Track how many times each track has been played

    // Initialize audio manager
    this.audioManager = new AudioManager();

    // Phase 2.2 - Initialize feedback manager
    this.feedbackManager = new FeedbackManager(this);

    // Phase 4.1 - Initialize story manager
    this.storyManager = new StoryManager(this);

    // Initialize controller manager
    this.controllerManager = new ControllerManager(this);

    // Initialize sockball queue
    this.sockballQueue = [];

    // Simplified viewport system
    this.viewport = {
      width: 800,
      height: 600,
      scaleFactor: 1,
    };

    // Frame timing
    this.frameRate = 60;
    this.frameInterval = 1000 / this.frameRate;
    this.lastFrameTime = 0;
    this.deltaTime = 0;
    this.frameCount = 0;
    this.fpsDisplay = 0;
    this.fpsTimer = 0;
    this.animationFrameId = null;

    // Track game state at mousedown to prevent cross-screen clicks
    this.mouseDownState = null;

    // Track if mouseUp handled event to prevent subsequent click
    this.preventNextClick = false;

    // Initialize screens - now using the base Screen class
    this.levelSelect = new LevelSelect(this);
    this.levelSelect.setup();
    this.matchScreen = new MatchScreen(this);
    this.throwingScreen = new ThrowingScreen(this);
    this.levelEndScreen = new LevelEndScreen(this);

    // Game objects for shooting phase
    this.crosshair = { x: 600, y: 400 };

    // Bind event handlers to preserve 'this' context for cleanup
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handleWheel = this.handleWheel.bind(this);
    this.handleResize = this.handleResize.bind(this);
    this.handleKeyDown = this.handleKeyDown.bind(this);
    this.handleTouchStart = this.handleTouchStart.bind(this);
    this.handleTouchMove = this.handleTouchMove.bind(this);
    this.handleTouchEnd = this.handleTouchEnd.bind(this);
    this.handleTouchCancel = this.handleTouchCancel.bind(this);
  }

  initializeCanvas() {
    if (typeof GameConfig === "undefined") {
      throw new Error("GameConfig not loaded");
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const canvasSize = GameConfig.calculateCanvasSize(
      viewportWidth,
      viewportHeight
    );

    this.canvas.width = canvasSize.width;
    this.canvas.height = canvasSize.height;

    this.viewport.width = canvasSize.width;
    this.viewport.height = canvasSize.height;
    this.viewport.scaleFactor = canvasSize.scale;

    this.centerCanvas();
    this.optimizeCanvas();
  }

  centerCanvas() {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Calculate centering offsets
    const leftOffset = Math.max(0, (viewportWidth - this.canvas.width) / 2);
    const topOffset = Math.max(0, (viewportHeight - this.canvas.height) / 2);

    // Apply positioning
    this.canvas.style.position = "absolute";
    this.canvas.style.left = `${leftOffset}px`;
    this.canvas.style.top = `${topOffset}px`;

    // Set container background for letterboxing
    const container = document.getElementById("gameContainer");
    if (container) {
      container.style.backgroundColor = "#000000";
    }
  }

  optimizeCanvas() {
    this.ctx.imageSmoothingEnabled = false;
    this.ctx.textBaseline = "top";
    this.ctx.textAlign = "left";
  }

  // Scaling utilities
  getScaledValue(baseValue) {
    return baseValue * this.viewport.scaleFactor;
  }

  getScaledPosition(baseX, baseY) {
    return {
      x: baseX * this.viewport.scaleFactor,
      y: baseY * this.viewport.scaleFactor,
    };
  }

  getScaledSize(baseWidth, baseHeight) {
    return {
      width: baseWidth * this.viewport.scaleFactor,
      height: baseHeight * this.viewport.scaleFactor,
    };
  }

  getCanvasWidth() {
    return this.viewport.width;
  }

  getCanvasHeight() {
    return this.viewport.height;
  }

  // Fixed coordinate conversion
  screenToCanvas(screenX, screenY) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: screenX - rect.left,
      y: screenY - rect.top,
    };
  }

  // Sockball queue management methods
  initializeSockballQueue() {
    this.sockballQueue = [];
  }

  addSockballToQueue(sockType) {
    this.sockballQueue.push(sockType);
  }

  getNextSockballFromQueue() {
    if (this.sockballQueue.length > 0) {
      const sockType = this.sockballQueue.shift();
      return sockType;
    }
    return null;
  }

  getNextSockballType() {
    if (this.sockballQueue.length > 0) {
      return this.sockballQueue[0];
    }
    return null;
  }

  clearSockballQueue() {
    this.sockballQueue = [];
  }

  getSockballQueueLength() {
    return this.sockballQueue.length;
  }

  changeGameState(newState) {
    if (this.gameState === newState) return;

    this.cleanupCurrentScreen();

    this.previousGameState = this.gameState;
    this.gameState = newState;

    this.setupCurrentScreen();
  }

  cleanupCurrentScreen() {
    if (this.gameState === "menu") {
      this.levelSelect.cleanup();
    } else if (this.gameState === "matching") {
      this.matchScreen.cleanup();
    } else if (this.gameState === "throwing") {
      this.throwingScreen.cleanup();
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.cleanup();
    }
  }

  setupCurrentScreen() {
    if (this.gameState === "menu") {
      this.levelSelect.setup();
    } else if (this.gameState === "matching") {
      this.matchScreen.setup();
    } else if (this.gameState === "throwing") {
      this.throwingScreen.setup();
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.setup();
    }
  }

  init() {
    if (typeof GameConfig === "undefined") {
      setTimeout(() => this.init(), 100);
      return;
    }

    this.initializeCanvas();
    this.loadImagesFromCache();
    this.setupEventListeners();
    this.loadGameData();
    this.startGameLoop();
  }

  loadImagesFromCache() {
    if (
      window.loadingScreenManager &&
      window.loadingScreenManager.getImageCache()
    ) {
      const imageCache = window.loadingScreenManager.getImageCache();

      imageCache.forEach((image, imageName) => {
        this.images[imageName] = image;
      });

      this.loadedImages = imageCache.size;
      this.totalImages = imageCache.size;
    } else {
      this.loadImages();
    }
  }

  loadImages() {
    const allImages = [
      ...GameConfig.IMAGES.SOCKS,
      ...GameConfig.IMAGES.SOCK_BALLS,
      ...GameConfig.IMAGES.SOCK_PILES,
      ...GameConfig.IMAGES.CHARACTERS,
      ...GameConfig.IMAGES.UI,
      GameConfig.MARTHA_SPRITESHEET.filename,
    ];

    this.totalImages = allImages.length;

    allImages.forEach((imageName) => {
      const img = new Image();
      img.onload = () => {
        this.loadedImages++;
        if (imageName === GameConfig.MARTHA_SPRITESHEET.filename) {
        }
      };
      img.onerror = (e) => {
        console.error(`Failed to load image: ${imageName}`, e);
        this.loadedImages++;
      };
      img.src = `images/${imageName}`;
      this.images[imageName] = img;
    });
  }

  setupEventListeners() {
    this.canvas.addEventListener("mousedown", this.handleMouseDown);
    this.canvas.addEventListener("mousemove", this.handleMouseMove);
    this.canvas.addEventListener("mouseup", this.handleMouseUp);
    this.canvas.addEventListener("click", this.handleClick);
    this.canvas.addEventListener("wheel", this.handleWheel, { passive: false });
    window.addEventListener("resize", this.handleResize);

    window.addEventListener("keydown", this.handleKeyDown);

    this.canvas.addEventListener("touchstart", this.handleTouchStart, {
      passive: false,
    });
    this.canvas.addEventListener("touchmove", this.handleTouchMove, {
      passive: false,
    });
    this.canvas.addEventListener("touchend", this.handleTouchEnd, {
      passive: false,
    });
    this.canvas.addEventListener("touchcancel", this.handleTouchCancel, {
      passive: false,
    });
  }

  removeEventListeners() {
    this.canvas.removeEventListener("mousedown", this.handleMouseDown);
    this.canvas.removeEventListener("mousemove", this.handleMouseMove);
    this.canvas.removeEventListener("mouseup", this.handleMouseUp);
    this.canvas.removeEventListener("wheel", this.handleWheel);
    this.canvas.removeEventListener("click", this.handleClick);
    window.removeEventListener("resize", this.handleResize);
    window.removeEventListener("keydown", this.handleKeyDown);
    this.canvas.removeEventListener("touchstart", this.handleTouchStart);
    this.canvas.removeEventListener("touchmove", this.handleTouchMove);
    this.canvas.removeEventListener("touchend", this.handleTouchEnd);
    this.canvas.removeEventListener("touchcancel", this.handleTouchCancel);
  }

  handleTouchStart(e) {
    e.preventDefault(); // Prevent default touch behavior

    if (e.touches.length > 0) {
      const touch = e.touches[0];

      this.mouseDownState = this.gameState;

      this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  handleTouchMove(e) {
    e.preventDefault(); // Prevent scrolling

    if (e.touches.length > 0) {
      const touch = e.touches[0];

      // Pass touch coordinates directly - handleMouseMove will convert them
      this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  handleTouchEnd(e) {
    e.preventDefault();

    if (e.changedTouches.length > 0) {
      const touch = e.changedTouches[0];

      this.handleMouseUp({ clientX: touch.clientX, clientY: touch.clientY });

      // Only trigger click if mouseUp didn't handle the event (e.g., wasn't a drag)
      if (!this.preventNextClick) {
        this.handleClick({ clientX: touch.clientX, clientY: touch.clientY });
      } else {
        // Reset the flag since we skipped the click
        this.preventNextClick = false;
      }
    }
  }

  handleTouchCancel(e) {
    e.preventDefault();

    if (this.gameState === "matching" && this.matchScreen) {
      this.matchScreen.isDragging = false;
      this.matchScreen.draggedSock = null;
    }

    // Reset mousedown state
    this.mouseDownState = null;
  }

  handleKeyDown(e) {
    const currentScreen = this.getCurrentScreen();
    if (currentScreen && typeof currentScreen.handleKeyDown === "function") {
      currentScreen.handleKeyDown(e);
      // If screen handled the event, return early
      if (e.defaultPrevented) {
        return;
      }
    }

    if (e.key === "p" || e.key === "P" || e.key === "Escape") {
      if (this.gameState === "matching" || this.gameState === "throwing") {
        const currentScreen =
          this.gameState === "matching"
            ? this.matchScreen
            : this.throwingScreen;
        currentScreen.togglePause();
        e.preventDefault();
      }
    }

    // Quit to menu with Q key (only when paused)
    if (e.key === "q" || e.key === "Q") {
      const currentScreen =
        this.gameState === "matching"
          ? this.matchScreen
          : this.gameState === "throwing"
          ? this.throwingScreen
          : null;

      if (currentScreen && currentScreen.isPaused) {
        currentScreen.resume(); // Resume before changing state
        this.changeGameState("menu");
        e.preventDefault();
      }
    }
  }

  // Helper to get current screen object
  getCurrentScreen() {
    switch (this.gameState) {
      case "menu":
        return this.levelSelect;
      case "matching":
        return this.matchScreen;
      case "throwing":
        return this.throwingScreen;
      case "gameOver":
        return this.levelEndScreen;
      case "story":
        return this.storyManager;
      default:
        return null;
    }
  }

  handleResize() {
    this.initializeCanvas();

    // Notify screens about resize using new base class method
    if (this.levelSelect) this.levelSelect.handleResize();
    if (this.matchScreen) this.matchScreen.handleResize();
    if (this.throwingScreen) this.throwingScreen.handleResize();
    if (this.levelEndScreen) this.levelEndScreen.handleResize();

    // Update crosshair position if in shooting mode
    if (this.gameState === "shooting") {
      this.crosshair.x = this.canvas.width / 2;
      this.crosshair.y = this.canvas.height / 2;
    }
  }

  initializeAchievements() {
    const achievements = {};
    for (const key in GameConfig.ACHIEVEMENTS) {
      achievements[GameConfig.ACHIEVEMENTS[key].id] = {
        ...GameConfig.ACHIEVEMENTS[key],
        unlocked: false,
        unlockedAt: null,
      };
    }
    return achievements;
  }

  loadGameData() {
    const savedData = localStorage.getItem("sockGameData");
    if (savedData) {
      const data = JSON.parse(savedData);
      this.playerPoints = data.playerPoints || 0;
      this.sockBalls = data.sockBalls || 0;
      this.totalSockMatches = data.totalSockMatches || 0;

      // Load new achievement stats
      this.totalSockballsEarned = data.totalSockballsEarned || 0;
      this.totalMoneySpent = data.totalMoneySpent || 0;
      this.levelsPlayed = data.levelsPlayed || 0;
      this.totalWallBounceCatches = data.totalWallBounceCatches || 0;
      this.totalBonusHits = data.totalBonusHits || 0;
      this.totalDoubleBounces = data.totalDoubleBounces || 0;
      this.logoClickCount = data.logoClickCount || 0;
      this.easterEggSockballsCreated = data.easterEggSockballsCreated || 0;
      this.consecutiveLevelWins = data.consecutiveLevelWins || 0;
      this.totalLevelsPlayed = data.totalLevelsPlayed || 0;
      this.totalLevelLosses = data.totalLevelLosses || 0;
      this.totalPerfectShots = data.totalPerfectShots || 0;
      this.totalGoodShots = data.totalGoodShots || 0;
      this.totalFlubs = data.totalFlubs || 0;
      this.totalMisses = data.totalMisses || 0;
      this.lifetimeMismatches = data.lifetimeMismatches || 0;
      this.totalSnapPlacements = data.totalSnapPlacements || 0;
      this.totalPincers = data.totalPincers || 0;

      this.selectedDifficulty = data.selectedDifficulty || 0;

      // DEV MODE: Unlock all difficulties if enabled
      if (GameConfig.DEV_MODE) {
        this.highestUnlockedDifficulty = 4; // Unlock all 5 difficulties (0-4)
      } else {
        this.highestUnlockedDifficulty = data.highestUnlockedDifficulty || 0;
      }

      // Load per-difficulty unlocks and completions
      this.unlockedLevelsByDifficulty = data.unlockedLevelsByDifficulty || {
        0: [...GameConfig.INITIAL_UNLOCKED_LEVELS],
      };
      this.completedLevelsByDifficulty = data.completedLevelsByDifficulty || {
        0: [...GameConfig.INITIAL_COMPLETED_LEVELS],
      };

      // Initialize arrays for unlocked difficulties if they don't exist
      for (let diff = 1; diff <= this.highestUnlockedDifficulty; diff++) {
        if (!this.unlockedLevelsByDifficulty[diff]) {
          this.unlockedLevelsByDifficulty[diff] = [
            true,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ];
        }
        if (!this.completedLevelsByDifficulty[diff]) {
          this.completedLevelsByDifficulty[diff] = [
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
            false,
          ];
        }
      }

      // Ensure the currently selected difficulty has initialized arrays
      if (
        this.selectedDifficulty > 0 &&
        !this.unlockedLevelsByDifficulty[this.selectedDifficulty]
      ) {
        this.unlockedLevelsByDifficulty[this.selectedDifficulty] = [
          true,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ];
      }
      if (
        this.selectedDifficulty > 0 &&
        !this.completedLevelsByDifficulty[this.selectedDifficulty]
      ) {
        this.completedLevelsByDifficulty[this.selectedDifficulty] = [
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
          false,
        ];
      }

      // DEV MODE: Unlock and complete all levels across all difficulties
      if (GameConfig.DEV_MODE) {
        const allLevelsUnlocked = [
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ];
        const allLevelsCompleted = [
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ];

        // Set all difficulties (0-4) with all levels unlocked and completed
        for (let diff = 0; diff <= 4; diff++) {
          this.unlockedLevelsByDifficulty[diff] = [...allLevelsUnlocked];
          this.completedLevelsByDifficulty[diff] = [...allLevelsCompleted];
        }
      }

      // Point legacy arrays to the currently selected difficulty
      this.unlockedLevels =
        this.unlockedLevelsByDifficulty[this.selectedDifficulty] ||
        this.unlockedLevelsByDifficulty[0];
      this.completedLevels =
        this.completedLevelsByDifficulty[this.selectedDifficulty] ||
        this.completedLevelsByDifficulty[0];

      this.currentDifficulty = data.currentDifficulty || 0;
      this.tutorialCompleted = data.tutorialCompleted || false;
      this.storyViewed = data.storyViewed || false;
      this.bestScores = data.bestScores || {};
      this.perfectCatchStats = data.perfectCatchStats || {
        total: 0,
        byLevel: {},
      };

      // Story panels
      this.unlockedStoryPanels =
        data.unlockedStoryPanels || Array(9).fill(false);
      this.viewedStoryPanels = data.viewedStoryPanels || Array(9).fill(false);

      // Secret videos
      this.watchedVideos = data.watchedVideos || [];

      // Unlocked music tracks for audio player
      this.unlockedTracks = data.unlockedTracks || ["menu-music"];
      // Ensure menu-music is always unlocked
      if (!this.unlockedTracks.includes("menu-music")) {
        this.unlockedTracks.push("menu-music");
      }

      // Favorite music tracks for audio player
      this.favoriteTracks = data.favoriteTracks || [];

      // Track play counts for audio player
      this.trackPlayCounts = data.trackPlayCounts || {};

      this.hasShownNewGamePlusBanner = data.hasShownNewGamePlusBanner || false;

      const baseLevels = this.completedLevelsByDifficulty[0] || [];
      for (let i = 0; i < baseLevels.length; i++) {
        if (baseLevels[i] && !this.unlockedStoryPanels[i]) {
          this.unlockedStoryPanels[i] = true;
        }
      }

      if (data.achievements) {
        this.achievements = this.initializeAchievements();
        for (const id in data.achievements) {
          if (this.achievements[id]) {
            this.achievements[id] = {
              ...this.achievements[id],
              ...data.achievements[id],
            };
          }
        }

        if (
          data.achievements.perfectionist &&
          data.achievements.perfectionist.unlocked
        ) {
          this.achievements.deadeye = {
            ...this.achievements.deadeye,
            unlocked: true,
            unlockedAt: data.achievements.perfectionist.unlockedAt,
          };
        }
      }
    } else {
      // DEV MODE: Initialize with all levels unlocked and completed if enabled
      if (GameConfig.DEV_MODE) {
        this.highestUnlockedDifficulty = 4; // Unlock all 5 difficulties (0-4)
        const allLevelsUnlocked = [
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ];
        const allLevelsCompleted = [
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
          true,
        ];

        // Set all difficulties (0-4) with all levels unlocked and completed
        this.unlockedLevelsByDifficulty = {};
        this.completedLevelsByDifficulty = {};
        for (let diff = 0; diff <= 4; diff++) {
          this.unlockedLevelsByDifficulty[diff] = [...allLevelsUnlocked];
          this.completedLevelsByDifficulty[diff] = [...allLevelsCompleted];
        }

        // Point legacy arrays to the currently selected difficulty
        this.unlockedLevels =
          this.unlockedLevelsByDifficulty[this.selectedDifficulty] ||
          this.unlockedLevelsByDifficulty[0];
        this.completedLevels =
          this.completedLevelsByDifficulty[this.selectedDifficulty] ||
          this.completedLevelsByDifficulty[0];
      }

      const baseLevels = this.completedLevelsByDifficulty[0] || [];
      for (let i = 0; i < baseLevels.length; i++) {
        if (baseLevels[i] && !this.unlockedStoryPanels[i]) {
          this.unlockedStoryPanels[i] = true;
        }
      }
    }
  }

  saveGameData() {
    const data = {
      playerPoints: this.playerPoints,
      sockBalls: this.sockBalls,
      totalSockMatches: this.totalSockMatches,
      // New achievement stats
      totalSockballsEarned: this.totalSockballsEarned,
      totalMoneySpent: this.totalMoneySpent,
      levelsPlayed: this.levelsPlayed,
      totalWallBounceCatches: this.totalWallBounceCatches,
      totalBonusHits: this.totalBonusHits,
      totalDoubleBounces: this.totalDoubleBounces,
      logoClickCount: this.logoClickCount,
      easterEggSockballsCreated: this.easterEggSockballsCreated,
      consecutiveLevelWins: this.consecutiveLevelWins,
      totalLevelsPlayed: this.totalLevelsPlayed,
      totalLevelLosses: this.totalLevelLosses,
      totalPerfectShots: this.totalPerfectShots,
      totalGoodShots: this.totalGoodShots,
      totalFlubs: this.totalFlubs,
      totalMisses: this.totalMisses,
      lifetimeMismatches: this.lifetimeMismatches,
      totalSnapPlacements: this.totalSnapPlacements,
      totalPincers: this.totalPincers,
      // NEW GAME+: Save per-difficulty progress
      selectedDifficulty: this.selectedDifficulty,
      highestUnlockedDifficulty: this.highestUnlockedDifficulty,
      unlockedLevelsByDifficulty: this.unlockedLevelsByDifficulty,
      completedLevelsByDifficulty: this.completedLevelsByDifficulty,
      hasShownNewGamePlusBanner: this.hasShownNewGamePlusBanner,
      // Legacy fields for backwards compatibility
      unlockedLevels: this.unlockedLevels,
      completedLevels: this.completedLevels,
      // Phase 1.2 - Save enhanced data
      currentDifficulty: this.currentDifficulty,
      tutorialCompleted: this.tutorialCompleted,
      storyViewed: this.storyViewed,
      bestScores: this.bestScores,
      perfectCatchStats: this.perfectCatchStats,
      achievements: this.achievements,
      // Story panels
      unlockedStoryPanels: this.unlockedStoryPanels,
      viewedStoryPanels: this.viewedStoryPanels,
      // Secret videos
      watchedVideos: this.watchedVideos,
      // Unlocked music tracks
      unlockedTracks: this.unlockedTracks,
      // Favorite music tracks
      favoriteTracks: this.favoriteTracks,
      // Track play counts
      trackPlayCounts: this.trackPlayCounts,
    };
    localStorage.setItem("sockGameData", JSON.stringify(data));
  }

  markLevelCompleted(levelIndex, difficulty) {
    if (!this.completedLevelsByDifficulty[difficulty]) {
      this.completedLevelsByDifficulty[difficulty] = Array(
        GameConfig.LEVELS.length
      ).fill(false);
    }

    // Mark this level as completed at this difficulty
    this.completedLevelsByDifficulty[difficulty][levelIndex] = true;

    // Achievement: HALFWAY_THERE (complete levels 1-5 on base difficulty)
    if (difficulty === 0) {
      const firstFiveLevelsComplete = [0, 1, 2, 3, 4].every(
        (i) => this.completedLevelsByDifficulty[0][i]
      );
      if (firstFiveLevelsComplete) {
        this.unlockAchievement("halfway_there");
      }
    }

    // Unlock story panel on first completion (base difficulty only)
    if (difficulty === 0 && !this.unlockedStoryPanels[levelIndex]) {
      this.unlockedStoryPanels[levelIndex] = true;
      this.newStoryPanelUnlocked = levelIndex;

      const storyPanel = GameConfig.STORY_PANELS[levelIndex];
      if (storyPanel && this.feedbackManager) {
        this.feedbackManager.showStoryUnlocked(storyPanel);
      }
    }

    // Check if all levels completed at this difficulty
    const allLevelsCompleted = GameConfig.LEVELS.every((_, index) => {
      return (
        this.completedLevelsByDifficulty[difficulty] &&
        this.completedLevelsByDifficulty[difficulty][index]
      );
    });

    // Unlock next difficulty if all levels completed
    const previousDifficulty = this.highestUnlockedDifficulty;
    if (allLevelsCompleted && difficulty === this.highestUnlockedDifficulty) {
      this.highestUnlockedDifficulty = Math.min(
        difficulty + 1,
        4 // Max difficulty is +4
      );

      // NEW GAME+: Show explanation if just unlocked any difficulty AND haven't shown banner for that level before
      const unlockedDifficultyIndex = this.highestUnlockedDifficulty - 1; // Convert to 0-based index
      if (
        previousDifficulty < this.highestUnlockedDifficulty &&
        this.highestUnlockedDifficulty >= 1 &&
        this.highestUnlockedDifficulty <= 4 &&
        !this.hasShownNewGamePlusBanner[unlockedDifficultyIndex]
      ) {
        this.showNewGamePlusNotification = true;
        this.newGamePlusUnlockedLevel = this.highestUnlockedDifficulty;
      }
    }

    this.saveGameData();
  }

  // Achievement tracking system
  unlockAchievement(achievementId) {
    if (!this.achievements[achievementId]) {
      return false;
    }

    if (this.achievements[achievementId].unlocked) {
      return false; // Already unlocked
    }

    // Unlock the achievement
    this.achievements[achievementId].unlocked = true;
    this.achievements[achievementId].unlockedAt = Date.now();

    // Trigger visual notification
    if (this.feedbackManager) {
      this.feedbackManager.showAchievementUnlocked(
        this.achievements[achievementId]
      );
    }

    // Play achievement sound
    this.audioManager.playSound("level-complete", false, 0.4);

    this.saveGameData();
    return true;
  }

  startLevel(levelIndex, difficulty = null) {
    this.currentLevel = levelIndex;
    const baseLevel = GameConfig.LEVELS[levelIndex];

    // Validate level exists
    if (!baseLevel) {
      console.error(`Level ${levelIndex} not found in GameConfig.LEVELS`);
      return;
    }

    // Track levels played for Veteran Tenant achievement
    this.levelsPlayed++;
    if (this.levelsPlayed >= GameConfig.ACHIEVEMENTS.VETERAN_TENANT.threshold) {
      this.unlockAchievement("veteran_tenant");
    }

    // Phase 3.3 - Apply difficulty multipliers
    if (difficulty !== null) {
      this.currentDifficulty = difficulty;
    }

    const difficultyMode = GameConfig.getDifficultyMode(this.currentDifficulty);

    // Create modified level with difficulty multipliers
    const level = {
      ...baseLevel,
      marthaSpeed: baseLevel.marthaSpeed * difficultyMode.speedMultiplier,
      matchingTime: Math.floor(
        baseLevel.matchingTime * difficultyMode.timeMultiplier
      ),
    };

    this.matchingTime = level.matchingTime;
    // Will be reset to 0 in match screen (tracks elapsed time)
    this.timeElapsed = 0;
    this.sockBalls = 0;

    // Track catch quality for current level
    this.catchQualityCounts = {
      PERFECT: 0,
      GOOD: 0,
      REGULAR: 0,
    };

    // Initialize sockball queue for new level
    this.initializeSockballQueue();

    this.generateSockList(level);
    this.matchScreen.sockList = [...this.sockList];

    // Store the modified level for use in throwing screen
    this.currentLevelData = level;

    // Use the new state management system
    this.changeGameState("matching");
  }

  generateSockList(level) {
    this.sockList = [];
    const types = level.typesAvailable;

    // Create guaranteed pairs by adding each sock twice
    for (let i = 0; i < level.sockPairs; i++) {
      const type = types[i % types.length];
      this.sockList.push(type, type); // Always add pairs together
    }

    this.shuffleArray(this.sockList);
  }

  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  handleMouseDown(e) {
    try {
      // Track the game state when mouse down occurs
      this.mouseDownState = this.gameState;

      const coords = this.screenToCanvas(e.clientX, e.clientY);
      const x = coords.x;
      const y = coords.y;

      // Use the new Screen base class method
      if (this.gameState === "menu") {
        this.levelSelect.handleMouseDown(x, y);
      } else if (this.gameState === "matching") {
        this.matchScreen.handleMouseDown(x, y);
      } else if (this.gameState === "throwing") {
        this.throwingScreen.handleMouseDown(x, y);
      } else if (this.gameState === "gameOver") {
        this.levelEndScreen.handleMouseDown(x, y);
      }
    } catch (error) {
      console.error("Error handling mouse down:", error);
    }
  }

  handleMouseMove(e) {
    try {
      // Notify controller manager that mouse is being used
      if (this.controllerManager) {
        this.controllerManager.mouseUsedRecently = true;
        this.controllerManager.mouseInactiveTimer = 0;
      }

      const coords = this.screenToCanvas(e.clientX, e.clientY);
      const x = coords.x;
      const y = coords.y;

      // Use the new Screen base class method
      if (this.gameState === "menu") {
        this.levelSelect.handleMouseMove(x, y);
      } else if (this.gameState === "matching") {
        this.matchScreen.handleMouseMove(x, y);
      } else if (this.gameState === "throwing") {
        this.throwingScreen.handleMouseMove(x, y);
      } else if (this.gameState === "gameOver") {
        this.levelEndScreen.handleMouseMove(x, y);
      }
    } catch (error) {
      console.error("Error handling mouse move:", error);
    }
  }

  handleMouseUp(e) {
    try {
      const coords = this.screenToCanvas(e.clientX, e.clientY);
      const x = coords.x;
      const y = coords.y;

      // Use the new Screen base class method
      let handled = false;
      if (this.gameState === "menu") {
        handled = this.levelSelect.handleMouseUp(x, y);
      } else if (this.gameState === "matching") {
        handled = this.matchScreen.handleMouseUp();
      } else if (this.gameState === "throwing") {
        handled = this.throwingScreen.handleMouseUp(x, y);
      } else if (this.gameState === "gameOver") {
        handled = this.levelEndScreen.handleMouseUp();
      }

      // If mouseUp was handled (e.g., drag released), prevent click
      this.preventNextClick = handled;
    } catch (error) {
      console.error("Error handling mouse up:", error);
    }
  }

  handleClick(e) {
    try {
      // If the previous mouseUp was handled (e.g., drag released), skip click
      if (this.preventNextClick) {
        this.preventNextClick = false;
        this.mouseDownState = null;
        return;
      }

      if (
        this.mouseDownState !== null &&
        this.mouseDownState !== this.gameState
      ) {
        this.mouseDownState = null;
        return;
      }

      const coords = this.screenToCanvas(e.clientX, e.clientY);
      const x = coords.x;
      const y = coords.y;

      if (this.gameState === "menu") {
        this.levelSelect.handleClick(x, y);
      } else if (this.gameState === "throwing") {
        this.throwingScreen.handleClick(x, y);
      } else if (this.gameState === "gameOver") {
        this.levelEndScreen.handleClick(x, y);
      }

      this.mouseDownState = null;
    } catch (error) {
      console.error("Error handling click:", error);
    }
  }

  handleWheel(e) {
    try {
      if (this.gameState === "menu") {
        const handled = this.levelSelect.onMouseWheel(e.deltaY);
        if (handled) {
          e.preventDefault();
        }
      }
    } catch (error) {
      console.error("Error handling wheel:", error);
    }
  }

  startThrowingPhase() {
    // Use the new state management system
    this.changeGameState("throwing");
  }

  completeLevel() {
    // Use the new state management system
    this.changeGameState("gameOver");
  }

  update(deltaTime) {
    // Use the new Screen base class update method
    if (this.gameState === "menu") {
      this.levelSelect.update(deltaTime);
    } else if (this.gameState === "matching") {
      this.matchScreen.update(deltaTime);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.update(deltaTime);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.update(deltaTime);
    }

    // Update controller manager
    if (this.controllerManager) {
      this.controllerManager.update(deltaTime);
    }

    // Update FPS counter
    this.frameCount++;
    this.fpsTimer += deltaTime;
    if (this.fpsTimer >= 1000) {
      this.fpsDisplay = Math.round((this.frameCount * 1000) / this.fpsTimer);
      this.frameCount = 0;
      this.fpsTimer = 0;
    }
  }

  render() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (this.images["level-select-bg.jpg"]) {
      this.ctx.drawImage(
        this.images["level-select-bg.jpg"],
        0,
        0,
        this.canvas.width,
        this.canvas.height
      );
    }

    // Use the new Screen base class render method
    if (this.gameState === "menu") {
      this.levelSelect.render(this.ctx);
    } else if (this.gameState === "matching") {
      this.matchScreen.render(this.ctx);
    } else if (this.gameState === "throwing") {
      this.throwingScreen.render(this.ctx);
    } else if (this.gameState === "gameOver") {
      this.levelEndScreen.render(this.ctx);
    }

    // Render controller indicator
    if (this.controllerManager) {
      this.controllerManager.render(this.ctx);
    }

    // Debug info
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      this.ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.ctx.fillRect(10, 10, 120, 60);
      this.ctx.fillStyle = "white";
      this.ctx.font = "12px monospace";
      this.ctx.fillText(`FPS: ${this.fpsDisplay}`, 15, 25);
      this.ctx.fillText(
        `Scale: ${this.viewport.scaleFactor.toFixed(2)}`,
        15,
        40
      );
      this.ctx.fillText(
        `Size: ${this.canvas.width}x${this.canvas.height}`,
        15,
        55
      );
    }
  }

  startGameLoop() {
    const gameLoop = (currentTime) => {
      // Initialize lastFrameTime on first frame
      if (this.lastFrameTime === 0) {
        this.lastFrameTime = currentTime;
      }

      this.deltaTime = currentTime - this.lastFrameTime;

      if (this.deltaTime >= this.frameInterval) {
        this.lastFrameTime = currentTime;

        // Cap deltaTime to prevent timer speedup on lag
        const cappedDeltaTime = Math.min(
          this.deltaTime,
          this.frameInterval * 3
        );
        this.update(cappedDeltaTime);
        this.render();
      }

      this.animationFrameId = requestAnimationFrame(gameLoop);
    };

    this.animationFrameId = requestAnimationFrame(gameLoop);
  }

  stopGameLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  cleanup() {
    this.stopGameLoop();
    this.removeEventListeners();

    // Cleanup all screens
    if (this.levelSelect) this.levelSelect.cleanup();
    if (this.matchScreen) this.matchScreen.cleanup();
    if (this.throwingScreen) this.throwingScreen.cleanup();
    if (this.levelEndScreen) this.levelEndScreen.cleanup();

    // Cleanup managers
    if (this.audioManager) this.audioManager.cleanup();
    if (this.feedbackManager) this.feedbackManager.reset();
    if (this.controllerManager) this.controllerManager.cleanup();
  }
}

// Set up the game initialization callback
window.gameInitCallback = () => {
  try {
    const game = new SockGame();
    game.init();
  } catch (error) {
    console.error("Failed to initialize game:", error);
  }
};

// Start the game when DOM is loaded - but only if loading screen is not handling it
document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("gameCanvas");
  const container = document.getElementById("gameContainer");

  if (!canvas) {
    console.error("Canvas element 'gameCanvas' not found in HTML!");
    return;
  }

  if (!container) {
    console.error("Container element 'gameContainer' not found in HTML!");
    return;
  }

  // If loading screen manager is not available, start game directly
  if (!window.loadingScreenManager) {
    window.gameInitCallback();
  }
});
