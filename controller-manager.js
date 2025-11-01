// controller-manager.js - Gamepad/Controller Support Manager

class ControllerManager {
  constructor(game) {
    this.game = game;
    this.connectedControllers = new Map();
    this.buttonStates = new Map(); // Track previous button states to detect button presses
    this.axisDeadzone = 0.15; // Deadzone for analog sticks
    this.axisThreshold = 0.5; // Threshold for directional input

    // Track if we've already handled a button this frame
    this.buttonHandledThisFrame = new Set();

    // Polling interval for gamepad state
    this.pollInterval = null;
    this.pollRate = 16; // ~60fps

    // Visual indicator state
    this.showIndicator = false;
    this.indicatorFadeTimer = 0;

    // Initialize reticule canvas overlay
    this.reticuleCanvas = document.getElementById('reticuleCanvas');
    this.reticuleCtx = this.reticuleCanvas ? this.reticuleCanvas.getContext('2d') : null;

    // Reticle state for controller cursor
    this.reticle = {
      x: 0,
      y: 0,
      visible: false,
      hovered: false,
      pulseTimer: 0,
      velocityX: 0,
      velocityY: 0
    };

    // Reticle configuration
    this.reticleConfig = {
      baseSpeed: 8,
      maxSpeed: 20,
      acceleration: 1.2,
      size: 24,
      glowSize: 8,
      pulseSpeed: 0.1,
      magnetismEnabled: true,
      magnetismRadius: 80,  // Distance at which magnetism starts
      magnetismStrength: 0.3  // How strong the pull is (0-1)
    };

    // Track if mouse was used recently (to hide reticle)
    this.mouseUsedRecently = false;
    this.mouseInactiveTimer = 0;
    this.mouseInactiveThreshold = 1000; // ms

    // Check if Gamepad API is supported
    this.isSupported = 'getGamepads' in navigator;

    if (!this.isSupported) {
      console.warn('🎮 Gamepad API not supported in this browser');
      return;
    }

    // Bind event handlers
    this.handleGamepadConnected = this.handleGamepadConnected.bind(this);
    this.handleGamepadDisconnected = this.handleGamepadDisconnected.bind(this);

    // Setup event listeners
    this.setupEventListeners();
  }

  setupEventListeners() {
    if (!this.isSupported) return;

    window.addEventListener('gamepadconnected', this.handleGamepadConnected);
    window.addEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
  }

  removeEventListeners() {
    if (!this.isSupported) return;

    window.removeEventListener('gamepadconnected', this.handleGamepadConnected);
    window.removeEventListener('gamepaddisconnected', this.handleGamepadDisconnected);
    this.stopPolling();
  }

  handleGamepadConnected(e) {
    console.log(`🎮 Controller connected: ${e.gamepad.id}`);
    this.connectedControllers.set(e.gamepad.index, e.gamepad);
    this.showControllerIndicator();

    // Initialize reticle position at center of canvas
    this.reticle.x = this.game.getCanvasWidth() / 2;
    this.reticle.y = this.game.getCanvasHeight() / 2;
    this.reticle.visible = true;

    // Start polling if not already polling
    if (!this.pollInterval) {
      this.startPolling();
    }
  }

  handleGamepadDisconnected(e) {
    console.log(`🎮 Controller disconnected: ${e.gamepad.id}`);
    this.connectedControllers.delete(e.gamepad.index);

    // Hide reticle when no controllers connected
    if (this.connectedControllers.size === 0) {
      this.reticle.visible = false;
      this.stopPolling();
    }
  }

  startPolling() {
    this.pollInterval = setInterval(() => {
      this.pollGamepads();
    }, this.pollRate);
  }

  stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  showControllerIndicator() {
    this.showIndicator = true;
    this.indicatorFadeTimer = 3000; // Show for 3 seconds
  }

