// 📁 feedback-manager.js - Phase 2.2 Encouraging Feedback System
// Manages Martha's dialogue, celebrations, and positive reinforcement

class FeedbackManager {
  constructor(game) {
    this.game = game;

    // Dialogue bubble state
    this.currentDialogue = null;
    this.dialogueTimer = 0;
    this.dialogueDuration = 2000; // 2 seconds default
    this.dialogueQueue = [];

    // Martha position for dialogue placement (updated from MarthaManager)
    this.marthaX = 0;
    this.marthaY = 0;
    this.marthaWidth = 0;
    this.marthaOnScreen = true;

    // Celebration state
    this.celebrationActive = false;
    this.celebrationTimer = 0;
    this.celebrationDuration = 1500;
    this.celebrationParticles = [];

    // Streak tracking
    this.currentStreak = 0;
    this.lastMatchTime = 0;
    this.streakTimeout = 5000; // 5 seconds to maintain streak

    // Encouragement timing
    this.lastEncouragementTime = 0;
    this.encouragementCooldown = 8000; // 8 seconds between encouragements
    this.strugglingThreshold = 15000; // Show "keep trying" after 15s no action
    this.lastActionTime = Date.now();

    // Visual feedback
    this.feedbackAnimations = [];

    // Achievement notifications
    this.achievementNotifications = [];
  }

  update(deltaTime) {
    const now = Date.now();

    // Update dialogue timer
    if (this.currentDialogue) {
      this.dialogueTimer -= deltaTime;
      if (this.dialogueTimer <= 0) {
        this.currentDialogue = null;
        this.checkDialogueQueue();
      }
    } else {
      this.checkDialogueQueue();
    }

    // Check for struggling players (no action in a while)
    if (
      now - this.lastActionTime > this.strugglingThreshold &&
      now - this.lastEncouragementTime > this.encouragementCooldown
    ) {
      this.showStruggling();
      this.lastEncouragementTime = now;
    }

    // Update celebration
    if (this.celebrationActive) {
      this.celebrationTimer -= deltaTime;
      if (this.celebrationTimer <= 0) {
        this.celebrationActive = false;
        this.celebrationParticles = [];
      }
    }

    // Update celebration particles
    this.celebrationParticles = this.celebrationParticles.filter((particle) => {
      particle.x += particle.vx * (deltaTime / 16.67);
      particle.y += particle.vy * (deltaTime / 16.67);
      particle.vy += 0.2; // Gravity
      particle.alpha -= 0.01;
      particle.life -= deltaTime;
      return particle.life > 0 && particle.alpha > 0;
    });

    // Update feedback animations
    this.feedbackAnimations = this.feedbackAnimations.filter((anim) => {
      anim.timer -= deltaTime;
      anim.y -= anim.velocity * (deltaTime / 16.67);
      anim.alpha = Math.min(1, anim.timer / anim.duration);
      return anim.timer > 0;
    });

    // Update achievement notifications
    this.achievementNotifications = this.achievementNotifications.filter((notif) => {
      notif.timer -= deltaTime;

      // Slide in animation (first 300ms)
      if (notif.slideIn < 1) {
        notif.slideIn += deltaTime / 300;
        notif.slideIn = Math.min(1, notif.slideIn);
      }

      // Fade in/out
      const fadeInDuration = 300;
      const fadeOutDuration = 500;
      const elapsed = notif.duration - notif.timer;

      if (elapsed < fadeInDuration) {
        // Fade in
        notif.alpha = elapsed / fadeInDuration;
      } else if (notif.timer < fadeOutDuration) {
        // Fade out
        notif.alpha = notif.timer / fadeOutDuration;
      } else {
        // Full visibility
        notif.alpha = 1;
      }

      return notif.timer > 0;
    });

    // Check streak timeout
    if (now - this.lastMatchTime > this.streakTimeout && this.currentStreak > 0) {
      this.currentStreak = 0;
    }
  }

  // Update Martha's position (called by throwing screen)
  updateMarthaPosition(x, y, width, onScreen = true) {
    this.marthaX = x;
    this.marthaY = y;
    this.marthaWidth = width;
    this.marthaOnScreen = onScreen;
  }

  // Called when a sockball hits Martha
  onPerfectCatch() {
    this.lastActionTime = Date.now();
    const message = GameConfig.getRandomEncouragement("PERFECT_CATCH");
    this.showDialogue(message, "#FFD700", 2000);
  }

  onGoodCatch() {
    this.lastActionTime = Date.now();
    const message = GameConfig.getRandomEncouragement("GOOD_CATCH");
    this.showDialogue(message, "#00FF00", 1500);
  }

  onRegularCatch() {
    this.lastActionTime = Date.now();
  }

