import * as THREE from "three";
import { TEXTURE_STYLE } from "./constants";

// Create wallpaper texture based on style setting
export function createWallpaperTexture(): THREE.CanvasTexture {
  return TEXTURE_STYLE === "modern"
    ? createDirtyWallTexture()
    : createVictorianWallpaperTexture();
}

// Create floor texture based on style setting
export function createFloorTexture(): THREE.CanvasTexture {
  return TEXTURE_STYLE === "modern"
    ? createCarpetTexture()
    : createWoodFloorTexture();
}

// ============ MODERN STYLE (Dirty Hotel) ============

// Create dirty hotel wall texture
function createDirtyWallTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dingy off-white/beige base - like old painted drywall
  ctx.fillStyle = "#d8d0c8";
  ctx.fillRect(0, 0, 512, 512);

  // Subtle color variation in the paint
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 500; i++) {
    const shade = Math.floor(Math.random() * 30) + 190;
    ctx.fillStyle = `rgb(${shade + 10}, ${shade + 5}, ${shade - 10})`;
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 40 + 10,
      Math.random() * 40 + 10
    );
  }

  // Wall texture - slight bumps and imperfections
  ctx.globalAlpha = 0.05;
  for (let i = 0; i < 3000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#ffffff" : "#a09080";
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 2 + 1,
      Math.random() * 2 + 1
    );
  }

  // Yellowing/aging near ceiling (top of texture)
  ctx.globalAlpha = 0.2;
  const yellowGradient = ctx.createLinearGradient(0, 0, 0, 200);
  yellowGradient.addColorStop(0, "#8a7a50");
  yellowGradient.addColorStop(1, "transparent");
  ctx.fillStyle = yellowGradient;
  ctx.fillRect(0, 0, 512, 200);

  // Water damage stains running down
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 4; i++) {
    const stainX = Math.random() * 512;
    const stainWidth = Math.random() * 40 + 20;
    const stainHeight = Math.random() * 300 + 100;

    const gradient = ctx.createLinearGradient(stainX, 0, stainX, stainHeight);
    gradient.addColorStop(0, "#6a5a40");
    gradient.addColorStop(0.3, "#8a7a60");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;

    ctx.beginPath();
    ctx.moveTo(stainX - stainWidth / 2, 0);
    // Wavy drip pattern
    for (let y = 0; y < stainHeight; y += 20) {
      ctx.lineTo(stainX - stainWidth / 2 + Math.sin(y * 0.05) * 10, y);
    }
    ctx.lineTo(
      stainX + stainWidth / 2 + Math.sin(stainHeight * 0.05) * 10,
      stainHeight
    );
    for (let y = stainHeight; y > 0; y -= 20) {
      ctx.lineTo(stainX + stainWidth / 2 + Math.sin(y * 0.05) * 10, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // Dark corner/edge grime (bottom)
  ctx.globalAlpha = 0.3;
  const bottomGrime = ctx.createLinearGradient(0, 400, 0, 512);
  bottomGrime.addColorStop(0, "transparent");
  bottomGrime.addColorStop(1, "#3a3530");
  ctx.fillStyle = bottomGrime;
  ctx.fillRect(0, 400, 512, 112);

  // Mysterious dark stains
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 6; i++) {
    const stainX = Math.random() * 512;
    const stainY = Math.random() * 512;
    const stainSize = Math.random() * 60 + 20;
    const gradient = ctx.createRadialGradient(
      stainX,
      stainY,
      0,
      stainX,
      stainY,
      stainSize
    );
    gradient.addColorStop(0, "#4a4035");
    gradient.addColorStop(0.5, "#6a6055");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      stainX,
      stainY,
      stainSize,
      stainSize * (0.5 + Math.random() * 0.5),
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Scuff marks and scratches
  ctx.globalAlpha = 0.15;
  ctx.strokeStyle = "#5a5045";
  ctx.lineWidth = 2;
  for (let i = 0; i < 20; i++) {
    const startX = Math.random() * 512;
    const startY = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + (Math.random() - 0.5) * 60,
      startY + (Math.random() - 0.5) * 30
    );
    ctx.stroke();
  }

  // Handprint-like smudges
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 3; i++) {
    const smudgeX = Math.random() * 400 + 50;
    const smudgeY = Math.random() * 300 + 150;
    const gradient = ctx.createRadialGradient(
      smudgeX,
      smudgeY,
      0,
      smudgeX,
      smudgeY,
      40
    );
    gradient.addColorStop(0, "#3a3025");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(smudgeX - 50, smudgeY - 30, 100, 60);
  }

  // Dust accumulation spots
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = "#8a8070";
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 3 + 1,
      Math.random() * 3 + 1
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 2);
  return texture;
}

