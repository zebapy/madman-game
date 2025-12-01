import * as THREE from "three";
import {
  MOVE_SPEED,
  SPRINT_SPEED,
  MAX_STAMINA,
  STAMINA_DRAIN_RATE,
  STAMINA_REGEN_RATE,
  STAMINA_REGEN_DELAY,
} from "./constants";
import { checkWallCollision, updateSegments } from "./maze";
import { audioSystem } from "./audio";
import { mobileControls } from "./mobileControls";

export class Player {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private keys: { [key: string]: boolean } = {};
  private yaw = 0;
  private pitch = 0;
  private isPointerLocked = false;
  private isMouseDown = false;

  // Camera shake / head bob for footsteps
  private bobTime = 0;
  private readonly bobFrequency = 12; // How fast the bob cycles
  private readonly bobAmplitudeY = 0.03; // Vertical bob amount
  private readonly bobAmplitudeX = 0.015; // Horizontal sway amount
  private baseY = 0; // Store the base camera height

  // Stamina system
  private stamina = MAX_STAMINA;
  private staminaRegenDelay = 0;
  private staminaBar: HTMLElement | null = null;
  private staminaContainer: HTMLElement | null = null;
  private wasRunning = false;
  private sprintDuration = 0;
  private readonly minSprintDurationForSound = 120; // ~2 seconds at 60fps

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;

    this.staminaBar = document.getElementById("stamina-bar");
    this.staminaContainer = document.getElementById("stamina-container");

