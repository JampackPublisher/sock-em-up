// 📁 martha-manager.js - Manages Martha's AI, movement patterns, and behavior

class MarthaManager {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;

    // Martha's position and size
    this.x = 600;
    this.y = 300;
    this.width = GameConfig.MARTHA_SIZE.width;
    this.height = GameConfig.MARTHA_SIZE.height;
    this.scale = 1;

    // Movement state
    this.velocity = { x: 0, y: 0 };
    this.direction = 1; // 1 or -1
    this.currentPattern = "horizontal";
    this.patternData = {};
    this.patternTimer = 0;
    this.patternSwitchTimer = 0;
    this.patternSwitchInterval = 9000; // Switch patterns every 9 seconds for better predictability

    // Animation state
    this.animationFrame = 0;
    this.animationSpeed = 5;
    this.animationTimer = 0;
    this.currentFrameIndex = 0;
    this.facingRight = true;

    // Hit effects
    this.hitEffect = {
      active: false,
      timer: 0,
      flashTimer: 0,
      knockbackVelocity: { x: 0, y: 0 },
      pointPopups: [],
    };

    // State management
    this.onScreen = true;
    this.isExiting = false;
    this.isEntering = false;
    this.exitDirection = 1; // 1 for right, -1 for left

    // Sockball collection
    this.collectedSockballs = 0;
    this.targetSockballs = 0;
    this.sockballsWanted = 0;

    // Rent due meter
    this.rentDueMeter = {
      current: 0,
      max: 0,
      width: 60,
      height: 8,
      offsetY: -15, // Above Martha's head
      backgroundColor: "#333333",
      borderColor: "#666666",
      fillColor: "#ff4444",
      fullColor: "#ff0000",
    };

    // Level configuration
    this.speed = 1;
    this.availablePatterns = ["horizontal"];
    this.patternSpeed = 1;

    // Bounds with buffer zones
    this.bounds = {
      left: GameConfig.THROWING_BOUNDS.LEFT,
      right: GameConfig.THROWING_BOUNDS.RIGHT,
      top: GameConfig.THROWING_BOUNDS.TOP,
      bottom: GameConfig.THROWING_BOUNDS.BOTTOM,
    };

    // Simplified edge handling - smaller buffer for more usable space
    this.edgeBuffer = 40; // Reduced from 100 for more play area