// Create messy hotel carpet texture
function createCarpetTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dark burgundy/maroon carpet base - classic creepy hotel color
  ctx.fillStyle = "#1a0a0a";
  ctx.fillRect(0, 0, 512, 512);

  // Create carpet pattern - geometric hotel style
  const patternSize = 64;
  for (let y = 0; y < 512; y += patternSize) {
    for (let x = 0; x < 512; x += patternSize) {
      // Alternating diamond pattern
      const shade = Math.floor(Math.random() * 15) + 20;

      // Diamond shapes in darker burgundy
      ctx.fillStyle = `rgb(${shade + 10}, ${shade - 5}, ${shade - 8})`;
      ctx.save();
      ctx.translate(x + patternSize / 2, y + patternSize / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(
        -patternSize / 3,
        -patternSize / 3,
        patternSize / 1.5,
        patternSize / 1.5
      );
      ctx.restore();

      // Inner accent
      ctx.fillStyle = `rgb(${shade + 5}, ${shade - 10}, ${shade - 12})`;
      ctx.save();
      ctx.translate(x + patternSize / 2, y + patternSize / 2);
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(
        -patternSize / 6,
        -patternSize / 6,
        patternSize / 3,
        patternSize / 3
      );
      ctx.restore();
    }
  }

  // Add carpet texture/fibers
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 8000; i++) {
    const fiberX = Math.random() * 512;
    const fiberY = Math.random() * 512;
    const brightness = Math.floor(Math.random() * 30) + 15;
    ctx.fillStyle =
      Math.random() > 0.7
        ? `rgb(${brightness + 10}, ${brightness - 5}, ${brightness - 8})`
        : `rgb(${brightness}, ${brightness - 10}, ${brightness - 12})`;
    ctx.fillRect(fiberX, fiberY, 1, 2);
  }

  // Worn pathways - lighter, matted areas
  ctx.globalAlpha = 0.15;
  ctx.fillStyle = "#3a2520";
  ctx.fillRect(200, 0, 120, 512); // Center worn path

  // Random worn spots
  for (let i = 0; i < 8; i++) {
    const wornX = Math.random() * 512;
    const wornY = Math.random() * 512;
    const gradient = ctx.createRadialGradient(
      wornX,
      wornY,
      0,
      wornX,
      wornY,
      Math.random() * 60 + 30
    );
    gradient.addColorStop(0, "#2a1a15");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(wornX - 70, wornY - 70, 140, 140);
  }

  // Dark stains - water damage, mysterious fluids
  ctx.globalAlpha = 0.4;
  for (let i = 0; i < 6; i++) {
    const stainX = Math.random() * 512;
    const stainY = Math.random() * 512;
    const stainSize = Math.random() * 50 + 20;
    const gradient = ctx.createRadialGradient(
      stainX,
      stainY,
      0,
      stainX,
      stainY,
      stainSize
    );
    // Dark brownish stains
    gradient.addColorStop(0, "#080404");
    gradient.addColorStop(0.6, "#0a0505");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.ellipse(
      stainX,
      stainY,
      stainSize,
      stainSize * (0.7 + Math.random() * 0.6),
      Math.random() * Math.PI,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }

  // Mysterious darker stains (could be anything...)
  ctx.globalAlpha = 0.3;
  for (let i = 0; i < 3; i++) {
    const stainX = Math.random() * 512;
    const stainY = Math.random() * 512;
    const stainSize = Math.random() * 30 + 15;
    const gradient = ctx.createRadialGradient(
      stainX,
      stainY,
      0,
      stainX,
      stainY,
      stainSize
    );
    gradient.addColorStop(0, "#0a0202");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(
      stainX - stainSize,
      stainY - stainSize,
      stainSize * 2,
      stainSize * 2
    );
  }

  // Frayed/pulled carpet fibers
  ctx.globalAlpha = 0.5;
  ctx.strokeStyle = "#0a0505";
  ctx.lineWidth = 2;
  for (let i = 0; i < 15; i++) {
    const startX = Math.random() * 512;
    const startY = Math.random() * 512;
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + (Math.random() - 0.5) * 40,
      startY + (Math.random() - 0.5) * 40
    );
    ctx.stroke();
  }

  // Add dirt/grime accumulation
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < 1000; i++) {
    ctx.fillStyle = "#000000";
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 4 + 1,
      Math.random() * 4 + 1
    );
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  return texture;
}

