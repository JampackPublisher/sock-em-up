// 📁 screen.js - Base Screen Class
// Shared functionality for all game screens

class Screen {
  constructor(game) {
    this.game = game;
    this.canvas = game.canvas;
    this.ctx = game.ctx;

    // Common animation timers
    this.animationFrame = 0;
    this.uiAnimationTimer = 0;
    this.pulseTimer = 0;
    this.glowTimer = 0;

    // Mouse interaction state
    this.mouseX = 0;
    this.mouseY = 0;
    this.isMouseDown = false;

    // Screen transition state
    this.transitionProgress = 0;
    this.isTransitioning = false;

    // Phase 1.3 - Pause system state
    this.isPaused = false;
    this.pauseStartTime = 0;

    // Common UI elements
    this.uiElements = [];
    this.buttons = [];

    // Responsive layout cache
    this.layoutCache = {};
    this.lastCanvasSize = { width: 0, height: 0 };
  }

  // Base lifecycle methods
  setup() {
    this.resetAnimationTimers();
    this.clearLayoutCache();
    this.calculateLayout();
  }

  cleanup() {
    this.resetAnimationTimers();
    this.clearUIElements();
    // Reset pause state to prevent screens starting in paused state
    this.isPaused = false;
  }

  // Animation timer management
  resetAnimationTimers() {
    this.animationFrame = 0;
    this.uiAnimationTimer = 0;
    this.pulseTimer = 0;
    this.glowTimer = 0;
  }

  updateAnimationTimers(deltaTime) {
    const timeMultiplier = deltaTime / 16.67; // Normalize to 60fps
    this.animationFrame += timeMultiplier;
    this.uiAnimationTimer += timeMultiplier;
    this.pulseTimer += timeMultiplier * 0.1; // Slower pulse
    this.glowTimer += timeMultiplier * 0.15; // Medium glow speed
  }

  // Layout and sizing utilities
  clearLayoutCache() {
    this.layoutCache = {};
    this.lastCanvasSize = { width: 0, height: 0 };
  }

  calculateLayout() {
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    // Only recalculate if canvas size changed
    if (
      this.lastCanvasSize.width !== canvasWidth ||
      this.lastCanvasSize.height !== canvasHeight
    ) {
      this.lastCanvasSize = { width: canvasWidth, height: canvasHeight };
      this.layoutCache = this.createLayoutCache();
    }
  }

  createLayoutCache() {
    // Override in subclasses to define specific layouts
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();

    return {
      // Common layout values
      centerX: canvasWidth / 2,
      centerY: canvasHeight / 2,
      margin: this.game.getScaledValue(20),
      padding: this.game.getScaledValue(15),

      // Common UI panel sizes
      panelWidth: this.game.getScaledValue(400),
      panelHeight: this.game.getScaledValue(80),
      buttonWidth: this.game.getScaledValue(200),
      buttonHeight: this.game.getScaledValue(50),

      // Common font sizes
      titleFontSize: this.game.getScaledValue(32),
      headerFontSize: this.game.getScaledValue(24),
      bodyFontSize: this.game.getScaledValue(18),
      smallFontSize: this.game.getScaledValue(14),

      // Common spacing
      smallSpacing: this.game.getScaledValue(10),
      mediumSpacing: this.game.getScaledValue(20),
      largeSpacing: this.game.getScaledValue(40),
    };
  }

  // Resize handling
  handleResize() {
    this.clearLayoutCache();
    this.calculateLayout();
    this.onResize();
  }

  onResize() {
    // Override in subclasses for specific resize behavior
  }

  // Mouse event handling
  handleMouseMove(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    this.onMouseMove(x, y);
  }

  handleMouseDown(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseDown = true;
    return this.onMouseDown(x, y);
  }

  handleMouseUp(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    this.isMouseDown = false;
    return this.onMouseUp(x, y);
  }

  handleClick(x, y) {
    this.mouseX = x;
    this.mouseY = y;
    return this.onClick(x, y);
  }

  // Override these in subclasses
  onMouseMove(x, y) {
    return false;
  }
  onMouseDown(x, y) {
    return false;
  }
  onMouseUp(x, y) {
    return false;
  }
  onClick(x, y) {
    return false;
  }

