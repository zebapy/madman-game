import * as THREE from "three";
import { createPortraitTexture } from "./textures";
import { seededRandom } from "./utils";
import { HALLWAY_WIDTH, DOOR_WIDTH, DOOR_HEIGHT } from "./constants";

// Track TV lights for flickering animation
export const allTVLights: THREE.PointLight[] = [];

// Floor debris types for creepy hotel atmosphere
type DebrisType =
  | "paper"
  | "glass"
  | "dust"
  | "key"
  | "cigarette"
  | "bottle"
  | "stain"
  | "leaf";

// Create a single piece of floor debris
function createDebrisPiece(
  type: DebrisType,
  seed: number
): THREE.Mesh | THREE.Group {
  const rand = seededRandom(seed);

  switch (type) {
    case "paper": {
      // Crumpled paper / old receipt / note
      const paperGroup = new THREE.Group();
      const size = 0.08 + rand() * 0.12;
      const geometry = new THREE.PlaneGeometry(
        size,
        size * (0.8 + rand() * 0.4)
      );
      const color = rand() > 0.7 ? 0xd4c4a8 : 0xc8b896; // Yellowed paper
      const material = new THREE.MeshStandardMaterial({
        color,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const paper = new THREE.Mesh(geometry, material);
      paper.rotation.x = -Math.PI / 2 + (rand() - 0.5) * 0.4;
      paper.rotation.z = rand() * Math.PI * 2;
      // Slight crumple effect by displacing vertices
      paper.position.y = 0.005 + rand() * 0.01;
      paperGroup.add(paper);
      return paperGroup;
    }

    case "glass": {
      // Broken glass shards
      const glassGroup = new THREE.Group();
      const shardCount = 2 + Math.floor(rand() * 4);
      for (let i = 0; i < shardCount; i++) {
        const shardGeom = new THREE.BufferGeometry();
        const size = 0.02 + rand() * 0.04;
        const vertices = new Float32Array([
          0,
          0,
          0,
          size * (0.5 + rand() * 0.5),
          0,
          size * rand() * 0.3,
          size * rand() * 0.3,
          0,
          size * (0.5 + rand() * 0.5),
        ]);
        shardGeom.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3)
        );
        shardGeom.computeVertexNormals();
        const shardMat = new THREE.MeshStandardMaterial({
          color: 0x88aa88,
          roughness: 0.1,
          metalness: 0.3,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const shard = new THREE.Mesh(shardGeom, shardMat);
        shard.position.set((rand() - 0.5) * 0.1, 0.002, (rand() - 0.5) * 0.1);
        shard.rotation.y = rand() * Math.PI * 2;
        glassGroup.add(shard);
      }
      return glassGroup;
    }

    case "dust": {
      // Dust pile / dirt
      const dustGeom = new THREE.CircleGeometry(0.05 + rand() * 0.08, 8);
      const dustMat = new THREE.MeshStandardMaterial({
        color: 0x3a3530,
        roughness: 1,
        transparent: true,
        opacity: 0.4 + rand() * 0.3,
      });
      const dust = new THREE.Mesh(dustGeom, dustMat);
      dust.rotation.x = -Math.PI / 2;
      dust.position.y = 0.001;
      return dust;
    }

    case "key": {
      // Old room key
      const keyGroup = new THREE.Group();
      // Key shaft
      const shaftGeom = new THREE.BoxGeometry(0.01, 0.003, 0.06);
      const keyMat = new THREE.MeshStandardMaterial({
        color: 0x8b7355,
        roughness: 0.4,
        metalness: 0.6,
      });
      const shaft = new THREE.Mesh(shaftGeom, keyMat);
      keyGroup.add(shaft);
      // Key head (circular)
      const headGeom = new THREE.RingGeometry(0.008, 0.018, 8);
      const head = new THREE.Mesh(headGeom, keyMat);
      head.rotation.x = -Math.PI / 2;
      head.position.set(0, 0, -0.04);
      keyGroup.add(head);
      // Key tag
      const tagGeom = new THREE.BoxGeometry(0.025, 0.002, 0.04);
      const tagMat = new THREE.MeshStandardMaterial({
        color: 0x2a1a10,
        roughness: 0.8,
      });
      const tag = new THREE.Mesh(tagGeom, tagMat);
      tag.position.set(0, 0, -0.07);
      keyGroup.add(tag);

      keyGroup.rotation.y = rand() * Math.PI * 2;
      keyGroup.position.y = 0.003;
      return keyGroup;
    }

    case "cigarette": {
      // Cigarette butt
      const cigGroup = new THREE.Group();
      const buttGeom = new THREE.CylinderGeometry(0.004, 0.004, 0.025, 6);
      const buttMat = new THREE.MeshStandardMaterial({
        color: 0xd4c8b0,
        roughness: 0.9,
      });
      const butt = new THREE.Mesh(buttGeom, buttMat);
      butt.rotation.z = Math.PI / 2;
      butt.position.y = 0.004;
      cigGroup.add(butt);
      // Burnt tip
      const tipGeom = new THREE.CylinderGeometry(0.003, 0.004, 0.008, 6);
      const tipMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a1a,
        roughness: 1,
      });
      const tip = new THREE.Mesh(tipGeom, tipMat);
      tip.rotation.z = Math.PI / 2;
      tip.position.set(0.015, 0.004, 0);
      cigGroup.add(tip);
      // Ash
      const ashGeom = new THREE.CircleGeometry(0.015, 6);
      const ashMat = new THREE.MeshStandardMaterial({
        color: 0x4a4a4a,
        roughness: 1,
        transparent: true,
        opacity: 0.5,
      });
      const ash = new THREE.Mesh(ashGeom, ashMat);
      ash.rotation.x = -Math.PI / 2;
      ash.position.set(0.02, 0.001, 0);
      cigGroup.add(ash);

      cigGroup.rotation.y = rand() * Math.PI * 2;
      return cigGroup;
    }

    case "bottle": {
      // Broken bottle or small liquor bottle
      const bottleGroup = new THREE.Group();
      if (rand() > 0.5) {
        // Intact small bottle lying on side
        const bodyGeom = new THREE.CylinderGeometry(0.015, 0.018, 0.08, 8);
        const bottleMat = new THREE.MeshStandardMaterial({
          color: rand() > 0.5 ? 0x2a4a2a : 0x3a2a1a,
          roughness: 0.2,
          metalness: 0.1,
          transparent: true,
          opacity: 0.7,
        });
        const body = new THREE.Mesh(bodyGeom, bottleMat);
        body.rotation.z = Math.PI / 2;
        body.position.y = 0.018;
        bottleGroup.add(body);
        // Neck
        const neckGeom = new THREE.CylinderGeometry(0.006, 0.01, 0.025, 8);
        const neck = new THREE.Mesh(neckGeom, bottleMat);
        neck.rotation.z = Math.PI / 2;
        neck.position.set(0.05, 0.018, 0);
        bottleGroup.add(neck);
      } else {
        // Broken bottle bottom
        const brokenGeom = new THREE.CylinderGeometry(
          0.02,
          0.025,
          0.03,
          8,
          1,
          true
        );
        const bottleMat = new THREE.MeshStandardMaterial({
          color: 0x2a4a2a,
          roughness: 0.2,
          transparent: true,
          opacity: 0.6,
          side: THREE.DoubleSide,
        });
        const broken = new THREE.Mesh(brokenGeom, bottleMat);
        broken.position.y = 0.015;
        bottleGroup.add(broken);
      }
      bottleGroup.rotation.y = rand() * Math.PI * 2;
      return bottleGroup;
    }

    case "stain": {
      // Dark stain on floor (mysterious...)
      const stainGeom = new THREE.CircleGeometry(0.1 + rand() * 0.15, 12);
      const darkness = 0.05 + rand() * 0.1;
      const stainMat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(darkness, darkness * 0.8, darkness * 0.7),
        roughness: 0.95,
        transparent: true,
        opacity: 0.3 + rand() * 0.4,
      });
      const stain = new THREE.Mesh(stainGeom, stainMat);
      stain.rotation.x = -Math.PI / 2;
      stain.position.y = 0.001;
      // Irregular shape by scaling
      stain.scale.set(1, 0.6 + rand() * 0.8, 1);
      stain.rotation.z = rand() * Math.PI * 2;
      return stain;
    }

    case "leaf": {
      // Dead leaf (tracked in from outside)
      const leafGeom = new THREE.PlaneGeometry(
        0.04 + rand() * 0.03,
        0.025 + rand() * 0.02
      );
      const leafMat = new THREE.MeshStandardMaterial({
        color: rand() > 0.5 ? 0x4a3a20 : 0x3a2a15,
        roughness: 0.9,
        side: THREE.DoubleSide,
      });
      const leaf = new THREE.Mesh(leafGeom, leafMat);
      leaf.rotation.x = -Math.PI / 2 + (rand() - 0.5) * 0.3;
      leaf.rotation.z = rand() * Math.PI * 2;
      leaf.position.y = 0.003;
      return leaf;
    }
  }
}