// ============ CLASSIC STYLE (Victorian/Wood) ============

// Create ornate Victorian wallpaper texture
function createVictorianWallpaperTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dark burgundy/maroon base
  ctx.fillStyle = "#1a0a0a";
  ctx.fillRect(0, 0, 512, 512);

  // Victorian damask pattern
  const patternSize = 128;
  ctx.fillStyle = "#2a1515";

  for (let y = 0; y < 512; y += patternSize) {
    for (let x = 0; x < 512; x += patternSize) {
      const offsetX = (y / patternSize) % 2 === 0 ? 0 : patternSize / 2;

      ctx.save();
      ctx.translate(x + offsetX + patternSize / 2, y + patternSize / 2);

      // Ornate diamond shape
      ctx.beginPath();
      ctx.moveTo(0, -patternSize * 0.4);
      ctx.quadraticCurveTo(
        patternSize * 0.3,
        -patternSize * 0.2,
        patternSize * 0.35,
        0
      );
      ctx.quadraticCurveTo(
        patternSize * 0.3,
        patternSize * 0.2,
        0,
        patternSize * 0.4
      );
      ctx.quadraticCurveTo(
        -patternSize * 0.3,
        patternSize * 0.2,
        -patternSize * 0.35,
        0
      );
      ctx.quadraticCurveTo(
        -patternSize * 0.3,
        -patternSize * 0.2,
        0,
        -patternSize * 0.4
      );
      ctx.fill();

      // Inner detail
      ctx.fillStyle = "#351a1a";
      ctx.beginPath();
      ctx.arc(0, 0, patternSize * 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Fleur-de-lis style accents
      ctx.fillStyle = "#2a1515";
      ctx.beginPath();
      ctx.ellipse(
        0,
        -patternSize * 0.25,
        patternSize * 0.08,
        patternSize * 0.12,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(
        0,
        patternSize * 0.25,
        patternSize * 0.08,
        patternSize * 0.12,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();
    }
  }

  // Add aging/grime overlay
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 2000; i++) {
    ctx.fillStyle = Math.random() > 0.5 ? "#000000" : "#1a0505";
    ctx.fillRect(
      Math.random() * 512,
      Math.random() * 512,
      Math.random() * 3 + 1,
      Math.random() * 3 + 1
    );
  }

  // Vertical stripes (subtle)
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = "#000000";
  for (let x = 0; x < 512; x += 32) {
    ctx.fillRect(x, 0, 2, 512);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 2);
  return texture;
}

// Create creepy wooden floor texture
function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dark wood base
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(0, 0, 512, 512);

  const plankWidth = 64;
  const plankHeight = 512;

  for (let x = 0; x < 512; x += plankWidth) {
    // Vary plank color
    const shade = Math.floor(Math.random() * 25) + 35;
    ctx.fillStyle = `rgb(${shade + 15}, ${shade + 5}, ${shade - 5})`;
    ctx.fillRect(x + 1, 0, plankWidth - 2, plankHeight);

    // Wood grain lines
    ctx.strokeStyle = `rgba(0, 0, 0, 0.3)`;
    ctx.lineWidth = 1;
    for (let i = 0; i < 8; i++) {
      const grainX = x + Math.random() * plankWidth;
      ctx.beginPath();
      ctx.moveTo(grainX, 0);
      for (let y = 0; y < 512; y += 20) {
        ctx.lineTo(grainX + Math.sin(y * 0.02) * 3, y);
      }
      ctx.stroke();
    }

    // Knots
    if (Math.random() > 0.6) {
      const knotX = x + plankWidth / 2 + (Math.random() - 0.5) * 30;
      const knotY = Math.random() * 400 + 50;
      const knotSize = Math.random() * 10 + 5;

      const gradient = ctx.createRadialGradient(
        knotX,
        knotY,
        0,
        knotX,
        knotY,
        knotSize
      );
      gradient.addColorStop(0, "#030201");
      gradient.addColorStop(0.5, "#0a0706");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.ellipse(knotX, knotY, knotSize, knotSize * 1.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Gaps between planks
    ctx.fillStyle = "#0a0605";
    ctx.fillRect(x, 0, 2, plankHeight);

    // Add highlight strips for worn areas
    ctx.fillStyle = `rgba(80, 60, 40, 0.15)`;
    ctx.fillRect(x + plankWidth / 2 - 10, 0, 20, plankHeight);
  }

  // Add scratches and wear
  ctx.strokeStyle = "rgba(0, 0, 0, 0.4)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 30; i++) {
    ctx.beginPath();
    const startX = Math.random() * 512;
    const startY = Math.random() * 512;
    ctx.moveTo(startX, startY);
    ctx.lineTo(
      startX + (Math.random() - 0.5) * 100,
      startY + (Math.random() - 0.5) * 100
    );
    ctx.stroke();
  }

  // Stains
  ctx.globalAlpha = 0.2;
  for (let i = 0; i < 5; i++) {
    const stainX = Math.random() * 512;
    const stainY = Math.random() * 512;
    const gradient = ctx.createRadialGradient(
      stainX,
      stainY,
      0,
      stainX,
      stainY,
      Math.random() * 40 + 20
    );
    gradient.addColorStop(0, "#050302");
    gradient.addColorStop(1, "transparent");
    ctx.fillStyle = gradient;
    ctx.fillRect(stainX - 50, stainY - 50, 100, 100);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(1, 10);
  return texture;
}

// Create portrait texture
export function createPortraitTexture(seed: number): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 320;
  const ctx = canvas.getContext("2d")!;

  // Random seeded function
  const seededRandom = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };

  // Dark background
  ctx.fillStyle = "#0a0805";
  ctx.fillRect(0, 0, 256, 320);

  // Creepy face silhouette
  ctx.fillStyle = "#151210";
  ctx.beginPath();
  ctx.ellipse(128, 140, 60, 80, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eyes - dark voids
  ctx.fillStyle = "#020101";
  const eyeY = 120 + seededRandom() * 20;
  ctx.beginPath();
  ctx.ellipse(100, eyeY, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(156, eyeY, 12, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Sometimes add creepy glowing eyes
  if (seededRandom() > 0.5) {
    ctx.fillStyle = "rgba(80, 20, 20, 0.5)";
    ctx.beginPath();
    ctx.arc(100, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(156, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Mouth - thin dark line or unsettling smile
  ctx.strokeStyle = "#030202";
  ctx.lineWidth = 2;
  ctx.beginPath();
  if (seededRandom() > 0.5) {
    // Creepy smile
    ctx.arc(128, 170, 25, 0.1, Math.PI - 0.1);
  } else {
    // Straight line
    ctx.moveTo(110, 180);
    ctx.lineTo(146, 180);
  }
  ctx.stroke();

  // Add cracks and aging
  ctx.strokeStyle = "rgba(30, 25, 20, 0.6)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo(seededRandom() * 256, seededRandom() * 320);
    for (let j = 0; j < 5; j++) {
      ctx.lineTo(seededRandom() * 256, seededRandom() * 320);
    }
    ctx.stroke();
  }

  // Vignette
  const gradient = ctx.createRadialGradient(128, 160, 50, 128, 160, 180);
  gradient.addColorStop(0, "transparent");
  gradient.addColorStop(1, "rgba(0, 0, 0, 0.7)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 320);

  return new THREE.CanvasTexture(canvas);
}
