import * as THREE from "three";
import {
  EffectComposer,
  EffectPass,
  RenderPass,
  PixelationEffect,
} from "postprocessing";
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

// Create fade overlay and intro text
function createIntroElements() {
  // Fade overlay
  const fadeOverlay = document.createElement("div");
  fadeOverlay.id = "fade-overlay";
  document.body.appendChild(fadeOverlay);

  // Intro text
  const introText = document.createElement("div");
  introText.id = "intro-text";
  introText.innerHTML = `
    <span class="title">madman writing on the wall says</span>
    <span class="line">"1 knock, wrong way"</span>
    <span class="line">"2 knocks, try again"</span>
    <span class="line">"3 knocks, run"</span>
  `;
  document.body.appendChild(introText);

  return { fadeOverlay, introText };
}

// Animate intro sequence
function playIntroSequence(fadeOverlay: HTMLElement, introText: HTMLElement) {
  // Start fade from black after a short delay
  setTimeout(() => {
    fadeOverlay.classList.add("fade-out");
  }, 500);

  // Show intro text container
  setTimeout(() => {
    introText.classList.add("visible");
  }, 1000);

  // Animate each line with staggered timing
  const lines = introText.querySelectorAll(".line");
  lines.forEach((line, index) => {
    setTimeout(() => {
      line.classList.add("visible");
    }, 1500 + index * 800);
  });

  // Fade out intro text
  setTimeout(() => {
    introText.classList.remove("visible");
  }, 7000);

  // Remove overlay from DOM after animations complete
  setTimeout(() => {
    fadeOverlay.remove();
    introText.remove();
  }, 9000);
}

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x050505);
scene.fog = new THREE.Fog(0x050505, 1, 14); // Slightly closer fog for better performance

// Camera setup (first person)
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);

// Renderer setup - optimized for Firefox compatibility
const renderer = new THREE.WebGLRenderer({
  antialias: false, // Disable for better performance (pixelation effect makes this less noticeable)
  powerPreference: "high-performance",
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Cap pixel ratio lower for Firefox
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.BasicShadowMap; // Use basic shadows for better Firefox performance
document.getElementById("app")!.appendChild(renderer.domElement);

// Post-processing setup
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const pixelationEffect = new PixelationEffect(4);
composer.addPass(new EffectPass(camera, pixelationEffect));

// Lighting
const ambientLight = new THREE.AmbientLight(0x1a1010, 0.6);
scene.add(ambientLight);

// Initialize maze and get starting position
const startPos = initializeMaze(scene);

// Create player
const player = new Player(camera, scene, renderer);
player.setPosition(startPos.x, 1.6, startPos.z);

// Animation functions - optimized to update less frequently
let lightUpdateCounter = 0;
function updateLights(time: number) {
  // Only update every 3rd frame to reduce overhead
  lightUpdateCounter++;
  if (lightUpdateCounter % 3 !== 0) return;

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

// TV light flickering effect (simulates old CRT TV) - optimized
let tvUpdateCounter = 0;
function updateTVLights(time: number) {
  // Only update every 2nd frame
  tvUpdateCounter++;
  if (tvUpdateCounter % 2 !== 0) return;

  allTVLights.forEach((light) => {
    const phase = light.userData.tvPhase || 0;
    const speed = light.userData.tvSpeed || 1;

    // Simplified flicker calculation (fewer sin calls)
    const flicker = Math.sin(time * 12 * speed + phase) * 0.4;

    // Occasional brightness spikes (scene changes)
    const spike = Math.random() > 0.995 ? 0.5 : 0;

    // Simplified color (less frequent updates)
    const colorShift = Math.sin(time * 3 + phase) * 0.5 + 0.5;
    light.color.setRGB(
      0.4 + colorShift * 0.2,
      0.5 + colorShift * 0.1,
      0.8 + colorShift * 0.2
    );

    light.intensity = Math.max(0.2, 0.6 + flicker + spike);
  });
}

// Resize handler
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
});

// Main animation loop - with frame rate limiting for Firefox
let lastFrameTime = 0;
const targetFrameTime = 1000 / 60; // Target 60fps

function animate(currentTime: number = 0) {
  requestAnimationFrame(animate);

  // Frame rate limiting - prevents Firefox from overworking
  const deltaTime = currentTime - lastFrameTime;
  if (deltaTime < targetFrameTime * 0.9) return; // Allow some tolerance
  lastFrameTime = currentTime;

  const time = performance.now() * 0.001;

  player.update();
  updateLights(time);
  updatePortraits(time);
  updateTVLights(time);

  composer.render();
}

// Create intro elements and start the intro sequence
const { fadeOverlay, introText } = createIntroElements();
playIntroSequence(fadeOverlay, introText);

animate();

// Show appropriate instructions based on device (hide on mobile)
const style = document.createElement("style");
style.textContent = `
  @media (hover: none) and (pointer: coarse) {
    .desktop-instructions { display: none !important; }
  }
`;
document.head.appendChild(style);

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
    <hr style="border-color: #444; margin: 10px 0;">
    <div style="margin-bottom: 8px; font-weight: bold; color: #ff6600;">Graphics</div>
    <label style="display: flex; align-items: center; cursor: pointer; margin-bottom: 5px;">
      <input type="checkbox" id="pixelation-toggle" checked style="margin-right: 8px;">
      Pixelation Effect
    </label>
    <div style="margin-top: 8px;">
      <label style="display: block; margin-bottom: 3px;">Pixel Size: <span id="pixel-size-value">4</span></label>
      <input type="range" id="pixel-size-slider" min="1" max="12" value="4" style="width: 100%;">
    </div>
    <div style="margin-top: 8px;">
      <label style="display: block; margin-bottom: 3px;">FOV: <span id="fov-value">75</span>°</label>
      <input type="range" id="fov-slider" min="50" max="100" value="75" style="width: 100%;">
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

// Pixelation toggle and size slider
const pixelationToggle = document.getElementById(
  "pixelation-toggle"
) as HTMLInputElement;
const pixelSizeSlider = document.getElementById(
  "pixel-size-slider"
) as HTMLInputElement;
const pixelSizeValue = document.getElementById(
  "pixel-size-value"
) as HTMLElement;

pixelationToggle.addEventListener("change", () => {
  pixelationEffect.granularity = pixelationToggle.checked
    ? parseInt(pixelSizeSlider.value)
    : 0;
});

pixelSizeSlider.addEventListener("input", () => {
  const size = parseInt(pixelSizeSlider.value);
  pixelSizeValue.textContent = size.toString();
  if (pixelationToggle.checked) {
    pixelationEffect.granularity = size;
  }
});

// FOV slider
const fovSlider = document.getElementById("fov-slider") as HTMLInputElement;
const fovValue = document.getElementById("fov-value") as HTMLElement;

fovSlider.addEventListener("input", () => {
  const fov = parseInt(fovSlider.value);
  camera.fov = fov;
  camera.updateProjectionMatrix();
  fovValue.textContent = fov.toString();
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
