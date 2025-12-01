import * as THREE from "three";
import { createWallpaperTexture, createFloorTexture } from "./textures";
import { TEXTURE_STYLE } from "./constants";

// Create textures
const wallpaperTexture = createWallpaperTexture();
const floorTexture = createFloorTexture();

// Create materials
export const wallMaterial = new THREE.MeshStandardMaterial({
  map: wallpaperTexture,
  roughness: 0.85,
  metalness: 0.05,
  bumpScale: 0.02,
});

// Floor material properties vary by style
export const floorMaterial = new THREE.MeshStandardMaterial({
  map: floorTexture,
  roughness: TEXTURE_STYLE === "modern" ? 0.95 : 0.7,
  metalness: TEXTURE_STYLE === "modern" ? 0.0 : 0.1,
  envMapIntensity: TEXTURE_STYLE === "modern" ? 0.1 : 0.3,
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
