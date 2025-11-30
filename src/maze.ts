import * as THREE from "three";
import type {
  Direction,
  Chunk,
  HallwayChunk,
  JunctionChunk,
  ConnectionPoint,
} from "./types";
import {
  HALLWAY_WIDTH,
  HALLWAY_HEIGHT,
  HALLWAY_LENGTH,
  JUNCTION_SIZE,
  MAX_LOADED_SEGMENTS,
  DOOR_SPACING,
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
import {
  createWallLampGroup,
  createPortraitGroup,
  createHotelDoorGroup,
  createFloorDebris,
} from "./decorations";

// ============== STATE ==============
const chunks = new Map<string, Chunk>();
let chunkIdCounter = 0;
const loadedChunks = new Set<string>();

// All tracked lights for flickering
export const allWallLights: THREE.PointLight[] = [];

// All tracked portraits for swaying
export const allPortraits: THREE.Group[] = [];

// Current chunk tracking
let currentChunkId: string = "";

// Debug mode
let debugMode = true;
const debugMeshes: THREE.Object3D[] = [];

export function setDebugMode(enabled: boolean, scene: THREE.Scene) {
  debugMode = enabled;
  if (!enabled) {
    // Remove all debug meshes
    debugMeshes.forEach((mesh) => scene.remove(mesh));
    debugMeshes.length = 0;
  } else {
    // Add debug meshes to all loaded chunks
    chunks.forEach((chunk) => {
      if (chunk.isLoaded) {
        addDebugVisualization(chunk, scene);
      }
    });
  }
}

export function isDebugMode(): boolean {
  return debugMode;
}

// ============== DEBUG VISUALIZATION ==============
function addDebugVisualization(chunk: Chunk, scene: THREE.Scene) {
  if (!debugMode) return;

  const debugGroup = new THREE.Group();
  debugGroup.userData.isDebug = true;

  const lineMaterial = new THREE.LineBasicMaterial({
    color: 0xff0000,
    linewidth: 2,
  });
  const connectionMaterial = new THREE.LineBasicMaterial({
    color: 0x00ff00,
    linewidth: 2,
  });

  if (chunk.type === "hallway") {
    const hall = chunk as HallwayChunk;
    const isNS = hall.direction === "north" || hall.direction === "south";
    const halfLength = HALLWAY_LENGTH / 2;
    const halfWidth = HALLWAY_WIDTH / 2;

    // Draw boundary rectangle
    const points = isNS
      ? [
          new THREE.Vector3(-halfWidth, 0.02, -halfLength),
          new THREE.Vector3(halfWidth, 0.02, -halfLength),
          new THREE.Vector3(halfWidth, 0.02, halfLength),
          new THREE.Vector3(-halfWidth, 0.02, halfLength),
          new THREE.Vector3(-halfWidth, 0.02, -halfLength),
        ]
      : [
          new THREE.Vector3(-halfLength, 0.02, -halfWidth),
          new THREE.Vector3(halfLength, 0.02, -halfWidth),
          new THREE.Vector3(halfLength, 0.02, halfWidth),
          new THREE.Vector3(-halfLength, 0.02, halfWidth),
          new THREE.Vector3(-halfLength, 0.02, -halfWidth),
        ];

    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(geometry, lineMaterial);
    debugGroup.add(line);

    // Draw diagonal to show chunk clearly
    const diagPoints = isNS
      ? [
          new THREE.Vector3(-halfWidth, 0.02, -halfLength),
          new THREE.Vector3(halfWidth, 0.02, halfLength),
        ]
      : [
          new THREE.Vector3(-halfLength, 0.02, -halfWidth),
          new THREE.Vector3(halfLength, 0.02, halfWidth),
        ];
    const diagGeom = new THREE.BufferGeometry().setFromPoints(diagPoints);
    const diagLine = new THREE.Line(diagGeom, lineMaterial);
    debugGroup.add(diagLine);
  } else {
    // Junction
    const halfSize = JUNCTION_SIZE / 2;
    const halfHallway = HALLWAY_WIDTH / 2;

    // Draw outer boundary
    const outerPoints = [
      new THREE.Vector3(-halfSize, 0.02, -halfSize),
      new THREE.Vector3(halfSize, 0.02, -halfSize),
      new THREE.Vector3(halfSize, 0.02, halfSize),
      new THREE.Vector3(-halfSize, 0.02, halfSize),
      new THREE.Vector3(-halfSize, 0.02, -halfSize),
    ];
    const outerGeom = new THREE.BufferGeometry().setFromPoints(outerPoints);
    const outerLine = new THREE.Line(outerGeom, lineMaterial);
    debugGroup.add(outerLine);

    // Draw hallway opening indicators (green lines showing where openings should be)
    // North opening
    const northOpening = [
      new THREE.Vector3(-halfHallway, 0.03, halfSize),
      new THREE.Vector3(halfHallway, 0.03, halfSize),
    ];
    debugGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(northOpening),
        connectionMaterial
      )
    );

    // South opening
    const southOpening = [
      new THREE.Vector3(-halfHallway, 0.03, -halfSize),
      new THREE.Vector3(halfHallway, 0.03, -halfSize),
    ];
    debugGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(southOpening),
        connectionMaterial
      )
    );

    // East opening
    const eastOpening = [
      new THREE.Vector3(halfSize, 0.03, -halfHallway),
      new THREE.Vector3(halfSize, 0.03, halfHallway),
    ];
    debugGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(eastOpening),
        connectionMaterial
      )
    );

    // West opening
    const westOpening = [
      new THREE.Vector3(-halfSize, 0.03, -halfHallway),
      new THREE.Vector3(-halfSize, 0.03, halfHallway),
    ];
    debugGroup.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(westOpening),
        connectionMaterial
      )
    );

    // Draw X in center
    const x1 = [
      new THREE.Vector3(-halfSize * 0.5, 0.02, -halfSize * 0.5),
      new THREE.Vector3(halfSize * 0.5, 0.02, halfSize * 0.5),
    ];
    const x2 = [
      new THREE.Vector3(halfSize * 0.5, 0.02, -halfSize * 0.5),
      new THREE.Vector3(-halfSize * 0.5, 0.02, halfSize * 0.5),
    ];
    debugGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(x1), lineMaterial)
    );
    debugGroup.add(
      new THREE.Line(new THREE.BufferGeometry().setFromPoints(x2), lineMaterial)
    );
  }

  // Add text label using a sprite
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d")!;
  canvas.width = 256;
  canvas.height = 64;
  context.fillStyle = "#ff0000";
  context.font = "bold 24px Arial";
  context.textAlign = "center";
  const label =
    chunk.type === "hallway"
      ? `H:${chunk.id} (${(chunk as HallwayChunk).direction})`
      : `J:${chunk.id}`;
  context.fillText(label, 128, 40);

  const texture = new THREE.CanvasTexture(canvas);
  const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
  const sprite = new THREE.Sprite(spriteMaterial);
  sprite.scale.set(4, 1, 1);
  sprite.position.set(0, 0.5, 0);
  debugGroup.add(sprite);

  debugGroup.position.set(chunk.worldX, 0, chunk.worldZ);
  scene.add(debugGroup);
  debugMeshes.push(debugGroup);
}

