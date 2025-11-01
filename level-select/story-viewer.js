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

    // Navigation buttons hover states
    this.navButtons = {
      close: { hovered: false },
      previous: { hovered: false },
      next: { hovered: false },
    };

    // Spritesheet animation state
    this.currentFrame = 0;
    this.frameTimer = 0;

    // Pulse animation for unviewed panels
    this.pulseTimer = 0;
  }

  /**
   * Open the story viewer modal
   */
  open() {
    const unlockedCount = this.game.unlockedStoryPanels.filter((u) => u).length;
    if (unlockedCount === 0) return;

    this.isOpen = true;

    // Find the earliest unviewed panel
    const unlockedPanels = this.getUnlockedPanels();
    let earliestUnviewed = 0;
    for (let i = 0; i < unlockedPanels.length; i++) {
      const panelIndex = unlockedPanels[i];
      if (!this.game.viewedStoryPanels[panelIndex]) {
        earliestUnviewed = i;
        break;
      }
    }

    this.currentPanel = earliestUnviewed;

    // Mark the current panel as viewed
    if (unlockedPanels.length > 0) {
      const panelIndex = unlockedPanels[this.currentPanel];
      this.game.viewedStoryPanels[panelIndex] = true;

      // Check for LORE_MASTER achievement - unlock when viewing panel 9 (index 8)
      if (panelIndex === 8) {
        this.game.unlockAchievement("lore_master");
      }

      this.game.saveGameData();
    }

    this.resetSpriteAnimation();
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

      // Mark the new panel as viewed
      const panelIndex = unlockedPanels[this.currentPanel];
      this.game.viewedStoryPanels[panelIndex] = true;

      // Check for LORE_MASTER achievement - unlock when viewing panel 9 (index 8)
      if (panelIndex === 8) {
        this.game.unlockAchievement("lore_master");
      }

      this.game.saveGameData();

      this.resetSpriteAnimation();
      this.game.audioManager.playSound("button-click", false, 0.5);
    }
  }

  /**
   * Navigate to the previous panel
   */
  previousPanel() {
    if (this.currentPanel > 0) {
      this.currentPanel--;

      // Mark the new panel as viewed
      const unlockedPanels = this.getUnlockedPanels();
      const panelIndex = unlockedPanels[this.currentPanel];
      this.game.viewedStoryPanels[panelIndex] = true;

      // Check for LORE_MASTER achievement - unlock when viewing panel 9 (index 8)
      if (panelIndex === 8) {
        this.game.unlockAchievement("lore_master");
      }

      this.game.saveGameData();

      this.resetSpriteAnimation();
      this.game.audioManager.playSound("button-click", false, 0.5);
    }
  }

  /**
   * Reset spritesheet animation
   */
  resetSpriteAnimation() {
    this.currentFrame = 0;
    this.frameTimer = 0;
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
   * Check if there are any unlocked but unviewed panels
   */
  hasUnviewedPanels() {
    for (let i = 0; i < this.game.unlockedStoryPanels.length; i++) {
      if (this.game.unlockedStoryPanels[i] && !this.game.viewedStoryPanels[i]) {
        return true;
      }
    }
    return false;
  }

  /**
   * Update button hover state
   */
  updateButtonHover(x, y, layout) {
    const unlockedCount = this.game.unlockedStoryPanels.filter((u) => u).length;
    const isDisabled = unlockedCount === 0;

    // Don't allow hover on disabled button
    if (isDisabled) {
      this.button.hovered = false;
      return;
    }

    const buttonX =
      layout.storyViewerButtonX - layout.storyViewerButtonWidth / 2;
    const buttonY =
      layout.storyViewerButtonY - layout.storyViewerButtonHeight / 2;

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
    // Update pulse animation timer (for unviewed panels indicator)
    this.pulseTimer += deltaTime;

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

    // Update spritesheet animation if current panel has a spritesheet
    if (this.isOpen) {
      const unlockedPanels = this.getUnlockedPanels();
      const panelIndex = unlockedPanels[this.currentPanel];
      const panel = GameConfig.STORY_PANELS[panelIndex];
      if (panel && panel.spritesheet) {
        const spritesheetConfig = GameConfig[panel.spritesheet];
        if (spritesheetConfig) {
          const msPerFrame = 1000 / spritesheetConfig.fps;
          this.frameTimer += deltaTime;

          if (this.frameTimer >= msPerFrame) {
            this.currentFrame =
              (this.currentFrame + 1) % spritesheetConfig.animationFrames.length;
            this.frameTimer = 0;
          }
        }
      }
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

    if (
      e.key === "ArrowRight" &&
      this.currentPanel < unlockedPanels.length - 1
    ) {
      this.nextPanel();
      e.preventDefault();
      return true;
    }

    return true; // Consume event if modal is open
  }

  /**
   * Handle mouse movement for hover detection
   */
  handleMouseMove(x, y) {
    if (!this.isOpen) return false;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(900);
    const modalHeight = this.game.getScaledValue(480);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;
    const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    const unlockedPanels = this.getUnlockedPanels();

    // Check close button hover
    this.navButtons.close.hovered = this.ui.isPointInRect(x, y, {
      x: modalX + this.game.getScaledValue(30),
      y: buttonY,
      width: buttonWidth,
      height: buttonHeight,
    });

    // Check previous button hover
    if (this.currentPanel > 0) {
      const prevX = modalX + modalWidth - buttonWidth * 2 - buttonSpacing - this.game.getScaledValue(30);
      this.navButtons.previous.hovered = this.ui.isPointInRect(x, y, {
        x: prevX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
      });
    } else {
      this.navButtons.previous.hovered = false;
    }

    // Check next button hover
    if (this.currentPanel < unlockedPanels.length - 1) {
      const nextX = modalX + modalWidth - buttonWidth - this.game.getScaledValue(30);
      this.navButtons.next.hovered = this.ui.isPointInRect(x, y, {
        x: nextX,
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
      });
    } else {
      this.navButtons.next.hovered = false;
    }

    // Update cursor
    const anyButtonHovered =
      this.navButtons.close.hovered ||
      this.navButtons.previous.hovered ||
      this.navButtons.next.hovered;
    this.game.canvas.style.cursor = anyButtonHovered ? "pointer" : "default";

    return true;
  }

  /**
   * Handle mouse clicks
   */
  handleClick(x, y) {
    if (!this.isOpen) return false;

    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const modalWidth = this.game.getScaledValue(900);
    const modalHeight = this.game.getScaledValue(480);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;
    const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    const unlockedPanels = this.getUnlockedPanels();

    // Check close button (far left)
    if (
      this.ui.isPointInRect(x, y, {
        x: modalX + this.game.getScaledValue(30),
        y: buttonY,
        width: buttonWidth,
        height: buttonHeight,
      })
    ) {
      this.close();
      return true;
    }

    // Check previous button (right side, first button)
    if (this.currentPanel > 0) {
      const prevX = modalX + modalWidth - buttonWidth * 2 - buttonSpacing - this.game.getScaledValue(30);
      if (
        this.ui.isPointInRect(x, y, {
          x: prevX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
        })
      ) {
        this.previousPanel();
        return true;
      }
    }

    // Check next button (right side, second button)
    if (this.currentPanel < unlockedPanels.length - 1) {
      const nextX = modalX + modalWidth - buttonWidth - this.game.getScaledValue(30);
      if (
        this.ui.isPointInRect(x, y, {
          x: nextX,
          y: buttonY,
          width: buttonWidth,
          height: buttonHeight,
        })
      ) {
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
    const unlockedCount = this.game.unlockedStoryPanels.filter((u) => u).length;
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

    this.ui.drawRoundedRect(
      ctx,
      x,
      y,
      layout.storyViewerButtonWidth,
      layout.storyViewerButtonHeight,
      radius
    );
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

    // Modal dimensions - match How to Play
    const modalWidth = this.game.getScaledValue(900);
    const modalHeight = this.game.getScaledValue(480);
    const modalX = (canvasWidth - modalWidth) / 2;
    const modalY = (canvasHeight - modalHeight) / 2;
    const radius = this.game.getScaledValue(20);

    // Modal background - match How to Play style
    ctx.save();
    ctx.shadowColor = "rgba(100, 150, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(30);

    const bgGradient = ctx.createLinearGradient(
      modalX,
      modalY,
      modalX,
      modalY + modalHeight
    );
    bgGradient.addColorStop(0, "rgba(40, 40, 80, 0.98)");
    bgGradient.addColorStop(0.5, "rgba(30, 30, 60, 0.98)");
    bgGradient.addColorStop(1, "rgba(20, 20, 50, 0.98)");
    ctx.fillStyle = bgGradient;
    this.ui.drawRoundedRect(
      ctx,
      modalX,
      modalY,
      modalWidth,
      modalHeight,
      radius
    );
    ctx.fill();

    // Simple border with glow
    ctx.strokeStyle = "rgba(120, 170, 255, 0.7)";
    ctx.lineWidth = this.game.getScaledValue(4);
    this.ui.drawRoundedRect(
      ctx,
      modalX,
      modalY,
      modalWidth,
      modalHeight,
      radius
    );
    ctx.stroke();

    ctx.restore();

    // Inner highlight
    ctx.save();
    const highlightGradient = ctx.createLinearGradient(
      modalX,
      modalY,
      modalX,
      modalY + modalHeight * 0.3
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGradient;
    this.ui.drawRoundedRect(
      ctx,
      modalX + 2,
      modalY + 2,
      modalWidth - 4,
      modalHeight * 0.3,
      this.game.getScaledValue(18)
    );
    ctx.fill();
    ctx.restore();

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
    this.renderPanelContent(
      ctx,
      layout,
      panel,
      panelIndex,
      modalX,
      modalY,
      modalWidth,
      modalHeight
    );

    // Render navigation buttons
    this.renderNavigationButtons(
      ctx,
      modalX,
      modalY,
      modalWidth,
      modalHeight,
      unlockedPanels.length
    );

    ctx.restore();
  }

  /**
   * Render the content of the current panel
   */
  renderPanelContent(
    ctx,
    layout,
    panel,
    panelIndex,
    modalX,
    modalY,
    modalWidth,
    modalHeight
  ) {
    const canvasWidth = this.game.getCanvasWidth();

    // Full-width semi-transparent black title bar with rounded top corners
    ctx.save();
    const titleBarHeight = this.game.getScaledValue(55);
    const cornerRadius = this.game.getScaledValue(20);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";

    // Draw rounded rectangle for title bar (only top corners rounded)
    ctx.beginPath();
    ctx.moveTo(modalX + cornerRadius, modalY);
    ctx.lineTo(modalX + modalWidth - cornerRadius, modalY);
    ctx.quadraticCurveTo(modalX + modalWidth, modalY, modalX + modalWidth, modalY + cornerRadius);
    ctx.lineTo(modalX + modalWidth, modalY + titleBarHeight);
    ctx.lineTo(modalX, modalY + titleBarHeight);
    ctx.lineTo(modalX, modalY + cornerRadius);
    ctx.quadraticCurveTo(modalX, modalY, modalX + cornerRadius, modalY);
    ctx.closePath();
    ctx.fill();

    // Title text with glow
    ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(36)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(panel.title, modalX + modalWidth / 2, modalY + titleBarHeight / 2);
    ctx.restore();

    // Side-by-side layout: Image on left, text on right
    const mainContentY = modalY + this.game.getScaledValue(70);
    const leftPanelWidth = modalWidth * 0.42;
    const rightPanelWidth = modalWidth * 0.52;
    const leftPanelX = modalX + this.game.getScaledValue(30);
    const rightPanelX = leftPanelX + leftPanelWidth + this.game.getScaledValue(25);

    // Left panel - Image with container
    ctx.save();

    // Image container background with subtle gradient
    const imageContainerHeight = this.game.getScaledValue(280);
    const frameGradient = ctx.createRadialGradient(
      leftPanelX + leftPanelWidth / 2,
      mainContentY + imageContainerHeight / 2,
      this.game.getScaledValue(50),
      leftPanelX + leftPanelWidth / 2,
      mainContentY + imageContainerHeight / 2,
      this.game.getScaledValue(180)
    );
    frameGradient.addColorStop(0, "rgba(60, 40, 100, 0.3)");
    frameGradient.addColorStop(1, "rgba(40, 25, 80, 0.15)");
    ctx.fillStyle = frameGradient;
    this.ui.drawRoundedRect(
      ctx,
      leftPanelX,
      mainContentY,
      leftPanelWidth,
      imageContainerHeight,
      this.game.getScaledValue(15)
    );
    ctx.fill();

    // Container border
    ctx.strokeStyle = "rgba(120, 170, 255, 0.4)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.ui.drawRoundedRect(
      ctx,
      leftPanelX,
      mainContentY,
      leftPanelWidth,
      imageContainerHeight,
      this.game.getScaledValue(15)
    );
    ctx.stroke();

    // Panel image
    const maxImageSize = this.game.getScaledValue(280);
    let actualImageHeight = maxImageSize; // Track actual rendered height

    // Check if this panel uses a spritesheet
    if (panel.spritesheet) {
      const spritesheetConfig = GameConfig[panel.spritesheet];
      const spritesheetImage = this.game.images[spritesheetConfig.filename];

      if (spritesheetImage && spritesheetConfig) {
        // Calculate aspect ratio from frame dimensions
        const aspectRatio =
          spritesheetConfig.frameWidth / spritesheetConfig.frameHeight;
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

        actualImageHeight = imageHeight; // Store actual height
        const imageX = leftPanelX + leftPanelWidth / 2 - imageWidth / 2;
        const imageY = mainContentY + imageContainerHeight / 2 - imageHeight / 2;

        // Get current frame from animation sequence
        const frameIndex =
          spritesheetConfig.animationFrames[this.currentFrame];
        const frameX =
          (frameIndex % spritesheetConfig.columns) *
          spritesheetConfig.frameWidth;
        const frameY =
          Math.floor(frameIndex / spritesheetConfig.columns) *
          spritesheetConfig.frameHeight;

        ctx.save();
        ctx.shadowColor = "rgba(180, 100, 255, 0.3)";
        ctx.shadowBlur = this.game.getScaledValue(10);

        // Draw the current frame from the spritesheet
        ctx.drawImage(
          spritesheetImage,
          frameX,
          frameY,
          spritesheetConfig.frameWidth,
          spritesheetConfig.frameHeight,
          imageX,
          imageY,
          imageWidth,
          imageHeight
        );
        ctx.restore();
      }
    } else if (panel.image && this.game.images[panel.image]) {
      // Static image fallback
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

      actualImageHeight = imageHeight; // Store actual height
      const imageX = leftPanelX + leftPanelWidth / 2 - imageWidth / 2;
      const imageY = mainContentY + imageContainerHeight / 2 - imageHeight / 2;

      ctx.save();
      ctx.shadowColor = "rgba(255, 100, 200, 0.4)";
      ctx.shadowBlur = this.game.getScaledValue(20);
      ctx.shadowOffsetY = this.game.getScaledValue(8);
      ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
    }

    ctx.restore();

    // Right panel - Text content (no box, just the text)
    ctx.save();

    // Main text content - positioned to align nicely with image
    const textStartY = mainContentY + this.game.getScaledValue(85);
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `${this.game.getScaledValue(20)}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "top";

    // Word wrap text with better line height
    const lineHeight = this.game.getScaledValue(28);
    const lines = this.ui.wrapText(
      ctx,
      panel.text,
      rightPanelWidth,
      this.game.getScaledValue(20)
    );

    // Limit lines to prevent overlap
    const maxLines = 8;
    const displayLines = lines.slice(0, maxLines);

    displayLines.forEach((line, index) => {
      ctx.fillText(line, rightPanelX, textStartY + index * lineHeight);
    });

    // Add ellipsis if text was truncated
    if (lines.length > maxLines) {
      ctx.fillText("...", rightPanelX, textStartY + maxLines * lineHeight);
    }

    ctx.restore();
  }

  /**
   * Render navigation buttons
   */
  renderNavigationButtons(
    ctx,
    modalX,
    modalY,
    modalWidth,
    modalHeight,
    totalPanels
  ) {
    const canvasWidth = this.game.getCanvasWidth();
    const buttonY = modalY + modalHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    // Close button - far left
    this.renderNavigationButton(
      ctx,
      modalX + this.game.getScaledValue(30),
      buttonY,
      buttonWidth,
      buttonHeight,
      "Close",
      true,
      this.navButtons.close.hovered
    );

    // Previous button - right side, first button
    if (this.currentPanel > 0) {
      const prevX = modalX + modalWidth - buttonWidth * 2 - buttonSpacing - this.game.getScaledValue(30);
      this.renderNavigationButton(
        ctx,
        prevX,
        buttonY,
        buttonWidth,
        buttonHeight,
        "Previous",
        false,
        this.navButtons.previous.hovered
      );
    }

    // Next button - right side, second button
    if (this.currentPanel < totalPanels - 1) {
      const nextX = modalX + modalWidth - buttonWidth - this.game.getScaledValue(30);
      this.renderNavigationButton(
        ctx,
        nextX,
        buttonY,
        buttonWidth,
        buttonHeight,
        "Next",
        false,
        this.navButtons.next.hovered
      );
    }

    // Centered page counter
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${this.currentPanel + 1} / ${totalPanels}`,
      modalX + modalWidth / 2,
      modalY + modalHeight - this.game.getScaledValue(32)
    );
    ctx.restore();
  }

  /**
   * Render a single navigation button
   */
  renderNavigationButton(ctx, x, y, width, height, text, isClose, hovered = false) {
    ctx.save();

    // Determine which button image to use
    let buttonImage = null;
    if (isClose) {
      buttonImage = this.game.images["btn-exit.png"];
    } else if (text === "Next") {
      buttonImage = this.game.images["btn-next.png"];
    } else if (text === "Previous") {
      buttonImage = this.game.images["btn-back.png"];
    }

    // If we have a button image, use it
    if (buttonImage) {
      // Calculate dimensions to fit the button while maintaining aspect ratio
      const aspectRatio = buttonImage.width / buttonImage.height;
      let imgWidth = width;
      let imgHeight = imgWidth / aspectRatio;

      // If height is too large, scale by height instead
      if (imgHeight > height) {
        imgHeight = height;
        imgWidth = imgHeight * aspectRatio;
      }

      const imgX = x + (width - imgWidth) / 2;
      const imgY = y + (height - imgHeight) / 2;

      // Apply hover effect - scale and add glow
      if (hovered) {
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = x + (width - scaledWidth) / 2;
        const scaledY = y + (height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    }

    ctx.restore();
  }
}
