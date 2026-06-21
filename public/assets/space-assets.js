import * as THREE from 'three';

const textureCache = new Map();

export function createMaterialLibrary() {
  const makeStandard = (color, options = {}) => new THREE.MeshStandardMaterial({
    color,
    roughness: options.roughness ?? 0.68,
    metalness: options.metalness ?? 0.08,
    emissive: options.emissive ?? 0x000000,
    emissiveIntensity: options.emissiveIntensity ?? 0,
    transparent: options.transparent ?? false,
    opacity: options.opacity ?? 1
  });

  return {
    stone: makeStandard(0x4a4740, { roughness: 0.82, metalness: 0.05 }),
    warmStone: makeStandard(0x6a6256, { roughness: 0.78, metalness: 0.06 }),
    darkStone: makeStandard(0x222321, { roughness: 0.72, metalness: 0.12 }),
    blackPanel: makeStandard(0x111111, { roughness: 0.54, metalness: 0.18 }),
    paper: makeStandard(0xf2f0e6, { roughness: 0.92, metalness: 0 }),
    brass: makeStandard(0xd2a74b, { roughness: 0.36, metalness: 0.48 }),
    redGlow: makeStandard(0xff6b4a, { roughness: 0.42, metalness: 0.22, emissive: 0xff6b4a, emissiveIntensity: 0.6 }),
    greenGlow: makeStandard(0x9ce37d, { roughness: 0.42, metalness: 0.22, emissive: 0x9ce37d, emissiveIntensity: 0.54 }),
    goldGlow: makeStandard(0xe7c15f, { roughness: 0.42, metalness: 0.22, emissive: 0xe7c15f, emissiveIntensity: 0.5 }),
    glass: makeStandard(0xc8d3c7, { roughness: 0.12, metalness: 0.02, transparent: true, opacity: 0.26 }),
    darkGlass: makeStandard(0x141414, { roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.48 })
  };
}

export function box(width, height, depth, material, position = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(position[0], position[1], position[2]);
  return mesh;
}

export function plane(width, height, material, position = [0, 0, 0], rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  return mesh;
}

export function lineBetween(from, to, color, opacity = 1) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  return new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: opacity < 1, opacity })
  );
}

export function createLabelTexture({
  title,
  subtitle = '',
  eyebrow = '',
  width = 1024,
  height = 256,
  color = '#f2f0e6',
  accent = '#ff6b4a',
  background = 'rgba(8, 9, 10, 0.74)',
  border = true,
  align = 'left'
}) {
  const key = JSON.stringify({ title, subtitle, eyebrow, width, height, color, accent, background, border, align });
  if (textureCache.has(key)) return textureCache.get(key);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = background;
  roundRect(ctx, 18, 18, width - 36, height - 36, 28);
  ctx.fill();
  if (border) {
    ctx.strokeStyle = accent;
    ctx.lineWidth = 5;
    ctx.stroke();
  }
  ctx.textAlign = align;
  const x = align === 'center' ? width / 2 : 66;
  if (eyebrow) {
    ctx.fillStyle = accent;
    ctx.font = '700 34px Arial, sans-serif';
    ctx.fillText(eyebrow.toUpperCase(), x, 72);
  }
  ctx.fillStyle = color;
  ctx.font = '700 58px Georgia, serif';
  ctx.fillText(title, x, eyebrow ? 144 : 112);
  if (subtitle) {
    ctx.fillStyle = '#b8b4a8';
    ctx.font = '400 30px Arial, sans-serif';
    wrapText(ctx, subtitle, align === 'center' ? width / 2 : x, eyebrow ? 198 : 168, width - 130, 38, align);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  textureCache.set(key, texture);
  return texture;
}

export function createImagePlane(textureLoader, url, width, height, options = {}) {
  const texture = textureLoader.load(url);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 8;
  const material = new THREE.MeshBasicMaterial({
    map: texture,
    toneMapped: false,
    transparent: options.opacity !== undefined,
    opacity: options.opacity ?? 1
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(width, height), material);
}

export function createLightStrip(length, color, horizontal = true) {
  const material = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.86 });
  const strip = horizontal
    ? box(length, 0.055, 0.07, material)
    : box(0.055, length, 0.07, material);
  return strip;
}