// ============== HELPERS ==============
function generateChunkId(): string {
  return `chunk_${chunkIdCounter++}`;
}

// ============== MESH BUILDERS ==============

// Create a hallway mesh (straight corridor with walls on sides, open on ends)
function createHallwayMesh(chunk: HallwayChunk): THREE.Group {
  const group = new THREE.Group();
  const rand = seededRandom(chunk.seed);
  const length = HALLWAY_LENGTH;
  const isNorthSouth =
    chunk.direction === "north" || chunk.direction === "south";

  // Floor
  const floorWidth = isNorthSouth ? HALLWAY_WIDTH : length;
  const floorDepth = isNorthSouth ? length : HALLWAY_WIDTH;
  const floorGeom = new THREE.PlaneGeometry(floorWidth, floorDepth);
  const floor = new THREE.Mesh(floorGeom, floorMaterial.clone());
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(floorGeom, ceilingMaterial.clone());
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HALLWAY_HEIGHT;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  if (isNorthSouth) {
    // Side walls (left and right)
    const wallGeom = new THREE.PlaneGeometry(length, HALLWAY_HEIGHT);

    const leftWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-HALLWAY_WIDTH / 2, HALLWAY_HEIGHT / 2, 0);
    leftWall.receiveShadow = true;
    group.add(leftWall);

    const rightWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(HALLWAY_WIDTH / 2, HALLWAY_HEIGHT / 2, 0);
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

    // Wall lamps
    const lampSpacing = 10;
    for (let i = 0; i < length / lampSpacing; i++) {
      const z = -length / 2 + i * lampSpacing + lampSpacing / 2;
      const side = i % 2 === 0 ? "left" : "right";
      const x =
        side === "left" ? -HALLWAY_WIDTH / 2 + 0.04 : HALLWAY_WIDTH / 2 - 0.04;
      const { group: lampGroup, light } = createWallLampGroup(x, z, side);
      group.add(lampGroup);
      chunk.lights.push(light);
      allWallLights.push(light);
    }

    // Hotel room doors
    const doorPositions: number[] = [];
    const startOffset = -length / 2 + DOOR_SPACING / 2 + 1; // Start a bit from the end
    const endOffset = length / 2 - DOOR_SPACING / 2 - 1;

    // Generate room number base from chunk seed
    const roomNumberBase = 100 + (Math.abs(chunk.seed) % 900);
    let doorIndex = 0;

    for (let z = startOffset; z < endOffset; z += DOOR_SPACING) {
      // Alternate sides, sometimes skip for variety
      if (rand() > 0.15) {
        // 85% chance to place a door
        const side: "left" | "right" = doorIndex % 2 === 0 ? "left" : "right";
        const roomNumber = roomNumberBase + doorIndex;
        const door = createHotelDoorGroup(
          z,
          side,
          roomNumber,
          chunk.seed + doorIndex * 777
        );
        group.add(door);
        doorPositions.push(z);
      }
      doorIndex++;
    }

    // Portraits between doors
    const numPortraits = Math.floor(rand() * 2) + 1;
    for (let i = 0; i < numPortraits; i++) {
      let z: number;
      let attempts = 0;
      do {
        z = (rand() - 0.5) * (length - 4);
        attempts++;
      } while (
        (doorPositions.some((pos) => Math.abs(pos - z) < 2) ||
          doorPositions.some((pos) => Math.abs(pos - z) < 2)) &&
        attempts < 20
      );
      if (attempts < 20) {
        const side = rand() > 0.5 ? "left" : "right";
        const portrait = createPortraitGroup(z, side, chunk.seed + i * 1000);
        group.add(portrait);
        allPortraits.push(portrait);
      }
    }

    // Floor debris for creepy atmosphere
    const debris = createFloorDebris(length, HALLWAY_WIDTH, chunk.seed + 5555, true);
    group.add(debris);
  } else {
    // East-West: walls along Z axis
    const wallGeom = new THREE.PlaneGeometry(length, HALLWAY_HEIGHT);

    const frontWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    frontWall.rotation.y = Math.PI;
    frontWall.position.set(0, HALLWAY_HEIGHT / 2, HALLWAY_WIDTH / 2);
    frontWall.receiveShadow = true;
    group.add(frontWall);

    const backWall = new THREE.Mesh(wallGeom, wallMaterial.clone());
    backWall.position.set(0, HALLWAY_HEIGHT / 2, -HALLWAY_WIDTH / 2);
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

    // Wall lamps
    const lampSpacing = 10;
    for (let i = 0; i < length / lampSpacing; i++) {
      const x = -length / 2 + i * lampSpacing + lampSpacing / 2;
      const side = i % 2 === 0 ? "left" : "right";
      const z =
        side === "left" ? -HALLWAY_WIDTH / 2 + 0.04 : HALLWAY_WIDTH / 2 - 0.04;
      const lampGroup = new THREE.Group();
      const { group: lamp, light } = createWallLampGroup(0, 0, side);
      lamp.rotation.y = Math.PI / 2;
      lampGroup.add(lamp);
      lampGroup.position.set(x, 0, z);
      group.add(lampGroup);
      chunk.lights.push(light);
      allWallLights.push(light);
    }

    // Hotel room doors (for E-W hallways, doors are along X axis)
    const startOffset = -length / 2 + DOOR_SPACING / 2 + 1;
    const endOffset = length / 2 - DOOR_SPACING / 2 - 1;
    const roomNumberBase = 100 + (Math.abs(chunk.seed) % 900);
    let doorIndex = 0;

    for (let x = startOffset; x < endOffset; x += DOOR_SPACING) {
      if (rand() > 0.15) {
        const side: "left" | "right" = doorIndex % 2 === 0 ? "left" : "right";
        const roomNumber = roomNumberBase + doorIndex;
        // For E-W hallways, we need to rotate the door group
        const doorGroup = createHotelDoorGroup(
          0,
          side,
          roomNumber,
          chunk.seed + doorIndex * 777
        );
        // Reposition for E-W orientation: swap x and z, rotate
        const wallOffset =
          side === "left"
            ? -HALLWAY_WIDTH / 2 + 0.05
            : HALLWAY_WIDTH / 2 - 0.05;
        doorGroup.position.set(x, 0, wallOffset);
        doorGroup.rotation.y = side === "left" ? 0 : Math.PI;
        group.add(doorGroup);
      }
      doorIndex++;
    }

    // Floor debris for creepy atmosphere
    const debris = createFloorDebris(length, HALLWAY_WIDTH, chunk.seed + 5555, false);
    group.add(debris);
  }

  return group;
}