  pollGamepads() {
    try {
      // Get fresh gamepad state (required for some browsers)
      const gamepads = navigator.getGamepads();

      if (!gamepads) return;

      for (let i = 0; i < gamepads.length; i++) {
        if (gamepads[i]) {
          this.connectedControllers.set(i, gamepads[i]);
          this.handleGamepadInput(gamepads[i]);
        }
      }

      // Clear button handled tracking for next frame
      this.buttonHandledThisFrame.clear();
    } catch (error) {
      console.error('Error polling gamepads:', error);
    }
  }

  handleGamepadInput(gamepad) {
    if (!gamepad) return;

    const currentScreen = this.game.getCurrentScreen();
    if (!currentScreen) return;

    // Update reticle position with left stick (for menu/UI navigation)
    this.updateReticlePosition(gamepad);

    // Handle D-pad and analog stick input
    this.handleDirectionalInput(gamepad, currentScreen);

    // Handle button input based on current game state
    this.handleButtonInput(gamepad, currentScreen);
  }

  handleDirectionalInput(gamepad, currentScreen) {
    const gameState = this.game.gameState;

    // Get analog stick values (with safe array access)
    const leftStickX = this.applyDeadzone(gamepad.axes[0] || 0);
    const leftStickY = this.applyDeadzone(gamepad.axes[1] || 0);
    const rightStickX = this.applyDeadzone(gamepad.axes[2] || 0);
    const rightStickY = this.applyDeadzone(gamepad.axes[3] || 0);

    // D-pad buttons (standard mapping)
    const dpadUp = gamepad.buttons[12]?.pressed;
    const dpadDown = gamepad.buttons[13]?.pressed;
    const dpadLeft = gamepad.buttons[14]?.pressed;
    const dpadRight = gamepad.buttons[15]?.pressed;

    // Determine directional input (combine D-pad and analog stick)
    const moveLeft = dpadLeft || leftStickX < -this.axisThreshold;
    const moveRight = dpadRight || leftStickX > this.axisThreshold;
    const moveUp = dpadUp || leftStickY < -this.axisThreshold;
    const moveDown = dpadDown || leftStickY > this.axisThreshold;

    // Handle right stick scrolling for scrollable windows
    if (Math.abs(rightStickY) > 0.1) {
      if (this.handleScrollableWindowInput(currentScreen, rightStickY)) {
        return; // Handled by scrollable window, don't process other inputs
      }
    }

    // Handle directional movement based on game state
    if (gameState === 'matching') {
      // Match screen: use for keyboard-style sock selection and movement
      if (currentScreen.selectedSock) {
        if (moveLeft) this.simulateKeyPress(currentScreen, 'ArrowLeft');
        if (moveRight) this.simulateKeyPress(currentScreen, 'ArrowRight');
        if (moveUp) this.simulateKeyPress(currentScreen, 'ArrowUp');
        if (moveDown) this.simulateKeyPress(currentScreen, 'ArrowDown');
      }
    } else if (gameState === 'throwing') {
      // Throwing screen: use right stick or D-pad for aiming
      const aimX = rightStickX || (moveRight ? 1 : moveLeft ? -1 : 0);
      const aimY = rightStickY || (moveDown ? 1 : moveUp ? -1 : 0);

      if (Math.abs(aimX) > 0.1 || Math.abs(aimY) > 0.1) {
        // Enable analog stick aiming
        this.handleThrowingAim(currentScreen, aimX, aimY);
      }
    } else if (gameState === 'menu') {
      // Level select: handle menu navigation
      // Skip directional input if story manager or story viewer is open (use reticle instead)
      const storyManagerOpen = currentScreen.game?.storyManager?.showingStory;
      const storyViewerOpen = currentScreen.storyViewer?.isOpen;

      if (!storyManagerOpen && !storyViewerOpen) {
        if (this.buttonJustPressed(gamepad, 'dpad_up', moveUp)) {
          // Navigate up in menu
          this.simulateKeyPress(currentScreen, 'ArrowUp');
        }
        if (this.buttonJustPressed(gamepad, 'dpad_down', moveDown)) {
          // Navigate down in menu
          this.simulateKeyPress(currentScreen, 'ArrowDown');
        }
        if (this.buttonJustPressed(gamepad, 'dpad_left', moveLeft)) {
          this.simulateKeyPress(currentScreen, 'ArrowLeft');
        }
        if (this.buttonJustPressed(gamepad, 'dpad_right', moveRight)) {
          this.simulateKeyPress(currentScreen, 'ArrowRight');
        }
      }
    }
  }

