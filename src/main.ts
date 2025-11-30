import * as THREE from "three";
import "./style.css";
import {
  initializeMaze,
  allWallLights,
  allPortraits,
  setDebugMode,
} from "./maze";
import { Player } from "./player";
import { audioSystem } from "./audio";
import { allTVLights } from "./decorations";

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

// TV light flickering effect (simulates old CRT TV)
function updateTVLights(time: number) {
  allTVLights.forEach((light) => {
    const phase = light.userData.tvPhase || 0;
    const speed = light.userData.tvSpeed || 1;

    // Combine multiple frequencies for realistic TV flicker
    const flicker1 = Math.sin(time * 15 * speed + phase) * 0.3;
    const flicker2 = Math.sin(time * 23 * speed + phase * 1.5) * 0.2;
    const flicker3 = Math.sin(time * 7 * speed + phase * 0.7) * 0.15;

    // Occasional brightness spikes (scene changes)
    const spike = Math.random() > 0.995 ? 0.5 : 0;

    // Random color shifts between blue-ish tones
    const colorShift = Math.sin(time * 3 + phase) * 0.5 + 0.5;
    light.color.setRGB(
      0.4 + colorShift * 0.2,
      0.5 + colorShift * 0.1,
      0.8 + colorShift * 0.2
    );

    light.intensity = Math.max(
      0.2,
      0.6 + flicker1 + flicker2 + flicker3 + spike
    );
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
  updateTVLights(time);

  renderer.render(scene, camera);
}

animate();

// Instructions overlay
const instructions = document.createElement("div");
instructions.innerHTML = `
  <div style="position: fixed; bottom: 20px; left: 20px; color: #444; font-family: 'Georgia', serif; font-size: 12px; text-shadow: 0 0 10px rgba(0,0,0,0.8);">
    Click to look around<br>
    WASD / Arrow keys to move<br>
    Hold Shift to sprint<br>
    ESC to release mouse<br>
    <br>
    Explore the infinite maze...
  </div>
`;
document.body.appendChild(instructions);

// Debug menu
const debugMenu = document.createElement("div");
debugMenu.id = "debug-menu-container";
debugMenu.style.display = "none"; // Hidden by default
debugMenu.innerHTML = `
  <div id="debug-menu" style="position: fixed; top: 20px; right: 20px; background: rgba(0,0,0,0.8); padding: 15px; border-radius: 5px; font-family: monospace; font-size: 12px; color: #fff;">
    <div style="margin-bottom: 10px; font-weight: bold; color: #ff6600;">Debug Menu</div>
    <label style="display: flex; align-items: center; cursor: pointer;">
      <input type="checkbox" id="debug-toggle" checked style="margin-right: 8px;">
      Show chunk boundaries
    </label>
    <div id="debug-info" style="margin-top: 10px; color: #888; display: block;">
      <div>Red lines = chunk bounds</div>
      <div>Green lines = junction openings</div>
      <div>Labels show chunk ID & type</div>
    </div>
    <hr style="border-color: #444; margin: 10px 0;">
    <div style="margin-bottom: 8px; font-weight: bold; color: #ff6600;">Audio Controls</div>
    <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 5px;">
      <input type="checkbox" id="mute-all" style="margin-right: 8px;">
      Mute All
    </label>
    <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 5px;">
      <input type="checkbox" id="mute-music" style="margin-right: 8px;">
      Mute Music
    </label>
    <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 5px;">
      <input type="checkbox" id="mute-sfx" style="margin-right: 8px;">
      Mute SFX
    </label>
    <div style="margin-top: 8px;">
      <label style="display: block; margin-bottom: 3px;">Music Volume</label>
      <input type="range" id="music-volume" min="0" max="100" value="30" style="width: 100%;">
    </div>
    <div style="margin-top: 8px;">
      <label style="display: block; margin-bottom: 3px;">SFX Volume</label>
      <input type="range" id="sfx-volume" min="0" max="100" value="50" style="width: 100%;">
    </div>
  </div>
`;
document.body.appendChild(debugMenu);

const debugToggle = document.getElementById("debug-toggle") as HTMLInputElement;
const debugInfo = document.getElementById("debug-info") as HTMLElement;

debugToggle.addEventListener("change", () => {
  setDebugMode(debugToggle.checked, scene);
  debugInfo.style.display = debugToggle.checked ? "block" : "none";
});

// Initially disable debug mode since menu is hidden
setDebugMode(false, scene);

// Audio controls
const muteAllToggle = document.getElementById("mute-all") as HTMLInputElement;
const muteMusicToggle = document.getElementById(
  "mute-music"
) as HTMLInputElement;
const muteSfxToggle = document.getElementById("mute-sfx") as HTMLInputElement;
const musicVolumeSlider = document.getElementById(
  "music-volume"
) as HTMLInputElement;
const sfxVolumeSlider = document.getElementById(
  "sfx-volume"
) as HTMLInputElement;

muteAllToggle.addEventListener("change", () => {
  audioSystem.setMasterMute(muteAllToggle.checked);
});

muteMusicToggle.addEventListener("change", () => {
  audioSystem.setMusicMute(muteMusicToggle.checked);
});

muteSfxToggle.addEventListener("change", () => {
  audioSystem.setSfxMute(muteSfxToggle.checked);
});

musicVolumeSlider.addEventListener("input", () => {
  audioSystem.setMusicVolume(parseInt(musicVolumeSlider.value) / 100);
});

sfxVolumeSlider.addEventListener("input", () => {
  audioSystem.setSfxVolume(parseInt(sfxVolumeSlider.value) / 100);
});

// Initialize audio on first user interaction
const initAudio = async () => {
  await audioSystem.initialize();
  document.removeEventListener("click", initAudio);
  document.removeEventListener("keydown", initAudio);
};

document.addEventListener("click", initAudio);
document.addEventListener("keydown", initAudio);

// Resume audio context when user interacts (handles browser autoplay restrictions)
document.addEventListener("click", () => audioSystem.resumeAudio());

// Toggle debug menu with '/' key
let debugMenuVisible = false;
document.addEventListener("keydown", (e) => {
  if (e.key === "/") {
    e.preventDefault();
    debugMenuVisible = !debugMenuVisible;
    debugMenu.style.display = debugMenuVisible ? "block" : "none";

    // Also toggle debug mode when menu is shown/hidden
    setDebugMode(debugMenuVisible && debugToggle.checked, scene);
  }
});
