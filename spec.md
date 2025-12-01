# Madman Game - Technical Specification

A first-person horror exploration game set in an infinite procedurally-generated hotel maze, built with Three.js.

## Overview

**Genre:** First-person horror/exploration  
**Engine:** Three.js with TypeScript  
**Build Tool:** Vite  
**Theme:** Creepy abandoned hotel with supernatural elements

### Core Concept

The player explores an endless maze of hotel hallways and intersections. Cryptic messages warn of a "madman" who communicates through knocking sounds:
- 1 knock = wrong way
- 2 knocks = try again  
- 3 knocks = run

---

## Technical Stack

### Dependencies
- **three** (^0.181.2) - 3D rendering engine
- **postprocessing** (^6.38.0) - Visual effects (pixelation)
- **TypeScript** (^5.9.3) - Type safety
- **Vite** (^7.2.4) - Build tooling

---

## Architecture

### File Structure

```
src/
├── main.ts        # Entry point, scene setup, game loop
├── player.ts      # Player controller, movement, camera
├── maze.ts        # Procedural maze generation, chunk system
├── audio.ts       # 3D spatial audio system
├── decorations.ts # Props: doors, portraits, lamps, debris
├── materials.ts   # Three.js materials
├── textures.ts    # Procedural texture generation
├── constants.ts   # Game configuration values
├── types.ts       # TypeScript interfaces
├── utils.ts       # Helper functions
└── style.css      # UI styling
```

---

## Core Systems

### 1. Scene & Rendering

**Setup:**
- Scene background: `#050505` (near black)
- Fog: Linear fog from 1 to 14 units (dark atmospheric)
- Renderer: WebGL with `powerPreference: "high-performance"`
- Pixel ratio: Capped at 1.5 for Firefox compatibility
- Shadows: BasicShadowMap for performance

**Post-Processing:**
- EffectComposer pipeline
- Pixelation effect (adjustable 1-12 granularity, default 4)

**Camera:**
- PerspectiveCamera
- FOV: 75° (adjustable 50-100)
- Near plane: 0.1
- Far plane: 100

### 2. Procedural Maze System

**Chunk Types:**

1. **Hallway** - Straight corridors
   - Dimensions: 3.5w × 3.5h × 16 length
   - Orientations: North-South or East-West
   - Features: Walls, floor, ceiling, wainscoting
   - 2 connection points (both ends)

2. **Junction** - 4-way intersections
   - Size: 3.5 × 3.5 (matches hallway width)
   - Corner pillars at hallway openings
   - 4 connection points (N, S, E, W)

**Chunk Data Structure:**
```typescript
interface Chunk {
  id: string;              // Unique identifier
  type: "hallway" | "junction";
  worldX: number;          // World position
  worldZ: number;
  connections: ConnectionPoint[];
  seed: number;            // For deterministic generation
  isLoaded: boolean;
  meshGroup: THREE.Group | null;
  lights: THREE.PointLight[];
}
```

**Generation Algorithm:**
1. Start with a junction at origin (0, 0)
2. Each junction spawns hallways in all 4 directions
3. Each hallway spawns a junction at its far end
4. Player movement triggers chunk spawning (2 levels deep)
5. Max loaded segments: 8 (unload farthest when exceeded)

**Connection System:**
- Connection points track attachment state
- Chunks connect via opposite directions (north ↔ south)
- Hallway center offset: `HALLWAY_LENGTH / 2` from connection
- Junction center offset: `JUNCTION_SIZE / 2` from hallway end

### 3. Player Controller

**Movement:**
```typescript
MOVE_SPEED: 0.08     // Units per frame
SPRINT_SPEED: 0.12   // While holding Shift
```

**Controls:**
- WASD / Arrow keys: Movement
- Mouse: Look around (pointer lock)
- Shift: Sprint
- Click: Also moves forward (hold)
- ESC: Release pointer lock

**Stamina System:**
```typescript
MAX_STAMINA: 100
STAMINA_DRAIN_RATE: 0.5    // Per frame while sprinting
STAMINA_REGEN_RATE: 0.3    // Per frame while resting
STAMINA_REGEN_DELAY: 60    // Frames before regen starts
```

