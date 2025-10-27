// 📁 throwing-screen.js - Throwing Screen Implementation

class ThrowingScreen extends Screen {
  constructor(game) {
    super(game);

    // Martha management
    this.marthaManager = new MarthaManager(game);

    // Sockball management
    this.availableSockballs = 0;
    this.sockballProjectiles = [];
    this.lastThrowTime = 0;
    this.throwCooldownDuration = GameConfig.SOCKBALL_THROW_COOLDOWN;
    this.sockballsThrown = 0;

    // UI state
    this.showingMessage = false;
    this.messageText = "";
    this.messageType = "info";
    this.messageTimer = 0;

    // Game state
    this.gamePhase = "throwing";
    this.levelComplete = false;
    this.waitingForMartha = false;

    // Launch position
    this.launchPosition = {
      x: GameConfig.SOCKBALL_LAUNCH_POSITION.x,
      y: GameConfig.SOCKBALL_LAUNCH_POSITION.y,
    };

    // Trajectory preview
    this.showTrajectory = false;
    this.trajectoryPoints = [];
    this.mouseX = 0;
    this.mouseY = 0;

    // Keyboard aiming
    this.keyboardAimX = null;
    this.keyboardAimY = null;
    this.aimSpeed = 5;

    // Background image
    this.backgroundImage = null;

    // Next sockball preview
    this.nextSockballType = null;

    // Audio state tracking
    this.levelCompleteAudioPlayed = false;
    this.gameOverAudioPlayed = false;

    // Achievement tracking
    this.perfectThrowsThisLevel = 0;
    this.missedThrows = 0;
    this.consecutiveHits = 0; // Track consecutive hits on Martha

    // Exit button
    this.exitButton = {
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      hovered: false,
    };

    // Track active timeouts for cleanup
    this.activeTimeouts = [];
  }

  setup() {
    super.setup();

    // Clear any lingering timeouts from previous instances
    this.clearAllTimeouts();

    // Initialize game state
    this.availableSockballs = this.game.sockBalls;
    this.gamePhase = "throwing";
    this.levelComplete = false;
    this.waitingForMartha = false;
    this.sockballProjectiles = [];
    this.lastThrowTime = 0;
    this.sockballsThrown = 0;
    this.showingMessage = false;

    // Reset audio state
    this.levelCompleteAudioPlayed = false;
    this.gameOverAudioPlayed = false;

    // Reset achievement tracking
    this.perfectThrowsThisLevel = 0;
    this.missedThrows = 0;
    this.consecutiveHits = 0;

    // Setup Martha for current level
    const level = GameConfig.LEVELS[this.game.currentLevel];
    this.marthaManager.setup(level);

    // Scale launch position
    this.launchPosition.x = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.x
    );
    this.launchPosition.y = this.game.getScaledValue(
      GameConfig.SOCKBALL_LAUNCH_POSITION.y
    );

    // Phase 3.2 - Load level-specific background
    const backgroundFilename =
      GameConfig.LEVEL_BACKGROUNDS[this.game.currentLevel] || "throw-bg.png";
    this.backgroundImage = this.game.images[backgroundFilename];

    // Fallback to default if level-specific background not found
    if (!this.backgroundImage) {
      this.backgroundImage = this.game.images["throw-bg.png"];
    }

    // Set up next sockball type
    this.updateNextSockballType();

    // Phase 2.2 - Reset feedback manager for new level
    this.game.feedbackManager.reset();
    this.game.feedbackManager.onLevelStart();

    // Start throwing music
    console.log("🎵 Throwing screen setup - starting throwing music");
    this.game.audioManager.playMusic("throwing-music", true, 0.3);