// Create a junction mesh (4-way intersection with openings on all sides)
function createJunctionMesh(chunk: JunctionChunk): THREE.Group {
  const group = new THREE.Group();
  const size = JUNCTION_SIZE;
  const halfHallway = HALLWAY_WIDTH / 2;

  // Floor
  const floorGeom = new THREE.PlaneGeometry(size, size);
  const floor = new THREE.Mesh(floorGeom, floorMaterial.clone());
  floor.rotation.x = -Math.PI / 2;
  floor.receiveShadow = true;
  group.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(floorGeom, ceilingMaterial.clone());
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.y = HALLWAY_HEIGHT;
  ceiling.receiveShadow = true;
  group.add(ceiling);

  // Corner wall segments - fill the corners between hallway openings
  // Each corner is a square area from the junction edge to the hallway opening
  const cornerSize = (size - HALLWAY_WIDTH) / 2;

  if (cornerSize > 0.1) {
    // Create 4 corner wall sections (each corner has 2 walls facing inward toward center)
    // The walls line up with the hallway walls

    // NW corner (top-left when viewed from above, -X, +Z)
    // Wall on east side of corner (continues the west hallway's wall going north)
    const nwWallEast = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    nwWallEast.rotation.y = -Math.PI / 2; // Face east (into junction)
    nwWallEast.position.set(
      -halfHallway,
      HALLWAY_HEIGHT / 2,
      halfHallway + cornerSize / 2
    );
    group.add(nwWallEast);

    // Wall on south side of corner (continues the north hallway's wall going west)
    const nwWallSouth = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    nwWallSouth.rotation.y = 0; // Face south (into junction)
    nwWallSouth.position.set(
      -halfHallway - cornerSize / 2,
      HALLWAY_HEIGHT / 2,
      halfHallway
    );
    group.add(nwWallSouth);

    // NE corner (top-right, +X, +Z)
    const neWallWest = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    neWallWest.rotation.y = Math.PI / 2; // Face west (into junction)
    neWallWest.position.set(
      halfHallway,
      HALLWAY_HEIGHT / 2,
      halfHallway + cornerSize / 2
    );
    group.add(neWallWest);

    const neWallSouth = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    neWallSouth.rotation.y = 0; // Face south (into junction)
    neWallSouth.position.set(
      halfHallway + cornerSize / 2,
      HALLWAY_HEIGHT / 2,
      halfHallway
    );
    group.add(neWallSouth);

    // SW corner (bottom-left, -X, -Z)
    const swWallEast = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    swWallEast.rotation.y = -Math.PI / 2; // Face east (into junction)
    swWallEast.position.set(
      -halfHallway,
      HALLWAY_HEIGHT / 2,
      -halfHallway - cornerSize / 2
    );
    group.add(swWallEast);

    const swWallNorth = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    swWallNorth.rotation.y = Math.PI; // Face north (into junction)
    swWallNorth.position.set(
      -halfHallway - cornerSize / 2,
      HALLWAY_HEIGHT / 2,
      -halfHallway
    );
    group.add(swWallNorth);

    // SE corner (bottom-right, +X, -Z)
    const seWallWest = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    seWallWest.rotation.y = Math.PI / 2; // Face west (into junction)
    seWallWest.position.set(
      halfHallway,
      HALLWAY_HEIGHT / 2,
      -halfHallway - cornerSize / 2
    );
    group.add(seWallWest);

    const seWallNorth = new THREE.Mesh(
      new THREE.PlaneGeometry(cornerSize, HALLWAY_HEIGHT),
      wallMaterial.clone()
    );
    seWallNorth.rotation.y = Math.PI; // Face north (into junction)
    seWallNorth.position.set(
      halfHallway + cornerSize / 2,
      HALLWAY_HEIGHT / 2,
      -halfHallway
    );
    group.add(seWallNorth);
  }

  // Corner pillars only if junction is larger than hallway (has corners)
  if (cornerSize > 0.1) {
    const pillarSize = 0.2;
    const pillarGeom = new THREE.BoxGeometry(
      pillarSize,
      HALLWAY_HEIGHT,
      pillarSize
    );
    const pillarMat = new THREE.MeshStandardMaterial({
      color: 0x1a1512,
      roughness: 0.8,
    });

    const pillarPositions = [
      { x: -halfHallway, z: -halfHallway },
      { x: halfHallway, z: -halfHallway },
      { x: -halfHallway, z: halfHallway },
      { x: halfHallway, z: halfHallway },
    ];

    pillarPositions.forEach((pos) => {
      const pillar = new THREE.Mesh(pillarGeom, pillarMat);
      pillar.position.set(pos.x, HALLWAY_HEIGHT / 2, pos.z);
      group.add(pillar);
    });
  }

  // Junction light
  const light = new THREE.PointLight(0xffaa44, 0.8, 15, 2);
  light.position.set(0, HALLWAY_HEIGHT - 0.5, 0);
  group.add(light);
  chunk.lights.push(light);
  allWallLights.push(light);

  // Floor debris in junction (less than hallways, but still present)
  const junctionDebris = createFloorDebris(size, size, chunk.seed + 7777, true);
  group.add(junctionDebris);

  return group;
}