// Create a cluster of debris for a section of hallway
export function createFloorDebris(
  length: number,
  width: number,
  seed: number,
  isNorthSouth: boolean
): THREE.Group {
  const debrisGroup = new THREE.Group();
  const rand = seededRandom(seed);

  // Debris types with weights (some more common than others)
  const debrisTypes: { type: DebrisType; weight: number }[] = [
    { type: "dust", weight: 0.25 },
    { type: "paper", weight: 0.2 },
    { type: "stain", weight: 0.15 },
    { type: "cigarette", weight: 0.12 },
    { type: "leaf", weight: 0.1 },
    { type: "glass", weight: 0.08 },
    { type: "bottle", weight: 0.05 },
    { type: "key", weight: 0.05 },
  ];

  // Number of debris pieces based on hallway size
  const debrisCount = Math.floor(3 + rand() * 8);

  for (let i = 0; i < debrisCount; i++) {
    // Select debris type based on weights
    let roll = rand();
    let selectedType: DebrisType = "dust";
    for (const { type, weight } of debrisTypes) {
      if (roll < weight) {
        selectedType = type;
        break;
      }
      roll -= weight;
    }

    const debris = createDebrisPiece(selectedType, seed + i * 123);

    // Position debris along the hallway, avoiding the center walking path sometimes
    let x: number, z: number;
    if (isNorthSouth) {
      x = (rand() - 0.5) * (width - 0.5);
      z = (rand() - 0.5) * (length - 2);
      // Bias towards edges (against walls)
      if (rand() > 0.4) {
        x = (rand() > 0.5 ? 1 : -1) * (width / 2 - 0.2 - rand() * 0.3);
      }
    } else {
      x = (rand() - 0.5) * (length - 2);
      z = (rand() - 0.5) * (width - 0.5);
      // Bias towards edges
      if (rand() > 0.4) {
        z = (rand() > 0.5 ? 1 : -1) * (width / 2 - 0.2 - rand() * 0.3);
      }
    }

    debris.position.x = x;
    debris.position.z = z;
    debrisGroup.add(debris);
  }

  // Add some corner clusters (debris accumulates in corners)
  const cornerCount = Math.floor(rand() * 3);
  for (let c = 0; c < cornerCount; c++) {
    const cornerX =
      (rand() > 0.5 ? 1 : -1) *
      (isNorthSouth ? width / 2 - 0.3 : length / 2 - 0.5);
    const cornerZ =
      (rand() > 0.5 ? 1 : -1) *
      (isNorthSouth ? length / 2 - 0.5 : width / 2 - 0.3);

    // Small cluster of debris in corner
    const clusterSize = 2 + Math.floor(rand() * 3);
    for (let j = 0; j < clusterSize; j++) {
      const type: DebrisType =
        rand() > 0.6 ? "dust" : rand() > 0.5 ? "paper" : "leaf";
      const piece = createDebrisPiece(type, seed + c * 500 + j * 77);
      piece.position.x = cornerX + (rand() - 0.5) * 0.3;
      piece.position.z = cornerZ + (rand() - 0.5) * 0.3;
      debrisGroup.add(piece);
    }
  }

  return debrisGroup;
}

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

  // Determine if this door should be ajar with TV light (about 15% chance)
  const isAjar = rand() > 0.85;
  const ajarAngle = isAjar ? 0.15 + rand() * 0.25 : 0; // 15-40 degree opening

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

  // Create a pivot group for the door panel so it swings from the hinge
  const doorPivot = new THREE.Group();
  // Position pivot at the hinge edge (opposite to handle)
  const hingeOffset = side === "left" ? -DOOR_WIDTH / 2 : DOOR_WIDTH / 2;
  doorPivot.position.set(hingeOffset, 0, 0.02);
  doorGroup.add(doorPivot);

  // Door panel (slightly lighter wood) - now a child of pivot
  const doorGeometry = new THREE.BoxGeometry(DOOR_WIDTH, DOOR_HEIGHT, 0.08);
  const doorMaterial = new THREE.MeshStandardMaterial({
    color: 0x2a1a10,
    roughness: 0.6,
    metalness: 0.1,
  });
  const doorPanel = new THREE.Mesh(doorGeometry, doorMaterial);
  // Offset door so it rotates around its edge
  doorPanel.position.set(-hingeOffset, DOOR_HEIGHT / 2, 0);
  doorPivot.add(doorPanel);

  // Door panels (decorative insets) - now children of doorPanel
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
  topPanel.position.set(0, DOOR_HEIGHT * 0.22, 0.05);
  doorPanel.add(topPanel);

  const bottomPanel = new THREE.Mesh(panelGeometry, panelMaterial);
  bottomPanel.position.set(0, -DOOR_HEIGHT * 0.22, 0.05);
  doorPanel.add(bottomPanel);

  // Door handle (brass) - now child of doorPanel
  const handleGeometry = new THREE.BoxGeometry(0.12, 0.04, 0.06);
  const handleMaterial = new THREE.MeshStandardMaterial({
    color: 0xaa8844,
    roughness: 0.3,
    metalness: 0.8,
  });
  const handle = new THREE.Mesh(handleGeometry, handleMaterial);
  const handleSide = side === "left" ? DOOR_WIDTH * 0.35 : -DOOR_WIDTH * 0.35;
  handle.position.set(handleSide, -DOOR_HEIGHT * 0.05, 0.07);
  doorPanel.add(handle);

  // Apply ajar rotation to door pivot
  if (isAjar) {
    // Rotate door open (inward into the room)
    doorPivot.rotation.y = side === "left" ? ajarAngle : -ajarAngle;

    // Add TV-like flickering light inside the room
    const tvLight = new THREE.PointLight(0x6688ff, 0.8, 4, 2);
    // Position light behind the door, inside the "room"
    const lightOffset = side === "left" ? -0.8 : 0.8;
    tvLight.position.set(lightOffset, DOOR_HEIGHT * 0.4, 0);
    doorGroup.add(tvLight);

    // Store light for animation with unique phase
    tvLight.userData.tvPhase = rand() * Math.PI * 2;
    tvLight.userData.tvSpeed = 0.8 + rand() * 0.4;
    allTVLights.push(tvLight);

    // Add a faint glow plane visible through the gap
    const glowGeometry = new THREE.PlaneGeometry(0.3, DOOR_HEIGHT * 0.6);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: 0x4466aa,
      transparent: true,
      opacity: 0.15,
      side: THREE.DoubleSide,
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    glow.position.set(lightOffset * 0.5, DOOR_HEIGHT * 0.5, -0.1);
    glow.rotation.y = Math.PI / 2;
    doorGroup.add(glow);
  }

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

  return doorGroup;
}
