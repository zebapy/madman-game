import * as THREE from "three";
import { createWallpaperTexture, createWoodFloorTexture } from "./textures";

// Create textures
const wallpaperTexture = createWallpaperTexture();
const woodFloorTexture = createWoodFloorTexture();

// Create materials
export const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallpaperTexture,
  roughness: 0.85,
  metalness: 0.05,
  bumpScale: 0.02,
});

export const floorMaterial = new THREE.MeshStandardMaterial({
  map: woodFloorTexture,
  roughness: 0.7,
  metalness: 0.1,
  envMapIntensity: 0.3,
});

export const ceilingMaterial = new THREE.MeshStandardMaterial({
  color: 0x0a0808,
  roughness: 0.95,
  metalness: 0.0,
});

export const wainscotMaterial = new THREE.MeshStandardMaterial({
  color: 0x1a1512,
  roughness: 0.7,
  metalness: 0.1,
});
