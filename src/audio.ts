// Audio event system for creepy maze ambience

export type AudioEventType = "junction" | "hallway_ambient" | "music";

export interface AudioPosition {
  x: number;
  y: number;
  z: number;
}

interface AudioConfig {
  junctionSounds: string[];
  hallwayAmbientSounds: string[];
  doorSlamSounds: string[];
  sprintEndSound: string;
  musicTrack: string;
  hallwayAmbientChance: number; // Chance per update tick (0-1)
  hallwayAmbientCooldown: number; // Minimum ms between ambient sounds
  maxAudioDistance: number; // Distance at which audio becomes silent
  refDistance: number; // Distance at which audio is at full volume
}

const DEFAULT_CONFIG: AudioConfig = {
  junctionSounds: ["/audio/knock3.mp3", "/audio/knock6.mp3"],
  hallwayAmbientSounds: ["/audio/floorcreak.mp3", "/audio/doorcreak.mp3"],
  doorSlamSounds: [
    "/audio/doorcreak.mp3",
    "/audio/knock4.mp3",
    "/audio/knock6.mp3",
  ],
  sprintEndSound: "/audio/endsprintbreath.mp3",
  musicTrack: "/audio/winddrone2.mp3",
  hallwayAmbientChance: 0.002, // ~0.2% chance per frame
  hallwayAmbientCooldown: 8000, // 8 seconds minimum between ambient sounds
  maxAudioDistance: 25, // Audio fades out over 25 units
  refDistance: 2, // Full volume within 2 units
};

class AudioSystem {
  private config: AudioConfig;
  private audioContext: AudioContext | null = null;
  private musicElement: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private musicMuted: boolean = false;
  private sfxMuted: boolean = false;
  private musicVolume: number = 0.3;
  private sfxVolume: number = 0.5;

  // Tracking state
  private lastJunctionId: string | null = null;
  private lastAmbientTime: number = 0;
  private isInHallway: boolean = false;
  private initialized: boolean = false;

  // Current chunk position for spawning ambient sounds
  private currentChunkPosition: AudioPosition = { x: 0, y: 0, z: 0 };

  // Audio cache
  private audioBuffers: Map<string, AudioBuffer> = new Map();
  private loadingPromises: Map<string, Promise<AudioBuffer | null>> = new Map();

