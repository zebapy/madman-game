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
  private lookJoystickContainer: HTMLElement | null = null;
  private lookJoystickKnob: HTMLElement | null = null;
  private sprintButton: HTMLElement | null = null;
  private controlsContainer: HTMLElement | null = null;

  private joystickActive = false;
  private joystickTouchId: number | null = null;
  private joystickCenterX = 0;
  private joystickCenterY = 0;
  private joystickMaxRadius = 40;

  private lookJoystickTouchId: number | null = null;
  private lookJoystickCenterX = 0;
  private lookJoystickCenterY = 0;
  private lookJoystickMaxRadius = 40;

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
      <div id="look-joystick-container">
        <div id="look-joystick-base">
          <div id="look-joystick-knob"></div>
        </div>
      </div>
      <div id="sprint-button">SPRINT</div>
    `;
    document.body.appendChild(this.controlsContainer);

    // Get references to elements
    this.joystickContainer = document.getElementById("joystick-container");
    this.joystickKnob = document.getElementById("joystick-knob");
    this.lookJoystickContainer = document.getElementById("look-joystick-container");
    this.lookJoystickKnob = document.getElementById("look-joystick-knob");
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

      #look-joystick-container {
        position: absolute;
        bottom: clamp(20px, 5vh, 60px);
        right: clamp(20px, 5vw, 60px);
        width: clamp(100px, 25vw, 140px);
        height: clamp(100px, 25vw, 140px);
        pointer-events: auto;
        touch-action: none;
      }

      #look-joystick-base {
        width: 100%;
        height: 100%;
        background: rgba(100, 150, 255, 0.15);
        border: 2px solid rgba(100, 150, 255, 0.3);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
      }

      #look-joystick-knob {
        width: 45%;
        height: 45%;
        background: rgba(100, 150, 255, 0.4);
        border: 2px solid rgba(100, 150, 255, 0.6);
        border-radius: 50%;
        transition: transform 0.05s ease-out;
      }

      #sprint-button {
        position: absolute;
        bottom: clamp(140px, 30vh, 200px);
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
    if (!this.joystickContainer || !this.lookJoystickContainer || !this.sprintButton) return;

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

    // Look joystick controls
    this.lookJoystickContainer.addEventListener(
      "touchstart",
      this.onLookJoystickStart.bind(this),
      { passive: false }
    );
    this.lookJoystickContainer.addEventListener(
      "touchmove",
      this.onLookJoystickMove.bind(this),
      { passive: false }
    );
    this.lookJoystickContainer.addEventListener(
      "touchend",
      this.onLookJoystickEnd.bind(this),
      { passive: false }
    );
    this.lookJoystickContainer.addEventListener(
      "touchcancel",
      this.onLookJoystickEnd.bind(this),
      { passive: false }
    );

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

  private onLookJoystickStart(e: TouchEvent) {
    e.preventDefault();
    if (this.lookJoystickTouchId !== null) return;

    const touch = e.changedTouches[0];
    this.lookJoystickTouchId = touch.identifier;

    const rect = this.lookJoystickContainer!.getBoundingClientRect();
    this.lookJoystickCenterX = rect.left + rect.width / 2;
    this.lookJoystickCenterY = rect.top + rect.height / 2;

    this.updateLookJoystick(touch.clientX, touch.clientY);
  }

  private onLookJoystickMove(e: TouchEvent) {
    e.preventDefault();
    if (this.lookJoystickTouchId === null) return;

    for (let i = 0; i < e.changedTouches.length; i++) {
      const touch = e.changedTouches[i];
      if (touch.identifier === this.lookJoystickTouchId) {
        this.updateLookJoystick(touch.clientX, touch.clientY);
        break;
      }
    }
  }

  private onLookJoystickEnd(e: TouchEvent) {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === this.lookJoystickTouchId) {
        this.lookJoystickTouchId = null;
        this.state.lookX = 0;
        this.state.lookY = 0;

        if (this.lookJoystickKnob) {
          this.lookJoystickKnob.style.transform = "translate(0px, 0px)";
        }
        break;
      }
    }
  }

  private updateLookJoystick(touchX: number, touchY: number) {
    let dx = touchX - this.lookJoystickCenterX;
    let dy = touchY - this.lookJoystickCenterY;

    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > this.lookJoystickMaxRadius) {
      dx = (dx / distance) * this.lookJoystickMaxRadius;
      dy = (dy / distance) * this.lookJoystickMaxRadius;
    }

    // Normalize to -1 to 1 (guard against division by zero)
    const radius = this.lookJoystickMaxRadius || 1;
    this.state.lookX = dx / radius;
    this.state.lookY = dy / radius;

    if (this.lookJoystickKnob) {
      this.lookJoystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
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
}

// Singleton instance
export const mobileControls = new MobileControls();
