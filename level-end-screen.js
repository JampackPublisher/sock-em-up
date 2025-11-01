class LevelEndScreen extends Screen {
  constructor(game) {
    super(game);
    this.resetScores();
    this.initializeButton();
    this.marthaImage = null;
    this.showRentDue = false;
    this.particles = [];
    this.starParticles = [];
    this.titleBounceTimer = 0;
    this.marthaScaleTimer = 0;
    this.showStars = false;

    // Animation state for sockballs spritesheet
    this.marthaAnimationFrame = 0;
    this.marthaAnimationTimer = 0;
    this.useSpritesheet = false;
  }

  resetScores() {
    this.sockballsPaidDisplay = 0;
    this.sockballsLeftoverDisplay = 0;
    this.rentPenaltyDisplay = 0;
    this.timeBonusDisplay = 0;
    this.totalScoreDisplay = 0;
    this.perfectCatchesDisplay = 0;
    this.goodCatchesDisplay = 0;
    this.regularCatchesDisplay = 0;
    this.scoreAnimationTimer = 0;
    this.currentStageIndex = 0;
    this.scoreStages = [];
    this.scoreLineAnimations = [0, 0, 0, 0, 0, 0, 0, 0]; // Animation timers for each line
    this.scoreLineVisible = [
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

  initializeButton() {
    this.continueButton = {
      x: 0,
      y: 0,
      width: 200,
      height: 50,
      hovered: false,
      pressed: false,
    };
  }

  createLayoutCache() {
    const baseLayout = super.createLayoutCache();
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const marthaImageSize = this.game.getScaledValue(150); // Increased for better visibility
    const marthaToStatsMargin = this.game.getScaledValue(30);
    const scoreLineHeight = this.game.getScaledValue(35);

    const scoreStartY =
      canvasHeight / 2 -
      this.game.getScaledValue(160) + // Adjusted to match new marthaImageY
      marthaImageSize +
      marthaToStatsMargin;

    // Note: Button Y position is calculated dynamically in renderScoreLines()
    // based on actual visible lines, since score data isn't available during layout cache creation

    return {
      ...baseLayout,
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      containerWidth: this.game.getScaledValue(600),
      containerHeight: this.game.getScaledValue(550),
      containerX: canvasWidth / 2 - this.game.getScaledValue(300),
      containerY: canvasHeight / 2 - this.game.getScaledValue(275),
      titleY: canvasHeight / 2 - this.game.getScaledValue(200),
      marthaImageY: canvasHeight / 2 - this.game.getScaledValue(160), // Moved up by 30
      marthaImageSize: marthaImageSize,
      scoreStartY: scoreStartY,
      scoreLineHeight: scoreLineHeight,
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),
    };
  }

  setup() {
    super.setup();
    this.resetScores();
    this.calculateScoresAndRent();

    // Play appropriate music based on win/lose
    if (this.rentPenalty === 0) {
      this.game.audioManager.playMusic("victory-music", false, 0.4);
      // Unlock victory music in audio player
      if (this.game.levelSelect && this.game.levelSelect.audioPlayer) {
        this.game.levelSelect.audioPlayer.unlockTrack("victory-music");
      }
    } else {
      this.game.audioManager.playMusic("defeat-music", false, 0.4);
      // Unlock defeat music in audio player
      if (this.game.levelSelect && this.game.levelSelect.audioPlayer) {
        this.game.levelSelect.audioPlayer.unlockTrack("defeat-music");
      }
    }

    if (this.rentPenalty === 0) {
      this.game.completedLevels[this.game.currentLevel] = true;
      this.game.markLevelCompleted(
        this.game.currentLevel,
        this.game.currentDifficulty
      );

      // Track consecutive level wins for streak achievements
      if (!this.game.consecutiveLevelWins) {
        this.game.consecutiveLevelWins = 0;
      }
      this.game.consecutiveLevelWins++;

      // Achievement: BABY_SPEED_RUN - Win 5 levels in a row
      if (
        this.game.consecutiveLevelWins >=
        GameConfig.ACHIEVEMENTS.BABY_SPEED_RUN.threshold
      ) {
        this.game.unlockAchievement("baby_speed_run");
      }

      // Achievement: SPEED_RUN - Win 9 levels in a row
      if (
        this.game.consecutiveLevelWins >=
        GameConfig.ACHIEVEMENTS.SPEED_RUN.threshold
      ) {
        this.game.unlockAchievement("speed_run");
      }

      // Achievement: SPEED_ROYALTY - Win 20 levels in a row
      if (
        this.game.consecutiveLevelWins >=
        GameConfig.ACHIEVEMENTS.SPEED_ROYALTY.threshold
      ) {
        this.game.unlockAchievement("speed_royalty");
      }

      // Achievement: TRIAL_BY_FIRE - Complete level 9 on +2 difficulty or higher
      if (this.game.currentLevel === 8 && this.game.currentDifficulty >= 2) {
        this.game.unlockAchievement("trial_by_fire");
      }

      // Track total levels played for GRIND_MASTER
      if (!this.game.totalLevelsPlayed) {
        this.game.totalLevelsPlayed = 0;
      }
      this.game.totalLevelsPlayed++;

      // Achievement: GRIND_MASTER - Complete 100 total levels
      if (this.game.totalLevelsPlayed >= 100) {
        this.game.unlockAchievement("grind_master");
      }

      // Achievement: SOCK_MASTER - Complete all 9 base game levels (difficulty 0)
      const allBaseLevelsCompleted =
        this.game.completedLevelsByDifficulty[0] &&
        this.game.completedLevelsByDifficulty[0].every((completed) => completed);
      if (allBaseLevelsCompleted) {
        this.game.unlockAchievement("sock_master");
      }

      const hasCompletedNewGamePlus = Object.keys(
        this.game.completedLevelsByDifficulty
      ).some((difficulty) => {
        const diff = parseInt(difficulty);
        if (diff >= 1 && this.game.completedLevelsByDifficulty[diff]) {
          return this.game.completedLevelsByDifficulty[diff].some(
            (completed) => completed
          );
        }
        return false;
      });
      if (hasCompletedNewGamePlus) {
        this.game.unlockAchievement("new_game_plus_hero");
      }

      if (this.game.currentDifficulty >= 4) {
        const allLevelsCompletedOnPlus4 = GameConfig.LEVELS.every(
          (_, index) => {
            return (
              this.game.completedLevelsByDifficulty[4] &&
              this.game.completedLevelsByDifficulty[4][index]
            );
          }
        );
        if (allLevelsCompletedOnPlus4) {
          this.game.unlockAchievement("ultimate_champion");
        }
      }
    } else {
      // Reset consecutive wins on a loss
      this.game.consecutiveLevelWins = 0;

      // Track total losses for DISASTER_PRONE
      if (!this.game.totalLevelLosses) {
        this.game.totalLevelLosses = 0;
      }
      this.game.totalLevelLosses++;

      // Achievement: DISASTER_PRONE - Lose 10 times total
      if (this.game.totalLevelLosses >= 10) {
        this.game.unlockAchievement("disaster_prone");
      }

      // Track total levels played (even losses count)
      if (!this.game.totalLevelsPlayed) {
        this.game.totalLevelsPlayed = 0;
      }
      this.game.totalLevelsPlayed++;

      // Achievement: GRIND_MASTER - Complete 100 total levels
      if (this.game.totalLevelsPlayed >= 100) {
        this.game.unlockAchievement("grind_master");
      }
    }

    this.showingNewGamePlusUnlock = this.game.showNewGamePlusNotification;
    this.newGamePlusUnlockedLevel = this.game.newGamePlusUnlockedLevel; // Store which NG+ level was unlocked
    if (this.showingNewGamePlusUnlock) {
      this.game.showNewGamePlusNotification = false;
      const difficultyIndex = this.game.newGamePlusUnlockedLevel - 1;
      this.game.hasShownNewGamePlusBanner[difficultyIndex] = true;
      this.game.saveGameData();
    }

    this.setupScoreAnimation();
    this.onResize();
    this.initializeParticles();
    this.titleBounceTimer = 0;
    this.marthaScaleTimer = 0;
  }

  cleanup() {
    super.cleanup();

    this.game.audioManager.stopMusic();
  }

  calculateScoresAndRent() {
    const marthaWanted = this.game.throwingScreen.marthaManager.sockballsWanted;
    const marthaGot = this.game.throwingScreen.marthaManager.collectedSockballs;
    const totalSockballsCreated = this.game.sockBalls;
    const sockballsThrown = this.game.throwingScreen.sockballsThrown || 0;

    this.sockballsPaid = marthaGot;
    // Use the sockball queue length saved when the level ended
    // (this is saved in throwing-screen before the queue gets cleared)
    this.sockballsLeftover = this.game.sockballsLeftoverAtEnd || 0;
    this.rentPenalty = Math.max(0, marthaWanted - marthaGot);

    // Catch quality counts
    this.perfectCatches = this.game.catchQualityCounts?.PERFECT || 0;
    this.goodCatches = this.game.catchQualityCounts?.GOOD || 0;
    this.regularCatches = this.game.catchQualityCounts?.REGULAR || 0;

    // Catch quality bonuses (these replace the base 5 points per sockball)
    // Points scale with difficulty for NEW GAME+
    const difficulty = this.game.currentDifficulty || 0;
    this.perfectCatchesPoints = this.perfectCatches * GameConfig.getCatchQualityPoints('perfect', difficulty);
    this.goodCatchesPoints = this.goodCatches * GameConfig.getCatchQualityPoints('good', difficulty);
    this.regularCatchesPoints = this.regularCatches * GameConfig.getCatchQualityPoints('regular', difficulty);

    // Calculate base points for sockballs that were caught
    // Total caught sockballs = sum of all catch qualities
    const totalCaughtSockballs =
      this.perfectCatches + this.goodCatches + this.regularCatches;
    const totalCatchQualityPoints =
      this.perfectCatchesPoints +
      this.goodCatchesPoints +
      this.regularCatchesPoints;

    // For sockballs paid but not caught (missed/failed), give base points each (scaled by difficulty)
    const uncaughtPaidSockballs = Math.max(
      0,
      this.sockballsPaid - totalCaughtSockballs
    );
    this.sockballsPaidPoints = uncaughtPaidSockballs * GameConfig.getCatchQualityPoints('regular', difficulty);

    // Time bonus: double the total rent payment points (catch quality + base) if earned
    // Only award time bonus if the player won (no rent penalty)
    this.timeBonusPoints = 0;
    if (this.game.timeBonusEarned && this.sockballsPaid > 0 && this.rentPenalty === 0) {
      this.timeBonusPoints = totalCatchQualityPoints + this.sockballsPaidPoints;
    }

    // Leftover sockballs bonus increases with difficulty (20, 30, 40, 50 for NG+ 1-4)
    this.sockballsLeftoverBonus = difficulty === 0 ? 10 : 10 + (difficulty * 10);
    this.sockballsLeftoverPoints = this.sockballsLeftover * this.sockballsLeftoverBonus;

    // Rent penalty increases with difficulty (20, 30, 40, 50 for NG+ 1-4)
    this.rentPenaltyPerSockball = difficulty === 0 ? 10 : 10 + (difficulty * 10);
    this.rentPenaltyPoints = this.rentPenalty * -this.rentPenaltyPerSockball;

    // Calculate the raw total (can be negative)
    const rawTotal =
      this.sockballsPaidPoints +
      this.perfectCatchesPoints +
      this.goodCatchesPoints +
      this.regularCatchesPoints +
      this.timeBonusPoints +
      this.sockballsLeftoverPoints +
      this.rentPenaltyPoints;

    // Store both the raw total for display and the capped total for points
    this.totalScoreRaw = rawTotal;
    this.totalScore = Math.max(0, rawTotal);

    this.showRentDue = this.rentPenalty > 0;
    this.showStars = !this.showRentDue; // Show stars only on success

    // Use spritesheets for both win and lose states
    this.useSpritesheet = true;
    this.marthaAnimationFrame = 0;
    this.marthaAnimationTimer = 0;

    if (this.showRentDue) {
      this.marthaImage = this.game.images["martha-losing-spritesheet.png"];
    } else {
      // Choose winning Martha spritesheet based on difficulty
      const difficulty = this.game.currentDifficulty || 0;

      if (difficulty >= 4) {
        // NEW GAME+ 4: Randomly choose from all winning spritesheets
        const winningSpritesheets = [
          "martha-sockballs-spritesheet.png",
          "martha-rumble-spritesheet.png",
          "martha-fatsop-spritesheet.png",
        ];
        const randomIndex = Math.floor(Math.random() * winningSpritesheets.length);
        this.marthaImage = this.game.images[winningSpritesheets[randomIndex]];
      } else if (difficulty >= 3) {
        // NEW GAME+ 3: Use fatsop spritesheet
        this.marthaImage = this.game.images["martha-fatsop-spritesheet.png"];
      } else if (difficulty >= 1) {
        // NEW GAME+ 1-2: Use rumble spritesheet
        this.marthaImage = this.game.images["martha-rumble-spritesheet.png"];
      } else {
        // Normal difficulty: Use default sockballs spritesheet
        this.marthaImage = this.game.images["martha-sockballs-spritesheet.png"];
      }
    }
  }

  setupScoreAnimation() {
    // Calculate animation duration to always take 3 seconds total
    const totalAnimationTime = 3000; // 3 seconds in milliseconds

    // Time bonus display value (use actual points for animation)
    const timeBonusDisplayValue = this.game.timeBonusEarned
      ? this.timeBonusPoints
      : 0;

    // Calculate total steps needed across all stages
    const totalSteps =
      this.perfectCatches +
      this.goodCatches +
      this.regularCatches +
      timeBonusDisplayValue +
      this.sockballsLeftover +
      this.rentPenalty +
      Math.abs(this.totalScoreRaw);

    // Calculate rate (ms per step) to complete in 3 seconds
    // If totalSteps is 0, use a default rate
    const calculatedRate =
      totalSteps > 0 ? totalAnimationTime / totalSteps : 50;

    this.scoreStages = [
      {
        label: "perfectCatchesDisplay",
        start: 0,
        end: this.perfectCatches,
        rate: calculatedRate,
      },
      {
        label: "goodCatchesDisplay",
        start: 0,
        end: this.goodCatches,
        rate: calculatedRate,
      },
      {
        label: "regularCatchesDisplay",
        start: 0,
        end: this.regularCatches,
        rate: calculatedRate,
      },
      {
        label: "timeBonusDisplay",
        start: 0,
        end: timeBonusDisplayValue,
        rate: calculatedRate,
      },
      {
        label: "sockballsLeftoverDisplay",
        start: 0,
        end: this.sockballsLeftover,
        rate: calculatedRate,
      },
      {
        label: "rentPenaltyDisplay",
        start: 0,
        end: this.rentPenalty,
        rate: calculatedRate,
      },
      {
        label: "totalScoreDisplay",
        start: 0,
        end: this.totalScoreRaw,
        rate: calculatedRate,
      },
    ];

    this.currentStageIndex = 0;
    this.scoreAnimationTimer = 0;
  }

  initializeParticles() {
    this.particles = [];
    this.starParticles = [];

    if (!this.showRentDue) {
      // Create celebratory confetti particles
      const canvasWidth = this.game.getCanvasWidth();
      const canvasHeight = this.game.getCanvasHeight();

      for (let i = 0; i < 50; i++) {
        this.particles.push({
          x: Math.random() * canvasWidth,
          y: -Math.random() * canvasHeight,
          vx: (Math.random() - 0.5) * 2,
          vy: Math.random() * 3 + 1,
          size: Math.random() * 6 + 2,
          color: this.getRandomColor(),
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.1,
          alpha: Math.random() * 0.5 + 0.5,
        });
      }

      // Create star particles around title
      for (let i = 0; i < 8; i++) {
        const angle = (i / 8) * Math.PI * 2;
        this.starParticles.push({
          angle: angle,
          distance: this.game.getScaledValue(150),
          size: this.game.getScaledValue(8),
          alpha: 0,
          pulseOffset: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  getRandomColor() {
    const colors = [
      "#FFD700", // Gold
      "#FF6B6B", // Red
      "#4ECDC4", // Cyan
      "#95E1D3", // Mint
      "#F38181", // Pink
      "#AA96DA", // Purple
      "#FCBAD3", // Light pink
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  updateScoreAnimation(deltaTime) {
    if (this.currentStageIndex >= this.scoreStages.length) return;

    const stage = this.scoreStages[this.currentStageIndex];
    this.scoreAnimationTimer += deltaTime;

    const stepsToAdd = Math.floor(this.scoreAnimationTimer / stage.rate);
    if (stepsToAdd > 0) {
      this.scoreAnimationTimer -= stepsToAdd * stage.rate;
      const currentValue = this[stage.label] || 0;
      const newValue = Math.min(currentValue + stepsToAdd, stage.end);
      this[stage.label] = newValue;

      if (newValue >= stage.end) {
        this.scoreLineVisible[this.currentStageIndex] = true;
        this.currentStageIndex++;
        this.scoreAnimationTimer = 0;
      }
    }

    // Update score line animations
    for (let i = 0; i < this.scoreLineAnimations.length; i++) {
      if (i <= this.currentStageIndex) {
        this.scoreLineAnimations[i] = Math.min(
          1,
          this.scoreLineAnimations[i] + deltaTime / 300
        );
      }
    }
  }

  onResize() {
    const layout = this.layoutCache;
    this.continueButton.width = layout.buttonWidth;
    this.continueButton.height = layout.buttonHeight;
    this.continueButton.x = layout.centerX - layout.buttonWidth / 2;
    // Button Y will be calculated dynamically in render based on actual visible lines
  }

  onUpdate(deltaTime) {
    this.updateAnimationTimers(deltaTime); // Fix Bug #1: Update parent class timers
    this.updateScoreAnimation(deltaTime);
    this.updateParticles(deltaTime);
    this.titleBounceTimer += deltaTime * 0.003;
    this.marthaScaleTimer += deltaTime * 0.002;

    // Update spritesheet animation
    if (this.useSpritesheet) {
      let config;
      if (this.showRentDue) {
        config = GameConfig.MARTHA_LOSING_SPRITESHEET;
      } else {
        // Determine which config to use based on the selected image
        if (this.marthaImage === this.game.images["martha-fatsop-spritesheet.png"]) {
          config = GameConfig.MARTHA_FATSOP_SPRITESHEET;
        } else if (this.marthaImage === this.game.images["martha-rumble-spritesheet.png"]) {
          config = GameConfig.MARTHA_RUMBLE_SPRITESHEET;
        } else {
          config = GameConfig.MARTHA_SOCKBALLS_SPRITESHEET;
        }
      }

      const msPerFrame = 1000 / config.fps;
      this.marthaAnimationTimer += deltaTime;

      if (this.marthaAnimationTimer >= msPerFrame) {
        this.marthaAnimationTimer -= msPerFrame;
        this.marthaAnimationFrame =
          (this.marthaAnimationFrame + 1) % config.animationFrames.length;
      }
    }

    // Update feedback manager to keep achievement/story notifications visible
    this.game.feedbackManager.update(deltaTime);
  }

  updateParticles(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;
    const canvasHeight = this.game.getCanvasHeight();

    // Update confetti particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * timeMultiplier;
      p.y += p.vy * timeMultiplier;
      p.rotation += p.rotationSpeed * timeMultiplier;
      p.alpha -= 0.002 * timeMultiplier;

      // Remove particles that are off screen or faded
      if (p.y > canvasHeight || p.alpha <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Update star particles
    for (const star of this.starParticles) {
      star.alpha = Math.min(1, star.alpha + 0.01 * timeMultiplier);
      star.angle += 0.01 * timeMultiplier;
    }
  }

  onMouseMove(x, y) {
    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;

    // Update cursor
    this.game.canvas.style.cursor = b.hovered ? "pointer" : "default";
  }

  onMouseDown(x, y) {
    if (this.continueButton.hovered) {
      this.continueButton.pressed = true;
    }
  }

  onMouseUp() {
    this.continueButton.pressed = false;
  }

  handleKeyDown(e) {
    // Enter or Space to continue
    if (e.key === "Enter" || e.key === " ") {
      this.handleContinue();
      e.preventDefault();
    }
    // Escape to exit to menu
    else if (e.key === "Escape") {
      this.game.audioManager.playSound("click", false, 0.5);
      this.game.changeGameState("menu");
      e.preventDefault();
    }
  }

  handleContinue() {
    // Add points to player's total
    this.game.playerPoints = Math.max(
      0,
      this.game.playerPoints + this.totalScore
    );

    // Achievement: DEEP_POCKETS
    if (this.game.playerPoints >= GameConfig.ACHIEVEMENTS.DEEP_POCKETS.threshold) {
      this.game.unlockAchievement("deep_pockets");
    }

    // Save game data (level completion and achievements were already handled in setup)
    this.game.saveGameData();

    // Use the new state management system to return to menu
    this.game.changeGameState("menu");
  }

  onClick(x, y) {
    // Use direct hit detection instead of hover state for touch compatibility
    const b = this.continueButton;
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      this.handleContinue();
    }
  }

  // Controller reticle support
  getInteractiveElements() {
    const elements = [];

    // Add continue button
    const b = this.continueButton;
    elements.push({
      x: b.x,
      y: b.y,
      width: b.width,
      height: b.height
    });

    return elements;
  }

  handleReticleMove(x, y) {
    // Reuse the existing mouse move logic for hover detection
    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;

    // Update reticle hover state in controller manager
    if (this.game.controllerManager) {
      this.game.controllerManager.setReticleHoverState(b.hovered);
    }
  }

  handleReticleAction(x, y) {
    // Reuse the existing click logic
    const b = this.continueButton;
    if (x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height) {
      this.handleContinue();
      return true;
    }
    return false;
  }

  onRender(ctx) {
    ctx.save();
    this.renderMainContainer(ctx);
    this.renderContent(ctx);
    this.renderContinueButton(ctx);

    // NEW GAME+: Render unlock notification if just unlocked
    if (this.showingNewGamePlusUnlock) {
      this.renderNewGamePlusUnlock(ctx);
    }

    ctx.restore();

    // Render feedback manager (achievement/story notifications) on top of everything
    this.game.feedbackManager.render(ctx);
  }

  renderMainContainer(ctx) {
    const layout = this.layoutCache;

    // Animated gradient background
    const gradient = ctx.createRadialGradient(
      layout.centerX,
      layout.centerY,
      0,
      layout.centerX,
      layout.centerY,
      this.game.getCanvasWidth() * 0.7
    );

    if (this.showRentDue) {
      gradient.addColorStop(0, "rgba(40, 20, 20, 0.9)");
      gradient.addColorStop(1, "rgba(20, 10, 10, 0.95)");
    } else {
      const pulseIntensity = Math.sin(this.glowTimer) * 0.1 + 0.15;
      gradient.addColorStop(0, `rgba(25, 25, 60, ${0.85 + pulseIntensity})`);
      gradient.addColorStop(1, `rgba(10, 10, 30, ${0.9 + pulseIntensity})`);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Enhanced shadow with glow
    ctx.save();
    ctx.shadowColor = this.showRentDue
      ? "rgba(0,0,0,0.6)"
      : "rgba(100,100,255,0.3)";
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(
      layout.containerX + 5,
      layout.containerY + 5,
      layout.containerWidth,
      layout.containerHeight
    );
    ctx.restore();

    // Enhanced panel with border glow
    this.renderEnhancedPanel(
      ctx,
      layout.containerX,
      layout.containerY,
      layout.containerWidth,
      layout.containerHeight
    );
  }

  renderEnhancedPanel(ctx, x, y, width, height) {
    ctx.save();

    // Panel gradient background
    const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
    if (this.showRentDue) {
      gradient.addColorStop(0, "rgba(60, 30, 30, 0.92)");
      gradient.addColorStop(1, "rgba(80, 40, 40, 0.88)");
    } else {
      gradient.addColorStop(0, "rgba(44, 62, 90, 0.92)");
      gradient.addColorStop(1, "rgba(52, 73, 110, 0.88)");
    }
    ctx.fillStyle = gradient;
    ctx.fillRect(x, y, width, height);

    // Outer border with glow
    const glowIntensity = this.getGlowIntensity(0.4, 0.8);
    ctx.strokeStyle = this.showRentDue
      ? `rgba(255, 100, 100, ${glowIntensity})`
      : `rgba(100, 150, 255, ${glowIntensity})`;
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = this.showRentDue ? "#FF6B6B" : "#4ECDC4";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.strokeRect(x, y, width, height);

    // Inner highlight
    ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
    ctx.lineWidth = this.game.getScaledValue(1);
    ctx.shadowBlur = 0;
    ctx.strokeRect(
      x + this.game.getScaledValue(3),
      y + this.game.getScaledValue(3),
      width - this.game.getScaledValue(6),
      height - this.game.getScaledValue(6)
    );

    ctx.restore();
  }

  renderContent(ctx) {
    const layout = this.layoutCache;

    this.renderParticles(ctx);
    this.renderTitle(ctx, layout);
    this.renderStarParticles(ctx, layout);
    this.renderMarthaImage(ctx, layout);
    this.renderScoreLines(ctx, layout);
  }

  renderParticles(ctx) {
    ctx.save();

    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);

      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);

      ctx.restore();
    }

    ctx.restore();
  }

  renderStarParticles(ctx, layout) {
    if (!this.showStars) return;

    ctx.save();

    for (const star of this.starParticles) {
      const x = layout.centerX + Math.cos(star.angle) * star.distance;
      const y = layout.titleY + Math.sin(star.angle) * star.distance * 0.5;

      ctx.globalAlpha =
        star.alpha * (0.6 + Math.sin(this.glowTimer + star.pulseOffset) * 0.4);

      // Draw star
      this.drawStar(ctx, x, y, 5, star.size, star.size / 2, "#FFD700");
    }

    ctx.restore();
  }

  drawStar(ctx, x, y, points, outerRadius, innerRadius, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = this.game.getScaledValue(10);

    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius;
      const angle = (i * Math.PI) / points - Math.PI / 2;
      const px = x + Math.cos(angle) * radius;
      const py = y + Math.sin(angle) * radius;

      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  renderTitle(ctx, layout) {
    ctx.save();

    // Animated bounce effect
    const bounceOffset =
      Math.sin(this.titleBounceTimer) * this.game.getScaledValue(5);
    const titleY = layout.titleY + bounceOffset;

    // Determine title text and colors based on success/failure
    const titleText = this.showRentDue ? "LEVEL FAILED!" : "LEVEL COMPLETE!";
    const titleColor = this.showRentDue ? "#FF6B6B" : "#FFD700";
    const shadowColor = this.showRentDue ? "#8B0000" : "#FFA500";
    const glowColor = this.showRentDue ? "#FF0000" : "#FFFF00";

    // Multiple shadow layers for depth
    ctx.shadowColor = shadowColor;
    ctx.shadowBlur = this.game.getScaledValue(5);
    ctx.shadowOffsetX = this.game.getScaledValue(3);
    ctx.shadowOffsetY = this.game.getScaledValue(3);

    // Background text (for depth)
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.font = `bold ${this.game.getScaledValue(48)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(titleText, layout.centerX + 4, titleY + 4);

    // Glowing outline
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.shadowColor = glowColor;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const glowIntensity = this.getGlowIntensity(0.6, 1.0);
    ctx.globalAlpha = glowIntensity;
    ctx.strokeStyle = titleColor;
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeText(titleText, layout.centerX, titleY);

    // Main text
    ctx.globalAlpha = 1;
    ctx.shadowBlur = this.game.getScaledValue(10);
    ctx.fillStyle = titleColor;
    ctx.fillText(titleText, layout.centerX, titleY);

    ctx.restore();
  }

  renderMarthaImage(ctx, layout) {
    if (!this.marthaImage) return;

    const image = this.marthaImage;
    const desiredHeight = layout.marthaImageSize;

    // Gentle floating animation
    const floatOffset =
      Math.sin(this.marthaScaleTimer) * this.game.getScaledValue(3);
    const scale = 1 + Math.sin(this.marthaScaleTimer * 0.8) * 0.03;

    ctx.save();

    // Add glow around Martha
    if (!this.showRentDue) {
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur =
        this.game.getScaledValue(20) * this.getGlowIntensity(0.5, 1.0);
    }

    if (this.useSpritesheet) {
      // Render spritesheet frame - determine config based on selected image
      let config;
      if (this.showRentDue) {
        config = GameConfig.MARTHA_LOSING_SPRITESHEET;
      } else {
        // Determine which config to use based on the selected image
        if (this.marthaImage === this.game.images["martha-fatsop-spritesheet.png"]) {
          config = GameConfig.MARTHA_FATSOP_SPRITESHEET;
        } else if (this.marthaImage === this.game.images["martha-rumble-spritesheet.png"]) {
          config = GameConfig.MARTHA_RUMBLE_SPRITESHEET;
        } else {
          config = GameConfig.MARTHA_SOCKBALLS_SPRITESHEET;
        }
      }

      const frameIndex = config.animationFrames[this.marthaAnimationFrame];
      const col = frameIndex % config.columns;
      const row = Math.floor(frameIndex / config.columns);

      const sourceX = col * config.frameWidth;
      const sourceY = row * config.frameHeight;

      // Calculate desired width based on frame aspect ratio
      const frameAspectRatio = config.frameWidth / config.frameHeight;
      const desiredWidth = desiredHeight * frameAspectRatio;

      const imageX = layout.centerX - (desiredWidth * scale) / 2;
      const imageY = layout.marthaImageY + floatOffset;

      ctx.drawImage(
        image,
        sourceX,
        sourceY,
        config.frameWidth,
        config.frameHeight,
        imageX,
        imageY,
        desiredWidth * scale,
        desiredHeight * scale
      );
    } else {
      // Render static image
      const aspectRatio = image.width / image.height;
      const desiredWidth = desiredHeight * aspectRatio;
      const imageX = layout.centerX - (desiredWidth * scale) / 2;
      const imageY = layout.marthaImageY + floatOffset;

      ctx.drawImage(
        image,
        imageX,
        imageY,
        desiredWidth * scale,
        desiredHeight * scale
      );
    }

    ctx.restore();
  }

  renderScoreLines(ctx, layout) {
    // Get difficulty-based point values
    const difficulty = this.game.currentDifficulty || 0;
    const perfectPoints = GameConfig.getCatchQualityPoints('perfect', difficulty);
    const goodPoints = GameConfig.getCatchQualityPoints('good', difficulty);
    const regularPoints = GameConfig.getCatchQualityPoints('regular', difficulty);

    const scoreLines = [
      {
        label: `${this.perfectCatchesDisplay}x PERFECT CATCHES:`,
        value: this.perfectCatchesDisplay * perfectPoints,
        color: "#FFD700",
        show: this.perfectCatches > 0,
      },
      {
        label: `${this.goodCatchesDisplay}x GOOD CATCHES:`,
        value: this.goodCatchesDisplay * goodPoints,
        color: "#00FF00",
        show: this.goodCatches > 0,
      },
      {
        label: `${this.regularCatchesDisplay}x NICE CATCHES:`,
        value: this.regularCatchesDisplay * regularPoints,
        color: "#FFFFFF",
        show: this.regularCatches > 0,
      },
      {
        label: `TIME BONUS (2x RENT):`,
        value: this.timeBonusDisplay,
        color: "#FFD700",
        show: this.game.timeBonusEarned,
      },
      {
        label: `${this.sockballsLeftoverDisplay}x SOCKBALLS LEFTOVER:`,
        value: this.sockballsLeftoverDisplay * this.sockballsLeftoverBonus,
        color: "#95E1D3",
        show: this.sockballsLeftover > 0, // Only show if there are leftover sockballs
      },
      {
        label: `RENT PENALTY:`,
        value: this.rentPenaltyDisplay * -this.rentPenaltyPerSockball,
        color: "#FF6B6B",
        show: this.rentPenalty > 0, // Only show if there's a penalty
      },
      {
        label: `TOTAL SCORE:`,
        value: Math.max(0, this.totalScoreDisplay),
        color: "#FFD700",
      },
    ];

    // Filter out lines that shouldn't be shown
    const visibleLines = scoreLines.filter((line) => line.show !== false);

    // Draw decorative separator line before total (adjusted for visible lines)
    ctx.save();
    const separatorY =
      layout.scoreStartY + (visibleLines.length - 1.5) * layout.scoreLineHeight;
    const separatorWidth = this.game.getScaledValue(400);
    const gradient = ctx.createLinearGradient(
      layout.centerX - separatorWidth / 2,
      separatorY,
      layout.centerX + separatorWidth / 2,
      separatorY
    );
    gradient.addColorStop(0, "rgba(255, 215, 0, 0)");
    gradient.addColorStop(0.5, "rgba(255, 215, 0, 0.8)");
    gradient.addColorStop(1, "rgba(255, 215, 0, 0)");

    ctx.strokeStyle = gradient;
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(10);
    ctx.beginPath();
    ctx.moveTo(layout.centerX - separatorWidth / 2, separatorY);
    ctx.lineTo(layout.centerX + separatorWidth / 2, separatorY);
    ctx.stroke();
    ctx.restore();

    // Calculate button position: 50 pixels below the separator line
    this.continueButton.y = separatorY + this.game.getScaledValue(50);

    // Render only visible lines
    let displayIndex = 0;
    scoreLines.forEach((line, originalIndex) => {
      if (line.show === false) return; // Skip hidden lines

      const y = layout.scoreStartY + displayIndex * layout.scoreLineHeight;
      this.renderScoreLine(
        ctx,
        line.label,
        line.value,
        layout.centerX,
        y,
        line.color,
        originalIndex, // Use original index for animation timing
        line.indent || false
      );
      displayIndex++;
    });
  }

  renderScoreLine(
    ctx,
    label,
    value,
    centerX,
    y,
    valueColor = "#FFD700",
    lineIndex = 0,
    isIndented = false
  ) {
    const fontSize = isIndented
      ? this.game.getScaledValue(16)
      : this.game.getScaledValue(20);
    const animProgress = this.scoreLineAnimations[lineIndex] || 0;

    // Slide in from left
    const slideOffset = (1 - this.easeOutBack(animProgress)) * -100;

    ctx.save();
    ctx.font = `${fontSize}px Arial`;
    ctx.textBaseline = "middle";
    ctx.globalAlpha = animProgress;

    // Label with shadow
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = this.game.getScaledValue(3);
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "right";
    ctx.fillText(label, centerX - 20 + slideOffset, y);

    // Value with glow effect
    ctx.shadowColor = valueColor;
    ctx.shadowBlur = this.game.getScaledValue(8);
    ctx.fillStyle = valueColor;
    ctx.textAlign = "left";

    // Scale up and pulse for total score only
    const isTotalScore = label.includes("TOTAL SCORE");
    if (isTotalScore) {
      ctx.font = `bold ${fontSize * 1.2}px Arial`;
      const pulseScale = 1 + Math.sin(this.pulseTimer * 2) * 0.05;
      ctx.save();
      ctx.translate(centerX + 20 + slideOffset, y);
      ctx.scale(pulseScale, pulseScale);
      ctx.fillText(`${value} points`, 0, 0);
      ctx.restore();
    } else {
      ctx.fillText(`${value} points`, centerX + 20 + slideOffset, y);
    }

    ctx.restore();
  }

  renderContinueButton(ctx) {
    const button = this.continueButton;
    const buttonImage = this.game.images["btn-continue.png"];

    ctx.save();

    if (buttonImage) {
      // Use button image
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = button.width;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > button.height) {
        imgHeight = button.height;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = button.x + (button.width - imgWidth) / 2;
      const imgY = button.y + (button.height - imgHeight) / 2;

      // Apply hover/pressed effects - scale and add glow
      if (button.pressed) {
        // Pressed state - slightly smaller scale
        ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
        ctx.shadowBlur = this.game.getScaledValue(15);

        const scale = 0.98;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = button.x + (button.width - scaledWidth) / 2;
        const scaledY = button.y + (button.height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else if (button.hovered) {
        // Hover state - scale up and glow
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = this.game.getScaledValue(20);

        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = button.x + (button.width - scaledWidth) / 2;
        const scaledY = button.y + (button.height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        // Normal state
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Fallback to gradient style if image not loaded
      const gradient = ctx.createLinearGradient(
        button.x,
        button.y,
        button.x,
        button.y + button.height
      );

      let color1, color2;
      if (button.pressed) {
        color1 = "#2980B9";
        color2 = "#1A5276";
      } else if (button.hovered) {
        color1 = "#4ECDC4";
        color2 = "#3498DB";
      } else {
        color1 = "#3498DB";
        color2 = "#2471A3";
      }

      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
      ctx.fillStyle = gradient;
      ctx.fillRect(button.x, button.y, button.width, button.height);

      // Enhanced border
      ctx.strokeStyle = button.hovered ? "#5DADE2" : "#2980B9";
      ctx.lineWidth = this.game.getScaledValue(3);
      ctx.strokeRect(button.x, button.y, button.width, button.height);

      // Glow effect when hovered
      if (button.hovered) {
        ctx.shadowColor = "#4ECDC4";
        ctx.shadowBlur =
          this.game.getScaledValue(20) * this.getGlowIntensity(0.7, 1.0);
        ctx.strokeRect(button.x, button.y, button.width, button.height);

        // Inner highlight
        ctx.shadowBlur = 0;
        ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
        ctx.lineWidth = this.game.getScaledValue(1);
        ctx.strokeRect(
          button.x + 2,
          button.y + 2,
          button.width - 4,
          button.height - 4
        );
      }

      // Button text with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = this.game.getScaledValue(5);
      ctx.shadowOffsetX = button.pressed ? 0 : this.game.getScaledValue(2);
      ctx.shadowOffsetY = button.pressed ? 0 : this.game.getScaledValue(2);

      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${this.game.getScaledValue(18)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      const textY = button.y + button.height / 2;
      const textX = button.x + button.width / 2;
      ctx.fillText("CONTINUE", textX, textY);
    }

    ctx.restore();
  }

  // NEW GAME+ Unlock Notification
  renderNewGamePlusUnlock(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const bannerHeight = this.game.getScaledValue(200);
    const bannerY = this.game.getScaledValue(50);

    ctx.save();

    // Semi-transparent background overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
    ctx.fillRect(
      0,
      bannerY - this.game.getScaledValue(20),
      canvasWidth,
      bannerHeight + this.game.getScaledValue(40)
    );

    // Banner background
    const gradient = ctx.createLinearGradient(
      0,
      bannerY,
      0,
      bannerY + bannerHeight
    );
    gradient.addColorStop(0, "rgba(100, 150, 255, 0.9)");
    gradient.addColorStop(1, "rgba(75, 125, 230, 0.9)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, bannerY, canvasWidth, bannerHeight);

    // Border
    ctx.strokeStyle = "rgba(255, 215, 0, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(4);
    ctx.strokeRect(0, bannerY, canvasWidth, bannerHeight);

    // Glow effect
    ctx.shadowColor = "#FFD700";
    ctx.shadowBlur = this.game.getScaledValue(30);
    ctx.strokeRect(0, bannerY, canvasWidth, bannerHeight);

    // Title - show which NG+ level was unlocked
    const plusLevel = this.newGamePlusUnlockedLevel > 1 ? ` ${this.newGamePlusUnlockedLevel}` : '';
    ctx.shadowBlur = this.game.getScaledValue(10);
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(48)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(
      `NEW GAME+${plusLevel} UNLOCKED!`,
      canvasWidth / 2,
      bannerY + this.game.getScaledValue(20)
    );

    // Description
    ctx.shadowBlur = this.game.getScaledValue(5);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `${this.game.getScaledValue(18)}px Arial`;
    ctx.fillText(
      "You've completed all levels!",
      canvasWidth / 2,
      bannerY + this.game.getScaledValue(80)
    );

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    ctx.fillText(
      "Replay any level with increased difficulty",
      canvasWidth / 2,
      bannerY + this.game.getScaledValue(110)
    );
    ctx.fillText(
      "for higher speeds and tighter time limits!",
      canvasWidth / 2,
      bannerY + this.game.getScaledValue(135)
    );

    // Stars decoration
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFD700";
    ctx.font = `${this.game.getScaledValue(32)}px Arial`;
    ctx.fillText(
      "★",
      canvasWidth / 2 - this.game.getScaledValue(250),
      bannerY + this.game.getScaledValue(40)
    );
    ctx.fillText(
      "★",
      canvasWidth / 2 + this.game.getScaledValue(250),
      bannerY + this.game.getScaledValue(40)
    );

    ctx.restore();
  }
}
