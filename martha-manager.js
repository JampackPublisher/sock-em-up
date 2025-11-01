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
    this.spritesheetConfig = GameConfig.MARTHA_SPRITESHEET; // Will be updated based on difficulty

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

    // Recovery animation state
    this.isRecovering = false;
    this.recoveryTimer = 0;
    this.recoveryDuration = 1000; // 1 second in milliseconds
    this.recoveryDirection = { x: 0, y: 0 };
    this.recoverySpeedMultiplier = 1; // Can be increased for emergency corner escapes

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

    // Pattern repetition tracking
    this.patternHistory = [];
    this.maxConsecutivePatterns = 2;

    // Initialization flag to track first-time setup vs animation-only changes
    this.hasBeenInitialized = false;

    // Direction change cooldown to prevent sprite flickering
    this.lastDirectionChangeTime = 0;
    this.directionChangeCooldown = 200; // 0.2 seconds in milliseconds
  }

  setup(level) {
    // Reset state
    this.collectedSockballs = 0;
    this.targetSockballs = level.marthaWantsSockballs;
    this.sockballsWanted = level.marthaWantsSockballs;

    // Apply base speed from level
    this.speed = level.marthaSpeed;
    this.availablePatterns = level.marthaPatterns;

    // Apply difficulty speed multiplier for consistent speeds across NEW GAME+ difficulties
    const difficultyMode = GameConfig.getDifficultyMode(
      this.game.currentDifficulty
    );
    this.speed *= difficultyMode.speedMultiplier;

    // Pattern speed is based on Martha's speed
    this.patternSpeed = this.speed;

    // Select spritesheet based on difficulty (New Game+ uses different animations)
    if (this.game.currentDifficulty >= 4) {
      // New Game+ +4: Randomly select from all running spritesheets
      const spritesheets = [
        GameConfig.MARTHA_SPRITESHEET,
        GameConfig.MARTHA_RUMBLERUN_SPRITESHEET,
        GameConfig.MARTHA_CRAWLING_SPRITESHEET,
        GameConfig.MARTHA_FATRUN_SPRITESHEET,
      ];
      this.spritesheetConfig =
        spritesheets[Math.floor(Math.random() * spritesheets.length)];
    } else if (this.game.currentDifficulty === 3) {
      // New Game+ +3: Use fatrun spritesheet
      this.spritesheetConfig = GameConfig.MARTHA_FATRUN_SPRITESHEET;
    } else if (this.game.currentDifficulty === 2) {
      // New Game+ +2: Use rumblerun spritesheet
      this.spritesheetConfig = GameConfig.MARTHA_RUMBLERUN_SPRITESHEET;
    } else if (this.game.currentDifficulty > 0) {
      // New Game+ +1: Use crawling spritesheet
      this.spritesheetConfig = GameConfig.MARTHA_CRAWLING_SPRITESHEET;
    } else {
      // Normal difficulty: Use running spritesheet
      this.spritesheetConfig = GameConfig.MARTHA_SPRITESHEET;
    }

    // Adjust Martha's size to maintain aspect ratio of selected sprite
    const frameAspectRatio =
      this.spritesheetConfig.frameWidth / this.spritesheetConfig.frameHeight;
    // Keep height the same, adjust width based on aspect ratio
    this.height = GameConfig.MARTHA_SIZE.height;
    this.width = this.height * frameAspectRatio;

    // Setup rent due meter
    this.rentDueMeter.current = 0;
    this.rentDueMeter.max = level.marthaWantsSockballs;

    // Update bounds to match actual canvas size with 20px inset on left and bottom
    this.bounds.left = GameConfig.THROWING_BOUNDS.LEFT + 20;
    this.bounds.right = this.game.getCanvasWidth();
    this.bounds.bottom = this.game.getCanvasHeight() - 20;

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

    // Reset pattern history
    this.patternHistory = [];

    // Initialize first pattern
    this.switchPattern();
  }

  /**
   * Helper method to safely update facing direction with cooldown
   * @param {boolean} newDirection - The new facing direction (true = right, false = left)
   * @param {number} currentTime - Current timestamp in milliseconds
   * @returns {boolean} Whether the direction was changed
   */
  updateFacingDirection(newDirection, currentTime) {
    // Only change direction if cooldown has elapsed
    if (currentTime - this.lastDirectionChangeTime >= this.directionChangeCooldown) {
      // Only update if the direction is actually changing
      if (this.facingRight !== newDirection) {
        this.facingRight = newDirection;
        this.lastDirectionChangeTime = currentTime;
        return true;
      }
    }
    return false;
  }

  update(deltaTime) {
    // Update animation
    this.updateAnimation(deltaTime);

    this.patternTimer += deltaTime;
    this.patternSwitchTimer += deltaTime;

    // Track current time for direction change cooldown
    const currentTime = Date.now();

    // Update hit effects
    this.updateHitEffects(deltaTime);

    // Handle pattern switching
    if (this.patternSwitchTimer >= this.patternSwitchInterval) {
      this.switchPattern();
      this.patternSwitchTimer = 0;
    }

    // Update movement based on current state
    if (this.isRecovering) {
      this.updateRecoveryMovement(deltaTime, currentTime);
    } else if (this.isExiting) {
      this.updateExitMovement(deltaTime, currentTime);
    } else if (this.isEntering) {
      this.updateEnterMovement(deltaTime, currentTime);
    } else if (this.onScreen) {
      this.updatePatternMovement(deltaTime, currentTime);
    }

    // Apply movement and bounds checking
    this.applyMovement(deltaTime, currentTime);

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

      // Use FPS from the current spritesheet config
      const animationSpeed = 1000 / this.spritesheetConfig.fps;

      if (this.animationTimer >= animationSpeed) {
        this.currentFrameIndex =
          (this.currentFrameIndex + 1) %
          this.spritesheetConfig.animationFrames.length;
        this.animationTimer = 0;
      }
    }
  }

  updateHitEffects(deltaTime) {
    if (this.hitEffect.active) {
      this.hitEffect.timer -= deltaTime;
      this.hitEffect.flashTimer += deltaTime;

      // Apply knockback only if not in recovery mode
      // Recovery takes priority to ensure Martha escapes corners
      if (!this.isRecovering) {
        this.x += this.hitEffect.knockbackVelocity.x;
        this.y += this.hitEffect.knockbackVelocity.y;

        // Reduce knockback velocity
        this.hitEffect.knockbackVelocity.x *= 0.9;
        this.hitEffect.knockbackVelocity.y *= 0.9;
      }

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

  updateExitMovement(deltaTime, currentTime) {
    // Exit at a fixed speed regardless of difficulty
    // Use base level speed without difficulty multiplier
    const baseSpeed = this.speed / GameConfig.getDifficultyMode(this.game.currentDifficulty).speedMultiplier;
    const exitSpeed = baseSpeed * 15;
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

  updateEnterMovement(deltaTime, currentTime) {
    const enterSpeed = this.speed * 2; // Enter at moderate speed
    this.velocity.x = this.exitDirection * enterSpeed;
    this.velocity.y = 0;

    if (this.exitDirection > 0 && this.x <= this.bounds.right - this.width) {
      this.isEntering = false;
      this.x = this.bounds.right - this.width;
    } else if (this.exitDirection < 0 && this.x >= this.bounds.left) {
      this.isEntering = false;
      this.x = this.bounds.left;
    }
  }

  updateRecoveryMovement(deltaTime, currentTime) {
    // Update recovery timer
    this.recoveryTimer += deltaTime;

    // Calculate timeMultiplier for consistent frame-independent movement
    const timeMultiplier = deltaTime / 16.67;

    // Use baseSpeed of 1 (same as pattern movements) with patternSpeed multiplier AND recovery speed multiplier
    const baseSpeed = 1;
    this.velocity.x = this.recoveryDirection.x * baseSpeed * this.patternSpeed * this.recoverySpeedMultiplier * timeMultiplier;
    this.velocity.y = this.recoveryDirection.y * baseSpeed * this.patternSpeed * this.recoverySpeedMultiplier * timeMultiplier;

    // Update facing direction during recovery with cooldown
    if (Math.abs(this.velocity.x) > 0.1) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }

    // End recovery after duration
    if (this.recoveryTimer >= this.recoveryDuration) {
      this.isRecovering = false;
      this.recoveryTimer = 0;
      this.recoverySpeedMultiplier = 1; // Reset speed multiplier
      // Switch to a new random pattern after recovery
      this.switchPattern();
    }
  }

  updatePatternMovement(deltaTime, currentTime) {
    const timeMultiplier = deltaTime / 16.67;

    // Calculate base movement from pattern
    switch (this.currentPattern) {
      case "horizontal":
        this.updateHorizontalPattern(timeMultiplier, currentTime);
        break;
      case "vertical":
        this.updateVerticalPattern(timeMultiplier, currentTime);
        break;
      case "diagonal":
        this.updateDiagonalPattern(timeMultiplier, currentTime);
        break;
      case "circular":
        this.updateCircularPattern(timeMultiplier, currentTime);
        break;
      case "random":
        this.updateRandomPattern(timeMultiplier, currentTime);
        break;
      case "figure-eight":
        this.updateFigureEightPattern(timeMultiplier, currentTime);
        break;
      case "zigzag-horizontal":
        this.updateZigzagHorizontalPattern(timeMultiplier, currentTime);
        break;
      case "zigzag-vertical":
        this.updateZigzagVerticalPattern(timeMultiplier, currentTime);
        break;
      case "spiral":
        this.updateSpiralPattern(timeMultiplier, currentTime);
        break;
      case "bounce":
        this.updateBouncePattern(timeMultiplier, currentTime);
        break;
      case "square":
        this.updateSquarePattern(timeMultiplier, currentTime);
        break;
      case "wave":
        this.updateWavePattern(timeMultiplier, currentTime);
        break;
    }
  }

  updateHorizontalPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.HORIZONTAL.baseSpeed;
    this.velocity.x =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = 0;

    // Update facing direction with cooldown
    this.updateFacingDirection(this.direction > 0, currentTime);
  }

  updateVerticalPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.VERTICAL.baseSpeed;
    this.velocity.x = 0;
    this.velocity.y =
      this.direction * baseSpeed * this.patternSpeed * timeMultiplier;
  }

  updateDiagonalPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.DIAGONAL.baseSpeed;
    if (!this.patternData.diagonalDirection) {
      this.patternData.diagonalDirection = { x: 1, y: 1 };
    }

    // Normalize the diagonal direction to ensure consistent speed
    const length = Math.sqrt(
      this.patternData.diagonalDirection.x ** 2 +
        this.patternData.diagonalDirection.y ** 2
    );
    const normalizedX = this.patternData.diagonalDirection.x / length;
    const normalizedY = this.patternData.diagonalDirection.y / length;

    this.velocity.x = normalizedX * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = normalizedY * baseSpeed * this.patternSpeed * timeMultiplier;

    // Update facing direction with cooldown
    this.updateFacingDirection(this.patternData.diagonalDirection.x > 0, currentTime);
  }

  updateCircularPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.CIRCULAR.baseSpeed;
    if (
      !this.patternData.circularAngle &&
      this.patternData.circularAngle !== 0
    ) {
      // Always calculate center based on screen center for consistency
      this.patternData.centerX =
        this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
      this.patternData.centerY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;

      // Calculate starting angle from Martha's current position
      const dx = this.x + this.width / 2 - this.patternData.centerX;
      const dy = this.y + this.height / 2 - this.patternData.centerY;
      this.patternData.circularAngle = Math.atan2(dy, dx);

      // Use Martha's EXACT current distance from center as the radius
      // NO clamping - this ensures Martha starts the pattern from exactly where she is
      // without any teleporting or jumping
      const currentDistance = Math.sqrt(dx * dx + dy * dy);

      // Ensure we have a minimum radius to prevent division by zero
      // and to maintain reasonable movement speed
      this.patternData.radius = Math.max(50, currentDistance);
    }

    // Update angle based on speed - adjust multiplier to maintain circular speed consistent with linear patterns
    this.patternData.circularAngle +=
      (baseSpeed * this.patternSpeed * timeMultiplier) / this.patternData.radius;

    // Calculate velocity as tangent to the circle for smooth circular motion
    // Tangent velocity: perpendicular to radius, with magnitude = baseSpeed * patternSpeed * timeMultiplier
    this.velocity.x = -Math.sin(this.patternData.circularAngle) * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = Math.cos(this.patternData.circularAngle) * baseSpeed * this.patternSpeed * timeMultiplier;

    // Only update facing direction if velocity is significant enough to avoid flickering
    // Use a deadzone threshold to prevent rapid sprite flipping during circular motion
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateRandomPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.RANDOM.baseSpeed;

    // Change direction less frequently for more predictable movement
    if (Math.random() < 0.004) {
      const angle = Math.random() * Math.PI * 2;
      // Use normalized random direction
      this.patternData.randomDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
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

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateFigureEightPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.FIGURE_EIGHT.baseSpeed;

    if (
      !this.patternData.figureEightAngle &&
      this.patternData.figureEightAngle !== 0
    ) {
      this.patternData.figureEightAngle = 0;
      // Always use screen center for consistency
      this.patternData.centerX =
        this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
      this.patternData.centerY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
      this.patternData.radiusX = Math.min(
        (this.bounds.right - this.bounds.left) / 4,
        200
      );
      this.patternData.radiusY = Math.min(
        (this.bounds.bottom - this.bounds.top) / 4,
        150
      );
    }

    // Figure-8 uses parametric equations: x = sin(t), y = sin(2t)/2
    // The derivative (velocity) is: dx/dt = cos(t), dy/dt = cos(2t)
    const t = this.patternData.figureEightAngle;

    // Calculate the derivative (tangent) at current position
    const dx = Math.cos(t);
    const dy = Math.cos(2 * t);

    // Normalize the velocity vector to ensure consistent speed
    const length = Math.sqrt(dx * dx + dy * dy);
    const normalizedDx = dx / length;
    const normalizedDy = dy / length;

    // Apply velocity with consistent speed
    this.velocity.x = normalizedDx * baseSpeed * this.patternSpeed * timeMultiplier;
    this.velocity.y = normalizedDy * baseSpeed * this.patternSpeed * timeMultiplier;

    // Update angle based on normalized arc length for consistent movement
    this.patternData.figureEightAngle +=
      (baseSpeed * this.patternSpeed * timeMultiplier) / Math.max(this.patternData.radiusX, this.patternData.radiusY);

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateZigzagHorizontalPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.ZIGZAG_HORIZONTAL.baseSpeed;

    if (!this.patternData.zigzagPhase && this.patternData.zigzagPhase !== 0) {
      this.patternData.zigzagPhase = 0;
      // Much larger amplitude for clearly visible zigzag
      this.patternData.zigzagAmplitude = Math.min(
        (this.bounds.bottom - this.bounds.top) / 2.5,
        140
      );
    }

    // Move horizontally with vertical zigzag
    const vx = this.direction * baseSpeed * this.patternSpeed * timeMultiplier;

    // Update phase more slowly for longer, more visible zigzags
    this.patternData.zigzagPhase +=
      baseSpeed * this.patternSpeed * timeMultiplier * 0.015;

    // Calculate vertical velocity from derivative of sine wave
    const phaseVelocity = baseSpeed * this.patternSpeed * timeMultiplier * 0.015;
    const vy = Math.cos(this.patternData.zigzagPhase) * this.patternData.zigzagAmplitude * phaseVelocity;

    // Normalize to maintain consistent overall speed
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length > 0) {
      const targetSpeed = baseSpeed * this.patternSpeed * timeMultiplier;
      this.velocity.x = (vx / length) * targetSpeed;
      this.velocity.y = (vy / length) * targetSpeed;
    } else {
      this.velocity.x = vx;
      this.velocity.y = 0;
    }

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateZigzagVerticalPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.ZIGZAG_VERTICAL.baseSpeed;

    if (!this.patternData.zigzagPhase && this.patternData.zigzagPhase !== 0) {
      this.patternData.zigzagPhase = 0;
      // Much larger amplitude for clearly visible zigzag
      this.patternData.zigzagAmplitude = Math.min(
        (this.bounds.right - this.bounds.left) / 2.5,
        140
      );
    }

    // Move vertically with horizontal zigzag
    const vy = this.direction * baseSpeed * this.patternSpeed * timeMultiplier;

    // Update phase more slowly for longer, more visible zigzags
    this.patternData.zigzagPhase +=
      baseSpeed * this.patternSpeed * timeMultiplier * 0.015;

    // Calculate horizontal velocity from derivative of sine wave
    const phaseVelocity = baseSpeed * this.patternSpeed * timeMultiplier * 0.015;
    const vx = Math.cos(this.patternData.zigzagPhase) * this.patternData.zigzagAmplitude * phaseVelocity;

    // Normalize to maintain consistent overall speed
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length > 0) {
      const targetSpeed = baseSpeed * this.patternSpeed * timeMultiplier;
      this.velocity.x = (vx / length) * targetSpeed;
      this.velocity.y = (vy / length) * targetSpeed;
    } else {
      this.velocity.x = 0;
      this.velocity.y = vy;
    }

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateSpiralPattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.SPIRAL.baseSpeed;

    if (!this.patternData.spiralAngle && this.patternData.spiralAngle !== 0) {
      this.patternData.spiralAngle = 0;
      // Always use screen center for consistency
      this.patternData.centerX =
        this.bounds.left + (this.bounds.right - this.bounds.left) / 2;
      this.patternData.centerY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
      this.patternData.spiralRadius = 50;
      this.patternData.spiralDirection = this.direction; // 1 for outward, -1 for inward
      this.patternData.maxRadius = Math.min(
        (this.bounds.right - this.bounds.left) / 3,
        (this.bounds.bottom - this.bounds.top) / 3
      );
    }

    // Spiral motion: combination of circular motion and radial expansion/contraction
    // For consistent speed, we need to maintain constant linear velocity

    // Update radius change (radial velocity component)
    const radialSpeed = baseSpeed * this.patternSpeed * timeMultiplier * 0.15;
    this.patternData.spiralRadius +=
      this.patternData.spiralDirection * radialSpeed;

    // Reverse direction when hitting limits
    if (this.patternData.spiralRadius > this.patternData.maxRadius) {
      this.patternData.spiralRadius = this.patternData.maxRadius;
      this.patternData.spiralDirection = -1;
    } else if (this.patternData.spiralRadius < 50) {
      this.patternData.spiralRadius = 50;
      this.patternData.spiralDirection = 1;
    }

    // Angular velocity component - adjusted to maintain consistent overall speed
    const angularSpeed = (baseSpeed * this.patternSpeed * timeMultiplier) / Math.max(this.patternData.spiralRadius, 50);
    this.patternData.spiralAngle += angularSpeed;

    // Calculate velocity components: tangential + radial
    const tangentX = -Math.sin(this.patternData.spiralAngle);
    const tangentY = Math.cos(this.patternData.spiralAngle);
    const radialX = Math.cos(this.patternData.spiralAngle);
    const radialY = Math.sin(this.patternData.spiralAngle);

    // Combine tangential and radial components, normalize for consistent speed
    const vx = tangentX * baseSpeed * this.patternSpeed * timeMultiplier + radialX * radialSpeed;
    const vy = tangentY * baseSpeed * this.patternSpeed * timeMultiplier + radialY * radialSpeed;

    this.velocity.x = vx;
    this.velocity.y = vy;

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateBouncePattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.BOUNCE.baseSpeed;

    if (!this.patternData.bounceDirection) {
      // Random initial direction
      const angle = Math.random() * Math.PI * 2;
      this.patternData.bounceDirection = {
        x: Math.cos(angle),
        y: Math.sin(angle),
      };
    }

    this.velocity.x =
      this.patternData.bounceDirection.x *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;
    this.velocity.y =
      this.patternData.bounceDirection.y *
      baseSpeed *
      this.patternSpeed *
      timeMultiplier;

    // Note: Actual bouncing is handled in applyMovement() boundary checking
    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  updateSquarePattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.SQUARE.baseSpeed;

    if (!this.patternData.squareSide && this.patternData.squareSide !== 0) {
      this.patternData.squareSide = 0; // 0=right, 1=down, 2=left, 3=up
      this.patternData.squareProgress = 0;
      this.patternData.squareSize = Math.min(
        (this.bounds.right - this.bounds.left) / 2.5,
        (this.bounds.bottom - this.bounds.top) / 2.5,
        200 // Max size for reasonable square
      );
      // Store starting position for each side
      this.patternData.squareStartX = this.x;
      this.patternData.squareStartY = this.y;
    }

    // Calculate speed for square movement - scales with difficulty
    const squareMovementSpeed = baseSpeed * this.patternSpeed * timeMultiplier;

    // Move in square pattern with clear state transitions
    switch (this.patternData.squareSide) {
      case 0: // Moving right
        this.velocity.x = squareMovementSpeed;
        this.velocity.y = 0;
        this.patternData.squareProgress += Math.abs(this.velocity.x);
        if (this.patternData.squareProgress >= this.patternData.squareSize) {
          this.patternData.squareSide = 1;
          this.patternData.squareProgress = 0;
          this.patternData.squareStartX = this.x;
          this.patternData.squareStartY = this.y;
        }
        break;
      case 1: // Moving down
        this.velocity.x = 0;
        this.velocity.y = squareMovementSpeed;
        this.patternData.squareProgress += Math.abs(this.velocity.y);
        if (this.patternData.squareProgress >= this.patternData.squareSize) {
          this.patternData.squareSide = 2;
          this.patternData.squareProgress = 0;
          this.patternData.squareStartX = this.x;
          this.patternData.squareStartY = this.y;
        }
        break;
      case 2: // Moving left
        this.velocity.x = -squareMovementSpeed;
        this.velocity.y = 0;
        this.patternData.squareProgress += Math.abs(this.velocity.x);
        if (this.patternData.squareProgress >= this.patternData.squareSize) {
          this.patternData.squareSide = 3;
          this.patternData.squareProgress = 0;
          this.patternData.squareStartX = this.x;
          this.patternData.squareStartY = this.y;
        }
        break;
      case 3: // Moving up
        this.velocity.x = 0;
        this.velocity.y = -squareMovementSpeed;
        this.patternData.squareProgress += Math.abs(this.velocity.y);
        if (this.patternData.squareProgress >= this.patternData.squareSize) {
          this.patternData.squareSide = 0;
          this.patternData.squareProgress = 0;
          this.patternData.squareStartX = this.x;
          this.patternData.squareStartY = this.y;
        }
        break;
    }

    this.updateFacingDirection(this.velocity.x > 0, currentTime);
  }

  updateWavePattern(timeMultiplier, currentTime) {
    const baseSpeed = GameConfig.MARTHA_PATTERNS.WAVE.baseSpeed;

    if (!this.patternData.wavePhase && this.patternData.wavePhase !== 0) {
      this.patternData.wavePhase = 0;
      // Much larger amplitude for clearly visible wave motion
      this.patternData.waveAmplitude = Math.min(
        (this.bounds.bottom - this.bounds.top) / 2.5,
        180
      );
      this.patternData.waveCenterY =
        this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
    }

    // Wave pattern: moves horizontally while oscillating vertically in a smooth sine wave
    // Horizontal velocity component
    const vx = this.direction * baseSpeed * this.patternSpeed * timeMultiplier;

    // Update wave phase - slower frequency for longer, more visible waves
    this.patternData.wavePhase +=
      baseSpeed * this.patternSpeed * timeMultiplier * 0.008;

    // Vertical velocity component (derivative of sine wave position)
    // For position y = A * sin(phase), velocity vy = A * cos(phase) * d(phase)/dt
    const phaseVelocity = baseSpeed * this.patternSpeed * timeMultiplier * 0.008;
    const vy = Math.cos(this.patternData.wavePhase) * this.patternData.waveAmplitude * phaseVelocity;

    // Normalize the combined velocity to maintain consistent overall speed
    const length = Math.sqrt(vx * vx + vy * vy);
    if (length > 0) {
      const targetSpeed = baseSpeed * this.patternSpeed * timeMultiplier;
      this.velocity.x = (vx / length) * targetSpeed;
      this.velocity.y = (vy / length) * targetSpeed;
    } else {
      this.velocity.x = vx;
      this.velocity.y = 0;
    }

    // Only update facing direction if velocity is significant enough to avoid flickering
    const velocityThreshold = 0.5;
    if (Math.abs(this.velocity.x) > velocityThreshold) {
      this.updateFacingDirection(this.velocity.x > 0, currentTime);
    }
  }

  applyMovement(deltaTime, currentTime) {
    // Apply velocity
    this.x += this.velocity.x;
    this.y += this.velocity.y;

    // Simple bounds checking with direction reversal
    if (!this.isExiting && !this.isEntering) {
      // Restricted zone: lower left corner (where sockballs are launched from)
      const restrictedZoneSize = 200; // Size of restricted area
      const launchX = GameConfig.SOCKBALL_LAUNCH_POSITION.x;
      const launchY = GameConfig.SOCKBALL_LAUNCH_POSITION.y;

      if (
        this.x < launchX + restrictedZoneSize &&
        this.y > launchY - restrictedZoneSize
      ) {
        // Use gentle push forces that ADD to velocity instead of forcing a minimum
        // This prevents jiggling by working WITH the pattern instead of against it
        const pushForce = 0.5; // Reduced push force for gentler correction

        // Only push if moving INTO the restricted zone, not if already moving away
        if (this.x < launchX + restrictedZoneSize && this.velocity.x < 0) {
          // Only push right if moving left (into the zone)
          this.velocity.x += pushForce;
        }

        if (this.y > launchY - restrictedZoneSize && this.velocity.y > 0) {
          // Only push up if moving down (into the zone)
          this.velocity.y -= pushForce;
        }

        // Update pattern directions only for specific patterns that can be redirected
        // Don't interfere with complex patterns like circular, spiral, etc.
        if (this.currentPattern === "horizontal") {
          this.direction = 1; // Move right
        } else if (this.currentPattern === "vertical") {
          this.direction = -1; // Move up
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.x = 1;
          this.patternData.diagonalDirection.y = -1;
        } else if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          // Ensure bounce direction pushes away from the corner
          this.patternData.bounceDirection.x = Math.abs(this.patternData.bounceDirection.x);
          this.patternData.bounceDirection.y = -Math.abs(this.patternData.bounceDirection.y);
        }
      }

      // Corner threshold - detect when Martha is close to a corner
      const cornerThreshold = this.width;

      // Check for corner positions (prioritize corner recovery over edge recovery)
      const atLeftEdge = this.x <= this.bounds.left;
      const atRightEdge = this.x >= this.bounds.right - this.width;
      const atTopEdge = this.y <= this.bounds.top;
      const atBottomEdge = this.y >= this.bounds.bottom - this.height;

      // Detect corners and apply strong recovery
      const inLowerRightCorner = atRightEdge && atBottomEdge;
      const inLowerLeftCorner = atLeftEdge && atBottomEdge;
      const inUpperRightCorner = atRightEdge && atTopEdge;
      const inUpperLeftCorner = atLeftEdge && atTopEdge;

      // CORNER HANDLING - Takes priority over edge handling
      // Use bounce physics similar to sockballs
      const bounceDamping = GameConfig.BOUNCE_DAMPING || 0.8; // Same as sockballs

      if (inLowerRightCorner) {
        // Lower right corner - bounce off both walls
        this.x = this.bounds.right - this.width;
        this.y = this.bounds.bottom - this.height;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = -Math.abs(this.patternData.bounceDirection.x);
          this.patternData.bounceDirection.y = -Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to escape corner
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoveryDirection = { x: -1, y: -1 }; // Move up-left
          this.recoverySpeedMultiplier = 3; // Faster escape from corner
          this.updateFacingDirection(false, currentTime);
        }
      } else if (inLowerLeftCorner) {
        // Lower left corner - bounce off both walls
        this.x = this.bounds.left;
        this.y = this.bounds.bottom - this.height;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = Math.abs(this.patternData.bounceDirection.x);
          this.patternData.bounceDirection.y = -Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to escape corner
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoveryDirection = { x: 1, y: -1 }; // Move up-right
          this.recoverySpeedMultiplier = 3; // Faster escape from corner
          this.updateFacingDirection(true, currentTime);
        }
      } else if (inUpperRightCorner) {
        // Upper right corner - bounce off both walls
        this.x = this.bounds.right - this.width;
        this.y = this.bounds.top;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = -Math.abs(this.patternData.bounceDirection.x);
          this.patternData.bounceDirection.y = Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to escape corner
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoveryDirection = { x: -1, y: 1 }; // Move down-left
          this.recoverySpeedMultiplier = 3; // Faster escape from corner
          this.updateFacingDirection(false, currentTime);
        }
      } else if (inUpperLeftCorner) {
        // Upper left corner - bounce off both walls
        this.x = this.bounds.left;
        this.y = this.bounds.top;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = Math.abs(this.patternData.bounceDirection.x);
          this.patternData.bounceDirection.y = Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to escape corner
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoveryDirection = { x: 1, y: 1 }; // Move down-right
          this.recoverySpeedMultiplier = 3; // Faster escape from corner
          this.updateFacingDirection(true, currentTime);
        }
      }
      // EDGE HANDLING - Only if not in a corner
      // Use recovery animations to smoothly move away from walls
      else if (atLeftEdge) {
        // Left wall - start recovery animation moving right
        this.x = this.bounds.left;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = Math.abs(this.patternData.bounceDirection.x);
        } else {
          // Start recovery animation to move away from wall
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoverySpeedMultiplier = 2; // Moderate speed for edge escape

          // Determine vertical direction based on position
          const screenMidY = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
          const marthaMidY = this.y + this.height / 2;

          if (marthaMidY > screenMidY) {
            // Below halfway - move right and up
            this.recoveryDirection = { x: 1, y: -1 };
          } else {
            // Above halfway - move right and down
            this.recoveryDirection = { x: 1, y: 1 };
          }

          this.updateFacingDirection(true, currentTime);
        }
      } else if (atRightEdge) {
        // Right wall - start recovery animation moving left
        this.x = this.bounds.right - this.width;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.x = -Math.abs(this.patternData.bounceDirection.x);
        } else {
          // Start recovery animation to move away from wall
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoverySpeedMultiplier = 2; // Moderate speed for edge escape

          // Determine vertical direction based on position
          const screenMidY = this.bounds.top + (this.bounds.bottom - this.bounds.top) / 2;
          const marthaMidY = this.y + this.height / 2;

          if (marthaMidY > screenMidY) {
            // Below halfway - move left and up
            this.recoveryDirection = { x: -1, y: -1 };
          } else {
            // Above halfway - move left and down
            this.recoveryDirection = { x: -1, y: 1 };
          }

          this.updateFacingDirection(false, currentTime);
        }
      } else if (atTopEdge) {
        // Top wall - start recovery animation moving down
        this.y = this.bounds.top;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.y = Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to move away from wall
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoverySpeedMultiplier = 2; // Moderate speed for edge escape

          // Move down and randomly left or right
          const horizontalDir = Math.random() < 0.5 ? -1 : 1;
          this.recoveryDirection = { x: horizontalDir, y: 1 };
        }

        // Update pattern directions for simple patterns
        if (this.currentPattern === "vertical") {
          this.direction = 1;
        } else if (this.patternData.diagonalDirection) {
          this.patternData.diagonalDirection.y = 1;
        }
      } else if (atBottomEdge) {
        // Bottom wall - start recovery animation moving up
        this.y = this.bounds.bottom - this.height;

        if (this.currentPattern === "bounce" && this.patternData.bounceDirection) {
          this.patternData.bounceDirection.y = -Math.abs(this.patternData.bounceDirection.y);
        } else {
          // Start recovery animation to move away from wall
          this.isRecovering = true;
          this.recoveryTimer = 0;
          this.recoverySpeedMultiplier = 2; // Moderate speed for edge escape

          // Move up and randomly left or right
          const horizontalDir = Math.random() < 0.5 ? -1 : 1;
          this.recoveryDirection = { x: horizontalDir, y: -1 };
        }
      }

      // Ensure Martha is always moving (minimum velocity) - skip during recovery
      if (!this.isRecovering) {
        const currentSpeed = Math.sqrt(
          this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y
        );
        const minSpeed = 1.0;
        if (currentSpeed < minSpeed) {
          // If moving too slowly, give a small push
          // IMPORTANT: Only apply minimum velocity push if NOT at an edge boundary
          // Recovery animations handle edge cases, so we should not interfere
          const edgeThreshold = 10; // Increased threshold to avoid jiggling near edges

          // Check if we're near any edge - if so, let the boundary/recovery system handle it
          const nearLeftEdge = this.x <= this.bounds.left + edgeThreshold;
          const nearRightEdge = this.x >= this.bounds.right - this.width - edgeThreshold;
          const nearTopEdge = this.y <= this.bounds.top + edgeThreshold;
          const nearBottomEdge = this.y >= this.bounds.bottom - this.height - edgeThreshold;

          // Only apply minimum velocity if NOT near any edge
          if (!nearLeftEdge && !nearRightEdge && !nearTopEdge && !nearBottomEdge) {
            // Not at edge, use current direction or default right
            const defaultDirection = this.direction || 1;
            this.velocity.x = defaultDirection * minSpeed;
            this.velocity.y = 0;
          }
          // If near an edge and moving slowly, the boundary checks above will handle it
        }
      }

      // Update facing direction based on velocity with cooldown
      if (Math.abs(this.velocity.x) > 0.1) {
        this.updateFacingDirection(this.velocity.x > 0, currentTime);
      }
    }
  }

  switchPattern() {
    if (this.availablePatterns.length > 0) {
      let newPattern;

      // Check if we need to force a different pattern
      const consecutiveCount = this.countConsecutivePatterns();

      // After pattern has been used twice, MUST pick a different one
      if (consecutiveCount >= this.maxConsecutivePatterns && this.availablePatterns.length > 1) {
        // Force a different pattern - 100% guarantee
        const differentPatterns = this.availablePatterns.filter(
          (p) => p !== this.currentPattern
        );
        newPattern =
          differentPatterns[
            Math.floor(Math.random() * differentPatterns.length)
          ];
      } else {
        // Below the limit - random selection (can pick same or different)
        newPattern =
          this.availablePatterns[
            Math.floor(Math.random() * this.availablePatterns.length)
          ];
      }

      // Update current pattern
      this.currentPattern = newPattern;

      // Update pattern history (only if it's different from the last pattern in history)
      if (this.patternHistory.length === 0 || this.patternHistory[this.patternHistory.length - 1] !== newPattern) {
        this.patternHistory.push(newPattern);

        // Keep history to a reasonable length (last 10 patterns)
        if (this.patternHistory.length > 10) {
          this.patternHistory.shift();
        }
      }

      // Clear all pattern data to ensure clean pattern transitions
      // Don't preserve centerX/centerY - let each pattern calculate its own center
      // based on Martha's current position to prevent teleporting
      this.patternData = {};
      this.patternTimer = 0;

      // Reset direction for new pattern
      this.direction = Math.random() < 0.5 ? 1 : -1;
    }
  }

  countConsecutivePatterns() {
    // Count how many times the current pattern appears consecutively at the end of history
    if (this.patternHistory.length === 0) return 0;

    let count = 0;
    for (let i = this.patternHistory.length - 1; i >= 0; i--) {
      if (this.patternHistory[i] === this.currentPattern) {
        count++;
      } else {
        break;
      }
    }

    return count;
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

    // Calculate max distance for catch (using fixed base width for consistency)
    const maxDistance = GameConfig.MARTHA_SIZE.width / 2;

    // Normalized distance (0 = center, 1 = edge of Martha, >1 = beyond edge)
    const normalizedDistance = distance / maxDistance;

    // Determine catch quality
    if (
      normalizedDistance <= GameConfig.CATCH_MECHANICS.PERFECT_CATCH_THRESHOLD
    ) {
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

  hitBySockball(sockball, forcedQuality = null, isBonusHit = false) {
    // Allow hits even during hit effect - removed the blocking check
    // This prevents sockballs from disappearing without counting during the flash effect

    // Bonus hits don't count toward Martha's collection (they're extra!)
    if (!isBonusHit) {
      this.collectedSockballs++;
      // Update rent due meter
      this.rentDueMeter.current = this.collectedSockballs;
    }

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
    // Use difficulty-adjusted points for New Game+
    const points = GameConfig.getCatchQualityPoints(catchQuality.quality, this.game.currentDifficulty);

    // Track perfect catches in game stats
    if (catchQuality.quality === "PERFECT") {
      this.game.perfectCatchStats.total++;
      if (!this.game.perfectCatchStats.byLevel[this.game.currentLevel]) {
        this.game.perfectCatchStats.byLevel[this.game.currentLevel] = 0;
      }
      this.game.perfectCatchStats.byLevel[this.game.currentLevel]++;
    }

    // Points are calculated and awarded at the end of the level in level-end-screen.js
    // Do not add points here to avoid double-counting

    // Play random goblin sound (8 different sounds)
    this.game.audioManager.playRandomSound("goblin-sound", 8, false, 0.5);

    // Activate hit effect
    this.hitEffect.active = true;
    this.hitEffect.timer = GameConfig.MARTHA_HIT_EFFECTS.FLASH_DURATION;
    this.hitEffect.flashTimer = 0;

    // Calculate knockback with wall/corner amplification
    const knockbackForce = GameConfig.MARTHA_HIT_EFFECTS.KNOCKBACK_DISTANCE;
    const angle = Math.atan2(sockball.y - this.y, sockball.x - this.x);

    // Detect if Martha is near walls/corners
    const wallThreshold = this.width * 0.5;
    const atLeftEdge = this.x <= this.bounds.left + wallThreshold;
    const atRightEdge = this.x >= this.bounds.right - this.width - wallThreshold;
    const atTopEdge = this.y <= this.bounds.top + wallThreshold;
    const atBottomEdge = this.y >= this.bounds.bottom - this.height - wallThreshold;

    // Check if in a corner (two edges)
    const inCorner = (atLeftEdge || atRightEdge) && (atTopEdge || atBottomEdge);
    const onWall = atLeftEdge || atRightEdge || atTopEdge || atBottomEdge;

    // Calculate base knockback
    let knockbackX = Math.cos(angle) * knockbackForce;
    let knockbackY = Math.sin(angle) * knockbackForce;

    // Apply amplification if on wall/corner
    if (inCorner) {
      // In corner: trigger immediate recovery animation
      this.isRecovering = true;
      this.recoveryTimer = 0;
      this.recoverySpeedMultiplier = 4; // Very fast escape from corner when hit

      // Determine recovery direction based on which corner
      if (atLeftEdge && atTopEdge) {
        this.recoveryDirection = { x: 1, y: 1 }; // Down-right
      } else if (atLeftEdge && atBottomEdge) {
        this.recoveryDirection = { x: 1, y: -1 }; // Up-right
      } else if (atRightEdge && atTopEdge) {
        this.recoveryDirection = { x: -1, y: 1 }; // Down-left
      } else if (atRightEdge && atBottomEdge) {
        this.recoveryDirection = { x: -1, y: -1 }; // Up-left
      }

      // Still apply knockback for immediate effect
      knockbackX *= 3;
      knockbackY *= 3;
    } else if (onWall) {
      // On wall: amplify perpendicular direction 2.5x
      if (atLeftEdge || atRightEdge) {
        // Amplify vertical movement
        knockbackY *= 2.5;
      }
      if (atTopEdge || atBottomEdge) {
        // Amplify horizontal movement
        knockbackX *= 2.5;
      }
    }

    this.hitEffect.knockbackVelocity = {
      x: knockbackX,
      y: knockbackY,
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
    // Phase 2.1 - Enhanced collision with catch radius multiplier and difficulty scaling
    // Use fixed base size for consistent catch radius regardless of sprite
    const sockballRadius = GameConfig.SOCKBALL_SIZE / 2;
    const difficultyMode = GameConfig.getDifficultyMode(
      this.game.currentDifficulty
    );
    const baseCatchRadius =
      (GameConfig.MARTHA_SIZE.width / 2) *
      GameConfig.CATCH_MECHANICS.CATCH_RADIUS_MULTIPLIER;
    const catchRadius = baseCatchRadius * difficultyMode.catchRadiusMultiplier;

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
  }

  renderCatchZones(ctx) {
    // Calculate Martha's center position
    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    // Use fixed base size for consistent catch zones regardless of sprite
    const baseRadius = GameConfig.MARTHA_SIZE.width / 2;

    // Get the catch radius with multiplier and difficulty scaling
    const difficultyMode = GameConfig.getDifficultyMode(
      this.game.currentDifficulty
    );
    const baseCatchRadius =
      baseRadius * GameConfig.CATCH_MECHANICS.CATCH_RADIUS_MULTIPLIER;
    const catchRadius = baseCatchRadius * difficultyMode.catchRadiusMultiplier;

    // Calculate zone radii based on thresholds
    const perfectRadius =
      baseRadius * GameConfig.CATCH_MECHANICS.PERFECT_CATCH_THRESHOLD;
    const goodRadius =
      baseRadius * GameConfig.CATCH_MECHANICS.GOOD_CATCH_THRESHOLD;
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

    // Get the current animation frame from spritesheet
    const spritesheet = this.spritesheetConfig;
    const frameNumber = spritesheet.animationFrames[this.currentFrameIndex];
    const marthaImage = this.game.images[spritesheet.filename];

    // Debug logging
    if (!marthaImage && !this._loggedImageError) {
      this._loggedImageError = true;
    }

    // Draw Martha using spritesheet
    if (marthaImage && marthaImage.complete && marthaImage.naturalWidth > 0) {
      ctx.save();

      // Calculate which frame in the spritesheet to draw
      const col = frameNumber % spritesheet.columns;
      const row = Math.floor(frameNumber / spritesheet.columns);
      const sx = col * spritesheet.frameWidth;
      const sy = row * spritesheet.frameHeight;

      // Flip horizontally if facing right (sprite faces left by default)
      if (this.facingRight) {
        ctx.translate(this.x + this.width, this.y);
        ctx.scale(-1, 1);
        ctx.drawImage(
          marthaImage,
          sx,
          sy,
          spritesheet.frameWidth,
          spritesheet.frameHeight,
          0,
          0,
          this.width,
          this.height
        );
      } else {
        ctx.drawImage(
          marthaImage,
          sx,
          sy,
          spritesheet.frameWidth,
          spritesheet.frameHeight,
          this.x,
          this.y,
          this.width,
          this.height
        );
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
      ctx.font = `bold ${this.game.getScaledValue(20)}px Arial`;
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