export function createGlassRail(width, materials) {
  const group = new THREE.Group();
  group.add(box(width, 0.9, 0.06, materials.glass, [0, 1.12, 0]));
  group.add(box(width + 0.2, 0.055, 0.08, materials.brass, [0, 1.6, 0.02]));
  [-width / 2, -width / 4, 0, width / 4, width / 2].forEach((x) => {
    group.add(box(0.055, 1.15, 0.08, materials.brass, [x, 0.98, 0.02]));
  });
  return group;
}

export function createArchiveStack(materials, rows = 4, cols = 5) {
  const group = new THREE.Group();
  group.add(box(cols * 0.72 + 0.22, rows * 0.42 + 0.28, 0.42, materials.blackPanel, [0, rows * 0.21 + 0.2, 0]));
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const hue = (row + col) % 3;
      const mat = hue === 0 ? materials.paper : hue === 1 ? materials.warmStone : materials.brass;
      group.add(box(0.42, 0.26, 0.11, mat, [
        -cols * 0.36 + 0.42 + col * 0.72,
        0.38 + row * 0.42,
        0.25
      ]));
    }
  }
  return group;
}

export function createMemberWall(materials, width = 5.2, height = 2.6) {
  const group = new THREE.Group();
  group.add(box(width, height, 0.12, materials.blackPanel, [0, height / 2, 0]));
  for (let row = 0; row < 4; row += 1) {
    for (let col = 0; col < 9; col += 1) {
      const tile = box(0.34, 0.34, 0.08, materials.paper, [
        -width / 2 + 0.52 + col * 0.48,
        0.48 + row * 0.48,
        0.12
      ]);
      group.add(tile);
      const dot = new THREE.Mesh(
        new THREE.CircleGeometry(0.085, 18),
        new THREE.MeshBasicMaterial({ color: row % 2 ? 0xff6b4a : 0x9ce37d, transparent: true, opacity: 0.72 })
      );
      dot.position.set(tile.position.x, tile.position.y + 0.035, 0.17);
      group.add(dot);
    }
  }
  return group;
}

export function createProcessTable(materials, width = 4) {
  const group = new THREE.Group();
  group.add(box(width, 0.12, 1.15, materials.warmStone, [0, 0.78, 0]));
  [-width / 2 + 0.28, width / 2 - 0.28].forEach((x) => {
    group.add(box(0.12, 0.78, 0.12, materials.brass, [x, 0.38, -0.42]));
    group.add(box(0.12, 0.78, 0.12, materials.brass, [x, 0.38, 0.42]));
  });
  ['PROMPT', 'CODE', 'TEST'].forEach((label, i) => {
    const card = plane(0.95, 0.5, new THREE.MeshBasicMaterial({
      map: createLabelTexture({ title: label, width: 420, height: 180, accent: '#e7c15f', align: 'center' }),
      transparent: true,
      depthWrite: false
    }), [-1.25 + i * 1.25, 1.06, -0.1], [-Math.PI / 2.9, 0, 0]);
    group.add(card);
  });
  return group;
}

export function createScaffold(materials, width = 8, height = 5.4, depth = 2.4) {
  const group = new THREE.Group();
  const railMat = materials.brass;
  const xs = [-width / 2, -width / 4, 0, width / 4, width / 2];
  const zs = [-depth / 2, depth / 2];
  xs.forEach((x) => {
    zs.forEach((z) => group.add(box(0.055, height, 0.055, railMat, [x, height / 2, z])));
  });
  for (let y = 0.7; y <= height; y += 0.9) {
    group.add(box(width, 0.05, 0.05, railMat, [0, y, -depth / 2]));
    group.add(box(width, 0.05, 0.05, railMat, [0, y, depth / 2]));
    group.add(box(0.05, 0.05, depth, railMat, [-width / 2, y, 0]));
    group.add(box(0.05, 0.05, depth, railMat, [width / 2, y, 0]));
  }
  group.add(box(width * 0.86, 0.08, depth * 0.92, materials.darkGlass, [0, 2.95, 0]));
  return group;
}

export function createRobotArm(materials) {
  const group = new THREE.Group();
  group.add(new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.56, 0.35, 32), materials.darkStone));
  const joint1 = new THREE.Mesh(new THREE.SphereGeometry(0.26, 24, 16), materials.brass);
  joint1.position.y = 0.45;
  group.add(joint1);
  const arm1 = box(0.22, 1.35, 0.22, materials.warmStone, [0.38, 1.05, 0]);
  arm1.rotation.z = -0.55;
  group.add(arm1);
  const joint2 = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), materials.brass);
  joint2.position.set(0.78, 1.66, 0);
  group.add(joint2);
  const arm2 = box(0.18, 1.15, 0.18, materials.warmStone, [1.18, 2.1, 0]);
  arm2.rotation.z = 0.72;
  group.add(arm2);
  group.add(box(0.52, 0.11, 0.11, materials.redGlow, [1.42, 2.62, 0]));
  return group;
}