// ============== CHUNK CREATION ==============

function createHallwayChunk(
  worldX: number,
  worldZ: number,
  direction: Direction
): HallwayChunk {
  const halfLength = HALLWAY_LENGTH / 2;
  const vec = getDirectionVector(direction);

  const connections: ConnectionPoint[] = [
    {
      direction: direction,
      localX: vec.x * halfLength,
      localZ: vec.z * halfLength,
      connected: false,
      connectedChunkId: null,
    },
    {
      direction: getOppositeDirection(direction),
      localX: -vec.x * halfLength,
      localZ: -vec.z * halfLength,
      connected: false,
      connectedChunkId: null,
    },
  ];

  const chunk: HallwayChunk = {
    id: generateChunkId(),
    type: "hallway",
    worldX,
    worldZ,
    direction,
    connections,
    seed: Math.floor(Math.random() * 100000),
    isLoaded: false,
    meshGroup: null,
    lights: [],
  };

  chunks.set(chunk.id, chunk);
  return chunk;
}

function createJunctionChunk(worldX: number, worldZ: number): JunctionChunk {
  const halfSize = JUNCTION_SIZE / 2;

  const connections: ConnectionPoint[] = [
    {
      direction: "north",
      localX: 0,
      localZ: halfSize,
      connected: false,
      connectedChunkId: null,
    },
    {
      direction: "south",
      localX: 0,
      localZ: -halfSize,
      connected: false,
      connectedChunkId: null,
    },
    {
      direction: "east",
      localX: halfSize,
      localZ: 0,
      connected: false,
      connectedChunkId: null,
    },
    {
      direction: "west",
      localX: -halfSize,
      localZ: 0,
      connected: false,
      connectedChunkId: null,
    },
  ];

  const chunk: JunctionChunk = {
    id: generateChunkId(),
    type: "junction",
    worldX,
    worldZ,
    connections,
    seed: Math.floor(Math.random() * 100000),
    isLoaded: false,
    meshGroup: null,
    lights: [],
  };

  chunks.set(chunk.id, chunk);
  return chunk;
}