  // Called when a match is made in the matching phase
  onMatchMade() {
    this.lastActionTime = Date.now();
    const now = Date.now();

    // Update streak
    if (now - this.lastMatchTime < this.streakTimeout) {
      this.currentStreak++;
    } else {
      this.currentStreak = 1;
    }
    this.lastMatchTime = now;

    // Show streak celebration
    if (this.currentStreak >= 3) {
      this.showStreakCelebration();
    } else if (Math.random() < 0.3) {
      // 30% chance to show encouragement
      const message = GameConfig.getRandomEncouragement("MATCH_MADE");
      this.showDialogue(message, "#4CAF50", 1500);
    }
  }

  // Called at level start
  onLevelStart() {
    this.lastActionTime = Date.now();
    this.currentStreak = 0;
    const message = GameConfig.getRandomEncouragement("LEVEL_START");
    this.showDialogue(message, "#2196F3", 2500);
  }

  // Called when level is completed
  onLevelComplete() {
    const message = GameConfig.getRandomEncouragement("LEVEL_COMPLETE");
    this.showDialogue(message, "#FFD700", 3000);
    this.triggerCelebration();
  }

  // Show struggling message
  showStruggling() {
    const message = GameConfig.getRandomEncouragement("STRUGGLING");
    this.showDialogue(message, "#FFC107", 2500);
  }

  // Show streak celebration
  showStreakCelebration() {
    const message = `${this.currentStreak}x Streak! 🔥`;
    this.showDialogue(message, "#FF5722", 2000);

    // Add feedback animation
    this.feedbackAnimations.push({
      text: `${this.currentStreak}x COMBO!`,
      x: this.game.getCanvasWidth() / 2,
      y: this.game.getCanvasHeight() / 2,
      alpha: 1,
      velocity: 2,
      timer: 2000,
      duration: 2000,
      color: "#FF5722",
      fontSize: 48,
    });
  }

  // Show achievement unlocked notification
  showAchievementUnlocked(achievement) {
    this.achievementNotifications.push({
      achievement: achievement,
      x: this.game.getCanvasWidth() / 2,
      y: this.game.getScaledValue(60), // Near top of screen
      alpha: 0,
      slideIn: 0, // Animation progress 0-1
      velocity: 0,
      timer: 3000, // 3 seconds total
      duration: 3000,
    });
  }

  // Queue a dialogue message
  showDialogue(text, color = "#FFFFFF", duration = 2000) {
    // Don't queue if same message is already showing
    if (this.currentDialogue && this.currentDialogue.text === text) {
      return;
    }

    const dialogue = {
      text,
      color,
      duration,
    };

    // If no dialogue is showing, show immediately
    if (!this.currentDialogue) {
      this.currentDialogue = dialogue;
      this.dialogueTimer = duration;
    } else {
      // Otherwise queue it
      this.dialogueQueue.push(dialogue);
    }
  }

  // Check if there are queued dialogues
  checkDialogueQueue() {
    if (this.dialogueQueue.length > 0 && !this.currentDialogue) {
      const dialogue = this.dialogueQueue.shift();
      this.currentDialogue = dialogue;
      this.dialogueTimer = dialogue.duration;
    }
  }

