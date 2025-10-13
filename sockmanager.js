class SockManager {
  constructor(game) {
    this.game = game;
    this.socks = [];
    this.sockList = [];
    this.sockPile = null;
    this.particleEffects = [];
    this.shootAnimations = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
  }

  initialize() {
    this.sockPile = {
      x: this.game.getCanvasWidth() / 2,
      y: this.game.getCanvasHeight() - this.game.getScaledValue(100),
      width: this.game.getScaledValue(120),
      height: this.game.getScaledValue(120),
      currentImage: "sockpile1.png",
      glowEffect: 0,
      bounceEffect: 0,
      pulseEffect: 0,
    };

    this.socks = [];
    this.particleEffects = [];
    this.shootAnimations = [];
    this.matchAnimations = [];
    this.sockballAnimations = [];
  }

  setSockList(sockList) {
    this.sockList = [...sockList];
    this.updateSockPileImage();
  }

  shootSockFromPile() {
    if (this.sockList.length === 0) return null;

    const sockType = this.sockList.pop();

    this.sockPile.bounceEffect = 20;
    this.sockPile.glowEffect = 30;

    const angle = Math.PI / 4 + (Math.random() * Math.PI) / 2;
    const speed = GameConfig.SOCK_SHOOT_SPEED + Math.random() * 4;
    const sockSize = this.game.getScaledValue(GameConfig.SOCK_SIZE);

    const newSock = {
      id: Date.now(),
      type: sockType,
      x: this.sockPile.x,
      y: this.sockPile.y,
      width: sockSize,
      height: sockSize,
      vx: Math.cos(angle) * speed,
      vy: -Math.sin(angle) * speed,
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 0.2,
      scale: 1,
      glowEffect: 15,
    };

    this.socks.push(newSock);
    this.updateSockPileImage();
    this.createShootEffect(newSock);

    return newSock;
  }

  createShootEffect(sock) {
    // Play particle burst sound for shooting effect
    this.game.audioManager.playSound("particle-burst", false, 0.2);

    for (let i = 0; i < 6; i++) {
      this.particleEffects.push({
        x: sock.x + (Math.random() - 0.5) * this.game.getScaledValue(20),
        y: sock.y + (Math.random() - 0.5) * this.game.getScaledValue(20),
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.5) * 6,
        life: 30,
        maxLife: 30,
        color: "#FFD700",
        size: this.game.getScaledValue(2 + Math.random() * 2),
      });
    }
  }

  createMismatchEffect(sock1, sock2) {
    // Play particle burst sound for mismatch effect
    this.game.audioManager.playSound("particle-burst", false, 0.3);

    // Create red/orange particle effects for mismatch
    const centerX = (sock1.x + sock2.x) / 2;
    const centerY = (sock1.y + sock2.y) / 2;
    const mismatchColors = [
      "#FF4444",
      "#FF6B6B",
      "#FF8E53",
      "#FFB347",
      "#FF69B4",
    ];

    // Create more intense particle effect for mismatch
    for (let i = 0; i < 20; i++) {
      this.particleEffects.push({
        x: centerX + (Math.random() - 0.5) * this.game.getScaledValue(100),
        y: centerY + (Math.random() - 0.5) * this.game.getScaledValue(100),
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 60,
        maxLife: 60,
        color:
          mismatchColors[Math.floor(Math.random() * mismatchColors.length)],
        size: this.game.getScaledValue(3 + Math.random() * 3),
      });
    }

    // Create additional "X" or "error" style particles
    for (let i = 0; i < 8; i++) {
      this.particleEffects.push({
        x: centerX + (Math.random() - 0.5) * this.game.getScaledValue(60),
        y: centerY + (Math.random() - 0.5) * this.game.getScaledValue(60),
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 45,
        maxLife: 45,
        color: "#FF0000",
        size: this.game.getScaledValue(4 + Math.random() * 2),
        shape: "cross", // Special marker for cross-shaped particles
      });
    }
  }

  updateSockPileImage() {
    const remaining = this.sockList.length;
    const total = GameConfig.LEVELS[this.game.currentLevel].sockPairs * 2;
    const percentage = (remaining / total) * 100;

    if (percentage <= 0) {
      this.sockPile.currentImage = null;
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_4) {
      this.sockPile.currentImage = "sockpile4.png";
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_3) {
      this.sockPile.currentImage = "sockpile3.png";
    } else if (percentage <= GameConfig.SOCK_PILE_THRESHOLDS.IMAGE_2) {
      this.sockPile.currentImage = "sockpile2.png";
    } else {
      this.sockPile.currentImage = "sockpile1.png";
    }
  }

  getSockAt(x, y) {
    for (let i = this.socks.length - 1; i >= 0; i--) {
      const sock = this.socks[i];
      if (this.isSockInAnimation(sock)) continue;

      if (
        x >= sock.x - sock.width / 2 &&
        x <= sock.x + sock.width / 2 &&
        y >= sock.y - sock.height / 2 &&
        y <= sock.y + sock.height / 2
      ) {
        return sock;
      }
    }
    return null;
  }

  isSockInAnimation(sock) {
    return this.matchAnimations.some((anim) => anim.socks.includes(sock));
  }

  removeSock(sock) {
    const index = this.socks.indexOf(sock);
    if (index > -1) {
      this.socks.splice(index, 1);
    }
  }

  startMatchAnimation(sock1, sock2) {
    const animation = {
      socks: [sock1, sock2],
      phase: "wiggle",
      timer: 0,
      wiggleDuration: 45,
      shrinkDuration: 30,
      sockType: sock1.type,
      centerX: (sock1.x + sock2.x) / 2,
      centerY: (sock1.y + sock2.y) / 2,
      scale: 1,
      wiggleIntensity: 0,
      glowEffect: 30,
    };

    this.matchAnimations.push(animation);
    this.createMatchStartEffect(animation);
  }

  createMatchStartEffect(animation) {
    // Play particle burst sound for match start effect
    this.game.audioManager.playSound("particle-burst", false, 0.4);

    const colors = ["#FFD700", "#FF69B4", "#00CED1", "#98FB98", "#DDA0DD"];
    const particleSpread = this.game.getScaledValue(80);
    const particleSize = this.game.getScaledValue(3);

    for (let i = 0; i < 15; i++) {
      this.particleEffects.push({
        x: animation.centerX + (Math.random() - 0.5) * particleSpread,
        y: animation.centerY + (Math.random() - 0.5) * particleSpread,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
        life: 50,
        maxLife: 50,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: particleSize + Math.random() * particleSize,
      });
    }
  }

  updateMatchAnimations(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    this.matchAnimations.forEach((animation, index) => {
      const oldTimer = animation.timer;
      animation.timer += timeMultiplier;

      if (animation.phase === "wiggle") {
        const progress = animation.timer / animation.wiggleDuration;
        const easeProgress = this.easeInOutSine(progress);

        animation.scale = 1 + easeProgress * 0.2;

        const wiggleFreq = progress * Math.PI * 3;
        animation.wiggleIntensity =
          Math.sin(wiggleFreq) * this.game.getScaledValue(3) * easeProgress;

        // Fix Bug #14: Check if we crossed a multiple of 8 (for floating-point timer)
        if (Math.floor(animation.timer / 8) > Math.floor(oldTimer / 8)) {
          this.particleEffects.push({
            x:
              animation.centerX +
              (Math.random() - 0.5) * this.game.getScaledValue(40),
            y:
              animation.centerY +
              (Math.random() - 0.5) * this.game.getScaledValue(40),
            vx: (Math.random() - 0.5) * 2,
            vy: (Math.random() - 0.5) * 2,
            life: 40,
            maxLife: 40,
            color: "#FFD700",
            size: this.game.getScaledValue(1 + Math.random() * 1.5),
          });
        }

        if (animation.timer >= animation.wiggleDuration) {
          animation.phase = "shrink";
          animation.timer = 0;
          this.createSockballAnimation(animation);
        }
      } else if (animation.phase === "shrink") {
        const progress = animation.timer / animation.shrinkDuration;
        const easeProgress = this.easeInQuart(progress);

        animation.scale = 1.2 * (1 - easeProgress);
        animation.wiggleIntensity = 0;

        if (animation.timer >= animation.shrinkDuration) {
          this.completeMatch(animation);
          this.matchAnimations.splice(index, 1);
        }
      }
    });
  }

  easeInOutSine(t) {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  easeInQuart(t) {
    return t * t * t * t;
  }

  easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  createSockballAnimation(animation) {
    const sockballImage = GameConfig.IMAGES.SOCK_BALLS[animation.sockType - 1];
    const targetX = this.game.getCanvasWidth() - this.game.getScaledValue(525);
    const targetY = this.game.getCanvasHeight() - this.game.getScaledValue(125);

    const sockballAnim = {
      image: sockballImage,
      x: animation.centerX,
      y: animation.centerY,
      targetX: targetX,
      targetY: targetY,
      progress: 0,
      wiggleOffset: 0,
      scale: 4,
      rotation: 0,
      rotationSpeed: 0.1,
      glowEffect: 40,
      rainbowEffect: 60,
      rainbowOffset: 0,
      phase: "entrance",
      entranceTimer: 0,
    };

    this.sockballAnimations.push(sockballAnim);
  }

  updateSockballAnimations(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    this.sockballAnimations.forEach((animation, index) => {
      animation.wiggleOffset += 0.1 * timeMultiplier;
      animation.rotation += animation.rotationSpeed * timeMultiplier;
      animation.rainbowOffset += 0.05 * timeMultiplier;

      if (animation.phase === "entrance") {
        animation.entranceTimer += timeMultiplier;
        const entranceProgress = animation.entranceTimer / 40;

        const pulse = Math.sin(animation.entranceTimer * 0.15) * 0.1;
        animation.scale =
          2 + pulse * this.easeInOutSine(Math.min(entranceProgress, 1));

        if (animation.entranceTimer >= 40) {
          animation.phase = "traveling";
          animation.progress = 0;
        }
      } else if (animation.phase === "traveling") {
        animation.progress += 0.025 * timeMultiplier;

        const scaleProgress = this.easeOutCubic(animation.progress);
        animation.scale = 1.2 - scaleProgress * 0.4;
        if (animation.scale < 0.8) animation.scale = 0.8;

        const positionProgress = this.easeInOutCubic(animation.progress);

        if (!animation.startX) {
          animation.startX = animation.x;
          animation.startY = animation.y;
        }

        animation.x =
          animation.startX +
          (animation.targetX - animation.startX) * positionProgress;
        animation.y =
          animation.startY +
          (animation.targetY - animation.startY) * positionProgress;

        if (animation.progress >= 1) {
          this.game.sockBalls++;
          this.sockballAnimations.splice(index, 1);
          this.createArrivalEffect(animation.targetX, animation.targetY);
        }
      }

      if (animation.glowEffect > 0)
        animation.glowEffect -= 0.3 * timeMultiplier;
      if (animation.rainbowEffect > 0)
        animation.rainbowEffect -= 0.4 * timeMultiplier;
    });
  }

  createArrivalEffect(x, y) {
    // Play particle burst sound for sockball arrival
    this.game.audioManager.playSound("particle-burst", false, 0.3);

    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7"];
    const particleSpread = this.game.getScaledValue(60);
    const particleSize = this.game.getScaledValue(2);

    for (let i = 0; i < 20; i++) {
      this.particleEffects.push({
        x: x + (Math.random() - 0.5) * particleSpread,
        y: y + (Math.random() - 0.5) * particleSpread,
        vx: (Math.random() - 0.5) * 12,
        vy: (Math.random() - 0.5) * 12,
        life: 40,
        maxLife: 40,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: particleSize + Math.random() * particleSize,
      });
    }
  }

  completeMatch(animation) {
    this.socks = this.socks.filter(
      (sock) => sock !== animation.socks[0] && sock !== animation.socks[1]
    );
  }

  updateParticleEffects(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    this.particleEffects.forEach((particle, index) => {
      particle.x += particle.vx * timeMultiplier;
      particle.y += particle.vy * timeMultiplier;
      particle.vx *= Math.pow(0.98, timeMultiplier);
      particle.vy *= Math.pow(0.98, timeMultiplier);
      particle.life -= timeMultiplier;

      if (particle.life <= 0) {
        this.particleEffects.splice(index, 1);
      }
    });
  }

  updateEffects(deltaTime) {
    const timeMultiplier = deltaTime / 16.67;

    if (this.sockPile.bounceEffect > 0)
      this.sockPile.bounceEffect -= timeMultiplier;
    if (this.sockPile.glowEffect > 0)
      this.sockPile.glowEffect -= timeMultiplier;
    if (this.sockPile.pulseEffect > 0)
      this.sockPile.pulseEffect -= timeMultiplier;

    this.socks.forEach((sock) => {
      if (sock.glowEffect > 0) sock.glowEffect -= timeMultiplier;
    });
  }

  update(deltaTime) {
    this.updateMatchAnimations(deltaTime);
    this.updateSockballAnimations(deltaTime);
    this.updateParticleEffects(deltaTime);
    this.updateEffects(deltaTime);
  }

  renderSockPile(ctx) {
    if (
      !this.sockPile.currentImage ||
      !this.game.images[this.sockPile.currentImage]
    )
      return;

    ctx.save();

    let scale = 1.5;
    let bounceOffset = 0;

    if (this.sockPile.glowEffect > 0) {
      ctx.shadowColor = "#FFD700";
      ctx.shadowBlur = this.sockPile.glowEffect;
    }

    if (this.sockPile.bounceEffect > 0) {
      bounceOffset =
        Math.sin(this.sockPile.bounceEffect * 0.5) *
        this.game.getScaledValue(8);
    }

    if (this.sockPile.pulseEffect > 0) {
      scale = 1 + Math.sin(this.sockPile.pulseEffect * 0.3) * 0.1;
    }

    const drawWidth = this.sockPile.width * scale;
    const drawHeight = this.sockPile.height * scale;

    ctx.drawImage(
      this.game.images[this.sockPile.currentImage],
      this.sockPile.x - drawWidth / 2,
      this.sockPile.y - drawHeight / 2 + bounceOffset,
      drawWidth,
      drawHeight
    );

    ctx.restore();
  }

  renderSocks(ctx) {
    this.socks.forEach((sock) => {
      ctx.save();

      let drawX = sock.x - sock.width / 2;
      let drawY = sock.y - sock.height / 2;

      this.matchAnimations.forEach((animation) => {
        if (animation.socks.includes(sock)) {
          if (animation.phase === "wiggle") {
            drawX +=
              Math.sin(animation.timer * 0.8) * animation.wiggleIntensity;
            drawY +=
              Math.cos(animation.timer * 0.8) * animation.wiggleIntensity;
          }

          ctx.translate(sock.x, sock.y);
          ctx.scale(animation.scale, animation.scale);
          ctx.translate(-sock.x, -sock.y);

          ctx.shadowColor = "#FFD700";
          ctx.shadowBlur = this.game.getScaledValue(20);
        }
      });

      if (sock.glowEffect > 0) {
        ctx.shadowColor = "rgba(255, 200, 100, 0.8)";
        ctx.shadowBlur = sock.glowEffect;
      }

      if (sock.rotation) {
        ctx.translate(sock.x, sock.y);
        ctx.rotate(sock.rotation);
        ctx.translate(-sock.x, -sock.y);
      }

      if (this.game.images[`sock${sock.type}.png`]) {
        ctx.drawImage(
          this.game.images[`sock${sock.type}.png`],
          drawX,
          drawY,
          sock.width,
          sock.height
        );
      }

      ctx.restore();
    });
  }

  renderSockballAnimations(ctx) {
    this.sockballAnimations.forEach((animation) => {
      if (!this.game.images[animation.image]) return;

      ctx.save();

      if (animation.rainbowEffect > 0) {
        const hue = (animation.rainbowOffset * 180) % 360;
        const intensity = Math.min(animation.rainbowEffect / 60, 1);
        ctx.shadowColor = `hsl(${hue}, 70%, 60%)`;
        ctx.shadowBlur = this.game.getScaledValue(10 * intensity);
      }

      if (animation.glowEffect > 0) {
        ctx.shadowColor = "#FFD700";
        ctx.shadowBlur = this.game.getScaledValue(
          Math.min(animation.glowEffect, 15)
        );
      }

      const wiggle =
        Math.sin(animation.wiggleOffset) * this.game.getScaledValue(1.5);
      ctx.translate(animation.x, animation.y);
      ctx.rotate(animation.rotation);
      ctx.scale(animation.scale, animation.scale);

      const size = this.game.getScaledValue(GameConfig.SOCKBALL_SIZE);
      ctx.drawImage(
        this.game.images[animation.image],
        -size / 2 + wiggle,
        -size / 2,
        size,
        size
      );

      ctx.restore();
    });
  }

  renderParticleEffects(ctx) {
    this.particleEffects.forEach((particle) => {
      ctx.save();

      const alpha = particle.life / particle.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.color;

      if (particle.shape === "cross") {
        // Render cross-shaped particles for mismatch
        const halfSize = particle.size / 2;
        ctx.fillRect(
          particle.x - halfSize,
          particle.y - halfSize / 3,
          particle.size,
          particle.size / 3
        );
        ctx.fillRect(
          particle.x - halfSize / 3,
          particle.y - halfSize,
          particle.size / 3,
          particle.size
        );
      } else {
        // Render normal circular particles
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    });
  }

  checkSockPileClick(x, y) {
    if (!this.sockPile || !this.sockPile.currentImage) return false;

    const inBounds =
      x >= this.sockPile.x - this.sockPile.width / 2 &&
      x <= this.sockPile.x + this.sockPile.width / 2 &&
      y >= this.sockPile.y - this.sockPile.height / 2 &&
      y <= this.sockPile.y + this.sockPile.height / 2;

    return inBounds && this.sockList.length > 0;
  }

  getSockCount() {
    return this.socks.length;
  }

  getSockListLength() {
    return this.sockList.length;
  }
}