  // UI Element management
  clearUIElements() {
    this.uiElements = [];
    this.buttons = [];
  }

  addButton(config) {
    const button = {
      id: config.id || `button_${this.buttons.length}`,
      x: config.x,
      y: config.y,
      width: config.width || this.layoutCache.buttonWidth,
      height: config.height || this.layoutCache.buttonHeight,
      text: config.text || "",
      onClick: config.onClick || (() => {}),
      style: config.style || "default",
      hovered: false,
      pressed: false,
      enabled: config.enabled !== false,
      ...config,
    };

    this.buttons.push(button);
    return button;
  }

  updateButton(button, x, y) {
    const wasHovered = button.hovered;
    button.hovered = this.isPointInRect(x, y, button);

    if (button.hovered !== wasHovered) {
      return true; // State changed
    }
    return false;
  }

  checkButtonClick(x, y) {
    for (const button of this.buttons) {
      if (button.enabled && this.isPointInRect(x, y, button)) {
        if (button.onClick) {
          button.onClick();
        }
        return true;
      }
    }
    return false;
  }

  // Geometry utilities
  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  isPointInCircle(x, y, circle) {
    const dx = x - circle.x;
    const dy = y - circle.y;
    return Math.sqrt(dx * dx + dy * dy) <= circle.radius;
  }

