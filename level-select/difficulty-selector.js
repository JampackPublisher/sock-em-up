/**
 * Difficulty Selector
 * Dropdown component for selecting NEW GAME+ difficulty levels
 * Located in the top bar, opens downward
 */
class DifficultySelector {
  constructor(game, uiHelpers) {
    this.game = game;
    this.ui = uiHelpers;

    // State
    this.isOpen = false;
    this.hoveredOption = -1;

    // Button configuration
    this.button = {
      x: 0,
      y: 0,
      width: 200,
      height: 45,
      hovered: false,
      hoverProgress: 0,
    };

    // Dropdown configuration
    this.dropdown = {
      x: 0,
      y: 0,
      width: 250,
      optionHeight: 50,
      options: [], // Will be populated based on unlocked difficulties
    };
  }

  /**
   * Get the display name for a difficulty level
   */
  getDifficultyName(difficulty) {
    if (difficulty === 0) return "Base Game";
    return `New Game +${difficulty}`;
  }

  /**
   * Check if a difficulty level has been completed (all 9 levels beaten)
   */
  isDifficultyCompleted(difficulty) {
    const levels = this.game.completedLevelsByDifficulty[difficulty];
    if (!levels) {
      return false;
    }

    // Check if all 9 levels are completed
    const allCompleted = levels.every((completed) => completed === true);
    return allCompleted;
  }

  /**
   * Update button position (called from layout calculation)
   */
  updateLayout(layout) {
    // Get canvas width to calculate center position
    const canvasWidth = this.game.getCanvasWidth();

    // Position centered horizontally in the top bar
    this.button.width = this.game.getScaledValue(200);
    this.button.height = this.game.getScaledValue(45);

    // Center the button horizontally in the screen, offset 180px to the left, aligned vertically with other top bar buttons
    this.button.x =
      canvasWidth / 2 - this.button.width / 2 - this.game.getScaledValue(180);
    this.button.y = layout.barY + layout.barHeight / 2 - this.button.height / 2;

    // Dropdown appears below the button, opens downward
    this.dropdown.width = this.game.getScaledValue(250);
    this.dropdown.optionHeight = this.game.getScaledValue(50);
    this.dropdown.x = this.button.x;
    this.dropdown.y =
      layout.barY + layout.barHeight + this.game.getScaledValue(5);

    // Build options list based on unlocked difficulties
    this.dropdown.options = [];
    for (let i = 0; i <= this.game.highestUnlockedDifficulty; i++) {
      this.dropdown.options.push({
        difficulty: i,
        name: this.getDifficultyName(i),
        completed: this.isDifficultyCompleted(i),
      });
    }
  }

  /**
   * Toggle dropdown open/close
   */
  toggle() {
    this.isOpen = !this.isOpen;
    if (this.isOpen) {
      this.game.audioManager.playSound("button-click", false, 0.5);
    }
  }

  /**
   * Close the dropdown
   */
  close() {
    this.isOpen = false;
    this.hoveredOption = -1;
  }

