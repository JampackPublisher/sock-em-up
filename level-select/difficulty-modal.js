/**
 * Difficulty Modal
 * Manages the NEW GAME+ difficulty selection modal
 */
class DifficultyModal {
  constructor(game, uiHelpers) {
    this.game = game;
    this.ui = uiHelpers;

    // State
    this.isOpen = false;
    this.selectedLevel = -1;
    this.selectedDifficulty = 0;
    this.hoveredDifficulty = -1;
    this.animationProgress = 0;
    this.buttons = [];
  }

  /**
   * Open the difficulty modal for a specific level
   */
  open(levelIndex) {
    this.isOpen = true;
    this.selectedLevel = levelIndex;
    this.selectedDifficulty = 0;
    this.hoveredDifficulty = -1;
    this.animationProgress = 0;

    this.setupButtons();
  }

  /**
   * Close the difficulty modal
   */
  close() {
    this.isOpen = false;
    this.selectedLevel = -1;
  }

  /**
   * Setup difficulty buttons
   */
  setupButtons() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(600);
    const modalHeight = this.game.getScaledValue(500);
    const modalY = (canvasHeight - modalHeight) / 2;

    this.buttons = [];

    // Validate currentDifficulty to prevent invalid loop bounds
    const maxDifficulty = Math.max(
      0,
      Math.min(
        this.game.currentDifficulty || 0,
        GameConfig.MAX_DIFFICULTY || 10
      )
    );

    for (let i = 0; i <= maxDifficulty; i++) {
      this.buttons.push({
        difficulty: i,
        x: canvasWidth / 2 - this.game.getScaledValue(250),
        y: modalY + this.game.getScaledValue(140 + i * 80),
        width: this.game.getScaledValue(500),
        height: this.game.getScaledValue(60),
      });
    }
  }

  /**
   * Start level with selected difficulty
   */
  startLevel(difficulty) {
    this.close();
    this.game.startLevel(this.selectedLevel, difficulty);
  }

  /**
   * Update animations
   */
  update(deltaTime) {
    if (this.isOpen) {
      this.animationProgress = Math.min(
        1,
        this.animationProgress + deltaTime * 0.004
      );
    } else {
      this.animationProgress = Math.max(
        0,
        this.animationProgress - deltaTime * 0.006
      );
    }
  }

  /**
   * Update button hover states
   */
  updateHover(x, y) {
    if (!this.isOpen) return;

    this.hoveredDifficulty = -1;
    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        this.hoveredDifficulty = button.difficulty;
        break;
      }
    }

    // Update cursor
    this.game.canvas.style.cursor =
      this.hoveredDifficulty !== -1 ? "pointer" : "default";
  }

  /**
   * Handle mouse clicks
   */
  handleClick(x, y) {
    if (!this.isOpen) return false;

    // Check if clicked on any button
    for (const button of this.buttons) {
      if (
        x >= button.x &&
        x <= button.x + button.width &&
        y >= button.y &&
        y <= button.y + button.height
      ) {
        this.game.audioManager.playSound("button-click", false, 0.5);
        this.startLevel(button.difficulty);
        return true;
      }
    }

    // Check if clicked outside modal (to close)
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
      this.close();
    }

    return true; // Consume all clicks when modal is open
  }

  /**
   * Render the difficulty modal
   */
  render(ctx, layout) {
    if (this.animationProgress === 0) return;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(600);
    const modalHeight = this.game.getScaledValue(500);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;

    const progress = this.easeOutBack(this.animationProgress);

    ctx.save();
    ctx.globalAlpha = this.animationProgress;

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
    const levelNum = this.selectedLevel + 1;
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
    for (const button of this.buttons) {
      this.renderButton(ctx, button);
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

  /**
   * Render a single difficulty button
   */
  renderButton(ctx, button) {
    const difficultyMode = GameConfig.getDifficultyMode(button.difficulty);
    const isHovered = this.hoveredDifficulty === button.difficulty;
    const isCompleted =
      this.game.completedLevelsByDifficulty[button.difficulty] &&
      this.game.completedLevelsByDifficulty[button.difficulty][
        this.selectedLevel
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
    ctx.fillText(
      difficultyMode.name,
      button.x + button.width / 2,
      button.y + this.game.getScaledValue(20)
    );

    // Difficulty description
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = `${this.game.getScaledValue(14)}px Arial`;
    ctx.fillText(
      difficultyMode.description,
      button.x + button.width / 2,
      button.y + this.game.getScaledValue(45)
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

  /**
   * Ease out back animation
   */
  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }
}