**Head Bob (Camera Shake):**
- Frequency: 12 cycles per unit of movement
- Vertical amplitude: 0.03 units
- Horizontal sway: 0.015 units
- Smoothly returns to base height when stopped

**Collision Detection:**
- Simple AABB-based collision
- Margin: 0.4 units from walls
- Checks all loaded chunks
- X and Z movement checked independently

### 4. Audio System

**Architecture:**
- Web Audio API with AudioContext
- 3D spatial audio using PannerNode (HRTF model)
- Separate controls for music and SFX
- Volume controls with master mute

**Audio Types:**

| Type | Files | Trigger |
|------|-------|---------|
| Junction sounds | knock3.mp3, knock6.mp3 | Entering new junction |
| Ambient sounds | floorcreak.mp3, doorcreak.mp3 | Random in hallways |
| Door slam | doorcreak.mp3, knock4.mp3, knock6.mp3 | Door animations |
| Sprint end | endsprintbreath.mp3 | After sustained sprint |
| Background music | winddrone2.mp3 | Looping ambient |

**Spatial Audio Config:**
```typescript
maxAudioDistance: 25   // Fade out distance
refDistance: 2         // Full volume distance
hallwayAmbientChance: 0.002   // Per-frame chance
hallwayAmbientCooldown: 8000  // ms between ambient
```

**Listener Updates:**
- Position synced with camera
- Orientation synced with player yaw

### 5. Decorations & Props

**Wall Lamps:**
- Spacing: 10 units along hallway
- Alternating sides
- Point light: `#ffaa44`, intensity 1.2, range 10
- Flickering animation in game loop

**Hotel Doors:**
- Spacing: 4 units along hallway (85% spawn chance)
- Frame + panel + decorative insets
- Brass handle and room number plate
- Room numbers: Seeded 100-999
- 15% chance to be "ajar" with TV light

**Portraits:**
- 1-2 per hallway (random placement)
- Procedurally generated textures
- Slight tilt with gentle sway animation
- Avoid placement near doors

**Floor Debris Types:**
- Paper (crumpled notes)
- Glass shards
- Dust piles
- Keys (old hotel keys)
- Cigarette butts
- Bottles (intact or broken)
- Dark stains
- Dead leaves

**TV Lights (Ajar Doors):**
- Point light: `#6688ff` (blue-ish TV glow)
- Flickering animation (phase and speed variation)
- Visible glow plane at door gap

### 6. Procedural Textures

**Texture Styles:**
Two styles available via `TEXTURE_STYLE` constant:

1. **Modern** (dirty hotel):
   - Dirty wall texture with water damage, stains, scuffs
   - Dark burgundy carpet with geometric pattern
   
2. **Classic** (Victorian):
   - Ornate damask wallpaper pattern
   - Wood plank floor texture

**Wall Texture Layers:**
1. Base color (dingy off-white)
2. Color variation noise
3. Yellowing gradient (top)
4. Water damage stains (vertical drips)
5. Bottom grime gradient
6. Mysterious dark stains
7. Scuff marks and scratches
8. Handprint smudges
9. Dust accumulation

**Floor Texture Layers:**
1. Dark base color
2. Geometric repeating pattern
3. Wear/fade gradients (center, edges)
4. Random dark stains
5. Noise grain overlay

**Portrait Generation:**
- Canvas-based procedural generation
- Abstract humanoid figure
- Dark oil painting aesthetic
- Unique per seed

---

## Visual Effects

### Lighting

**Ambient Light:**
- Color: `#1a1010` (dark red tint)
- Intensity: 0.6

**Wall Lamp Flickering:**
```typescript
// Update every 3rd frame
baseIntensity = 0.7
flicker = sin(time * 8) * 0.15 + sin(time * 17) * 0.08
// Occasional spike: 2% chance of -0.3
```

**TV Light Flickering:**
```typescript
// Update every 2nd frame
flicker = sin(time * 12 * speed + phase) * 0.4
// 0.5% chance of brightness spike
// Color oscillates between blue tones
```

