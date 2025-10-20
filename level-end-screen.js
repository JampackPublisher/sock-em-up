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
    this.showVideoButton = false;
    this.videoPlayerActive = false;
    this.videoElement = null;
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
    this.scoreLineVisible = [false, false, false, false, false, false, false, false];
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
    this.videoButton = {
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
    const marthaImageSize = this.game.getScaledValue(100);
    const marthaToStatsMargin = this.game.getScaledValue(30);

    return {
      ...baseLayout,
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      containerWidth: this.game.getScaledValue(600),
      containerHeight: this.game.getScaledValue(550),
      containerX: canvasWidth / 2 - this.game.getScaledValue(300),
      containerY: canvasHeight / 2 - this.game.getScaledValue(275),
      titleY: canvasHeight / 2 - this.game.getScaledValue(200),
      marthaImageY: canvasHeight / 2 - this.game.getScaledValue(130),
      marthaImageSize: marthaImageSize,
      scoreStartY:
        canvasHeight / 2 -
        this.game.getScaledValue(130) +
        marthaImageSize +
        marthaToStatsMargin,
      scoreLineHeight: this.game.getScaledValue(35),
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),
      buttonY: canvasHeight / 2 + this.game.getScaledValue(240),
      videoButtonY: canvasHeight / 2 + this.game.getScaledValue(305),
    };
  }

  setup() {
    super.setup();
    this.resetScores();
    this.calculateScoresAndRent();
    this.setupScoreAnimation();
    this.onResize();
    this.initializeParticles();
    this.titleBounceTimer = 0;
    this.marthaScaleTimer = 0;

    // Check if NEW GAME+ was just unlocked
    this.showingNewGamePlusUnlock = this.game.showNewGamePlusNotification;
    if (this.showingNewGamePlusUnlock) {
      this.game.showNewGamePlusNotification = false; // Reset flag
    }

    // Show video button only if all 9 base levels have been completed
    const allBaseLevelsCompleted = this.game.completedLevelsByDifficulty[0] &&
                                   this.game.completedLevelsByDifficulty[0].every(completed => completed);
    this.showVideoButton = allBaseLevelsCompleted;
    this.videoPlayerActive = false;

    console.log(
      "🎵 Level end screen setup - no music started here (handled by throwing screen)"
    );
  }

  cleanup() {
    super.cleanup();

    // Close video player if active
    this.closeVideoPlayer();

    // Level end screen doesn't start its own music, so no cleanup needed
    // The throwing screen handles the victory/defeat music
    console.log("🎵 Level end screen cleanup - no music cleanup needed");
  }

  calculateScoresAndRent() {
    const marthaWanted = this.game.throwingScreen.marthaManager.sockballsWanted;
    const marthaGot = this.game.throwingScreen.marthaManager.collectedSockballs;
    const totalSockballsCreated = this.game.sockBalls;
    const sockballsThrown = this.game.throwingScreen.sockballsThrown || 0;

    this.sockballsPaid = marthaGot;
    this.sockballsLeftover = Math.max(
      0,
      totalSockballsCreated - sockballsThrown
    );
    this.rentPenalty = Math.max(0, marthaWanted - marthaGot);

    // Catch quality counts
    this.perfectCatches = this.game.catchQualityCounts?.PERFECT || 0;
    this.goodCatches = this.game.catchQualityCounts?.GOOD || 0;
    this.regularCatches = this.game.catchQualityCounts?.REGULAR || 0;

    // Base points
    this.sockballsPaidPoints = this.sockballsPaid * 5;

    // Time bonus: double the rent payment points if earned
    this.timeBonusPoints = 0;
    if (this.game.timeBonusEarned && this.sockballsPaid > 0) {
      this.timeBonusPoints = this.sockballsPaidPoints; // Same as sockballsPaid * 5
    }

    this.sockballsLeftoverPoints = this.sockballsLeftover * 10;
    this.rentPenaltyPoints = this.rentPenalty * -10;
    this.totalScore =
      this.sockballsPaidPoints +
      this.timeBonusPoints +
      this.sockballsLeftoverPoints +
      this.rentPenaltyPoints;

    this.showRentDue = this.rentPenalty > 0;
    this.showStars = !this.showRentDue; // Show stars only on success
    this.marthaImage = this.showRentDue
      ? this.game.images["martha-rentdue.png"]
      : this.game.images["martha-win.png"];
  }

  setupScoreAnimation() {
    // Calculate animation duration to always take 3 seconds total
    const totalAnimationTime = 3000; // 3 seconds in milliseconds

    // Calculate total steps needed across all stages
    const totalSteps =
      this.sockballsPaid +
      this.perfectCatches +
      this.goodCatches +
      this.regularCatches +
      (this.game.timeBonusEarned ? this.sockballsPaid : 0) +
      this.sockballsLeftover +
      this.rentPenalty +
      Math.abs(this.totalScore);

    // Calculate rate (ms per step) to complete in 3 seconds
    // If totalSteps is 0, use a default rate
    const calculatedRate = totalSteps > 0 ? totalAnimationTime / totalSteps : 50;

    this.scoreStages = [
      {
        label: "sockballsPaidDisplay",
        start: 0,
        end: this.sockballsPaid,
        rate: calculatedRate,
      },
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
        end: this.game.timeBonusEarned ? this.sockballsPaid : 0,
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
        end: this.totalScore,
        rate: calculatedRate
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
        this.scoreLineAnimations[i] = Math.min(1, this.scoreLineAnimations[i] + deltaTime / 300);
      }
    }
  }

  onResize() {
    const layout = this.layoutCache;
    this.continueButton.width = layout.buttonWidth;
    this.continueButton.height = layout.buttonHeight;
    this.continueButton.x = layout.centerX - layout.buttonWidth / 2;
    this.continueButton.y = layout.buttonY;

    this.videoButton.width = layout.buttonWidth;
    this.videoButton.height = layout.buttonHeight;
    this.videoButton.x = layout.centerX - layout.buttonWidth / 2;
    this.videoButton.y = layout.videoButtonY;
  }

  onUpdate(deltaTime) {
    this.updateAnimationTimers(deltaTime); // Fix Bug #1: Update parent class timers
    this.updateScoreAnimation(deltaTime);
    this.updateParticles(deltaTime);
    this.titleBounceTimer += deltaTime * 0.003;
    this.marthaScaleTimer += deltaTime * 0.002;
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
    if (this.videoPlayerActive) return;

    const b = this.continueButton;
    b.hovered =
      x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;

    if (this.showVideoButton) {
      const v = this.videoButton;
      v.hovered =
        x >= v.x && x <= v.x + v.width && y >= v.y && y <= v.y + v.height;
    }
  }

  onMouseDown(x, y) {
    if (this.videoPlayerActive) return;

    if (this.continueButton.hovered) {
      this.continueButton.pressed = true;
    }
    if (this.showVideoButton && this.videoButton.hovered) {
      this.videoButton.pressed = true;
    }
  }

  onMouseUp() {
    if (this.videoPlayerActive) return;

    this.continueButton.pressed = false;
    if (this.showVideoButton) {
      this.videoButton.pressed = false;
    }
  }

  handleKeyDown(e) {
    // Close video player with Escape
    if (this.videoPlayerActive && e.key === "Escape") {
      this.closeVideoPlayer();
      e.preventDefault();
      return;
    }

    // Don't handle other keys if video is active
    if (this.videoPlayerActive) return;

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
    this.game.playerPoints = Math.max(
      0,
      this.game.playerPoints + this.totalScore
    );

    // Mark level as complete if no rent penalty
    if (this.rentPenalty === 0) {
      this.game.completedLevels[this.game.currentLevel] = true;
      console.log(
        `Level ${
          this.game.currentLevel + 1
        } marked as complete - no rent penalty!`
      );

      // Phase 3.3 - Track difficulty completion
      this.game.markLevelCompleted(
        this.game.currentLevel,
        this.game.currentDifficulty
      );

      // Fix Bug #23: Achievement: SOCK_MASTER (complete all 9 levels) - with defensive checks
      const allLevelsCompleted = this.game.completedLevels && this.game.completedLevels.every(
        (completed) => completed
      );
      if (allLevelsCompleted) {
        this.game.unlockAchievement("sock_master");
      }

      // Achievement: NEW_GAME_PLUS_HERO (complete any level on +1 difficulty)
      if (this.game.currentDifficulty >= 1) {
        this.game.unlockAchievement("new_game_plus_hero");
      }

      // Achievement: ULTIMATE_CHAMPION (complete all levels on +4 difficulty)
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
    }

    this.game.saveGameData();

    // Use the new state management system to return to menu
    this.game.changeGameState("menu");
  }

  onClick(x, y) {
    if (this.videoPlayerActive) {
      // Check if click is outside video player
      const videoWidth = this.game.getScaledValue(640);
      const videoHeight = this.game.getScaledValue(360);
      const videoX = (this.game.getCanvasWidth() - videoWidth) / 2;
      const videoY = (this.game.getCanvasHeight() - videoHeight) / 2;

      const clickedOutside = x < videoX - 10 || x > videoX + videoWidth + 10 ||
                             y < videoY - 10 || y > videoY + videoHeight + 10;

      if (clickedOutside) {
        this.closeVideoPlayer();
      }
      return;
    }

    if (this.continueButton.hovered) {
      this.handleContinue();
    }
    if (this.showVideoButton && this.videoButton.hovered) {
      this.openVideoPlayer();
    }
  }

  onRender(ctx) {
    ctx.save();
    this.renderMainContainer(ctx);
    this.renderContent(ctx);
    this.renderContinueButton(ctx);

    // Render video button if shown
    if (this.showVideoButton) {
      this.renderVideoButton(ctx);
    }

    // Render video player modal if active
    if (this.videoPlayerActive) {
      this.renderVideoPlayer(ctx);
    }

    // NEW GAME+: Render unlock notification if just unlocked
    if (this.showingNewGamePlusUnlock) {
      this.renderNewGamePlusUnlock(ctx);
    }

    ctx.restore();
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
    ctx.shadowColor = this.showRentDue ? "rgba(0,0,0,0.6)" : "rgba(100,100,255,0.3)";
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

      ctx.globalAlpha = star.alpha * (0.6 + Math.sin(this.glowTimer + star.pulseOffset) * 0.4);

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
    const bounceOffset = Math.sin(this.titleBounceTimer) * this.game.getScaledValue(5);
    const titleY = layout.titleY + bounceOffset;

    // Determine colors based on success/failure
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
    ctx.font = `bold ${this.game.getScaledValue(48)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("LEVEL COMPLETE!", layout.centerX + 4, titleY + 4);

    // Glowing outline
    ctx.shadowBlur = this.game.getScaledValue(20);
    ctx.shadowColor = glowColor;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    const glowIntensity = this.getGlowIntensity(0.6, 1.0);
    ctx.globalAlpha = glowIntensity;
    ctx.strokeStyle = titleColor;
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeText("LEVEL COMPLETE!", layout.centerX, titleY);

    // Main text
    ctx.globalAlpha = 1;
    ctx.shadowBlur = this.game.getScaledValue(10);
    ctx.fillStyle = titleColor;
    ctx.fillText("LEVEL COMPLETE!", layout.centerX, titleY);

    ctx.restore();
  }

  renderMarthaImage(ctx, layout) {
    if (!this.marthaImage) return;

    const image = this.marthaImage;
    const desiredHeight = layout.marthaImageSize;
    const aspectRatio = image.width / image.height;
    const desiredWidth = desiredHeight * aspectRatio;

    // Gentle floating animation
    const floatOffset = Math.sin(this.marthaScaleTimer) * this.game.getScaledValue(3);
    const scale = 1 + Math.sin(this.marthaScaleTimer * 0.8) * 0.03;

    const imageX = layout.centerX - (desiredWidth * scale) / 2;
    const imageY = layout.marthaImageY + floatOffset;

    ctx.save();

    // Add glow around Martha
    if (!this.showRentDue) {
      ctx.shadowColor = "#4ECDC4";
      ctx.shadowBlur = this.game.getScaledValue(20) * this.getGlowIntensity(0.5, 1.0);
    }

    ctx.drawImage(
      image,
      imageX,
      imageY,
      desiredWidth * scale,
      desiredHeight * scale
    );

    ctx.restore();
  }

  renderScoreLines(ctx, layout) {
    const scoreLines = [
      {
        label: `${this.sockballsPaidDisplay}x SOCKBALLS PAID:`,
        value: this.sockballsPaidDisplay * 5,
        color: "#4ECDC4",
      },
      {
        label: `  ${this.perfectCatchesDisplay}x PERFECT CATCHES:`,
        value: this.perfectCatchesDisplay * 15,
        color: "#FFD700",
        show: this.perfectCatches > 0,
        indent: true,
      },
      {
        label: `  ${this.goodCatchesDisplay}x GOOD CATCHES:`,
        value: this.goodCatchesDisplay * 10,
        color: "#00FF00",
        show: this.goodCatches > 0,
        indent: true,
      },
      {
        label: `  ${this.regularCatchesDisplay}x NICE CATCHES:`,
        value: this.regularCatchesDisplay * 5,
        color: "#FFFFFF",
        show: this.regularCatches > 0,
        indent: true,
      },
      {
        label: `TIME BONUS (2x RENT):`,
        value: this.timeBonusDisplay * 5,
        color: "#FFD700",
        show: this.game.timeBonusEarned,
      },
      {
        label: `SOCKBALLS LEFTOVER:`,
        value: this.sockballsLeftoverDisplay * 10,
        color: "#95E1D3",
      },
      {
        label: `RENT PENALTY:`,
        value: this.rentPenaltyDisplay * -10,
        color: "#FF6B6B",
        show: this.rentPenalty > 0, // Only show if there's a penalty
      },
      {
        label: `TOTAL SCORE:`,
        value: this.totalScoreDisplay,
        color: "#FFD700",
      },
    ];

    // Filter out lines that shouldn't be shown
    const visibleLines = scoreLines.filter(line => line.show !== false);

    // Draw decorative separator line before total (adjusted for visible lines)
    ctx.save();
    const separatorY = layout.scoreStartY + (visibleLines.length - 1.5) * layout.scoreLineHeight;
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

  renderScoreLine(ctx, label, value, centerX, y, valueColor = "#FFD700", lineIndex = 0, isIndented = false) {
    const fontSize = isIndented ? this.game.getScaledValue(16) : this.game.getScaledValue(20);
    const animProgress = this.scoreLineAnimations[lineIndex] || 0;

    // Slide in from left
    const slideOffset = (1 - this.easeOutBack(animProgress)) * -100;

    ctx.save();
    ctx.font = `${fontSize}px Courier New`;
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
      ctx.font = `bold ${fontSize * 1.2}px Courier New`;
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

    ctx.save();

    // Enhanced gradient background
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
      ctx.shadowBlur = this.game.getScaledValue(20) * this.getGlowIntensity(0.7, 1.0);
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
    ctx.font = `bold ${this.game.getScaledValue(18)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textY = button.y + button.height / 2;
    const textX = button.x + button.width / 2;
    ctx.fillText("CONTINUE", textX, textY);

    ctx.restore();
  }


  renderVideoButton(ctx) {
    const button = this.videoButton;

    ctx.save();

    // Enhanced gradient background
    const gradient = ctx.createLinearGradient(
      button.x,
      button.y,
      button.x,
      button.y + button.height
    );

    let color1, color2;
    if (button.pressed) {
      color1 = "#9B59B6";
      color2 = "#7D3C98";
    } else if (button.hovered) {
      color1 = "#BB8FCE";
      color2 = "#A569BD";
    } else {
      color1 = "#A569BD";
      color2 = "#8E44AD";
    }

    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    ctx.fillStyle = gradient;
    ctx.fillRect(button.x, button.y, button.width, button.height);

    // Enhanced border
    ctx.strokeStyle = button.hovered ? "#D7BDE2" : "#8E44AD";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.strokeRect(button.x, button.y, button.width, button.height);

    // Glow effect when hovered
    if (button.hovered) {
      ctx.shadowColor = "#BB8FCE";
      ctx.shadowBlur = this.game.getScaledValue(20) * this.getGlowIntensity(0.7, 1.0);
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
    ctx.font = `bold ${this.game.getScaledValue(18)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const textY = button.y + button.height / 2;
    const textX = button.x + button.width / 2;
    ctx.fillText("WATCH VIDEO", textX, textY);

    ctx.restore();
  }

  openVideoPlayer() {
    this.game.audioManager.playSound("click", false, 0.5);
    this.videoPlayerActive = true;

    // Create video element
    this.videoElement = document.createElement('video');
    this.videoElement.src = 'videos/video-1.mp4';
    this.videoElement.loop = true;
    this.videoElement.autoplay = true;
    this.videoElement.controls = false;
    this.videoElement.style.display = 'none';
    document.body.appendChild(this.videoElement);

    console.log("🎥 Video player opened");
  }

  closeVideoPlayer() {
    this.videoPlayerActive = false;

    // Clean up video element
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.remove();
      this.videoElement = null;
    }

    console.log("🎥 Video player closed");
  }

  renderVideoPlayer(ctx) {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    ctx.save();

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.85)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Video container
    const videoWidth = this.game.getScaledValue(640);
    const videoHeight = this.game.getScaledValue(360);
    const videoX = (canvasWidth - videoWidth) / 2;
    const videoY = (canvasHeight - videoHeight) / 2;

    // Container background
    ctx.fillStyle = "rgba(20, 20, 20, 0.95)";
    ctx.fillRect(videoX - 10, videoY - 10, videoWidth + 20, videoHeight + 20);

    // Border with glow
    ctx.strokeStyle = "#BB8FCE";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = "#BB8FCE";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.strokeRect(videoX - 10, videoY - 10, videoWidth + 20, videoHeight + 20);

    // Draw video frame if available
    if (this.videoElement && this.videoElement.readyState >= 2) {
      ctx.drawImage(this.videoElement, videoX, videoY, videoWidth, videoHeight);
    } else {
      // Loading text
      ctx.shadowBlur = 0;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `${this.game.getScaledValue(24)}px Courier New`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("Loading video...", canvasWidth / 2, canvasHeight / 2);
    }

    // Close button hint
    ctx.shadowBlur = 0;
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = `${this.game.getScaledValue(16)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Press ESC or click outside to close", canvasWidth / 2, videoY + videoHeight + 30);

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
    ctx.fillRect(0, bannerY - this.game.getScaledValue(20), canvasWidth, bannerHeight + this.game.getScaledValue(40));

    // Banner background
    const gradient = ctx.createLinearGradient(0, bannerY, 0, bannerY + bannerHeight);
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

    // Title
    ctx.shadowBlur = this.game.getScaledValue(10);
    ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(48)}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("NEW GAME+ UNLOCKED!", canvasWidth / 2, bannerY + this.game.getScaledValue(20));

    // Description
    ctx.shadowBlur = this.game.getScaledValue(5);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `${this.game.getScaledValue(18)}px Courier New`;
    ctx.fillText("You've completed all levels!", canvasWidth / 2, bannerY + this.game.getScaledValue(80));

    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.font = `${this.game.getScaledValue(16)}px Courier New`;
    ctx.fillText("Replay any level with increased difficulty", canvasWidth / 2, bannerY + this.game.getScaledValue(110));
    ctx.fillText("for higher speeds and tighter time limits!", canvasWidth / 2, bannerY + this.game.getScaledValue(135));

    // Stars decoration
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#FFD700";
    ctx.font = `${this.game.getScaledValue(32)}px Courier New`;
    ctx.fillText("★", canvasWidth / 2 - this.game.getScaledValue(250), bannerY + this.game.getScaledValue(40));
    ctx.fillText("★", canvasWidth / 2 + this.game.getScaledValue(250), bannerY + this.game.getScaledValue(40));

    ctx.restore();
  }
}
