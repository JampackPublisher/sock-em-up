// 📁 story-manager.js - Phase 4.1 Story Intro System
// Manages the story intro sequence and modal displays

class StoryManager {
  constructor(game) {
    this.game = game;

    // Story state
    this.showingStory = false;
    this.currentSlideIndex = 0;
    this.slides = GameConfig.STORY_SLIDES;
    this.transitionProgress = 0;
    this.isTransitioning = false;
    this.transitionDuration = 400; // ms
    this.transitionDirection = 1; // 1 for next, -1 for previous
    this.previousSlideIndex = 0; // Track previous slide during transitions

    // Opening/closing animations
    this.openProgress = 0;
    this.closeProgress = 0;
    this.isOpening = false;
    this.isClosing = false;
    this.animationDuration = 500; // ms

    // UI elements
    this.slideContainer = {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      padding: 40,
    };

    this.buttons = {
      skip: { x: 0, y: 0, width: 100, height: 40, hovered: false },
      next: { x: 0, y: 0, width: 100, height: 40, hovered: false },
      previous: { x: 0, y: 0, width: 100, height: 40, hovered: false },
    };

    // Spritesheet animation state
    this.currentFrame = 0;
    this.frameTimer = 0;
    this.lastUpdateTime = Date.now();
  }

  // Start showing the story intro
  show() {
    this.showingStory = true;
    this.currentSlideIndex = 0;
    this.transitionProgress = 0;
    this.isTransitioning = false;
    this.isOpening = true;
    this.isClosing = false;
    this.openProgress = 0;
    this.closeProgress = 0;

    // Reset button hover states to prevent touch event persistence
    this.buttons.skip.hovered = false;
    this.buttons.next.hovered = false;
    this.buttons.previous.hovered = false;

    this.calculateLayout();
  }

  // Hide the story intro
  hide() {
    // Start close animation instead of immediately hiding
    this.isClosing = true;
    this.closeProgress = 0;
  }

  // Actually hide the story after animation completes
  completeHide() {
    this.showingStory = false;
    this.currentSlideIndex = 0;
    this.isClosing = false;

    // Mark story as viewed
    if (!this.game.storyViewed) {
      this.game.storyViewed = true;
      this.game.saveGameData();
    }
  }

  // Check if we should show story (first time playing)
  shouldShowStory() {
    return !this.game.storyViewed;
  }

  calculateLayout() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Optimized container size - not as tall
    const containerWidth = Math.min(
      this.game.getScaledValue(900),
      canvasWidth * 0.92
    );
    const containerHeight = Math.min(
      this.game.getScaledValue(480),
      canvasHeight * 0.8
    );

    this.slideContainer = {
      width: containerWidth,
      height: containerHeight,
      x: (canvasWidth - containerWidth) / 2,
      y: (canvasHeight - containerHeight) / 2,
      padding: this.game.getScaledValue(35),
    };

    // Position buttons at the bottom
    const buttonY =
      this.slideContainer.y + containerHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    // Skip button - far left
    this.buttons.skip.x = this.slideContainer.x + this.game.getScaledValue(10);
    this.buttons.skip.y = buttonY;
    this.buttons.skip.width = buttonWidth;
    this.buttons.skip.height = buttonHeight;

    // Previous button - right side, first button
    this.buttons.previous.x =
      this.slideContainer.x +
      this.slideContainer.width -
      buttonWidth * 2 -
      buttonSpacing -
      this.game.getScaledValue(10);
    this.buttons.previous.y = buttonY;
    this.buttons.previous.width = buttonWidth;
    this.buttons.previous.height = buttonHeight;