### Post-Processing

**Pixelation Effect:**
- Default granularity: 4
- Range: 1-12 (UI adjustable)
- Can be toggled off

---

## UI Elements

### Stamina Bar
- Position: Fixed bottom center
- Size: 200px × 16px
- Shows only when stamina < 100%
- Turns red when stamina < 25%

### Intro Sequence
1. Black fade-in overlay
2. Title appears: "madman writing on the wall says"
3. Lines fade in sequentially:
   - "1 knock, wrong way"
   - "2 knocks, try again"
   - "3 knocks, run"
4. Fade out after ~7 seconds

### Debug Menu (Press `/`)
- Chunk boundary visualization toggle
- Audio controls (mute all/music/SFX)
- Volume sliders (music/SFX)
- Pixelation toggle and size
- FOV slider (50-100°)

### Instructions Overlay
- Fixed bottom-left corner
- Movement instructions
- Always visible

---

## Performance Optimizations

### Firefox Compatibility
- Pixel ratio capped at 1.5
- BasicShadowMap instead of PCFSoftShadowMap
- Frame rate limiting to 60fps
- Antialias disabled

### Chunk Management
- Max 8 loaded chunks
- Distance-based unloading (furthest first)
- Protected chunks: current + immediate neighbors (2 levels)
- Geometry and material disposal on unload

### Animation Throttling
- Lights update every 3rd frame
- TV lights update every 2nd frame
- Portrait sway is lightweight (rotation only)

---

## Constants Reference

```typescript
// Dimensions
HALLWAY_WIDTH: 3.5
HALLWAY_HEIGHT: 3.5
HALLWAY_LENGTH: 16
JUNCTION_SIZE: 3.5
DOOR_WIDTH: 1.2
DOOR_HEIGHT: 2.4
DOOR_SPACING: 4

// Limits
MAX_LOADED_SEGMENTS: 8

// Player
MOVE_SPEED: 0.08
SPRINT_SPEED: 0.12
MAX_STAMINA: 100
STAMINA_DRAIN_RATE: 0.5
STAMINA_REGEN_RATE: 0.3
STAMINA_REGEN_DELAY: 60

// Style
TEXTURE_STYLE: "modern" | "classic"
```

---

## Utility Functions

```typescript
// Direction helpers
getOppositeDirection(dir: Direction): Direction
getDirectionVector(dir: Direction): { x: number; z: number }

// Seeded random for deterministic generation
seededRandom(seed: number): () => number
```

**Direction Vectors:**
- North: (0, 1)
- South: (0, -1)
- East: (1, 0)
- West: (-1, 0)

---

## Game Loop

```typescript
function animate(currentTime) {
  requestAnimationFrame(animate);
  
  // Frame rate limiting (~60fps)
  if (deltaTime < targetFrameTime * 0.9) return;
  
  const time = performance.now() * 0.001;
  
  player.update();        // Movement, collision, audio updates
  updateLights(time);     // Wall lamp flickering
  updatePortraits(time);  // Portrait swaying
  updateTVLights(time);   // TV flickering effect
  
  composer.render();      // Post-processing pass
}
```

---

## Future Enhancement Possibilities

Based on the existing architecture, these features would fit naturally:

1. **The Madman Entity** - AI enemy that stalks the player
2. **Knock Event System** - Directional audio cues tied to maze navigation
3. **Interactive Doors** - Some doors could open/close
4. **Collectibles** - Notes, keys for progression
5. **Sanity System** - Effects that worsen over time
6. **Dynamic Events** - Lights flickering off, doors slamming
7. **Multiple Floors** - Elevator/stairwell transitions
8. **Save System** - Player position and discovered areas

---

## Audio File Requirements

```
public/audio/
├── knock3.mp3          # Junction entry sound
├── knock4.mp3          # Door slam variant
├── knock6.mp3          # Junction/door sound
├── floorcreak.mp3      # Ambient hallway
├── doorcreak.mp3       # Ambient hallway
├── endsprintbreath.mp3 # After sprinting
└── winddrone2.mp3      # Background music loop
```

---

## Build & Run

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview
```