    this.showMessage("Click to throw sockballs at Martha!", "info", 3000);
  }

  cleanup() {
    super.cleanup();

    // Clear all active timeouts
    this.clearAllTimeouts();

    this.sockballProjectiles = [];
    this.showingMessage = false;

    // Stop throwing music when leaving screen
    console.log("🎵 Throwing screen cleanup - stopping throwing music");
    this.game.audioManager.stopMusic();
  }

  clearAllTimeouts() {
    this.activeTimeouts.forEach((timeoutId) => clearTimeout(timeoutId));
    this.activeTimeouts = [];
  }

  updateNextSockballType() {
    // Get the next sockball type from the queue
    this.nextSockballType = this.game.getNextSockballType();
  }

  createLayoutCache() {
    const cache = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Top bar configuration
    const barHeight = this.game.getScaledValue(GameConfig.UI_BAR.height);
    const barY = 0; // Top of screen
    const barPadding = this.game.getScaledValue(GameConfig.UI_BAR.padding);

    // Top bar layout
    cache.barY = barY;
    cache.barHeight = barHeight;
    cache.barPadding = barPadding;

    // Top bar elements (left to right) - spaced to avoid overlapping
    cache.sockballCounterX = barPadding + this.game.getScaledValue(60);
    cache.sockballCounterY = barY + barHeight / 2;

    cache.marthaStatusX = barPadding + this.game.getScaledValue(200);
    cache.marthaStatusY = barY + barHeight / 2;

    cache.cooldownBarX = barPadding + this.game.getScaledValue(360);
    cache.cooldownBarY = barY + barHeight / 2;
    cache.cooldownBarWidth = this.game.getScaledValue(160);
    cache.cooldownBarHeight = this.game.getScaledValue(30);

    // Exit button on right side of top bar
    cache.exitButtonX = canvasWidth - this.game.getScaledValue(70);
    cache.exitButtonY = barY + barHeight / 2;
    cache.exitButtonWidth = this.game.getScaledValue(90);
    cache.exitButtonHeight = this.game.getScaledValue(50);

    return cache;
  }

  handleKeyDown(e) {
    // Initialize keyboard aim position at center if not set
    if (this.keyboardAimX === null || this.keyboardAimY === null) {
      this.keyboardAimX = this.game.getCanvasWidth() / 2;
      this.keyboardAimY = this.game.getCanvasHeight() / 2;
    }

    // Arrow keys to aim
    if (
      e.key === "ArrowLeft" ||
      e.key === "ArrowRight" ||
      e.key === "ArrowUp" ||
      e.key === "ArrowDown"
    ) {
      this.moveAim(e.key);
      e.preventDefault();
      return;
    }

    // Space or Enter to throw at keyboard aim position
    if (e.key === " " || e.key === "Enter") {
      if (this.canThrow() && this.keyboardAimX !== null) {
        this.throwSockball(this.keyboardAimX, this.keyboardAimY);
        e.preventDefault();
      }
      return;
    }
  }

  moveAim(key) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const moveSpeed = this.game.getScaledValue(this.aimSpeed);

    switch (key) {
      case "ArrowLeft":
        this.keyboardAimX = Math.max(0, this.keyboardAimX - moveSpeed);
        break;
      case "ArrowRight":
        this.keyboardAimX = Math.min(
          canvasWidth,
          this.keyboardAimX + moveSpeed
        );
        break;
      case "ArrowUp":
        this.keyboardAimY = Math.max(0, this.keyboardAimY - moveSpeed);
        break;
      case "ArrowDown":
        this.keyboardAimY = Math.min(
          canvasHeight,
          this.keyboardAimY + moveSpeed
        );
        break;
    }

    // Update trajectory preview with keyboard aim
    if (this.canThrow()) {
      this.updateTrajectoryPreview(this.keyboardAimX, this.keyboardAimY);
      this.showTrajectory = true;
    }
  }

  onMouseMove(x, y) {
    this.mouseX = x;
    this.mouseY = y;

    // Reset keyboard aim when mouse moves
    this.keyboardAimX = null;
    this.keyboardAimY = null;

    // Check exit button hover
    if (
      x >= this.exitButton.x &&
      x <= this.exitButton.x + this.exitButton.width &&
      y >= this.exitButton.y &&
      y <= this.exitButton.y + this.exitButton.height
    ) {
      this.exitButton.hovered = true;
    } else {
      this.exitButton.hovered = false;
    }

    if (this.canThrow()) {
      this.updateTrajectoryPreview(x, y);
      this.showTrajectory = true;
    } else {
      this.showTrajectory = false;
    }

    return false;
  }

  onClick(x, y) {
    // Check exit button click
    if (
      x >= this.exitButton.x &&
      x <= this.exitButton.x + this.exitButton.width &&
      y >= this.exitButton.y &&
      y <= this.exitButton.y + this.exitButton.height
    ) {
      this.exitToLevelSelect();
      return true;
    }

    if (this.canThrow()) {
      this.throwSockball(x, y);
      return true;
    }
    return false;
  }

  canThrow() {
    const currentTime = Date.now();
    const cooldownPassed =
      currentTime - this.lastThrowTime >= this.throwCooldownDuration;

    return (
      this.availableSockballs > 0 &&
      this.gamePhase === "throwing" &&
      cooldownPassed &&
      !this.levelComplete
    );
  }

  throwSockball(targetX, targetY) {
    if (!this.canThrow()) return;

    // Get the sockball type from the queue
    let sockballType = this.game.getNextSockballFromQueue(); // Fix Bug #2: Use 'let' for reassignment
    if (!sockballType) {
      console.warn("No sockball type available from queue, using random");
      sockballType = Math.floor(Math.random() * 6) + 1;
    }

    this.sockballsThrown++;
    this.availableSockballs--;
    this.lastThrowTime = Date.now();

    // Calculate throw velocity
    const deltaX = targetX - this.launchPosition.x;
    const deltaY = targetY - this.launchPosition.y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Prevent division by zero if click position equals launch position
    if (distance === 0) {
      console.warn("Cannot throw sockball: distance is zero");
      return;
    }

    const normalizedVelocity = GameConfig.SOCKBALL_THROW_SPEED / distance;

    // Create sockball projectile with the tracked type
    const sockball = {
      x: this.launchPosition.x,
      y: this.launchPosition.y,
      vx: deltaX * normalizedVelocity,
      vy: deltaY * normalizedVelocity,
      size: GameConfig.SOCKBALL_SIZE,
      type: sockballType, // Use the tracked type instead of random
      rotation: 0,
      rotationSpeed: 0.2,
      gravity: GameConfig.GRAVITY,
      bounced: false,
      active: true,
      // Track distance to Martha for catch zone detection
      previousDistanceToMartha: Infinity,
      enteredCatchZone: false,
      bestZoneEntered: null, // Track the best quality zone entered
    };

    this.sockballProjectiles.push(sockball);
    this.showTrajectory = false;

    // Update next sockball type for preview
    this.updateNextSockballType();
  }

  updateTrajectoryPreview(targetX, targetY) {
    this.trajectoryPoints = [];

    // Simulate trajectory
    const steps = 20;
    let x = this.launchPosition.x;
    let y = this.launchPosition.y;

    const deltaX = targetX - x;
    const deltaY = targetY - y;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Prevent division by zero if target position equals launch position
    if (distance === 0) {
      return;
    }

    const normalizedVelocity = GameConfig.SOCKBALL_THROW_SPEED / distance;

    let vx = deltaX * normalizedVelocity;
    let vy = deltaY * normalizedVelocity;

    for (let i = 0; i < steps; i++) {
      this.trajectoryPoints.push({ x, y });

      x += vx;
      y += vy;
      vy += GameConfig.GRAVITY;

      if (
        y > this.game.getCanvasHeight() ||
        x < 0 ||
        x > this.game.getCanvasWidth()
      ) {
        break;
      }
    }
  }

  updateSockballs(deltaTime) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const deltaScale = deltaTime / 16.67;

    this.sockballProjectiles = this.sockballProjectiles.filter((sockball) => {
      if (!sockball.active) return false;

      // Update position
      sockball.x += sockball.vx * deltaScale;
      sockball.y += sockball.vy * deltaScale;
      sockball.vy += sockball.gravity * deltaScale;
      sockball.rotation += sockball.rotationSpeed * deltaScale;

      // Bounce off walls and top
      if (
        sockball.x <= sockball.size / 2 ||
        sockball.x >= canvasWidth - sockball.size / 2
      ) {
        sockball.vx *= -GameConfig.BOUNCE_DAMPING;
        sockball.x = Math.max(
          sockball.size / 2,
          Math.min(canvasWidth - sockball.size / 2, sockball.x)
        );
      }

      if (sockball.y <= sockball.size / 2) {
        sockball.vy *= -GameConfig.BOUNCE_DAMPING;
        sockball.y = sockball.size / 2;
        sockball.bounced = true;
      }

      // Remove if falls off bottom (counts as a miss)
      if (sockball.y > canvasHeight + sockball.size) {
        this.missedThrows++;
        this.consecutiveHits = 0; // Reset consecutive hits on miss
        return false;
      }

      // Check collision with Martha using zone-based catching
      // Ball must enter a zone and then start moving away before being caught
      // Allow bonus hits when Martha is exiting/entering - these give bonus points!
      const isBonusHit =
        this.marthaManager.isExiting || this.marthaManager.isEntering;

      const marthaCenterX = this.marthaManager.x + this.marthaManager.width / 2;
      const marthaCenterY =
        this.marthaManager.y + this.marthaManager.height / 2;
      const dx = sockball.x - marthaCenterX;
      const dy = sockball.y - marthaCenterY;
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Check if in catch zone
      const catchRadius =
        (this.marthaManager.width / 2) *
        GameConfig.CATCH_MECHANICS.CATCH_RADIUS_MULTIPLIER;
      const sockballRadius = GameConfig.SOCKBALL_SIZE / 2;
      const inCatchZone = currentDistance <= catchRadius + sockballRadius;

      if (inCatchZone) {
        sockball.enteredCatchZone = true;

        // Determine current zone quality
        const maxDistance = this.marthaManager.width / 2;
        const normalizedDistance = currentDistance / maxDistance;
        let currentZone = null;

        if (
          normalizedDistance <=
          GameConfig.CATCH_MECHANICS.PERFECT_CATCH_THRESHOLD
        ) {
          currentZone = "PERFECT";
        } else if (
          normalizedDistance <= GameConfig.CATCH_MECHANICS.GOOD_CATCH_THRESHOLD
        ) {
          currentZone = "GOOD";
        } else {
          currentZone = "REGULAR";
        }

        // Track the best zone entered (PERFECT > GOOD > REGULAR)
        if (
          !sockball.bestZoneEntered ||
          currentZone === "PERFECT" ||
          (currentZone === "GOOD" && sockball.bestZoneEntered === "REGULAR")
        ) {
          sockball.bestZoneEntered = currentZone;
        }

        // Check if ball is moving away from center (distance increasing)
        const movingAway = currentDistance > sockball.previousDistanceToMartha;

        // Catch the ball if it's moving away and has entered a zone
        if (movingAway && sockball.bestZoneEntered) {
          // Pass bonus flag to Martha manager if she's exiting/entering
          const catchQuality = this.marthaManager.hitBySockball(
            sockball,
            sockball.bestZoneEntered,
            isBonusHit
          );
          if (catchQuality) {
            // Track catch quality counts for score screen
            if (
              this.game.catchQualityCounts &&
              this.game.catchQualityCounts[catchQuality] !== undefined
            ) {
              this.game.catchQualityCounts[catchQuality]++;
            }

            this.game.audioManager.playSound("particle-burst", false, 0.4);

            this.game.audioManager.playSound("points-gained", false, 0.3);

            this.consecutiveHits++;

            if (isBonusHit) {
              // Bonus hits get special message but use normal quality feedback
              this.showMessage("BONUS CATCH!", "success", 1500);
              if (catchQuality === "PERFECT") {
                this.game.feedbackManager.onPerfectCatch();
                this.game.consecutivePerfectThrows++;
                this.game.consecutiveMisses = 0;

                // Achievement: SOCK_SNIPER (3 perfect throws in a row)
                if (this.game.consecutivePerfectThrows >= 3) {
                  this.game.unlockAchievement("sock_sniper");
                }
              } else if (catchQuality === "GOOD") {
                this.game.feedbackManager.onGoodCatch();
                this.game.consecutivePerfectThrows = 0;
              } else {
                this.game.feedbackManager.onRegularCatch();
                this.game.consecutivePerfectThrows = 0;
              }
            } else if (catchQuality === "PERFECT") {
              this.game.feedbackManager.onPerfectCatch();
              this.perfectThrowsThisLevel++;

              // Achievement: PERFECT_THROW
              this.game.unlockAchievement("perfect_throw");

              // Track consecutive perfect throws for Sock Sniper
              this.game.consecutivePerfectThrows++;
              this.game.consecutiveMisses = 0;

              // Achievement: SOCK_SNIPER (3 perfect throws in a row)
              if (this.game.consecutivePerfectThrows >= 3) {
                this.game.unlockAchievement("sock_sniper");
              }
            } else if (catchQuality === "GOOD") {
              this.game.feedbackManager.onGoodCatch();
              this.game.consecutivePerfectThrows = 0; // Reset perfect streak
            } else {
              this.game.feedbackManager.onRegularCatch();
              this.game.consecutivePerfectThrows = 0; // Reset perfect streak
            }

            if (this.consecutiveHits >= 10) {
              this.game.unlockAchievement("deadeye");
            }

            sockball.active = false;
            return false;
          }
        }

        sockball.previousDistanceToMartha = currentDistance;
      } else if (sockball.enteredCatchZone) {
        // Ball left catch zone without being caught - it's a miss
        this.missedThrows++;
        this.consecutiveHits = 0;

        // Track consecutive misses for Butterfingers
        this.game.consecutiveMisses++;
        this.game.consecutivePerfectThrows = 0;

        // Achievement: BUTTERFINGERS (miss 5 throws in a row)
        if (this.game.consecutiveMisses >= 5) {
          this.game.unlockAchievement("butterfingers");
        }

        return false;
      }

      return true;
    });
  }

  checkGameEnd() {
    const hasActiveSockballs = this.sockballProjectiles.length > 0;
    const hasAvailableSockballs = this.availableSockballs > 0;

    if (this.marthaManager.hasCollectedEnoughSockballs()) {
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage("Martha got her rent money!", "success", 2000);

        // Phase 2.2 - Trigger level complete feedback
        this.game.feedbackManager.onLevelComplete();

        // Achievement: MARTHAS_FAVORITE (complete level without missing any throws)
        if (this.missedThrows === 0 && this.sockballsThrown > 0) {
          this.game.unlockAchievement("marthas_favorite");
        }
      }

      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";

        // Fix Bug #5: Set flag BEFORE scheduling timeout to prevent race condition
        if (!this.levelCompleteAudioPlayed) {
          this.levelCompleteAudioPlayed = true; // Set flag first
          this.game.audioManager.fadeOutMusic(1000);
          const audioTimeoutId = setTimeout(() => {
            this.game.audioManager.playMusic("victory-music", false, 0.4);
            this.game.audioManager.playSound("level-complete", false, 0.6);
          }, 1000);
          this.activeTimeouts.push(audioTimeoutId);
        }

        const completeLevelTimeoutId = setTimeout(
          () => this.game.completeLevel(),
          1000
        );
        this.activeTimeouts.push(completeLevelTimeoutId);
      }
    } else if (!hasActiveSockballs && !hasAvailableSockballs) {
      if (!this.waitingForMartha) {
        this.waitingForMartha = true;
        this.marthaManager.startExit();
        this.showMessage(
          "Martha didn't get enough rent money...",
          "warning",
          2000
        );
      }

      if (!this.marthaManager.onScreen) {
        this.levelComplete = true;
        this.gamePhase = "complete";

        // Achievement: EVICTION_NOTICE (lose a level)
        this.game.unlockAchievement("eviction_notice");

        // Fix Bug #5: Set flag BEFORE scheduling timeout to prevent race condition
        if (!this.gameOverAudioPlayed) {
          this.gameOverAudioPlayed = true; // Set flag first
          this.game.audioManager.fadeOutMusic(1000);
          const audioTimeoutId = setTimeout(() => {
            this.game.audioManager.playMusic("defeat-music", false, 0.4);
            this.game.audioManager.playSound("game-over", false, 0.6);
          }, 1000);
          this.activeTimeouts.push(audioTimeoutId);
        }

        const completeLevelTimeoutId = setTimeout(
          () => this.game.completeLevel(),
          1000
        );
        this.activeTimeouts.push(completeLevelTimeoutId);
      }
    } else if (
      !this.marthaManager.onScreen &&
      this.marthaManager.needsMoreSockballs() &&
      (hasActiveSockballs || hasAvailableSockballs)
    ) {
      this.waitingForMartha = false;
      this.marthaManager.startEnter();
      this.showMessage("Martha is back for more sockballs!", "info", 2000);
    }
  }

  showMessage(text, type = "info", duration = 3000) {
    this.showingMessage = true;
    this.messageText = text;
    this.messageType = type;
    this.messageTimer = duration;
  }

  exitToLevelSelect() {
    console.log("🚪 Exiting throwing screen to level select");
    this.game.audioManager.playSound("click", false, 0.5);
    this.game.changeGameState("menu");
  }

  onUpdate(deltaTime) {
    // Fix Bug #6: Update parent class timers
    this.updateAnimationTimers(deltaTime);

    this.marthaManager.update(deltaTime);
    this.updateSockballs(deltaTime);
    this.checkGameEnd();

    // Phase 2.2 - Update feedback manager
    this.game.feedbackManager.update(deltaTime);
    this.game.feedbackManager.updateMarthaPosition(
      this.marthaManager.x,
      this.marthaManager.y,
      this.marthaManager.width,
      this.marthaManager.onScreen
    );

    if (this.showingMessage) {
      this.messageTimer -= deltaTime;
      if (this.messageTimer <= 0) {
        this.showingMessage = false;
      }
    }
  }

  onRender(ctx) {
    // Render background first
    this.renderBackground(ctx);

    this.marthaManager.render(ctx);

    this.sockballProjectiles.forEach((sockball) => {
      this.renderSockball(ctx, sockball);
    });

    if (this.showTrajectory && this.trajectoryPoints.length > 0) {
      this.renderTrajectory(ctx);
    }

    this.renderLaunchIndicator(ctx);
    this.renderUI(ctx);

    // Phase 2.2 - Render feedback manager (dialogue and celebrations)
    this.game.feedbackManager.render(ctx);

    if (this.showingMessage) {
      this.renderMessage(ctx);
    }
  }

  renderBackground(ctx) {
    if (this.backgroundImage) {
      // Scale background to fill canvas while maintaining aspect ratio
      const canvasAspect =
        this.game.getCanvasWidth() / this.game.getCanvasHeight();
      const imageAspect =
        this.backgroundImage.width / this.backgroundImage.height;

      let drawWidth, drawHeight, drawX, drawY;

      if (canvasAspect > imageAspect) {
        // Canvas is wider than image
        drawWidth = this.game.getCanvasWidth();
        drawHeight = drawWidth / imageAspect;
        drawX = 0;
        drawY = (this.game.getCanvasHeight() - drawHeight) / 2;
      } else {
        // Canvas is taller than image
        drawHeight = this.game.getCanvasHeight();
        drawWidth = drawHeight * imageAspect;
        drawX = (this.game.getCanvasWidth() - drawWidth) / 2;
        drawY = 0;
      }

      ctx.drawImage(this.backgroundImage, drawX, drawY, drawWidth, drawHeight);
    } else {
      // Fallback gradient background
      const gradient = ctx.createLinearGradient(
        0,
        0,
        0,
        this.game.getCanvasHeight()
      );
      gradient.addColorStop(0, "#1a1a2e");
      gradient.addColorStop(1, "#16213e");
      ctx.fillStyle = gradient;
      ctx.fillRect(
        0,
        0,
        this.game.getCanvasWidth(),
        this.game.getCanvasHeight()
      );
    }
  }

  renderSockball(ctx, sockball) {
    ctx.save();
    ctx.translate(sockball.x, sockball.y);
    ctx.rotate(sockball.rotation);

    const sockballImage = this.game.images[`sockball${sockball.type}.png`];
    if (sockballImage) {
      ctx.drawImage(
        sockballImage,
        -sockball.size / 2,
        -sockball.size / 2,
        sockball.size,
        sockball.size
      );
    } else {
      ctx.fillStyle = `hsl(${sockball.type * 60}, 70%, 50%)`;
      ctx.beginPath();
      ctx.arc(0, 0, sockball.size / 2, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  renderTrajectory(ctx) {
    if (this.trajectoryPoints.length < 2) return;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.setLineDash([this.game.getScaledValue(8), this.game.getScaledValue(4)]);

    ctx.beginPath();
    ctx.moveTo(this.trajectoryPoints[0].x, this.trajectoryPoints[0].y);

    for (let i = 1; i < this.trajectoryPoints.length; i++) {
      ctx.lineTo(this.trajectoryPoints[i].x, this.trajectoryPoints[i].y);
    }

    ctx.stroke();
    ctx.restore();
  }

  renderLaunchIndicator(ctx) {
    ctx.save();

    const pulseScale = this.getPulseScale(0.2);
    const radius = this.game.getScaledValue(20) * pulseScale;

    // Outer glow
    ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
    ctx.beginPath();
    ctx.arc(
      this.launchPosition.x,
      this.launchPosition.y,
      radius * 1.5,
      0,
      Math.PI * 2
    );
    ctx.fill();

    // Inner circle
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.strokeStyle = "rgba(255, 255, 255, 0.9)";
    ctx.lineWidth = this.game.getScaledValue(3);

    ctx.beginPath();
    ctx.arc(
      this.launchPosition.x,
      this.launchPosition.y,
      radius,
      0,
      Math.PI * 2
    );
    ctx.fill();
    ctx.stroke();

    // Render the next sockball type in the launch indicator
    if (this.nextSockballType) {
      const sockballImage =
        this.game.images[`sockball${this.nextSockballType}.png`];
      if (sockballImage) {
        const sockballSize = this.game.getScaledValue(16) * pulseScale;
        ctx.drawImage(
          sockballImage,
          this.launchPosition.x - sockballSize / 2,
          this.launchPosition.y - sockballSize / 2,
          sockballSize,
          sockballSize
        );
      } else {
        // Fallback colored circle
        ctx.fillStyle = `hsl(${this.nextSockballType * 60}, 70%, 50%)`;
        ctx.beginPath();
        ctx.arc(
          this.launchPosition.x,
          this.launchPosition.y,
          radius * 0.4,
          0,
          Math.PI * 2
        );
        ctx.fill();
      }
    }

    ctx.restore();
  }

  renderUI(ctx) {
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
    // Draw sock icon
    if (this.game.images["icon-sock.png"]) {
      const sockIcon = this.game.images["icon-sock.png"];
      const sockIconHeight = this.game.getScaledValue(40);
      const sockIconWidth = sockIconHeight * (sockIcon.width / sockIcon.height);
      ctx.drawImage(
        sockIcon,
        layout.sockballCounterX - this.game.getScaledValue(25) - sockIconWidth / 2,
        layout.sockballCounterY - sockIconHeight / 2,
        sockIconWidth,
        sockIconHeight
      );
    }

    this.renderText(
      ctx,
      `${this.availableSockballs}`,
      layout.sockballCounterX + this.game.getScaledValue(10),
      layout.sockballCounterY,
      {
        fontSize: layout.headerFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 215, 0, 0.9)",
        weight: "bold",
      }
    );

    // Martha status
    this.renderText(
      ctx,
      "Martha:",
      layout.marthaStatusX - this.game.getScaledValue(60),
      layout.marthaStatusY,
      {
        fontSize: layout.bodyFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(255, 255, 255, 0.9)",
      }
    );

    const marthaText = `${this.marthaManager.collectedSockballs}/${this.marthaManager.sockballsWanted}`;
    this.renderText(
      ctx,
      marthaText,
      layout.marthaStatusX + this.game.getScaledValue(35),
      layout.marthaStatusY,
      {
        fontSize: layout.headerFontSize,
        align: "left",
        baseline: "middle",
        color: "rgba(76, 175, 80, 0.9)",
        weight: "bold",
      }
    );

    // Throw cooldown bar
    const currentTime = Date.now();
    const timeSinceLastThrow = currentTime - this.lastThrowTime;
    const cooldownProgress = Math.min(
      timeSinceLastThrow / this.throwCooldownDuration,
      1
    );

    this.renderProgressBar(
      ctx,
      layout.cooldownBarX,
      layout.cooldownBarY - layout.cooldownBarHeight / 2,
      layout.cooldownBarWidth,
      layout.cooldownBarHeight,
      cooldownProgress,
      {
        fillColor: cooldownProgress >= 1 ? "#4caf50" : "#ffc107",
        glow: cooldownProgress >= 1,
      }
    );

    this.renderText(
      ctx,
      cooldownProgress >= 1 ? "READY!" : "Recharging...",
      layout.cooldownBarX + layout.cooldownBarWidth / 2,
      layout.cooldownBarY,
      {
        fontSize: this.layoutCache.smallFontSize,
        align: "center",
        baseline: "middle",
        color: "rgba(255, 255, 255, 0.9)",
        weight: "bold",
      }
    );

    // Exit button (reusing Match Screen button renderer)
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

    // Update exit button bounds for click detection
    const exitButtonLeft = layout.exitButtonX - layout.exitButtonWidth / 2;
    const exitButtonTop = layout.exitButtonY - layout.exitButtonHeight / 2;
    this.exitButton.x = exitButtonLeft;
    this.exitButton.y = exitButtonTop;
    this.exitButton.width = layout.exitButtonWidth;
    this.exitButton.height = layout.exitButtonHeight;
  }

  renderBottomBarButton(ctx, x, y, width, height, text, isHovered, baseColor) {
    ctx.save();

    const buttonLeft = x - width / 2;
    const buttonTop = y - height / 2;

    // Check if this is the exit button and we have the image
    const isExitButton = text === "Exit";
    const buttonImage = isExitButton ? this.game.images["btn-exit.png"] : null;

    if (buttonImage) {
      // Use button image
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = width;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > height) {
        imgHeight = height;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = buttonLeft + (width - imgWidth) / 2;
      const imgY = buttonTop + (height - imgHeight) / 2;

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

  lightenColor(color) {
    // Simple color lightening - increase opacity or brightness
    return color.replace(/[\d.]+\)$/, (match) => {
      const opacity = parseFloat(match);
      return Math.min(opacity + 0.1, 1.0) + ")";
    });
  }

  renderMessage(ctx) {
    const centerX = this.layoutCache.centerX;
    const centerY = this.layoutCache.centerY - this.game.getScaledValue(100);

    let panelStyle = "primary";
    if (this.messageType === "success") panelStyle = "success";
    else if (this.messageType === "warning") panelStyle = "warning";

    const textWidth = ctx.measureText(this.messageText).width;
    const panelWidth = (textWidth + this.game.getScaledValue(60)) * 2.5; // Increased by 2.5x
    const panelHeight = this.game.getScaledValue(60);

    this.renderPanel(
      ctx,
      centerX - panelWidth / 2,
      centerY - panelHeight / 2,
      panelWidth,
      panelHeight,
      panelStyle
    );

    this.renderText(ctx, this.messageText, centerX, centerY, {
      fontSize: this.layoutCache.bodyFontSize,
      align: "center",
      baseline: "middle",
      weight: "bold",
    });
  }
}
