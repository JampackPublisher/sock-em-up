/**
 * Story Viewer
 * Manages the story panel viewer modal for browsing unlocked story panels
 */
class StoryViewer {
  constructor(game, uiHelpers) {
    this.game = game;
    this.ui = uiHelpers;

    // State
    this.isOpen = false;
    this.currentPanel = 0;
    this.animationProgress = 0;

    // Button configuration
    this.button = {
      x: 0,
      y: 0,
      width: 140,
      height: 40,
      hovered: false,
      hoverProgress: 0,
    };
  }

  /**
   * Open the story viewer modal
   */
  open() {
    const unlockedCount = this.game.unlockedStoryPanels.filter(u => u).length;
    if (unlockedCount === 0) return;

    this.isOpen = true;
    this.currentPanel = 0;
    this.game.audioManager.playSound("button-click", false, 0.5);
  }

  /**
   * Close the story viewer modal
   */
  close() {
    this.isOpen = false;
    this.game.audioManager.playSound("button-click", false, 0.5);
  }

  /**
   * Navigate to the next panel
   */
  nextPanel() {
    const unlockedPanels = this.getUnlockedPanels();
    if (this.currentPanel < unlockedPanels.length - 1) {
      this.currentPanel++;
      this.game.audioManager.playSound("button-click", false, 0.5);
    }
  }

  /**
   * Navigate to the previous panel
   */
  previousPanel() {
    if (this.currentPanel > 0) {
      this.currentPanel--;
      this.game.audioManager.playSound("button-click", false, 0.5);
    }
  }

  /**
   * Get array of unlocked panel indices
   */
  getUnlockedPanels() {
    const unlockedPanels = [];
    for (let i = 0; i < this.game.unlockedStoryPanels.length; i++) {
      if (this.game.unlockedStoryPanels[i]) {
        unlockedPanels.push(i);
      }
    }
    return unlockedPanels;
  }

