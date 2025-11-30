import * as THREE from "three";
import type { Direction, HallwaySegment } from "./types";
import {
  HALLWAY_WIDTH,
  HALLWAY_HEIGHT,
  HALLWAY_LENGTH,
  JUNCTION_SIZE,
  MAX_LOADED_SEGMENTS,
} from "./constants";
import {
  getOppositeDirection,
  getDirectionVector,
  seededRandom,
} from "./utils";
import {
  wallMaterial,
  floorMaterial,
  ceilingMaterial,
  wainscotMaterial,
} from "./materials";
import { createWallLampGroup, createPortraitGroup } from "./decorations";

// State
const hallwaySegments = new Map<string, HallwaySegment>();
let segmentIdCounter = 0;
const loadedSegments = new Set<string>();

// All tracked lights for flickering
export const allWallLights: THREE.PointLight[] = [];

// All tracked portraits for swaying
export const allPortraits: THREE.Group[] = [];

// Current segment tracking
let currentSegmentId: string = "";

function generateSegmentId(): string {
  return `seg_${segmentIdCounter++}`;
}

// Get the junction position (end of hallway)
export function getJunctionPosition(seg: HallwaySegment): {
  x: number;
  z: number;
} {
  const vec = getDirectionVector(seg.direction);
  return {
    x: seg.startX + vec.x * HALLWAY_LENGTH,
    z: seg.startZ + vec.z * HALLWAY_LENGTH,
  };
}

function createHallwaySegment(
  startX: number,
  startZ: number,
  direction: Direction,
  parentId: string | null
): HallwaySegment {
  const segment: HallwaySegment = {
    id: generateSegmentId(),
    startX,
    startZ,
    direction,
    parentId,
    children: new Map(),
    seed: Math.floor(Math.random() * 100000),
    isLoaded: false,
    meshGroup: null,
    lights: [],
  };
  hallwaySegments.set(segment.id, segment);
  return segment;
}