// ============== CHUNK LOADING ==============

export function loadChunk(chunk: Chunk, scene: THREE.Scene) {
  if (chunk.isLoaded) return;

  let mesh: THREE.Group;

  if (chunk.type === "hallway") {
    mesh = createHallwayMesh(chunk as HallwayChunk);
  } else {
    mesh = createJunctionMesh(chunk as JunctionChunk);
  }

  mesh.position.set(chunk.worldX, 0, chunk.worldZ);
  scene.add(mesh);

  chunk.meshGroup = mesh;
  chunk.isLoaded = true;
  loadedChunks.add(chunk.id);

  // Add debug visualization if debug mode is on
  if (debugMode) {
    addDebugVisualization(chunk, scene);
  }
}

export function unloadChunk(chunk: Chunk, scene: THREE.Scene) {
  if (!chunk.isLoaded || !chunk.meshGroup) return;

  chunk.lights.forEach((light) => {
    const idx = allWallLights.indexOf(light);
    if (idx > -1) allWallLights.splice(idx, 1);
  });
  chunk.lights = [];

  chunk.meshGroup.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose());
      } else {
        child.material.dispose();
      }
    }
  });

  scene.remove(chunk.meshGroup);
  chunk.meshGroup = null;
  chunk.isLoaded = false;
  loadedChunks.delete(chunk.id);
}

