/**
 * UI Helpers
 * Shared utility functions for rendering UI components
 */
class UIHelpers {
  constructor(game) {
    this.game = game;
  }

  /**
   * Draw a rounded rectangle path
   */
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

  /**
   * Render text with common styling options
   */
  renderText(ctx, text, x, y, options = {}) {
    const {
      fontSize = this.game.getScaledValue(16),
      color = "white",
      weight = "normal",
      align = "center",
      baseline = "middle",
    } = options;

    ctx.save();
    ctx.font = `${weight} ${fontSize}px Courier New`;
    ctx.fillStyle = color;
    ctx.textAlign = align;
    ctx.textBaseline = baseline;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  /**
   * Create a panel background with gradient and border
   */
  renderPanel(ctx, x, y, width, height, options = {}) {
    const {
      bgColor1 = "rgba(40, 40, 40, 0.9)",
      bgColor2 = "rgba(30, 30, 30, 0.9)",
      borderColor = "rgba(100, 149, 237, 0.6)",
      borderWidth = 2,
      radius = 8,
      shadow = false,
    } = options;

    ctx.save();

    const scaledRadius = this.game.getScaledValue(radius);
    const scaledBorderWidth = this.game.getScaledValue(borderWidth);

    // Background gradient
    const gradient = ctx.createLinearGradient(x, y, x, y + height);
    gradient.addColorStop(0, bgColor1);
    gradient.addColorStop(1, bgColor2);
    ctx.fillStyle = gradient;

    this.drawRoundedRect(ctx, x, y, width, height, scaledRadius);
    ctx.fill();

    // Optional shadow
    if (shadow) {
      ctx.shadowColor = borderColor;
      ctx.shadowBlur = this.game.getScaledValue(10);
    }

    // Border
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = scaledBorderWidth;
    this.drawRoundedRect(ctx, x, y, width, height, scaledRadius);
    ctx.stroke();

    ctx.restore();
  }

  /**
   * Create a button with gradient and hover state
   */
  renderButton(ctx, x, y, width, height, text, options = {}) {
    const {
      hovered = false,
      color1 = "rgba(100, 150, 255, 0.8)",
      color2 = "rgba(65, 105, 225, 0.8)",
      hoverColor1 = "rgba(120, 170, 255, 0.95)",
      hoverColor2 = "rgba(85, 125, 245, 0.95)",
      borderColor = "rgba(150, 200, 255, 0.6)",
      hoverBorderColor = "rgba(180, 220, 255, 0.9)",
      textColor = "white",
      fontSize = 14,
      radius = 6,
    } = options;

    const buttonX = x - width / 2;
    const buttonY = y - height / 2;
    const scaledRadius = this.game.getScaledValue(radius);

    ctx.save();

    // Gradient
    const gradient = ctx.createLinearGradient(buttonX, buttonY, buttonX, buttonY + height);
    if (hovered) {
      gradient.addColorStop(0, hoverColor1);
      gradient.addColorStop(1, hoverColor2);
    } else {
      gradient.addColorStop(0, color1);
      gradient.addColorStop(1, color2);
    }
    ctx.fillStyle = gradient;

    this.drawRoundedRect(ctx, buttonX, buttonY, width, height, scaledRadius);
    ctx.fill();

    // Hover glow
    if (hovered) {
      ctx.shadowColor = hoverBorderColor;
      ctx.shadowBlur = this.game.getScaledValue(12);
    }

    // Border
    ctx.strokeStyle = hovered ? hoverBorderColor : borderColor;
    ctx.lineWidth = this.game.getScaledValue(2);
    this.drawRoundedRect(ctx, buttonX, buttonY, width, height, scaledRadius);
    ctx.stroke();

    ctx.restore();

    // Text
    this.renderText(ctx, text, x, y, {
      fontSize: this.game.getScaledValue(fontSize),
      color: textColor,
      weight: "bold",
      align: "center",
      baseline: "middle",
    });
  }

  /**
   * Check if a point is inside a rectangle
   */
  isPointInRect(x, y, rect) {
    return (
      x >= rect.x &&
      x <= rect.x + rect.width &&
      y >= rect.y &&
      y <= rect.y + rect.height
    );
  }

  /**
   * Word-wrap text to fit within a maximum width
   */
  wrapText(ctx, text, maxWidth, fontSize) {
    ctx.font = `${fontSize}px Courier New`;
    const words = text.split(" ");
    const lines = [];
    let currentLine = "";

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine + words[i] + " ";
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth && i > 0) {
        lines.push(currentLine);
        currentLine = words[i] + " ";
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);

    return lines;
  }

  /**
   * Easing function for smooth animations
   */
  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  /**
   * Easing function for elastic bounce effect
   */
  easeOutElastic(t) {
    const c4 = (2 * Math.PI) / 3;
    return t === 0
      ? 0
      : t === 1
      ? 1
      : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * c4) + 1;
  }
}