  handleScrollableWindowInput(currentScreen, rightStickY) {
    // Check for audio player (canvas-based scrolling)
    if (currentScreen && currentScreen.audioPlayer?.isOpen) {
      const scrollSpeed = 15; // Adjust sensitivity as needed
      const scrollAmount = rightStickY * scrollSpeed;
      currentScreen.audioPlayer.handleScroll(scrollAmount);
      return true; // Handled
    }

    // Check for achievements drawer (canvas-based scrolling)
    if (currentScreen && currentScreen.achievementsDrawer?.isOpen &&
        currentScreen.achievementsDrawer.animationProgress > 0.5) {
      const scrollSpeed = 15; // Adjust sensitivity as needed
      const scrollAmount = rightStickY * scrollSpeed;

      currentScreen.achievementsDrawer.scrollOffset = Math.max(
        0,
        Math.min(
          currentScreen.achievementsDrawer.maxScroll,
          currentScreen.achievementsDrawer.scrollOffset + scrollAmount
        )
      );
      return true; // Handled
    }

    // Check for credits modal (HTML/CSS-based scrolling)
    if (currentScreen && currentScreen.creditsModal?.classList.contains('visible')) {
      const creditsBody = currentScreen.creditsModal.querySelector('.credits-content');
      if (creditsBody) {
        const scrollSpeed = 20; // Adjust sensitivity as needed
        const scrollAmount = rightStickY * scrollSpeed;
        creditsBody.scrollTop += scrollAmount;
        return true; // Handled
      }
    }

    return false; // Not handled
  }

  handleThrowingAim(currentScreen, aimX, aimY) {
    // Verify screen has the necessary properties and methods
    if (!currentScreen || typeof currentScreen.canThrow !== 'function') {
      return;
    }

    // Initialize keyboard aim if not set
    if (currentScreen.keyboardAimX === null || currentScreen.keyboardAimY === null) {
      currentScreen.keyboardAimX = this.game.getCanvasWidth() / 2;
      currentScreen.keyboardAimY = this.game.getCanvasHeight() / 2;
    }

    // Update aim position with analog stick
    const moveSpeed = this.game.getScaledValue(8); // Faster for analog
    currentScreen.keyboardAimX += aimX * moveSpeed;
    currentScreen.keyboardAimY += aimY * moveSpeed;

    // Clamp to canvas bounds
    currentScreen.keyboardAimX = Math.max(0, Math.min(this.game.getCanvasWidth(), currentScreen.keyboardAimX));
    currentScreen.keyboardAimY = Math.max(0, Math.min(this.game.getCanvasHeight(), currentScreen.keyboardAimY));

    // Update trajectory preview
    if (currentScreen.canThrow() && typeof currentScreen.updateTrajectoryPreview === 'function') {
      currentScreen.updateTrajectoryPreview(currentScreen.keyboardAimX, currentScreen.keyboardAimY);
      currentScreen.showTrajectory = true;
    }
  }