// ============== CHUNK CONNECTION ==============

function connectChunks(
  existingChunk: Chunk,
  connectionDir: Direction,
  newChunk: Chunk
) {
  const existingConn = existingChunk.connections.find(
    (c) => c.direction === connectionDir
  );
  if (!existingConn) return;

  const oppositeDir = getOppositeDirection(connectionDir);
  const newConn = newChunk.connections.find((c) => c.direction === oppositeDir);
  if (!newConn) return;

  existingConn.connected = true;
  existingConn.connectedChunkId = newChunk.id;
  newConn.connected = true;
  newConn.connectedChunkId = existingChunk.id;
}

function spawnConnectedChunks(chunk: Chunk) {
  for (const conn of chunk.connections) {
    if (conn.connected) continue;

    const connWorldX = chunk.worldX + conn.localX;
    const connWorldZ = chunk.worldZ + conn.localZ;
    const dir = conn.direction;
    const vec = getDirectionVector(dir);

    // Spawn single hallway - center is HALLWAY_LENGTH/2 from connection point
    const hallwayX = connWorldX + vec.x * (HALLWAY_LENGTH / 2);
    const hallwayZ = connWorldZ + vec.z * (HALLWAY_LENGTH / 2);

    const isNS = dir === "north" || dir === "south";
    const halfL = HALLWAY_LENGTH / 2;
    const halfW = HALLWAY_WIDTH / 2;
    console.log(
      `Spawning hallway from ${chunk.type} at (${chunk.worldX}, ${chunk.worldZ})`
    );
    console.log(
      `  Connection point (junction edge): (${connWorldX}, ${connWorldZ}), dir: ${dir}`
    );
    console.log(`  Hallway center: (${hallwayX}, ${hallwayZ})`);
    console.log(
      `  Hallway floor bounds: x=[${hallwayX - halfW}, ${
        hallwayX + halfW
      }], z=[${hallwayZ - (isNS ? halfL : halfW)}, ${
        hallwayZ + (isNS ? halfL : halfW)
      }]`
    );
    console.log(
      `  Junction floor bounds: x=[${chunk.worldX - JUNCTION_SIZE / 2}, ${
        chunk.worldX + JUNCTION_SIZE / 2
      }], z=[${chunk.worldZ - JUNCTION_SIZE / 2}, ${
        chunk.worldZ + JUNCTION_SIZE / 2
      }]`
    );

    const hallway = createHallwayChunk(hallwayX, hallwayZ, dir);
    connectChunks(chunk, dir, hallway);

    // Junction at far end of hallway - hallway ends at connWorld + HALLWAY_LENGTH
    // Junction center is JUNCTION_SIZE/2 beyond that
    const junctionX = connWorldX + vec.x * (HALLWAY_LENGTH + JUNCTION_SIZE / 2);
    const junctionZ = connWorldZ + vec.z * (HALLWAY_LENGTH + JUNCTION_SIZE / 2);

    console.log(`  Junction center: (${junctionX}, ${junctionZ})`);

    const junction = createJunctionChunk(junctionX, junctionZ);
    connectChunks(hallway, dir, junction);
  }
}

