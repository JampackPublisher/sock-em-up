class MatchScreen extends Screen {
  constructor(game) {
    super(game);
    this.sockManager = new SockManager(game);
    this.physics = new MatchPhysics(game);
    this.dropZones = [];
    this.draggedSock = null;
    this.dragOffset = { x: 0, y: 0 };
    this.isDragging = false;
    this.dropZoneHover = null;
    this.sockPileHover = false;
    this.matchStreak = 0;
    this.lastMatchTime = 0;
    this.timeWarningPlayed = false;
    this.countdownTickPlayed = false;

    // Track if sock pile has been clicked this level
    this.sockPileClicked = false;
    this.pulseTimer = 0;

    // Keyboard control state
    this.selectedSock = null;
    this.sockSelectedByKeyboard = false;

    // Hover state for socks
    this.hoveredSock = null;

    // Pause button
    this.pauseButton = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false,
    };

    // Exit button
    this.exitButton = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false,
    };

    // Debug button (only visible in DEV_MODE)
    this.debugButton = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false,
    };

    // Velocity tracking for throwing
    this.dragHistory = [];
    this.maxDragHistoryLength = 5;
    this.velocityScale = 12; // Scale factor for throw velocity - increased significantly
    this.maxThrowVelocity = 45; // Maximum throw velocity - increased for more dramatic throws

    // Track active timeouts for cleanup
    this.activeTimeouts = [];

    // Auto-shoot state for holding down on sock pile
    this.sockPilePressed = false;
    this.autoShootInterval = null;

    // Track click-only placements for Snappy achievement
    this.initialMousePos = null;
    this.wasDragged = false;
    this.pairPlacementMethods = {}; // Track how each sock in a pair was placed
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Top bar configuration
    const barHeight = this.game.getScaledValue(GameConfig.UI_BAR.height);
    const barY = 0; // Top of screen
    const barPadding = this.game.getScaledValue(GameConfig.UI_BAR.padding);
    const panelSpacing = this.game.getScaledValue(
      GameConfig.UI_BAR.panelSpacing
    );

    return {
      ...baseLayout,
      titleX: this.game.getScaledValue(20),
      titleY: canvasHeight - this.game.getScaledValue(80),
      instructionX: this.game.getScaledValue(20),
      instructionY: canvasHeight - this.game.getScaledValue(40),
      dropZoneSize: this.game.getScaledValue(80),
      dropZoneSpacing: this.game.getScaledValue(100),
      dropZoneAreaY: canvasHeight / 3 + this.game.getScaledValue(20), // Slightly lower to avoid top bar
      pairWidth: canvasWidth / GameConfig.DROP_TARGET_PAIRS,
      sockPileX: canvasWidth / 2,
      sockPileY: canvasHeight - this.game.getScaledValue(110), // Bumped up 30 pixels (80 + 30)
      sockPileSize: this.game.getScaledValue(120),
      // Instructions beside sock pile
      instructionArrowX: canvasWidth / 2 + this.game.getScaledValue(90),
      instructionArrowY: canvasHeight - this.game.getScaledValue(110), // Bumped up 30 pixels

      // Top bar layout
      barY: barY,
      barHeight: barHeight,
      barPadding: barPadding,

      // Top bar elements (left to right)
      sockBallsX: barPadding + this.game.getScaledValue(100),
      sockBallsY: barY + barHeight / 2,

      streakX: canvasWidth / 2,
      streakY: barY + barHeight / 2,

      timeX: canvasWidth / 2 - this.game.getScaledValue(200),
      timeY: barY + barHeight / 2,

      // Buttons on the right side of top bar
      pauseButtonX: canvasWidth - this.game.getScaledValue(240),
      pauseButtonY: barY + barHeight / 2,
      pauseButtonWidth: this.game.getScaledValue(100),
      pauseButtonHeight: this.game.getScaledValue(50),

      exitButtonX: canvasWidth - this.game.getScaledValue(120),
      exitButtonY: barY + barHeight / 2,
      exitButtonWidth: this.game.getScaledValue(100),
      exitButtonHeight: this.game.getScaledValue(50),

      // Debug button (below exit button when DEV_MODE is true)
      debugButtonX: canvasWidth - this.game.getScaledValue(120),
      debugButtonY: canvasHeight - this.game.getScaledValue(60),
      debugButtonWidth: this.game.getScaledValue(120),
      debugButtonHeight: this.game.getScaledValue(40),
    };
  }

  setup() {
    super.setup();
    this.game.canvas.className = "matching-phase";
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);
    this.setupDropZones();
    this.setupSockPilePosition();
    this.setSockballAnimationTarget();
    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;

    // Clear any lingering timeouts from previous instances
    this.clearAllTimeouts();
    this.sockPileHover = false;
    this.matchStreak = 0;
    this.lastMatchTime = 0;
    this.timeWarningPlayed = false;
    this.countdownTickPlayed = false;
    this.sockPileClicked = false;
    this.pulseTimer = 0;
    this.dragHistory = [];

    // Reset auto-shoot state
    this.sockPilePressed = false;
    this.stopAutoShoot();

    // Reset elapsed time counter and time bonus flag
    this.game.timeElapsed = 0;
    this.game.timeBonusEarned = false;

    // Track achievements for this level
    this.firstMatchMade = false;
    this.matchCount = 0;
    this.matchStartTime = Date.now();
    this.levelCompleted = false; // Track if level is completed to stop timer

    // Reset per-level achievement tracking
    this.game.currentLevelMismatches = 0;
    this.game.currentMatchTypeStreak = [];
    this.pairPlacementMethods = {};
    this.game.currentGameSnapPlacements = 0;

    // Select matching music based on new game plus level
    let matchMusicName = "match-music"; // Default for NG+0
    const currentDifficulty = this.game.currentDifficulty;

    if (currentDifficulty === 1) {
      matchMusicName = "match-music-1";
    } else if (currentDifficulty === 2) {
      matchMusicName = "match-music-2";
    } else if (currentDifficulty === 3) {
      matchMusicName = "match-music-3";
    } else if (currentDifficulty >= 4) {
      // For NG+4 and beyond, randomly select from all matching music
      const randomChoice = Math.floor(Math.random() * 4);
      if (randomChoice === 0) {
        matchMusicName = "match-music";
      } else if (randomChoice === 1) {
        matchMusicName = "match-music-1";
      } else if (randomChoice === 2) {
        matchMusicName = "match-music-2";
      } else {
        matchMusicName = "match-music-3";
      }
    }

    this.game.audioManager.playMusic(matchMusicName, true, 0.3);

    // Unlock the track in audio player
    if (this.game.levelSelect && this.game.levelSelect.audioPlayer) {
      this.game.levelSelect.audioPlayer.unlockTrack(matchMusicName);
    }
  }

  cleanup() {
    super.cleanup();

    // Clear all active timeouts
    this.clearAllTimeouts();

    // Clear auto-shoot interval
    this.stopAutoShoot();

    // Reset canvas transform in case shake is still active
    if (this.game.canvas) {
      this.game.canvas.style.transform = "";
      this.game.canvas.className = ""; // Reset cursor to default
    }

    this.game.audioManager.stopMusic();
  }

  clearAllTimeouts() {
    this.activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.activeTimeouts = [];
  }

  onResize() {
    this.setupDropZones();
    this.setupSockPilePosition();
    this.setSockballAnimationTarget();
  }

  setSockballAnimationTarget() {
    const layout = this.layoutCache;
    // Set the target position for sockball animations to the sockball counter icon
    this.sockManager.sockballTargetX =
      layout.sockBallsX - this.game.getScaledValue(25);
    this.sockManager.sockballTargetY = layout.sockBallsY;
  }

  setupDropZones() {
    const layout = this.layoutCache;
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    this.dropZones = [];

    // Center the zones horizontally with tighter spacing
    const totalPairs = GameConfig.DROP_TARGET_PAIRS;
    const horizontalSpacing = this.game.getScaledValue(180); // Closer together
    const totalWidth = (totalPairs - 1) * horizontalSpacing;
    const startX = (canvasWidth - totalWidth) / 2;

    // Vertical positioning - pairs 1 and 3 are lower than pair 2
    const baseY = canvasHeight / 2 - this.game.getScaledValue(80); // Nudged up by 20 pixels
    const verticalOffset = this.game.getScaledValue(60); // How much lower 1 & 3 are

    for (let pairId = 0; pairId < totalPairs; pairId++) {
      const pairCenterX = startX + pairId * horizontalSpacing;

      // Pair 2 (middle, index 1) is higher, pairs 1 and 3 (indices 0 and 2) are lower
      const pairBaseY = pairId === 1 ? baseY : baseY + verticalOffset;

      // Top zone
      this.dropZones.push({
        x: pairCenterX,
        y: pairBaseY - layout.dropZoneSpacing / 2,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        pairId: pairId,
        zoneIndex: 0,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        id: pairId * 2,
      });

      // Bottom zone
      this.dropZones.push({
        x: pairCenterX,
        y: pairBaseY + layout.dropZoneSpacing / 2,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        pairId: pairId,
        zoneIndex: 1,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        id: pairId * 2 + 1,
      });
    }
  }

  setupSockPilePosition() {
    // Guard against resize before screen is set up
    if (!this.sockManager.sockPile) {
      return;
    }

    const layout = this.layoutCache;
    const sockPile = this.sockManager.sockPile;
    sockPile.x = layout.sockPileX;
    sockPile.y = layout.sockPileY;
    sockPile.width = layout.sockPileSize;
    sockPile.height = layout.sockPileSize;
  }

  handleKeyDown(e) {
    // Space to shoot sock from pile
    if (e.key === " ") {
      if (!this.isPaused) {
        this.shootSockFromPile();
        e.preventDefault();
      }
      return;
    }

    // Tab to cycle through socks (for selecting/dragging)
    if (e.key === "Tab") {
      if (!this.isPaused) {
        this.selectNextSock();
        e.preventDefault();
      }
      return;
    }

    // Arrow keys to move selected sock
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown"
    ) {
      if (!this.isPaused && this.selectedSock) {
        this.moveSelectedSock(e.key);
        e.preventDefault();
      }
      return;
    }

    // Enter to drop selected sock
    if (e.key === "Enter") {
      if (!this.isPaused && this.selectedSock) {
        this.dropSelectedSock();
        e.preventDefault();
      }
      return;
    }
  }

  selectNextSock() {
    const activeSocks = this.sockManager.socks.filter((s) => s.active);
    if (activeSocks.length === 0) return;

    // If no sock selected, select first active sock
    if (!this.selectedSock) {
      this.selectedSock = activeSocks[0];
      this.sockSelectedByKeyboard = true;
      return;
    }

    // Find current sock index and select next
    const currentIndex = activeSocks.indexOf(this.selectedSock);
    const nextIndex = (currentIndex + 1) % activeSocks.length;
    this.selectedSock = activeSocks[nextIndex];
    this.sockSelectedByKeyboard = true;
  }

  moveSelectedSock(key) {
    if (!this.selectedSock) return;

    const moveSpeed = this.game.getScaledValue(10);

    switch (key) {
      case "ArrowLeft":
        this.selectedSock.x -= moveSpeed;
        break;
      case "ArrowRight":
        this.selectedSock.x += moveSpeed;
        break;
      case "ArrowUp":
        this.selectedSock.y -= moveSpeed;
        break;
      case "ArrowDown":
        this.selectedSock.y += moveSpeed;
        break;
    }

    // Keep within canvas bounds
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const sockSize = this.game.getScaledValue(40);

    this.selectedSock.x = Math.max(
      sockSize,
      Math.min(canvasWidth - sockSize, this.selectedSock.x)
    );
    this.selectedSock.y = Math.max(
      sockSize,
      Math.min(canvasHeight - sockSize, this.selectedSock.y)
    );

    // Reset velocity when moved by keyboard
    this.selectedSock.vx = 0;
    this.selectedSock.vy = 0;
  }

  dropSelectedSock() {
    if (!this.selectedSock) return;

    // Check if sock is near a drop zone
    const nearbyZone = this.findNearbyDropZone(this.selectedSock);
    if (nearbyZone && !nearbyZone.sock) {
      this.placeSockInZone(this.selectedSock, nearbyZone);
    }

    // Deselect the sock
    this.selectedSock = null;
    this.sockSelectedByKeyboard = false;
  }

  findNearbyDropZone(sock) {
    const snapDistance = this.game.getScaledValue(100);

    for (const zone of this.dropZones) {
      const dx = sock.x - zone.x;
      const dy = sock.y - zone.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < snapDistance) {
        return zone;
      }
    }

    return null;
  }

  placeSockInZone(sock, zone) {
    zone.sock = sock;
    sock.x = zone.x;
    sock.y = zone.y;
    sock.vx = 0;
    sock.vy = 0;
    sock.rotationSpeed = 0;

    // Create snap effect
    this.createSnapEffect(zone);

    // Play snap sound
    this.game.audioManager.playSound("snap", false, 0.3);

    // Check for matches
    this.checkForMatches();
  }

  onMouseDown(x, y) {
    const layout = this.layoutCache;

    // Check pause button click (always allow)
    const pauseButtonLeft = layout.pauseButtonX - layout.pauseButtonWidth / 2;
    const pauseButtonTop = layout.pauseButtonY - layout.pauseButtonHeight / 2;
    if (
      x >= pauseButtonLeft &&
      x <= pauseButtonLeft + layout.pauseButtonWidth &&
      y >= pauseButtonTop &&
      y <= pauseButtonTop + layout.pauseButtonHeight
    ) {
      this.togglePause();
      return true;
    }

    // Prevent all other interactions when paused (exit button, sock pile, socks)
    if (this.isPaused) {
      return false;
    }

    // Check exit button click (only when not paused)
    const exitButtonLeft = layout.exitButtonX - layout.exitButtonWidth / 2;
    const exitButtonTop = layout.exitButtonY - layout.exitButtonHeight / 2;
    if (
      x >= exitButtonLeft &&
      x <= exitButtonLeft + layout.exitButtonWidth &&
      y >= exitButtonTop &&
      y <= exitButtonTop + layout.exitButtonHeight
    ) {
      this.exitToLevelSelect();
      return true;
    }

    // Check debug button click (only when not paused and DEV_MODE is true)
    if (GameConfig.DEV_MODE) {
      const debugButtonLeft = layout.debugButtonX - layout.debugButtonWidth / 2;
      const debugButtonTop = layout.debugButtonY - layout.debugButtonHeight / 2;
      if (
        x >= debugButtonLeft &&
        x <= debugButtonLeft + layout.debugButtonWidth &&
        y >= debugButtonTop &&
        y <= debugButtonTop + layout.debugButtonHeight
      ) {
        this.matchAllSocks();
        return true;
      }
    }

    if (this.sockManager.checkSockPileClick(x, y)) {
      this.sockPilePressed = true;
      this.shootSockFromPile(); // Shoot immediately on first click
      this.startAutoShoot(); // Start auto-shooting after a delay
      return true;
    }

    return this.checkSockClick(x, y);
  }

  checkSockClick(x, y) {
    const sock = this.sockManager.getSockAt(x, y);
    if (sock) {
      this.draggedSock = sock;
      this.dragOffset = { x: x - sock.x, y: y - sock.y };
      this.isDragging = true;

      // Track initial position for click-only detection
      this.initialMousePos = { x: x, y: y };
      this.wasDragged = false;

      // Initialize drag history for velocity tracking
      this.dragHistory = [
        {
          x: x,
          y: y,
          timestamp: Date.now(),
        },
      ];

      this.dropZones.forEach((zone) => {
        if (zone.sock === sock) {
          zone.sock = null;
        }
      });

      return true;
    }
    return false;
  }

  onMouseMove(x, y) {
    const layout = this.layoutCache;

    // Update pause button hover (always allow hover for pause/resume)
    const pauseButtonLeft = layout.pauseButtonX - layout.pauseButtonWidth / 2;
    const pauseButtonTop = layout.pauseButtonY - layout.pauseButtonHeight / 2;
    this.pauseButton.hovered =
      x >= pauseButtonLeft &&
      x <= pauseButtonLeft + layout.pauseButtonWidth &&
      y >= pauseButtonTop &&
      y <= pauseButtonTop + layout.pauseButtonHeight;

    // Don't allow exit button hover, dragging, or sock pile hover when paused
    if (this.isPaused) {
      this.exitButton.hovered = false;
      this.sockPileHover = false;
      return;
    }

    // Update exit button hover (only when not paused)
    const exitButtonLeft = layout.exitButtonX - layout.exitButtonWidth / 2;
    const exitButtonTop = layout.exitButtonY - layout.exitButtonHeight / 2;
    this.exitButton.hovered =
      x >= exitButtonLeft &&
      x <= exitButtonLeft + layout.exitButtonWidth &&
      y >= exitButtonTop &&
      y <= exitButtonTop + layout.exitButtonHeight;

    // Update debug button hover (only when not paused and DEV_MODE is true)
    if (GameConfig.DEV_MODE) {
      const debugButtonLeft = layout.debugButtonX - layout.debugButtonWidth / 2;
      const debugButtonTop = layout.debugButtonY - layout.debugButtonHeight / 2;
      this.debugButton.hovered =
        x >= debugButtonLeft &&
        x <= debugButtonLeft + layout.debugButtonWidth &&
        y >= debugButtonTop &&
        y <= debugButtonTop + layout.debugButtonHeight;
    } else {
      this.debugButton.hovered = false;
    }

    // If sock pile is pressed but mouse moved away from it, stop auto-shooting
    if (this.sockPilePressed && !this.sockManager.checkSockPileClick(x, y)) {
      this.sockPilePressed = false;
      this.stopAutoShoot();
    }

    if (this.draggedSock) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;

      // Check if mouse moved significantly (more than 5 pixels) - if so, it's a drag
      if (this.initialMousePos && !this.wasDragged) {
        const dx = x - this.initialMousePos.x;
        const dy = y - this.initialMousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
          this.wasDragged = true;
        }
      }

      // Track drag history for velocity calculation
      const currentTime = Date.now();
      this.dragHistory.push({
        x: x,
        y: y,
        timestamp: currentTime,
      });

      // Keep only recent history
      if (this.dragHistory.length > this.maxDragHistoryLength) {
        this.dragHistory.shift();
      }

      // Remove old entries (older than 150ms for more responsive throwing)
      this.dragHistory = this.dragHistory.filter(
        (entry) => currentTime - entry.timestamp < 150
      );
    }

    this.updateHoverEffects(x, y);

    // Update cursor based on what's being hovered
    this.updateCursor(x, y);
  }

  updateCursor(x, y) {
    // Check if hovering over buttons
    const isButtonHovered = this.pauseButton.hovered || this.exitButton.hovered || this.debugButton.hovered;

    // Check if hovering over sock pile (only when not paused)
    const isSockPileHovered = !this.isPaused && this.sockPileHover;

    // Check if hovering over a sock (only when not paused)
    const isSockHovered =
      !this.isPaused &&
      !this.isDragging &&
      this.sockManager.getSockAt(x, y) !== null;

    // Set cursor based on what's being hovered/interacted with
    if (this.isDragging) {
      this.game.canvas.style.cursor = "grabbing";
    } else if (isSockHovered) {
      this.game.canvas.style.cursor = "grab";
    } else if (isButtonHovered || isSockPileHovered) {
      this.game.canvas.style.cursor = "pointer";
    } else {
      this.game.canvas.style.cursor = "default";
    }
  }

  calculateThrowVelocity() {
    if (this.dragHistory.length < 2) {
      return { x: 0, y: 0 };
    }

    // Use the most recent entries to calculate velocity
    const recent = this.dragHistory.slice(-2); // Use last 2 entries for more responsive throwing
    if (recent.length < 2) {
      return { x: 0, y: 0 };
    }

    const startEntry = recent[0];
    const endEntry = recent[recent.length - 1];

    const deltaTime = endEntry.timestamp - startEntry.timestamp;
    if (deltaTime === 0) {
      return { x: 0, y: 0 };
    }

    const deltaX = endEntry.x - startEntry.x;
    const deltaY = endEntry.y - startEntry.y;

    // Calculate velocity (pixels per millisecond, then scale)
    let vx = (deltaX / deltaTime) * this.velocityScale;
    let vy = (deltaY / deltaTime) * this.velocityScale;

    // Apply velocity limits
    const magnitude = Math.sqrt(vx * vx + vy * vy);
    if (magnitude > this.maxThrowVelocity) {
      const scale = this.maxThrowVelocity / magnitude;
      vx *= scale;
      vy *= scale;
    }

    return { x: vx, y: vy };
  }

  updateHoverEffects(x, y) {
    this.sockPileHover = this.sockManager.checkSockPileClick(x, y);
    this.dropZoneHover = null;

    // Update hovered sock (only when not dragging)
    if (!this.draggedSock) {
      this.hoveredSock = this.sockManager.getSockAt(x, y);
    } else {
      this.hoveredSock = null;
    }

    if (this.draggedSock) {
      const snapDistance = this.game.getScaledValue(80);

      for (const zone of this.dropZones) {
        const distance = this.physics.getDropZoneDistance(
          this.draggedSock,
          zone
        );
        if (distance < snapDistance) {
          this.dropZoneHover = zone.id;
          break; // Only highlight the first matching zone
        }
      }
    }
  }

  onMouseUp() {
    // Stop auto-shooting when mouse is released
    if (this.sockPilePressed) {
      this.sockPilePressed = false;
      this.stopAutoShoot();
    }

    if (!this.draggedSock) return;

    const sock = this.draggedSock;
    const snapDistance = this.game.getScaledValue(60);
    let snapped = false;

    this.dropZones.forEach((zone) => {
      const distance = this.physics.getDropZoneDistance(sock, zone);

      if (distance < snapDistance) {
        if (zone.sock === null) {
          zone.sock = sock;
          this.physics.snapToDropZone(sock, zone);
          snapped = true;
          this.createSnapEffect(zone);

          // Track placement method for Snappy achievement
          const placementMethod = this.wasDragged ? 'drag' : 'click';
          if (!this.pairPlacementMethods[zone.pairId]) {
            this.pairPlacementMethods[zone.pairId] = [];
          }
          this.pairPlacementMethods[zone.pairId].push(placementMethod);
        } else {
          // Zone occupied, throw the sock with calculated velocity
          const throwVelocity = this.calculateThrowVelocity();
          this.physics.applySockThrow(sock, throwVelocity);
        }
      }
    });

    if (!snapped) {
      // Not near a drop zone, throw the sock with calculated velocity
      const throwVelocity = this.calculateThrowVelocity();
      this.physics.applySockThrow(sock, throwVelocity);

      // Achievement: MOMENTUM_KILLER - Break a 15+ match streak
      if (this.matchStreak >= GameConfig.ACHIEVEMENTS.MOMENTUM_KILLER.threshold) {
        this.game.unlockAchievement("momentum_killer");
      }

      // Break streak when dropping a sock without placing it
      this.matchStreak = 0;
      this.lastMatchTime = 0;
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.dragHistory = [];
    this.initialMousePos = null;
    this.wasDragged = false;
    this.checkForMatches();
  }

  startAutoShoot() {
    // Clear any existing interval
    this.stopAutoShoot();

    // Start auto-shooting after a short delay, then every 100ms
    this.autoShootInterval = setInterval(() => {
      if (this.sockPilePressed && !this.isPaused) {
        this.shootSockFromPile();
      }
    }, 100); // 0.1 seconds = 100 milliseconds
  }

  stopAutoShoot() {
    if (this.autoShootInterval) {
      clearInterval(this.autoShootInterval);
      this.autoShootInterval = null;
    }
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) {
      // No more socks to shoot, stop auto-shooting
      this.stopAutoShoot();
      return;
    }

    // Mark sock pile as clicked
    if (!this.sockPileClicked) {
      this.sockPileClicked = true;
    }

    // Play pile click sound
    this.game.audioManager.playSound("pile-click", false, 0.4);
  }

  exitToLevelSelect() {
    this.game.audioManager.playSound("click", false, 0.5);
    this.game.changeGameState("menu");
  }

  matchAllSocks() {
    // Debug function to instantly match all socks
    this.game.audioManager.playSound("click", false, 0.5);

    // Get all remaining socks
    const level = GameConfig.LEVELS[this.game.currentLevel];
    if (!level) return;

    // Calculate how many pairs we need to make
    const pairsNeeded = level.sockPairs - this.game.sockBalls;

    // Match pairs by taking socks from the pile
    for (let i = 0; i < pairsNeeded; i++) {
      if (this.sockManager.sockList.length >= 2) {
        // Get the sock type from the sock list
        const sockType = this.sockManager.sockList[0];

        // Remove two socks from the pile
        this.sockManager.sockList.shift();
        this.sockManager.sockList.shift();

        // Directly increment sockballs count
        this.game.sockBalls++;

        // Add sockball to the game's sockball queue for throwing
        this.game.sockballQueue.push(sockType);

        // Play match sound
        if (i === 0) {
          this.game.audioManager.playSound("easter-egg-match", false, 0.5);
        }
      }
    }

    // Mark level as completed
    this.levelCompleted = true;

    // Start throwing phase
    const timeoutId = setTimeout(() => {
      if (this.game.gameState === "matching") {
        this.game.startThrowingPhase();
      }
    }, 500);
    this.activeTimeouts.push(timeoutId);
  }

  createSnapEffect(zone) {
    zone.glowEffect = 20;

    // Play snap-to-zone sound
    this.game.audioManager.playSound("snap-to-zone", false, 0.3);
  }

  checkForMatches() {
    const currentTime = Date.now();

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2 && pairZones[0].sock && pairZones[1].sock) {
        if (pairZones[0].sock.type === pairZones[1].sock.type) {
          const matchedSockType = pairZones[0].sock.type;
          this.game.addSockballToQueue(matchedSockType);

          // Track sock type streak for "One at a Time" achievement
          this.game.currentMatchTypeStreak.push(matchedSockType);

          // Check if the last 4 matches were all the same type
          if (this.game.currentMatchTypeStreak.length >= GameConfig.ACHIEVEMENTS.ONE_AT_A_TIME.threshold) {
            const lastFour = this.game.currentMatchTypeStreak.slice(-GameConfig.ACHIEVEMENTS.ONE_AT_A_TIME.threshold);
            const allSameType = lastFour.every(type => type === lastFour[0]);
            if (allSameType) {
              this.game.unlockAchievement("one_at_a_time");
            }
          }

          // Achievement: SNAPPY & PURE_SNAP - Check sock placement methods
          if (this.pairPlacementMethods[pairId] && this.pairPlacementMethods[pairId].length === 2) {
            const hasClickPlacement = this.pairPlacementMethods[pairId].includes('click');
            const allClickPlacements = this.pairPlacementMethods[pairId].every(method => method === 'click');

            if (hasClickPlacement) {
              this.game.unlockAchievement("snappy");

              // Achievement: PURE_SNAP - Both socks placed without dragging
              if (allClickPlacements) {
                this.game.unlockAchievement("pure_snap");
              }

              // Increment snap counters
              this.game.currentGameSnapPlacements++;
              this.game.totalSnapPlacements++;

              // Achievement: DOUBLE_SNAP - 2 snaps in one game
              if (this.game.currentGameSnapPlacements >= GameConfig.ACHIEVEMENTS.DOUBLE_SNAP.threshold) {
                this.game.unlockAchievement("double_snap");
              }

              // Achievement: SNAP_MASTER - 10 total snaps
              if (this.game.totalSnapPlacements >= GameConfig.ACHIEVEMENTS.SNAP_MASTER.threshold) {
                this.game.unlockAchievement("snap_master");
              }
            }
          }

          // Clear the placement tracking for this pair
          delete this.pairPlacementMethods[pairId];

          this.game.audioManager.playSound("easter-egg-match", false, 0.5);

          const timeoutId = setTimeout(() => {
            if (this.game.gameState !== "matching") return;
            this.game.audioManager.playSound("points-gained", false, 0.4);
          }, 500);
          this.activeTimeouts.push(timeoutId);

          this.startMatchAnimation(pairZones[0].sock, pairZones[1].sock);
          pairZones[0].sock = null;
          pairZones[1].sock = null;

          // Track match count for achievements
          this.matchCount++;

          // Achievement: FIRST_MATCH
          if (!this.firstMatchMade) {
            this.firstMatchMade = true;
            this.game.unlockAchievement("first_match");
          }

          // Achievement: QUICK_HANDS
          if (this.matchCount === GameConfig.ACHIEVEMENTS.QUICK_HANDS.pairs) {
            const timeElapsed = (currentTime - this.matchStartTime) / 1000;
            if (timeElapsed <= GameConfig.ACHIEVEMENTS.QUICK_HANDS.timeLimit) {
              this.game.unlockAchievement("quick_hands");
            }
          }

          // Update streak (increment on each successful match)
          this.matchStreak++;
          this.lastMatchTime = currentTime;

          // Achievement: STREAK_KING
          if (this.matchStreak >= GameConfig.ACHIEVEMENTS.STREAK_KING.threshold) {
            this.game.unlockAchievement("streak_king");
          }

          // Achievement: COMBO_MASTER
          if (this.matchStreak >= GameConfig.ACHIEVEMENTS.COMBO_MASTER.threshold) {
            this.game.unlockAchievement("combo_master");
          }

          // Screen shake effect
          this.createScreenShake();

          const level = GameConfig.LEVELS[this.game.currentLevel];
          const completedSockballs = this.game.sockBalls;
          const queuedSockballs = this.game.getSockballQueueLength();
          const animatingSockballs =
            this.sockManager.getAnimatingSockballsCount();
          const totalSockballs =
            completedSockballs + queuedSockballs + animatingSockballs;

          if (level && totalSockballs >= level.sockPairs) {
            if (!this.levelCompleted) {
              this.levelCompleted = true;

              const timeLimit = this.game.matchingTime;
              const timeElapsed = Math.floor(this.game.timeElapsed);
              const timeRemaining = timeLimit - timeElapsed;

              if (timeElapsed <= timeLimit) {
                this.game.timeBonusEarned = true;
              }

              // Achievement: PERFECT_TIMING (finish with exactly 0 seconds left)
              if (timeRemaining === 0 && timeElapsed === timeLimit) {
                this.game.unlockAchievement("perfect_timing");
              }

              // Achievement: SPEEDY_MATCHER
              if (timeRemaining >= GameConfig.ACHIEVEMENTS.SPEEDY_MATCHER.threshold) {
                this.game.unlockAchievement("speedy_matcher");
              }

              // Achievement: SPEED_DEMON
              if (timeRemaining >= GameConfig.ACHIEVEMENTS.SPEED_DEMON.threshold) {
                this.game.unlockAchievement("speed_demon");
              }
            }
          }
        } else {
          this.handleMismatch(pairZones[0].sock, pairZones[1].sock);
          pairZones[0].sock = null;
          pairZones[1].sock = null;

          // Clear placement tracking for this pair on mismatch
          delete this.pairPlacementMethods[pairId];

          // Achievement: MOMENTUM_KILLER - Break a 15+ match streak
          if (this.matchStreak >= GameConfig.ACHIEVEMENTS.MOMENTUM_KILLER.threshold) {
            this.game.unlockAchievement("momentum_killer");
          }

          this.matchStreak = 0;
          this.lastMatchTime = 0;
        }
      }
    }
  }

  handleMismatch(sock1, sock2) {
    // Play mismatch sound
    this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);

    // Track mismatches for achievements
    this.game.currentLevelMismatches++;
    this.game.lifetimeMismatches++;

    // Achievement: MISMATCHED - First mismatch ever
    this.game.unlockAchievement("mismatched");

    // Achievement: MISMATCH_CHAOS - 5 mismatches in a single level
    if (this.game.currentLevelMismatches >= GameConfig.ACHIEVEMENTS.MISMATCH_CHAOS.threshold) {
      this.game.unlockAchievement("mismatch_chaos");
    }

    // Achievement: MISMATCH_QUEEN - 25 lifetime mismatches
    if (this.game.lifetimeMismatches >= GameConfig.ACHIEVEMENTS.MISMATCH_QUEEN.threshold) {
      this.game.unlockAchievement("mismatch_queen");
    }

    // Create mismatch particle effects
    this.sockManager.createMismatchEffect(sock1, sock2);

    const throwForce = 20;

    this.physics.applySockThrow(sock1, {
      x: (Math.random() - 0.5) * throwForce,
      y: (Math.random() - 0.5) * throwForce,
    });

    this.physics.applySockThrow(sock2, {
      x: (Math.random() - 0.5) * throwForce,
      y: (Math.random() - 0.5) * throwForce,
    });

    // Add some visual feedback
    sock1.glowEffect = 30;
    sock2.glowEffect = 30;

    // Create a different screen shake for mismatch
    this.createMismatchShake();
  }

  createMismatchShake() {
    // More intense shake for mismatch
    const canvas = this.game.canvas;
    const originalTransform = canvas.style.transform;

    let shakeIntensity = 4; // Stronger than match shake
    let shakeCount = 0;
    const maxShakes = 8; // More shakes

    const shake = () => {
      if (shakeCount < maxShakes) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        shakeCount++;
        shakeIntensity *= 0.85;
        const timeoutId = setTimeout(shake, 40); // Slightly faster shake
        this.activeTimeouts.push(timeoutId);
      } else {
        canvas.style.transform = originalTransform;
      }
    };

    shake();
  }

  startMatchAnimation(sock1, sock2) {
    this.sockManager.startMatchAnimation(sock1, sock2);
  }

  createScreenShake() {
    // Simple screen shake effect by temporarily adjusting canvas transform
    const canvas = this.game.canvas;
    const originalTransform = canvas.style.transform;

    let shakeIntensity = 2;
    let shakeCount = 0;
    const maxShakes = 6;

    const shake = () => {
      if (shakeCount < maxShakes) {
        const offsetX = (Math.random() - 0.5) * shakeIntensity;
        const offsetY = (Math.random() - 0.5) * shakeIntensity;
        canvas.style.transform = `translate(${offsetX}px, ${offsetY}px)`;
        shakeCount++;
        shakeIntensity *= 0.8;
        const timeoutId = setTimeout(shake, 50);
        this.activeTimeouts.push(timeoutId);
      } else {
        canvas.style.transform = originalTransform;
      }
    };

    shake();
  }

  onUpdate(deltaTime) {
    this.updateAnimationTimers(deltaTime);

    if (!this.sockPileClicked) {
      this.pulseTimer += deltaTime * 0.005; // Slow pulse
    }

    if (this.sockPileClicked && !this.isPaused && !this.levelCompleted) {
      const timeIncrement = deltaTime / 1000; // Convert milliseconds to seconds
      this.game.timeElapsed += timeIncrement;
    }

    this.sockManager.socks.forEach((sock) => {
      if (
        sock !== this.draggedSock &&
        !this.sockManager.isSockInAnimation(sock)
      ) {
        this.physics.updateSock(sock);
      }
    });

    this.sockManager.update(deltaTime);

    // Update feedback manager for achievement toasts
    this.game.feedbackManager.update(deltaTime);

    this.dropZones.forEach((zone) => {
      if (zone.glowEffect > 0) zone.glowEffect--;
      if (zone.hoverEffect > 0) zone.hoverEffect--;
    });

    const level = GameConfig.LEVELS[this.game.currentLevel];
    if (!level) return; // Guard clause

    if (
      this.sockManager.getSockListLength() === 0 &&
      this.game.sockBalls >= level.sockPairs
    ) {
      // Mark level as completed to stop the timer
      this.levelCompleted = true;

      const timeLimit = this.game.matchingTime;
      const timeElapsed = Math.floor(this.game.timeElapsed);
      const timeRemaining = timeLimit - timeElapsed;

      if (timeElapsed <= timeLimit) {
        this.game.timeBonusEarned = true;
      }

      if (timeRemaining >= GameConfig.ACHIEVEMENTS.SPEEDY_MATCHER.threshold) {
        this.game.unlockAchievement("speedy_matcher");
      }

      this.game.startThrowingPhase();
    }
  }

  onRender(ctx) {
    if (!this.sockPileClicked) {
      this.sockManager.sockPile.pulseEffect = this.pulseTimer;
    } else {
      this.sockManager.sockPile.pulseEffect = 0;
    }

    this.sockManager.renderSockPile(ctx);
    this.renderDropZonePairBoxes(ctx);
    this.renderDropZones(ctx);
    this.sockManager.renderSocks(ctx, this.hoveredSock, this.draggedSock);

    this.sockManager.renderParticleEffects(ctx);
    this.renderMatchScreenUI(ctx);

    this.sockManager.renderSockballAnimations(ctx);

    this.game.feedbackManager.render(ctx);
  }

  renderDropZonePairBoxes(ctx) {
    const layout = this.layoutCache;
    const lineWidth = this.game.getScaledValue(3);
    const margin = this.game.getScaledValue(50);
    const cornerRadius = this.game.getScaledValue(10); // Reduced from 15 to 10

    const pairColors = [
      {
        bg: "rgba(255, 182, 193, 0.15)",
        border: "rgba(255, 105, 180, 0.5)",
        name: "rgba(255, 105, 180, 0.9)",
      }, // Soft pink
      {
        bg: "rgba(173, 216, 230, 0.15)",
        border: "rgba(100, 149, 237, 0.5)",
        name: "rgba(100, 149, 237, 0.9)",
      }, // Soft blue
      {
        bg: "rgba(144, 238, 144, 0.15)",
        border: "rgba(46, 204, 113, 0.5)",
        name: "rgba(46, 204, 113, 0.9)",
      }, // Soft green
    ];

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2) {
        const minX = Math.min(pairZones[0].x, pairZones[1].x) - margin;
        const maxX = Math.max(pairZones[0].x, pairZones[1].x) + margin;
        const minY = Math.min(pairZones[0].y, pairZones[1].y) - margin;
        const maxY = Math.max(pairZones[0].y, pairZones[1].y) + margin;

        const width = maxX - minX;
        const height = maxY - minY;
        const centerX = (minX + maxX) / 2;

        const colors = pairColors[pairId % pairColors.length];

        ctx.save();

        const gradient = ctx.createLinearGradient(minX, minY, minX, maxY);
        gradient.addColorStop(0, colors.bg);
        gradient.addColorStop(1, "rgba(0, 0, 0, 0.05)");

        ctx.fillStyle = gradient;
        this.roundRect(ctx, minX, minY, width, height, cornerRadius);
        ctx.fill();

        ctx.strokeStyle = colors.border;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([]); // Solid line
        this.roundRect(ctx, minX, minY, width, height, cornerRadius);
        ctx.stroke();

        ctx.restore();
      }
    }
  }

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

  renderDropZones(ctx) {
    const lineWidth = this.game.getScaledValue(2);
    const hoverLineWidth = this.game.getScaledValue(3);
    const shadowBlur = this.game.getScaledValue(15);
    const cornerRadius = this.game.getScaledValue(10);

    this.dropZones.forEach((zone, index) => {
      ctx.save();

      let glowIntensity = 0;
      if (zone.glowEffect > 0) {
        glowIntensity = zone.glowEffect / 20;
      }
      if (this.dropZoneHover === index) {
        glowIntensity = Math.max(glowIntensity, 0.8);
      }

      if (glowIntensity > 0) {
        ctx.shadowColor = "rgba(100, 255, 100, " + glowIntensity + ")";
        ctx.shadowBlur = shadowBlur;
      }

      ctx.strokeStyle = zone.sock ? "rgba(100, 255, 100, 0.8)" : "white";
      ctx.lineWidth = this.dropZoneHover === index ? hoverLineWidth : lineWidth;

      // Draw rounded rectangle for drop zone
      this.roundRect(
        ctx,
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height,
        cornerRadius
      );
      ctx.stroke();

      if (this.dropZoneHover === index) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
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

  renderMatchScreenUI(ctx) {
    const layout = this.layoutCache;
    const canvasWidth = this.game.getCanvasWidth();

    // Instructional text below the top bar
    const instructionY =
      layout.barY + layout.barHeight + this.game.getScaledValue(25);
    this.renderText(
      ctx,
      "Drag matching socks to a drop zone to make a sockball",
      canvasWidth / 2,
      instructionY,
      {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 255, 255, 0.85)",
        align: "center",
        baseline: "middle",
        weight: "normal",
      }
    );

    // Remaining socks counter to the LEFT of sock pile
    if (this.sockManager.sockList.length > 0) {
      const remainingSocks = this.sockManager.sockList.length;
      const counterText = `${remainingSocks} ${
        remainingSocks === 1 ? "Sock" : "Socks"
      }`;

      // Position to the left of sock pile
      const counterX = layout.sockPileX - this.game.getScaledValue(140);
      const counterY = layout.sockPileY;

      // Draw background panel with rounded corners
      ctx.save();
      const textWidth = this.game.getScaledValue(100);
      const textHeight = this.game.getScaledValue(50);
      const cornerRadius = this.game.getScaledValue(10); // Match other UI elements

      // Draw rounded background
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      this.roundRect(
        ctx,
        counterX - textWidth / 2,
        counterY - textHeight / 2,
        textWidth,
        textHeight,
        cornerRadius
      );
      ctx.fill();

      // Draw rounded border
      ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
      ctx.lineWidth = this.game.getScaledValue(2);
      this.roundRect(
        ctx,
        counterX - textWidth / 2,
        counterY - textHeight / 2,
        textWidth,
        textHeight,
        cornerRadius
      );
      ctx.stroke();

      // Draw text
      this.renderText(ctx, counterText, counterX, counterY, {
        fontSize: layout.bodyFontSize,
        color: "rgba(255, 215, 0, 0.9)",
        align: "center",
        baseline: "middle",
        weight: "bold",
      });
      ctx.restore();
    }

    // Instructions beside sock pile with arrow - only show if pile is not empty
    if (this.sockManager.sockList.length > 0) {
      const instructionText = "Click sock pile";
      this.renderText(
        ctx,
        instructionText,
        layout.instructionArrowX + this.game.getScaledValue(60),
        layout.instructionArrowY,
        {
          fontSize: layout.bodyFontSize,
          color: "rgba(255, 255, 255, 0.9)",
          align: "left",
        }
      );

      // Draw hand icon pointing at sock pile
      ctx.save();

      if (this.game.images["arrow-no-pixel.png"]) {
        const handIcon = this.game.images["arrow-no-pixel.png"];
        const handIconHeight = this.game.getScaledValue(40);
        const aspectRatio = handIcon.width / handIcon.height;
        const handIconWidth = handIconHeight * aspectRatio;

        // Position for the hand icon
        const handX = layout.instructionArrowX + this.game.getScaledValue(25);
        const handY = layout.instructionArrowY;

        // Translate to center of icon, apply rotation and flip, then draw
        ctx.translate(handX, handY);
        ctx.rotate(-Math.PI / 2); // Rotate 90 degrees counter-clockwise (pointing left)
        ctx.scale(-1, 1); // Flip horizontally

        ctx.drawImage(
          handIcon,
          -handIconWidth / 2,
          -handIconHeight / 2,
          handIconWidth,
          handIconHeight
        );
      }

      ctx.restore();
    }

    // Render top bar
    this.renderTopBar(ctx);
  }

  renderTopBar(ctx) {
    const layout = this.layoutCache;
    const canvasWidth = this.game.getCanvasWidth();

    // Get level data once for the entire top bar
    const level = GameConfig.LEVELS[this.game.currentLevel];
    const totalSockballs = level ? level.sockPairs : 0;
    const timeLimit = this.game.matchingTime;

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

    // Sockballs counter (left side) - now shows x/total format
    const sockBallsX = layout.sockBallsX;
    const sockBallsY = layout.sockBallsY;

    // Draw sock icon
    if (this.game.images["icon-sock.png"]) {
      const sockIcon = this.game.images["icon-sock.png"];
      const sockIconHeight = this.game.getScaledValue(40);
      const sockIconWidth = sockIconHeight * (sockIcon.width / sockIcon.height);
      ctx.drawImage(
        sockIcon,
        sockBallsX - this.game.getScaledValue(40) - sockIconWidth / 2,
        sockBallsY - sockIconHeight / 2,
        sockIconWidth,
        sockIconHeight
      );
    }

    this.renderText(
      ctx,
      `${this.game.sockBalls} / ${totalSockballs}`,
      sockBallsX + this.game.getScaledValue(10),
      sockBallsY,
      {
        fontSize: layout.headerFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 215, 0, 0.9)",
        weight: "bold",
      }
    );

    // Streak counter (CENTER of top bar - always visible)
    // Determine which fire icon to use based on streak
    let fireIcon = "icon-fire1.png"; // Default fire icon
    if (this.matchStreak >= 10) {
      fireIcon = "icon-fire3.png"; // Biggest flame for 10+ streak
    } else if (this.matchStreak >= 5) {
      fireIcon = "icon-fire2.png"; // Medium flame for 5+ streak
    }

    const streakText = `${this.matchStreak}x Streak`;
    const streakColor =
      this.matchStreak >= 10
        ? "rgba(255, 100, 0, 0.9)" // Hot orange for 10+
        : this.matchStreak >= 5
        ? "rgba(255, 165, 0, 0.9)" // Orange for 5+
        : this.matchStreak >= 3
        ? "rgba(255, 200, 0, 0.9)" // Yellow-orange for 3+
        : "rgba(200, 200, 200, 0.7)"; // Gray for 0-2

    // Draw streak text first
    this.renderText(ctx, streakText, layout.streakX, layout.streakY, {
      fontSize: layout.bodyFontSize,
      align: "center",
      baseline: "middle",
      color: streakColor,
      weight: "bold",
    });

    // Draw fire icon to the right of the text
    const iconWidth = layout.bodyFontSize * 1.2;
    ctx.font = `bold ${layout.bodyFontSize}px "Press Start 2P", monospace`;
    const textWidth = ctx.measureText(streakText).width;
    const iconX = layout.streakX + textWidth / 2 + 5;
    if (this.game.images[fireIcon]) {
      const fireImage = this.game.images[fireIcon];
      const iconHeight = iconWidth * (fireImage.height / fireImage.width);
      ctx.drawImage(
        fireImage,
        iconX,
        layout.streakY - iconHeight / 2,
        iconWidth,
        iconHeight
      );
    }

    // Time display (left of center)
    const timeElapsed = Math.max(0, Math.floor(this.game.timeElapsed));
    const isOverTime = timeElapsed > timeLimit;

    const timeColor = isOverTime
      ? "rgba(255, 68, 68, 0.9)"
      : timeElapsed > timeLimit * 0.8
      ? "rgba(255, 200, 68, 0.9)"
      : "rgba(255, 255, 255, 0.9)";

    // Draw clock icon
    if (this.game.images["icon-clock.png"]) {
      const clockIcon = this.game.images["icon-clock.png"];
      const clockIconHeight = this.game.getScaledValue(40);
      const clockIconWidth =
        clockIconHeight * (clockIcon.width / clockIcon.height);
      ctx.drawImage(
        clockIcon,
        layout.timeX - this.game.getScaledValue(50) - clockIconWidth / 2,
        layout.timeY - clockIconHeight / 2,
        clockIconWidth,
        clockIconHeight
      );
    }

    const timeText = `${timeElapsed}s / ${timeLimit}s`;
    this.renderText(ctx, timeText, layout.timeX, layout.timeY, {
      fontSize: layout.bodyFontSize,
      align: "left",
      baseline: "middle",
      color: timeColor,
      weight: "bold",
    });

    // Pause button
    this.renderBottomBarButton(
      ctx,
      layout.pauseButtonX,
      layout.pauseButtonY,
      layout.pauseButtonWidth,
      layout.pauseButtonHeight,
      this.isPaused ? "▶ Resume" : "❚❚ Pause",
      this.pauseButton.hovered,
      "rgba(100, 100, 100, 0.8)"
    );

    // Exit button
    this.renderBottomBarButton(
      ctx,
      layout.exitButtonX,
      layout.exitButtonY,
      layout.exitButtonWidth,
      layout.exitButtonHeight,
      "Exit",
      this.exitButton.hovered,
      "rgba(180, 40, 40, 0.8)"
    );

    // Debug button (only visible in DEV_MODE)
    if (GameConfig.DEV_MODE) {
      this.renderBottomBarButton(
        ctx,
        layout.debugButtonX,
        layout.debugButtonY,
        layout.debugButtonWidth,
        layout.debugButtonHeight,
        "Match All",
        this.debugButton.hovered,
        "rgba(255, 0, 255, 0.8)"
      );
    }
  }

  renderBottomBarButton(ctx, x, y, width, height, text, isHovered, baseColor) {
    ctx.save();

    const buttonLeft = x - width / 2;
    const buttonTop = y - height / 2;

    // Check which button this is and get the appropriate image
    const isExitButton = text === "Exit";
    const isPauseButton = text === "❚❚ Pause";
    const isResumeButton = text === "▶ Resume";

    let buttonImage = null;
    if (isExitButton) {
      buttonImage = this.game.images["btn-exit.png"];
    } else if (isPauseButton) {
      buttonImage = this.game.images["btn-pause.png"];
    } else if (isResumeButton) {
      buttonImage = this.game.images["btn-resume.png"];
    }

    if (buttonImage) {
      // Use button image - always fit to height for consistency
      const aspectRatio = buttonImage.width / buttonImage.height;

      // Always fit to height to ensure all buttons have same height
      const imgHeight = height;
      const imgWidth = imgHeight * aspectRatio;

      const imgX = buttonLeft + (width - imgWidth) / 2;
      const imgY = buttonTop;

      // Apply hover effect - scale and add glow
      if (isHovered) {
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = buttonLeft + (width - scaledWidth) / 2;
        const scaledY = buttonTop + (height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Fallback for other buttons - use gradient style
      const radius = this.game.getScaledValue(6);

      // Button background
      ctx.fillStyle = isHovered ? this.lightenColor(baseColor) : baseColor;
      ctx.strokeStyle = isHovered
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
      this.renderText(ctx, text, x, y, {
        fontSize: this.layoutCache.smallFontSize,
        align: "center",
        baseline: "middle",
        color: "rgba(255, 255, 255, 0.9)",
        weight: "bold",
      });
    }

    ctx.restore();
  }

  // Controller reticle support
  getInteractiveElements() {
    const layout = this.layoutCache;
    const elements = [];

    // Add pause button (always interactable)
    elements.push({
      x: layout.pauseButtonX - layout.pauseButtonWidth / 2,
      y: layout.pauseButtonY - layout.pauseButtonHeight / 2,
      width: layout.pauseButtonWidth,
      height: layout.pauseButtonHeight
    });

    // Don't add other elements when paused
    if (this.isPaused) {
      return elements;
    }

    // Add exit button (only when not paused)
    elements.push({
      x: layout.exitButtonX - layout.exitButtonWidth / 2,
      y: layout.exitButtonY - layout.exitButtonHeight / 2,
      width: layout.exitButtonWidth,
      height: layout.exitButtonHeight
    });

    // Add sock pile
    if (this.sockManager.sockPile && this.sockManager.sockList.length > 0) {
      const sockPile = this.sockManager.sockPile;
      elements.push({
        x: sockPile.x - sockPile.width / 2,
        y: sockPile.y - sockPile.height / 2,
        width: sockPile.width,
        height: sockPile.height
      });
    }

    // Add all active socks
    this.sockManager.socks.forEach((sock) => {
      if (sock.active && !this.sockManager.isSockInAnimation(sock)) {
        const sockSize = this.game.getScaledValue(40);
        elements.push({
          x: sock.x - sockSize / 2,
          y: sock.y - sockSize / 2,
          width: sockSize,
          height: sockSize
        });
      }
    });

    return elements;
  }

  handleReticleMove(x, y) {
    const layout = this.layoutCache;

    // If dragging a sock, move it with the reticle
    if (this.draggedSock && !this.isPaused) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;

      // Check if reticle moved significantly - if so, it's a drag
      if (this.initialMousePos && !this.wasDragged) {
        const dx = x - this.initialMousePos.x;
        const dy = y - this.initialMousePos.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance > 5) {
          this.wasDragged = true;
        }
      }

      // Track drag history for velocity calculation
      const currentTime = Date.now();
      this.dragHistory.push({
        x: x,
        y: y,
        timestamp: currentTime,
      });

      // Keep only recent history
      if (this.dragHistory.length > this.maxDragHistoryLength) {
        this.dragHistory.shift();
      }

      // Remove old entries (older than 150ms)
      this.dragHistory = this.dragHistory.filter(
        (entry) => currentTime - entry.timestamp < 150
      );

      // Update hover effects for drop zones
      this.updateHoverEffects(x, y);
    }

    // Update pause button hover state (always allow for pause/resume)
    this.pauseButton.hovered = this.isPointInRect(x, y, {
      x: layout.pauseButtonX - layout.pauseButtonWidth / 2,
      y: layout.pauseButtonY - layout.pauseButtonHeight / 2,
      width: layout.pauseButtonWidth,
      height: layout.pauseButtonHeight
    });

    // Don't allow other hovers when paused
    if (this.isPaused) {
      this.exitButton.hovered = false;
      this.sockPileHover = false;
      this.hoveredSock = null;
      if (this.game.controllerManager) {
        this.game.controllerManager.setReticleHoverState(this.pauseButton.hovered);
      }
      return;
    }

    // Update exit button hover state (only when not paused)
    this.exitButton.hovered = this.isPointInRect(x, y, {
      x: layout.exitButtonX - layout.exitButtonWidth / 2,
      y: layout.exitButtonY - layout.exitButtonHeight / 2,
      width: layout.exitButtonWidth,
      height: layout.exitButtonHeight
    });

    // Update sock pile hover state
    this.sockPileHover = this.sockManager.checkSockPileClick(x, y);

    // Update hovered sock (only when not dragging)
    if (!this.draggedSock) {
      this.hoveredSock = this.sockManager.getSockAt(x, y);
    } else {
      this.hoveredSock = null;
    }

    // Update reticle hover state - hovering over any interactive element
    const isHovering = this.pauseButton.hovered || this.exitButton.hovered ||
                       this.sockPileHover || this.hoveredSock !== null ||
                       this.draggedSock !== null;
    if (this.game.controllerManager) {
      this.game.controllerManager.setReticleHoverState(isHovering);
    }
  }

  handleReticleAction(x, y) {
    const layout = this.layoutCache;

    // Check pause button
    if (this.isPointInRect(x, y, {
      x: layout.pauseButtonX - layout.pauseButtonWidth / 2,
      y: layout.pauseButtonY - layout.pauseButtonHeight / 2,
      width: layout.pauseButtonWidth,
      height: layout.pauseButtonHeight
    })) {
      this.togglePause();
      return true;
    }

    // Prevent other interactions when paused
    if (this.isPaused) {
      return false;
    }

    // Check exit button
    if (this.isPointInRect(x, y, {
      x: layout.exitButtonX - layout.exitButtonWidth / 2,
      y: layout.exitButtonY - layout.exitButtonHeight / 2,
      width: layout.exitButtonWidth,
      height: layout.exitButtonHeight
    })) {
      this.exitToLevelSelect();
      return true;
    }

    // If already dragging a sock, release it (place or throw)
    if (this.draggedSock) {
      this.onMouseUp();
      return true;
    }

    // Check sock pile
    if (this.sockManager.checkSockPileClick(x, y)) {
      this.sockPilePressed = true;
      this.shootSockFromPile();
      this.startAutoShoot(); // Start auto-shooting after initial shot
      return true;
    }

    // Check for sock click (to start dragging/selecting)
    const sock = this.sockManager.getSockAt(x, y);
    if (sock) {
      this.draggedSock = sock;
      this.dragOffset = { x: x - sock.x, y: y - sock.y };
      this.isDragging = true;

      // Track initial position for click-only detection
      this.initialMousePos = { x: x, y: y };
      this.wasDragged = false;

      // Initialize drag history for velocity tracking
      this.dragHistory = [
        {
          x: x,
          y: y,
          timestamp: Date.now(),
        },
      ];

      this.dropZones.forEach((zone) => {
        if (zone.sock === sock) {
          zone.sock = null;
        }
      });

      return true;
    }

    return false;
  }

  handleReticleRelease(x, y) {
    // Stop auto-shooting when button is released
    if (this.sockPilePressed) {
      this.sockPilePressed = false;
      this.stopAutoShoot();
    }
  }

  isPointInRect(x, y, rect) {
    return x >= rect.x && x <= rect.x + rect.width &&
           y >= rect.y && y <= rect.y + rect.height;
  }

  renderPauseOverlay(ctx) {
    // Call parent to render the dark overlay and "PAUSED" text
    super.renderPauseOverlay(ctx);

    // Render the resume button on top of the overlay
    const layout = this.layoutCache;
    this.renderBottomBarButton(
      ctx,
      layout.pauseButtonX,
      layout.pauseButtonY,
      layout.pauseButtonWidth,
      layout.pauseButtonHeight,
      "▶ Resume",
      this.pauseButton.hovered,
      "rgba(100, 100, 100, 0.8)"
    );
  }

  lightenColor(color) {
    // Simple color lightening - increase opacity or brightness
    return color.replace(/[\d.]+\)$/, (match) => {
      const opacity = parseFloat(match);
      return Math.min(opacity + 0.1, 1.0) + ")";
    });
  }
}