  handleButtonInput(gamepad, currentScreen) {
    const gameState = this.game.gameState;

    // Standard button mapping (based on standard gamepad layout)
    // A button (0) - Primary action (confirm/throw/shoot)
    // B button (1) - Secondary action (cancel/back)
    // X button (2) - Alternative action
    // Y button (3) - Alternative action
    // LB (4), RB (5) - Shoulder buttons
    // LT (6), RT (7) - Triggers
    // Start (9) - Pause
    // Select (8) - Back/Exit

    const aButton = gamepad.buttons[0]?.pressed;
    const bButton = gamepad.buttons[1]?.pressed;
    const xButton = gamepad.buttons[2]?.pressed;
    const yButton = gamepad.buttons[3]?.pressed;
    const lbButton = gamepad.buttons[4]?.pressed;
    const rbButton = gamepad.buttons[5]?.pressed;
    const ltButton = gamepad.buttons[6]?.pressed;
    const rtButton = gamepad.buttons[7]?.pressed;
    const selectButton = gamepad.buttons[8]?.pressed;
    const startButton = gamepad.buttons[9]?.pressed;

    // Handle Start button (pause) - works in matching and throwing
    if (this.buttonJustPressed(gamepad, 9, startButton)) {
      if (gameState === 'matching' || gameState === 'throwing') {
        if (typeof currentScreen.togglePause === 'function') {
          currentScreen.togglePause();
        }
      }
    }

    // Handle Select button (back/exit)
    if (this.buttonJustPressed(gamepad, 8, selectButton)) {
      if (gameState === 'matching' || gameState === 'throwing') {
        // Check if screen has exitToLevelSelect method
        if (typeof currentScreen.exitToLevelSelect === 'function') {
          currentScreen.exitToLevelSelect();
        }
      }
    }

    // Handle A button release (for stopping auto-shoot on sock pile)
    if (this.buttonJustReleased(gamepad, 0, aButton)) {
      if (currentScreen && typeof currentScreen.handleReticleRelease === 'function') {
        currentScreen.handleReticleRelease(this.reticle.x, this.reticle.y);
      }
    }

    // Handle A button for reticle action (in all states)
    // Check this FIRST to allow clicking buttons before other actions
    const aButtonPressed = this.buttonJustPressed(gamepad, 0, aButton);
    if (aButtonPressed) {
      const handled = this.handleReticleAction();
      if (handled) {
        return; // Don't process other A button actions if reticle handled it (clicked a button)
      }
      // If not handled, continue to state-specific handling below
    }

    // Game state specific button handling
    if (gameState === 'matching') {
      // X button - cycle through socks (Tab equivalent)
      if (this.buttonJustPressed(gamepad, 2, xButton)) {
        this.simulateKeyPress(currentScreen, 'Tab');
      }

      // B button - deselect sock or release dragged sock
      if (this.buttonJustPressed(gamepad, 1, bButton)) {
        if (currentScreen.selectedSock) {
          currentScreen.selectedSock = null;
          currentScreen.sockSelectedByKeyboard = false;
        } else if (currentScreen.draggedSock) {
          // Release the dragged sock (simulate mouse up)
          currentScreen.onMouseUp();
        }
      }

    } else if (gameState === 'throwing') {
      // A button was already checked above
      // If we got here and aButtonPressed is true, handleReticleAction returned false
      // (didn't click a button), so throw sockball

      // Check if we should throw (A button that wasn't handled OR RT trigger)
      const rtPressed = this.buttonJustPressed(gamepad, 7, rtButton);
      const shouldThrow = aButtonPressed || rtPressed;

      if (shouldThrow) {
        if (typeof currentScreen.canThrow === 'function' && currentScreen.canThrow()) {
          // Use reticle position if visible, otherwise keyboard aim
          let throwX, throwY;
          if (this.isReticleVisible()) {
            throwX = this.reticle.x;
            throwY = this.reticle.y;
          } else if (currentScreen.keyboardAimX !== null && currentScreen.keyboardAimY !== null) {
            throwX = currentScreen.keyboardAimX;
            throwY = currentScreen.keyboardAimY;
          }

          if (throwX !== undefined && throwY !== undefined) {
            if (typeof currentScreen.throwSockball === 'function') {
              currentScreen.throwSockball(throwX, throwY);
            }
          }
        }
      }

    } else if (gameState === 'menu') {
      // A button is already handled by handleReticleAction above
      // (clicks buttons, selects levels, etc.)

      // Check if audio player is open and handle B button to close it
      if (currentScreen.audioPlayer?.isOpen && this.buttonJustPressed(gamepad, 1, bButton)) {
        currentScreen.audioPlayer.close();
        this.game.audioManager.playSound("button-click", false, 0.5);
        return;
      }

      // Check if achievements drawer is open and handle B button to close it
      if (currentScreen.achievementsDrawer?.isOpen && this.buttonJustPressed(gamepad, 1, bButton)) {
        currentScreen.achievementsDrawer.isOpen = false;
        this.game.audioManager.playSound("button-click", false, 0.5);
        return;
      }

      // B button - back/cancel (handles story viewer, credits, etc.)
      if (this.buttonJustPressed(gamepad, 1, bButton)) {
        this.simulateKeyPress(currentScreen, 'Escape');
      }

    } else if (gameState === 'gameOver') {
      // A button was already checked above
      // If aButtonPressed is true and we got here, use it for continue action
      if (aButtonPressed) {
        this.simulateKeyPress(currentScreen, 'Enter');
      }
    }
  }