    // Audio tracking
    this.hasPlayedAngrySound = false;
    this.hasPlayedLaughSound = false;
    this.hasPlayedRentCollectedSound = false;
  }

  setup(level) {
    // Reset state
    this.collectedSockballs = 0;
    this.targetSockballs = level.marthaWantsSockballs;
    this.sockballsWanted = level.marthaWantsSockballs;
    this.speed = level.marthaSpeed;
    this.availablePatterns = level.marthaPatterns;
    this.patternSpeed = level.marthaPatternSpeed;

    // Setup rent due meter
    this.rentDueMeter.current = 0;
    this.rentDueMeter.max = level.marthaWantsSockballs;

    // Reset position to center area
    this.x = this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
    this.y = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

    // Reset state flags
    this.onScreen = true;
    this.isExiting = false;
    this.isEntering = false;

    // Reset hit effects
    this.hitEffect.active = false;
    this.hitEffect.pointPopups = [];

    // Reset animation state
    this.animationFrame = 0;
    this.animationTimer = 0;
    this.currentFrameIndex = 0;

    // Reset audio flags
    this.hasPlayedAngrySound = false;
    this.hasPlayedLaughSound = false;
    this.hasPlayedRentCollectedSound = false;

    // Initialize first pattern
    this.switchPattern();
  }

  update(deltaTime) {
    // Update animation
    this.updateAnimation(deltaTime);

    this.patternTimer += deltaTime;
    this.patternSwitchTimer += deltaTime;

    // Update hit effects
    this.updateHitEffects(deltaTime);

    // Handle pattern switching
    if (this.patternSwitchTimer >= this.patternSwitchInterval) {
      this.switchPattern();
      this.patternSwitchTimer = 0;
    }

    // Update movement based on current state
    if (this.isExiting) {
      this.updateExitMovement(deltaTime);
    } else if (this.isEntering) {
      this.updateEnterMovement(deltaTime);
    } else if (this.onScreen) {
      this.updatePatternMovement(deltaTime);
    }

    // Apply movement and bounds checking
    this.applyMovement(deltaTime);

    // Check for audio triggers
    this.checkAudioTriggers();
  }

  checkAudioTriggers() {
    // Play rent collected sound when Martha gets enough sockballs
    if (
      this.hasCollectedEnoughSockballs() &&
      !this.hasPlayedRentCollectedSound
    ) {
      this.game.audioManager.playSound("rent-collected", false, 0.6);
      this.hasPlayedRentCollectedSound = true;
    }
  }

  updateAnimation(deltaTime) {
    // Only animate if moving
    const isMoving =
      Math.abs(this.velocity.x) > 0.1 || Math.abs(this.velocity.y) > 0.1;

    if (isMoving) {
      this.animationTimer += deltaTime;

      // Animation speed should be proportional to movement speed
      const movementSpeed = Math.sqrt(
        this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
      );
      const animationSpeed = Math.max(200, 400 - movementSpeed * 50); // Faster animation for faster movement

      if (this.animationTimer >= animationSpeed) {
        this.currentFrameIndex =
          (this.currentFrameIndex + 1) % GameConfig.MARTHA_FRAMES.length;
        this.animationTimer = 0;
      }
    }
  }

  updateHitEffects(deltaTime) {
    if (this.hitEffect.active) {
      this.hitEffect.timer -= deltaTime;
      this.hitEffect.flashTimer += deltaTime;

      // Apply knockback
      this.x += this.hitEffect.knockbackVelocity.x;
      this.y += this.hitEffect.knockbackVelocity.y;

      // Reduce knockback velocity
      this.hitEffect.knockbackVelocity.x *= 0.9;
      this.hitEffect.knockbackVelocity.y *= 0.9;

      if (this.hitEffect.timer <= 0) {
        this.hitEffect.active = false;
      }
    }

    // Update point popups
    this.hitEffect.pointPopups = this.hitEffect.pointPopups.filter((popup) => {
      popup.timer -= deltaTime;
      popup.y -= popup.velocity * (deltaTime / 16.67);
      popup.velocity *= 0.98;
      return popup.timer > 0;
    });
  }

  updateExitMovement(deltaTime) {
    // Exit 5 times faster - changed from speed * 3 to speed * 15
    const exitSpeed = this.speed * 15;
    this.velocity.x = this.exitDirection * exitSpeed;
    this.velocity.y = 0;

    // Check if Martha is off screen
    if (
      this.exitDirection > 0 &&
      this.x > this.game.getCanvasWidth() + this.width
    ) {
      this.onScreen = false;
      this.isExiting = false;
    } else if (this.exitDirection < 0 && this.x < -this.width) {
      this.onScreen = false;
      this.isExiting = false;
    }
  }

  updateEnterMovement(deltaTime) {
    const enterSpeed = this.speed * 2; // Enter at moderate speed
    this.velocity.x = this.exitDirection * enterSpeed;
    this.velocity.y = 0;

    // Fix Bug #8: Use <= and >= for edge case handling
    // Check if Martha is back on screen
    if (this.exitDirection > 0 && this.x <= this.bounds.right - this.width) {
      this.isEntering = false;
      this.x = this.bounds.right - this.width;
    } else if (this.exitDirection < 0 && this.x >= this.bounds.left) {
      this.isEntering = false;
      this.x = this.bounds.left;
    }
  }

  updatePatternMovement(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    // Calculate base movement from pattern
    switch (this.currentPattern) {
      case "horizontal":
        this.updateHorizontalPattern(timeMultiplier);
        break;
      case "vertical":
        this.updateVerticalPattern(timeMultiplier);
        break;
      case "diagonal":
        this.updateDiagonalPattern(timeMultiplier);
        break;
      case "circular":
        this.updateCircularPattern(timeMultiplier);
        break;
      case "random":
        this.updateRandomPattern(timeMultiplier);
        break;
    }
  }

  updateHorizontalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.HORIZONTAL.baseSpeed;
    this.velocity.x =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = 0;

    // Update facing direction
    this.facingRight = this.direction > 0;
  }

  updateVerticalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.VERTICAL.baseSpeed;
    this.velocity.x = 0;
    this.velocity.y =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
  }

  updateDiagonalPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.DIAGONAL.baseSpeed;
    if (!this.patternData.diagonalDirection) {
      this.patternData.diagonalDirection = { x: 1, y: 1 };
    }

    this.velocity.x =
      this.patternData.diagonalDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.patternData.diagonalDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    // Update facing direction
    this.facingRight = this.patternData.diagonalDirection.x > 0;
  }

  updateCircularPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.CIRCULAR.baseSpeed;
    if (!this.patternData.circularAngle) {
      this.patternData.circularAngle = 0;
      this.patternData.centerX =
        this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
      this.patternData.centerY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
      // Larger radius for more interesting circular movement
      this.patternData.radius = Math.min(
        (this.bounds.right - this.bounds.left) / 2.8,
        (this.bounds.bottom - this.bounds.top) / 2.8
      );
    }

    this.patternData.circularAngle +=
      baseSpeed * this.patternSpeed * timeMultiplier * 0.02;

    const targetX =
      this.patternData.centerX +
      Math.cos(this.patternData.circularAngle) * this.patternData.radius;
    const targetY =
      this.patternData.centerY +
      Math.sin(this.patternData.circularAngle) * this.patternData.radius;

    this.velocity.x = (targetX - this.x) * 0.15;
    this.velocity.y = (targetY - this.y) * 0.15;

    this.facingRight = this.velocity.x > 0;
  }

  updateRandomPattern(timeMultiplier) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.RANDOM.baseSpeed;

    // Change direction less frequently for more predictable movement
    if (Math.random() < 0.004) {
      this.patternData.randomDirection = {
        x: (Math.random() - 0.5) * 2,
        y: (Math.random() - 0.5) * 2,
      };
    }

    if (!this.patternData.randomDirection) {
      this.patternData.randomDirection = { x: 1, y: 0 };
    }

    this.velocity.x =
      this.patternData.randomDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.patternData.randomDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    this.facingRight = this.velocity.x > 0;
  }

  applyMovement(deltaTime) {
    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Simple bounds checking with direction reversal
    if (!this.isExiting && !this.isEntering) {
      // Restricted zone: lower left corner (where sockballs are launched from)
      const restrictedZoneSize = 200; // Size of restricted area
      const launchX = GameConfig.SOCKBALL_LAUNCH_POSITION.x;
      const launchY = GameConfig.SOCKBALL_LAUNCH_POSITION.y;

      if (this.x < launchX + restrictedZoneSize &&
          this.y > launchY - restrictedZoneSize) {
        // Push Martha away from the lower left corner
        this.velocity.x = Math.abs(this.velocity.x) + 2; // Force right
        this.velocity.y = -Math.abs(this.velocity.y) - 2; // Force up
        this.x = launchX + restrictedZoneSize;
        this.y = Math.min(this.y, launchY - restrictedZoneSize);

        if (this.currentPattern === "horizontal") {
          this.direction = 1; // Move right
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.x = 1;
          this.patternData.diagonalDirection.y = -1;
        }
      }

      // Left boundary
      if (this.x < this.bounds.left) {
        this.x = this.bounds.left;
        this.velocity.x = Math.abs(this.velocity.x); // Bounce right
        if (this.currentPattern === "horizontal") {
          this.direction = 1;
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.x = 1;
        }
      }

      // Right boundary
      if (this.x > this.bounds.right - this.width) {
        this.x = this.bounds.right - this.width;
        this.velocity.x = -Math.abs(this.velocity.x); // Bounce left
        if (this.currentPattern === "horizontal") {
          this.direction = -1;
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.x = -1;
        }
      }

      // Top boundary
      if (this.y < this.bounds.top) {
        this.y = this.bounds.top;
        this.velocity.y = Math.abs(this.velocity.y); // Bounce down
        if (this.currentPattern === "vertical") {
          this.direction = 1;
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.y = 1;
        }
      }

      // Bottom boundary
      if (this.y > this.bounds.bottom - this.height) {
        this.y = this.bounds.bottom - this.height;
        this.velocity.y = -Math.abs(this.velocity.y); // Bounce up
        if (this.currentPattern === "vertical") {
          this.direction = -1;
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.y = -1;
        }
      }

      // Ensure Martha is always moving (minimum velocity)
      const currentSpeed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
      const minSpeed = 1.0;
      if (currentSpeed < minSpeed) {
        // If moving too slowly, give a small push in current direction or default right
        const defaultDirection = this.direction || 1;
        this.velocity.x = defaultDirection * minSpeed;
      }

      // Update facing direction based on velocity
      if (Math.abs(this.velocity.x) > 0.1) {
        this.facingRight = this.velocity.x > 0;
      }
    }
  }

  switchPattern() {
    if (this.availablePatterns.length > 0) {
      this.currentPattern =
        this.availablePatterns[
          Math.floor(Math.random() * this.availablePatterns.length)
        ];
      this.patternData = {};
      this.patternTimer = 0;

      // Reset direction for new pattern
      this.direction = Math.random() < 0.5 ? 1 : -1;
    }
  }

  // Phase 2.1 - Calculate catch quality based on distance from center
  calculateCatchQuality(sockball) {
    // Calculate Martha's center
    const marthaCenterX = this.x + this.width / 2;
    const marthaCenterY = this.y + this.height / 2;

    // Calculate distance from center
    const dx = sockball.x - marthaCenterX;
    const dy = sockball.y - marthaCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Calculate max distance for catch (using Martha's width as reference)
    const maxDistance = this.width / 2;

    // Normalized distance (0 = center, 1 = edge of Martha, >1 = beyond edge)
    const normalizedDistance = distance / maxDistance;

    // Determine catch quality
    if (normalizedDistance <= GameConfig.CATCH_MECHANICS.PERFECT_CATCH_THRESHOLD) {
      return {
        quality: "PERFECT",
        data: GameConfig.CATCH_QUALITY.PERFECT,
      };
    } else if (
      normalizedDistance <= GameConfig.CATCH_MECHANICS.GOOD_CATCH_THRESHOLD
    ) {
      return {
        quality: "GOOD",
        data: GameConfig.CATCH_QUALITY.GOOD,
      };
    } else {
      return {
        quality: "REGULAR",
        data: GameConfig.CATCH_QUALITY.REGULAR,
      };
    }
  }

  hitBySockball(sockball, forcedQuality = null) {
    if (this.hitEffect.active) return false; // Already hit recently

    this.collectedSockballs++;

    // Update rent due meter
    this.rentDueMeter.current = this.collectedSockballs;

    // Phase 2.1 - Use forced quality (from zone tracking) or calculate it
    let catchQuality;
    if (forcedQuality) {
      // Use the best zone entered as the catch quality
      catchQuality = {
        quality: forcedQuality,
        data: GameConfig.CATCH_QUALITY[forcedQuality],
      };
    } else {
      // Fallback to old calculation method
      catchQuality = this.calculateCatchQuality(sockball);
    }
    const points = catchQuality.data.points;

    // Track perfect catches in game stats
    if (catchQuality.quality === "PERFECT") {
      this.game.perfectCatchStats.total++;
      if (!this.game.perfectCatchStats.byLevel[this.game.currentLevel]) {
        this.game.perfectCatchStats.byLevel[this.game.currentLevel] = 0;
      }
      this.game.perfectCatchStats.byLevel[this.game.currentLevel]++;
    }

    // Add points based on catch quality
    this.game.playerPoints += points;

    // Play Martha hit sound
    this.game.audioManager.playSound("martha-hit", false, 0.5);

    // Activate hit effect
    this.hitEffect.active = true;
    this.hitEffect.timer = GameConfig.MARTHA_HIT_EFFECTS.FLASH_DURATION;
    this.hitEffect.flashTimer = 0;

    // Calculate knockback
    const knockbackForce = GameConfig.MARTHA_HIT_EFFECTS.KNOCKBACK_DISTANCE;
    const angle = Math.atan2(sockball.y - this.y, sockball.x - this.x);
    this.hitEffect.knockbackVelocity = {
      x: Math.cos(angle) * knockbackForce,
      y: Math.sin(angle) * knockbackForce,
    };

    // Phase 2.1 - Add point popup with catch quality
    this.hitEffect.pointPopups.push({
      x: this.x + this.width / 2,
      y: this.y,
      text: catchQuality.data.name + " +" + points,
      timer: GameConfig.MARTHA_HIT_EFFECTS.POINT_POP_DURATION,
      velocity: 2,
      color: catchQuality.data.color,
      quality: catchQuality.quality,
    });

    // Phase 2.2 - Return catch quality for feedback system
    return catchQuality.quality;
  }

  checkCollision(sockball) {
    // Phase 2.1 - Enhanced collision with catch radius multiplier
    const sockballRadius = GameConfig.SOCKBALL_SIZE / 2;
    const catchRadius =
      (this.width / 2) * GameConfig.CATCH_MECHANICS.CATCH_RADIUS_MULTIPLIER;

    // Calculate Martha's center
    const marthaCenterX = this.x + this.width / 2;
    const marthaCenterY = this.y + this.height / 2;

    // Calculate distance from center
    const dx = sockball.x - marthaCenterX;
    const dy = sockball.y - marthaCenterY;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Check if within catch radius
    return distance <= catchRadius + sockballRadius;
  }

  startExit() {
    this.isExiting = true;
    this.exitDirection = Math.random() < 0.5 ? 1 : -1;
    this.facingRight = this.exitDirection > 0;

    // Play appropriate exit sound based on whether Martha got enough rent
    if (this.hasCollectedEnoughSockballs()) {
      if (!this.hasPlayedLaughSound) {
        this.game.audioManager.playSound("martha-laugh", false, 0.7);
        this.hasPlayedLaughSound = true;
      }
    } else {
      if (!this.hasPlayedAngrySound) {
        this.game.audioManager.playSound("martha-angry", false, 0.7);
        this.hasPlayedAngrySound = true;
      }
    }
  }

  startEnter() {
    this.isEntering = true;
    this.onScreen = true;

    // Position Martha off screen in the opposite direction
    if (this.exitDirection > 0) {
      this.x = -this.width;
    } else {
      this.x = this.game.getCanvasWidth() + this.width;
    }

    this.exitDirection *= -1; // Reverse direction for entering
  }

  hasCollectedEnoughSockballs() {
    return this.collectedSockballs >= this.sockballsWanted;
  }

  needsMoreSockballs() {
    return this.collectedSockballs < this.sockballsWanted;
  }

  renderRentDueMeter(ctx) {
    const meter = this.rentDueMeter;
    const meterX = this.x + (this.width - meter.width) / 2;
    const meterY = this.y + meter.offsetY;

    // Draw background
    ctx.fillStyle = meter.backgroundColor;
    ctx.fillRect(meterX, meterY, meter.width, meter.height);

    // Draw border
    ctx.strokeStyle = meter.borderColor;
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, meterY, meter.width, meter.height);

    // Draw fill
    if (meter.current > 0) {
      const fillWidth = (meter.current / meter.max) * meter.width;
      const fillColor =
        meter.current >= meter.max ? meter.fullColor : meter.fillColor;
      ctx.fillStyle = fillColor;
      ctx.fillRect(meterX, meterY, fillWidth, meter.height);
    }

    // Draw text label
    ctx.fillStyle = "#ffffff";
    ctx.font = `${this.game.getScaledValue(10)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    ctx.fillText("RENT DUE", meterX + meter.width / 2, meterY - 2);
  }

  renderCatchZones(ctx) {
    // Calculate Martha's center position
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const baseRadius = this.width / 2;

    // Get the catch radius with multiplier
    const catchRadius = baseRadius * GameConfig.CATCH_MECHANICS.CATCH_RADIUS_MULTIPLIER;

    // Calculate zone radii based on thresholds
    const perfectRadius = baseRadius * GameConfig.CATCH_MECHANICS.PERFECT_CATCH_THRESHOLD;
    const goodRadius = baseRadius * GameConfig.CATCH_MECHANICS.GOOD_CATCH_THRESHOLD;
    const regularRadius = catchRadius;

    ctx.save();

    // Draw Regular catch zone (outermost) - Blue
    ctx.beginPath();
    ctx.arc(centerX, centerY, regularRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(100, 150, 255, 0.4)";
    ctx.lineWidth = 3;
    ctx.setLineDash([8, 4]);
    ctx.stroke();
    ctx.fillStyle = "rgba(100, 150, 255, 0.08)";
    ctx.fill();

    // Draw Good catch zone (middle) - Green
    ctx.beginPath();
    ctx.arc(centerX, centerY, goodRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(144, 238, 144, 0.5)";
    ctx.lineWidth = 3;
    ctx.setLineDash([6, 3]);
    ctx.stroke();
    ctx.fillStyle = "rgba(144, 238, 144, 0.1)";
    ctx.fill();

    // Draw Perfect catch zone (innermost) - Gold
    ctx.beginPath();
    ctx.arc(centerX, centerY, perfectRadius, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255, 215, 0, 0.6)";
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 2]);
    ctx.stroke();
    ctx.fillStyle = "rgba(255, 215, 0, 0.12)";
    ctx.fill();

    // Reset line dash
    ctx.setLineDash([]);

    ctx.restore();
  }

  render(ctx) {
    if (!this.onScreen && !this.isEntering) return;

    ctx.save();

    // Render catch zones first (behind Martha)
    this.renderCatchZones(ctx);

    // Apply hit flash effect
    if (this.hitEffect.active) {
      const flashIntensity =
        Math.sin(this.hitEffect.flashTimer * 0.3) * 0.5 + 0.5;
      ctx.filter = `brightness(${100 + flashIntensity * 100}%) saturate(${
        100 + flashIntensity * 50
      }%)`;
    }

    // Get the current animation frame
    const frameIndex = GameConfig.MARTHA_FRAMES[this.currentFrameIndex];
    const marthaImage =
      this.game.images[GameConfig.IMAGES.CHARACTERS[frameIndex]];

    // Draw Martha
    if (marthaImage) {
      ctx.save();

      // Flip horizontally if facing right (sprite faces left by default)
      if (this.facingRight) {
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(marthaImage, 0, 0, this.width, this.height);
      } else {
        ctx.drawImage(marthaImage, this.x, this.y, this.width, this.height);
      }

      ctx.restore();
    } else {
      // Fallback rectangle
      ctx.fillStyle = this.hitEffect.active ? "#ff6b6b" : "#8b4513";
      ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    // Draw rent due meter
    this.renderRentDueMeter(ctx);

    // Draw debug bounds
    if (GameConfig.DEBUG_PHYSICS_BOUNDS) {
      ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        this.bounds.left,
        this.bounds.top,
        this.bounds.right - this.bounds.left,
        this.bounds.bottom - this.bounds.top
      );
    }

    // Phase 2.1 - Draw point popups with quality colors
    this.hitEffect.pointPopups.forEach((popup) => {
      ctx.fillStyle = popup.color || "#ffd700";
      ctx.font = `bold ${this.game.getScaledValue(20)}px Courier New`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add shadow for better visibility
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 2;
      ctx.shadowOffsetY = 2;

      ctx.fillText(popup.text, popup.x, popup.y);

      // Reset shadow
      ctx.shadowBlur = 0;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    });

    ctx.restore();
  }
}