// ============== PLAYER LOCATION ==============

function findCurrentChunk(px: number, pz: number): Chunk | null {
  const margin = 1;

  for (const [, chunk] of chunks) {
    if (!chunk.isLoaded) continue;

    if (chunk.type === "hallway") {
      const hall = chunk as HallwayChunk;
      const isNS = hall.direction === "north" || hall.direction === "south";
      const halfLength = HALLWAY_LENGTH / 2;
      const halfWidth = HALLWAY_WIDTH / 2;

      if (isNS) {
        if (
          px >= chunk.worldX - halfWidth - margin &&
          px <= chunk.worldX + halfWidth + margin &&
          pz >= chunk.worldZ - halfLength - margin &&
          pz <= chunk.worldZ + halfLength + margin
        ) {
          return chunk;
        }
      } else {
        if (
          px >= chunk.worldX - halfLength - margin &&
          px <= chunk.worldX + halfLength + margin &&
          pz >= chunk.worldZ - halfWidth - margin &&
          pz <= chunk.worldZ + halfWidth + margin
        ) {
          return chunk;
        }
      }
    } else {
      const halfSize = JUNCTION_SIZE / 2;
      if (
        px >= chunk.worldX - halfSize - margin &&
        px <= chunk.worldX + halfSize + margin &&
        pz >= chunk.worldZ - halfSize - margin &&
        pz <= chunk.worldZ + halfSize + margin
      ) {
        return chunk;
      }
    }
  }
  return null;
}

// ============== UPDATE SYSTEM ==============

export interface ChunkInfo {
  id: string;
  type: "hallway" | "junction";
  changed: boolean;
  worldX: number;
  worldZ: number;
}