  simulateKeyPress(screen, key) {
    const keyEvent = {
      key: key,
      preventDefault: () => {},
      defaultPrevented: false
    };

    if (screen && typeof screen.handleKeyDown === 'function') {
      screen.handleKeyDown(keyEvent);
    }
  }

  buttonJustPressed(gamepad, buttonIndexOrName, currentState) {
    // Check if this button was already handled this frame
    const buttonKey = `${gamepad.index}_${buttonIndexOrName}`;
    if (this.buttonHandledThisFrame.has(buttonKey)) {
      return false;
    }

    // Get previous button state
    const prevState = this.buttonStates.get(buttonKey) || false;

    // Update button state
    this.buttonStates.set(buttonKey, currentState);

    // Button was just pressed if it's currently pressed but wasn't before
    const justPressed = currentState && !prevState;

    if (justPressed) {
      this.buttonHandledThisFrame.add(buttonKey);
    }

    return justPressed;
  }

  buttonJustReleased(gamepad, buttonIndexOrName, currentState) {
    const buttonKey = `${gamepad.index}_${buttonIndexOrName}`;

    // Get previous button state
    const prevState = this.buttonStates.get(buttonKey) || false;

    // Don't update button state here - let buttonJustPressed handle it
    // This prevents state from being overwritten before buttonJustPressed is called

    // Button was just released if it was pressed before but isn't now
    const justReleased = !currentState && prevState;

    // Only update state if button was actually released (to prepare for next frame)
    if (justReleased) {
      this.buttonStates.set(buttonKey, currentState);
    }

    return justReleased;
  }

  applyDeadzone(value) {
    // Guard against undefined/null values
    if (value === undefined || value === null) {
      return 0;
    }

    if (Math.abs(value) < this.axisDeadzone) {
      return 0;
    }
    // Scale the value to account for deadzone
    const sign = Math.sign(value);
    const magnitude = Math.abs(value);
    return sign * ((magnitude - this.axisDeadzone) / (1 - this.axisDeadzone));
  }

