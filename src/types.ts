import * as THREE from "three";

export type Direction = "north" | "south" | "east" | "west";

export interface HallwaySegment {
  id: string;
  // World position of the hallway START (entrance from parent/spawn)
  startX: number;
  startZ: number;
  // Direction this hallway extends FROM start
  direction: Direction;
  parentId: string | null;
  children: Map<Direction, string>; // Direction from END junction -> child id
  seed: number;
  isLoaded: boolean;
  meshGroup: THREE.Group | null;
  lights: THREE.PointLight[];
}