// Create hallway mesh going in a specific direction
function createHallwayMesh(
  segment: HallwaySegment,
  length: number = HALLWAY_LENGTH
): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(segment.seed);
  const dir = segment.direction;
  const isNorthSouth = dir === "north" || dir === "south";

  // Floor
  const floorWidth = isNorthSouth ? HALLWAY_WIDTH : length;
  const floorDepth = isNorthSouth ? length : HALLWAY_WIDTH;
  const floorGeom = new THREE.PlaneGeometry(floorWidth, floorDepth);
  const hallFloor = new THREE.Mesh(floorGeom, floorMaterial.clone());
  hallFloor.rotation.x = -Math.PI / 2;
  hallFloor.receiveShadow = true;
  group.add(hallFloor);

  // Ceiling
  const hallCeiling = new THREE.Mesh(floorGeom, ceilingMaterial.clone());
  hallCeiling.rotation.x = Math.PI / 2;
  hallCeiling.position.y = HALLWAY_HEIGHT;
  hallCeiling.receiveShadow = true;
  group.add(hallCeiling);

  // Walls depend on direction
  if (isNorthSouth) {
    // Left and right walls (along X axis)
    const wallGeom = new THREE.PlaneGeometry(length, HALLWAY_HEIGHT);

    const leftWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.x = -HALLWAY_WIDTH / 2;
    leftWall.position.y = HALLWAY_HEIGHT / 2;
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.x = HALLWAY_WIDTH / 2;
    rightWall.position.y = HALLWAY_HEIGHT / 2;
    rightWall.receiveShadow = true;
    group.add(rightWall);

    // Wainscoting
    const wainscotGeom = new THREE.BoxGeometry(0.02, 0.05, length);
    const leftWainscot = new THREE.Mesh(wainscotGeom, wainscotMaterial.clone());
    leftWainscot.position.set(-HALLWAY_WIDTH / 2 + 0.01, 1.0, 0);
    group.add(leftWainscot);

    const rightWainscot = new THREE.Mesh(
      wainscotGeom,
      wainscotMaterial.clone()
    );
    rightWainscot.position.set(HALLWAY_WIDTH / 2 - 0.01, 1.0, 0);
    group.add(rightWainscot);

    // Wall lamps along Z
    const lampSpacing = 10;
    for (let i = 0; i < length / lampSpacing; i++) {
      const z = -length / 2 + i * lampSpacing + lampSpacing / 2;
      const side = i % 2 === 0 ? "left" : "right";
      const x =
        side === "left" ? -HALLWAY_WIDTH / 2 + 0.04 : HALLWAY_WIDTH / 2 - 0.04;
      const { group: lampGroup, light } = createWallLampGroup(x, z, side);
      group.add(lampGroup);
      segment.lights.push(light);
      allWallLights.push(light);
    }

    // Portraits
    const numPortraits = Math.floor(rand() * 3) + 2;
    const portraitPositions: number[] = [];
    for (let i = 0; i < numPortraits; i++) {
      let z: number;
      let attempts = 0;
      do {
        z = (rand() - 0.5) * (length - 4);
        attempts++;
      } while (
        portraitPositions.some((pos) => Math.abs(pos - z) < 3) &&
        attempts < 20
      );
      if (attempts < 20) {
        portraitPositions.push(z);
        const side = rand() > 0.5 ? "left" : "right";
        const portrait = createPortraitGroup(z, side, segment.seed + i * 1000);
        group.add(portrait);
        allPortraits.push(portrait);
      }
    }
  } else {
    // East-West: walls along Z axis
    const wallGeom = new THREE.PlaneGeometry(length, HALLWAY_HEIGHT);

    // "Front" wall (positive Z)
    const frontWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.z = HALLWAY_WIDTH / 2;
    frontWall.position.y = HALLWAY_HEIGHT / 2;
    frontWall.receiveShadow = true;
    group.add(frontWall);

    // "Back" wall (negative Z)
    const backWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    backWall.position.z = -HALLWAY_WIDTH / 2;
    backWall.position.y = HALLWAY_HEIGHT / 2;
    backWall.receiveShadow = true;
    group.add(backWall);

    // Wainscoting
    const wainscotGeom = new THREE.BoxGeometry(length, 0.05, 0.02);
    const frontWainscot = new THREE.Mesh(
      wainscotGeom,
      wainscotMaterial.clone()
    );
    frontWainscot.position.set(0, 1.0, HALLWAY_WIDTH / 2 - 0.01);
    group.add(frontWainscot);

    const backWainscot = new THREE.Mesh(wainscotGeom, wainscotMaterial.clone());
    backWainscot.position.set(0, 1.0, -HALLWAY_WIDTH / 2 + 0.01);
    group.add(backWainscot);

    // Wall lamps along X
    const lampSpacing = 10;
    for (let i = 0; i < length / lampSpacing; i++) {
      const x = -length / 2 + i * lampSpacing + lampSpacing / 2;
      const side = i % 2 === 0 ? "left" : "right";
      const z =
        side === "left" ? -HALLWAY_WIDTH / 2 + 0.04 : HALLWAY_WIDTH / 2 - 0.04;
      // Create lamp rotated for east-west orientation
      const lampGroup = new THREE.Group();
      const { group: lamp, light } = createWallLampGroup(0, 0, side);
      lamp.rotation.y = Math.PI / 2;
      lampGroup.add(lamp);
      lampGroup.position.set(x, 0, z);
      group.add(lampGroup);
      segment.lights.push(light);
      allWallLights.push(light);
    }
  }

  return group;
}

// Create a junction (4-way intersection) at the end of a hallway
function createJunctionMesh(segment: HallwaySegment): THREE.Group {
  const group = new THREE.Group();
  const size = JUNCTION_SIZE;

  // Floor
  const floorGeom = new THREE.PlaneGeometry(size, size);
  const junctionFloor = new THREE.Mesh(floorGeom, floorMaterial.clone());
  junctionFloor.rotation.x = -Math.PI / 2;
  junctionFloor.receiveShadow = true;
  group.add(junctionFloor);

  // Ceiling
  const junctionCeiling = new THREE.Mesh(floorGeom, ceilingMaterial.clone());
  junctionCeiling.rotation.x = Math.PI / 2;
  junctionCeiling.position.y = HALLWAY_HEIGHT;
  junctionCeiling.receiveShadow = true;
  group.add(junctionCeiling);

  // Add corner pillars for visual interest
  const pillarSize = 0.3;
  const pillarGeom = new THREE.BoxGeometry(
    pillarSize,
    HALLWAY_HEIGHT,
    pillarSize
  );
  const pillarMat = new THREE.MeshStandardMaterial({
    color: 0x1a1512,
    roughness: 0.8,
  });

  const corners = [
    { x: -size / 2 + pillarSize / 2, z: -size / 2 + pillarSize / 2 },
    { x: size / 2 - pillarSize / 2, z: -size / 2 + pillarSize / 2 },
    { x: -size / 2 + pillarSize / 2, z: size / 2 - pillarSize / 2 },
    { x: size / 2 - pillarSize / 2, z: size / 2 - pillarSize / 2 },
  ];

  corners.forEach((corner) => {
    const pillar = new THREE.Mesh(pillarGeom, pillarMat);
    pillar.position.set(corner.x, HALLWAY_HEIGHT / 2, corner.z);
    group.add(pillar);
  });

  // Add a dim light in the junction
  const junctionLight = new THREE.PointLight(0xffaa44, 0.8, 15, 2);
  junctionLight.position.set(0, HALLWAY_HEIGHT - 0.5, 0);
  group.add(junctionLight);
  segment.lights.push(junctionLight);
  allWallLights.push(junctionLight);

  return group;
}