  updateReticlePosition(gamepad) {
    if (!this.reticle.visible) return;

    const gameState = this.game.gameState;

    // Show reticle in menu, gameOver, matching, and throwing states
    if (gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'matching' && gameState !== 'throwing') {
      return;
    }

    // Get left stick input (with deadzone applied)
    const stickX = this.applyDeadzone(gamepad.axes[0] || 0);
    const stickY = this.applyDeadzone(gamepad.axes[1] || 0);

    // Calculate speed based on stick magnitude
    const magnitude = Math.sqrt(stickX * stickX + stickY * stickY);

    if (magnitude > 0) {
      // Show reticle when stick is moved
      this.mouseUsedRecently = false;

      // Calculate speed with acceleration
      const speed = this.game.getScaledValue(
        Math.min(
          this.reticleConfig.baseSpeed + (magnitude * this.reticleConfig.acceleration * 4),
          this.reticleConfig.maxSpeed
        )
      );

      // Calculate target position
      let targetX = this.reticle.x + stickX * speed;
      let targetY = this.reticle.y + stickY * speed;

      // Apply button magnetism if enabled
      if (this.reticleConfig.magnetismEnabled) {
        const magneticTarget = this.findNearestButton(targetX, targetY);
        if (magneticTarget) {
          const dx = magneticTarget.x - targetX;
          const dy = magneticTarget.y - targetY;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const magnetRadius = this.game.getScaledValue(this.reticleConfig.magnetismRadius);

          if (distance < magnetRadius) {
            // Apply magnetic pull (stronger as we get closer)
            const pullStrength = this.reticleConfig.magnetismStrength * (1 - distance / magnetRadius);
            targetX += dx * pullStrength;
            targetY += dy * pullStrength;
          }
        }
      }

      // Update position
      this.reticle.x = targetX;
      this.reticle.y = targetY;

      // Clamp to canvas bounds
      this.reticle.x = Math.max(0, Math.min(this.game.getCanvasWidth(), this.reticle.x));
      this.reticle.y = Math.max(0, Math.min(this.game.getCanvasHeight(), this.reticle.y));

      // Notify current screen of reticle movement for hover detection
      const currentScreen = this.game.getCurrentScreen();
      if (currentScreen && typeof currentScreen.handleReticleMove === 'function') {
        currentScreen.handleReticleMove(this.reticle.x, this.reticle.y);
      }
    }
  }

  findNearestButton(x, y) {
    const currentScreen = this.game.getCurrentScreen();
    if (!currentScreen || typeof currentScreen.getInteractiveElements !== 'function') {
      return null;
    }

    const buttons = currentScreen.getInteractiveElements();
    if (!buttons || buttons.length === 0) {
      return null;
    }

    let nearestButton = null;
    let nearestDistance = Infinity;

    for (const button of buttons) {
      // Calculate center of button
      const buttonCenterX = button.x + (button.width || 0) / 2;
      const buttonCenterY = button.y + (button.height || 0) / 2;

      const dx = buttonCenterX - x;
      const dy = buttonCenterY - y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestButton = { x: buttonCenterX, y: buttonCenterY };
      }
    }

