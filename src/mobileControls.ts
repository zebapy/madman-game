// Mobile touch controls for the game

export interface MobileControlsState {
  moveX: number; // -1 to 1 (left/right)
  moveY: number; // -1 to 1 (forward/backward)
  lookX: number; // delta X for camera rotation
  lookY: number; // delta Y for camera rotation
  isSprinting: boolean;
}

export class MobileControls {
  private joystickContainer: HTMLElement | null = null;
  private joystickKnob: HTMLElement | null = null;
  private lookArea: HTMLElement | null = null;
  private sprintButton: HTMLElement | null = null;
  private controlsContainer: HTMLElement | null = null;

  private joystickActive = false;
  private joystickTouchId: number | null = null;
  private joystickCenterX = 0;
  private joystickCenterY = 0;
  private joystickMaxRadius = 40;

  private lookTouchId: number | null = null;
  private lastLookX = 0;
  private lastLookY = 0;

  public state: MobileControlsState = {
    moveX: 0,
    moveY: 0,
    lookX: 0,
    lookY: 0,
    isSprinting: false,
  };

  private isMobile = false;

  constructor() {
    this.isMobile = this.detectMobile();
    if (this.isMobile) {
      this.createControls();
      this.setupEventListeners();
    }
  }

  private detectMobile(): boolean {
    return (
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches
    );
  }

  public isEnabled(): boolean {
    return this.isMobile;
  }

  private createControls() {
    // Create main container
    this.controlsContainer = document.createElement("div");
    this.controlsContainer.id = "mobile-controls";
    this.controlsContainer.innerHTML = `
      <div id="joystick-container">
        <div id="joystick-base">
          <div id="joystick-knob"></div>
        </div>
      </div>
      <div id="look-area"></div>
      <div id="sprint-button">SPRINT</div>
    `;
    document.body.appendChild(this.controlsContainer);

    // Get references to elements
    this.joystickContainer = document.getElementById("joystick-container");
    this.joystickKnob = document.getElementById("joystick-knob");
    this.lookArea = document.getElementById("look-area");
    this.sprintButton = document.getElementById("sprint-button");

    // Add styles
    this.addStyles();
  }

  private addStyles() {
    const style = document.createElement("style");
    style.textContent = `
      #mobile-controls {
        display: block;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 1000;
        touch-action: none;
      }

      @media (hover: hover) and (pointer: fine) {
        #mobile-controls {
          display: none !important;
        }
      }

      #joystick-container {
        position: absolute;
        bottom: clamp(20px, 5vh, 60px);
        left: clamp(20px, 5vw, 60px);
        width: clamp(100px, 25vw, 140px);
        height: clamp(100px, 25vw, 140px);
        pointer-events: auto;
        touch-action: none;
      }

      #joystick-base {
        width: 100%;
        height: 100%;
        background: rgba(255, 255, 255, 0.15);
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #joystick-knob {
        width: 45%;
        height: 45%;
        background: rgba(255, 255, 255, 0.4);
        border: 2px solid rgba(255, 255, 255, 0.6);
        border-radius: 50%;
        transition: transform 0.05s ease-out;
      }

      #look-area {
        position: absolute;
        top: 0;
        right: 0;
        width: 50%;
        height: 100%;
        pointer-events: auto;
        touch-action: none;
      }

      #sprint-button {
        position: absolute;
        bottom: clamp(20px, 5vh, 60px);
        right: clamp(20px, 5vw, 60px);
        width: clamp(70px, 18vw, 100px);
        height: clamp(70px, 18vw, 100px);
        background: rgba(255, 100, 100, 0.2);
        border: 2px solid rgba(255, 100, 100, 0.4);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(255, 255, 255, 0.6);
        font-family: 'Georgia', serif;
        font-size: clamp(9px, 2.5vw, 12px);
        font-weight: bold;
        pointer-events: auto;
        touch-action: none;
        user-select: none;
        -webkit-user-select: none;
      }

      #sprint-button.active {
        background: rgba(255, 100, 100, 0.5);
        border-color: rgba(255, 100, 100, 0.8);
        color: rgba(255, 255, 255, 0.9);
      }
    `;
    document.head.appendChild(style);
  }