    // Next button - right side, second button
    this.buttons.next.x =
      this.slideContainer.x +
      this.slideContainer.width -
      buttonWidth -
      this.game.getScaledValue(10);
    this.buttons.next.y = buttonY;
    this.buttons.next.width = buttonWidth;
    this.buttons.next.height = buttonHeight;
  }

  update(deltaTime) {
    if (!this.showingStory && !this.isClosing) return;

    // Update opening animation
    if (this.isOpening) {
      this.openProgress += deltaTime / this.animationDuration;
      if (this.openProgress >= 1) {
        this.openProgress = 1;
        this.isOpening = false;
      }
    }

    // Update closing animation
    if (this.isClosing) {
      this.closeProgress += deltaTime / this.animationDuration;
      if (this.closeProgress >= 1) {
        this.closeProgress = 1;
        this.completeHide();
      }
    }

    // Update transition animation
    if (this.isTransitioning) {
      this.transitionProgress += deltaTime / this.transitionDuration;
      if (this.transitionProgress >= 1) {
        this.transitionProgress = 1;
        this.isTransitioning = false;
      }
    }

    // Update spritesheet animation
    const currentSlide = this.slides[this.currentSlideIndex];
    if (currentSlide && currentSlide.spritesheet) {
      const spritesheetConfig = GameConfig[currentSlide.spritesheet];
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

  handleMouseMove(x, y) {
    if (!this.showingStory) return false;

    // Check button hovers
    let anyButtonHovered = false;
    for (const key in this.buttons) {
      const button = this.buttons[key];
      const wasHovered = button.hovered;
      button.hovered = this.isPointInRect(x, y, button);
      if (button.hovered) anyButtonHovered = true;
    }

    // Update cursor
    this.game.canvas.style.cursor = anyButtonHovered ? "pointer" : "default";

    return true;
  }

  handleKeyDown(e) {
    if (!this.showingStory) return;

    // Escape to skip/close story
    if (e.key === "Escape") {
      this.hide();
      e.preventDefault();
    }
    // Left arrow or 'a' for previous slide
    else if (e.key === "ArrowLeft" || e.key === "a" || e.key === "A") {
      if (this.currentSlideIndex > 0) {
        this.previousSlide();
        e.preventDefault();
      }
    }
    // Right arrow, Enter, Space, or 'd' for next slide
    else if (
      e.key === "ArrowRight" ||
      e.key === "Enter" ||
      e.key === " " ||
      e.key === "d" ||
      e.key === "D"
    ) {
      if (this.currentSlideIndex < this.slides.length - 1) {
        this.nextSlide();
      } else {
        // Last slide - close story
        this.hide();
      }
      e.preventDefault();
    }
  }

  handleClick(x, y) {
    if (!this.showingStory) return false;

    // Check buttons using direct hit detection instead of hover states
    // This ensures touch events work properly even without touchmove events

    // Skip button
    if (this.isPointInRect(x, y, this.buttons.skip)) {
      this.ensureMusicIsPlaying();
      this.hide();
      return true;
    }

    // Previous button (only if not on first slide)
    if (
      this.currentSlideIndex > 0 &&
      this.isPointInRect(x, y, this.buttons.previous)
    ) {
      this.ensureMusicIsPlaying();
      this.previousSlide();
      return true;
    }

    // Next button
    if (this.isPointInRect(x, y, this.buttons.next)) {
      this.ensureMusicIsPlaying();
      if (this.currentSlideIndex < this.slides.length - 1) {
        this.nextSlide();
      } else {
        // Last slide - close story
        this.hide();
      }
      return true;
    }

    return true; // Consume click even if not on button
  }

  // Ensure background music is playing after user interaction
  ensureMusicIsPlaying() {
    // Enable audio manager if not already enabled
    if (!this.game.audioManager.enabled) {
      this.game.audioManager.enable();
    }

    // Check if music should be playing but isn't
    if (
      !this.game.audioManager.currentMusic ||
      this.game.audioManager.currentMusic.paused
    ) {
      this.game.audioManager.playMusic("menu-music", true);
    }
  }

  nextSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.transitionDirection = 1;
      this.previousSlideIndex = this.currentSlideIndex;
      this.currentSlideIndex++;
      this.startTransition();
    }
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.transitionDirection = -1;
      this.previousSlideIndex = this.currentSlideIndex;
      this.currentSlideIndex--;
      this.startTransition();
    }
  }

  startTransition() {
    this.isTransitioning = true;
    this.transitionProgress = 0;
    this.resetSpriteAnimation();
  }

  resetSpriteAnimation() {
    this.currentFrame = 0;
    this.frameTimer = 0;
  }

  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  render(ctx) {
    if (!this.showingStory && !this.isClosing) return;

    // Recalculate layout to ensure it's centered on current canvas size
    this.calculateLayout();

    ctx.save();

    // Calculate animation progress
    let animProgress = 1;
    if (this.isOpening) {
      animProgress = this.easeOutElastic(this.openProgress);
    } else if (this.isClosing) {
      animProgress = 1 - this.easeInBack(this.closeProgress);
    }

    // Darken background with fade
    const bgAlpha = this.isClosing
      ? 0.85 * (1 - this.closeProgress)
      : this.isOpening
      ? 0.85 * this.openProgress
      : 0.85;
    ctx.fillStyle = `rgba(0, 0, 0, ${bgAlpha})`;
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // Apply scale and position animation
    ctx.save();
    const centerX = this.game.getCanvasWidth() / 2;
    const centerY = this.game.getCanvasHeight() / 2;
    ctx.translate(centerX, centerY);
    ctx.scale(animProgress, animProgress);
    ctx.translate(-centerX, -centerY);

    // Render slide container
    this.renderSlideContainer(ctx, animProgress);

    // Render current slide (or previous during first half of transition)
    let slideToRender;
    if (this.isTransitioning && this.transitionProgress < 0.5) {
      // First half of transition: show previous slide fading out
      slideToRender = this.slides[this.previousSlideIndex];
    } else {
      // Second half or no transition: show current slide
      slideToRender = this.slides[this.currentSlideIndex];
    }

    if (slideToRender) {
      this.renderSlide(ctx, slideToRender);
    }

    // Render buttons
    this.renderButtons(ctx);

    // Render slide indicators
    this.renderSlideIndicators(ctx);

    ctx.restore();
  }

  renderSlideContainer(ctx, animProgress) {
    const container = this.slideContainer;

    // Outer glow effect
    ctx.save();
    ctx.shadowColor = "rgba(100, 150, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(30) * animProgress;

    // Clean gradient background - no patterns
    const gradient = ctx.createLinearGradient(
      container.x,
      container.y,
      container.x,
      container.y + container.height
    );
    gradient.addColorStop(0, "rgba(40, 40, 80, 0.98)");
    gradient.addColorStop(0.5, "rgba(30, 30, 60, 0.98)");
    gradient.addColorStop(1, "rgba(20, 20, 50, 0.98)");

    ctx.fillStyle = gradient;
    this.drawRoundedRect(
      ctx,
      container.x,
      container.y,
      container.width,
      container.height,
      this.game.getScaledValue(20)
    );
    ctx.fill();

    // Simple border with glow
    ctx.strokeStyle = "rgba(120, 170, 255, 0.7)";
    ctx.lineWidth = this.game.getScaledValue(4);
    this.drawRoundedRect(
      ctx,
      container.x,
      container.y,
      container.width,
      container.height,
      this.game.getScaledValue(20)
    );
    ctx.stroke();

    ctx.restore();

    // Inner highlight
    ctx.save();
    const highlightGradient = ctx.createLinearGradient(
      container.x,
      container.y,
      container.x,
      container.y + container.height * 0.3
    );
    highlightGradient.addColorStop(0, "rgba(255, 255, 255, 0.1)");
    highlightGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
    ctx.fillStyle = highlightGradient;
    this.drawRoundedRect(
      ctx,
      container.x + 2,
      container.y + 2,
      container.width - 4,
      container.height * 0.3,
      this.game.getScaledValue(18)
    );
    ctx.fill();
    ctx.restore();
  }

  renderSlide(ctx, slide) {
    const container = this.slideContainer;
    const contentY = container.y + container.padding;

    // Apply simple fade transition - fade out completely, then fade in
    let alpha = 1;
    if (this.isTransitioning) {
      const t = this.transitionProgress;

      if (t < 0.5) {
        // First half: fade out
        alpha = 1 - t * 2;
      } else {
        // Second half: fade in
        alpha = (t - 0.5) * 2;
      }
    }

    ctx.save();
    ctx.globalAlpha = alpha;

    // Full-width semi-transparent black title bar with rounded top corners
    ctx.save();
    const titleBarHeight = this.game.getScaledValue(55);
    const cornerRadius = this.game.getScaledValue(20);

    ctx.fillStyle = "rgba(0, 0, 0, 0.4)";

    // Draw rounded rectangle for title bar (only top corners rounded)
    ctx.beginPath();
    ctx.moveTo(container.x + cornerRadius, container.y);
    ctx.lineTo(container.x + container.width - cornerRadius, container.y);
    ctx.quadraticCurveTo(
      container.x + container.width,
      container.y,
      container.x + container.width,
      container.y + cornerRadius
    );
    ctx.lineTo(container.x + container.width, container.y + titleBarHeight);
    ctx.lineTo(container.x, container.y + titleBarHeight);
    ctx.lineTo(container.x, container.y + cornerRadius);
    ctx.quadraticCurveTo(
      container.x,
      container.y,
      container.x + cornerRadius,
      container.y
    );
    ctx.closePath();
    ctx.fill();

    // Title text with glow
    ctx.shadowColor = "rgba(255, 215, 0, 0.6)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(36)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      slide.title,
      container.x + container.width / 2,
      container.y + titleBarHeight / 2
    );
    ctx.restore();

    // Side-by-side layout: Image on left, text on right
    const mainContentY = container.y + this.game.getScaledValue(70);
    const leftPanelWidth = container.width * 0.42;
    const rightPanelWidth = container.width * 0.52;
    const leftPanelX = container.x + this.game.getScaledValue(30);
    const rightPanelX =
      leftPanelX + leftPanelWidth + this.game.getScaledValue(25);

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
    this.drawRoundedRect(
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
    this.drawRoundedRect(
      ctx,
      leftPanelX,
      mainContentY,
      leftPanelWidth,
      imageContainerHeight,
      this.game.getScaledValue(15)
    );
    ctx.stroke();

    // Image (larger now!)
    if (slide.spritesheet) {
      const spritesheetConfig = GameConfig[slide.spritesheet];
      const spritesheetImage = this.game.images[spritesheetConfig.filename];

      if (spritesheetImage && spritesheetConfig) {
        const maxImageSize = this.game.getScaledValue(280);

        // Calculate aspect ratio from frame dimensions
        const aspectRatio =
          spritesheetConfig.frameWidth / spritesheetConfig.frameHeight;
        let imageWidth, imageHeight;

        if (aspectRatio > 1) {
          imageWidth = maxImageSize;
          imageHeight = maxImageSize / aspectRatio;
        } else {
          imageHeight = maxImageSize;
          imageWidth = maxImageSize * aspectRatio;
        }

        const imageX = leftPanelX + leftPanelWidth / 2 - imageWidth / 2;
        const imageY =
          mainContentY + imageContainerHeight / 2 - imageHeight / 2;

        // Get current frame from animation sequence
        const frameIndex = spritesheetConfig.animationFrames[this.currentFrame];
        const frameX =
          (frameIndex % spritesheetConfig.columns) *
          spritesheetConfig.frameWidth;
        const frameY =
          Math.floor(frameIndex / spritesheetConfig.columns) *
          spritesheetConfig.frameHeight;

        // Subtle floating animation - disabled during transitions
        const floatOffset = this.isTransitioning
          ? 0
          : Math.sin(Date.now() / 800) * this.game.getScaledValue(3);
        const imageScale = this.isTransitioning
          ? 1
          : 1 + Math.sin(Date.now() / 1000) * 0.02;

        ctx.save();
        ctx.translate(
          imageX + imageWidth / 2,
          imageY + imageHeight / 2 + floatOffset
        );
        ctx.scale(imageScale, imageScale);
        ctx.translate(-(imageX + imageWidth / 2), -(imageY + imageHeight / 2));

        // Enhanced shadow
        ctx.shadowColor = "rgba(255, 100, 200, 0.4)";
        ctx.shadowBlur = this.game.getScaledValue(20);
        ctx.shadowOffsetY = this.game.getScaledValue(8);

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
    } else {
      // Static image fallback
      const image = this.game.images[slide.image];
      if (image) {
        const maxImageSize = this.game.getScaledValue(280);

        const aspectRatio = image.width / image.height;
        let imageWidth, imageHeight;

        if (aspectRatio > 1) {
          imageWidth = maxImageSize;
          imageHeight = maxImageSize / aspectRatio;
        } else {
          imageHeight = maxImageSize;
          imageWidth = maxImageSize * aspectRatio;
        }

        const imageX = leftPanelX + leftPanelWidth / 2 - imageWidth / 2;
        const imageY =
          mainContentY + imageContainerHeight / 2 - imageHeight / 2;

        // Subtle floating animation - disabled during transitions
        const floatOffset = this.isTransitioning
          ? 0
          : Math.sin(Date.now() / 800) * this.game.getScaledValue(3);
        const imageScale = this.isTransitioning
          ? 1
          : 1 + Math.sin(Date.now() / 1000) * 0.02;

        ctx.save();
        ctx.translate(
          imageX + imageWidth / 2,
          imageY + imageHeight / 2 + floatOffset
        );
        ctx.scale(imageScale, imageScale);
        ctx.translate(-(imageX + imageWidth / 2), -(imageY + imageHeight / 2));

        // Enhanced shadow
        ctx.shadowColor = "rgba(255, 100, 200, 0.4)";
        ctx.shadowBlur = this.game.getScaledValue(20);
        ctx.shadowOffsetY = this.game.getScaledValue(8);

        ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
        ctx.restore();
      }
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
    this.wrapText(
      ctx,
      slide.text,
      rightPanelX,
      textStartY,
      rightPanelWidth,
      this.game.getScaledValue(28)
    );

    ctx.restore();

    ctx.restore();
  }

  renderButtons(ctx) {
    // Skip button
    this.renderButton(ctx, this.buttons.skip, "Skip", "#888888");

    // Previous button (only if not on first slide)
    if (this.currentSlideIndex > 0) {
      this.renderButton(ctx, this.buttons.previous, "Previous", "#4A90E2");
    }

    // Next button
    const isLastSlide = this.currentSlideIndex === this.slides.length - 1;
    this.renderButton(
      ctx,
      this.buttons.next,
      isLastSlide ? "Start" : "Next",
      "#4CAF50"
    );
  }

  renderButton(ctx, button, text, color) {
    ctx.save();

    // Determine which button image to use based on text
    let buttonImage = null;
    const isNext = text === "Next" || text === "Start";
    const isPrevious = text === "Previous";
    const isSkip = text === "Skip";

    if (isNext) {
      buttonImage = this.game.images["btn-next.png"];
    } else if (isPrevious) {
      buttonImage = this.game.images["btn-back.png"];
    } else if (isSkip) {
      buttonImage = this.game.images["btn-skip.png"];
    }

    // If we have a button image, use it
    if (buttonImage) {
      // Calculate dimensions to fit the button while maintaining aspect ratio
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

      // Apply hover effect - scale and add glow
      if (button.hovered) {
        ctx.shadowColor = "rgba(255, 215, 0, 0.8)";
        ctx.shadowBlur = this.game.getScaledValue(20);

        // Scale up slightly on hover
        const scale = 1.05;
        const scaledWidth = imgWidth * scale;
        const scaledHeight = imgHeight * scale;
        const scaledX = button.x + (button.width - scaledWidth) / 2;
        const scaledY = button.y + (button.height - scaledHeight) / 2;

        ctx.drawImage(buttonImage, scaledX, scaledY, scaledWidth, scaledHeight);
      } else {
        ctx.drawImage(buttonImage, imgX, imgY, imgWidth, imgHeight);
      }
    } else {
      // Fallback if images not loaded - use gradient style
      // Enhanced button with gradient and shadow
      if (button.hovered) {
        ctx.shadowColor = color;
        ctx.shadowBlur = this.game.getScaledValue(15);
      }

      // Button gradient background
      const buttonGradient = ctx.createLinearGradient(
        button.x,
        button.y,
        button.x,
        button.y + button.height
      );

      if (button.hovered) {
        buttonGradient.addColorStop(0, this.lightenColor(color, 0.2));
        buttonGradient.addColorStop(1, color);
      } else {
        buttonGradient.addColorStop(0, color + "DD");
        buttonGradient.addColorStop(1, color + "AA");
      }

      ctx.fillStyle = buttonGradient;
      this.drawRoundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        this.game.getScaledValue(10)
      );
      ctx.fill();

      // Button shine effect
      const shineGradient = ctx.createLinearGradient(
        button.x,
        button.y,
        button.x,
        button.y + button.height * 0.5
      );
      shineGradient.addColorStop(0, "rgba(255, 255, 255, 0.3)");
      shineGradient.addColorStop(1, "rgba(255, 255, 255, 0)");
      ctx.fillStyle = shineGradient;
      this.drawRoundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height * 0.5,
        this.game.getScaledValue(10)
      );
      ctx.fill();

      // Button border
      ctx.strokeStyle = button.hovered
        ? "rgba(255, 255, 255, 0.9)"
        : "rgba(255, 255, 255, 0.4)";
      ctx.lineWidth = button.hovered
        ? this.game.getScaledValue(3)
        : this.game.getScaledValue(2);
      this.drawRoundedRect(
        ctx,
        button.x,
        button.y,
        button.width,
        button.height,
        this.game.getScaledValue(10)
      );
      ctx.stroke();

      // Button text with shadow
      ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
      ctx.shadowBlur = this.game.getScaledValue(4);
      ctx.shadowOffsetY = this.game.getScaledValue(2);
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${this.game.getScaledValue(17)}px Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(
        text,
        button.x + button.width / 2,
        button.y + button.height / 2
      );
    }

    ctx.restore();
  }

  lightenColor(color, amount) {
    // Simple color lightening - parse hex color and lighten
    const num = parseInt(color.replace("#", ""), 16);
    const r = Math.min(255, ((num >> 16) & 0xff) + Math.floor(255 * amount));
    const g = Math.min(255, ((num >> 8) & 0xff) + Math.floor(255 * amount));
    const b = Math.min(255, (num & 0xff) + Math.floor(255 * amount));
    return "#" + ((r << 16) | (g << 8) | b).toString(16).padStart(6, "0");
  }

  renderSlideIndicators(ctx) {
    const container = this.slideContainer;

    // Centered page counter text
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${this.currentSlideIndex + 1} / ${this.slides.length}`,
      container.x + container.width / 2,
      container.y + container.height - this.game.getScaledValue(32)
    );
    ctx.restore();
  }

  drawRoundedRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  wrapText(ctx, text, x, y, maxWidth, lineHeight) {
    const words = text.split(" ");
    let line = "";
    let currentY = y;

    for (let n = 0; n < words.length; n++) {
      const testLine = line + words[n] + " ";
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;

      if (testWidth > maxWidth && n > 0) {
        ctx.fillText(line, x, currentY);
        line = words[n] + " ";
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    ctx.fillText(line, x, currentY);
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }

  easeInBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return c3 * t * t * t - c1 * t * t;
  }
}