  /**
   * Select a difficulty level
   */
  selectDifficulty(difficulty) {
    if (difficulty <= this.game.highestUnlockedDifficulty) {
      this.game.selectedDifficulty = difficulty;

      // Initialize arrays for this difficulty if they don't exist
      if (!this.game.unlockedLevelsByDifficulty[difficulty]) {
        this.game.unlockedLevelsByDifficulty[difficulty] = [
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
      if (!this.game.completedLevelsByDifficulty[difficulty]) {
        this.game.completedLevelsByDifficulty[difficulty] = [
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

      // Update legacy pointers to point to the selected difficulty's arrays
      this.game.unlockedLevels = this.game.unlockedLevelsByDifficulty[difficulty];
      this.game.completedLevels = this.game.completedLevelsByDifficulty[difficulty];

      this.game.audioManager.playSound("button-click", false, 0.6);
      this.close();

      // Save the selected difficulty
      this.game.saveGameData();
    }
  }

  /**
   * Check if button or dropdown is hovered
   */
  isButtonHovered() {
    return this.button.hovered || (this.isOpen && this.hoveredOption !== -1);
  }

  /**
   * Update button hover state
   */
  updateButtonHover(x, y) {
    const wasHovered = this.button.hovered;
    this.button.hovered = this.ui.isPointInRect(x, y, {
      x: this.button.x,
      y: this.button.y,
      width: this.button.width,
      height: this.button.height,
    });

    // Play sound on hover change
    if (this.button.hovered && !wasHovered) {
      this.game.audioManager.playSound("button-click", false, 0.2);
    }
  }

  /**
   * Update dropdown hover state
   */
  updateDropdownHover(x, y) {
    if (!this.isOpen) return;

    this.hoveredOption = -1;
    for (let i = 0; i < this.dropdown.options.length; i++) {
      const optionY = this.dropdown.y + i * this.dropdown.optionHeight;
      if (
        this.ui.isPointInRect(x, y, {
          x: this.dropdown.x,
          y: optionY,
          width: this.dropdown.width,
          height: this.dropdown.optionHeight,
        })
      ) {
        this.hoveredOption = i;
        break;
      }
    }
  }

  /**
   * Update animations
   */
  update(deltaTime) {
    // Update button hover animation
    const buttonAnimSpeed = 0.008;
    const target = this.button.hovered ? 1 : 0;

    if (this.button.hoverProgress < target) {
      this.button.hoverProgress = Math.min(
        this.button.hoverProgress + buttonAnimSpeed * deltaTime,
        target
      );
    } else if (this.button.hoverProgress > target) {
      this.button.hoverProgress = Math.max(
        this.button.hoverProgress - buttonAnimSpeed * deltaTime,
        target
      );
    }
  }

  /**
   * Handle mouse clicks
   */
  handleClick(x, y) {
    // Check if clicked on button
    if (
      this.ui.isPointInRect(x, y, {
        x: this.button.x,
        y: this.button.y,
        width: this.button.width,
        height: this.button.height,
      })
    ) {
      this.toggle();
      return true;
    }

    // Check if clicked on dropdown option
    if (this.isOpen) {
      for (let i = 0; i < this.dropdown.options.length; i++) {
        const optionY = this.dropdown.y + i * this.dropdown.optionHeight;
        if (
          this.ui.isPointInRect(x, y, {
            x: this.dropdown.x,
            y: optionY,
            width: this.dropdown.width,
            height: this.dropdown.optionHeight,
          })
        ) {
          this.selectDifficulty(this.dropdown.options[i].difficulty);
          return true;
        }
      }

      // Clicked outside dropdown - close it
      this.close();
      return true;
    }

    return false;
  }

  /**
   * Handle keyboard input
   */
  handleKeyPress(e) {
    if (!this.isOpen) return false;

    if (e.key === "Escape") {
      this.close();
      e.preventDefault();
      return true;
    }

    return false;
  }

  /**
   * Render the difficulty selector button
   */
  renderButton(ctx) {
    ctx.save();

    const buttonImage = this.game.images["btn-difficulty.png"];

    if (buttonImage) {
      // Use the pixel art button image
      const imageAspectRatio = buttonImage.width / buttonImage.height;

      // Fit to height to maintain consistent button heights
      const drawHeight = this.button.height;
      const drawWidth = drawHeight * imageAspectRatio;
      const drawX = this.button.x + (this.button.width - drawWidth) / 2;
      const drawY = this.button.y;

      // Apply hover and open effects
      if (this.button.hovered || this.isOpen) {
        ctx.globalAlpha = 1.0;
        ctx.shadowColor = "rgba(255, 255, 255, 0.5)";
        ctx.shadowBlur = 10;
      } else {
        ctx.globalAlpha = 0.9;
      }

      ctx.drawImage(buttonImage, drawX, drawY, drawWidth, drawHeight);

      // Reset effects
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1.0;
    } else {
      // Fallback to original rendering if image not loaded
      const radius = this.game.getScaledValue(8);

      // Button background with gradient
      const gradient = ctx.createLinearGradient(
        this.button.x,
        this.button.y,
        this.button.x,
        this.button.y + this.button.height
      );

      if (this.button.hovered || this.isOpen) {
        gradient.addColorStop(0, "rgba(100, 150, 255, 0.95)");
        gradient.addColorStop(1, "rgba(60, 100, 200, 0.95)");
      } else {
        gradient.addColorStop(0, "rgba(80, 120, 200, 0.85)");
        gradient.addColorStop(1, "rgba(50, 80, 160, 0.85)");
      }
      ctx.fillStyle = gradient;

      // Add glow if hovered or open
      if (this.button.hovered || this.isOpen) {
        ctx.shadowColor = "rgba(100, 150, 255, 0.6)";
        ctx.shadowBlur = this.game.getScaledValue(12);
      }

      // Button border
      ctx.strokeStyle =
        this.button.hovered || this.isOpen
          ? "rgba(150, 200, 255, 0.9)"
          : "rgba(100, 150, 255, 0.6)";
      ctx.lineWidth = this.game.getScaledValue(3);

      this.ui.drawRoundedRect(
        ctx,
        this.button.x,
        this.button.y,
        this.button.width,
        this.button.height,
        radius
      );
      ctx.fill();
      ctx.stroke();

      ctx.restore();

      // Button text
      const currentDifficultyName = this.getDifficultyName(
        this.game.selectedDifficulty
      );
      this.ui.renderText(
        ctx,
        currentDifficultyName,
        this.button.x + this.button.width / 2,
        this.button.y + this.button.height / 2,
        {
          fontSize: this.game.getScaledValue(16),
          color: "white",
          weight: "bold",
          align: "center",
          baseline: "middle",
        }
      );

      // Dropdown arrow indicator
      ctx.save();
      ctx.fillStyle = "white";
      ctx.font = `${this.game.getScaledValue(12)}px Arial`;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      ctx.fillText(
        this.isOpen ? "▲" : "▼",
        this.button.x + this.button.width - this.game.getScaledValue(10),
        this.button.y + this.button.height / 2
      );
    }
    ctx.restore();
  }

  /**
   * Render the dropdown menu
   */
  renderDropdown(ctx) {
    if (!this.isOpen) return;

    ctx.save();

    const radius = this.game.getScaledValue(8);
    const dropdownHeight =
      this.dropdown.options.length * this.dropdown.optionHeight;

    // Dropdown background
    ctx.fillStyle = "rgba(30, 30, 60, 0.98)";
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    this.ui.drawRoundedRect(
      ctx,
      this.dropdown.x,
      this.dropdown.y,
      this.dropdown.width,
      dropdownHeight,
      radius
    );
    ctx.fill();

    // Dropdown border
    ctx.strokeStyle = "rgba(100, 150, 255, 0.8)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.ui.drawRoundedRect(
      ctx,
      this.dropdown.x,
      this.dropdown.y,
      this.dropdown.width,
      dropdownHeight,
      radius
    );
    ctx.stroke();

    ctx.restore();

    // Render each option
    for (let i = 0; i < this.dropdown.options.length; i++) {
      this.renderOption(ctx, i);
    }
  }

  /**
   * Render a single dropdown option
   */
  renderOption(ctx, index) {
    const option = this.dropdown.options[index];
    const optionY = this.dropdown.y + index * this.dropdown.optionHeight;
    const isHovered = this.hoveredOption === index;
    const isSelected = option.difficulty === this.game.selectedDifficulty;

    ctx.save();

    // Highlight if hovered
    if (isHovered) {
      ctx.fillStyle = "rgba(100, 150, 255, 0.3)";
      ctx.fillRect(
        this.dropdown.x,
        optionY,
        this.dropdown.width,
        this.dropdown.optionHeight
      );
    }

    // Highlight if selected
    if (isSelected) {
      ctx.fillStyle = "rgba(100, 200, 100, 0.2)";
      ctx.fillRect(
        this.dropdown.x,
        optionY,
        this.dropdown.width,
        this.dropdown.optionHeight
      );
    }

    // Option text
    const textX = this.dropdown.x + this.game.getScaledValue(15);
    const textY = optionY + this.dropdown.optionHeight / 2;

    // Show star if completed
    let displayText = option.name;
    if (option.completed) {
      displayText = `★ ${option.name}`;
      ctx.fillStyle = "#FFD700";
    } else {
      ctx.fillStyle = "white";
    }

    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(displayText, textX, textY);

    // Show checkmark if selected
    if (isSelected) {
      ctx.fillStyle = "#90EE90";
      ctx.font = `${this.game.getScaledValue(18)}px Arial`;
      ctx.textAlign = "right";
      ctx.fillText(
        "✓",
        this.dropdown.x + this.dropdown.width - this.game.getScaledValue(15),
        textY
      );
    }

    // Separator line (except for last option)
    if (index < this.dropdown.options.length - 1) {
      ctx.strokeStyle = "rgba(100, 150, 255, 0.3)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(
        this.dropdown.x + this.game.getScaledValue(10),
        optionY + this.dropdown.optionHeight
      );
      ctx.lineTo(
        this.dropdown.x + this.dropdown.width - this.game.getScaledValue(10),
        optionY + this.dropdown.optionHeight
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  /**
   * Main render function
   */
  render(ctx, layout) {
    this.renderButton(ctx);
    this.renderDropdown(ctx);
  }
}