    return nearestButton;
  }

  handleReticleAction() {
    if (!this.reticle.visible) return false;

    const gameState = this.game.gameState;

    // Handle reticle actions in menu, gameOver, matching, and throwing states
    if (gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'matching' && gameState !== 'throwing') {
      return false;
    }

    // Trigger pulse animation
    this.reticle.pulseTimer = 1.0;

    // Trigger haptic feedback
    this.triggerHapticFeedback('medium');

    // Notify current screen of reticle action
    const currentScreen = this.game.getCurrentScreen();
    if (currentScreen && typeof currentScreen.handleReticleAction === 'function') {
      return currentScreen.handleReticleAction(this.reticle.x, this.reticle.y);
    }

    return false;
  }

  triggerHapticFeedback(intensity = 'medium') {
    // Get all connected gamepads
    const gamepads = navigator.getGamepads();
    if (!gamepads) return;

    // Vibration patterns based on intensity
    const patterns = {
      light: { duration: 50, weakMagnitude: 0.3, strongMagnitude: 0.1 },
      medium: { duration: 100, weakMagnitude: 0.5, strongMagnitude: 0.3 },
      strong: { duration: 150, weakMagnitude: 0.8, strongMagnitude: 0.6 }
    };

    const pattern = patterns[intensity] || patterns.medium;

    for (let i = 0; i < gamepads.length; i++) {
      const gamepad = gamepads[i];
      if (gamepad && gamepad.vibrationActuator) {
        // Use the Gamepad Haptics API
        if (typeof gamepad.vibrationActuator.playEffect === 'function') {
          gamepad.vibrationActuator.playEffect('dual-rumble', {
            startDelay: 0,
            duration: pattern.duration,
            weakMagnitude: pattern.weakMagnitude,
            strongMagnitude: pattern.strongMagnitude
          }).catch(err => {
            // Silently fail if haptics not supported
            console.debug('Haptic feedback not supported:', err);
          });
        }
      }
    }
  }

  update(deltaTime) {
    if (!this.isSupported) return;

    // Update indicator fade
    if (this.indicatorFadeTimer > 0) {
      this.indicatorFadeTimer -= deltaTime;
      if (this.indicatorFadeTimer <= 0) {
        this.showIndicator = false;
      }
    }

    // Update reticle pulse animation
    if (this.reticle.pulseTimer > 0) {
      this.reticle.pulseTimer -= deltaTime / 1000;
      if (this.reticle.pulseTimer < 0) {
        this.reticle.pulseTimer = 0;
      }
    }

    // Track mouse inactivity
    if (this.mouseUsedRecently) {
      this.mouseInactiveTimer += deltaTime;
      if (this.mouseInactiveTimer >= this.mouseInactiveThreshold) {
        this.mouseUsedRecently = false;
        this.mouseInactiveTimer = 0;
      }
    }
  }

  render(ctx) {
    // Draw controller indicator
    if (this.isSupported && this.showIndicator && this.connectedControllers.size > 0) {
      this.renderControllerIndicator(ctx);
    }

    // Draw reticle on separate overlay canvas
    if (this.isSupported && this.reticle.visible && !this.mouseUsedRecently && this.reticuleCtx) {
      // Sync reticule canvas size with game canvas
      if (this.reticuleCanvas.width !== this.game.canvas.width ||
          this.reticuleCanvas.height !== this.game.canvas.height) {
        this.reticuleCanvas.width = this.game.canvas.width;
        this.reticuleCanvas.height = this.game.canvas.height;
        this.reticuleCanvas.style.width = this.game.canvas.style.width;
        this.reticuleCanvas.style.height = this.game.canvas.style.height;
        this.reticuleCanvas.style.left = this.game.canvas.style.left || '0px';
        this.reticuleCanvas.style.top = this.game.canvas.style.top || '0px';
      }

      // Clear the reticule canvas
      this.reticuleCtx.clearRect(0, 0, this.reticuleCanvas.width, this.reticuleCanvas.height);

      // Render reticule on its own canvas
      this.renderReticle(this.reticuleCtx);
    } else if (this.reticuleCtx) {
      // Clear reticule canvas when not visible
      this.reticuleCtx.clearRect(0, 0, this.reticuleCanvas.width, this.reticuleCanvas.height);
    }
  }

  renderControllerIndicator(ctx) {
    // Draw controller indicator in bottom-right corner
    const canvasWidth = this.game.getCanvasWidth();
    const canvasHeight = this.game.getCanvasHeight();
    const padding = this.game.getScaledValue(20);
    const iconSize = this.game.getScaledValue(40);

    const x = canvasWidth - padding - iconSize;
    const y = canvasHeight - padding - iconSize;

    // Calculate fade alpha
    const alpha = this.indicatorFadeTimer > 1000 ? 0.8 : (this.indicatorFadeTimer / 1000) * 0.8;

    ctx.save();

    // Background
    ctx.fillStyle = `rgba(0, 0, 0, ${alpha * 0.6})`;
    ctx.strokeStyle = `rgba(100, 200, 100, ${alpha})`;
    ctx.lineWidth = 2;

    const radius = this.game.getScaledValue(8);
    const width = iconSize + padding;
    const height = iconSize;

    ctx.beginPath();
    ctx.moveTo(x - padding/2 + radius, y);
    ctx.lineTo(x + width - padding/2 - radius, y);
    ctx.arcTo(x + width - padding/2, y, x + width - padding/2, y + radius, radius);
    ctx.lineTo(x + width - padding/2, y + height - radius);
    ctx.arcTo(x + width - padding/2, y + height, x + width - padding/2 - radius, y + height, radius);
    ctx.lineTo(x - padding/2 + radius, y + height);
    ctx.arcTo(x - padding/2, y + height, x - padding/2, y + height - radius, radius);
    ctx.lineTo(x - padding/2, y + radius);
    ctx.arcTo(x - padding/2, y, x - padding/2 + radius, y, radius);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Controller icon
    ctx.font = `${iconSize * 0.8}px Arial`;
    ctx.fillStyle = `rgba(100, 200, 100, ${alpha})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮', x + iconSize/2 - padding/4, y + height/2);

    ctx.restore();
  }

  renderReticle(ctx) {
    const gameState = this.game.gameState;

    // Render reticle in menu, gameOver, matching, and throwing states
    if (gameState !== 'menu' && gameState !== 'gameOver' && gameState !== 'matching' && gameState !== 'throwing') {
      return;
    }

    const x = this.reticle.x;
    const y = this.reticle.y;
    const size = this.game.getScaledValue(this.reticleConfig.size);
    const glowSize = this.game.getScaledValue(this.reticleConfig.glowSize);

    ctx.save();

    // Pulse effect when action is triggered
    const pulseScale = 1 + (this.reticle.pulseTimer * 0.3);

    // Outer glow (for visibility on any background)
    if (this.reticle.hovered || this.reticle.pulseTimer > 0) {
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * pulseScale + glowSize);
      gradient.addColorStop(0, 'rgba(0, 255, 255, 0.6)');
      gradient.addColorStop(0.5, 'rgba(0, 200, 255, 0.3)');
      gradient.addColorStop(1, 'rgba(0, 150, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, size * pulseScale + glowSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // Outer circle (dark outline for contrast)
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.lineWidth = this.game.getScaledValue(3);
    ctx.beginPath();
    ctx.arc(x, y, size / 2 * pulseScale, 0, Math.PI * 2);
    ctx.stroke();

    // Inner circle (main reticle)
    ctx.strokeStyle = this.reticle.hovered ? '#00FFFF' : '#FFFFFF';
    ctx.lineWidth = this.game.getScaledValue(2);
    ctx.beginPath();
    ctx.arc(x, y, size / 2 * pulseScale, 0, Math.PI * 2);
    ctx.stroke();

    // Center dot
    ctx.fillStyle = this.reticle.hovered ? '#00FFFF' : '#FFFFFF';
    ctx.beginPath();
    ctx.arc(x, y, this.game.getScaledValue(3) * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    // Crosshair lines
    const lineLength = size / 2 + this.game.getScaledValue(4);
    const innerGap = size / 2 + this.game.getScaledValue(2);

    ctx.strokeStyle = this.reticle.hovered ? '#00FFFF' : '#FFFFFF';
    ctx.lineWidth = this.game.getScaledValue(2);

    // Horizontal line
    ctx.beginPath();
    ctx.moveTo(x - lineLength * pulseScale, y);
    ctx.lineTo(x - innerGap * pulseScale, y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + innerGap * pulseScale, y);
    ctx.lineTo(x + lineLength * pulseScale, y);
    ctx.stroke();

    // Vertical line
    ctx.beginPath();
    ctx.moveTo(x, y - lineLength * pulseScale);
    ctx.lineTo(x, y - innerGap * pulseScale);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x, y + innerGap * pulseScale);
    ctx.lineTo(x, y + lineLength * pulseScale);
    ctx.stroke();

    ctx.restore();
  }

  // Check if any controller is connected
  isConnected() {
    return this.connectedControllers.size > 0;
  }

  // Get list of connected controllers
  getConnectedControllers() {
    return Array.from(this.connectedControllers.values());
  }

  // Get reticle position
  getReticlePosition() {
    return {
      x: this.reticle.x,
      y: this.reticle.y
    };
  }

  // Check if reticle is visible
  isReticleVisible() {
    return this.reticle.visible && !this.mouseUsedRecently;
  }

  // Set reticle hover state (called by screens)
  setReticleHoverState(isHovered) {
    this.reticle.hovered = isHovered;
  }

  cleanup() {
    this.removeEventListeners();
    this.connectedControllers.clear();
    this.buttonStates.clear();
    this.reticle.visible = false;
  }
}
