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

    // Start polling if not already polling
    if (!this.pollInterval) {
      this.startPolling();
    }
  }

  handleGamepadDisconnected(e) {
    console.log(`🎮 Controller disconnected: ${e.gamepad.id}`);
    this.connectedControllers.delete(e.gamepad.index);

    // Stop polling if no controllers connected
    if (this.connectedControllers.size === 0) {
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

    // Game state specific button handling
    if (gameState === 'matching') {
      // A button - shoot sock from pile or drop selected sock
      if (this.buttonJustPressed(gamepad, 0, aButton)) {
        if (currentScreen.selectedSock) {
          // Drop selected sock (Enter key equivalent)
          this.simulateKeyPress(currentScreen, 'Enter');
        } else {
          // Shoot sock from pile (Space key equivalent)
          this.simulateKeyPress(currentScreen, ' ');
        }
      }

      // X button - cycle through socks (Tab equivalent)
      if (this.buttonJustPressed(gamepad, 2, xButton)) {
        this.simulateKeyPress(currentScreen, 'Tab');
      }

      // B button - deselect sock
      if (this.buttonJustPressed(gamepad, 1, bButton)) {
        if (currentScreen.selectedSock) {
          currentScreen.selectedSock = null;
          currentScreen.sockSelectedByKeyboard = false;
        }
      }

    } else if (gameState === 'throwing') {
      // A button or RT - throw sockball
      if (this.buttonJustPressed(gamepad, 0, aButton) || this.buttonJustPressed(gamepad, 7, rtButton)) {
        if (typeof currentScreen.canThrow === 'function' && currentScreen.canThrow()) {
          if (currentScreen.keyboardAimX !== null && currentScreen.keyboardAimY !== null) {
            if (typeof currentScreen.throwSockball === 'function') {
              currentScreen.throwSockball(currentScreen.keyboardAimX, currentScreen.keyboardAimY);
            }
          }
        }
      }

    } else if (gameState === 'menu') {
      // A button - select level
      if (this.buttonJustPressed(gamepad, 0, aButton)) {
        this.simulateKeyPress(currentScreen, 'Enter');
      }

      // B button - back/cancel
      if (this.buttonJustPressed(gamepad, 1, bButton)) {
        this.simulateKeyPress(currentScreen, 'Escape');
      }

    } else if (gameState === 'gameOver') {
      // A button - continue
      if (this.buttonJustPressed(gamepad, 0, aButton)) {
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

  update(deltaTime) {
    if (!this.isSupported) return;

    // Update indicator fade
    if (this.indicatorFadeTimer > 0) {
      this.indicatorFadeTimer -= deltaTime;
      if (this.indicatorFadeTimer <= 0) {
        this.showIndicator = false;
      }
    }
  }

  render(ctx) {
    if (!this.isSupported || !this.showIndicator || this.connectedControllers.size === 0) return;

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

    // Controller icon (🎮 emoji)
    ctx.font = `${iconSize * 0.8}px Arial`;
    ctx.fillStyle = `rgba(100, 200, 100, ${alpha})`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('🎮', x + iconSize/2 - padding/4, y + height/2);

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

  cleanup() {
    this.removeEventListeners();
    this.connectedControllers.clear();
    this.buttonStates.clear();
  }
}
