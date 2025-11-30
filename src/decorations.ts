import * as THREE from "three";
import { createPortraitTexture } from "./textures";
import { seededRandom } from "./utils";
import { HALLWAY_WIDTH, DOOR_WIDTH, DOOR_HEIGHT } from "./constants";

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

// Create a hotel room door with number
export function createHotelDoorGroup(
  localPos: number, // Position along hallway axis
  side: "left" | "right",
  roomNumber: number,
  seed: number
): THREE.Group {
  const doorGroup = new THREE.Group();
  const rand = seededRandom(seed);

  // Door frame (darker wood)
  const frameThickness = 0.08;
  const frameGeometry = new THREE.BoxGeometry(
    DOOR_WIDTH + frameThickness * 2,
    DOOR_HEIGHT + frameThickness,
    0.1
  );
  const frameMaterial = new THREE.MeshStandardMaterial({
    color: 0x1a1008,
    roughness: 0.7,
    metalness: 0.1,
  });
  const frame = new THREE.Mesh(frameGeometry, frameMaterial);
  frame.position.y = DOOR_HEIGHT / 2;
  doorGroup.add(frame);

  // Door panel (slightly lighter wood)
  const doorGeometry = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, 0.08);
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a10,
    roughness: 0.6,
    metalness: 0.1,
  });
  const door = new THREE.Mesh(doorGeometry, doorMaterial);
  door.position.y = DOOR_HEIGHT / 2;
  door.position.z = 0.02;
  doorGroup.add(door);

  // Door panels (decorative insets)
  const panelGeometry = new THREE.BoxGeometry(
    DOOR_WIDTH * 0.7,
    DOOR_HEIGHT * 0.3,
    0.02
  );
  const panelMaterial = new THREE.MeshStandardMaterial({
    color: 0x241810,
    roughness: 0.7,
  });

  const topPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  topPanel.position.set(0, DOOR_HEIGHT * 0.72, 0.05);
  doorGroup.add(topPanel);

  const bottomPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  bottomPanel.position.set(0, DOOR_HEIGHT * 0.28, 0.05);
  doorGroup.add(bottomPanel);

  // Door handle (brass)
  const handleGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.06);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa8844,
    roughness: 0.3,
    metalness: 0.8,
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  const handleSide = side === "left" ? DOOR_WIDTH * 0.35 : -DOOR_WIDTH * 0.35;
  handle.position.set(handleSide, DOOR_HEIGHT * 0.45, 0.07);
  doorGroup.add(handle);

  // Room number plate
  const plateGeometry = new THREE.BoxGeometry(0.2, 0.12, 0.02);
  const plateMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa8844,
    roughness: 0.3,
    metalness: 0.7,
  });
  const plate = new THREE.Mesh(plateGeometry, plateMaterial);
  plate.position.set(0, DOOR_HEIGHT * 0.85, 0.06);
  doorGroup.add(plate);

  // Room number text
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;
  canvas.width = 128;
  canvas.height = 64;
  ctx.fillStyle = "#1a1008";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ddccaa";
  ctx.font = "bold 40px Georgia";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(roomNumber.toString(), 64, 32);

  const numberTexture = new THREE.CanvasTexture(canvas);
  const numberGeometry = new THREE.PlaneGeometry(0.18, 0.09);
  const numberMaterial = new THREE.MeshStandardMaterial({
    map: numberTexture,
    roughness: 0.5,
  });
  const numberPlate = new THREE.Mesh(numberGeometry, numberMaterial);
  numberPlate.position.set(0, DOOR_HEIGHT * 0.85, 0.075);
  doorGroup.add(numberPlate);

  // Position the door on the wall
  const wallOffset =
    side === "left" ? -HALLWAY_WIDTH / 2 + 0.05 : HALLWAY_WIDTH / 2 - 0.05;
  doorGroup.position.set(wallOffset, 0, localPos);
  doorGroup.rotation.y = side === "left" ? Math.PI / 2 : -Math.PI / 2;

  // Add slight variation to make it creepier
  if (rand() > 0.9) {
    // Sometimes door is slightly ajar
    doorGroup.rotation.y += side === "left" ? 0.05 : -0.05;
  }

  return doorGroup;
}
