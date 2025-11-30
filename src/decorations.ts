import * as THREE from "three";
import { createPortraitTexture } from "./textures";
import { seededRandom } from "./utils";
import { HALLWAY_WIDTH } from "./constants";

// Create a wall lamp and return it
export function createWallLampGroup(
  localX: number,
  localZ: number,
  side: "left" | "right"
): { group: THREE.Group; light: THREE.PointLight } {
  const lampGroup = new THREE.Group();

  const bracketGeometry = new THREE.BoxGeometry(0.08, 0.15, 0.08);
  const bracketMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a2a1a,
    roughness: 0.6,
    metalness: 0.4,
  });
  const bracket = new THREE.Mesh(bracketGeometry, bracketMaterial);
  bracket.position.y = 0;
  lampGroup.add(bracket);

  const armGeometry = new THREE.BoxGeometry(0.15, 0.03, 0.03);
  const arm = new THREE.Mesh(armGeometry, bracketMaterial);
  arm.position.set(side === "left" ? 0.08 : -0.08, 0, 0);
  lampGroup.add(arm);

  const shadeGeometry = new THREE.CylinderGeometry(0.06, 0.08, 0.12, 8);
  const shadeMaterial = new THREE.MeshStandardMaterial({
    color: 0xffeecc,
    emissive: 0xffaa44,
    emissiveIntensity: 0.8,
    transparent: true,
    opacity: 0.6,
  });
  const shade = new THREE.Mesh(shadeGeometry, shadeMaterial);
  shade.position.set(side === "left" ? 0.15 : -0.15, -0.05, 0);
  lampGroup.add(shade);

  const light = new THREE.PointLight(0xffaa44, 1.2, 10, 2);
  light.position.set(side === "left" ? 0.2 : -0.2, -0.05, 0);
  light.castShadow = false;
  lampGroup.add(light);

  lampGroup.position.set(localX, 2.2, localZ);

  return { group: lampGroup, light };
}

// Create a portrait and return it
export function createPortraitGroup(
  localZ: number,
  side: "left" | "right",
  seed: number
): THREE.Group {
  const portraitGroup = new THREE.Group();
  const rand = seededRandom(seed);

  const frameWidth = 0.5 + rand() * 0.3;
  const frameHeight = 0.6 + rand() * 0.4;
  const frameDepth = 0.05;

  const frameGeometry = new THREE.BoxGeometry(
    frameWidth + 0.08,
    frameHeight + 0.08,
    frameDepth
  );
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a0a,
    roughness: 0.5,
    metalness: 0.2,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  portraitGroup.add(frame);

  const innerFrameGeometry = new THREE.BoxGeometry(
    frameWidth + 0.02,
    frameHeight + 0.02,
    frameDepth + 0.01
  );
  const gildedMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a3a1a,
    roughness: 0.4,
    metalness: 0.5,
  });
  const innerFrame = new THREE.Mesh(innerFrameGeometry, gildedMaterial);
  innerFrame.position.z = 0.01;
  portraitGroup.add(innerFrame);

  const canvasGeometry = new THREE.PlaneGeometry(
    frameWidth - 0.04,
    frameHeight - 0.04
  );
  const canvasMaterial = new THREE.MeshStandardMaterial({
    map: createPortraitTexture(seed),
    roughness: 0.9,
  });
  const canvas = new THREE.Mesh(canvasGeometry, canvasMaterial);
  canvas.position.z = frameDepth / 2 + 0.005;
  portraitGroup.add(canvas);

  const tiltAngle = (rand() - 0.5) * 0.15;
  portraitGroup.rotation.z = tiltAngle;
  portraitGroup.userData.baseTilt = tiltAngle;

  const wallOffset =
    side === "left" ? -HALLWAY_WIDTH / 2 + 0.03 : HALLWAY_WIDTH / 2 - 0.03;
  portraitGroup.position.set(wallOffset, 1.6 + (rand() - 0.5) * 0.2, localZ);
  portraitGroup.rotation.y = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  return portraitGroup;
}
