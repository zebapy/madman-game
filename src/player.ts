import * as THREE from "three";
import { MOVE_SPEED } from "./constants";
import { checkWallCollision, updateSegments } from "./maze";

export class Player {
  private camera: THREE.PerspectiveCamera;
  private scene: THREE.Scene;
  private renderer: THREE.WebGLRenderer;

  private keys: { [key: string]: boolean } = {};
  private yaw = 0;
  private pitch = 0;
  private isPointerLocked = false;
  private isMouseDown = false;

  constructor(
    camera: THREE.PerspectiveCamera,
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer
  ) {
    this.camera = camera;
    this.scene = scene;
    this.renderer = renderer;

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

  setPosition(x: number, y: number, z: number) {
    this.camera.position.set(x, y, z);
  }

  update() {
    const direction = new THREE.Vector3();

    if (this.keys["KeyW"] || this.keys["ArrowUp"] || this.isMouseDown)
      direction.z -= 1;
    if (this.keys["KeyS"] || this.keys["ArrowDown"]) direction.z += 1;
    if (this.keys["KeyA"] || this.keys["ArrowLeft"]) direction.x -= 1;
    if (this.keys["KeyD"] || this.keys["ArrowRight"]) direction.x += 1;

    if (direction.length() > 0) {
      direction.normalize();
      direction.multiplyScalar(MOVE_SPEED);

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

    this.camera.rotation.order = "YXZ";
    this.camera.rotation.y = this.yaw;
    this.camera.rotation.x = this.pitch;

    // Update loaded segments based on new position
    updateSegments(this.camera.position.x, this.camera.position.z, this.scene);
  }
}