  // Trigger celebration particles
  triggerCelebration() {
    this.celebrationActive = true;
    this.celebrationTimer = this.celebrationDuration;

    // Create celebration particles
    const centerX = this.game.getCanvasWidth() / 2;
    const centerY = this.game.getCanvasHeight() / 2;
    const colors = ["#FFD700", "#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A"];

    for (let i = 0; i < 30; i++) {
      const angle = (Math.PI * 2 * i) / 30;
      const speed = 3 + Math.random() * 3;

      this.celebrationParticles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 8 + Math.random() * 8,
        alpha: 1,
        life: 2000 + Math.random() * 1000,
      });
    }
  }

  render(ctx) {
    // Render dialogue bubble only if Martha is on screen
    if (this.currentDialogue && this.marthaX > 0 && this.marthaOnScreen) {
      this.renderDialogueBubble(ctx);
    }

    // Render celebration particles
    if (this.celebrationActive) {
      this.renderCelebrationParticles(ctx);
    }

    // Render feedback animations
    this.feedbackAnimations.forEach((anim) => {
      ctx.save();
      ctx.globalAlpha = anim.alpha;
      ctx.fillStyle = anim.color;
      ctx.font = `bold ${this.game.getScaledValue(anim.fontSize)}px Courier New`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add glow effect
      ctx.shadowColor = anim.color;
      ctx.shadowBlur = 20;
      ctx.fillText(anim.text, anim.x, anim.y);

      ctx.restore();
    });

    // Render achievement notifications
    this.achievementNotifications.forEach((notif) => {
      this.renderAchievementNotification(ctx, notif);
    });
  }

  renderDialogueBubble(ctx) {
    const dialogue = this.currentDialogue;
    if (!dialogue) return;

    ctx.save();

    // Position above Martha
    const bubbleX = this.marthaX + this.marthaWidth / 2;
    const bubbleY = this.marthaY - this.game.getScaledValue(60);

    // Measure text
    ctx.font = `${this.game.getScaledValue(16)}px Arial`;
    const textMetrics = ctx.measureText(dialogue.text);
    const textWidth = textMetrics.width;

    // Bubble dimensions
    const padding = this.game.getScaledValue(12);
    const bubbleWidth = textWidth + padding * 2;
    const bubbleHeight = this.game.getScaledValue(40);
    const borderRadius = this.game.getScaledValue(10);

    // Draw speech bubble tail
    ctx.fillStyle = "#FFFFFF";
    ctx.beginPath();
    ctx.moveTo(bubbleX, bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX - this.game.getScaledValue(10), bubbleY + bubbleHeight);
    ctx.lineTo(bubbleX, bubbleY + bubbleHeight + this.game.getScaledValue(10));
    ctx.closePath();
    ctx.fill();

    // Draw bubble background
    ctx.fillStyle = "#FFFFFF";
    ctx.strokeStyle = "#333333";
    ctx.lineWidth = this.game.getScaledValue(2);

    // Rounded rectangle for bubble
    this.drawRoundedRect(
      ctx,
      bubbleX - bubbleWidth / 2,
      bubbleY,
      bubbleWidth,
      bubbleHeight,
      borderRadius
    );
    ctx.fill();
    ctx.stroke();

    // Draw text
    ctx.fillStyle = dialogue.color;
    ctx.font = `bold ${this.game.getScaledValue(16)}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(dialogue.text, bubbleX, bubbleY + bubbleHeight / 2);

    ctx.restore();
  }

  renderCelebrationParticles(ctx) {
    ctx.save();

    this.celebrationParticles.forEach((particle) => {
      ctx.globalAlpha = particle.alpha;
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      ctx.fill();

      // Add sparkle effect
      ctx.strokeStyle = "#FFFFFF";
      ctx.lineWidth = 2;
      ctx.globalAlpha = particle.alpha * 0.5;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size + 2, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.restore();
  }

  renderAchievementNotification(ctx, notif) {
    ctx.save();

    const achievement = notif.achievement;

    // Smaller, more compact design
    const boxWidth = this.game.getScaledValue(320);
    const boxHeight = this.game.getScaledValue(50);
    const radius = this.game.getScaledValue(8);

    // Slide in from top
    const slideOffset = (1 - notif.slideIn) * -boxHeight;
    const x = notif.x - boxWidth / 2;
    const y = notif.y + slideOffset;

    // Subtle background with slight transparency
    ctx.globalAlpha = notif.alpha * 0.92;

    // Dark background with gold accent
    ctx.fillStyle = "rgba(40, 40, 40, 0.95)";
    this.drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.fill();

    // Subtle gold border
    ctx.strokeStyle = "rgba(255, 215, 0, 0.7)";
    ctx.lineWidth = this.game.getScaledValue(2);
    this.drawRoundedRect(ctx, x, y, boxWidth, boxHeight, radius);
    ctx.stroke();

    // Reset shadow
    ctx.shadowColor = "transparent";
    ctx.shadowBlur = 0;
    ctx.globalAlpha = notif.alpha;

    // Achievement icon (smaller)
    const iconX = x + this.game.getScaledValue(20);
    const iconY = y + boxHeight / 2;
    ctx.font = `${this.game.getScaledValue(24)}px Arial`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#FFD700";
    ctx.fillText(achievement.icon, iconX, iconY);

    // Simple text: "Achievement Unlocked: Name"
    const textX = iconX + this.game.getScaledValue(35);
    ctx.font = `bold ${this.game.getScaledValue(14)}px Courier New`;
    ctx.fillStyle = "rgba(255, 255, 255, 0.95)";
    ctx.fillText("Achievement Unlocked:", textX, iconY - this.game.getScaledValue(8));

    ctx.font = `bold ${this.game.getScaledValue(16)}px Courier New`;
    ctx.fillStyle = "#FFD700";
    ctx.fillText(achievement.name, textX, iconY + this.game.getScaledValue(10));

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

  // Reset feedback state (called when starting new level)
  reset() {
    this.currentDialogue = null;
    this.dialogueTimer = 0;
    this.dialogueQueue = [];
    this.celebrationActive = false;
    this.celebrationParticles = [];
    this.currentStreak = 0;
    this.lastMatchTime = 0;
    this.lastActionTime = Date.now();
    this.lastEncouragementTime = 0;
    this.feedbackAnimations = [];
    // Don't reset achievement notifications - they should persist across screens
  }
}