  getDistance(x1, y1, x2, y2) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    return Math.sqrt(dx * dx + dy * dy);
  }

  // Common rendering utilities
  renderPanel(ctx, x, y, width, height, style = "default") {
    ctx.save();

    // Panel background
    if (style === "primary") {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "rgba(44, 62, 80, 0.9)");
      gradient.addColorStop(1, "rgba(52, 73, 94, 0.8)");
      ctx.fillStyle = gradient;
    } else if (style === "secondary") {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "rgba(75, 0, 130, 0.9)");
      gradient.addColorStop(1, "rgba(138, 43, 226, 0.8)");
      ctx.fillStyle = gradient;
    } else {
      const gradient = ctx.createLinearGradient(x, y, x + width, y + height);
      gradient.addColorStop(0, "rgba(0, 0, 0, 0.8)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0.6)");
      ctx.fillStyle = gradient;
    }

    ctx.fillRect(x, y, width, height);

    // Panel border
    ctx.strokeStyle = "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(x, y, width, height);

    ctx.restore();
  }

  renderButton(ctx, button) {
    ctx.save();

    const { x, y, width, height, text, hovered, pressed, enabled } = button;

    // Button background
    let fillColor = "#3498db";
    if (!enabled) {
      fillColor = "#7f8c8d";
    } else if (pressed) {
      fillColor = "#2980b9";
    } else if (hovered) {
      fillColor = "#5dade2";
    }

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, width, height);

    // Button border
    ctx.strokeStyle = enabled ? "#2980b9" : "#95a5a6";
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.strokeRect(x, y, width, height);

    // Button glow effect when hovered
    if (hovered && enabled) {
      ctx.shadowColor = "#3498db";
      ctx.shadowBlur = this.game.getScaledValue(15);
      ctx.strokeRect(x, y, width, height);
      ctx.shadowBlur = 0;
    }

    // Button text
    ctx.fillStyle = enabled ? "white" : "#bdc3c7";
    ctx.font = `bold ${this.layoutCache.bodyFontSize}px Courier New`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, x + width / 2, y + height / 2);

    ctx.restore();
  }

  renderText(ctx, text, x, y, style = {}) {
    ctx.save();

    const fontSize = style.fontSize || this.layoutCache.bodyFontSize;
    const color = style.color || "white";
    const align = style.align || "center";
    const baseline = style.baseline || "middle";
    const weight = style.weight || "normal";
    const shadow = style.shadow !== false;

    ctx.fillStyle = color;
    ctx.font = `${weight} ${fontSize}px Courier New`;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;

    if (shadow) {
      ctx.shadowColor = "rgba(0, 0, 0, 0.8)";
      ctx.shadowBlur = this.game.getScaledValue(2);
      ctx.shadowOffsetX = this.game.getScaledValue(1);
      ctx.shadowOffsetY = this.game.getScaledValue(1);
    }

    ctx.fillText(text, x, y);

    ctx.restore();
  }

  renderProgressBar(ctx, x, y, width, height, progress, style = {}) {
    ctx.save();

    // Background
    ctx.fillStyle = style.backgroundColor || "rgba(0, 0, 0, 0.3)";
    ctx.fillRect(x, y, width, height);

    // Border
    ctx.strokeStyle = style.borderColor || "rgba(255, 255, 255, 0.3)";
    ctx.lineWidth = this.game.getScaledValue(1);
    ctx.strokeRect(x, y, width, height);

    // Fill
    const fillWidth = width * Math.max(0, Math.min(1, progress));
    let fillColor = style.fillColor || "#4caf50";

    // Fix Bug #24: Use >= for color thresholds
    if (progress >= 0.7) fillColor = "#ffc107";
    if (progress >= 1) fillColor = "#ff5722";

    ctx.fillStyle = fillColor;
    ctx.fillRect(x, y, fillWidth, height);

    // Glow effect
    if (style.glow !== false) {
      ctx.shadowColor = fillColor;
      ctx.shadowBlur = this.game.getScaledValue(5);
      ctx.fillRect(x, y, fillWidth, height);
    }

    ctx.restore();
  }

  // Animation utilities
  getPulseScale(intensity = 0.1) {
    return 1 + Math.sin(this.pulseTimer) * intensity;
  }

  getGlowIntensity(min = 0.5, max = 1.0) {
    return min + (Math.sin(this.glowTimer) * 0.5 + 0.5) * (max - min);
  }

  // Transition utilities
  startTransition() {
    this.isTransitioning = true;
    this.transitionProgress = 0;
  }

  updateTransition(deltaTime, duration = 500) {
    if (!this.isTransitioning) return false;

    this.transitionProgress += deltaTime / duration;
    if (this.transitionProgress >= 1) {
      this.transitionProgress = 1;
      this.isTransitioning = false;
      return true; // Transition complete
    }
    return false;
  }

  easeInOut(t) {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  easeOutBack(t) {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  // Phase 1.3 - Pause system methods
  pause() {
    if (this.isPaused) return;
    this.isPaused = true;
    this.pauseStartTime = Date.now();
    this.onPause();
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.onResume();
  }

  togglePause() {
    if (this.isPaused) {
      this.resume();
    } else {
      this.pause();
    }
  }

  onPause() {
    // Override in subclasses for specific pause behavior
  }

  onResume() {
    // Override in subclasses for specific resume behavior
  }

  renderPauseOverlay(ctx) {
    // Semi-transparent dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, this.game.getCanvasWidth(), this.game.getCanvasHeight());

    // "PAUSED" text
    const centerX = this.game.getCanvasWidth() / 2;
    const centerY = this.game.getCanvasHeight() / 2;

    this.renderText(ctx, "PAUSED", centerX, centerY - 50, {
      fontSize: this.game.getScaledValue(48),
      color: "#FFD700",
      weight: "bold",
    });

    this.renderText(ctx, "Press P or ESC to resume", centerX, centerY + 20, {
      fontSize: this.game.getScaledValue(20),
      color: "#FFFFFF",
    });

    this.renderText(ctx, "Press Q to quit to menu", centerX, centerY + 60, {
      fontSize: this.game.getScaledValue(16),
      color: "#CCCCCC",
    });
  }

  // Base update method
  update(deltaTime) {
    // Don't update if paused
    if (this.isPaused) {
      return;
    }

    this.updateAnimationTimers(deltaTime);
    this.calculateLayout();
    this.updateTransition(deltaTime);
    this.onUpdate(deltaTime);
  }

  onUpdate(deltaTime) {
    // Override in subclasses
  }

  // Base render method
  render(ctx) {
    this.onRender(ctx);

    // Render pause overlay if paused
    if (this.isPaused) {
      this.renderPauseOverlay(ctx);
    }
  }

  onRender(ctx) {
    // Override in subclasses
  }
}