  constructor(config: Partial<AudioConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  // Initialize audio context (must be called after user interaction)
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.audioContext = new AudioContext();

      // Preload audio files
      await this.preloadAudio();

      // Start background music
      this.startMusic();

      this.initialized = true;
      console.log("Audio system initialized");
    } catch (error) {
      console.warn("Failed to initialize audio system:", error);
    }
  }

  private async preloadAudio(): Promise<void> {
    const allSounds = [
      ...this.config.junctionSounds,
      ...this.config.hallwayAmbientSounds,
      ...this.config.doorSlamSounds,
      this.config.sprintEndSound,
    ];

    const loadPromises = allSounds.map((url) => this.loadAudioBuffer(url));
    await Promise.allSettled(loadPromises);
  }

  private async loadAudioBuffer(url: string): Promise<AudioBuffer | null> {
    if (this.audioBuffers.has(url)) {
      return this.audioBuffers.get(url)!;
    }

    if (this.loadingPromises.has(url)) {
      return this.loadingPromises.get(url)!;
    }

    const loadPromise = (async () => {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Audio file not found: ${url}`);
          return null;
        }
        const arrayBuffer = await response.arrayBuffer();
        const audioBuffer = await this.audioContext!.decodeAudioData(
          arrayBuffer
        );
        this.audioBuffers.set(url, audioBuffer);
        return audioBuffer;
      } catch (error) {
        console.warn(`Failed to load audio: ${url}`, error);
        return null;
      }
    })();

    this.loadingPromises.set(url, loadPromise);
    return loadPromise;
  }

  private playBuffer(buffer: AudioBuffer, volume: number = 1): void {
    if (!this.audioContext || this.isMuted || this.sfxMuted) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();

    source.buffer = buffer;
    gainNode.gain.value = volume * this.sfxVolume;

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);

    source.start(0);
  }

  // Play a sound at a specific 3D position
  private playBufferAtPosition(
    buffer: AudioBuffer,
    position: AudioPosition,
    volume: number = 1
  ): void {
    if (!this.audioContext || this.isMuted || this.sfxMuted) return;

    const source = this.audioContext.createBufferSource();
    const gainNode = this.audioContext.createGain();
    const panner = this.audioContext.createPanner();

    // Configure panner for 3D audio
    panner.panningModel = "HRTF"; // Head-related transfer function for realistic 3D
    panner.distanceModel = "linear";
    panner.refDistance = this.config.refDistance;
    panner.maxDistance = this.config.maxAudioDistance;
    panner.rolloffFactor = 1;

    // Set the sound's position
    panner.positionX.setValueAtTime(position.x, this.audioContext.currentTime);
    panner.positionY.setValueAtTime(position.y, this.audioContext.currentTime);
    panner.positionZ.setValueAtTime(position.z, this.audioContext.currentTime);

    source.buffer = buffer;
    gainNode.gain.value = volume * this.sfxVolume;

    // Connect: source -> gain -> panner -> destination
    source.connect(gainNode);
    gainNode.connect(panner);
    panner.connect(this.audioContext.destination);

    source.start(0);
  }

  // Update the listener (player) position for 3D audio
  updateListenerPosition(
    x: number,
    y: number,
    z: number,
    forwardX: number = 0,
    forwardZ: number = -1
  ): void {
    if (!this.audioContext) return;

    const listener = this.audioContext.listener;

    // Set listener position
    if (listener.positionX) {
      listener.positionX.setValueAtTime(x, this.audioContext.currentTime);
      listener.positionY.setValueAtTime(y, this.audioContext.currentTime);
      listener.positionZ.setValueAtTime(z, this.audioContext.currentTime);
    } else {
      // Fallback for older browsers
      listener.setPosition(x, y, z);
    }

    // Set listener orientation (forward vector and up vector)
    if (listener.forwardX) {
      listener.forwardX.setValueAtTime(forwardX, this.audioContext.currentTime);
      listener.forwardY.setValueAtTime(0, this.audioContext.currentTime);
      listener.forwardZ.setValueAtTime(forwardZ, this.audioContext.currentTime);
      listener.upX.setValueAtTime(0, this.audioContext.currentTime);
      listener.upY.setValueAtTime(1, this.audioContext.currentTime);
      listener.upZ.setValueAtTime(0, this.audioContext.currentTime);
    } else {
      // Fallback for older browsers
      listener.setOrientation(forwardX, 0, forwardZ, 0, 1, 0);
    }
  }

  private startMusic(): void {
    if (this.musicElement) return;

    this.musicElement = new Audio(this.config.musicTrack);
    this.musicElement.loop = true;
    this.musicElement.volume = this.musicVolume;

    // Handle autoplay restrictions
    this.musicElement.play().catch(() => {
      // Will be started on first user interaction
      console.log("Music autoplay blocked, waiting for user interaction");
    });

    this.updateMusicMute();
  }

  // Call this on user interaction to ensure audio plays
  async resumeAudio(): Promise<void> {
    if (this.audioContext?.state === "suspended") {
      await this.audioContext.resume();
    }

    if (
      this.musicElement &&
      this.musicElement.paused &&
      !this.musicMuted &&
      !this.isMuted
    ) {
      this.musicElement.play().catch(console.warn);
    }
  }

  // Event handlers
  onJunctionEnter(junctionId: string, worldX: number, worldZ: number): void {
    if (junctionId === this.lastJunctionId) return;

    this.lastJunctionId = junctionId;
    this.playJunctionSound(worldX, worldZ);
  }

  onHallwayUpdate(worldX: number, worldZ: number): void {
    this.isInHallway = true;
    this.currentChunkPosition = { x: worldX, y: 1.6, z: worldZ };
    this.maybePlayAmbientSound();
  }

  onJunctionUpdate(): void {
    this.isInHallway = false;
  }

  // Play sound when player stops sprinting
  onSprintEnd(): void {
    const buffer = this.audioBuffers.get(this.config.sprintEndSound);
    if (buffer) {
      this.playBuffer(buffer, 0.6);
    }
  }

  // Play door slam sound at a specific position
  playDoorSlam(worldX: number, worldY: number, worldZ: number): void {
    if (this.config.doorSlamSounds.length === 0) return;

    const url =
      this.config.doorSlamSounds[
        Math.floor(Math.random() * this.config.doorSlamSounds.length)
      ];

    const buffer = this.audioBuffers.get(url);
    if (buffer) {
      this.playBufferAtPosition(
        buffer,
        { x: worldX, y: worldY, z: worldZ },
        0.9 + Math.random() * 0.2 // Slightly varied volume
      );
    }
  }

  private playJunctionSound(worldX: number, worldZ: number): void {
    if (this.config.junctionSounds.length === 0) return;

    const url =
      this.config.junctionSounds[
        Math.floor(Math.random() * this.config.junctionSounds.length)
      ];

    const buffer = this.audioBuffers.get(url);
    if (buffer) {
      // Spawn sound at junction center
      this.playBufferAtPosition(buffer, { x: worldX, y: 1.6, z: worldZ }, 0.8);
    }
  }

  private maybePlayAmbientSound(): void {
    if (!this.isInHallway) return;

    const now = Date.now();
    if (now - this.lastAmbientTime < this.config.hallwayAmbientCooldown) return;

    if (Math.random() > this.config.hallwayAmbientChance) return;

    this.lastAmbientTime = now;

    if (this.config.hallwayAmbientSounds.length === 0) return;

    const url =
      this.config.hallwayAmbientSounds[
        Math.floor(Math.random() * this.config.hallwayAmbientSounds.length)
      ];

    const buffer = this.audioBuffers.get(url);
    if (buffer) {
      // Spawn sound at a random offset from the hallway center
      // This creates variety in where sounds come from
      const offsetX = (Math.random() - 0.5) * 8; // Random offset within hallway
      const offsetZ = (Math.random() - 0.5) * 8;
      const position: AudioPosition = {
        x: this.currentChunkPosition.x + offsetX,
        y: 1.0 + Math.random() * 1.5, // Random height variation
        z: this.currentChunkPosition.z + offsetZ,
      };

      // Random volume variation for more natural feel
      const volume = 0.4 + Math.random() * 0.4;
      this.playBufferAtPosition(buffer, position, volume);
    }
  }

  // Volume and mute controls
  setMasterMute(muted: boolean): void {
    this.isMuted = muted;
    this.updateMusicMute();
  }

  setMusicMute(muted: boolean): void {
    this.musicMuted = muted;
    this.updateMusicMute();
  }

  setSfxMute(muted: boolean): void {
    this.sfxMuted = muted;
  }

  private updateMusicMute(): void {
    if (this.musicElement) {
      this.musicElement.muted = this.isMuted || this.musicMuted;
    }
  }

  setMusicVolume(volume: number): void {
    this.musicVolume = Math.max(0, Math.min(1, volume));
    if (this.musicElement) {
      this.musicElement.volume = this.musicVolume;
    }
  }

  setSfxVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume));
  }

  // Getters for UI state
  isMasterMuted(): boolean {
    return this.isMuted;
  }

  isMusicMuted(): boolean {
    return this.musicMuted;
  }

  isSfxMuted(): boolean {
    return this.sfxMuted;
  }

  getMusicVolume(): number {
    return this.musicVolume;
  }

  getSfxVolume(): number {
    return this.sfxVolume;
  }

  isInitialized(): boolean {
    return this.initialized;
  }
}

// Singleton instance
export const audioSystem = new AudioSystem();
