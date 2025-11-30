import type { Direction } from "./types";

export function getOppositeDirection(dir: Direction): Direction {
  const opposites: Record<Direction, Direction> = {
    north: "south",
    south: "north",
    east: "west",
    west: "east",
  };
  return opposites[dir];
}

export function getDirectionVector(dir: Direction): { x: number; z: number } {
  switch (dir) {
    case "north":
      return { x: 0, z: 1 };
    case "south":
      return { x: 0, z: -1 };
    case "east":
      return { x: 1, z: 0 };
    case "west":
      return { x: -1, z: 0 };
  }
}

// Seeded random for consistent generation
export function seededRandom(seed: number): () => number {
  return () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
}