    this.setupEventListeners();
  }

  private setupEventListeners() {
    window.addEventListener("keydown", (e) => {
      this.keys[e.code] = true;
    });

    window.addEventListener("keyup", (e) => {
      this.keys[e.code] = false;
    });

    this.renderer.domElement.addEventListener("click", () => {
      this.renderer.domElement.requestPointerLock();
    });

    this.renderer.domElement.addEventListener("mousedown", (e) => {
      if (e.button === 0) this.isMouseDown = true;
    });

    this.renderer.domElement.addEventListener("mouseup", (e) => {
      if (e.button === 0) this.isMouseDown = false;
    });

    document.addEventListener("pointerlockchange", () => {
      this.isPointerLocked =
        document.pointerLockElement === this.renderer.domElement;
    });

    document.addEventListener("mousemove", (e) => {
      if (!this.isPointerLocked) return;

      this.yaw -= e.movementX * 0.002;
      this.pitch -= e.movementY * 0.002;
      this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));
    });
  }

  private updateStaminaUI() {
    if (!this.staminaBar || !this.staminaContainer) return;

    const staminaPercent = (this.stamina / MAX_STAMINA) * 100;
    this.staminaBar.style.width = `${staminaPercent}%`;

    // Show/hide stamina bar based on stamina level
    if (this.stamina < MAX_STAMINA) {
      this.staminaContainer.classList.add("visible");
    } else {
      this.staminaContainer.classList.remove("visible");
    }

    // Add low stamina warning color
    if (staminaPercent < 25) {
      this.staminaBar.classList.add("low");
    } else {
      this.staminaBar.classList.remove("low");
    }
  }

  setPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
    this.baseY = y; // Store base height for head bob
  }

  update() {
    const direction = new THREE.Vector3();

    // Handle mobile touch controls
    if (mobileControls.isEnabled()) {
      // Apply mobile look controls (continuous joystick-based)
      const lookSensitivity = 0.03;
      this.yaw -= mobileControls.state.lookX * lookSensitivity;
      this.pitch -= mobileControls.state.lookY * lookSensitivity;
      this.pitch = Math.max(-Math.PI / 3, Math.min(Math.PI / 3, this.pitch));

      // Mobile movement
      if (Math.abs(mobileControls.state.moveX) > 0.1 || Math.abs(mobileControls.state.moveY) > 0.1) {
        direction.x = mobileControls.state.moveX;
        direction.z = -mobileControls.state.moveY; // Forward is negative Z
      }
    }

    // Keyboard controls (also work on desktop)
    if (this.keys["KeyW"] || this.keys["ArrowUp"] || this.isMouseDown)
      direction.z -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) direction.z += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) direction.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) direction.x += 1;

    let isMoving = false;
    const wantsToRun = this.keys["ShiftLeft"] || this.keys["ShiftRight"] || mobileControls.state.isSprinting;
    const canRun = this.stamina > 0;
    const isRunning = wantsToRun && canRun && direction.length() > 0;

    // Update stamina
    if (isRunning) {
      this.stamina = Math.max(0, this.stamina - STAMINA_DRAIN_RATE);
      this.staminaRegenDelay = STAMINA_REGEN_DELAY;
      this.sprintDuration++;
    } else if (this.staminaRegenDelay > 0) {
      this.staminaRegenDelay--;
    } else {
      this.stamina = Math.min(MAX_STAMINA, this.stamina + STAMINA_REGEN_RATE);
    }

    // Play sound when sprint ends (only if sprinted for a few seconds)
    if (
      this.wasRunning &&
      !isRunning &&
      this.sprintDuration >= this.minSprintDurationForSound
    ) {
      audioSystem.onSprintEnd();
    }
    if (!isRunning) {
      this.sprintDuration = 0;
    }
    this.wasRunning = isRunning;

    // Update stamina UI
    this.updateStaminaUI();

    if (direction.length() > 0) {
      isMoving = true;
      direction.normalize();
      const currentSpeed = isRunning ? SPRINT_SPEED : MOVE_SPEED;
      direction.multiplyScalar(currentSpeed);

      // Rotate movement direction by camera yaw
      const rotatedDirection = new THREE.Vector3(
        direction.x * Math.cos(this.yaw) + direction.z * Math.sin(this.yaw),
        0,
        -direction.x * Math.sin(this.yaw) + direction.z * Math.cos(this.yaw)
      );

      const newX = this.camera.position.x + rotatedDirection.x;
      const newZ = this.camera.position.z + rotatedDirection.z;

      // Simple collision: only move if not hitting a wall
      if (!checkWallCollision(newX, this.camera.position.z)) {
        this.camera.position.x = newX;
      }
      if (!checkWallCollision(this.camera.position.x, newZ)) {
        this.camera.position.z = newZ;
      }
    }

    // Apply footstep camera shake (head bob)
    if (isMoving) {
      this.bobTime += this.bobFrequency * 0.016; // ~60fps timestep
      const bobY = Math.sin(this.bobTime) * this.bobAmplitudeY;
      const bobX = Math.sin(this.bobTime * 0.5) * this.bobAmplitudeX;

      this.camera.position.y = this.baseY + bobY;
      // Apply subtle horizontal sway based on camera yaw
      this.camera.position.x += Math.cos(this.yaw) * bobX;
      this.camera.position.z += Math.sin(this.yaw) * bobX;
    } else {
      // Smoothly return to base position when not moving
      this.camera.position.y += (this.baseY - this.camera.position.y) * 0.1;
    }

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Update loaded segments based on new position and handle audio events
    const chunkInfo = updateSegments(
      this.camera.position.x,
      this.camera.position.z,
      this.scene
    );

    // Update audio listener position (player's ears)
    const forwardX = Math.sin(this.yaw);
    const forwardZ = -Math.cos(this.yaw);
    audioSystem.updateListenerPosition(
      this.camera.position.x,
      this.camera.position.y,
      this.camera.position.z,
      forwardX,
      forwardZ
    );

    if (chunkInfo) {
      // Handle junction entry events
      if (chunkInfo.type === "junction" && chunkInfo.changed) {
        audioSystem.onJunctionEnter(
          chunkInfo.id,
          chunkInfo.worldX,
          chunkInfo.worldZ
        );
      }

      // Handle hallway ambient sounds
      if (chunkInfo.type === "hallway") {
        audioSystem.onHallwayUpdate(chunkInfo.worldX, chunkInfo.worldZ);
      } else {
        audioSystem.onJunctionUpdate();
      }
    }
  }
}
