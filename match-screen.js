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

    // Velocity tracking for throwing
    this.dragHistory = [];
    this.maxDragHistoryLength = 5;
    this.velocityScale = 12; // Scale factor for throw velocity - increased significantly
    this.maxThrowVelocity = 45; // Maximum throw velocity - increased for more dramatic throws

    // Track active timeouts for cleanup
    this.activeTimeouts = [];
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Top bar configuration
    const barHeight = this.game.getScaledValue(GameConfig.UI_BAR.height);
    const barY = 0; // Top of screen
    const barPadding = this.game.getScaledValue(GameConfig.UI_BAR.padding);
    const panelSpacing = this.game.getScaledValue(GameConfig.UI_BAR.panelSpacing);

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
      sockPileY: canvasHeight - this.game.getScaledValue(80), // Back to bottom
      sockPileSize: this.game.getScaledValue(120),
      // Instructions beside sock pile
      instructionArrowX: canvasWidth / 2 + this.game.getScaledValue(90),
      instructionArrowY: canvasHeight - this.game.getScaledValue(80),

      // Top bar layout
      barY: barY,
      barHeight: barHeight,
      barPadding: barPadding,

      // Top bar elements (left to right)
      sockBallsX: barPadding + this.game.getScaledValue(80),
      sockBallsY: barY + barHeight / 2,

      timeX: barPadding + this.game.getScaledValue(240),
      timeY: barY + barHeight / 2,

      streakX: barPadding + this.game.getScaledValue(480),
      streakY: barY + barHeight / 2,

      // Buttons on the right side of top bar
      pauseButtonX: canvasWidth - this.game.getScaledValue(240),
      pauseButtonY: barY + barHeight / 2,
      pauseButtonWidth: this.game.getScaledValue(100),
      pauseButtonHeight: this.game.getScaledValue(50),

      exitButtonX: canvasWidth - this.game.getScaledValue(120),
      exitButtonY: barY + barHeight / 2,
      exitButtonWidth: this.game.getScaledValue(100),
      exitButtonHeight: this.game.getScaledValue(50),
    };
  }

  setup() {
    super.setup();
    this.game.canvas.className = "matching-phase";
    this.sockManager.initialize();
    this.sockManager.setSockList(this.game.sockList);
    this.setupDropZones();
    this.setupSockPilePosition();
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

    // Reset elapsed time counter and time bonus flag
    this.game.timeElapsed = 0;
    this.game.timeBonusEarned = false;

    // Track achievements for this level
    this.firstMatchMade = false;
    this.matchCount = 0;
    this.matchStartTime = Date.now();
    this.levelCompleted = false; // Track if level is completed to stop timer

    // Start match music
    console.log("🎵 Match screen setup - starting match music");
    this.game.audioManager.playMusic("match-music", true, 0.3);
  }

  cleanup() {
    super.cleanup();

    // Clear all active timeouts
    this.clearAllTimeouts();

    // Reset canvas transform in case shake is still active
    if (this.game.canvas) {
      this.game.canvas.style.transform = '';
    }

    // Stop match music when leaving match screen
    console.log("🎵 Match screen cleanup - stopping match music");
    this.game.audioManager.stopMusic();
  }

  clearAllTimeouts() {
    this.activeTimeouts.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeTimeouts = [];
  }

  onResize() {
    this.setupDropZones();
    this.setupSockPilePosition();
  }

  setupDropZones() {
    const layout = this.layoutCache;
    this.dropZones = [];

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairCenterX = layout.pairWidth / 2 + pairId * layout.pairWidth;

      this.dropZones.push({
        x: pairCenterX,
        y: layout.dropZoneAreaY - layout.dropZoneSpacing / 2,
        width: layout.dropZoneSize,
        height: layout.dropZoneSize,
        pairId: pairId,
        zoneIndex: 0,
        sock: null,
        glowEffect: 0,
        hoverEffect: 0,
        id: pairId * 2,
      });

      this.dropZones.push({
        x: pairCenterX,
        y: layout.dropZoneAreaY + layout.dropZoneSpacing / 2,
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

    // Check exit button click
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

    // Check pause button click
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

    // Prevent interaction when paused
    if (this.isPaused) {
      return false;
    }

    if (this.sockManager.checkSockPileClick(x, y)) {
      this.shootSockFromPile();
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

    // Update exit button hover
    const exitButtonLeft = layout.exitButtonX - layout.exitButtonWidth / 2;
    const exitButtonTop = layout.exitButtonY - layout.exitButtonHeight / 2;
    this.exitButton.hovered =
      x >= exitButtonLeft &&
      x <= exitButtonLeft + layout.exitButtonWidth &&
      y >= exitButtonTop &&
      y <= exitButtonTop + layout.exitButtonHeight;

    // Update pause button hover
    const pauseButtonLeft = layout.pauseButtonX - layout.pauseButtonWidth / 2;
    const pauseButtonTop = layout.pauseButtonY - layout.pauseButtonHeight / 2;
    this.pauseButton.hovered =
      x >= pauseButtonLeft &&
      x <= pauseButtonLeft + layout.pauseButtonWidth &&
      y >= pauseButtonTop &&
      y <= pauseButtonTop + layout.pauseButtonHeight;

    // Don't allow dragging when paused
    if (this.isPaused) {
      return;
    }

    if (this.draggedSock) {
      this.draggedSock.x = x - this.dragOffset.x;
      this.draggedSock.y = y - this.dragOffset.y;
      this.draggedSock.vx = 0;
      this.draggedSock.vy = 0;

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

    if (this.draggedSock) {
      const snapDistance = this.game.getScaledValue(80);

      this.dropZones.forEach((zone) => {
        const distance = this.physics.getDropZoneDistance(
          this.draggedSock,
          zone
        );
        if (distance < snapDistance) {
          this.dropZoneHover = zone.id;
        }
      });
    }
  }

  onMouseUp() {
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

      // Break streak when dropping a sock without placing it
      this.matchStreak = 0;
      this.lastMatchTime = 0;
    }

    this.draggedSock = null;
    this.isDragging = false;
    this.dropZoneHover = null;
    this.dragHistory = [];
    this.checkForMatches();
  }

  shootSockFromPile() {
    const newSock = this.sockManager.shootSockFromPile();
    if (!newSock) return;

    // Mark sock pile as clicked
    if (!this.sockPileClicked) {
      this.sockPileClicked = true;
    }

    // Play pile click sound
    this.game.audioManager.playSound("pile-click", false, 0.4);
  }

  exitToLevelSelect() {
    console.log("🚪 Exiting match screen to level select");
    this.game.audioManager.playSound("click", false, 0.5);
    this.game.changeGameState("menu");
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
          // MATCH - track the sock type for sockball creation
          const matchedSockType = pairZones[0].sock.type;

          // Add this sockball type to the game's sockball queue
          this.game.addSockballToQueue(matchedSockType);

          // Play match sound
          this.game.audioManager.playSound("easter-egg-match", false, 0.5);

          // Play points gained sound with slight delay
          const timeoutId = setTimeout(() => {
            // Fix Bug #4: Guard clause to prevent execution after screen cleanup
            if (this.game.gameState !== 'matching') return;
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

          // Achievement: QUICK_HANDS (5 pairs in 15 seconds)
          if (this.matchCount === 5) {
            const timeElapsed = (currentTime - this.matchStartTime) / 1000;
            if (timeElapsed <= 15) {
              this.game.unlockAchievement("quick_hands");
            }
          }

          // Update streak (increment on each successful match)
          this.matchStreak++;
          this.lastMatchTime = currentTime;

          // Achievement: STREAK_KING (5x match streak)
          if (this.matchStreak >= 5) {
            this.game.unlockAchievement("streak_king");
          }

          // Screen shake effect
          this.createScreenShake();

          // Check if we've completed the required number of matches (stop timer immediately)
          // Count BOTH animated sockballs AND queued sockballs
          const level = GameConfig.LEVELS[this.game.currentLevel];
          const totalSockballs = this.game.sockBalls + this.game.getSockballQueueLength();
          if (level && totalSockballs >= level.sockPairs) {
            // Mark level as completed to stop the timer
            if (!this.levelCompleted) {
              this.levelCompleted = true;

              // Check if player finished within the time limit for time bonus
              const timeLimit = level.matchingTime;
              const timeElapsed = Math.floor(this.game.timeElapsed);
              const timeRemaining = timeLimit - timeElapsed;

              if (timeElapsed <= timeLimit) {
                // Set time bonus flag - this will double rent payment points on level end screen
                this.game.timeBonusEarned = true;
                console.log(`⏱️ Time bonus earned! Finished in ${timeElapsed}s (limit: ${timeLimit}s)`);
              }

              // Achievement: SPEEDY_MATCHER (complete with 30+ seconds remaining)
              if (timeRemaining >= 30) {
                this.game.unlockAchievement("speedy_matcher");
              }
            }
          }
        } else {
          // MISMATCH - new behavior
          this.handleMismatch(pairZones[0].sock, pairZones[1].sock);
          pairZones[0].sock = null;
          pairZones[1].sock = null;

          // Reset streak on mismatch
          this.matchStreak = 0;
          this.lastMatchTime = 0;
        }
      }
    }
  }

  handleMismatch(sock1, sock2) {
    // Play mismatch sound
    this.game.audioManager.playSound("easter-egg-mismatch", false, 0.6);

    // Create mismatch particle effects
    this.sockManager.createMismatchEffect(sock1, sock2);

    // Throw both socks in random directions with more force
    const throwForce = 12; // Stronger than normal throws

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
    // Update pulse timer for sock pile animation
    if (!this.sockPileClicked) {
      this.pulseTimer += deltaTime * 0.005; // Slow pulse
    }

    // Count UP (elapsed time) - only if pile has been clicked, not paused, and level not completed
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

    // Fix Bug #10: Add bounds checking for level access
    const level = GameConfig.LEVELS[this.game.currentLevel];
    if (!level) return; // Guard clause

    if (
      this.sockManager.getSockListLength() === 0 &&
      this.game.sockBalls >= level.sockPairs
    ) {
      // Mark level as completed to stop the timer
      this.levelCompleted = true;

      // Check if player finished within the time limit for time bonus
      const timeLimit = level.matchingTime;
      const timeElapsed = Math.floor(this.game.timeElapsed);
      const timeRemaining = timeLimit - timeElapsed;

      if (timeElapsed <= timeLimit) {
        // Set time bonus flag - this will double rent payment points on level end screen
        this.game.timeBonusEarned = true;
        console.log(`⏱️ Time bonus earned! Finished in ${timeElapsed}s (limit: ${timeLimit}s)`);
      }

      // Achievement: SPEEDY_MATCHER (complete with 30+ seconds remaining)
      if (timeRemaining >= 30) {
        this.game.unlockAchievement("speedy_matcher");
      }

      this.game.startThrowingPhase();
    }
  }

  onRender(ctx) {
    // Apply pulse effect to sock pile if not clicked yet
    if (!this.sockPileClicked) {
      this.sockManager.sockPile.pulseEffect = this.pulseTimer;
    } else {
      this.sockManager.sockPile.pulseEffect = 0;
    }

    this.sockManager.renderSockPile(ctx);
    this.renderDropZonePairBoxes(ctx);
    this.renderDropZones(ctx);
    this.sockManager.renderSocks(ctx);

    if (this.draggedSock) {
      this.renderDraggedSock(ctx);
    }

    this.sockManager.renderSockballAnimations(ctx);
    this.sockManager.renderParticleEffects(ctx);
    this.renderMatchScreenUI(ctx);

    // Render feedback manager for achievement toasts
    this.game.feedbackManager.render(ctx);
  }

  renderDropZonePairBoxes(ctx) {
    const layout = this.layoutCache;
    const lineWidth = this.game.getScaledValue(2);
    const dashLength = this.game.getScaledValue(5);
    const margin = this.game.getScaledValue(50);

    for (let pairId = 0; pairId < GameConfig.DROP_TARGET_PAIRS; pairId++) {
      const pairZones = this.dropZones.filter((zone) => zone.pairId === pairId);

      if (pairZones.length === 2) {
        const minX = Math.min(pairZones[0].x, pairZones[1].x) - margin;
        const maxX = Math.max(pairZones[0].x, pairZones[1].x) + margin;
        const minY = Math.min(pairZones[0].y, pairZones[1].y) - margin;
        const maxY = Math.max(pairZones[0].y, pairZones[1].y) + margin;

        ctx.save();
        ctx.strokeStyle = "rgba(200, 200, 200, 0.5)";
        ctx.lineWidth = lineWidth;
        ctx.setLineDash([dashLength, dashLength]);
        ctx.strokeRect(minX, minY, maxX - minX, maxY - minY);

        this.renderText(
          ctx,
          `Pair ${pairId + 1}`,
          (minX + maxX) / 2,
          minY - this.game.getScaledValue(10),
          {
            fontSize: layout.bodyFontSize,
            color: "rgba(255, 255, 255, 0.8)",
          }
        );

        ctx.restore();
      }
    }
  }

  renderDropZones(ctx) {
    const lineWidth = this.game.getScaledValue(2);
    const hoverLineWidth = this.game.getScaledValue(3);
    const shadowBlur = this.game.getScaledValue(15);

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
      ctx.strokeRect(
        zone.x - zone.width / 2,
        zone.y - zone.height / 2,
        zone.width,
        zone.height
      );

      if (this.dropZoneHover === index) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.1)";
        ctx.fillRect(
          zone.x - zone.width / 2,
          zone.y - zone.height / 2,
          zone.width,
          zone.height
        );
      }

      ctx.restore();
    });
  }

  renderDraggedSock(ctx) {
    if (!this.draggedSock) return;

    const lineWidth = this.game.getScaledValue(3);
    const shadowBlur = this.game.getScaledValue(15);
    const borderOffset = this.game.getScaledValue(2);

    ctx.save();
    ctx.shadowColor = "yellow";
    ctx.shadowBlur = shadowBlur;

    ctx.restore();
  }

  renderMatchScreenUI(ctx) {
    const layout = this.layoutCache;

    // Instructions beside sock pile with arrow
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

    // Draw arrow pointing at sock pile
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = this.game.getScaledValue(3);

    // Arrow line
    ctx.beginPath();
    ctx.moveTo(layout.instructionArrowX + this.game.getScaledValue(50), layout.instructionArrowY);
    ctx.lineTo(layout.instructionArrowX, layout.instructionArrowY);
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    ctx.moveTo(layout.instructionArrowX, layout.instructionArrowY);
    ctx.lineTo(layout.instructionArrowX + this.game.getScaledValue(15), layout.instructionArrowY - this.game.getScaledValue(8));
    ctx.lineTo(layout.instructionArrowX + this.game.getScaledValue(15), layout.instructionArrowY + this.game.getScaledValue(8));
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Render top bar
    this.renderTopBar(ctx);
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

    // Sockballs counter (left side)
    const sockBallsX = layout.sockBallsX;
    const sockBallsY = layout.sockBallsY;

    this.renderText(ctx, "🧦", sockBallsX - this.game.getScaledValue(25), sockBallsY, {
      fontSize: layout.headerFontSize,
      align: "center",
      baseline: "middle",
    });

    this.renderText(ctx, `${this.game.sockBalls}`, sockBallsX + this.game.getScaledValue(10), sockBallsY, {
      fontSize: layout.headerFontSize,
      align: "left",
      baseline: "middle",
      color: "rgba(255, 215, 0, 0.9)",
      weight: "bold",
    });

    // Time display
    const timeElapsed = Math.max(0, Math.floor(this.game.timeElapsed));
    const timeLimit = GameConfig.LEVELS[this.game.currentLevel].matchingTime;
    const isOverTime = timeElapsed > timeLimit;

    const timeColor = isOverTime
      ? "rgba(255, 68, 68, 0.9)"
      : timeElapsed > timeLimit * 0.8
      ? "rgba(255, 200, 68, 0.9)"
      : "rgba(255, 255, 255, 0.9)";

    this.renderText(ctx, "⏱️", layout.timeX - this.game.getScaledValue(50), layout.timeY, {
      fontSize: layout.headerFontSize,
      align: "center",
      baseline: "middle",
    });

    const timeText = `${timeElapsed}s / ${timeLimit}s`;
    this.renderText(ctx, timeText, layout.timeX, layout.timeY, {
      fontSize: layout.bodyFontSize,
      align: "left",
      baseline: "middle",
      color: timeColor,
      weight: "bold",
    });

    // Streak counter (only show if streak > 1)
    if (this.matchStreak > 1) {
      const streakText = `🔥 ${this.matchStreak}x STREAK`;
      this.renderText(ctx, streakText, layout.streakX, layout.streakY, {
        fontSize: layout.bodyFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 165, 0, 0.9)",
        weight: "bold",
      });
    }

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
  }

  renderBottomBarButton(ctx, x, y, width, height, text, isHovered, baseColor) {
    ctx.save();

    const buttonLeft = x - width / 2;
    const buttonTop = y - height / 2;
    const radius = this.game.getScaledValue(6);

    // Button background
    ctx.fillStyle = isHovered ? this.lightenColor(baseColor) : baseColor;
    ctx.strokeStyle = isHovered ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.4)";
    ctx.lineWidth = 2;

    // Rounded rectangle
    ctx.beginPath();
    ctx.moveTo(buttonLeft + radius, buttonTop);
    ctx.lineTo(buttonLeft + width - radius, buttonTop);
    ctx.arcTo(buttonLeft + width, buttonTop, buttonLeft + width, buttonTop + radius, radius);
    ctx.lineTo(buttonLeft + width, buttonTop + height - radius);
    ctx.arcTo(buttonLeft + width, buttonTop + height, buttonLeft + width - radius, buttonTop + height, radius);
    ctx.lineTo(buttonLeft + radius, buttonTop + height);
    ctx.arcTo(buttonLeft, buttonTop + height, buttonLeft, buttonTop + height - radius, radius);
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

    ctx.restore();
  }

  lightenColor(color) {
    // Simple color lightening - increase opacity or brightness
    return color.replace(/[\d.]+\)$/, (match) => {
      const opacity = parseFloat(match);
      return (Math.min(opacity + 0.1, 1.0)) + ")";
    });
  }
}