  /**
   * Update button hover state
   */
  updateButtonHover(x, y, layout) {
    const unlockedCount = this.game.unlockedStoryPanels.filter(u => u).length;
    const isDisabled = unlockedCount === 0;

    // Don't allow hover on disabled button
    if (isDisabled) {
      this.button.hovered = false;
      return;
    }

    const buttonX = layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2;
    const buttonY = layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2;

    this.button.hovered = this.ui.isPointInRect(x, y, {
      x: buttonX,
      y: buttonY,
      width: layout.storyViewerButtonWidth,
      height: layout.storyViewerButtonHeight,
    });
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
   * Handle keyboard input
   */
  handleKeyPress(e) {
    if (!this.isOpen) return false;

    if (e.key === "Escape") {
      this.close();
      e.preventDefault();
      return true;
    }

    const unlockedPanels = this.getUnlockedPanels();

    if (e.key === "ArrowLeft" && this.currentPanel > 0) {
      this.previousPanel();
      e.preventDefault();
      return true;
    }

    if (e.key === "ArrowRight" && this.currentPanel < unlockedPanels.length - 1) {
      this.nextPanel();
      e.preventDefault();
      return true;
    }

    return true; // Consume event if modal is open
  }

  /**
   * Handle mouse clicks
   */
  handleClick(x, y) {
    if (!this.isOpen) return false;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(700);
    const modalHeight = this.game.getScaledValue(480); // Reduced from 600 by 20%
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;
    const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    const unlockedPanels = this.getUnlockedPanels();

    // Check close button (far left)
    if (this.ui.isPointInRect(x, y, {
      x: modalX + this.game.getScaledValue(30),
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight
    })) {
      this.close();
      return true;
    }

    // Check previous button (left of center)
    if (this.currentPanel > 0) {
      const prevX = canvasWidth / 2 - buttonWidth - buttonSpacing / 2;
      if (this.ui.isPointInRect(x, y, {
        x: prevX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      })) {
        this.previousPanel();
        return true;
      }
    }

    // Check next button (right of center)
    if (this.currentPanel < unlockedPanels.length - 1) {
      const nextX = canvasWidth / 2 + buttonSpacing / 2;
      if (this.ui.isPointInRect(x, y, {
        x: nextX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight
      })) {
        this.nextPanel();
        return true;
      }
    }

    return true; // Consume click to prevent background interaction
  }

  /**
   * Render the story viewer button
   */
  renderButton(ctx, layout) {
    const unlockedCount = this.game.unlockedStoryPanels.filter(u => u).length;
    const isDisabled = unlockedCount === 0;

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

    if (isDisabled) {
      // Disabled state - gray gradient
      gradient.addColorStop(0, "rgba(80, 80, 80, 0.6)");
      gradient.addColorStop(1, "rgba(60, 60, 60, 0.6)");
    } else if (this.button.hovered) {
      gradient.addColorStop(0, "rgba(180, 100, 255, 0.95)");
      gradient.addColorStop(1, "rgba(130, 65, 225, 0.95)");
    } else {
      gradient.addColorStop(0, "rgba(150, 80, 200, 0.85)");
      gradient.addColorStop(1, "rgba(100, 50, 180, 0.85)");
    }
    ctx.fillStyle = gradient;

    if (this.button.hovered && !isDisabled) {
      ctx.shadowColor = "rgba(180, 100, 255, 0.6)";
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    ctx.strokeStyle = isDisabled
      ? "rgba(100, 100, 100, 0.4)"
      : this.button.hovered
      ? "rgba(200, 150, 255, 0.9)"
      : "rgba(150, 100, 237, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);

    this.ui.drawRoundedRect(ctx, x, y, layout.storyViewerButtonWidth, layout.storyViewerButtonHeight, radius);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    this.ui.renderText(
      ctx,
      `📚 Panels (${unlockedCount}/9)`,
      layout.storyViewerButtonX,
      layout.storyViewerButtonY,
      {
        fontSize: layout.smallFontSize,
        color: isDisabled ? "rgba(150, 150, 150, 0.7)" : "white",
        weight: "bold",
        align: "center",
        baseline: "middle",
      }
    );
  }

  /**
   * Render the story viewer modal
   */
  renderModal(ctx, layout) {
    if (!this.isOpen) return;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    ctx.save();

    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.75)";
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Modal dimensions
    const modalWidth = this.game.getScaledValue(700);
    const modalHeight = this.game.getScaledValue(480); // Reduced from 600 by 20%
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
    this.ui.drawRoundedRect(ctx, modalX, modalY, modalWidth, modalHeight, radius);
    ctx.fill();

    // Modal border
    ctx.strokeStyle = "rgba(180, 100, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.shadowColor = "rgba(180, 100, 255, 0.4)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    this.ui.drawRoundedRect(ctx, modalX, modalY, modalWidth, modalHeight, radius);
    ctx.stroke();

    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;

    // Title
    this.ui.renderText(
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

    const unlockedPanels = this.getUnlockedPanels();

    if (unlockedPanels.length === 0) {
      this.ui.renderText(
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
    if (this.currentPanel >= unlockedPanels.length) {
      this.currentPanel = 0;
    }

    const panelIndex = unlockedPanels[this.currentPanel];
    const panel = GameConfig.STORY_PANELS[panelIndex];

    // Render panel content
    this.renderPanelContent(ctx, layout, panel, modalX, modalY, modalWidth, modalHeight);

    // Render navigation buttons
    this.renderNavigationButtons(ctx, modalX, modalY, modalWidth, modalHeight, unlockedPanels.length);

    ctx.restore();
  }

  /**
   * Render the content of the current panel
   */
  renderPanelContent(ctx, layout, panel, modalX, modalY, modalWidth, modalHeight) {
    const canvasWidth = this.game.getCanvasWidth();

    // Panel image
    const maxImageSize = this.game.getScaledValue(120);
    const imageY = modalY + this.game.getScaledValue(80);

    if (panel.image && this.game.images[panel.image]) {
      const image = this.game.images[panel.image];

      // Calculate aspect ratio preserving dimensions
      const aspectRatio = image.width / image.height;
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

      const imageX = canvasWidth / 2 - imageWidth / 2;

      ctx.save();
      ctx.shadowColor = "rgba(180, 100, 255, 0.3)";
      ctx.shadowBlur = this.game.getScaledValue(10);
      ctx.drawImage(
        image,
        imageX,
        imageY,
        imageWidth,
        imageHeight
      );
      ctx.restore();
    }

    // Panel title
    const titleY = imageY + maxImageSize + this.game.getScaledValue(20);
    this.ui.renderText(
      ctx,
      panel.title,
      canvasWidth / 2,
      titleY,
      {
        fontSize: this.game.getScaledValue(20),
        color: "#FFD700",
        weight: "bold",
        align: "center",
      }
    );

    // Panel text (word-wrapped)
    const textY = titleY + this.game.getScaledValue(35);
    const textMaxWidth = modalWidth - this.game.getScaledValue(100);
    const lineHeight = this.game.getScaledValue(20);

    const lines = this.ui.wrapText(ctx, panel.text, textMaxWidth, layout.bodyFontSize);

    ctx.font = `${layout.bodyFontSize}px Courier New`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Limit lines to prevent overlap
    const maxLines = 8;
    const displayLines = lines.slice(0, maxLines);

    displayLines.forEach((line, index) => {
      ctx.fillText(line, canvasWidth / 2, textY + index * lineHeight);
    });

    // Add ellipsis if text was truncated
    if (lines.length > maxLines) {
      ctx.fillText("...", canvasWidth / 2, textY + maxLines * lineHeight);
    }
  }

  /**
   * Render navigation buttons
   */
  renderNavigationButtons(ctx, modalX, modalY, modalWidth, modalHeight, totalPanels) {
    const canvasWidth = this.game.getCanvasWidth();
    const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    // Unlock progress message - above the buttons
    const totalStoryPanels = this.game.unlockedStoryPanels.length;
    const unlockedCount = this.getUnlockedPanels().length;
    this.ui.renderText(
      ctx,
      `Unlock the full story by beating every level (${unlockedCount}/${totalStoryPanels})`,
      canvasWidth / 2,
      buttonY - this.game.getScaledValue(25),
      {
        fontSize: this.game.getScaledValue(12),
        color: unlockedCount === totalStoryPanels ? "rgba(255, 215, 0, 0.9)" : "rgba(180, 100, 255, 0.7)",
        align: "center",
      }
    );

    // Close button - far left
    this.renderNavigationButton(
      ctx,
      modalX + this.game.getScaledValue(30),
      buttonY,
      buttonWidth,
      buttonHeight,
      "Close",
      true
    );

    // Previous button - left of center
    if (this.currentPanel > 0) {
      const prevX = canvasWidth / 2 - buttonWidth - buttonSpacing / 2;
      this.renderNavigationButton(ctx, prevX, buttonY, buttonWidth, buttonHeight, "Previous", false);
    }

    // Next button - right of center
    if (this.currentPanel < totalPanels - 1) {
      const nextX = canvasWidth / 2 + buttonSpacing / 2;
      this.renderNavigationButton(ctx, nextX, buttonY, buttonWidth, buttonHeight, "Next", false);
    }

    // Page counter - far right
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `${this.game.getScaledValue(14)}px Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${this.currentPanel + 1} / ${totalPanels}`,
      modalX + modalWidth - this.game.getScaledValue(30),
      buttonY + buttonHeight / 2
    );
    ctx.restore();
  }

  /**
   * Render a single navigation button
   */
  renderNavigationButton(ctx, x, y, width, height, text, isClose) {
    const radius = this.game.getScaledValue(8);

    ctx.save();

    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    if (isClose) {
      gradient.addColorStop(0, "rgba(136, 136, 136, 0.8)");
      gradient.addColorStop(1, "rgba(100, 100, 100, 0.8)");
    } else {
      gradient.addColorStop(0, "rgba(74, 144, 226, 0.8)");
      gradient.addColorStop(1, "rgba(52, 101, 158, 0.8)");
    }
    ctx.fillStyle = gradient;
    this.ui.drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.fill();

    ctx.strokeStyle = isClose ? "rgba(255, 255, 255, 0.5)" : "rgba(150, 200, 255, 0.6)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.ui.drawRoundedRect(ctx, x, y, width, height, radius);
    ctx.stroke();

    ctx.restore();

    this.ui.renderText(ctx, text, x + width / 2, y + height / 2, {
      fontSize: this.game.getScaledValue(18),
      color: "white",
      weight: "bold",
      align: "center",
      baseline: "middle",
    });
  }
}