export function updateSegments(
  px: number,
  pz: number,
  scene: THREE.Scene
): ChunkInfo | null {
  const current = findCurrentChunk(px, pz);
  if (!current) return null;

  const changed = currentChunkId !== current.id;
  currentChunkId = current.id;
  spawnConnectedChunks(current);

  const toKeep = new Set<string>();
  toKeep.add(current.id);

  // Load immediate neighbors and their neighbors (2 levels deep)
  for (const conn of current.connections) {
    if (conn.connectedChunkId) {
      toKeep.add(conn.connectedChunkId);
      const neighbor = chunks.get(conn.connectedChunkId);
      if (neighbor) {
        if (!neighbor.isLoaded) loadChunk(neighbor, scene);
        spawnConnectedChunks(neighbor);

        // Level 2
        for (const conn2 of neighbor.connections) {
          if (conn2.connectedChunkId) {
            toKeep.add(conn2.connectedChunkId);
            const neighbor2 = chunks.get(conn2.connectedChunkId);
            if (neighbor2 && !neighbor2.isLoaded) loadChunk(neighbor2, scene);
          }
        }
      }
    }
  }

  if (loadedChunks.size > MAX_LOADED_SEGMENTS) {
    const byDist = Array.from(loadedChunks)
      .map((id) => {
        const c = chunks.get(id)!;
        const dx = px - c.worldX;
        const dz = pz - c.worldZ;
        return { id, dist: Math.sqrt(dx * dx + dz * dz) };
      })
      .sort((a, b) => b.dist - a.dist);

    while (loadedChunks.size > MAX_LOADED_SEGMENTS && byDist.length > 0) {
      const far = byDist.shift()!;
      if (!toKeep.has(far.id)) {
        const chunk = chunks.get(far.id);
        if (chunk) unloadChunk(chunk, scene);
      }
    }
  }

  return {
    id: current.id,
    type: current.type,
    changed,
    worldX: current.worldX,
    worldZ: current.worldZ,
  };
}

// ============== COLLISION ==============

export function checkWallCollision(x: number, z: number): boolean {
  const margin = 0.4;

  for (const [, chunk] of chunks) {
    if (!chunk.isLoaded) continue;

    if (chunk.type === "hallway") {
      const hall = chunk as HallwayChunk;
      const isNS = hall.direction === "north" || hall.direction === "south";
      const halfLength = HALLWAY_LENGTH / 2;
      const halfWidth = HALLWAY_WIDTH / 2;

      if (isNS) {
        if (
          z >= chunk.worldZ - halfLength &&
          z <= chunk.worldZ + halfLength &&
          Math.abs(x - chunk.worldX) <= halfWidth - margin
        ) {
          return false;
        }
      } else {
        if (
          x >= chunk.worldX - halfLength &&
          x <= chunk.worldX + halfLength &&
          Math.abs(z - chunk.worldZ) <= halfWidth - margin
        ) {
          return false;
        }
      }
    } else {
      // Junction - open on all sides, so just check if player is within the junction area
      const halfSize = JUNCTION_SIZE / 2;
      if (
        x >= chunk.worldX - halfSize &&
        x <= chunk.worldX + halfSize &&
        z >= chunk.worldZ - halfSize &&
        z <= chunk.worldZ + halfSize
      ) {
        return false;
      }
    }
  }

  return true;
}

// ============== INITIALIZATION ==============

export function initializeMaze(scene: THREE.Scene): { x: number; z: number } {
  const startJunction = createJunctionChunk(0, 0);
  spawnConnectedChunks(startJunction);
  loadChunk(startJunction, scene);

  // Load immediate neighbors only
  for (const conn of startJunction.connections) {
    if (conn.connectedChunkId) {
      const hallway = chunks.get(conn.connectedChunkId);
      if (hallway) {
        loadChunk(hallway, scene);
        spawnConnectedChunks(hallway);
        // Load the junction at the end
        for (const hConn of hallway.connections) {
          if (hConn.connectedChunkId) {
            const junction = chunks.get(hConn.connectedChunkId);
            if (junction) loadChunk(junction, scene);
          }
        }
      }
    }
  }

  currentChunkId = startJunction.id;
  return { x: 0, z: 0 };
}