  private setupEventListeners() {
    if (!this.joystickContainer || !this.lookArea || !this.sprintButton) return;

    // Joystick controls
    this.joystickContainer.addEventListener(
      "touchstart",
      this.onJoystickStart.bind(this),
      { passive: false }
    );
    this.joystickContainer.addEventListener(
      "touchmove",
      this.onJoystickMove.bind(this),
      { passive: false }
    );
    this.joystickContainer.addEventListener(
      "touchend",
      this.onJoystickEnd.bind(this),
      { passive: false }
    );
    this.joystickContainer.addEventListener(
      "touchcancel",
      this.onJoystickEnd.bind(this),
      { passive: false }
    );

    // Look area controls
    this.lookArea.addEventListener("touchstart", this.onLookStart.bind(this), {
      passive: false,
    });
    this.lookArea.addEventListener("touchmove", this.onLookMove.bind(this), {
      passive: false,
    });
    this.lookArea.addEventListener("touchend", this.onLookEnd.bind(this), {
      passive: false,
    });
    this.lookArea.addEventListener("touchcancel", this.onLookEnd.bind(this), {
      passive: false,
    });

    // Sprint button
    this.sprintButton.addEventListener(
      "touchstart",
      this.onSprintStart.bind(this),
      { passive: false }
    );
    this.sprintButton.addEventListener(
      "touchend",
      this.onSprintEnd.bind(this),
      { passive: false }
    );
    this.sprintButton.addEventListener(
      "touchcancel",
      this.onSprintEnd.bind(this),
      { passive: false }
    );
  }

  private onJoystickStart(e: TouchEvent) {
    e.preventDefault();
    if (this.joystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.joystickTouchId = touch.identifier;
    this.joystickActive = true;

    const rect = this.joystickContainer!.getBoundingClientRect();
    this.joystickCenterX = rect.left + rect.width / 2;
    this.joystickCenterY = rect.top + rect.height / 2;

    this.updateJoystick(touch.clientX, touch.clientY);
  }

  private onJoystickMove(e: TouchEvent) {
    e.preventDefault();
    if (this.joystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.joystickTouchId) {
        this.updateJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private onJoystickEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.joystickTouchId) {
        this.joystickTouchId = null;
        this.joystickActive = false;
        this.state.moveX = 0;
        this.state.moveY = 0;

        if (this.joystickKnob) {
          this.joystickKnob.style.transform = "translate(0px, 0px)";
        }
        break;
      }
    }
  }

  private updateJoystick(touchX: number, touchY: number) {
    let dx = touchX - this.joystickCenterX;
    let dy = touchY - this.joystickCenterY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > this.joystickMaxRadius) {
      dx = (dx / distance) * this.joystickMaxRadius;
      dy = (dy / distance) * this.joystickMaxRadius;
    }

    // Normalize to -1 to 1 (guard against division by zero)
    const radius = this.joystickMaxRadius || 1;
    this.state.moveX = dx / radius;
    this.state.moveY = -dy / radius; // Invert Y so up is forward

    if (this.joystickKnob) {
      this.joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
  }

  private onLookStart(e: TouchEvent) {
    e.preventDefault();
    if (this.lookTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.lookTouchId = touch.identifier;
    this.lastLookX = touch.clientX;
    this.lastLookY = touch.clientY;
  }

  private onLookMove(e: TouchEvent) {
    e.preventDefault();
    if (this.lookTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.lookTouchId) {
        const dx = touch.clientX - this.lastLookX;
        const dy = touch.clientY - this.lastLookY;

        this.state.lookX = dx;
        this.state.lookY = dy;

        this.lastLookX = touch.clientX;
        this.lastLookY = touch.clientY;
        break;
      }
    }
  }

  private onLookEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookTouchId) {
        this.lookTouchId = null;
        this.state.lookX = 0;
        this.state.lookY = 0;
        break;
      }
    }
  }

  private onSprintStart(e: TouchEvent) {
    e.preventDefault();
    this.state.isSprinting = true;
    if (this.sprintButton) {
      this.sprintButton.classList.add("active");
    }
  }

  private onSprintEnd(e: TouchEvent) {
    this.state.isSprinting = false;
    if (this.sprintButton) {
      this.sprintButton.classList.remove("active");
    }
  }

  // Call this after reading look values to reset them
  public consumeLookDelta() {
    this.state.lookX = 0;
    this.state.lookY = 0;
  }
}

// Singleton instance
export const mobileControls = new MobileControls();
