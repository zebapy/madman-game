import * as THREE from "three";
import "./style.css";
import { initializeMaze, allWallLights, allPortraits } from "./maze";
import { Player } from "./player";

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 1, 18);

// Camera setup (first person)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById("app")!.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x1a1010, 0.6);
scene.add(ambientLight);

// Initialize maze and get starting position
const startPos = initializeMaze(scene);

// Create player
const player = new Player(camera, scene, renderer);
player.setPosition(startPos.x, 1.6, startPos.z);

// Animation functions
function updateLights(time: number) {
  allWallLights.forEach((light, index) => {
    const baseIntensity = 0.7;
    const flicker =
      Math.sin(time * 8 + index * 3) * 0.15 +
      Math.sin(time * 17 + index * 7) * 0.08 +
      (Math.random() > 0.98 ? -0.3 : 0);
    light.intensity = Math.max(0.1, baseIntensity + flicker);
  });
}

function updatePortraits(time: number) {
  allPortraits.forEach((portrait, index) => {
    if (portrait.userData.baseTilt !== undefined) {
      const sway = Math.sin(time * 0.5 + index * 2) * 0.005;
      portrait.rotation.z = portrait.userData.baseTilt + sway;
    }
  });
}

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Main animation loop
function animate() {
  requestAnimationFrame(animate);

  const time = performance.now() * 0.001;

  player.update();
  updateLights(time);
  updatePortraits(time);

  renderer.render(scene, camera);
}

animate();

// Instructions overlay
const instructions = document.createElement("div");
instructions.innerHTML = `
  <div style="position: fixed; bottom: 20px; left: 20px; color: #444; font-family: 'Georgia', serif; font-size: 12px; text-shadow: 0 0 10px rgba(0,0,0,0.8);">
    Click to look around<br>
    WASD / Arrow keys to move<br>
    ESC to release mouse<br>
    <br>
    Explore the infinite maze...
  </div>
`;
document.body.appendChild(instructions);
