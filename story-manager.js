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

    // Center container
    const containerWidth = Math.min(
      this.game.getScaledValue(700),
      canvasWidth * 0.9
    );
    const containerHeight = Math.min(
      this.game.getScaledValue(500),
      canvasHeight * 0.8
    );

    this.slideContainer = {
      width: containerWidth,
      height: containerHeight,
      x: (canvasWidth - containerWidth) / 2,
      y: (canvasHeight - containerHeight) / 2,
      padding: this.game.getScaledValue(40),
    };

    // Position buttons in a row at the bottom
    const buttonY =
      this.slideContainer.y + containerHeight - this.game.getScaledValue(50);
    const buttonWidth = this.game.getScaledValue(85);
    const buttonHeight = this.game.getScaledValue(35);
    const buttonSpacing = this.game.getScaledValue(15);

    // Skip button - far left
    this.buttons.skip.x = this.slideContainer.x + this.game.getScaledValue(30);
    this.buttons.skip.y = buttonY;
    this.buttons.skip.width = buttonWidth;
    this.buttons.skip.height = buttonHeight;

    // Previous button - left of center
    this.buttons.previous.x = canvasWidth / 2 - buttonWidth - buttonSpacing / 2;
    this.buttons.previous.y = buttonY;
    this.buttons.previous.width = buttonWidth;
    this.buttons.previous.height = buttonHeight;

    // Next button - right of center
    this.buttons.next.x = canvasWidth / 2 + buttonSpacing / 2;
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
  }

  handleMouseMove(x, y) {
    if (!this.showingStory) return false;

    // Check button hovers
    for (const key in this.buttons) {
      const button = this.buttons[key];
      const wasHovered = button.hovered;
      button.hovered = this.isPointInRect(x, y, button);
    }

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

    // Skip button
    if (this.buttons.skip.hovered) {
      this.hide();
      return true;
    }

    // Previous button
    if (this.buttons.previous.hovered && this.currentSlideIndex > 0) {
      this.previousSlide();
      return true;
    }

    // Next button
    if (this.buttons.next.hovered) {
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

  nextSlide() {
    if (this.currentSlideIndex < this.slides.length - 1) {
      this.transitionDirection = 1;
      this.currentSlideIndex++;
      this.startTransition();
    }
  }

  previousSlide() {
    if (this.currentSlideIndex > 0) {
      this.transitionDirection = -1;
      this.currentSlideIndex--;
      this.startTransition();
    }
  }

  startTransition() {
    this.isTransitioning = true;
    this.transitionProgress = 0;
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

    // Render current slide
    const currentSlide = this.slides[this.currentSlideIndex];
    if (currentSlide) {
      this.renderSlide(ctx, currentSlide);
    }

    // Render buttons
    this.renderButtons(ctx);

    // Render slide indicators
    this.renderSlideIndicators(ctx);

    ctx.restore();
    ctx.restore();
  }

  renderSlideContainer(ctx, animProgress) {
    const container = this.slideContainer;

    // Outer glow effect
    ctx.save();
    ctx.shadowColor = "rgba(100, 150, 255, 0.3)";
    ctx.shadowBlur = this.game.getScaledValue(30) * animProgress;

    // Container background with enhanced gradient
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

    // Container border with glow
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

    // Apply transition animation with slide effect
    let alpha = 1;
    let slideOffset = 0;
    if (this.isTransitioning) {
      // Ease in-out cubic for smooth transition
      const t = this.transitionProgress;
      const easedProgress =
        t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

      alpha = Math.abs(Math.cos(easedProgress * Math.PI));
      slideOffset =
        Math.sin(easedProgress * Math.PI) *
        this.transitionDirection *
        this.game.getScaledValue(50);
    }

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(slideOffset, 0);

    // Title with glow
    ctx.save();
    ctx.shadowColor = "rgba(255, 215, 0, 0.5)";
    ctx.shadowBlur = this.game.getScaledValue(15);
    ctx.fillStyle = "#FFD700";
    ctx.font = `bold ${this.game.getScaledValue(40)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText(slide.title, container.x + container.width / 2, contentY);
    ctx.restore();

    // Image (if available) with scale animation
    const image = this.game.images[slide.image];
    if (image) {
      const maxImageSize = this.game.getScaledValue(168);

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

      const imageX = container.x + container.width / 2 - imageWidth / 2;
      // Center all images vertically in the same space
      const imageAreaY = contentY + this.game.getScaledValue(70);
      const imageY = imageAreaY + (maxImageSize - imageHeight) / 2;

      // Subtle pulse for image
      const imageScale = this.isTransitioning ? alpha : 1;
      ctx.save();
      ctx.translate(imageX + imageWidth / 2, imageY + imageHeight / 2);
      ctx.scale(imageScale, imageScale);
      ctx.translate(-(imageX + imageWidth / 2), -(imageY + imageHeight / 2));

      // Add subtle shadow to image
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = this.game.getScaledValue(10);
      ctx.shadowOffsetY = this.game.getScaledValue(5);

      ctx.drawImage(image, imageX, imageY, imageWidth, imageHeight);
      ctx.restore();
    }

    // Text with better spacing and styling
    const textY = contentY + this.game.getScaledValue(250);

    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.font = `${this.game.getScaledValue(22)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";

    // Word wrap text with better line height - centered
    this.wrapText(
      ctx,
      slide.text,
      container.x + container.width / 2,
      textY,
      container.width - container.padding * 3,
      this.game.getScaledValue(32)
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

    // Button background
    ctx.fillStyle = button.hovered ? color : `${color}CC`;
    this.drawRoundedRect(
      ctx,
      button.x,
      button.y,
      button.width,
      button.height,
      this.game.getScaledValue(8)
    );
    ctx.fill();

    // Button border
    ctx.strokeStyle = button.hovered ? "#FFFFFF" : "rgba(255, 255, 255, 0.5)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.drawRoundedRect(
      ctx,
      button.x,
      button.y,
      button.width,
      button.height,
      this.game.getScaledValue(8)
    );
    ctx.stroke();

    // Button text
    ctx.fillStyle = "#FFFFFF";
    ctx.font = `bold ${this.game.getScaledValue(18)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(
      text,
      button.x + button.width / 2,
      button.y + button.height / 2
    );

    ctx.restore();
  }

  renderSlideIndicators(ctx) {
    const container = this.slideContainer;

    // Render page counter text only (no dots)
    ctx.save();
    ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
    ctx.font = `${this.game.getScaledValue(14)}px Arial`;
    ctx.textAlign = "right";
    ctx.textBaseline = "middle";
    ctx.fillText(
      `${this.currentSlideIndex + 1} / ${this.slides.length}`,
      container.x + container.width - this.game.getScaledValue(30),
      container.y + container.height - this.game.getScaledValue(50)
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