export function createFloorStarMap(materials, radius = 7.2, nodeCount = 95, seed = 1) {
  const group = new THREE.Group();
  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x9ce37d, transparent: true, opacity: 0.22 });
  [radius * 0.38, radius * 0.62, radius * 0.86, radius].forEach((r) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 8, 180), ringMaterial.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.08;
    group.add(ring);
  });

  const points = [];
  let value = seed;
  const random = () => {
    value = (value * 16807) % 2147483647;
    return (value - 1) / 2147483646;
  };
  for (let i = 0; i < nodeCount; i += 1) {
    const angle = random() * Math.PI * 2;
    const r = Math.sqrt(random()) * radius;
    points.push(new THREE.Vector3(Math.cos(angle) * r, 0.12, Math.sin(angle) * r * 0.78));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  group.add(new THREE.Points(geometry, new THREE.PointsMaterial({ color: 0xe7c15f, size: 0.075, transparent: true, opacity: 0.82 })));
  for (let i = 0; i < points.length - 1; i += 6) {
    group.add(lineBetween(points[i], points[i + 1], i % 2 ? 0x9ce37d : 0xe7c15f, 0.26));
  }
  return group;
}

export function createPortalDoor(materials, label, accent = '#ff6b4a') {
  const group = new THREE.Group();
  group.add(box(3.4, 3.8, 0.25, materials.blackPanel, [0, 1.9, 0]));
  group.add(box(2.65, 2.72, 0.18, materials.darkGlass, [0, 1.7, 0.16]));
  const labelPlane = plane(2.8, 0.64, new THREE.MeshBasicMaterial({
    map: createLabelTexture({ title: label, width: 520, height: 180, accent, align: 'center' }),
    transparent: true,
    depthWrite: false
  }), [0, 3.45, 0.22]);
  group.add(labelPlane);
  group.add(createLightStrip(3.6, Number(`0x${accent.replace('#', '')}`), true));
  group.children[group.children.length - 1].position.set(0, 3.9, 0.2);
  return group;
}

export function createAtriumShell(materials, options = {}) {
  const group = new THREE.Group();
  const width = options.width ?? 24;
  const depth = options.depth ?? 19;
  const height = options.height ?? 8.8;

  group.add(box(width, 0.32, depth, materials.darkStone, [0, 0, 0]));
  group.add(box(width, height, 0.46, materials.stone, [0, height / 2, -depth / 2]));
  group.add(box(0.46, height * 0.82, depth, materials.stone, [-width / 2, height * 0.41, 0]));
  group.add(box(0.46, height * 0.82, depth, materials.stone, [width / 2, height * 0.41, 0]));
  group.add(box(width, 0.35, depth * 0.32, materials.warmStone, [0, height * 0.48, -depth * 0.18]));
  group.add(box(width, 0.28, depth * 0.26, materials.darkGlass, [0, height * 0.74, -depth * 0.12]));

  const rail = createGlassRail(width * 0.78, materials);
  rail.position.set(0, height * 0.48, -depth * 0.06);
  group.add(rail);

  [-width * 0.38, -width * 0.14, width * 0.14, width * 0.38].forEach((x) => {
    group.add(box(0.42, height * 0.78, 0.42, materials.warmStone, [x, height * 0.39, -depth * 0.44]));
  });

  const skylightRing = new THREE.Mesh(new THREE.TorusGeometry(width * 0.22, 0.045, 12, 160), materials.glass);
  skylightRing.rotation.x = Math.PI / 2;
  skylightRing.position.set(0, height * 0.92, -depth * 0.08);
  group.add(skylightRing);

  return group;
}

export function createStepStairs(materials, steps = 7, width = 7.8) {
  const group = new THREE.Group();
  for (let i = 0; i < steps; i += 1) {
    group.add(box(width - i * 0.42, 0.18, 0.56, materials.warmStone, [0, 0.09 + i * 0.18, i * 0.48]));
  }
  return group;
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight, align) {
  const words = [...text];
  let line = '';
  for (const word of words) {
    const test = line + word;
    if (ctx.measureText(test).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = word;
      y += lineHeight;
    } else {
      line = test;
    }
  }
  ctx.fillText(line, x, y);
}
