import * as THREE from "three";

export type Direction = "north" | "south" | "east" | "west";

// Chunk types for procedural generation
export type ChunkType = "hallway" | "junction";

// A connection point on a chunk where another chunk can attach
export interface ConnectionPoint {
  direction: Direction; // Which direction this connection faces (outward)
  localX: number; // Local offset from chunk center
  localZ: number;
  connected: boolean; // Whether another chunk is connected here
  connectedChunkId: string | null;
}

// Base chunk interface
export interface Chunk {
  id: string;
  type: ChunkType;
  worldX: number; // Center X position
  worldZ: number; // Center Z position
  connections: ConnectionPoint[];
  seed: number;
  isLoaded: boolean;
  meshGroup: THREE.Group | null;
  lights: THREE.PointLight[];
}

// Hallway chunk - a straight corridor (extends along Z axis by default)
export interface HallwayChunk extends Chunk {
  type: "hallway";
  direction: Direction; // Which way the hallway runs
}

// Junction chunk - a 4-way intersection
export interface JunctionChunk extends Chunk {
  type: "junction";
}