// Load a segment (create meshes and add to scene)
export function loadSegment(segment: HallwaySegment, scene: THREE.Scene) {
  if (segment.isLoaded) return;

  const group = new THREE.Group();
  const vec = getDirectionVector(segment.direction);

  // Create the hallway mesh
  const hallwayMesh = createHallwayMesh(segment);

  // Position hallway so it starts at startX, startZ and extends in direction
  const centerX = segment.startX + (vec.x * HALLWAY_LENGTH) / 2;
  const centerZ = segment.startZ + (vec.z * HALLWAY_LENGTH) / 2;
  hallwayMesh.position.set(centerX, 0, centerZ);
  group.add(hallwayMesh);

  // Create junction at the end
  const junctionMesh = createJunctionMesh(segment);
  const junctionPos = getJunctionPosition(segment);
  junctionMesh.position.set(junctionPos.x, 0, junctionPos.z);
  group.add(junctionMesh);

  scene.add(group);
  segment.meshGroup = group;
  segment.isLoaded = true;
  loadedSegments.add(segment.id);
}

// Unload a segment (remove meshes but keep metadata)
export function unloadSegment(segment: HallwaySegment, scene: THREE.Scene) {
  if (!segment.isLoaded || !segment.meshGroup) return;

  // Remove lights from tracking
  segment.lights.forEach((light) => {
    const idx = allWallLights.indexOf(light);
    if (idx > -1) allWallLights.splice(idx, 1);
  });
  segment.lights = [];

  // Dispose geometries and materials
  segment.meshGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  scene.remove(segment.meshGroup);
  segment.meshGroup = null;
  segment.isLoaded = false;
  loadedSegments.delete(segment.id);
}

// Ensure child segments exist at a junction
function ensureChildren(segment: HallwaySegment) {
  const junctionPos = getJunctionPosition(segment);
  const backDir = getOppositeDirection(segment.direction);

  // Create children in all 3 forward directions
  const allDirs: Direction[] = ["north", "south", "east", "west"];

  allDirs.forEach((dir) => {
    if (dir === backDir) return; // Don't create child going back
    if (segment.children.has(dir)) return; // Already exists

    // Child starts at junction and goes in direction
    const childStartX = junctionPos.x;
    const childStartZ = junctionPos.z;

    const child = createHallwaySegment(
      childStartX,
      childStartZ,
      dir,
      segment.id
    );
    segment.children.set(dir, child.id);
  });
}

// Find which segment the player is in
function findCurrentSegment(px: number, pz: number): HallwaySegment | null {
  for (const [, segment] of hallwaySegments) {
    const vec = getDirectionVector(segment.direction);
    const isNS = segment.direction === "north" || segment.direction === "south";

    // Check if in hallway portion
    if (isNS) {
      const minZ = Math.min(
        segment.startZ,
        segment.startZ + vec.z * HALLWAY_LENGTH
      );
      const maxZ = Math.max(
        segment.startZ,
        segment.startZ + vec.z * HALLWAY_LENGTH
      );
      if (
        px >= -HALLWAY_WIDTH / 2 - 1 + segment.startX &&
        px <= HALLWAY_WIDTH / 2 + 1 + segment.startX &&
        pz >= minZ - 1 &&
        pz <= maxZ + JUNCTION_SIZE + 1
      ) {
        return segment;
      }
    } else {
      const minX = Math.min(
        segment.startX,
        segment.startX + vec.x * HALLWAY_LENGTH
      );
      const maxX = Math.max(
        segment.startX,
        segment.startX + vec.x * HALLWAY_LENGTH
      );
      if (
        pz >= -HALLWAY_WIDTH / 2 - 1 + segment.startZ &&
        pz <= HALLWAY_WIDTH / 2 + 1 + segment.startZ &&
        px >= minX - 1 &&
        px <= maxX + JUNCTION_SIZE + 1
      ) {
        return segment;
      }
    }
  }
  return null;
}

