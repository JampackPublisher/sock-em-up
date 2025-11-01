class LevelSelect extends Screen {
  constructor(game) {
    super(game);

    // Configuration constants
    this.DRAG_BOUNDARIES = {
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
    };

    this.DROP_ZONE_CONFIG = {
      snapDistance: 40,
      size: 60,
      offsetX: 1200,
      offsetY1: 200,
      offsetY2: 300,
      outerBorderWidth: 10,
      glowDuration: 20,
    };

    this.MARTHA_CONFIG = {
      offsetX: 150,
      offsetY: 250,
      maxSize: 200,
      maintainAspectRatio: true,
    };

    // You Win graphic configuration
    this.YOU_WIN_CONFIG = {
      maxWidth: 300 * 1.75,
      maxHeight: 120 * 1.75,
      offsetY: 225,
      glowIntensity: 15,
      pulseSpeed: 0.005,
      maintainAspectRatio: true,
    };

    // Level selection state
    this.hoveredLevel = -1;
    this.selectedLevel = -1;

    // Easter egg state
    this.easterEggActive = false;
    this.menuSocks = [];
    this.isDragging = false;
    this.dragSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.logoClickCount = 0;
    this.currentSockType = 1;
    this.dropZoneHover = null;

    // Hover state for menu socks
    this.hoveredMenuSock = null;

    // Logo click effect
    this.logoPressed = false;
    this.logoPressTimer = 0;
    this.logoPressScale = 1.0;

    // Drag momentum tracking (fix for sock physics)
    this.lastMouseX = 0;
    this.lastMouseY = 0;
    this.mouseVelocityX = 0;
    this.mouseVelocityY = 0;

    // Martha display and animation
    this.marthaWiggleTimer = 0;
    this.marthaWiggling = false;
    this.marthaImageSize = { width: 0, height: 0 };

    // Martha laughing animation state
    this.marthaLaughing = false;
    this.marthaLaughFrameIndex = 0;
    this.marthaLaughAnimationTimer = 0;

    // You Win animation state
    this.youWinFrameIndex = 0;
    this.youWinAnimationTimer = 0;

    // Martha quote system - rotating speech bubbles
    this.marthaQuotes = [
      "Rent's due, kiddo!",
      "I could 10x my rates if you just leave...",
      "I want to evict you, so you better not pay rent!",
      "Your lease is up for renewal... at 2x the price!",
      "You should go camping, I won't change the locks on you or anything....",
      "You know what? Your socks STINK!",
      "I've got 10 other tenants ready to pay more!",
      "Ever thought about moving? Like, today?",
      "I wish I wasn't so tiny...",
      "I'm quadrupling rent next month!",
      "If you leave, don't take your socks!",
      "I need your room for my pet rock collection.",
      "Your neighbors complained about your sock sorting!",
      "Time to pay up or ship out!",
      "I'm thinking about converting this place to a juice bar!",
    ];
    this.currentQuoteIndex = 0;
    this.currentQuote = this.marthaQuotes[0];
    this.quoteTimer = 0;
    this.quoteRotationInterval = 7500;
    this.quoteDisplayTime = 0;
    this.showingQuote = true;

    // Easter egg drop zones
    this.easterDropZones = [];

    // Sock ball animations
    this.sockBallAnimations = [];

    // Point gain animations
    this.pointGainAnimations = [];

    // Mismatch particle effects
    this.mismatchParticles = [];

    // Credits integration
    this.creditsOpen = false;
    this.creditsModal = null;
    this.creditsEventHandlers = null;

    // Animation speed constants
    this.ANIMATION_SPEED = 0.008; // Hover, button, and drawer animations
    this.PULSE_SPEED = 0.005; // YOU_WIN pulse animation
    this.WIGGLE_SPEED = 0.01; // Level button wiggle (also in levelConfig)
    this.PULSE_UPDATE_SPEED = 0.002; // Level pulse timer update
    this.TIME_MULTIPLIER_BASE = 16.67; // Based on 60 FPS
    this.ROTATION_VELOCITY_THRESHOLD = 0.01; // Minimum rotation speed before stopping

    // Press animation constants
    this.PRESS_DURATION = 150; // Logo press duration in milliseconds
    this.PRESS_MIN_SCALE = 0.95; // Minimum scale during press
    this.PRESS_SCALE_RANGE = 0.05; // Range of scale change (max - min)

    // Physics for menu socks
    this.menuPhysics = {
      friction: 0.992,
      minVelocity: 0.05,
      bounceRestitution: 0.4,
      rotationFriction: 0.98,
      bounds: {
        left: -500,
        right: 2000,
        top: -500,
        bottom: 2000,
      },
    };

    // Level button configuration
    this.levelConfig = {
      baseSpacing: 150,
      baseButtonSize: 90,
      wiggleSpeed: 0.01,
      wiggleAmount: 3,
      hoverScale: 1.15,
      clickScale: 0.95,
      columns: 3,
      rows: 3,
      horizontalSpacing: 180,
      verticalSpacing: 150,
    };

    // Level button hover animations
    this.levelHoverAnimations = Array(9).fill(0);
    this.levelPulseTimers = Array(9).fill(0);

    // Story replay button
    this.storyReplayButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    // Credits button
    this.creditsButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    this.videoButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    this.videoPlayerActive = false;
    this.videoElement = null;

    // Audio player button
    this.audioPlayerButton = {
      x: 0,
      y: 0,
      width: 120,
      height: 40,
      hovered: false,
    };

    // Initialize audio player
    this.audioPlayer = new AudioPlayer(this.game);

    // Achievements drawer
    this.achievementsDrawer = {
      isOpen: false,
      animationProgress: 0,
      width: 0,
      hoveredAchievement: null,
      scrollOffset: 0,
      maxScroll: 0,
      isDraggingScrollbar: false,
      scrollbarHover: false,
      button: {
        x: 0,
        y: 0,
        width: 50,
        height: 50,
        hovered: false,
      },
      closeButton: {
        x: 0,
        y: 0,
        size: 30,
        hovered: false,
      },
    };

    // Initialize UI helpers and modules
    this.uiHelpers = new UIHelpers(this.game);
    this.storyViewer = new StoryViewer(this.game, this.uiHelpers);
    this.difficultyModal = new DifficultyModal(this.game, this.uiHelpers);
    this.difficultySelector = new DifficultySelector(this.game, this.uiHelpers);
  }

  calculateMarthaImageSize() {
    const marthaImage = this.game.images["martha-demand-level-select.png"];
    if (!marthaImage) {
      this.marthaImageSize = { width: 0, height: 0 };
      return;
    }

    const maxSize = this.game.getScaledValue(this.MARTHA_CONFIG.maxSize);

    if (this.MARTHA_CONFIG.maintainAspectRatio) {
      const aspectRatio = marthaImage.width / marthaImage.height;

      if (aspectRatio > 1) {
        this.marthaImageSize.width = maxSize;
        this.marthaImageSize.height = maxSize / aspectRatio;
      } else {
        this.marthaImageSize.width = maxSize * aspectRatio;
        this.marthaImageSize.height = maxSize;
      }
    } else {
      this.marthaImageSize.width = maxSize;
      this.marthaImageSize.height = maxSize;
    }
  }

  areAllLevelsCompleted() {
    return this.game.completedLevels.every((completed) => completed);
  }

  updateMainMenuButtonHoverStates(x, y) {
    // Update all main menu button hover states based on reticle position
    // This should be called even when panels are open so hover states are ready when panels close
    const previousHoveredLevel = this.hoveredLevel;
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    // Play hover sound when hovering over a new level (but only if no panels are open)
    if (
      !this.audioPlayer.isOpen &&
      !this.storyViewer.isOpen &&
      !this.game.storyManager.showingStory &&
      !this.creditsOpen &&
      !this.videoPlayerActive &&
      this.hoveredLevel !== previousHoveredLevel &&
      this.hoveredLevel !== -1
    ) {
      this.game.audioManager.playSound("button-hover", false, 0.3);
    }

    // Update button hover states
    const layout = this.layoutCache;

    this.storyReplayButton.hovered = this.isPointInRect(x, y, {
      x: layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2,
      y: layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2,
      width: layout.storyReplayButtonWidth,
      height: layout.storyReplayButtonHeight,
    });

    this.storyViewer.button.hovered = this.isPointInRect(x, y, {
      x: layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2,
      y: layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2,
      width: layout.storyViewerButtonWidth,
      height: layout.storyViewerButtonHeight,
    });

    this.creditsButton.hovered = this.isPointInRect(x, y, {
      x: layout.creditsButtonX - layout.creditsButtonWidth / 2,
      y: layout.creditsButtonY - layout.creditsButtonHeight / 2,
      width: layout.creditsButtonWidth,
      height: layout.creditsButtonHeight,
    });

    this.audioPlayerButton.hovered = false;
    if (
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0
    ) {
      this.audioPlayerButton.hovered = this.isPointInRect(x, y, {
        x: layout.audioPlayerButtonX - layout.audioPlayerButtonWidth / 2,
        y: layout.audioPlayerButtonY - layout.audioPlayerButtonHeight / 2,
        width: layout.audioPlayerButtonWidth,
        height: layout.audioPlayerButtonHeight,
      });
    }

    this.achievementsDrawer.button.hovered = this.isPointInRect(x, y, {
      x: layout.achievementsButtonX - layout.achievementsButtonWidth / 2,
      y: layout.achievementsButtonY - layout.achievementsButtonHeight / 2,
      width: layout.achievementsButtonWidth,
      height: layout.achievementsButtonHeight,
    });

    // Video button hover (only if all levels completed)
    if (this.areAllLevelsCompleted()) {
      this.videoButton.hovered = this.isPointInRect(x, y, {
        x: layout.videoButtonX - layout.videoButtonWidth / 2,
        y: layout.videoButtonY - layout.videoButtonHeight / 2,
        width: layout.videoButtonWidth,
        height: layout.videoButtonHeight,
      });
    } else {
      this.videoButton.hovered = false;
    }

    // Difficulty selector hover (only if New Game+ is unlocked)
    if (this.game.highestUnlockedDifficulty > 0) {
      this.difficultySelector.updateButtonHover(x, y);
      this.difficultySelector.updateDropdownHover(x, y);
    }
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.calculateMarthaImageSize();
    const youWinImageSize = this.calculateYouWinImageSize();

    // Top bar configuration
    const barHeight = this.game.getScaledValue(GameConfig.UI_BAR.height);
    const barY = 0; // Top of screen
    const barPadding = this.game.getScaledValue(GameConfig.UI_BAR.padding);

    // Calculate logo dimensions maintaining aspect ratio
    const logoImage = this.game.images["logo.png"];
    let logoWidth = this.game.getScaledValue(200);
    let logoHeight = this.game.getScaledValue(100);

    if (logoImage && logoImage.complete && logoImage.naturalWidth > 0) {
      const logoAspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;
      const maxLogoWidth = this.game.getScaledValue(200);
      logoWidth = maxLogoWidth;
      logoHeight = maxLogoWidth / logoAspectRatio;
    }

    this.layoutCache = {
      ...baseLayout,
      logoX: canvasWidth / 2,
      logoY: barHeight + this.game.getScaledValue(100),
      logoWidth: logoWidth,
      logoHeight: logoHeight,
      instructionsY: barHeight + this.game.getScaledValue(140),
      levelButtonSize: this.game.getScaledValue(
        this.levelConfig.baseButtonSize
      ),
      levelHorizontalSpacing: this.game.getScaledValue(
        this.levelConfig.horizontalSpacing
      ),
      levelVerticalSpacing: this.game.getScaledValue(
        this.levelConfig.verticalSpacing
      ),
      levelGridStartX:
        canvasWidth / 2 -
        ((this.levelConfig.columns - 1) *
          this.game.getScaledValue(this.levelConfig.horizontalSpacing)) /
          2,
      levelGridStartY: canvasHeight / 2 + this.game.getScaledValue(0),
      marthaX: this.game.getScaledValue(this.MARTHA_CONFIG.offsetX),
      marthaY: barHeight + this.game.getScaledValue(this.MARTHA_CONFIG.offsetY),
      marthaWidth: this.marthaImageSize.width,
      marthaHeight: this.marthaImageSize.height,
      dropZoneSize: this.game.getScaledValue(this.DROP_ZONE_CONFIG.size),
      dropZone1X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone1Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY1),
      dropZone2X: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetX),
      dropZone2Y: this.game.getScaledValue(this.DROP_ZONE_CONFIG.offsetY2),

      // Top bar layout
      barY: barY,
      barHeight: barHeight,
      barPadding: barPadding,

      statsX: barPadding + this.game.getScaledValue(100),
      statsY: barY + barHeight / 2,

      buttonHeight: this.game.getScaledValue(35),
      rightEdgeMargin: this.game.getScaledValue(15),
      buttonGap: this.game.getScaledValue(15),

      // Credits button (rightmost)
      creditsButtonHeight: this.game.getScaledValue(35),
      creditsButtonWidth: this.game.getScaledValue(80),
      creditsButtonX: canvasWidth - this.game.getScaledValue(60),
      creditsButtonY: barY + barHeight / 2,

      // Story button
      storyViewerButtonHeight: this.game.getScaledValue(35),
      storyViewerButtonWidth: this.game.getScaledValue(90),
      storyViewerButtonX: canvasWidth - this.game.getScaledValue(160),
      storyViewerButtonY: barY + barHeight / 2,

      // How to Play button
      storyReplayButtonHeight: this.game.getScaledValue(35),
      storyReplayButtonWidth: this.game.getScaledValue(120),
      storyReplayButtonX: canvasWidth - this.game.getScaledValue(275),
      storyReplayButtonY: barY + barHeight / 2,

      // Trophies button (leftmost)
      achievementsButtonHeight: this.game.getScaledValue(35),
      achievementsButtonWidth: this.game.getScaledValue(100),
      achievementsButtonX: canvasWidth - this.game.getScaledValue(405),
      achievementsButtonY: barY + barHeight / 2,

      achievementsDrawerWidth: this.game.getScaledValue(500),
      achievementsDrawerButtonX: this.game.getScaledValue(35),
      achievementsDrawerButtonY: this.game.getScaledValue(50),
      achievementsDrawerButtonSize: this.game.getScaledValue(50),
      youWinX:
        canvasWidth - youWinImageSize.width / 2 - this.game.getScaledValue(50),
      youWinY: canvasHeight / 2,
      youWinWidth: youWinImageSize.width,
      youWinHeight: youWinImageSize.height,

      videoButtonX:
        canvasWidth - youWinImageSize.width / 2 - this.game.getScaledValue(50),
      videoButtonY:
        canvasHeight / 2 +
        youWinImageSize.height / 2 +
        this.game.getScaledValue(80),
      videoButtonWidth: this.game.getScaledValue(400),
      videoButtonHeight: this.game.getScaledValue(100),

      // Audio player button - in top bar between difficulty and trophies
      audioPlayerButtonX: canvasWidth - this.game.getScaledValue(535),
      audioPlayerButtonY: barY + barHeight / 2,
      audioPlayerButtonWidth: this.game.getScaledValue(100),
      audioPlayerButtonHeight: this.game.getScaledValue(35),

      statsPanelWidth: this.game.getScaledValue(200),
      statsPanelHeight: this.game.getScaledValue(40),
    };

    this.difficultySelector.updateLayout(this.layoutCache);

    return this.layoutCache;
  }

  onResize() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.menuPhysics.bounds = {
      left: -500,
      right: canvasWidth + 500,
      top: -500,
      bottom: canvasHeight + 500,
    };

    this.setupEasterDropZones();
  }

  setupEasterDropZones() {
    // Only initialize drop zones if they don't exist yet
    // This preserves their state and positions when returning to the level select screen
    if (this.easterDropZones.length === 0) {
      this.clearLayoutCache();
      this.calculateLayout();

      const layout = this.layoutCache;

      this.easterDropZones = [
        {
          x: layout.dropZone1X,
          y: layout.dropZone1Y,
          width: layout.dropZoneSize,
          height: layout.dropZoneSize,
          sock: null,
          glowEffect: 0,
          hoverEffect: 0,
          snapEffect: 0,
          id: 0,
        },
        {
          x: layout.dropZone2X,
          y: layout.dropZone2Y,
          width: layout.dropZoneSize,
          height: layout.dropZoneSize,
          sock: null,
          glowEffect: 0,
          hoverEffect: 0,
          snapEffect: 0,
          id: 1,
        },
      ];
    }
    // If drop zones already exist, don't recalculate or update anything
    // This keeps them in the same position throughout the game session
  }

  setup() {
    super.setup();

    // Select menu music based on new game plus level (selected difficulty)
    let menuMusicName = "menu-music"; // Default for NG+0
    const selectedDifficulty = this.game.selectedDifficulty;

    if (selectedDifficulty === 1) {
      menuMusicName = "menu-music-1";
    } else if (selectedDifficulty === 2) {
      menuMusicName = "menu-music-2";
    } else if (selectedDifficulty === 3) {
      menuMusicName = "menu-music-3";
    } else if (selectedDifficulty >= 4) {
      // For NG+4 and beyond, randomly select from all menu music
      const randomChoice = Math.floor(Math.random() * 4);
      if (randomChoice === 0) {
        menuMusicName = "menu-music";
      } else if (randomChoice === 1) {
        menuMusicName = "menu-music-1";
      } else if (randomChoice === 2) {
        menuMusicName = "menu-music-2";
      } else {
        menuMusicName = "menu-music-3";
      }
    }

    this.game.audioManager.playMusic(menuMusicName, true);

    // Unlock the menu music track in audio player
    if (this.audioPlayer) {
      this.audioPlayer.unlockTrack(menuMusicName);
    }

    if (this.game.newStoryPanelUnlocked >= 0) {
      this.game.newStoryPanelUnlocked = -1;
    }

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    this.menuPhysics.bounds = {
      left: -500,
      right: canvasWidth + 500,
      top: -500,
      bottom: canvasHeight + 500,
    };

    this.setupEasterDropZones();
    this.setupCreditsModal();

    this.currentQuoteIndex = 0;
    this.currentQuote = this.marthaQuotes[0];
    this.quoteTimer = 0;
    this.quoteDisplayTime = 0;
    this.showingQuote = true;

    if (this.game.storyManager.shouldShowStory()) {
      this.game.storyManager.show();
    }
  }

  // Cycle to the next quote in the rotation
  cycleToNextQuote() {
    this.currentQuoteIndex =
      (this.currentQuoteIndex + 1) % this.marthaQuotes.length;
    this.currentQuote = this.marthaQuotes[this.currentQuoteIndex];
    this.quoteTimer = 0; // Reset the timer
    this.quoteDisplayTime = 0;
  }

  // Check if Martha was clicked
  isMarthaClicked(x, y) {
    const layout = this.layoutCache;
    if (!layout.marthaX || !layout.marthaY) return false;

    const marthaLeft = layout.marthaX - layout.marthaWidth / 2;
    const marthaRight = layout.marthaX + layout.marthaWidth / 2;
    const marthaTop = layout.marthaY - layout.marthaHeight / 2;
    const marthaBottom = layout.marthaY + layout.marthaHeight / 2;

    return (
      x >= marthaLeft && x <= marthaRight && y >= marthaTop && y <= marthaBottom
    );
  }

  cleanup() {
    super.cleanup();

    this.game.audioManager.stopMusic();

    this.closeVideoPlayer();

    // Close audio player if open
    if (this.audioPlayer.isOpen) {
      this.audioPlayer.close();
    }

    this.removeCreditsEventListeners();

    if (this.creditsOpen) {
      this.hideCredits();
    }

    const creditsModal = document.getElementById("creditsModal");
    if (creditsModal) {
      creditsModal.remove();
    }
    this.creditsModal = null;

    // Clear bonus/easter egg socks
    this.menuSocks = [];
    this.easterEggActive = false;
    this.isDragging = false;
    this.dragSock = null;

    // Reset drop zones - clear any socks in the drop zones
    this.easterDropZones.forEach((zone) => {
      zone.sock = null;
      zone.glowEffect = 0;
      zone.hoverEffect = 0;
      zone.snapEffect = 0;
    });
  }

  setupCreditsModal() {
    if (!document.getElementById("creditsModal")) {
      const modalHTML = `
        <div class="credits-modal" id="creditsModal">
          <div class="credits-content">
            <div class="credits-header">
              <div class="company-logo-sprite" id="companyLogoSprite"></div>
              <h2>Weird Demon Games</h2>
              <button class="close-credits" id="closeCredits">×</button>
            </div>
            <div class="credits-body">
              <div class="company-info">
                <h3>About the Studio</h3>
                <p>Weird Demon Games was founded in the depths of creative madness, where nightmares meet nostalgia. We specialize in the weird and wacky that make you wonder - what did I play, and why did I have fun doing it!</p>
                
                <h3>Our Mission</h3>
                <p>To create unforgettable experiences that bring a smile to your face and inspire you to make something wacky of your own!</p>
                
                <h3>Team</h3>
                <div class="team-credits">
                  <div class="credit-role">
                    <span class="role">Founder / Game Lead / Jack of all Trades</span>
                    <span class="name">Ken Wheadon</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Logo</span>
                    <span class="name">Wyrmskin</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Quality Assurance</span>
                    <span class="name">ravex,  Games for Love volunteers, Ken Wheadon</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Audio Effects - freesound.org</span>
                    <span class="name">colorsCrimsonTears, David819, SilverIllusionist, mrickey13, plasterbrain, Sess8it, Bertrof, GameAudio, Yoshicakes77</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Audio Effects - pixabay.com</span>
                    <span class="name">Karim-Nessim, Universfield, freesound_community</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Martha Voice Actor</span>
                    <span class="name">Ken Wheadon</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Lead Artist</span>
                    <span class="name">ChatGPT</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Music Composer</span>
                    <span class="name">Suno</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Lead Programmer</span>
                    <span class="name">Claude Sonnet 4.5</span>
                  </div>
                  <div class="credit-role">
                    <span class="role">Animations</span>
                    <span class="name">Ludo</span>
                  </div>
                </div>
                
                <div class="company-tagline">
                  <em>"Where every game is a portal to the impossible."</em>
                </div>
              </div>
            </div>
          </div>
        </div>
      `;

      document.body.insertAdjacentHTML("beforeend", modalHTML);
    }

    this.creditsModal = document.getElementById("creditsModal");
    this.setupCreditsEventListeners();
  }

  setupCreditsEventListeners() {
    if (this.creditsEventHandlers) {
      this.removeCreditsEventListeners();
    }

    const closeCredits = document.getElementById("closeCredits");

    this.creditsEventHandlers = {
      closeClick: () => {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.hideCredits();
      },
      closeHover: () => {
        this.game.audioManager.playSound("button-hover", false, 0.3);
      },
      modalClick: (e) => {
        if (e.target === this.creditsModal) {
          this.hideCredits();
        }
      },
      escapeKey: (e) => {
        if (this.creditsOpen && e.code === "Escape") {
          this.hideCredits();
        }
      },
    };

    if (closeCredits) {
      closeCredits.addEventListener(
        "click",
        this.creditsEventHandlers.closeClick
      );
      closeCredits.addEventListener(
        "mouseenter",
        this.creditsEventHandlers.closeHover
      );
    }

    if (this.creditsModal) {
      this.creditsModal.addEventListener(
        "click",
        this.creditsEventHandlers.modalClick
      );
    }

    document.addEventListener("keydown", this.creditsEventHandlers.escapeKey);
  }

  removeCreditsEventListeners() {
    if (!this.creditsEventHandlers) return;

    const closeCredits = document.getElementById("closeCredits");
    if (closeCredits) {
      closeCredits.removeEventListener(
        "click",
        this.creditsEventHandlers.closeClick
      );
      closeCredits.removeEventListener(
        "mouseenter",
        this.creditsEventHandlers.closeHover
      );
    }

    if (this.creditsModal) {
      this.creditsModal.removeEventListener(
        "click",
        this.creditsEventHandlers.modalClick
      );
    }

    document.removeEventListener(
      "keydown",
      this.creditsEventHandlers.escapeKey
    );
    this.creditsEventHandlers = null;
  }

  showCredits() {
    if (this.creditsOpen) return;

    this.game.audioManager.playSound("button-click", false, 0.5);

    if (this.creditsModal) {
      this.creditsOpen = true;
      this.creditsModal.classList.add("visible");

      const closeButton = document.getElementById("closeCredits");
      if (closeButton) {
        closeButton.focus();
      }
    }
  }

  hideCredits() {
    if (!this.creditsOpen) return;

    this.game.audioManager.playSound("button-click", false, 0.5);

    if (this.creditsModal) {
      this.creditsModal.classList.remove("visible");
      this.creditsOpen = false;
    }
  }

  /**
   * Smoothly interpolates a value toward a target value
   * @param {number} current - Current value
   * @param {number} target - Target value
   * @param {number} speed - Animation speed multiplier
   * @param {number} deltaTime - Time elapsed since last frame
   * @returns {number} Interpolated value
   */
  smoothToward(current, target, speed, deltaTime) {
    if (current < target) {
      return Math.min(current + speed * deltaTime, target);
    } else if (current > target) {
      return Math.max(current - speed * deltaTime, target);
    }
    return current;
  }

  onUpdate(deltaTime) {
    if (this.game.storyManager.showingStory) {
      this.game.storyManager.update(deltaTime);
      return;
    }

    // Update audio player animation
    this.audioPlayer.update(deltaTime);

    // Only update difficulty UI if New Game+ is unlocked
    if (this.game.highestUnlockedDifficulty > 0) {
      this.difficultyModal.update(deltaTime);
      this.difficultySelector.update(deltaTime);
    }

    // Update feedback manager to keep achievement/story notifications visible
    // Tell feedbackManager that Martha is off-screen to prevent dialogue bubbles from showing
    const layout = this.layoutCache;
    this.game.feedbackManager.updateMarthaPosition(
      layout.marthaX || 0,
      layout.marthaY || 0,
      layout.marthaWidth || 0,
      false // Martha is not "on screen" in the throwing screen context
    );
    this.game.feedbackManager.update(deltaTime);

    for (let i = 0; i < this.levelHoverAnimations.length; i++) {
      const isHovered = this.hoveredLevel === i;
      const targetValue = isHovered ? 1 : 0;

      this.levelHoverAnimations[i] = this.smoothToward(
        this.levelHoverAnimations[i],
        targetValue,
        this.ANIMATION_SPEED,
        deltaTime
      );

      if (this.game.unlockedLevels[i]) {
        this.levelPulseTimers[i] += deltaTime * this.PULSE_UPDATE_SPEED;
      }
    }

    this.storyViewer.update(deltaTime);

    // Update logo press animation
    if (this.logoPressed) {
      this.logoPressTimer += deltaTime;

      if (this.logoPressTimer < this.PRESS_DURATION) {
        // Animate to minimum scale
        this.logoPressScale =
          1.0 -
          (this.logoPressTimer / this.PRESS_DURATION) * this.PRESS_SCALE_RANGE;
      } else if (this.logoPressTimer < this.PRESS_DURATION * 2) {
        // Animate back to maximum scale
        const returnProgress =
          (this.logoPressTimer - this.PRESS_DURATION) / this.PRESS_DURATION;
        this.logoPressScale =
          this.PRESS_MIN_SCALE + returnProgress * this.PRESS_SCALE_RANGE;
      } else {
        // Animation complete
        this.logoPressed = false;
        this.logoPressScale = 1.0;
      }
    }

    this.storyReplayButton.hoverProgress =
      this.storyReplayButton.hoverProgress || 0;
    this.creditsButton.hoverProgress = this.creditsButton.hoverProgress || 0;

    const storyTarget = this.storyReplayButton.hovered ? 1 : 0;
    this.storyReplayButton.hoverProgress = this.smoothToward(
      this.storyReplayButton.hoverProgress,
      storyTarget,
      this.ANIMATION_SPEED,
      deltaTime
    );

    const creditsTarget = this.creditsButton.hovered ? 1 : 0;
    this.creditsButton.hoverProgress = this.smoothToward(
      this.creditsButton.hoverProgress,
      creditsTarget,
      this.ANIMATION_SPEED,
      deltaTime
    );

    if (this.easterEggActive) {
      this.updateMenuSocks(deltaTime);
    }

    if (this.marthaWiggling) {
      this.marthaWiggleTimer += deltaTime;
      if (this.marthaWiggleTimer >= 1000) {
        this.marthaWiggling = false;
        this.marthaWiggleTimer = 0;
      }
    }

    // Update Martha laughing animation
    if (this.marthaLaughing) {
      this.marthaLaughAnimationTimer += deltaTime;
      const spritesheet = GameConfig.MARTHA_LAUGHING_SPRITESHEET;
      const frameTime = 1000 / spritesheet.fps;

      if (this.marthaLaughAnimationTimer >= frameTime) {
        this.marthaLaughFrameIndex++;
        this.marthaLaughAnimationTimer = 0;

        // Check if animation is complete
        if (this.marthaLaughFrameIndex >= spritesheet.animationFrames.length) {
          this.marthaLaughing = false;
          this.marthaLaughFrameIndex = 0;
        }
      }
    }

    // Update You Win animation (loops continuously when all levels complete)
    if (this.areAllLevelsCompleted()) {
      this.youWinAnimationTimer += deltaTime;
      const youWinSpritesheet = GameConfig.YOU_WIN_SPRITESHEET;
      const frameTime = 1000 / youWinSpritesheet.fps;

      if (this.youWinAnimationTimer >= frameTime) {
        this.youWinFrameIndex++;
        this.youWinAnimationTimer = 0;

        // Loop the animation
        if (this.youWinFrameIndex >= youWinSpritesheet.animationFrames.length) {
          this.youWinFrameIndex = 0;
        }
      }
    }

    this.quoteTimer += deltaTime;
    if (this.quoteTimer >= this.quoteRotationInterval) {
      this.cycleToNextQuote();
    }

    this.easterDropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
      if (zone.snapEffect > 0) zone.snapEffect--;
    });

    this.sockBallAnimations = this.sockBallAnimations.filter((animation) => {
      animation.progress += deltaTime / 1000;
      return animation.progress < 1;
    });

    this.pointGainAnimations = this.pointGainAnimations.filter((animation) => {
      animation.progress += deltaTime / 2000;
      return animation.progress < 1;
    });

    const drawerTarget = this.achievementsDrawer.isOpen ? 1 : 0;
    this.achievementsDrawer.animationProgress = this.smoothToward(
      this.achievementsDrawer.animationProgress,
      drawerTarget,
      this.ANIMATION_SPEED,
      deltaTime
    );

    this.updateMismatchParticles(deltaTime);
  }

  updateMismatchParticles(deltaTime) {
    if (!this.mismatchParticles) return;

    const timeMultiplier = deltaTime / this.TIME_MULTIPLIER_BASE;

    this.mismatchParticles.forEach((particle, index) => {
      particle.x += particle.vx * timeMultiplier;
      particle.y += particle.vy * timeMultiplier;
      particle.vx *= Math.pow(
        this.menuPhysics.rotationFriction,
        timeMultiplier
      );
      particle.vy *= Math.pow(
        this.menuPhysics.rotationFriction,
        timeMultiplier
      );
      particle.life -= timeMultiplier;

      if (particle.life <= 0) {
        this.mismatchParticles.splice(index, 1);
      }
    });
  }

  updateMenuSocks(deltaTime) {
    const timeMultiplier = deltaTime / this.TIME_MULTIPLIER_BASE;

    this.menuSocks = this.menuSocks.filter((sock) => {
      if (sock === this.dragSock || this.isSockInDropZone(sock)) return true;

      sock.vx *= Math.pow(this.menuPhysics.friction, timeMultiplier);
      sock.vy *= Math.pow(this.menuPhysics.friction, timeMultiplier);

      if (sock.rotationSpeed) {
        sock.rotationSpeed *= Math.pow(
          this.menuPhysics.rotationFriction,
          timeMultiplier
        );
      }

      sock.x += sock.vx * timeMultiplier;
      sock.y += sock.vy * timeMultiplier;
      sock.rotation += sock.rotationSpeed * timeMultiplier;

      if (this.isSockOutsideBounds(sock)) {
        this.clearSockFromDropZones(sock);

        if (sock === this.dragSock) {
          this.isDragging = false;
          this.dragSock = null;
        }
        return false;
      }

      if (
        Math.abs(sock.vx) < this.menuPhysics.minVelocity &&
        Math.abs(sock.vy) < this.menuPhysics.minVelocity
      ) {
        sock.vx = 0;
        sock.vy = 0;
        if (
          sock.rotationSpeed &&
          Math.abs(sock.rotationSpeed) < this.ROTATION_VELOCITY_THRESHOLD
        ) {
          sock.rotationSpeed = 0;
        }
      }

      return true;
    });
  }

  clearSockFromDropZones(sock) {
    this.easterDropZones.forEach((zone) => {
      if (zone.sock === sock) {
        zone.sock = null;
      }
    });
  }

  isSockInDropZone(sock) {
    return this.easterDropZones.some((zone) => zone.sock === sock);
  }

  isSockOutsideBounds(sock) {
    const isOutside =
      sock.x < this.menuPhysics.bounds.left ||
      sock.x > this.menuPhysics.bounds.right ||
      sock.y < this.menuPhysics.bounds.top ||
      sock.y > this.menuPhysics.bounds.bottom;

    return isOutside;
  }

  onMouseMove(x, y) {
    this.mouseVelocityX = x - this.lastMouseX;
    this.mouseVelocityY = y - this.lastMouseY;
    this.lastMouseX = x;
    this.lastMouseY = y;

    if (this.game.storyManager.showingStory) {
      this.game.storyManager.handleMouseMove(x, y);
      return;
    }

    // Update audio player hover
    this.audioPlayer.updateHover(x, y, this.game.canvas);

    if (this.storyViewer.isOpen) {
      this.storyViewer.handleMouseMove(x, y);
      return;
    }

    if (
      this.game.highestUnlockedDifficulty > 0 &&
      this.difficultyModal.isOpen
    ) {
      this.difficultyModal.updateHover(x, y);
      return;
    }

    const previousHoveredLevel = this.hoveredLevel;
    this.hoveredLevel = this.getLevelAtPosition(x, y);

    if (
      this.hoveredLevel !== previousHoveredLevel &&
      this.hoveredLevel !== -1
    ) {
      this.game.audioManager.playSound("button-hover", false, 0.3);
    }

    const layout = this.layoutCache;
    const storyButtonX =
      layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2;
    const storyButtonY =
      layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2;

    this.storyReplayButton.hovered = this.isPointInRect(x, y, {
      x: storyButtonX,
      y: storyButtonY,
      width: layout.storyReplayButtonWidth,
      height: layout.storyReplayButtonHeight,
    });

    const creditsButtonX =
      layout.creditsButtonX - layout.creditsButtonWidth / 2;
    const creditsButtonY =
      layout.creditsButtonY - layout.creditsButtonHeight / 2;

    this.creditsButton.hovered = this.isPointInRect(x, y, {
      x: creditsButtonX,
      y: creditsButtonY,
      width: layout.creditsButtonWidth,
      height: layout.creditsButtonHeight,
    });

    // Video button hover (only if all levels completed)
    if (this.areAllLevelsCompleted()) {
      const videoButtonX = layout.videoButtonX - layout.videoButtonWidth / 2;
      const videoButtonY = layout.videoButtonY - layout.videoButtonHeight / 2;
      this.videoButton.hovered = this.isPointInRect(x, y, {
        x: videoButtonX,
        y: videoButtonY,
        width: layout.videoButtonWidth,
        height: layout.videoButtonHeight,
      });
    } else {
      this.videoButton.hovered = false;
    }

    // Audio player button hover (always check if at least one track is unlocked)
    if (
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0
    ) {
      const audioPlayerButtonX =
        layout.audioPlayerButtonX - layout.audioPlayerButtonWidth / 2;
      const audioPlayerButtonY =
        layout.audioPlayerButtonY - layout.audioPlayerButtonHeight / 2;
      this.audioPlayerButton.hovered = this.isPointInRect(x, y, {
        x: audioPlayerButtonX,
        y: audioPlayerButtonY,
        width: layout.audioPlayerButtonWidth,
        height: layout.audioPlayerButtonHeight,
      });
    } else {
      this.audioPlayerButton.hovered = false;
    }

    this.storyViewer.updateButtonHover(x, y, layout);

    // Only update difficulty selector hover if New Game+ is unlocked
    if (this.game.highestUnlockedDifficulty > 0) {
      this.difficultySelector.updateButtonHover(x, y);
      this.difficultySelector.updateDropdownHover(x, y);
    }

    this.achievementsDrawer.button.hovered = this.isPointInRect(x, y, {
      x: layout.achievementsButtonX - layout.achievementsButtonWidth / 2,
      y: layout.achievementsButtonY - layout.achievementsButtonHeight / 2,
      width: layout.achievementsButtonWidth,
      height: layout.achievementsButtonHeight,
    });

    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX =
        -drawerWidth + drawerWidth * this.achievementsDrawer.animationProgress;
      const achievements = Object.values(GameConfig.ACHIEVEMENTS);
      const startY = this.game.getScaledValue(115);
      const spacing = this.game.getScaledValue(75);

      const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const scrollbarY = this.game.getScaledValue(80);
      const scrollbarWidth = this.game.getScaledValue(10);
      const canvasHeight = this.game.getCanvasHeight();
      const scrollbarHeight = canvasHeight - this.game.getScaledValue(100);

      this.achievementsDrawer.scrollbarHover =
        x >= scrollbarX &&
        x <= scrollbarX + scrollbarWidth &&
        y >= scrollbarY &&
        y <= scrollbarY + scrollbarHeight;

      if (this.achievementsDrawer.isDraggingScrollbar) {
        const relativeY = y - scrollbarY;
        const scrollPercentage = Math.max(
          0,
          Math.min(1, relativeY / scrollbarHeight)
        );
        this.achievementsDrawer.scrollOffset =
          scrollPercentage * this.achievementsDrawer.maxScroll;
      }

      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30); // Moved left by 10px
      const closeButtonY = this.game.getScaledValue(30); // Moved down by 10px

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.achievementsDrawer.closeButton.hovered =
        distance <= closeButtonSize / 2;

      this.achievementsDrawer.hoveredAchievement = null;
      achievements.forEach((achievement, index) => {
        const achY =
          startY + index * spacing - this.achievementsDrawer.scrollOffset;
        const cardX = drawerX + this.game.getScaledValue(15);
        const cardY = achY - this.game.getScaledValue(22);
        const cardWidth = drawerWidth - this.game.getScaledValue(50);
        const cardHeight = this.game.getScaledValue(65);

        if (
          x >= cardX &&
          x <= cardX + cardWidth &&
          y >= cardY &&
          y <= cardY + cardHeight &&
          achY > this.game.getScaledValue(80) &&
          achY < canvasHeight - this.game.getScaledValue(20)
        ) {
          this.achievementsDrawer.hoveredAchievement = achievement.id;
        }
      });
    } else {
      this.achievementsDrawer.hoveredAchievement = null;
      this.achievementsDrawer.scrollbarHover = false;
      this.achievementsDrawer.closeButton.hovered = false;
    }

    // Don't update drag position if story or menus are open
    if (
      this.isDragging &&
      this.dragSock &&
      !this.game.storyManager.showingStory &&
      !this.storyViewer.isOpen
    ) {
      this.dragSock.x = x - this.dragOffset.x;
      this.dragSock.y = y - this.dragOffset.y;
    }

    // Update hovered menu sock (only when not dragging)
    if (!this.isDragging && this.easterEggActive) {
      this.hoveredMenuSock = this.getSockAtPosition(x, y);
    } else if (this.isDragging) {
      this.hoveredMenuSock = null;
    }

    this.updateDropZoneHover(x, y);

    // Update cursor based on what's being hovered
    this.updateCursor();
  }

  updateDropZoneHover(x, y) {
    this.dropZoneHover = null;

    if (this.isDragging && this.dragSock) {
      const snapDistance = this.game.getScaledValue(
        this.DROP_ZONE_CONFIG.snapDistance
      );

      this.easterDropZones.forEach((zone) => {
        const distance = this.getDropZoneDistance(this.dragSock, zone);
        if (distance < snapDistance && zone.sock === null) {
          this.dropZoneHover = zone.id;
          zone.hoverEffect = Math.max(zone.hoverEffect, 10);
        }
      });
    }
  }

  updateCursor() {
    // Check if any button is hovered
    const isButtonHovered =
      this.storyReplayButton.hovered ||
      this.creditsButton.hovered ||
      this.videoButton.hovered ||
      this.audioPlayerButton.hovered ||
      this.achievementsDrawer.button.hovered ||
      this.achievementsDrawer.closeButton.hovered ||
      this.storyViewer.button.hovered ||
      (this.game.highestUnlockedDifficulty > 0 &&
        this.difficultySelector.isButtonHovered()) ||
      this.audioPlayer.isAnyElementHovered();

    // Check if hovering over a level button
    const isLevelHovered = this.hoveredLevel !== -1;

    // Check if hovering over logo
    const layout = this.layoutCache;
    const logoWidth = this.game.getScaledValue(400);
    const logoHeight = this.game.getScaledValue(150);
    const logoX = layout.centerX - logoWidth / 2;
    const logoY = this.game.getScaledValue(100);
    const isLogoHovered =
      this.lastMouseX >= logoX &&
      this.lastMouseX <= logoX + logoWidth &&
      this.lastMouseY >= logoY &&
      this.lastMouseY <= logoY + logoHeight;

    // Check if hovering over Martha image
    const isMarthaHovered = this.isMarthaClicked(
      this.lastMouseX,
      this.lastMouseY
    );

    // Check if hovering over a sock (when easter egg is active)
    const isSockHovered =
      this.easterEggActive &&
      this.getSockAtPosition(this.lastMouseX, this.lastMouseY) !== null;

    // Set cursor based on what's being hovered/interacted with
    if (this.isDragging) {
      this.game.canvas.style.cursor = "grabbing";
    } else if (isSockHovered) {
      this.game.canvas.style.cursor = "grab";
    } else if (
      isButtonHovered ||
      isLevelHovered ||
      isLogoHovered ||
      isMarthaHovered
    ) {
      this.game.canvas.style.cursor = "pointer";
    } else {
      this.game.canvas.style.cursor = "default";
    }
  }

  onMouseDown(x, y) {
    if (this.achievementsDrawer.isOpen) {
      const layout = this.layoutCache;
      const drawerWidth = layout.achievementsDrawerWidth;
      const progress = this.achievementsDrawer.animationProgress;
      const drawerX = -drawerWidth + drawerWidth * progress;
      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30); // Moved left by 10px
      const closeButtonY = this.game.getScaledValue(30); // Moved down by 10px

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= closeButtonSize / 2) {
        return false;
      }
    }

    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const layout = this.layoutCache;
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX =
        -drawerWidth + drawerWidth * this.achievementsDrawer.animationProgress;
      const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
      const scrollbarY = this.game.getScaledValue(80);
      const scrollbarWidth = this.game.getScaledValue(10);
      const canvasHeight = this.game.getCanvasHeight();
      const scrollbarHeight = canvasHeight - this.game.getScaledValue(100);

      if (
        x >= scrollbarX &&
        x <= scrollbarX + scrollbarWidth &&
        y >= scrollbarY &&
        y <= scrollbarY + scrollbarHeight
      ) {
        this.achievementsDrawer.isDraggingScrollbar = true;
        return true;
      }
    }

    // Don't allow sock dragging when story or menus are open
    if (this.game.storyManager.showingStory || this.storyViewer.isOpen) {
      return false;
    }

    if (this.easterEggActive) {
      const sock = this.getSockAtPosition(x, y);
      if (sock) {
        this.isDragging = true;
        this.dragSock = sock;
        this.dragOffset.x = x - sock.x;
        this.dragOffset.y = y - sock.y;
        sock.vx = 0;
        sock.vy = 0;

        this.lastMouseX = x;
        this.lastMouseY = y;
        this.mouseVelocityX = 0;
        this.mouseVelocityY = 0;

        // Remove sock from drop zone if it was in one
        this.easterDropZones.forEach((zone) => {
          if (zone.sock === sock) {
            zone.sock = null;
          }
        });

        return true;
      }
    }
    return false;
  }

  onMouseUp(x, y) {
    if (this.achievementsDrawer.isDraggingScrollbar) {
      this.achievementsDrawer.isDraggingScrollbar = false;
      return;
    }

    if (this.isDragging && this.dragSock) {
      const sock = this.dragSock;
      let snapped = false;

      this.easterDropZones.forEach((zone) => {
        const distance = this.getDropZoneDistance(sock, zone);
        const snapDistance = this.game.getScaledValue(
          this.DROP_ZONE_CONFIG.snapDistance
        );

        if (distance < snapDistance && zone.sock === null) {
          zone.sock = sock;
          this.snapSockToDropZone(sock, zone);
          snapped = true;
          this.createSnapEffect(zone);
        }
      });

      if (!snapped) {
        const momentumMultiplier = 0.8; // Adjust for feel

        const maxVelocity = 20;
        const clampedVx = Math.max(
          -maxVelocity,
          Math.min(maxVelocity, this.mouseVelocityX * momentumMultiplier)
        );
        const clampedVy = Math.max(
          -maxVelocity,
          Math.min(maxVelocity, this.mouseVelocityY * momentumMultiplier)
        );

        sock.vx = clampedVx;
        sock.vy = clampedVy;

        const velocityMagnitude = Math.sqrt(
          sock.vx * sock.vx + sock.vy * sock.vy
        );
        sock.rotationSpeed =
          (velocityMagnitude / 100) * (Math.random() > 0.5 ? 1 : -1);
      }

      this.isDragging = false;
      this.dragSock = null;
      this.dropZoneHover = null;
      this.checkForEasterEggMatches();

      // Prevent onClick from triggering after sock drag
      return true;
    }
  }

  handleKeyDown(e) {
    // If video player is active, close with Escape
    if (this.videoPlayerActive) {
      if (e.key === "Escape") {
        this.closeVideoPlayer();
        e.preventDefault();
      }
      return;
    }

    // If story is showing, let it handle keyboard
    if (this.game.storyManager.showingStory) {
      this.game.storyManager.handleKeyDown(e);
      return;
    }

    // If credits modal is open, close with Escape
    if (this.creditsOpen) {
      if (e.key === "Escape") {
        this.hideCredits();
        e.preventDefault();
      }
      return;
    }

    // If story viewer is open, handle navigation
    if (this.storyViewer.handleKeyPress(e)) {
      return;
    }

    // Achievements drawer toggle with 'A' key
    if (e.key === "a" || e.key === "A") {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.toggleAchievementsDrawer();
      e.preventDefault();
      return;
    }

    // Story replay with 'S' key
    if (e.key === "s" || e.key === "S") {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.game.storyManager.show();
      e.preventDefault();
      return;
    }

    // Credits with 'C' key
    if (e.key === "c" || e.key === "C") {
      this.showCredits();
      e.preventDefault();
      return;
    }

    // Number keys 1-9 for quick level selection
    const numKey = parseInt(e.key);
    if (numKey >= 1 && numKey <= 9) {
      const levelIndex = numKey - 1;
      if (levelIndex < GameConfig.LEVELS.length) {
        this.selectLevel(levelIndex);
        e.preventDefault();
      }
      return;
    }

    // Arrow key navigation
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown"
    ) {
      this.navigateLevels(e.key);
      e.preventDefault();
      return;
    }

    // Enter to select highlighted level
    if (e.key === "Enter" || e.key === " ") {
      if (this.selectedLevel !== -1) {
        this.selectLevel(this.selectedLevel);
        e.preventDefault();
      }
      return;
    }
  }

  navigateLevels(key) {
    const totalLevels = GameConfig.LEVELS.length;
    const columns = this.levelConfig.columns;

    // Initialize selection if nothing selected
    if (this.selectedLevel === -1) {
      this.selectedLevel = 0;
      this.hoveredLevel = 0;
      this.game.audioManager.playSound("button-hover", false, 0.3);
      return;
    }

    let newSelection = this.selectedLevel;

    switch (key) {
      case "ArrowLeft":
        if (newSelection % columns > 0) {
          newSelection--;
        }
        break;
      case "ArrowRight":
        if (
          newSelection % columns < columns - 1 &&
          newSelection < totalLevels - 1
        ) {
          newSelection++;
        }
        break;
      case "ArrowUp":
        if (newSelection >= columns) {
          newSelection -= columns;
        }
        break;
      case "ArrowDown":
        if (newSelection + columns < totalLevels) {
          newSelection += columns;
        }
        break;
    }

    if (newSelection !== this.selectedLevel) {
      this.selectedLevel = newSelection;
      this.hoveredLevel = newSelection;
      this.game.audioManager.playSound("button-hover", false, 0.3);
    }
  }

  selectLevel(levelIndex) {
    if (this.game.unlockedLevels[levelIndex]) {
      this.game.audioManager.playSound("button-click", false, 0.5);

      // Always start the level with the currently selected difficulty from dropdown
      this.game.startLevel(levelIndex, this.game.selectedDifficulty);
    } else {
      // Calculate cost based on current difficulty
      const levelCost = GameConfig.getLevelCost(
        levelIndex,
        this.game.selectedDifficulty
      );

      if (this.game.playerPoints >= levelCost) {
        this.game.audioManager.playSound("level-unlock", false, 0.6);
        this.game.playerPoints -= levelCost;

        // Track money spent for Big Spender achievement
        this.game.totalMoneySpent += levelCost;
        if (
          this.game.totalMoneySpent >=
          GameConfig.ACHIEVEMENTS.BIG_SPENDER.threshold
        ) {
          this.game.unlockAchievement("big_spender");
        }

        // Update the actual difficulty-specific array, not just the pointer
        this.game.unlockedLevelsByDifficulty[this.game.selectedDifficulty][
          levelIndex
        ] = true;
        this.game.unlockedLevels[levelIndex] = true;
        this.game.saveGameData();
        this.game.startLevel(levelIndex, this.game.selectedDifficulty);
      } else {
        this.game.audioManager.playSound("button-click", false, 0.2);
      }
    }
  }

  openDifficultyModal(levelIndex) {
    this.difficultyModal.isOpen = true;
    this.difficultyModal.selectedLevel = levelIndex;
    this.difficultyModal.selectedDifficulty = 0;
    this.difficultyModal.hoveredDifficulty = -1;
    this.difficultyModal.animationProgress = 0;
    this.setupDifficultyButtons();
  }

  closeDifficultyModal() {
    this.difficultyModal.isOpen = false;
    this.difficultyModal.selectedLevel = -1;
  }

  setupDifficultyButtons() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(600);
    const modalHeight = this.game.getScaledValue(500);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;

    this.difficultyModal.buttons = [];

    // Create buttons for each unlocked difficulty
    for (let i = 0; i <= this.game.highestUnlockedDifficulty; i++) {
      const buttonY = modalY + this.game.getScaledValue(150 + i * 70);
      this.difficultyModal.buttons.push({
        difficulty: i,
        x: modalX + modalWidth / 2 - this.game.getScaledValue(200),
        y: buttonY,
        width: this.game.getScaledValue(400),
        height: this.game.getScaledValue(60),
      });
    }
  }

  startLevelWithDifficulty(difficulty) {
    this.game.audioManager.playSound("button-click", false, 0.5);
    this.closeDifficultyModal();
    this.game.startLevel(this.difficultyModal.selectedLevel, difficulty);
  }

  handleDifficultyModalClick(x, y) {
    // Check if clicked on a difficulty button
    for (const button of this.difficultyModal.buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        this.startLevelWithDifficulty(button.difficulty);
        return;
      }
    }

    // Check if clicked outside modal to close (on overlay)
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(600);
    const modalHeight = this.game.getScaledValue(500);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;

    const clickedOutside =
      x < modalX ||
      x > modalX + modalWidth ||
      y < modalY ||
      y > modalY + modalHeight;

    if (clickedOutside) {
      this.closeDifficultyModal();
    }
  }

  onClick(x, y) {
    // Handle video player modal clicks
    if (this.videoPlayerActive) {
      const videoWidth = this.game.getScaledValue(640);
      const videoHeight = this.game.getScaledValue(360);
      const videoX = (this.game.getCanvasWidth() - videoWidth) / 2;
      const videoY = (this.game.getCanvasHeight() - videoHeight) / 2;
      const clickMargin = this.game.getScaledValue(10);

      const clickedOutside =
        x < videoX - clickMargin ||
        x > videoX + videoWidth + clickMargin ||
        y < videoY - clickMargin ||
        y > videoY + videoHeight + clickMargin;

      if (clickedOutside) {
        this.closeVideoPlayer();
      }
      return;
    }

    // Audio player click handling
    if (this.audioPlayer.isOpen) {
      this.audioPlayer.handleClick(x, y, this.game.canvas);
      return;
    }

    if (this.game.storyManager.showingStory) {
      this.game.storyManager.handleClick(x, y);
      return;
    }

    if (this.storyViewer.handleClick(x, y)) {
      return;
    }

    if (this.achievementsDrawer.isOpen) {
      const layout = this.layoutCache;
      const drawerWidth = layout.achievementsDrawerWidth;
      const progress = this.achievementsDrawer.animationProgress;
      const drawerX = -drawerWidth + drawerWidth * progress;
      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30); // Moved left by 10px
      const closeButtonY = this.game.getScaledValue(30); // Moved down by 10px

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= closeButtonSize / 2) {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.toggleAchievementsDrawer();
        return true;
      }

      // Check if click is anywhere on the drawer to prevent click-through
      const canvasHeight = this.game.getCanvasHeight();
      if (
        x >= drawerX &&
        x <= drawerX + drawerWidth &&
        y >= 0 &&
        y <= canvasHeight
      ) {
        // Click is on the drawer - consume the click to prevent click-through
        return true;
      }
    }

    // Check achievements button using direct hit detection
    const layout = this.layoutCache;
    if (
      this.isPointInRect(x, y, {
        x: layout.achievementsButtonX - layout.achievementsButtonWidth / 2,
        y: layout.achievementsButtonY - layout.achievementsButtonHeight / 2,
        width: layout.achievementsButtonWidth,
        height: layout.achievementsButtonHeight,
      })
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.toggleAchievementsDrawer();
      return true;
    }

    // NEW GAME+: Handle difficulty selector clicks (only if New Game+ unlocked)
    if (
      this.game.highestUnlockedDifficulty > 0 &&
      this.difficultySelector.handleClick(x, y)
    ) {
      // Clear cache and recalculate layout after difficulty change to update level display
      this.clearLayoutCache();
      this.calculateLayout();
      return;
    }

    // NEW GAME+: Handle difficulty modal clicks (only if New Game+ unlocked)
    if (
      this.game.highestUnlockedDifficulty > 0 &&
      this.difficultyModal.handleClick(x, y)
    ) {
      return;
    }

    // Check if Martha was clicked to cycle quotes and trigger laugh animation
    if (this.isMarthaClicked(x, y)) {
      this.cycleToNextQuote();

      // Only start animation if not already playing
      if (!this.marthaLaughing) {
        this.marthaLaughing = true;
        this.marthaLaughFrameIndex = 0;
        this.marthaLaughAnimationTimer = 0;
        // Play random goblin sound (8 different sounds)
        this.game.audioManager.playRandomSound("goblin-sound", 8, false, 0.7);
      }

      return true;
    }

    // Check story replay button using direct hit detection
    if (
      this.isPointInRect(x, y, {
        x: layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2,
        y: layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2,
        width: layout.storyReplayButtonWidth,
        height: layout.storyReplayButtonHeight,
      })
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.cancelActiveDrag();
      this.game.storyManager.show();
      return true;
    }

    // Check story viewer button using direct hit detection
    if (
      this.isPointInRect(x, y, {
        x: layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2,
        y: layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2,
        width: layout.storyViewerButtonWidth,
        height: layout.storyViewerButtonHeight,
      })
    ) {
      this.cancelActiveDrag();
      this.storyViewer.open();
      return true;
    }

    // Check video button using direct hit detection (only if all levels completed)
    if (
      this.areAllLevelsCompleted() &&
      this.isPointInRect(x, y, {
        x: layout.videoButtonX - layout.videoButtonWidth / 2,
        y: layout.videoButtonY - layout.videoButtonHeight / 2,
        width: layout.videoButtonWidth,
        height: layout.videoButtonHeight,
      })
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.openVideoPlayer();
      return true;
    }

    // Check audio player button (if at least one track is unlocked)
    if (
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0 &&
      this.isPointInRect(x, y, {
        x: layout.audioPlayerButtonX - layout.audioPlayerButtonWidth / 2,
        y: layout.audioPlayerButtonY - layout.audioPlayerButtonHeight / 2,
        width: layout.audioPlayerButtonWidth,
        height: layout.audioPlayerButtonHeight,
      })
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.audioPlayer.open();
      return true;
    }

    if (this.isCreditsButtonClicked(x, y)) {
      this.showCredits();
      return true;
    }

    if (this.isLogoClicked(x, y)) {
      this.logoPressed = true;
      this.logoPressTimer = 0;
      this.activateEasterEgg();
      return true;
    }

    const levelIndex = this.getLevelAtPosition(x, y);
    if (levelIndex !== -1) {
      this.selectLevel(levelIndex);
      return true;
    }

    return false;
  }

  // Controller reticle support
  getInteractiveElements() {
    const layout = this.layoutCache;
    const elements = [];

    // If story viewer is open, return its buttons
    if (this.storyViewer.isOpen) {
      const canvasWidth = this.game.getCanvasWidth();
      const canvasHeight = this.game.getCanvasHeight();
      const modalWidth = this.game.getScaledValue(900);
      const modalHeight = this.game.getScaledValue(480);
      const modalX = (canvasWidth - modalWidth) / 2;
      const modalY = (canvasHeight - modalHeight) / 2;
      const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
      const buttonWidth = this.game.getScaledValue(85);
      const buttonHeight = this.game.getScaledValue(35);
      const buttonSpacing = this.game.getScaledValue(15);
      const unlockedPanels = this.storyViewer.getUnlockedPanels();

      // Close button (far left)
      elements.push({
        x: modalX + this.game.getScaledValue(30),
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
      });

      // Previous button (if available)
      if (this.storyViewer.currentPanel > 0) {
        const prevX =
          modalX +
          modalWidth -
          buttonWidth * 2 -
          buttonSpacing -
          this.game.getScaledValue(30);
        elements.push({
          x: prevX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
        });
      }

      // Next button (if available)
      if (this.storyViewer.currentPanel < unlockedPanels.length - 1) {
        const nextX =
          modalX + modalWidth - buttonWidth - this.game.getScaledValue(30);
        elements.push({
          x: nextX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
        });
      }

      return elements;
    }

    // Add story replay button (How to Play)
    elements.push({
      x: layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2,
      y: layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2,
      width: layout.storyReplayButtonWidth,
      height: layout.storyReplayButtonHeight,
    });

    // Add story viewer button (Story)
    elements.push({
      x: layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2,
      y: layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2,
      width: layout.storyViewerButtonWidth,
      height: layout.storyViewerButtonHeight,
    });

    // Add credits button
    elements.push({
      x: layout.creditsButtonX - layout.creditsButtonWidth / 2,
      y: layout.creditsButtonY - layout.creditsButtonHeight / 2,
      width: layout.creditsButtonWidth,
      height: layout.creditsButtonHeight,
    });

    // Add audio player button (if unlocked)
    if (
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0
    ) {
      elements.push({
        x: layout.audioPlayerButtonX - layout.audioPlayerButtonWidth / 2,
        y: layout.audioPlayerButtonY - layout.audioPlayerButtonHeight / 2,
        width: layout.audioPlayerButtonWidth,
        height: layout.audioPlayerButtonHeight,
      });
    }

    // Add achievements button (Trophies)
    elements.push({
      x: layout.achievementsButtonX - layout.achievementsButtonWidth / 2,
      y: layout.achievementsButtonY - layout.achievementsButtonHeight / 2,
      width: layout.achievementsButtonWidth,
      height: layout.achievementsButtonHeight,
    });

    // Add secret bonus video button (if all levels completed)
    if (this.areAllLevelsCompleted()) {
      elements.push({
        x: layout.videoButtonX - layout.videoButtonWidth / 2,
        y: layout.videoButtonY - layout.videoButtonHeight / 2,
        width: layout.videoButtonWidth,
        height: layout.videoButtonHeight,
      });
    }

    // Add difficulty selector button (if New Game+ is unlocked)
    if (this.game.highestUnlockedDifficulty > 0) {
      elements.push({
        x: this.difficultySelector.button.x,
        y: this.difficultySelector.button.y,
        width: this.difficultySelector.button.width,
        height: this.difficultySelector.button.height,
      });

      // Add dropdown options if open
      if (this.difficultySelector.isOpen) {
        for (
          let i = 0;
          i < this.difficultySelector.dropdown.options.length;
          i++
        ) {
          const optionY =
            this.difficultySelector.dropdown.y +
            i * this.difficultySelector.dropdown.optionHeight;
          elements.push({
            x: this.difficultySelector.dropdown.x,
            y: optionY,
            width: this.difficultySelector.dropdown.width,
            height: this.difficultySelector.dropdown.optionHeight,
          });
        }
      }
    }

    // Add level tiles
    const levelTileSize = this.game.getScaledValue(
      this.levelConfig.baseButtonSize
    );
    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const col = i % this.levelConfig.columns;
      const row = Math.floor(i / this.levelConfig.columns);
      const levelX =
        layout.levelGridStartX + col * layout.levelHorizontalSpacing;
      const levelY = layout.levelGridStartY + row * layout.levelVerticalSpacing;
      elements.push({
        x: levelX - levelTileSize / 2,
        y: levelY - levelTileSize / 2,
        width: levelTileSize,
        height: levelTileSize,
      });
    }

    return elements;
  }

  handleReticleMove(x, y) {
    // If video player is active, don't update hover states for background elements
    if (this.videoPlayerActive) {
      // Still update main menu hover states so they're ready when video player closes
      this.updateMainMenuButtonHoverStates(x, y);
      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(false);
      }
      return;
    }

    // If audio player is open, delegate to it AND update main menu hover states
    if (this.audioPlayer.isOpen) {
      // Update main menu hover states so they're ready when audio player closes
      this.updateMainMenuButtonHoverStates(x, y);
      this.audioPlayer.handleReticleMove(x, y);
      return;
    }

    // If story manager is showing, delegate to it AND update main menu hover states
    if (this.game.storyManager.showingStory) {
      console.log("Story manager showing - reticle at", x, y);
      // Update main menu hover states so they're ready when story manager closes
      this.updateMainMenuButtonHoverStates(x, y);
      this.game.storyManager.handleMouseMove(x, y);
      // Story manager has its own hover state handling
      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(false); // Will be updated by story manager
      }
      return;
    }

    // If credits popup is open, check for close button hover AND update main menu hover states
    if (this.creditsOpen) {
      // Update main menu hover states so they're ready when credits closes
      this.updateMainMenuButtonHoverStates(x, y);
      const closeButton = document.getElementById("closeCredits");
      if (closeButton) {
        // Convert canvas coordinates to screen coordinates
        const canvasRect = this.game.canvas.getBoundingClientRect();
        const screenX = x + canvasRect.left;
        const screenY = y + canvasRect.top;

        const buttonRect = closeButton.getBoundingClientRect();
        const isHovering =
          screenX >= buttonRect.left &&
          screenX <= buttonRect.right &&
          screenY >= buttonRect.top &&
          screenY <= buttonRect.bottom;

        if (this.game.controllerManager) {
          this.game.controllerManager.setReticleHoverState(isHovering);
        }
      }
      return;
    }

    // If story viewer is open, delegate to it AND update main menu hover states
    if (this.storyViewer.isOpen) {
      console.log("Story viewer open - reticle at", x, y);
      // Update main menu hover states so they're ready when story viewer closes
      this.updateMainMenuButtonHoverStates(x, y);
      this.storyViewer.handleMouseMove(x, y);

      // Update reticle hover state based on story viewer buttons
      const isHovering =
        this.storyViewer.navButtons.close.hovered ||
        this.storyViewer.navButtons.previous.hovered ||
        this.storyViewer.navButtons.next.hovered;

      console.log("Story viewer buttons hovered:", this.storyViewer.navButtons);

      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(isHovering);
      }
      return;
    }

    // Update main menu button hover states (no panels open)
    this.updateMainMenuButtonHoverStates(x, y);

    // Handle achievements drawer hover detection
    const layout = this.layoutCache;
    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX =
        -drawerWidth + drawerWidth * this.achievementsDrawer.animationProgress;
      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30);
      const closeButtonY = this.game.getScaledValue(30);

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      this.achievementsDrawer.closeButton.hovered =
        distance <= closeButtonSize / 2;

      // Update reticle hover state for close button
      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(
          this.achievementsDrawer.closeButton.hovered
        );
      }
    } else {
      this.achievementsDrawer.closeButton.hovered = false;

      // Update reticle hover state in controller manager
      const isHovering =
        this.hoveredLevel !== -1 ||
        this.storyReplayButton.hovered ||
        this.storyViewer.button.hovered ||
        this.creditsButton.hovered ||
        this.audioPlayerButton.hovered ||
        this.achievementsDrawer.button.hovered ||
        this.videoButton.hovered ||
        (this.game.highestUnlockedDifficulty > 0 &&
          this.difficultySelector.isButtonHovered());

      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(isHovering);
      }
    }
  }

  handleReticleAction(x, y) {
    // Handle video player modal clicks
    if (this.videoPlayerActive) {
      const videoWidth = this.game.getScaledValue(640);
      const videoHeight = this.game.getScaledValue(360);
      const videoX = (this.game.getCanvasWidth() - videoWidth) / 2;
      const videoY = (this.game.getCanvasHeight() - videoHeight) / 2;
      const clickMargin = this.game.getScaledValue(10);

      const clickedOutside =
        x < videoX - clickMargin ||
        x > videoX + videoWidth + clickMargin ||
        y < videoY - clickMargin ||
        y > videoY + videoHeight + clickMargin;

      if (clickedOutside) {
        this.closeVideoPlayer();
      }
      return true;
    }

    // If audio player is open, delegate to it
    if (this.audioPlayer.isOpen) {
      return this.audioPlayer.handleReticleAction(x, y);
    }

    // If story manager is showing, delegate to it
    if (this.game.storyManager.showingStory) {
      console.log("Story manager showing - reticle action at", x, y);
      this.game.storyManager.handleClick(x, y);
      return true;
    }

    // If achievements drawer is open, check for close button click
    if (this.achievementsDrawer.isOpen) {
      const layout = this.layoutCache;
      const drawerWidth = layout.achievementsDrawerWidth;
      const progress = this.achievementsDrawer.animationProgress;
      const drawerX = -drawerWidth + drawerWidth * progress;
      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30);
      const closeButtonY = this.game.getScaledValue(30);

      const dx = x - closeButtonX;
      const dy = y - closeButtonY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance <= closeButtonSize / 2) {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.toggleAchievementsDrawer();
        return true;
      }

      // Click is on the drawer - consume the click to prevent click-through
      const canvasHeight = this.game.getCanvasHeight();
      if (
        x >= drawerX &&
        x <= drawerX + drawerWidth &&
        y >= 0 &&
        y <= canvasHeight
      ) {
        return true;
      }
    }

    // If credits popup is open, check for close button click
    if (this.creditsOpen) {
      const closeButton = document.getElementById("closeCredits");
      if (closeButton) {
        // Convert canvas coordinates to screen coordinates
        const canvasRect = this.game.canvas.getBoundingClientRect();
        const screenX = x + canvasRect.left;
        const screenY = y + canvasRect.top;

        const buttonRect = closeButton.getBoundingClientRect();
        const isClickingButton =
          screenX >= buttonRect.left &&
          screenX <= buttonRect.right &&
          screenY >= buttonRect.top &&
          screenY <= buttonRect.bottom;

        if (isClickingButton) {
          this.game.audioManager.playSound("button-click", false, 0.5);
          this.hideCredits();
          return true;
        }
      }
      return false;
    }

    // If story viewer is open, delegate to it
    if (this.storyViewer.isOpen) {
      console.log("Story viewer open - reticle action at", x, y);
      const result = this.storyViewer.handleClick(x, y);
      console.log("Story viewer click result:", result);
      return result;
    }

    // Reuse the existing click logic
    // Check story replay button (How to Play)
    if (this.storyReplayButton.hovered) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.game.storyManager.show();
      return true;
    }

    // Check story viewer button (Story)
    if (this.storyViewer.button.hovered) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.storyViewer.open();
      return true;
    }

    // Check credits button
    if (this.creditsButton.hovered) {
      this.showCredits();
      return true;
    }

    // Check audio player button
    if (
      this.audioPlayerButton.hovered &&
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0
    ) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.audioPlayer.open();
      return true;
    }

    // Check achievements button (Trophies)
    if (this.achievementsDrawer.button.hovered) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.toggleAchievementsDrawer();
      return true;
    }

    // Check video button (if all levels completed)
    if (this.videoButton.hovered && this.areAllLevelsCompleted()) {
      this.game.audioManager.playSound("button-click", false, 0.5);
      this.openVideoPlayer();
      return true;
    }

    // Check difficulty selector (if New Game+ unlocked)
    if (
      this.game.highestUnlockedDifficulty > 0 &&
      this.difficultySelector.handleClick(x, y)
    ) {
      // Clear cache and recalculate layout after difficulty change to update level display
      this.clearLayoutCache();
      this.calculateLayout();
      return true;
    }

    // Check level selection
    const levelIndex = this.getLevelAtPosition(x, y);
    if (levelIndex !== -1) {
      this.selectLevel(levelIndex);
      return true;
    }

    return false;
  }

  isCreditsButtonClicked(x, y) {
    const layout = this.layoutCache;
    return (
      x >= layout.creditsButtonX - layout.creditsButtonWidth / 2 &&
      x <= layout.creditsButtonX + layout.creditsButtonWidth / 2 &&
      y >= layout.creditsButtonY - layout.creditsButtonHeight / 2 &&
      y <= layout.creditsButtonY + layout.creditsButtonHeight / 2
    );
  }

  getDropZoneDistance(sock, dropZone) {
    return Math.sqrt(
      Math.pow(sock.x - dropZone.x, 2) + Math.pow(sock.y - dropZone.y, 2)
    );
  }

  snapSockToDropZone(sock, dropZone) {
    sock.x = dropZone.x;
    sock.y = dropZone.y;
    sock.vx = 0;
    sock.vy = 0;
    sock.rotationSpeed = 0;
  }

  createSnapEffect(zone) {
    zone.glowEffect = this.DROP_ZONE_CONFIG.glowDuration;
    zone.snapEffect = 15;
  }

  removeMatchedSocks(sock1, sock2) {
    this.menuSocks = this.menuSocks.filter((s) => s !== sock1 && s !== sock2);

    if (this.dragSock === sock1 || this.dragSock === sock2) {
      this.isDragging = false;
      this.dragSock = null;
    }

    this.clearSockFromDropZones(sock1);
    this.clearSockFromDropZones(sock2);
  }

  checkForEasterEggMatches() {
    if (!this.easterDropZones || this.easterDropZones.length < 2) return;

    if (this.easterDropZones[0].sock && this.easterDropZones[1].sock) {
      const sock1 = this.easterDropZones[0].sock;
      const sock2 = this.easterDropZones[1].sock;

      if (
        !sock1 ||
        !sock2 ||
        sock1.type === undefined ||
        sock2.type === undefined
      ) {
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        return;
      }

      if (sock1.type === sock2.type) {
        this.game.audioManager.playSound("easter-egg-match", false, 0.8);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;

        this.createSockBallAnimation(sock1, sock2);
        this.awardPointsForMatch(sock1, sock2);

        this.removeMatchedSocks(sock1, sock2);

        // Check if we should deactivate easter egg (no socks left)
        this.checkEasterEggDeactivation();
      } else {
        this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);
        this.easterDropZones[0].sock = null;
        this.easterDropZones[1].sock = null;
        this.handleEasterEggMismatch(sock1, sock2);
      }
    }
  }

  checkEasterEggDeactivation() {
    // Deactivate easter egg if there are no more socks in the menu
    if (this.menuSocks.length === 0 && this.easterEggActive) {
      this.easterEggActive = false;
    }
  }

  cancelActiveDrag() {
    // Cancel any active sock dragging
    if (this.isDragging && this.dragSock) {
      this.isDragging = false;
      this.dragSock = null;
      this.dropZoneHover = null;
    }
  }

  handleEasterEggMismatch(sock1, sock2) {
    if (
      !sock1 ||
      !sock2 ||
      sock1.type === undefined ||
      sock2.type === undefined
    ) {
      return;
    }

    this.game.audioManager.playSound("particle-burst", false, 0.4);

    this.createEasterEggMismatchEffect(sock1, sock2);

    const dx = sock2.x - sock1.x;
    const dy = sock2.y - sock1.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const normalizedDx = distance > 0 ? dx / distance : 1;
    const normalizedDy = distance > 0 ? dy / distance : 0;

    const repulsionForce = 20;

    sock1.vx = -normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock1.vy = -normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    sock2.vx = normalizedDx * repulsionForce + (Math.random() - 0.5) * 8;
    sock2.vy = normalizedDy * repulsionForce + (Math.random() - 0.5) * 8;

    sock1.rotationSpeed = (Math.random() - 0.5) * 0.3;
    sock2.rotationSpeed = (Math.random() - 0.5) * 0.3;

    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    this.easterDropZones[0].glowEffect = 30;
    this.easterDropZones[1].glowEffect = 30;
  }

  createEasterEggMismatchEffect(sock1, sock2) {
    if (!sock1 || !sock2 || sock1.x === undefined || sock2.x === undefined) {
      return;
    }

    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;
    const mismatchColors = [
      "#FF4444",
      "#FF6B6B",
      "#FF8E53",
      "#FFB347",
      "#FF69B4",
    ];

    for (let i = 0; i < 20; i++) {
      this.createMismatchParticle(
        centerX + (Math.random() - 0.5) * this.game.getScaledValue(100),
        centerY + (Math.random() - 0.5) * this.game.getScaledValue(100),
        (Math.random() - 0.5) * 12,
        (Math.random() - 0.5) * 12,
        mismatchColors[Math.floor(Math.random() * mismatchColors.length)],
        this.game.getScaledValue(3 + Math.random() * 3),
        60
      );
    }

    for (let i = 0; i < 8; i++) {
      this.createMismatchParticle(
        centerX + (Math.random() - 0.5) * this.game.getScaledValue(60),
        centerY + (Math.random() - 0.5) * this.game.getScaledValue(60),
        (Math.random() - 0.5) * 8,
        (Math.random() - 0.5) * 8,
        "#FF0000",
        this.game.getScaledValue(4 + Math.random() * 2),
        45,
        "cross"
      );
    }
  }

  createMismatchParticle(x, y, vx, vy, color, size, life, shape = "circle") {
    if (!this.mismatchParticles) {
      this.mismatchParticles = [];
    }

    this.mismatchParticles.push({
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      life: life,
      maxLife: life,
      color: color,
      size: size,
      shape: shape,
    });
  }

  awardPointsForMatch(sock1, sock2) {
    this.game.playerPoints += 1;
    this.game.sockBalls++; // Increment the sockball currency counter
    this.game.totalSockMatches++; // Track lifetime total matches (displays on top bar)

    // Track easter egg sockballs for Sockball Wizard achievement
    this.game.easterEggSockballsCreated++;
    if (
      this.game.easterEggSockballsCreated >=
      GameConfig.ACHIEVEMENTS.SOCKBALL_WIZARD.threshold
    ) {
      this.game.unlockAchievement("sockball_wizard");
    }

    // Track total sockballs earned (for Martha's Millionaire achievement)
    this.game.totalSockballsEarned++;

    this.game.saveGameData();

    this.game.audioManager.playSound("points-gained", false, 0.7);

    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;

    this.pointGainAnimations.push({
      x: centerX,
      y: centerY,
      progress: 0,
      text: "+1",
    });
  }

  toggleAchievementsDrawer() {
    this.achievementsDrawer.isOpen = !this.achievementsDrawer.isOpen;

    if (this.achievementsDrawer.isOpen) {
      this.achievementsDrawer.scrollOffset = 0;
    }
  }

  onMouseWheel(deltaY) {
    // Check audio player first
    if (this.audioPlayer.isOpen) {
      this.audioPlayer.handleScroll(deltaY * 0.5);
      return true;
    }

    if (
      this.achievementsDrawer.isOpen &&
      this.achievementsDrawer.animationProgress > 0.5
    ) {
      // Use a small multiplier instead of scaling to make scrolling subtle
      // deltaY is typically around 100 per wheel tick, so 0.5 gives us ~50px per tick
      const scrollAmount = deltaY * 0.5;
      this.achievementsDrawer.scrollOffset = Math.max(
        0,
        Math.min(
          this.achievementsDrawer.maxScroll,
          this.achievementsDrawer.scrollOffset + scrollAmount
        )
      );
      return true;
    }
    return false;
  }

  createSockBallAnimation(sock1, sock2) {
    const layout = this.layoutCache;
    const startX = (sock1.x + sock2.x) / 2;
    const startY = (sock1.y + sock2.y) / 2;

    const animation = {
      startX: startX,
      startY: startY,
      endX: layout.marthaX,
      endY: layout.marthaY,
      progress: 0,
      type: sock1.type,
    };

    this.sockBallAnimations.push(animation);

    setTimeout(() => {
      this.game.audioManager.playSound("rent-collected", false, 0.5);
      this.marthaWiggling = true;
      this.marthaWiggleTimer = 0;
    }, 1000);
  }

  isLogoClicked(x, y) {
    const layout = this.layoutCache;
    return (
      x >= layout.logoX - layout.logoWidth / 2 &&
      x <= layout.logoX + layout.logoWidth / 2 &&
      y >= layout.logoY - layout.logoHeight / 2 &&
      y <= layout.logoY + layout.logoHeight / 2
    );
  }

  activateEasterEgg() {
    this.logoClickCount++;
    this.game.logoClickCount++; // Track in game for achievement persistence

    // Achievement: LOGO_CLICKER
    if (
      this.game.logoClickCount >= GameConfig.ACHIEVEMENTS.LOGO_CLICKER.threshold
    ) {
      this.game.unlockAchievement("logo_clicker");
    }

    if (!this.easterEggActive) {
      this.easterEggActive = true;

      // Achievement: EASTER_EGG_HUNTER (unlock the easter egg)
      this.game.unlockAchievement("easter_egg_hunter");
    }

    this.spawnSingleSock();
  }

  spawnSingleSock() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    const sock = {
      type: this.currentSockType,
      x:
        canvasWidth / 2 + (Math.random() - 0.5) * this.game.getScaledValue(100),
      y:
        canvasHeight / 2 +
        (Math.random() - 0.5) * this.game.getScaledValue(100),
      size: this.game.getScaledValue((Math.random() + 0.5) * 60),
      vx: (Math.random() - 0.5) * 15,
      vy: (Math.random() - 0.5) * 15,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      glowEffect: 30,
      spawnTime: Date.now(),
    };

    this.menuSocks.push(sock);

    this.currentSockType++;
    if (this.currentSockType > GameConfig.IMAGES.SOCKS.length) {
      this.currentSockType = 1;
    }
  }

  getLevelAtPosition(x, y) {
    const layout = this.layoutCache;

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const col = i % this.levelConfig.columns;
      const row = Math.floor(i / this.levelConfig.columns);

      const levelX =
        layout.levelGridStartX + col * layout.levelHorizontalSpacing;
      const levelY = layout.levelGridStartY + row * layout.levelVerticalSpacing;
      const halfSize = layout.levelButtonSize / 2;

      if (
        x >= levelX - halfSize &&
        x <= levelX + halfSize &&
        y >= levelY - halfSize &&
        y <= levelY + halfSize
      ) {
        return i;
      }
    }

    return -1;
  }

  getSockAtPosition(x, y) {
    for (let i = this.menuSocks.length - 1; i >= 0; i--) {
      const sock = this.menuSocks[i];
      const distance = Math.sqrt(
        Math.pow(x - sock.x, 2) + Math.pow(y - sock.y, 2)
      );

      if (distance < sock.size / 2) {
        return sock;
      }
    }

    return null;
  }

  calculateYouWinImageSize() {
    const spritesheet = GameConfig.YOU_WIN_SPRITESHEET;
    const youWinImage = this.game.images[spritesheet.filename];
    if (!youWinImage) {
      return { width: 0, height: 0 };
    }

    const maxWidth = this.game.getScaledValue(this.YOU_WIN_CONFIG.maxWidth);
    const maxHeight = this.game.getScaledValue(this.YOU_WIN_CONFIG.maxHeight);

    if (this.YOU_WIN_CONFIG.maintainAspectRatio) {
      const aspectRatio = spritesheet.frameWidth / spritesheet.frameHeight;

      if (aspectRatio > maxWidth / maxHeight) {
        return {
          width: maxWidth,
          height: maxWidth / aspectRatio,
        };
      } else {
        return {
          width: maxHeight * aspectRatio,
          height: maxHeight,
        };
      }
    } else {
      return {
        width: maxWidth,
        height: maxHeight,
      };
    }
  }

  renderYouWinGraphic(ctx) {
    const layout = this.layoutCache;
    const spritesheet = GameConfig.YOU_WIN_SPRITESHEET;
    const youWinImage = this.game.images[spritesheet.filename];

    if (youWinImage) {
      ctx.save();

      const time = Date.now();
      const pulseIntensity =
        Math.sin(time * this.YOU_WIN_CONFIG.pulseSpeed) * 0.3 + 0.7;

      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.game.getScaledValue(
        this.YOU_WIN_CONFIG.glowIntensity * pulseIntensity
      );

      const scale = 1 + (pulseIntensity - 0.7) * 0.05;
      ctx.translate(layout.youWinX, layout.youWinY);
      ctx.scale(scale, scale);

      // Calculate spritesheet frame position
      const frameIndex = spritesheet.animationFrames[this.youWinFrameIndex];
      const col = frameIndex % spritesheet.columns;
      const row = Math.floor(frameIndex / spritesheet.columns);
      const sx = col * spritesheet.frameWidth;
      const sy = row * spritesheet.frameHeight;

      ctx.drawImage(
        youWinImage,
        sx,
        sy,
        spritesheet.frameWidth,
        spritesheet.frameHeight,
        -layout.youWinWidth / 2,
        -layout.youWinHeight / 2,
        layout.youWinWidth,
        layout.youWinHeight
      );

      ctx.restore();
    }
  }

  onRender(ctx) {
    this.renderBackground(ctx);
    this.renderLogo(ctx);
    this.renderInstructions(ctx);
    this.renderMarthaImage(ctx);
    this.renderLevelButtons(ctx);

    if (this.areAllLevelsCompleted()) {
      this.renderYouWinGraphic(ctx);
      this.renderVideoButton(ctx);
    }

    // Render easter egg socks BEFORE the top bar so they appear below it
    if (this.easterEggActive) {
      this.renderMenuSocks(ctx);
    }

    this.renderTopBar(ctx);

    // NEW GAME+: Render difficulty selector (only if New Game+ unlocked)
    if (this.game.highestUnlockedDifficulty > 0) {
      this.difficultySelector.render(ctx, this.layoutCache);
    }

    // NEW GAME+: Render difficulty modal if open (only if New Game+ unlocked)
    if (this.game.highestUnlockedDifficulty > 0) {
      this.difficultyModal.render(ctx, this.layoutCache);
    }

    // Render achievements drawer after difficulty modal so it appears on top
    this.renderAchievementsDrawer(ctx);

    if (this.easterEggActive) {
      this.renderEasterDropZonePairBox(ctx);
      this.renderEasterDropZones(ctx);
    }

    this.renderSockBallAnimations(ctx);
    this.renderPointGainAnimations(ctx);
    this.renderMismatchParticles(ctx);

    // Render story viewer modal
    this.storyViewer.renderModal(ctx, this.layoutCache);

    // Render video player modal if active
    if (this.videoPlayerActive) {
      this.renderVideoPlayer(ctx);
    }

    // Render audio player if open
    this.audioPlayer.render(ctx);

    if (this.game.storyManager.showingStory) {
      this.game.storyManager.render(ctx);
    }

    // Render feedback manager (achievement/story notifications) on top of everything
    this.game.feedbackManager.render(ctx);
  }

  renderBackground(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    if (this.game.images["level-select-bg.jpg"]) {
      ctx.drawImage(
        this.game.images["level-select-bg.jpg"],
        0,
        0,
        canvasWidth,
        canvasHeight
      );
    }
  }

  renderLogo(ctx) {
    const layout = this.layoutCache;

    ctx.save();

    // Apply scale effect for click feedback
    if (this.logoPressScale !== 1.0) {
      ctx.translate(layout.logoX, layout.logoY);
      ctx.scale(this.logoPressScale, this.logoPressScale);
      ctx.translate(-layout.logoX, -layout.logoY);
    }

    if (this.easterEggActive) {
      const glowIntensity = this.getGlowIntensity(10, 20);
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = glowIntensity;

      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          layout.logoX - layout.logoWidth / 2,
          layout.logoY - layout.logoHeight / 2,
          layout.logoWidth,
          layout.logoHeight
        );
      }
    } else {
      if (this.game.images["logo.png"]) {
        ctx.drawImage(
          this.game.images["logo.png"],
          layout.logoX - layout.logoWidth / 2,
          layout.logoY - layout.logoHeight / 2,
          layout.logoWidth,
          layout.logoHeight
        );
      }
    }

    ctx.restore();
  }

  renderInstructions(ctx) {
    const layout = this.layoutCache;

    if (this.easterEggActive && this.menuSocks.length > 0) {
      this.renderText(
        ctx,
        "Drag socks to the drop zones for bonus points!",
        layout.centerX,
        layout.instructionsY + layout.mediumSpacing * 2.5,
        {
          fontSize: layout.smallFontSize,
          color: "rgba(255, 215, 0, 0.8)",
        }
      );
    }
  }

  renderMarthaImage(ctx) {
    const layout = this.layoutCache;

    ctx.save();

    // Apply wiggle if active
    if (this.marthaWiggling) {
      const wiggleAmount = Math.sin(this.marthaWiggleTimer * 0.02) * 5;
      ctx.translate(layout.marthaX + wiggleAmount, layout.marthaY);
    } else {
      ctx.translate(layout.marthaX, layout.marthaY);
    }

    // Render either the spritesheet animation or the static image
    if (this.marthaLaughing) {
      // Draw spritesheet animation with correct aspect ratio
      const spritesheet = GameConfig.MARTHA_LAUGHING_SPRITESHEET;
      const marthaImage = this.game.images[spritesheet.filename];

      if (marthaImage && marthaImage.complete && marthaImage.naturalWidth > 0) {
        const frameNumber =
          spritesheet.animationFrames[this.marthaLaughFrameIndex];
        const col = frameNumber % spritesheet.columns;
        const row = Math.floor(frameNumber / spritesheet.columns);
        const sx = col * spritesheet.frameWidth;
        const sy = row * spritesheet.frameHeight;

        // Calculate correct dimensions maintaining spritesheet aspect ratio
        // Match the width to the static image and calculate height proportionally, then scale up by 20%
        const spritesheetAspectRatio =
          spritesheet.frameWidth / spritesheet.frameHeight;
        const drawWidth = layout.marthaWidth * 1.3;
        const drawHeight = (layout.marthaWidth / spritesheetAspectRatio) * 1.3;

        ctx.drawImage(
          marthaImage,
          sx,
          sy,
          spritesheet.frameWidth,
          spritesheet.frameHeight,
          -drawWidth / 2,
          -drawHeight / 2,
          drawWidth,
          drawHeight
        );
      }
    } else {
      // Draw static image
      if (this.game.images["martha-demand-level-select.png"]) {
        ctx.drawImage(
          this.game.images["martha-demand-level-select.png"],
          -layout.marthaWidth / 2,
          -layout.marthaHeight / 2,
          layout.marthaWidth,
          layout.marthaHeight
        );
      }
    }

    ctx.restore();

    // Render quote bubble if showing
    if (this.showingQuote && this.currentQuote) {
      this.renderMarthaQuote(ctx, layout);
    }
  }

  renderMarthaQuote(ctx, layout) {
    ctx.save();

    // No fade animations - quote is always fully visible
    const alpha = 1;

    // Position quote bubble below Martha
    const bubbleX = layout.marthaX;
    const bubbleY =
      layout.marthaY + layout.marthaHeight / 2 + this.game.getScaledValue(60);

    const padding = this.game.getScaledValue(15);
    const fontSize = this.game.getScaledValue(16);
    const maxWidth = this.game.getScaledValue(280);

    // Measure text
    ctx.font = `bold ${fontSize}px Arial`;
    const words = this.currentQuote.split(" ");
    const lines = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = currentLine + " " + words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth - padding * 2) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    const lineHeight = fontSize * 1.3;
    const bubbleWidth = Math.min(
      maxWidth,
      Math.max(...lines.map((line) => ctx.measureText(line).width)) +
        padding * 2
    );
    const bubbleHeight = lines.length * lineHeight + padding * 2;

    // Draw speech bubble tail pointing upward
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.strokeStyle = "rgba(0, 0, 0, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(2);

    const tailSize = this.game.getScaledValue(15);
    ctx.beginPath();
    // Move tail point up by tailSize so it extends above the bubble
    ctx.moveTo(bubbleX, bubbleY - bubbleHeight / 2 - tailSize);
    ctx.lineTo(bubbleX - tailSize / 2, bubbleY - bubbleHeight / 2);
    ctx.lineTo(bubbleX + tailSize / 2, bubbleY - bubbleHeight / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw bubble background
    const radius = this.game.getScaledValue(10);
    const bubbleLeft = bubbleX - bubbleWidth / 2;
    const bubbleTop = bubbleY - bubbleHeight / 2;

    ctx.beginPath();
    ctx.moveTo(bubbleLeft + radius, bubbleTop);
    ctx.lineTo(bubbleLeft + bubbleWidth - radius, bubbleTop);
    ctx.arcTo(
      bubbleLeft + bubbleWidth,
      bubbleTop,
      bubbleLeft + bubbleWidth,
      bubbleTop + radius,
      radius
    );
    ctx.lineTo(bubbleLeft + bubbleWidth, bubbleTop + bubbleHeight - radius);
    ctx.arcTo(
      bubbleLeft + bubbleWidth,
      bubbleTop + bubbleHeight,
      bubbleLeft + bubbleWidth - radius,
      bubbleTop + bubbleHeight,
      radius
    );
    ctx.lineTo(bubbleLeft + radius, bubbleTop + bubbleHeight);
    ctx.arcTo(
      bubbleLeft,
      bubbleTop + bubbleHeight,
      bubbleLeft,
      bubbleTop + bubbleHeight - radius,
      radius
    );
    ctx.lineTo(bubbleLeft, bubbleTop + radius);
    ctx.arcTo(bubbleLeft, bubbleTop, bubbleLeft + radius, bubbleTop, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textStartY = bubbleY - ((lines.length - 1) * lineHeight) / 2;
    lines.forEach((line, index) => {
      ctx.fillText(line, bubbleX, textStartY + index * lineHeight);
    });

    ctx.restore();
  }

  renderTopBar(ctx) {
    const layout = this.layoutCache;
    const canvasWidth = this.game.getCanvasWidth();

    // Draw top bar background
    ctx.save();
    ctx.fillStyle = GameConfig.UI_BAR.backgroundColor;
    ctx.fillRect(0, layout.barY, canvasWidth, layout.barHeight);

    // Draw bottom border
    ctx.strokeStyle = GameConfig.UI_BAR.borderColor;
    ctx.lineWidth = this.game.getScaledValue(GameConfig.UI_BAR.borderWidth);
    ctx.beginPath();
    ctx.moveTo(0, layout.barY + layout.barHeight);
    ctx.lineTo(canvasWidth, layout.barY + layout.barHeight);
    ctx.stroke();
    ctx.restore();

    // Player stats (left side)
    // Draw money icon
    if (this.game.images["icon-money.png"]) {
      const moneyIcon = this.game.images["icon-money.png"];
      const iconHeight = this.game.getScaledValue(40);
      const iconWidth = iconHeight * (moneyIcon.width / moneyIcon.height);
      ctx.drawImage(
        moneyIcon,
        layout.statsX - this.game.getScaledValue(50) - iconWidth / 2,
        layout.statsY - iconHeight / 2,
        iconWidth,
        iconHeight
      );
    }

    this.renderText(
      ctx,
      `${this.game.playerPoints}`,
      layout.statsX,
      layout.statsY,
      {
        fontSize: layout.headerFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 215, 0, 0.9)",
        weight: "bold",
      }
    );

    // Draw sock icon
    if (this.game.images["icon-sock.png"]) {
      const sockIcon = this.game.images["icon-sock.png"];
      const sockIconHeight = this.game.getScaledValue(40);
      const sockIconWidth = sockIconHeight * (sockIcon.width / sockIcon.height);
      ctx.drawImage(
        sockIcon,
        layout.statsX + this.game.getScaledValue(120) - sockIconWidth / 2,
        layout.statsY - sockIconHeight / 2,
        sockIconWidth,
        sockIconHeight
      );
    }

    this.renderText(
      ctx,
      `${this.game.totalSockMatches}`,
      layout.statsX + this.game.getScaledValue(155),
      layout.statsY,
      {
        fontSize: layout.headerFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 215, 0, 0.9)",
        weight: "bold",
      }
    );

    // Buttons (right side)
    this.renderTopBarButton(
      ctx,
      layout.achievementsButtonX,
      layout.achievementsButtonY,
      layout.achievementsButtonWidth,
      layout.achievementsButtonHeight,
      "Trophies",
      this.achievementsDrawer.button.hovered,
      "rgba(218, 165, 32, 0.8)",
      null,
      false,
      "btn-trophies.png"
    );

    // Audio Player button (always visible if at least one track is unlocked)
    if (
      this.audioPlayer &&
      this.audioPlayer.game.unlockedTracks &&
      this.audioPlayer.game.unlockedTracks.length > 0
    ) {
      this.renderTopBarButton(
        ctx,
        layout.audioPlayerButtonX,
        layout.audioPlayerButtonY,
        layout.audioPlayerButtonWidth,
        layout.audioPlayerButtonHeight,
        "Music",
        this.audioPlayerButton.hovered,
        "rgba(138, 43, 226, 0.8)",
        null,
        false,
        "btn-audioplayer.png"
      );
    }

    this.renderTopBarButton(
      ctx,
      layout.storyReplayButtonX,
      layout.storyReplayButtonY,
      layout.storyReplayButtonWidth,
      layout.storyReplayButtonHeight,
      "How to Play",
      this.storyReplayButton.hovered,
      "rgba(70, 130, 180, 0.8)",
      null,
      false,
      "btn-htp.png"
    );

    // Calculate unlocked lore count
    const unlockedLoreCount = this.game.unlockedStoryPanels.filter(
      (u) => u
    ).length;

    // Check if there are unviewed panels to enable pulse
    const hasUnviewedPanels = this.storyViewer.hasUnviewedPanels();

    this.renderTopBarButton(
      ctx,
      layout.storyViewerButtonX,
      layout.storyViewerButtonY,
      layout.storyViewerButtonWidth,
      layout.storyViewerButtonHeight,
      "Story",
      this.storyViewer.button.hovered,
      "rgba(138, 43, 226, 0.8)",
      null, // Remove x/9 display
      unlockedLoreCount === 0, // isDisabled when no panels unlocked
      "btn-story.png",
      hasUnviewedPanels // Pulse when there are unviewed panels
    );

    this.renderTopBarButton(
      ctx,
      layout.creditsButtonX,
      layout.creditsButtonY,
      layout.creditsButtonWidth,
      layout.creditsButtonHeight,
      "Credits",
      this.creditsButton.hovered,
      "rgba(100, 100, 100, 0.8)",
      null,
      false,
      "btn-credits.png"
    );
  }

  renderTopBarButton(
    ctx,
    x,
    y,
    width,
    height,
    text,
    isHovered,
    baseColor,
    countBadge = null,
    isDisabled = false,
    imageKey = null,
    shouldPulse = false
  ) {
    ctx.save();

    const buttonLeft = x - width / 2;
    const buttonTop = y - height / 2;

    // If an image is provided, render it instead of the old button style
    if (imageKey && this.game.images[imageKey]) {
      const buttonImage = this.game.images[imageKey];

      // Always fit to height to ensure consistent button heights
      // Calculate width based on image aspect ratio
      const imageAspectRatio = buttonImage.width / buttonImage.height;

      let drawWidth, drawHeight, drawX, drawY;

      drawHeight = height;
      drawWidth = height * imageAspectRatio;
      drawX = buttonLeft + (width - drawWidth) / 2;
      drawY = buttonTop;

      // Apply hover and disabled effects
      if (isDisabled) {
        ctx.globalAlpha = 0.5;
      } else if (isHovered) {
        ctx.globalAlpha = 1.0;
        // Optional: Add a subtle glow or highlight
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 10;
      } else {
        ctx.globalAlpha = 0.9;
      }

      // Add pulse effect if requested
      if (shouldPulse && !isDisabled) {
        const pulseFrequency = 0.002; // Slower pulse
        const pulseAmount =
          Math.sin(this.storyViewer.pulseTimer * pulseFrequency) * 0.5 + 0.5;
        const glowIntensity = 0.3 + pulseAmount * 0.7;

        ctx.shadowColor = `rgba(255, 100, 255, ${glowIntensity})`;
        ctx.shadowBlur = this.game.getScaledValue(15 + pulseAmount * 10);
      }

      ctx.drawImage(buttonImage, drawX, drawY, drawWidth, drawHeight);

      // Reset effects
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;

      // Count badge below image
      if (countBadge) {
        this.renderText(
          ctx,
          countBadge,
          x,
          y + height / 2 + this.game.getScaledValue(10),
          {
            fontSize: this.game.getScaledValue(12),
            align: "center",
            baseline: "middle",
            color: isDisabled
              ? "rgba(150, 150, 150, 0.6)"
              : "rgba(255, 215, 0, 0.9)",
            weight: "bold",
          }
        );
      }
    } else {
      // Original rendering code (fallback if no image provided)
      const radius = this.game.getScaledValue(6);

      // Button background
      if (isDisabled) {
        ctx.fillStyle = "rgba(80, 80, 80, 0.5)";
      } else {
        ctx.fillStyle = isHovered ? this.lightenColor(baseColor) : baseColor;
      }

      ctx.strokeStyle = isDisabled
        ? "rgba(100, 100, 100, 0.3)"
        : isHovered
        ? "rgba(255, 255, 255, 0.8)"
        : "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = 2;

      // Rounded rectangle
      ctx.beginPath();
      ctx.moveTo(buttonLeft + radius, buttonTop);
      ctx.lineTo(buttonLeft + width - radius, buttonTop);
      ctx.arcTo(
        buttonLeft + width,
        buttonTop,
        buttonLeft + width,
        buttonTop + radius,
        radius
      );
      ctx.lineTo(buttonLeft + width, buttonTop + height - radius);
      ctx.arcTo(
        buttonLeft + width,
        buttonTop + height,
        buttonLeft + width - radius,
        buttonTop + height,
        radius
      );
      ctx.lineTo(buttonLeft + radius, buttonTop + height);
      ctx.arcTo(
        buttonLeft,
        buttonTop + height,
        buttonLeft,
        buttonTop + height - radius,
        radius
      );
      ctx.lineTo(buttonLeft, buttonTop + radius);
      ctx.arcTo(buttonLeft, buttonTop, buttonLeft + radius, buttonTop, radius);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Button text
      this.renderText(
        ctx,
        text,
        x,
        y - (countBadge ? this.game.getScaledValue(6) : 0),
        {
          fontSize: this.layoutCache.smallFontSize,
          align: "center",
          baseline: "middle",
          color: isDisabled
            ? "rgba(150, 150, 150, 0.6)"
            : "rgba(255, 255, 255, 0.9)",
          weight: "bold",
        }
      );

      // Count badge below text
      if (countBadge) {
        this.renderText(ctx, countBadge, x, y + this.game.getScaledValue(12), {
          fontSize: this.game.getScaledValue(12),
          align: "center",
          baseline: "middle",
          color: isDisabled
            ? "rgba(150, 150, 150, 0.6)"
            : "rgba(255, 215, 0, 0.9)",
          weight: "bold",
        });
      }
    }

    ctx.restore();
  }

  lightenColor(color) {
    // Simple color lightening - increase opacity or brightness
    return color.replace(/[\d.]+\)$/, (match) => {
      const opacity = parseFloat(match);
      return Math.min(opacity + 0.1, 1.0) + ")";
    });
  }

  renderCreditsButton(ctx) {
    const layout = this.layoutCache;
    const button = this.creditsButton;

    const hoverProgress = button.hoverProgress || 0;

    ctx.save();

    const x = layout.creditsButtonX - layout.creditsButtonWidth / 2;
    const y = layout.creditsButtonY - layout.creditsButtonHeight / 2;
    const radius = this.game.getScaledValue(8);

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x,
      y + layout.creditsButtonHeight
    );
    const baseColor1 = { r: 80, g: 120, b: 200, a: 0.85 };
    const hoverColor1 = { r: 100, g: 150, b: 255, a: 0.95 };
    const baseColor2 = { r: 50, g: 85, b: 180, a: 0.85 };
    const hoverColor2 = { r: 65, g: 105, b: 225, a: 0.95 };

    const r1 = baseColor1.r + (hoverColor1.r - baseColor1.r) * hoverProgress;
    const g1 = baseColor1.g + (hoverColor1.g - baseColor1.g) * hoverProgress;
    const b1 = baseColor1.b + (hoverColor1.b - baseColor1.b) * hoverProgress;
    const a1 = baseColor1.a + (hoverColor1.a - baseColor1.a) * hoverProgress;

    const r2 = baseColor2.r + (hoverColor2.r - baseColor2.r) * hoverProgress;
    const g2 = baseColor2.g + (hoverColor2.g - baseColor2.g) * hoverProgress;
    const b2 = baseColor2.b + (hoverColor2.b - baseColor2.b) * hoverProgress;
    const a2 = baseColor2.a + (hoverColor2.a - baseColor2.a) * hoverProgress;

    gradient.addColorStop(0, `rgba(${r1}, ${g1}, ${b1}, ${a1})`);
    gradient.addColorStop(1, `rgba(${r2}, ${g2}, ${b2}, ${a2})`);
    ctx.fillStyle = gradient;

    if (hoverProgress > 0) {
      ctx.shadowColor = "rgba(100, 150, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12) * hoverProgress;
    }

    const strokeOpacity = 0.6 + 0.3 * hoverProgress;
    ctx.strokeStyle = `rgba(${100 + 50 * hoverProgress}, ${
      149 + 51 * hoverProgress
    }, 237, ${strokeOpacity})`;
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + layout.creditsButtonWidth - radius, y);
    ctx.quadraticCurveTo(
      x + layout.creditsButtonWidth,
      y,
      x + layout.creditsButtonWidth,
      y + radius
    );
    ctx.lineTo(
      x + layout.creditsButtonWidth,
      y + layout.creditsButtonHeight - radius
    );
    ctx.quadraticCurveTo(
      x + layout.creditsButtonWidth,
      y + layout.creditsButtonHeight,
      x + layout.creditsButtonWidth - radius,
      y + layout.creditsButtonHeight
    );
    ctx.lineTo(x + radius, y + layout.creditsButtonHeight);
    ctx.quadraticCurveTo(
      x,
      y + layout.creditsButtonHeight,
      x,
      y + layout.creditsButtonHeight - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    if (hoverProgress > 0) {
      ctx.shadowColor = "rgba(100, 149, 237, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(10) * hoverProgress;
      ctx.stroke();
    }

    ctx.restore();

    this.renderText(
      ctx,
      "Credits",
      layout.creditsButtonX,
      layout.creditsButtonY,
      {
        fontSize: layout.smallFontSize,
        color: "white",
        weight: "bold",
      }
    );
  }

  renderStoryReplayButton(ctx) {
    const layout = this.layoutCache;
    const button = this.storyReplayButton;

    ctx.save();

    const x = layout.storyReplayButtonX - layout.storyReplayButtonWidth / 2;
    const y = layout.storyReplayButtonY - layout.storyReplayButtonHeight / 2;
    const radius = this.game.getScaledValue(8);

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x,
      y + layout.storyReplayButtonHeight
    );
    if (button.hovered) {
      gradient.addColorStop(0, "rgba(100, 150, 255, 0.95)");
      gradient.addColorStop(1, "rgba(65, 105, 225, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(80, 120, 200, 0.85)");
      gradient.addColorStop(1, "rgba(50, 85, 180, 0.85)");
    }
    ctx.fillStyle = gradient;

    if (button.hovered) {
      ctx.shadowColor = "rgba(100, 150, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    ctx.strokeStyle = button.hovered
      ? "rgba(150, 200, 255, 0.9)"
      : "rgba(100, 149, 237, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + layout.storyReplayButtonWidth - radius, y);
    ctx.quadraticCurveTo(
      x + layout.storyReplayButtonWidth,
      y,
      x + layout.storyReplayButtonWidth,
      y + radius
    );
    ctx.lineTo(
      x + layout.storyReplayButtonWidth,
      y + layout.storyReplayButtonHeight - radius
    );
    ctx.quadraticCurveTo(
      x + layout.storyReplayButtonWidth,
      y + layout.storyReplayButtonHeight,
      x + layout.storyReplayButtonWidth - radius,
      y + layout.storyReplayButtonHeight
    );
    ctx.lineTo(x + radius, y + layout.storyReplayButtonHeight);
    ctx.quadraticCurveTo(
      x,
      y + layout.storyReplayButtonHeight,
      x,
      y + layout.storyReplayButtonHeight - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    if (button.hovered) {
      ctx.shadowColor = "rgba(100, 149, 237, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(10);
      ctx.stroke();
    }

    ctx.restore();

    this.renderText(
      ctx,
      "📖 How to Play",
      layout.storyReplayButtonX,
      layout.storyReplayButtonY,
      {
        fontSize: layout.smallFontSize,
        color: "white",
        weight: "bold",
      }
    );
  }

  renderStoryViewerButton(ctx) {
    const layout = this.layoutCache;
    const button = this.storyViewer.button;

    // Check how many panels are unlocked
    const unlockedCount = this.game.unlockedStoryPanels.filter((u) => u).length;
    if (unlockedCount === 0) return; // Don't show button if no panels unlocked

    ctx.save();

    const x = layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2;
    const y = layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2;
    const radius = this.game.getScaledValue(8);

    const gradient = ctx.createLinearGradient(
      x,
      y,
      x,
      y + layout.storyViewerButtonHeight
    );
    if (button.hovered) {
      gradient.addColorStop(0, "rgba(180, 100, 255, 0.95)");
      gradient.addColorStop(1, "rgba(130, 65, 225, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(150, 80, 200, 0.85)");
      gradient.addColorStop(1, "rgba(100, 50, 180, 0.85)");
    }
    ctx.fillStyle = gradient;

    if (button.hovered) {
      ctx.shadowColor = "rgba(180, 100, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    ctx.strokeStyle = button.hovered
      ? "rgba(200, 150, 255, 0.9)"
      : "rgba(150, 100, 237, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + layout.storyViewerButtonWidth - radius, y);
    ctx.quadraticCurveTo(
      x + layout.storyViewerButtonWidth,
      y,
      x + layout.storyViewerButtonWidth,
      y + radius
    );
    ctx.lineTo(
      x + layout.storyViewerButtonWidth,
      y + layout.storyViewerButtonHeight - radius
    );
    ctx.quadraticCurveTo(
      x + layout.storyViewerButtonWidth,
      y + layout.storyViewerButtonHeight,
      x + layout.storyViewerButtonWidth - radius,
      y + layout.storyViewerButtonHeight
    );
    ctx.lineTo(x + radius, y + layout.storyViewerButtonHeight);
    ctx.quadraticCurveTo(
      x,
      y + layout.storyViewerButtonHeight,
      x,
      y + layout.storyViewerButtonHeight - radius
    );
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();

    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.renderText(
      ctx,
      "📚 Story",
      layout.storyViewerButtonX,
      layout.storyViewerButtonY,
      {
        fontSize: layout.smallFontSize,
        color: "white",
        weight: "bold",
      }
    );
  }

  renderAchievementsDrawer(ctx) {
    const layout = this.layoutCache;
    const progress = this.achievementsDrawer.animationProgress;

    // Button is now rendered in the top bar, so only render the drawer
    if (progress > 0) {
      const drawerWidth = layout.achievementsDrawerWidth;
      const drawerX = -drawerWidth + drawerWidth * progress;
      const canvasHeight = this.game.getCanvasHeight();

      ctx.save();

      const bgGradient = ctx.createLinearGradient(
        drawerX,
        0,
        drawerX + drawerWidth,
        0
      );
      bgGradient.addColorStop(0, "rgba(20, 20, 40, 0.98)");
      bgGradient.addColorStop(1, "rgba(30, 30, 50, 0.98)");
      ctx.fillStyle = bgGradient;
      ctx.fillRect(drawerX, 0, drawerWidth, canvasHeight);

      ctx.shadowColor = "rgba(255, 215, 0, 0.4)";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(drawerX + drawerWidth, 0);
      ctx.lineTo(drawerX + drawerWidth, canvasHeight);
      ctx.stroke();

      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      ctx.save();
      ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(20);
      this.renderText(
        ctx,
        "TROPHIES",
        drawerX + drawerWidth / 2,
        this.game.getScaledValue(35),
        {
          fontSize: layout.headerFontSize,
          align: "center",
          color: "#FFD700",
          weight: "bold",
        }
      );
      ctx.restore();

      // Calculate unlocked/total achievements
      const allAchievements = Object.values(GameConfig.ACHIEVEMENTS);
      const unlockedCount = allAchievements.filter(
        (achievement) =>
          this.game.achievements &&
          this.game.achievements[achievement.id]?.unlocked
      ).length;
      const totalCount = allAchievements.length;

      // Render achievement counter
      this.renderText(
        ctx,
        `${unlockedCount} / ${totalCount}`,
        drawerX + drawerWidth / 2,
        this.game.getScaledValue(55),
        {
          fontSize: layout.normalFontSize,
          align: "center",
          color: unlockedCount === totalCount ? "#FFD700" : "#B0B0B0",
          weight: "normal",
        }
      );

      ctx.strokeStyle = "rgba(255, 215, 0, 0.3)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(
        drawerX + this.game.getScaledValue(20),
        this.game.getScaledValue(75)
      );
      ctx.lineTo(
        drawerX + drawerWidth - this.game.getScaledValue(20),
        this.game.getScaledValue(75)
      );
      ctx.stroke();

      // Render close button with red X icon
      const closeButtonSize = this.game.getScaledValue(40);
      const closeButtonX = drawerX + drawerWidth - this.game.getScaledValue(30); // Moved left by 10px
      const closeButtonY = this.game.getScaledValue(30); // Moved down by 10px

      ctx.save();

      // Apply hover scale effect
      if (this.achievementsDrawer.closeButton.hovered) {
        ctx.translate(closeButtonX, closeButtonY);
        ctx.scale(1.1, 1.1);
        ctx.translate(-closeButtonX, -closeButtonY);
      }

      // Close button background
      if (this.achievementsDrawer.closeButton.hovered) {
        ctx.fillStyle = "rgba(212, 175, 55, 0.2)";
      } else {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
      }

      ctx.beginPath();
      ctx.arc(closeButtonX, closeButtonY, closeButtonSize / 2, 0, Math.PI * 2);
      ctx.fill();

      // Close button border
      if (this.achievementsDrawer.closeButton.hovered) {
        ctx.strokeStyle = "rgba(212, 175, 55, 0.5)";
      } else {
        ctx.strokeStyle = "rgba(212, 175, 55, 0.3)";
      }
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(closeButtonX, closeButtonY, closeButtonSize / 2, 0, Math.PI * 2);
      ctx.stroke();

      // Draw red X icon
      if (this.game.images["icon-redx.png"]) {
        const redXIcon = this.game.images["icon-redx.png"];
        const iconSize = this.game.getScaledValue(24);
        ctx.drawImage(
          redXIcon,
          closeButtonX - iconSize / 2,
          closeButtonY - iconSize / 2,
          iconSize,
          iconSize
        );
      }

      ctx.restore();

      const contentStartY = this.game.getScaledValue(80);
      const contentEndY = canvasHeight - this.game.getScaledValue(20);
      const contentHeight = contentEndY - contentStartY;

      ctx.save();
      ctx.beginPath();
      ctx.rect(drawerX, contentStartY, drawerWidth, contentHeight);
      ctx.clip();

      const achievements = Object.values(GameConfig.ACHIEVEMENTS);
      const startY = this.game.getScaledValue(115);
      const spacing = this.game.getScaledValue(75);
      const cardMargin = this.game.getScaledValue(15);

      const totalContentHeight = achievements.length * spacing;
      this.achievementsDrawer.maxScroll = Math.max(
        0,
        totalContentHeight - contentHeight + this.game.getScaledValue(40)
      );

      achievements.forEach((achievement, index) => {
        const achY =
          startY + index * spacing - this.achievementsDrawer.scrollOffset;
        const unlocked =
          this.game.achievements &&
          this.game.achievements[achievement.id]?.unlocked;
        const isHovered =
          this.achievementsDrawer.hoveredAchievement === achievement.id;

        if (achY < contentStartY - spacing || achY > contentEndY + spacing) {
          return;
        }

        ctx.save();

        const cardX = drawerX + cardMargin;
        const cardY = achY;
        const cardWidth =
          drawerWidth - cardMargin * 2 - this.game.getScaledValue(25);
        const cardHeight = this.game.getScaledValue(65);
        const cardRadius = this.game.getScaledValue(8);

        // Calculate progress for achievements with thresholds
        let progressPercent = 0;
        if (achievement.threshold && !unlocked) {
          // Map achievement IDs to their progress values
          const progressMap = {
            sock_hoarder: this.game.totalSockMatches,
            deep_pockets: this.game.playerPoints,
            big_spender: this.game.totalMoneySpent,
            marthas_millionaire: this.game.totalSockballsEarned,
            veteran_tenant: this.game.levelsPlayed,
            sockball_wizard: this.game.easterEggSockballsCreated,
            logo_clicker: this.game.logoClickCount,
            butterfingers:
              this.game.achievements[achievement.id]?.consecutiveMisses || 0,
            pinball_king: this.game.totalWallBounceCatches,
            bonus_master: this.game.totalBonusHits,
            space_shooter: this.game.totalDoubleBounces,
            disaster_prone: this.game.totalLevelLosses || 0,
            grind_master: this.game.totalLevelsPlayed || 0,
            thats_my_song: this.game.audioPlayer?.getMostPlayedCount() || 0,
            kinda_perfect: this.game.totalPerfectShots || 0,
            perfection: this.game.totalPerfectShots || 0,
            good_enough: this.game.totalGoodShots || 0,
            flub_king: this.game.totalFlubs || 0,
            pincer_addict: this.game.totalPincers || 0,
            miss_miss_miss: this.game.totalMisses || 0,
            mismatch_queen: this.game.lifetimeMismatches || 0,
            snap_master: this.game.totalSnapPlacements || 0,
            video_completionist: this.game.watchedVideos?.length || 0,
            speed_royalty: this.game.consecutiveWins || 0,
            baby_speed_run: this.game.consecutiveWins || 0,
            speed_run: this.game.consecutiveWins || 0,
            deadeye: this.game.consecutiveHits || 0,
            streak_king: this.game.achievements[achievement.id]?.maxStreak || 0,
            combo_master:
              this.game.achievements[achievement.id]?.maxStreak || 0,
            sock_sniper:
              this.game.achievements[achievement.id]?.consecutivePerfects || 0,
            pinball_wizard:
              this.game.achievements[achievement.id]?.wallBouncesThisLevel || 0,
            mismatch_chaos:
              this.game.achievements[achievement.id]?.mismatchesThisLevel || 0,
            double_snap:
              this.game.achievements[achievement.id]?.snapsThisGame || 0,
            one_at_a_time:
              this.game.achievements[achievement.id]?.sameTypeStreak || 0,
            momentum_killer:
              this.game.achievements[achievement.id]?.streakBeforeBreak || 0,
            no_hope:
              this.game.achievements[achievement.id]?.missesThisGame || 0,
            sock_master:
              this.game.completedLevelsByDifficulty[0]?.filter((c) => c)
                .length || 0,
            halfway_there:
              this.game.completedLevelsByDifficulty[0]
                ?.slice(0, 5)
                .filter((c) => c).length || 0,
            lore_master: this.game.storyPanelsRead?.length || 0,
          };

          const currentProgress = progressMap[achievement.id] || 0;
          progressPercent = Math.min(
            currentProgress / achievement.threshold,
            1
          );
        }

        const cardGradient = ctx.createLinearGradient(
          cardX,
          cardY,
          cardX,
          cardY + cardHeight
        );
        if (unlocked) {
          if (isHovered) {
            cardGradient.addColorStop(0, "rgba(255, 215, 0, 0.35)");
            cardGradient.addColorStop(1, "rgba(255, 165, 0, 0.25)");
          } else {
            cardGradient.addColorStop(0, "rgba(255, 215, 0, 0.25)");
            cardGradient.addColorStop(1, "rgba(255, 165, 0, 0.15)");
          }
        } else {
          if (isHovered) {
            cardGradient.addColorStop(0, "rgba(60, 60, 80, 0.25)");
            cardGradient.addColorStop(1, "rgba(40, 40, 60, 0.15)");
          } else {
            cardGradient.addColorStop(0, "rgba(60, 60, 80, 0.15)");
            cardGradient.addColorStop(1, "rgba(40, 40, 60, 0.1)");
          }
        }
        ctx.fillStyle = cardGradient;

        ctx.beginPath();
        ctx.moveTo(cardX + cardRadius, cardY);
        ctx.lineTo(cardX + cardWidth - cardRadius, cardY);
        ctx.quadraticCurveTo(
          cardX + cardWidth,
          cardY,
          cardX + cardWidth,
          cardY + cardRadius
        );
        ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cardRadius);
        ctx.quadraticCurveTo(
          cardX + cardWidth,
          cardY + cardHeight,
          cardX + cardWidth - cardRadius,
          cardY + cardHeight
        );
        ctx.lineTo(cardX + cardRadius, cardY + cardHeight);
        ctx.quadraticCurveTo(
          cardX,
          cardY + cardHeight,
          cardX,
          cardY + cardHeight - cardRadius
        );
        ctx.lineTo(cardX, cardY + cardRadius);
        ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
        ctx.closePath();
        ctx.fill();

        // Draw progress fill for achievements with thresholds (only if not unlocked)
        if (achievement.threshold && !unlocked && progressPercent >= 0) {
          const progressWidth = cardWidth * progressPercent;

          ctx.save();
          // Clip to card shape
          ctx.beginPath();
          ctx.moveTo(cardX + cardRadius, cardY);
          ctx.lineTo(cardX + cardWidth - cardRadius, cardY);
          ctx.quadraticCurveTo(
            cardX + cardWidth,
            cardY,
            cardX + cardWidth,
            cardY + cardRadius
          );
          ctx.lineTo(cardX + cardWidth, cardY + cardHeight - cardRadius);
          ctx.quadraticCurveTo(
            cardX + cardWidth,
            cardY + cardHeight,
            cardX + cardWidth - cardRadius,
            cardY + cardHeight
          );
          ctx.lineTo(cardX + cardRadius, cardY + cardHeight);
          ctx.quadraticCurveTo(
            cardX,
            cardY + cardHeight,
            cardX,
            cardY + cardHeight - cardRadius
          );
          ctx.lineTo(cardX, cardY + cardRadius);
          ctx.quadraticCurveTo(cardX, cardY, cardX + cardRadius, cardY);
          ctx.closePath();
          ctx.clip();

          // Draw progress fill
          const progressGradient = ctx.createLinearGradient(
            cardX,
            cardY,
            cardX,
            cardY + cardHeight
          );
          progressGradient.addColorStop(0, "rgba(100, 180, 255, 0.1)");
          progressGradient.addColorStop(1, "rgba(60, 120, 200, 0.05)");

          ctx.fillStyle = progressGradient;
          ctx.fillRect(cardX, cardY, progressWidth, cardHeight);

          // Add a subtle glow at the edge of progress
          if (progressPercent < 1) {
            const edgeGradient = ctx.createLinearGradient(
              cardX + progressWidth - this.game.getScaledValue(15),
              cardY,
              cardX + progressWidth + this.game.getScaledValue(5),
              cardY
            );
            edgeGradient.addColorStop(0, "rgba(100, 180, 255, 0)");
            edgeGradient.addColorStop(0.5, "rgba(100, 180, 255, 0.4)");
            edgeGradient.addColorStop(1, "rgba(100, 180, 255, 0)");

            ctx.fillStyle = edgeGradient;
            ctx.fillRect(
              cardX + progressWidth - this.game.getScaledValue(15),
              cardY,
              this.game.getScaledValue(20),
              cardHeight
            );
          }

          ctx.restore();
        }

        if (unlocked) {
          ctx.strokeStyle = isHovered
            ? "rgba(255, 215, 0, 0.7)"
            : "rgba(255, 215, 0, 0.5)";
          ctx.lineWidth = 2;
          ctx.stroke();
        } else {
          ctx.strokeStyle = isHovered
            ? "rgba(100, 100, 120, 0.5)"
            : "rgba(100, 100, 120, 0.3)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }

        const iconX = cardX + this.game.getScaledValue(30);
        const iconY = cardY + cardHeight / 2;

        ctx.globalAlpha = unlocked ? 1 : 0.4;

        // Check if icon is an image path or emoji
        if (achievement.icon.endsWith(".png")) {
          // Render as image with aspect ratio maintained
          const maxIconSize = this.game.getScaledValue(32);
          const iconImage = this.game.images[achievement.icon];
          if (iconImage) {
            const aspectRatio = iconImage.width / iconImage.height;
            let iconWidth, iconHeight;

            if (aspectRatio > 1) {
              // Wider than tall
              iconWidth = maxIconSize;
              iconHeight = maxIconSize / aspectRatio;
            } else {
              // Taller than wide or square
              iconHeight = maxIconSize;
              iconWidth = maxIconSize * aspectRatio;
            }

            ctx.drawImage(
              iconImage,
              iconX - iconWidth / 2,
              iconY - iconHeight / 2,
              iconWidth,
              iconHeight
            );
          }
        } else {
          // Render as emoji text
          this.renderText(ctx, achievement.icon, iconX, iconY, {
            fontSize: this.game.getScaledValue(32),
            align: "center",
            baseline: "middle",
          });
        }

        ctx.globalAlpha = 1;

        const textX = cardX + this.game.getScaledValue(60);
        const nameY = cardY + this.game.getScaledValue(20);

        ctx.font = `bold ${layout.smallFontSize}px "Arial", monospace`;
        ctx.fillStyle = unlocked ? "#FFD700" : "rgba(255, 255, 255, 0.5)";
        ctx.textAlign = "left";
        ctx.textBaseline = "top";

        let displayName = achievement.name;
        const maxTextWidth = cardWidth - this.game.getScaledValue(80);
        let textWidth = ctx.measureText(displayName).width;

        if (textWidth > maxTextWidth) {
          while (textWidth > maxTextWidth && displayName.length > 0) {
            displayName = displayName.slice(0, -1);
            textWidth = ctx.measureText(displayName + "...").width;
          }
          displayName += "...";
        }

        ctx.fillText(displayName, textX, nameY);

        const descY = cardY + this.game.getScaledValue(40);

        ctx.font = `${layout.smallFontSize - 2}px "Arial", monospace`;
        ctx.fillStyle = unlocked
          ? "rgba(255, 255, 255, 0.8)"
          : "rgba(255, 255, 255, 0.4)";

        let displayDesc = achievement.description;
        textWidth = ctx.measureText(displayDesc).width;

        if (textWidth > maxTextWidth) {
          while (textWidth > maxTextWidth && displayDesc.length > 0) {
            displayDesc = displayDesc.slice(0, -1);
            textWidth = ctx.measureText(displayDesc + "...").width;
          }
          displayDesc += "...";
        }

        ctx.fillText(displayDesc, textX, descY);

        const statusX = cardX + cardWidth - this.game.getScaledValue(15);
        const statusY = cardY + cardHeight - this.game.getScaledValue(22);

        if (unlocked) {
          this.renderText(ctx, "✓", statusX, statusY, {
            fontSize: this.game.getScaledValue(16),
            align: "right",
            baseline: "bottom",
            color: "#90EE90",
          });
        } else {
          // Draw lock icon
          if (this.game.images["icon-lock.png"]) {
            const lockIcon = this.game.images["icon-lock.png"];
            const lockIconHeight = this.game.getScaledValue(28);
            const lockIconWidth =
              lockIconHeight * (lockIcon.width / lockIcon.height);
            ctx.drawImage(
              lockIcon,
              statusX - lockIconWidth,
              statusY - lockIconHeight,
              lockIconWidth,
              lockIconHeight
            );
          }
        }

        ctx.restore();
      });

      ctx.restore();

      if (this.achievementsDrawer.maxScroll > 0) {
        const scrollbarX = drawerX + drawerWidth - this.game.getScaledValue(20);
        const scrollbarY = contentStartY;
        const scrollbarWidth = this.game.getScaledValue(10);
        const scrollbarHeight = contentHeight;

        ctx.fillStyle = "rgba(100, 100, 100, 0.3)";
        ctx.fillRect(scrollbarX, scrollbarY, scrollbarWidth, scrollbarHeight);

        const thumbHeight = Math.max(
          this.game.getScaledValue(30),
          (contentHeight / totalContentHeight) * scrollbarHeight
        );
        const thumbY =
          scrollbarY +
          (this.achievementsDrawer.scrollOffset /
            this.achievementsDrawer.maxScroll) *
            (scrollbarHeight - thumbHeight);

        const scrollbarGradient = ctx.createLinearGradient(
          scrollbarX,
          thumbY,
          scrollbarX + scrollbarWidth,
          thumbY
        );
        if (
          this.achievementsDrawer.scrollbarHover ||
          this.achievementsDrawer.isDraggingScrollbar
        ) {
          scrollbarGradient.addColorStop(0, "rgba(255, 215, 0, 0.9)");
          scrollbarGradient.addColorStop(1, "rgba(255, 165, 0, 0.9)");
        } else {
          scrollbarGradient.addColorStop(0, "rgba(200, 200, 200, 0.7)");
          scrollbarGradient.addColorStop(1, "rgba(150, 150, 150, 0.7)");
        }
        ctx.fillStyle = scrollbarGradient;
        ctx.fillRect(scrollbarX, thumbY, scrollbarWidth, thumbHeight);
      }

      ctx.restore();
    }
  }

  renderStoryViewerModal(ctx) {
    if (!this.storyViewer.isOpen) return;

    const layout = this.layoutCache;
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    ctx.save();

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Modal dimensions - taller to fit content better
    const modalWidth = this.game.getScaledValue(700);
    const modalHeight = this.game.getScaledValue(600);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;
    const radius = this.game.getScaledValue(12);

    // Modal background
    const bgGradient = ctx.createLinearGradient(
      modalX,
      modalY,
      modalX,
      modalY + modalHeight
    );
    bgGradient.addColorStop(0, "rgba(30, 20, 45, 0.98)");
    bgGradient.addColorStop(1, "rgba(20, 15, 35, 0.98)");
    ctx.fillStyle = bgGradient;
    this.drawRoundedRect(ctx, modalX, modalY, modalWidth, modalHeight, radius);
    ctx.fill();

    // Modal border
    ctx.strokeStyle = "rgba(180, 100, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = "rgba(180, 100, 255, 0.4)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    this.drawRoundedRect(ctx, modalX, modalY, modalWidth, modalHeight, radius);
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Title
    this.renderText(
      ctx,
      "📚 Story Panels",
      canvasWidth / 2,
      modalY + this.game.getScaledValue(30),
      {
        fontSize: layout.headerFontSize,
        color: "#BA55D3",
        weight: "bold",
        align: "center",
      }
    );

    // Find the current unlocked panel to display
    const unlockedPanels = [];
    for (let i = 0; i < this.game.unlockedStoryPanels.length; i++) {
      if (this.game.unlockedStoryPanels[i]) {
        unlockedPanels.push(i);
      }
    }

    if (unlockedPanels.length === 0) {
      this.renderText(
        ctx,
        "No panels unlocked yet!",
        canvasWidth / 2,
        canvasHeight / 2,
        {
          fontSize: layout.bodyFontSize,
          color: "rgba(255, 255, 255, 0.7)",
          align: "center",
        }
      );
      ctx.restore();
      return;
    }

    // Make sure current panel is valid
    if (this.storyViewer.currentPanel >= unlockedPanels.length) {
      this.storyViewer.currentPanel = 0;
    }

    const panelIndex = unlockedPanels[this.storyViewer.currentPanel];
    const panel = GameConfig.STORY_PANELS[panelIndex];

    // Panel image (if available) - smaller and at top
    // Panel 3 gets a larger size due to its wide aspect ratio
    const maxImageSize = this.game.getScaledValue(panelIndex === 2 ? 240 : 180);
    const imageY = modalY + this.game.getScaledValue(80);
    let actualImageHeight = maxImageSize; // Track actual rendered height

    // Check if this panel uses a spritesheet
    if (panel.spritesheet) {
      const spritesheetConfig = GameConfig[panel.spritesheet];
      const spritesheetImage = this.game.images[spritesheetConfig.filename];

      if (spritesheetImage && spritesheetConfig) {
        // Calculate aspect ratio from frame dimensions
        const aspectRatio =
          spritesheetConfig.frameWidth / spritesheetConfig.frameHeight;
        let imageWidth, imageHeight;

        if (aspectRatio > 1) {
          // Landscape - constrain width
          imageWidth = maxImageSize;
          imageHeight = maxImageSize / aspectRatio;
        } else {
          // Portrait or square - constrain height
          imageHeight = maxImageSize;
          imageWidth = maxImageSize * aspectRatio;
        }

        actualImageHeight = imageHeight; // Store actual height
        const imageX = canvasWidth / 2 - imageWidth / 2;

        // Get current frame from animation sequence
        const frameIndex =
          spritesheetConfig.animationFrames[this.storyViewer.currentFrame];
        const frameX =
          (frameIndex % spritesheetConfig.columns) *
          spritesheetConfig.frameWidth;
        const frameY =
          Math.floor(frameIndex / spritesheetConfig.columns) *
          spritesheetConfig.frameHeight;

        ctx.save();
        ctx.shadowColor = "rgba(180, 100, 255, 0.3)";
        ctx.shadowBlur = this.game.getScaledValue(10);

        // Draw the current frame from the spritesheet
        ctx.drawImage(
          spritesheetImage,
          frameX,
          frameY,
          spritesheetConfig.frameWidth,
          spritesheetConfig.frameHeight,
          imageX,
          imageY,
          imageWidth,
          imageHeight
        );
        ctx.restore();
      }
    } else if (panel.image && this.game.images[panel.image]) {
      // Static image fallback
      const imageX = canvasWidth / 2 - maxImageSize / 2;

      ctx.save();
      ctx.shadowColor = "rgba(180, 100, 255, 0.3)";
      ctx.shadowBlur = this.game.getScaledValue(10);
      ctx.drawImage(
        this.game.images[panel.image],
        imageX,
        imageY,
        maxImageSize,
        maxImageSize
      );
      ctx.restore();
    }

    // Panel title - positioned below image
    const titleY = imageY + actualImageHeight + this.game.getScaledValue(20);
    this.renderText(ctx, panel.title, canvasWidth / 2, titleY, {
      fontSize: this.game.getScaledValue(20),
      color: "#FFD700",
      weight: "bold",
      align: "center",
    });

    // Panel text (word-wrapped) - starts below title
    const textY = titleY + this.game.getScaledValue(35);
    const textMaxWidth = modalWidth - this.game.getScaledValue(100);
    const lineHeight = this.game.getScaledValue(20);

    ctx.font = `${layout.bodyFontSize}px Arial`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    const words = panel.text.split(" ");
    let line = "";
    let y = textY;
    const lines = [];

    for (let i = 0; i < words.length; i++) {
      const testLine = line + words[i] + " ";
      const metrics = ctx.measureText(testLine);
      if (metrics.width > textMaxWidth && i > 0) {
        lines.push(line);
        line = words[i] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    // Limit lines to prevent text from overlapping buttons
    const maxLines = 8;
    const displayLines = lines.slice(0, maxLines);

    displayLines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, y + index * lineHeight);
    });

    // Add ellipsis if text was truncated
    if (lines.length > maxLines) {
      ctx.fillText("...", canvasWidth / 2, y + maxLines * lineHeight);
    }

    // Navigation buttons at bottom
    const buttonY = modalY + modalHeight - this.game.getScaledValue(60);
    const buttonWidth = this.game.getScaledValue(100);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(120);

    // Previous button (only if not first panel)
    if (this.storyViewer.currentPanel > 0) {
      const prevX = canvasWidth / 2 - buttonSpacing;
      this.renderNavigationButton(
        ctx,
        prevX,
        buttonY,
        buttonWidth,
        buttonHeight,
        "← Prev",
        false
      );
    }

    // Next button (only if not last panel)
    if (this.storyViewer.currentPanel < unlockedPanels.length - 1) {
      const nextX = canvasWidth / 2 + buttonSpacing;
      this.renderNavigationButton(
        ctx,
        nextX,
        buttonY,
        buttonWidth,
        buttonHeight,
        "Next →",
        false
      );
    }

    // Close button
    const closeX = canvasWidth / 2;
    this.renderNavigationButton(
      ctx,
      closeX,
      buttonY,
      buttonWidth,
      buttonHeight,
      "Close",
      true
    );

    // Navigation info - render below buttons
    this.renderText(
      ctx,
      `Panel ${this.storyViewer.currentPanel + 1} of ${unlockedPanels.length}`,
      canvasWidth / 2,
      buttonY + this.game.getScaledValue(35),
      {
        fontSize: this.game.getScaledValue(12),
        color: "rgba(255, 255, 255, 0.5)",
        align: "center",
      }
    );

    ctx.restore();
  }

  renderNavigationButton(ctx, x, y, width, height, text, isClose) {
    const radius = this.game.getScaledValue(6);
    const buttonX = x - width / 2;
    const buttonY = y - height / 2;

    ctx.save();

    // Determine which button image to use based on text content
    let buttonImage = null;
    const isPrevious = text.includes("Prev") || text.includes("←");
    const isNext = text.includes("Next") || text.includes("→");

    if (isClose) {
      buttonImage = this.game.images["btn-exit.png"];
    } else if (isPrevious) {
      buttonImage = this.game.images["btn-back.png"];
    } else if (isNext) {
      buttonImage = this.game.images["btn-next.png"];
    }

    // Check if mouse is hovering (we need to track hover state for these buttons)
    const isHovered = this.isPointInRect(
      this.lastMouseX || 0,
      this.lastMouseY || 0,
      {
        x: buttonX,
        y: buttonY,
        width: width,
        height: height,
      }
    );

    // If we have a button image, use it
    if (buttonImage) {
      // Calculate dimensions to fit the button while maintaining aspect ratio
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = width;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > height) {
        imgHeight = height;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = buttonX + (width - imgWidth) / 2;
      const imgY = buttonY + (height - imgHeight) / 2;

      // Apply hover effect - scale and add glow
      if (isHovered) {
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = buttonX + (width - scaledWidth) / 2;
        const scaledY = buttonY + (height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    }

    ctx.restore();
  }

  renderEasterDropZonePairBox(ctx) {
    if (this.easterDropZones.length < 2) return;

    const layout = this.layoutCache;
    const lineWidth = this.game.getScaledValue(3);
    const margin = this.game.getScaledValue(30);
    const cornerRadius = this.game.getScaledValue(10);

    // Calculate bounding box around both drop zones
    const minX =
      Math.min(this.easterDropZones[0].x, this.easterDropZones[1].x) - margin;
    const maxX =
      Math.max(this.easterDropZones[0].x, this.easterDropZones[1].x) + margin;
    const minY =
      Math.min(this.easterDropZones[0].y, this.easterDropZones[1].y) - margin;
    const maxY =
      Math.max(this.easterDropZones[0].y, this.easterDropZones[1].y) + margin;

    const width = maxX - minX;
    const height = maxY - minY;
    const centerX = (minX + maxX) / 2;

    ctx.save();

    // Draw rounded rectangle background with subtle gradient
    const gradient = ctx.createLinearGradient(minX, minY, minX, maxY);
    gradient.addColorStop(0, "rgba(255, 215, 0, 0.1)");
    gradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");

    ctx.fillStyle = gradient;
    this.roundRect(ctx, minX, minY, width, height, cornerRadius);
    ctx.fill();

    // Draw solid border
    ctx.strokeStyle = "rgba(255, 215, 0, 0.5)";
    ctx.lineWidth = lineWidth;
    this.roundRect(ctx, minX, minY, width, height, cornerRadius);
    ctx.stroke();

    // Draw "Drop Here" text above the box
    const textY = minY - this.game.getScaledValue(15);
    this.renderText(ctx, "Drop Here", centerX, textY, {
      fontSize: layout.bodyFontSize,
      color: "rgba(255, 215, 0, 0.9)",
      align: "center",
      baseline: "bottom",
      weight: "bold",
    });

    ctx.restore();
  }

  renderEasterDropZones(ctx) {
    const layout = this.layoutCache;
    const cornerRadius = this.game.getScaledValue(10); // Match match-screen corner radius

    this.easterDropZones.forEach((zone) => {
      ctx.save();

      let glowIntensity = 0;
      let isHovered = this.dropZoneHover === zone.id;
      let isOccupied = zone.sock !== null;

      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / this.DROP_ZONE_CONFIG.glowDuration;
      }

      if (isHovered) {
        glowIntensity = Math.max(glowIntensity, 0.8);
      }

      let borderColor = "white";
      let backgroundColor = "transparent";
      let shadowColor = "rgba(100, 255, 100, 0.5)";
      let shadowBlur = this.game.getScaledValue(15);

      if (isOccupied) {
        borderColor = "rgba(100, 255, 100, 0.8)";
      } else if (isHovered) {
        borderColor = "white";
        backgroundColor = "rgba(255, 255, 255, 0.1)";
      }

      // Apply glow effect
      if (glowIntensity > 0) {
        ctx.shadowColor = shadowColor;
        ctx.shadowBlur = shadowBlur * glowIntensity;
      }

      // Draw rounded rectangle for drop zone (matching match screen style)
      const lineWidth = isHovered
        ? this.game.getScaledValue(3)
        : this.game.getScaledValue(2);

      ctx.strokeStyle = borderColor;
      ctx.lineWidth = lineWidth;

      // Draw rounded rectangle stroke
      this.roundRect(
        ctx,
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height,
        cornerRadius
      );
      ctx.stroke();

      // Fill if hovered
      if (isHovered && backgroundColor !== "transparent") {
        ctx.fillStyle = backgroundColor;
        this.roundRect(
          ctx,
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height,
          cornerRadius
        );
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderSockBallAnimations(ctx) {
    this.sockBallAnimations.forEach((animation) => {
      const currentX =
        animation.startX +
        (animation.endX - animation.startX) * animation.progress;
      const currentY =
        animation.startY +
        (animation.endY - animation.startY) * animation.progress;

      const sockBallImageName = `sockball${animation.type}.png`;
      if (this.game.images[sockBallImageName]) {
        const size = this.game.getScaledValue(30);
        ctx.save();
        ctx.translate(currentX, currentY);
        ctx.rotate(animation.progress * Math.PI * 4);
        ctx.drawImage(
          this.game.images[sockBallImageName],
          -size / 2,
          -size / 2,
          size,
          size
        );
        ctx.restore();
      }
    });
  }

  renderPointGainAnimations(ctx) {
    this.pointGainAnimations.forEach((animation) => {
      const progress = animation.progress;
      const easeProgress = this.easeOutCubic(progress);

      ctx.save();
      ctx.globalAlpha = 1 - progress;

      const currentY = animation.y - easeProgress * 60;
      const scale = 1 + easeProgress * 0.2;

      ctx.translate(animation.x, currentY);
      ctx.scale(scale, scale);

      this.renderText(ctx, animation.text, 0, 0, {
        fontSize: this.game.getScaledValue(24),
        color: "#FFD700",
        weight: "bold",
        align: "center",
      });

      ctx.restore();
    });
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  // Helper method to draw rounded rectangles (matching match-screen.js)
  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.arcTo(x + width, y, x + width, y + radius, radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius);
    ctx.lineTo(x + radius, y + height);
    ctx.arcTo(x, y + height, x, y + height - radius, radius);
    ctx.lineTo(x, y + radius);
    ctx.arcTo(x, y, x + radius, y, radius);
    ctx.closePath();
  }

  renderLevelButtons(ctx) {
    const layout = this.layoutCache;

    // Generate title based on current difficulty
    let titleText = "Select Level";
    if (this.game.selectedDifficulty > 0) {
      titleText = `Select New Game +${this.game.selectedDifficulty} Level`;
    }

    this.renderText(
      ctx,
      titleText,
      layout.centerX,
      layout.levelGridStartY - this.game.getScaledValue(100),
      {
        fontSize: layout.titleFontSize,
        weight: "bold",
      }
    );

    for (let i = 0; i < GameConfig.LEVELS.length; i++) {
      const col = i % this.levelConfig.columns;
      const row = Math.floor(i / this.levelConfig.columns);

      const x = layout.levelGridStartX + col * layout.levelHorizontalSpacing;
      const y = layout.levelGridStartY + row * layout.levelVerticalSpacing;

      this.renderLevelButton(ctx, i, x, y);
    }
  }

  renderLevelButton(ctx, levelIndex, x, y) {
    const layout = this.layoutCache;
    const buttonSize = layout.levelButtonSize;

    let sockImageIndex = levelIndex + 1;
    let colorFilter = null;

    if (levelIndex === 6) {
      sockImageIndex = 1;
      colorFilter = "hue-rotate(270deg) saturate(1.5)";
    } else if (levelIndex === 7) {
      sockImageIndex = 2;
      colorFilter = "hue-rotate(30deg) saturate(1.3)";
    } else if (levelIndex === 8) {
      sockImageIndex = 3;
      colorFilter = "hue-rotate(180deg) saturate(1.4)";
    }

    const sockImageName = `sock${sockImageIndex}.png`;
    const sockImage = this.game.images[sockImageName];

    const isUnlocked = this.game.unlockedLevels[levelIndex];
    const isCompleted = this.game.completedLevels[levelIndex];
    const isHovered = this.hoveredLevel === levelIndex;
    const levelCost = GameConfig.getLevelCost(
      levelIndex,
      this.game.selectedDifficulty
    );
    const isAffordable = this.game.playerPoints >= levelCost;

    const hoverProgress = this.levelHoverAnimations[levelIndex] || 0;
    const pulseTimer = this.levelPulseTimers[levelIndex] || 0;

    ctx.save();

    const baseScale = 1;
    const hoverScale = this.levelConfig.hoverScale;
    const currentScale =
      baseScale + (hoverScale - baseScale) * this.easeOutCubic(hoverProgress);

    ctx.translate(x, y);
    ctx.scale(currentScale, currentScale);
    ctx.translate(-x, -y);

    const halfSize = buttonSize / 2;

    ctx.save();
    const bgRadius = halfSize + this.game.getScaledValue(8);

    if (isUnlocked) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, bgRadius);
      if (isCompleted) {
        gradient.addColorStop(0, "rgba(255, 215, 0, 0.3)");
        gradient.addColorStop(1, "rgba(255, 215, 0, 0.05)");
      } else {
        const pulse = Math.sin(pulseTimer) * 0.1 + 0.2;
        gradient.addColorStop(0, `rgba(100, 150, 255, ${pulse})`);
        gradient.addColorStop(1, "rgba(100, 150, 255, 0.05)");
      }
      ctx.fillStyle = gradient;
    } else {
      ctx.fillStyle = isAffordable
        ? "rgba(100, 100, 100, 0.2)"
        : "rgba(50, 50, 50, 0.2)";
    }

    ctx.beginPath();
    ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
    ctx.fill();

    if (isUnlocked) {
      // Circle removed - no outline for unlocked/completed levels
    } else if (isAffordable) {
      const affordablePulse = Math.sin(pulseTimer * 2) * 0.3 + 0.7;
      ctx.strokeStyle = `rgba(255, 215, 0, ${affordablePulse})`;
      ctx.lineWidth = this.game.getScaledValue(4);
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.game.getScaledValue(20) * affordablePulse;
      ctx.beginPath();
      ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeStyle = "rgba(100, 100, 100, 0.3)";
      ctx.lineWidth = this.game.getScaledValue(2);
      ctx.beginPath();
      ctx.arc(x, y, bgRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();

    if (isUnlocked) {
      ctx.save();

      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = this.game.getScaledValue(8);
      ctx.shadowOffsetY = this.game.getScaledValue(3);

      if (isCompleted) {
        // Subtle pulse animation for completed levels with offset based on level index
        const offset = levelIndex * 0.7; // Offset each level's animation
        const pulse = Math.sin(pulseTimer * 0.5 + offset) * 0.02 + 1; // 2% size variation
        const float =
          Math.sin(pulseTimer * 0.7 + offset) * this.game.getScaledValue(1.5); // Slight vertical float

        if (sockImage) {
          if (colorFilter) {
            ctx.filter = colorFilter;
          }

          const pulsedSize = buttonSize * pulse;
          const sizeDiff = (pulsedSize - buttonSize) / 2;

          ctx.drawImage(
            sockImage,
            x - halfSize - sizeDiff,
            y - halfSize - sizeDiff + float,
            pulsedSize,
            pulsedSize
          );
        }
      } else {
        const wiggle =
          Math.sin(
            this.animationFrame * this.levelConfig.wiggleSpeed + levelIndex
          ) * this.game.getScaledValue(this.levelConfig.wiggleAmount);
        const bounce =
          Math.abs(Math.sin(pulseTimer * 0.8)) * this.game.getScaledValue(3);

        if (sockImage) {
          if (colorFilter) {
            ctx.filter = colorFilter;
          }

          ctx.drawImage(
            sockImage,
            x - halfSize + wiggle,
            y - halfSize - bounce,
            buttonSize,
            buttonSize
          );
        }
      }
      ctx.restore();

      if (isCompleted && this.game.images["star.png"]) {
        ctx.save();
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = this.game.getScaledValue(15);
        const starSize = this.game.getScaledValue(45);
        const starRotation = Math.sin(this.animationFrame * 0.002) * 0.1;

        ctx.translate(x, y);
        ctx.rotate(starRotation);
        ctx.drawImage(
          this.game.images["star.png"],
          -starSize / 2,
          -starSize / 2,
          starSize,
          starSize
        );
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y - this.game.getScaledValue(65),
        {
          fontSize: layout.bodyFontSize,
          weight: "bold",
          color: isCompleted ? "#FFD700" : "#FFFFFF",
        }
      );
      ctx.restore();
    } else {
      if (sockImage) {
        ctx.save();
        ctx.globalAlpha = isAffordable ? 0.5 : 0.25;

        if (colorFilter) {
          ctx.filter = isAffordable
            ? `${colorFilter} brightness(0.5) grayscale(0.3)`
            : `${colorFilter} brightness(0.3) grayscale(0.7)`;
        } else {
          ctx.filter = isAffordable
            ? "brightness(0.5) grayscale(0.3)"
            : "brightness(0.3) grayscale(0.7)";
        }

        ctx.drawImage(
          sockImage,
          x - halfSize,
          y - halfSize,
          buttonSize,
          buttonSize
        );
        ctx.restore();
      }

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);

      // Draw lock icon
      if (this.game.images["icon-lock.png"]) {
        const lockIcon = this.game.images["icon-lock.png"];
        const lockIconHeight = this.game.getScaledValue(24);
        const lockIconWidth =
          lockIconHeight * (lockIcon.width / lockIcon.height);
        ctx.drawImage(
          lockIcon,
          x - lockIconWidth / 2,
          y - this.game.getScaledValue(15) - lockIconHeight / 2,
          lockIconWidth,
          lockIconHeight
        );
      }
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);

      // Draw money icon
      const costIconHeight = this.game.getScaledValue(24);
      const costY = y + this.game.getScaledValue(15);

      if (this.game.images["icon-money.png"]) {
        const costMoneyIcon = this.game.images["icon-money.png"];
        const costIconWidth =
          costIconHeight * (costMoneyIcon.width / costMoneyIcon.height);
        ctx.drawImage(
          costMoneyIcon,
          x - this.game.getScaledValue(35),
          costY - costIconHeight / 2,
          costIconWidth,
          costIconHeight
        );
      }

      this.renderText(
        ctx,
        `${levelCost}`,
        x + this.game.getScaledValue(5),
        costY,
        {
          fontSize: layout.smallFontSize + 2,
          color: isAffordable ? "#90EE90" : "#FFB6C1",
          weight: "bold",
        }
      );
      ctx.restore();

      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      this.renderText(
        ctx,
        `Level ${levelIndex + 1}`,
        x,
        y - this.game.getScaledValue(65),
        {
          fontSize: layout.bodyFontSize,
          color: "rgba(255, 255, 255, 0.6)",
        }
      );
      ctx.restore();

      if (isAffordable) {
        const pulse =
          Math.abs(Math.sin(this.animationFrame * 0.003)) * 0.3 + 0.7;
        ctx.save();
        ctx.globalAlpha = pulse;
        ctx.shadowColor = "#90EE90";
        ctx.shadowBlur = this.game.getScaledValue(8);
        this.renderText(
          ctx,
          "Click to unlock!",
          x,
          y + this.game.getScaledValue(65),
          {
            fontSize: layout.smallFontSize,
            color: "#90EE90",
            weight: "bold",
          }
        );
        ctx.restore();
      }
    }

    ctx.restore();
  }

  renderPlayerStats(ctx) {
    const layout = this.layoutCache;
    const panelX = layout.statsX - layout.statsPanelWidth / 2;
    const panelY = layout.statsY;

    this.renderPanel(
      ctx,
      panelX,
      panelY,
      layout.statsPanelWidth,
      layout.statsPanelHeight
    );

    this.renderText(
      ctx,
      `Points: ${this.game.playerPoints}`,
      layout.statsX,
      panelY + layout.statsPanelHeight / 2,
      {
        fontSize: layout.headerFontSize,
        color: "#FFD700",
        weight: "bold",
      }
    );
  }

  renderMismatchParticles(ctx) {
    if (!this.mismatchParticles) return;

    this.mismatchParticles.forEach((particle) => {
      ctx.save();

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.shape === "cross") {
        const halfSize = particle.size / 2;
        ctx.fillRect(
          particle.x - halfSize,
          particle.y - halfSize / 3,
          particle.size,
          particle.size / 3
        );
        ctx.fillRect(
          particle.x - halfSize / 3,
          particle.y - halfSize,
          particle.size / 3,
          particle.size
        );
      } else {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  renderMenuSocks(ctx) {
    this.menuSocks.forEach((sock) => {
      ctx.save();

      // Check if this sock is being hovered or dragged
      const isHovered = sock === this.hoveredMenuSock;
      const isDragged = sock === this.dragSock;

      if (sock.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = sock.glowEffect;
        sock.glowEffect--;
      } else {
        ctx.shadowColor = "rgba(255, 255, 255, 0.3)";
        ctx.shadowBlur = this.game.getScaledValue(5);
      }

      // Add hover effect - blue/cyan glow
      if (isHovered && !isDragged) {
        ctx.shadowColor = "rgba(100, 180, 255, 0.9)";
        ctx.shadowBlur = this.game.getScaledValue(25);
      }

      // Add dragged effect - stronger yellow glow
      if (isDragged) {
        ctx.shadowColor = "rgba(255, 215, 0, 1.0)";
        ctx.shadowBlur = this.game.getScaledValue(30);
      }

      ctx.translate(sock.x, sock.y);
      ctx.rotate(sock.rotation);

      // Slightly scale up dragged sock
      if (isDragged) {
        ctx.scale(1.1, 1.1);
      }

      const sockImageName = `sock${sock.type}.png`;
      if (this.game.images[sockImageName]) {
        ctx.drawImage(
          this.game.images[sockImageName],
          -sock.size / 2,
          -sock.size / 2,
          sock.size,
          sock.size
        );
      }

      ctx.restore();
    });
  }

  destroy() {
    this.cleanup();
  }

  // NEW GAME+ Difficulty Selection Modal Rendering
  renderDifficultyModal(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(600);
    const modalHeight = this.game.getScaledValue(500);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;

    const progress = this.easeOutBack(this.difficultyModal.animationProgress);

    ctx.save();
    ctx.globalAlpha = this.difficultyModal.animationProgress;

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Modal background with scaling animation
    ctx.save();
    ctx.translate(canvasWidth / 2, canvasHeight / 2);
    ctx.scale(progress, progress);
    ctx.translate(-canvasWidth / 2, -canvasHeight / 2);

    // Modal panel
    const gradient = ctx.createLinearGradient(
      modalX,
      modalY,
      modalX + modalWidth,
      modalY + modalHeight
    );
    gradient.addColorStop(0, "rgba(30, 30, 60, 0.95)");
    gradient.addColorStop(1, "rgba(20, 20, 40, 0.95)");
    ctx.fillStyle = gradient;
    ctx.fillRect(modalX, modalY, modalWidth, modalHeight);

    // Border
    ctx.strokeStyle = "rgba(100, 150, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    // Glow effect
    ctx.shadowColor = "#4ECDC4";
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.strokeRect(modalX, modalY, modalWidth, modalHeight);

    ctx.restore();

    // Title
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.shadowBlur = this.game.getScaledValue(5);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(36)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      "SELECT DIFFICULTY",
      canvasWidth / 2,
      modalY + this.game.getScaledValue(30)
    );
    ctx.restore();

    // Level info
    const levelNum = this.difficultyModal.selectedLevel + 1;
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = `${this.game.getScaledValue(20)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(
      `Level ${levelNum}`,
      canvasWidth / 2,
      modalY + this.game.getScaledValue(80)
    );
    ctx.restore();

    // Difficulty buttons
    for (const button of this.difficultyModal.buttons) {
      this.renderDifficultyButton(ctx, button);
    }

    // Instructions
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `${this.game.getScaledValue(14)}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText(
      "Click outside to cancel",
      canvasWidth / 2,
      modalY + modalHeight - this.game.getScaledValue(30)
    );
    ctx.restore();

    ctx.restore();
  }

  renderDifficultyButton(ctx, button) {
    const difficultyMode = GameConfig.getDifficultyMode(button.difficulty);
    const isHovered =
      this.difficultyModal.hoveredDifficulty === button.difficulty;
    const isCompleted =
      this.game.completedLevelsByDifficulty[button.difficulty] &&
      this.game.completedLevelsByDifficulty[button.difficulty][
        this.difficultyModal.selectedLevel
      ];

    ctx.save();

    // Button background
    const gradient = ctx.createLinearGradient(
      button.x,
      button.y,
      button.x + button.width,
      button.y + button.height
    );
    if (isHovered) {
      gradient.addColorStop(0, "rgba(100, 150, 255, 0.4)");
      gradient.addColorStop(1, "rgba(75, 125, 230, 0.4)");
    } else {
      gradient.addColorStop(0, "rgba(50, 50, 80, 0.6)");
      gradient.addColorStop(1, "rgba(40, 40, 70, 0.6)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(button.x, button.y, button.width, button.height);

    // Button border
    if (isCompleted) {
      ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(3);
    } else if (isHovered) {
      ctx.strokeStyle = "rgba(100, 150, 255, 0.8)";
      ctx.lineWidth = this.game.getScaledValue(3);
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur = this.game.getScaledValue(15);
    } else {
      ctx.strokeStyle = "rgba(100, 100, 100, 0.5)";
      ctx.lineWidth = this.game.getScaledValue(2);
    }
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    // Difficulty name with stars
    ctx.shadowBlur = 0;
    ctx.fillStyle = isCompleted ? "#FFD700" : "#FFFFFF";
    ctx.font = `bold ${this.game.getScaledValue(24)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const difficultyText =
      button.difficulty === 0
        ? "NORMAL"
        : `NEW GAME ${difficultyMode.displayName}`;
    ctx.fillText(
      difficultyText,
      button.x + button.width / 2,
      button.y + this.game.getScaledValue(20)
    );

    // Stats info
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = `${this.game.getScaledValue(14)}px Arial`;

    const statsText =
      button.difficulty === 0
        ? "Standard difficulty"
        : `Speed: ${(difficultyMode.speedMultiplier * 100).toFixed(
            0
          )}% | Time: ${(difficultyMode.timeMultiplier * 100).toFixed(0)}%`;
    ctx.fillText(
      statsText,
      button.x + button.width / 2,
      button.y + button.height - this.game.getScaledValue(15)
    );

    // Completion checkmark
    if (isCompleted) {
      ctx.fillStyle = "#FFD700";
      ctx.font = `${this.game.getScaledValue(20)}px Arial`;
      ctx.fillText(
        "✓",
        button.x + this.game.getScaledValue(30),
        button.y + button.height / 2
      );
    }

    ctx.restore();
  }

  // Helper method for drawing rounded rectangles
  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  // Story Panel Viewer - Add to level-select
  openStoryViewer() {
    const unlockedCount = this.game.unlockedStoryPanels.filter((u) => u).length;
    if (unlockedCount === 0) return;
    this.storyViewer.isOpen = true;
    this.storyViewer.currentPanel = 0;
    this.game.audioManager.playSound("button-click", false, 0.5);
  }

  closeStoryViewer() {
    this.storyViewer.isOpen = false;
    this.game.audioManager.playSound("button-click", false, 0.5);
  }

  handleStoryViewerClick(x, y) {
    if (!this.storyViewer.isOpen) return false;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(700);
    const modalHeight = this.game.getScaledValue(600);
    const modalY = (canvasHeight - modalHeight) / 2;

    const buttonY = modalY + modalHeight - this.game.getScaledValue(60);
    const buttonWidth = this.game.getScaledValue(100);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(120);

    // Get unlocked panels
    const unlockedPanels = [];
    for (let i = 0; i < this.game.unlockedStoryPanels.length; i++) {
      if (this.game.unlockedStoryPanels[i]) {
        unlockedPanels.push(i);
      }
    }

    // Check close button
    const closeX = canvasWidth / 2;
    if (
      this.isPointInRect(x, y, {
        x: closeX - buttonWidth / 2,
        y: buttonY - buttonHeight / 2,
        width: buttonWidth,
        height: buttonHeight,
      })
    ) {
      this.closeStoryViewer();
      return true;
    }

    // Check previous button
    if (this.storyViewer.currentPanel > 0) {
      const prevX = canvasWidth / 2 - buttonSpacing;
      if (
        this.isPointInRect(x, y, {
          x: prevX - buttonWidth / 2,
          y: buttonY - buttonHeight / 2,
          width: buttonWidth,
          height: buttonHeight,
        })
      ) {
        this.storyViewer.currentPanel--;
        this.game.audioManager.playSound("button-click", false, 0.5);
        return true;
      }
    }

    // Check next button
    if (this.storyViewer.currentPanel < unlockedPanels.length - 1) {
      const nextX = canvasWidth / 2 + buttonSpacing;
      if (
        this.isPointInRect(x, y, {
          x: nextX - buttonWidth / 2,
          y: buttonY - buttonHeight / 2,
          width: buttonWidth,
          height: buttonHeight,
        })
      ) {
        this.storyViewer.currentPanel++;
        this.game.audioManager.playSound("button-click", false, 0.5);
        return true;
      }
    }

    return true; // Consume click to prevent background interaction
  }

  renderVideoButton(ctx) {
    const layout = this.layoutCache;
    const button = this.videoButton;
    const buttonImage = this.game.images["secret-video-button.png"];

    ctx.save();

    const x = layout.videoButtonX - layout.videoButtonWidth / 2;
    const y = layout.videoButtonY - layout.videoButtonHeight / 2;

    if (buttonImage) {
      // Use button image
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = layout.videoButtonWidth;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > layout.videoButtonHeight) {
        imgHeight = layout.videoButtonHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = x + (layout.videoButtonWidth - imgWidth) / 2;
      const imgY = y + (layout.videoButtonHeight - imgHeight) / 2;

      // Apply hover effect - scale and add glow
      if (button.hovered) {
        ctx.shadowColor = "rgba(187, 143, 206, 0.8)"; // Purple glow matching the button's theme
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = x + (layout.videoButtonWidth - scaledWidth) / 2;
        const scaledY = y + (layout.videoButtonHeight - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Fallback to gradient style if image not loaded
      const radius = this.game.getScaledValue(8);

      // Enhanced gradient background
      const gradient = ctx.createLinearGradient(
        x,
        y,
        x,
        y + layout.videoButtonHeight
      );

      let color1, color2;
      if (button.hovered) {
        color1 = "#BB8FCE";
        color2 = "#A569BD";
      } else {
        color1 = "#A569BD";
        color2 = "#8E44AD";
      }

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;

      if (button.hovered) {
        ctx.shadowColor = "#BB8FCE";
        ctx.shadowBlur = this.game.getScaledValue(12);
      }

      ctx.strokeStyle = button.hovered ? "#D7BDE2" : "#8E44AD";
      ctx.lineWidth = this.game.getScaledValue(3);

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + layout.videoButtonWidth - radius, y);
      ctx.quadraticCurveTo(
        x + layout.videoButtonWidth,
        y,
        x + layout.videoButtonWidth,
        y + radius
      );
      ctx.lineTo(
        x + layout.videoButtonWidth,
        y + layout.videoButtonHeight - radius
      );
      ctx.quadraticCurveTo(
        x + layout.videoButtonWidth,
        y + layout.videoButtonHeight,
        x + layout.videoButtonWidth - radius,
        y + layout.videoButtonHeight
      );
      ctx.lineTo(x + radius, y + layout.videoButtonHeight);
      ctx.quadraticCurveTo(
        x,
        y + layout.videoButtonHeight,
        x,
        y + layout.videoButtonHeight - radius
      );
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fill();
      ctx.stroke();

      if (button.hovered) {
        ctx.shadowColor = "#BB8FCE";
        ctx.shadowBlur = this.game.getScaledValue(10);
        ctx.stroke();
      }

      // Button text
      this.renderText(
        ctx,
        "SECRET BONUS VIDEO",
        layout.videoButtonX,
        layout.videoButtonY,
        {
          fontSize: this.game.getScaledValue(18),
          color: "white",
          weight: "bold",
        }
      );
    }

    ctx.restore();
  }

  renderAudioPlayerButton(ctx) {
    const layout = this.layoutCache;
    const button = this.audioPlayerButton;
    const buttonImage = this.game.images["btn-audioplayer.png"];

    ctx.save();

    const x = layout.audioPlayerButtonX - layout.audioPlayerButtonWidth / 2;
    const y = layout.audioPlayerButtonY - layout.audioPlayerButtonHeight / 2;

    if (buttonImage) {
      // Use button image
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = layout.audioPlayerButtonWidth;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > layout.audioPlayerButtonHeight) {
        imgHeight = layout.audioPlayerButtonHeight;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = x + (layout.audioPlayerButtonWidth - imgWidth) / 2;
      const imgY = y + (layout.audioPlayerButtonHeight - imgHeight) / 2;

      // Apply hover effect - scale and add glow
      if (button.hovered) {
        ctx.shadowColor = "rgba(74, 158, 255, 0.8)"; // Blue glow
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = x + (layout.audioPlayerButtonWidth - scaledWidth) / 2;
        const scaledY = y + (layout.audioPlayerButtonHeight - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Fallback to gradient style if image not loaded
      const radius = this.game.getScaledValue(8);

      // Enhanced gradient background
      const gradient = ctx.createLinearGradient(
        x,
        y,
        x,
        y + layout.audioPlayerButtonHeight
      );

      let color1, color2;
      if (button.hovered) {
        color1 = "#4a9eff";
        color2 = "#2d7dd2";
      } else {
        color1 = "#2d7dd2";
        color2 = "#1e5a9e";
      }

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;

      if (button.hovered) {
        ctx.shadowColor = "#4a9eff";
        ctx.shadowBlur = this.game.getScaledValue(12);
      }

      ctx.strokeStyle = button.hovered ? "#6ab7ff" : "#2d7dd2";
      ctx.lineWidth = this.game.getScaledValue(3);

      // Draw rounded rectangle
      ctx.beginPath();
      ctx.moveTo(x + radius, y);
      ctx.lineTo(x + layout.audioPlayerButtonWidth - radius, y);
      ctx.quadraticCurveTo(
        x + layout.audioPlayerButtonWidth,
        y,
        x + layout.audioPlayerButtonWidth,
        y + radius
      );
      ctx.lineTo(
        x + layout.audioPlayerButtonWidth,
        y + layout.audioPlayerButtonHeight - radius
      );
      ctx.quadraticCurveTo(
        x + layout.audioPlayerButtonWidth,
        y + layout.audioPlayerButtonHeight,
        x + layout.audioPlayerButtonWidth - radius,
        y + layout.audioPlayerButtonHeight
      );
      ctx.lineTo(x + radius, y + layout.audioPlayerButtonHeight);
      ctx.quadraticCurveTo(
        x,
        y + layout.audioPlayerButtonHeight,
        x,
        y + layout.audioPlayerButtonHeight - radius
      );
      ctx.lineTo(x, y + radius);
      ctx.quadraticCurveTo(x, y, x + radius, y);
      ctx.closePath();

      ctx.fill();
      ctx.stroke();

      if (button.hovered) {
        ctx.shadowColor = "#4a9eff";
        ctx.shadowBlur = this.game.getScaledValue(10);
        ctx.stroke();
      }

      // Button text
      this.renderText(
        ctx,
        "MUSIC PLAYER",
        layout.audioPlayerButtonX,
        layout.audioPlayerButtonY,
        {
          fontSize: this.game.getScaledValue(18),
          color: "white",
          weight: "bold",
        }
      );
    }

    ctx.restore();
  }

  openVideoPlayer() {
    this.videoPlayerActive = true;

    this.game.audioManager.pauseMusic();

    try {
      // Create video element
      this.videoElement = document.createElement("video");

      // Select video based on current difficulty (0 for base game, 1-4 for New Game+ 1-4)
      let videoNumber = 0; // Default to base game video (video 0)
      let videoSrc = "videos/video-end.mp4";
      if (
        this.game.selectedDifficulty >= 1 &&
        this.game.selectedDifficulty <= 4
      ) {
        videoNumber = this.game.selectedDifficulty;
        videoSrc = `videos/video-end-${videoNumber}.mp4`;
      }

      this.videoElement.src = videoSrc;
      this.videoElement.loop = true;
      this.videoElement.autoplay = true;
      this.videoElement.controls = false;
      this.videoElement.style.display = "none";

      // Add error handlers
      this.videoElement.addEventListener("error", () => {
        this.closeVideoPlayer();
      });

      // Track video watching for achievements (when video actually starts playing)
      this.videoElement.addEventListener(
        "playing",
        () => {
          if (!this.game.watchedVideos.includes(videoNumber)) {
            // Mark this video as watched
            this.game.watchedVideos.push(videoNumber);

            // Unlock "Secret Video Watcher" achievement (watch any video)
            this.game.unlockAchievement("secret_video_watcher");

            // Check if all 5 videos have been watched (0, 1, 2, 3, 4)
            if (this.game.watchedVideos.length >= 5) {
              this.game.unlockAchievement("video_completionist");
            }

            // Save progress
            this.game.saveGameData();
          }
        },
        { once: true }
      ); // Only trigger once per video open

      document.body.appendChild(this.videoElement);
    } catch (error) {
      this.closeVideoPlayer();
    }
  }

  closeVideoPlayer() {
    this.videoPlayerActive = false;

    // Clean up video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.remove();
      this.videoElement = null;
    }

    this.game.audioManager.resumeMusic();
  }

  renderVideoPlayer(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    ctx.save();

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Fixed container dimensions (same height for all videos)
    const containerHeight = this.game.getScaledValue(360);
    const containerWidth = this.game.getScaledValue(640);
    const containerX = (canvasWidth - containerWidth) / 2;
    const containerY = (canvasHeight - containerHeight) / 2;

    // Container background
    ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
    ctx.fillRect(
      containerX - 10,
      containerY - 10,
      containerWidth + 20,
      containerHeight + 20
    );

    // Border with glow
    ctx.strokeStyle = "#BB8FCE";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = "#BB8FCE";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.strokeRect(
      containerX - 10,
      containerY - 10,
      containerWidth + 20,
      containerHeight + 20
    );

    // Draw video frame if ready
    if (this.videoElement && this.videoElement.readyState >= 2) {
      try {
        // Videos are 800x462 with black bars on left/right
        // The actual content is centered in the video
        // Crop out the black bars by calculating the content area
        const videoWidth = this.videoElement.videoWidth;
        const videoHeight = this.videoElement.videoHeight;

        // Calculate source crop to remove black bars
        // Assuming the content is 4:3 or similar centered in 800x462
        // Target aspect ratio is 16:9 (640:360)
        const targetAspectRatio = 16 / 9;
        const videoAspectRatio = videoWidth / videoHeight;

        let sourceX, sourceY, sourceWidth, sourceHeight;

        if (videoAspectRatio > targetAspectRatio) {
          // Video is wider - crop left and right (remove pillarboxing)
          sourceHeight = videoHeight;
          sourceWidth = videoHeight * targetAspectRatio;
          sourceX = (videoWidth - sourceWidth) / 2;
          sourceY = 0;
        } else {
          // Video is taller - crop top and bottom
          sourceWidth = videoWidth;
          sourceHeight = videoWidth / targetAspectRatio;
          sourceX = 0;
          sourceY = (videoHeight - sourceHeight) / 2;
        }

        // Draw the cropped portion of the video to fill the container
        ctx.drawImage(
          this.videoElement,
          sourceX,
          sourceY,
          sourceWidth,
          sourceHeight,
          containerX,
          containerY,
          containerWidth,
          containerHeight
        );
      } catch (error) {
        // Show error message
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#FF6B6B";
        ctx.font = `${this.game.getScaledValue(24)}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("Error loading video", canvasWidth / 2, canvasHeight / 2);
      }
    } else {
      // Loading text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${this.game.getScaledValue(24)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Loading video...", canvasWidth / 2, canvasHeight / 2);
    }

    // Close button hint
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      "Press ESC or click outside to close",
      canvasWidth / 2,
      containerY + containerHeight + 30
    );

    ctx.restore();
  }
}
