import * as THREE from "three";

// Create ornate wallpaper texture
export function createWallpaperTexture(): THREE.CanvasTexture {
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
export function createWoodFloorTexture(): THREE.CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext("2d")!;

  // Dark wood base - slightly brighter
  ctx.fillStyle = "#1a1410";
  ctx.fillRect(0, 0, 512, 512);

  const plankWidth = 64;
  const plankHeight = 512;

  for (let x = 0; x < 512; x += plankWidth) {
    // Vary plank color - brighter browns
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