// Update loaded segments based on player position
export function updateSegments(px: number, pz: number, scene: THREE.Scene) {
  const current = findCurrentSegment(px, pz);
  if (!current) return;

  currentSegmentId = current.id;
  ensureChildren(current);

  const toLoad = new Set<string>();
  toLoad.add(current.id);

  // Load parent
  if (current.parentId) {
    const parent = hallwaySegments.get(current.parentId);
    if (parent) {
      toLoad.add(parent.id);
      ensureChildren(parent);
    }
  }

  // Load children
  current.children.forEach((childId) => {
    toLoad.add(childId);
    const child = hallwaySegments.get(childId);
    if (child) {
      ensureChildren(child);
    }
  });

  // Load needed segments
  toLoad.forEach((id) => {
    const seg = hallwaySegments.get(id);
    if (seg && !seg.isLoaded) {
      loadSegment(seg, scene);
    }
  });

  // Unload distant segments
  if (loadedSegments.size > MAX_LOADED_SEGMENTS) {
    const byDist = Array.from(loadedSegments)
      .map((id) => {
        const s = hallwaySegments.get(id)!;
        const dx = px - s.startX;
        const dz = pz - s.startZ;
        return { id, dist: Math.sqrt(dx * dx + dz * dz) };
      })
      .sort((a, b) => b.dist - a.dist);

    while (loadedSegments.size > MAX_LOADED_SEGMENTS && byDist.length > 0) {
      const far = byDist.shift()!;
      if (!toLoad.has(far.id)) {
        const seg = hallwaySegments.get(far.id);
        if (seg) unloadSegment(seg, scene);
      }
    }
  }
}

// Check collision with walls
export function checkWallCollision(x: number, z: number): boolean {
  const margin = 0.4;

  for (const [, segment] of hallwaySegments) {
    if (!segment.isLoaded) continue;

    const dir = segment.direction;
    const vec = getDirectionVector(dir);
    const isNS = dir === "north" || dir === "south";

    // Hallway center
    const centerX = segment.startX + (vec.x * HALLWAY_LENGTH) / 2;
    const centerZ = segment.startZ + (vec.z * HALLWAY_LENGTH) / 2;

    // Junction position (end of hallway)
    const junctionX = segment.startX + vec.x * HALLWAY_LENGTH;
    const junctionZ = segment.startZ + vec.z * HALLWAY_LENGTH;

    if (isNS) {
      const minZ = Math.min(
        segment.startZ,
        segment.startZ + vec.z * HALLWAY_LENGTH
      );
      const maxZ = Math.max(
        segment.startZ,
        segment.startZ + vec.z * HALLWAY_LENGTH
      );

      // Check if in hallway corridor
      if (z >= minZ && z <= maxZ) {
        if (Math.abs(x - centerX) <= HALLWAY_WIDTH / 2 - margin) {
          return false; // Inside hallway, no collision
        }
      }

      // Check if in junction area at end of hallway
      if (
        x >= junctionX - JUNCTION_SIZE / 2 + margin &&
        x <= junctionX + JUNCTION_SIZE / 2 - margin &&
        z >= junctionZ - JUNCTION_SIZE / 2 + margin &&
        z <= junctionZ + JUNCTION_SIZE / 2 - margin
      ) {
        return false; // Inside junction, no collision
      }
    } else {
      const minX = Math.min(
        segment.startX,
        segment.startX + vec.x * HALLWAY_LENGTH
      );
      const maxX = Math.max(
        segment.startX,
        segment.startX + vec.x * HALLWAY_LENGTH
      );

      // Check if in hallway corridor
      if (x >= minX && x <= maxX) {
        if (Math.abs(z - centerZ) <= HALLWAY_WIDTH / 2 - margin) {
          return false; // Inside hallway, no collision
        }
      }

      // Check if in junction area at end of hallway
      if (
        x >= junctionX - JUNCTION_SIZE / 2 + margin &&
        x <= junctionX + JUNCTION_SIZE / 2 - margin &&
        z >= junctionZ - JUNCTION_SIZE / 2 + margin &&
        z <= junctionZ + JUNCTION_SIZE / 2 - margin
      ) {
        return false; // Inside junction, no collision
      }
    }
  }

  // Not in any valid walkable area - collision
  return true;
}

// Initialize the maze
export function initializeMaze(scene: THREE.Scene): { x: number; z: number } {
  // Create starting segment going north
  const startSegment = createHallwaySegment(
    0,
    HALLWAY_LENGTH / 2,
    "north",
    null
  );
  currentSegmentId = startSegment.id;

  // Ensure children exist
  ensureChildren(startSegment);

  // Load starting segment
  loadSegment(startSegment, scene);

  // Return starting position
  return { x: 0, z: HALLWAY_LENGTH / 2 - 2 };
}
