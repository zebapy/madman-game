// Hallway dimensions
export const HALLWAY_WIDTH = 3.5;
export const HALLWAY_HEIGHT = 3.5;
export const HALLWAY_LENGTH = 16; // Longer hallways for hotel corridor feel
export const JUNCTION_SIZE = HALLWAY_WIDTH; // Junction matches hallway width for clean alignment

// Door dimensions
export const DOOR_WIDTH = 1.2;
export const DOOR_HEIGHT = 2.4;
export const DOOR_SPACING = 4; // Distance between doors along hallway

// Maze system
export const MAX_LOADED_SEGMENTS = 12;

// Player
export const MOVE_SPEED = 0.08;
export const SPRINT_SPEED = 0.12;

// Stamina
export const MAX_STAMINA = 100;
export const STAMINA_DRAIN_RATE = 0.5; // Per frame while sprinting
export const STAMINA_REGEN_RATE = 0.3; // Per frame while not sprinting
export const STAMINA_REGEN_DELAY = 60; // Frames to wait before regenerating

// Texture style: "modern" (dirty hotel) or "classic" (Victorian/wood)
export const TEXTURE_STYLE: "modern" | "classic" = "modern";
