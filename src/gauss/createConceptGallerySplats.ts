import { PackedSplats, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";

type ScanTask = { count: number; emit: (index: number) => void };
type ScanResult = { mesh: SplatMesh; count: number };

const COLORS = {
  brass: new THREE.Color("#9b7440"),
  brassDark: new THREE.Color("#30261b"),
  brassLight: new THREE.Color("#b48749"),
  moss: new THREE.Color("#556a46"),
  mossDark: new THREE.Color("#1b2a1f"),
  mossLight: new THREE.Color("#758653"),
  vermilion: new THREE.Color("#cc3c1b"),
  ember: new THREE.Color("#671d10"),
  lamp: new THREE.Color("#fff0ae"),
  stone: new THREE.Color("#4a4337"),
  stoneLight: new THREE.Color("#88795d"),
  charcoal: new THREE.Color("#201d18")
} as const;

const center = new THREE.Vector3();
const scale = new THREE.Vector3();
const color = new THREE.Color();
const identity = new THREE.Quaternion();
const rotation = new THREE.Quaternion();

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function seededSigned(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function createScanBuilder(splats: PackedSplats, total: number) {
  const random = mulberry32(12082026);
  const densityScale = total / 1_000_000;
  const tasks: ScanTask[] = [];
  let planned = 0;

  const tint = (base: THREE.Color, lightness = 0.12, highlightChance = 0.006) => {
    color.copy(base).offsetHSL(
      (random() - 0.5) * 0.018,
      (random() - 0.5) * 0.055,
      (random() - 0.47) * lightness
    );
    if (random() < highlightChance) color.lerp(COLORS.lamp, 0.4 + random() * 0.36);
  };

  const push = (
    opacity: number,
    base: THREE.Color,
    size: number,
    quaternion = identity,
    lightness = 0.12,
    highlightChance = 0.006,
    stretch?: THREE.Vector3
  ) => {
    tint(base, lightness, highlightChance);
    const variance = 0.72 + random() * 0.56;
    if (stretch) {
      scale.set(stretch.x * variance, stretch.y * variance, stretch.z * variance);
    } else {
      const radius = size * variance;
      scale.set(radius * (0.82 + random() * 0.3), radius * (0.82 + random() * 0.3), radius * (0.82 + random() * 0.3));
    }
    splats.pushSplat(center, scale, quaternion, opacity * (0.78 + random() * 0.22), color);
  };

  const task = (count: number, emit: (index: number) => void) => {
    const safeCount = Math.max(0, Math.floor(count * densityScale));
    planned += safeCount;
    tasks.push({ count: safeCount, emit });
  };

  const line = (options: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    radius?: number;
    pointScale?: number;
    highlightChance?: number;
  }) => {
    const delta = options.to.clone().sub(options.from);
    task(options.count, () => {
      center.copy(options.from).addScaledVector(delta, random());
      const radius = options.radius ?? 0.018;
      center.x += (random() - 0.5) * radius;
      center.y += (random() - 0.5) * radius;
      center.z += (random() - 0.5) * radius;
      push(options.opacity ?? 0.55, options.base, options.pointScale ?? 0.004, identity, 0.1, options.highlightChance ?? 0.004);
    });
  };

  const plane = (options: {
    origin: THREE.Vector3;
    axisU: THREE.Vector3;
    axisV: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity: number;
    pointScale: number;
    jitter?: number;
    gaps?: number;
    highlightChance?: number;
  }) => task(options.count, () => {
    center.copy(options.origin)
      .addScaledVector(options.axisU, random())
      .addScaledVector(options.axisV, random());
    const jitter = options.jitter ?? 0.028;
    center.x += (random() - 0.5) * jitter;
    center.y += (random() - 0.5) * jitter;
    center.z += (random() - 0.5) * jitter;
    const faded = random() < (options.gaps ?? 0.14) ? 0.08 + random() * 0.18 : 1;
    push(options.opacity * faded, options.base, options.pointScale, identity, 0.13, options.highlightChance ?? 0.005);
  });

  const box = (options: {
    at: THREE.Vector3;
    size: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    pointScale?: number;
    gaps?: number;
    highlightChance?: number;
  }) => {
    const { x: width, y: height, z: depth } = options.size;
    const areas = [width * height, width * height, depth * height, depth * height, width * depth, width * depth];
    const areaTotal = areas.reduce((sum, area) => sum + area, 0);
    task(options.count, () => {
      let roll = random() * areaTotal;
      let face = 0;
      while (face < areas.length - 1 && roll > areas[face]) {
        roll -= areas[face];
        face += 1;
      }
      let x = (random() - 0.5) * width;
      let y = (random() - 0.5) * height;
      let z = (random() - 0.5) * depth;
      if (face === 0) z = -depth / 2;
      if (face === 1) z = depth / 2;
      if (face === 2) x = -width / 2;
      if (face === 3) x = width / 2;
      if (face === 4) y = -height / 2;
      if (face === 5) y = height / 2;
      center.set(options.at.x + x, options.at.y + y, options.at.z + z);
      const faded = random() < (options.gaps ?? 0.16) ? 0.08 + random() * 0.16 : 1;
      push((options.opacity ?? 0.42) * faded, options.base, options.pointScale ?? 0.0042, identity, 0.14, options.highlightChance ?? 0.005);
    });
  };

  const cloud = (options: {
    at: THREE.Vector3;
    radius: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    pointScale?: number;
    shell?: boolean;
    highlightChance?: number;
  }) => task(options.count, () => {
    const phi = Math.acos(1 - 2 * random());
    const theta = random() * Math.PI * 2;
    const radial = options.shell ? 0.65 + random() * 0.35 : Math.cbrt(random());
    center.set(
      options.at.x + Math.sin(phi) * Math.cos(theta) * options.radius.x * radial,
      options.at.y + Math.cos(phi) * options.radius.y * radial,
      options.at.z + Math.sin(phi) * Math.sin(theta) * options.radius.z * radial
    );
    push(options.opacity ?? 0.38, options.base, options.pointScale ?? 0.004, identity, 0.16, options.highlightChance ?? 0.004);
  });

  const disk = (options: {
    at: THREE.Vector3;
    radius: number;
    height: number;
    count: number;
    base: THREE.Color;
    opacity?: number;
    pointScale?: number;
  }) => task(options.count, () => {
    const angle = random() * Math.PI * 2;
    const side = random() < 0.42;
    const radius = side ? options.radius + (random() - 0.5) * 0.045 : Math.sqrt(random()) * options.radius;
    center.set(
      options.at.x + Math.cos(angle) * radius,
      options.at.y + (side ? random() * options.height : (random() < 0.5 ? 0 : options.height)),
      options.at.z + Math.sin(angle) * radius
    );
    push(options.opacity ?? 0.42, options.base, options.pointScale ?? 0.0045, identity, 0.12, 0.004);
  });

  const architectureFrame = (side: -1 | 1) => {
    const base = side < 0 ? COLORS.brass : COLORS.moss;
    const dark = side < 0 ? COLORS.brassDark : COLORS.mossDark;
    const light = side < 0 ? COLORS.brassLight : COLORS.mossLight;
    const inner = side * 3.7;
    const outer = side * 14.1;
    const x = side * 8.9;
    const frontZ = -8.7;

    // Deep, broken stone fields sit behind the colored scan so the pavilions feel inhabited.
    plane({
      origin: new THREE.Vector3(side < 0 ? outer + 0.55 : inner + 0.55, 0.35, frontZ - 0.68),
      axisU: new THREE.Vector3(side * -9.25, 0, 0),
      axisV: new THREE.Vector3(0, 9.9, 0),
      count: 44_000,
      base: COLORS.stone,
      opacity: 0.38,
      pointScale: 0.006,
      gaps: 0.34,
      highlightChance: side < 0 ? 0.02 : 0.009
    });

    // Broad scanned masonry masses; the small point radius preserves surface grain.
    box({ at: new THREE.Vector3(inner, 6.1, frontZ), size: new THREE.Vector3(0.62, 12.2, 1.1), count: 22_000, base, opacity: 0.76, pointScale: 0.0092, gaps: 0.12, highlightChance: 0.012 });
    box({ at: new THREE.Vector3(outer, 6.1, frontZ), size: new THREE.Vector3(0.72, 12.2, 1.2), count: 22_000, base: dark, opacity: 0.68, pointScale: 0.0092, gaps: 0.2 });
    box({ at: new THREE.Vector3(x, 11.85, frontZ), size: new THREE.Vector3(11, 0.72, 1.2), count: 25_000, base, opacity: 0.76, pointScale: 0.0092, gaps: 0.12, highlightChance: 0.012 });

    // Receding inner frames create the deep halls visible in the target image.
    [0, 3.9, 8.2, 12.8].forEach((depth, index) => {
      const inset = 0.9 + index * 0.22;
      const z = frontZ - depth;
      const leftX = side < 0 ? outer + inset : inner + inset;
      const rightX = side < 0 ? inner - inset : outer - inset;
      const midX = (leftX + rightX) / 2;
      const width = Math.abs(rightX - leftX);
      const frameColor = index === 0 ? base : dark;
      box({ at: new THREE.Vector3(leftX, 5.45, z), size: new THREE.Vector3(0.42, 10.9, 0.62), count: 8_500, base: frameColor, opacity: 0.64, pointScale: 0.0082, gaps: 0.2 });
      box({ at: new THREE.Vector3(rightX, 5.45, z), size: new THREE.Vector3(0.42, 10.9, 0.62), count: 8_500, base: frameColor, opacity: 0.64, pointScale: 0.0082, gaps: 0.2 });
      box({ at: new THREE.Vector3(midX, 10.45, z), size: new THREE.Vector3(width, 0.45, 0.62), count: 9_500, base: frameColor, opacity: 0.64, pointScale: 0.0082, gaps: 0.2 });
    });

    // Side and ceiling fragments prevent the rooms reading as isolated colored boxes.
    plane({
      origin: new THREE.Vector3(side < 0 ? -14.45 : 3.35, 0.3, frontZ - 0.4),
      axisU: new THREE.Vector3(0, 11.5, 0),
      axisV: new THREE.Vector3(0, 0, -17.5),
      count: 34_000,
      base: dark,
      opacity: 0.44,
      pointScale: 0.007,
      gaps: 0.35,
      highlightChance: 0.003
    });
    plane({
      origin: new THREE.Vector3(side < 0 ? -14.2 : 3.7, 11.55, frontZ - 0.3),
      axisU: new THREE.Vector3(side * 10.5, 0, 0),
      axisV: new THREE.Vector3(0, 0, -15.8),
      count: 31_000,
      base: dark,
      opacity: 0.38,
      pointScale: 0.0065,
      gaps: 0.4
    });

    // Stone approach and worn stair edges.
    for (let step = 0; step < 6; step += 1) {
      box({
        at: new THREE.Vector3(x, 0.08 + step * 0.12, -6.35 - step * 0.52),
        size: new THREE.Vector3(7.4 - step * 0.18, 0.17, 0.7),
        count: 3_400,
        base: step % 2 === 0 ? COLORS.stoneLight : dark,
        opacity: 0.38,
        pointScale: 0.0036,
        gaps: 0.12,
        highlightChance: 0.009
      });
    }
    plane({ origin: new THREE.Vector3(x - 3.55, 0.12, -6.15), axisU: new THREE.Vector3(7.1, 0, 0), axisV: new THREE.Vector3(0, 0, -5.8), count: 22_000, base: COLORS.stoneLight, opacity: 0.4, pointScale: 0.0052, jitter: 0.012, gaps: 0.2, highlightChance: 0.018 });
    plane({ origin: new THREE.Vector3(x - 3.7, 0.82, -9.3), axisU: new THREE.Vector3(7.4, 0, 0), axisV: new THREE.Vector3(0, 0, -12), count: 26_000, base: dark, opacity: 0.24, pointScale: 0.0031, gaps: 0.24 });

    // Fine doorway contour catches only a fraction of the scan as warm/cool highlights.
    const frameLines = [
      [new THREE.Vector3(inner, 0.15, frontZ + 0.62), new THREE.Vector3(inner, 11.6, frontZ + 0.62)],
      [new THREE.Vector3(outer, 0.15, frontZ + 0.62), new THREE.Vector3(outer, 11.6, frontZ + 0.62)],
      [new THREE.Vector3(inner, 11.6, frontZ + 0.62), new THREE.Vector3(outer, 11.6, frontZ + 0.62)]
    ] as const;
    frameLines.forEach(([from, to]) => line({ from, to, count: 1_250, base: light, opacity: 0.54, radius: 0.014, pointScale: 0.0036, highlightChance: 0.018 }));

    // Vertical LiDAR streaks break up the planar faces and imitate incomplete scan passes.
    for (let streak = 0; streak < 96; streak += 1) {
      const sx = side < 0
        ? outer + 0.45 + random() * (Math.abs(inner - outer) - 0.9)
        : inner + 0.45 + random() * (Math.abs(outer - inner) - 0.9);
      const startY = random() * 2.2;
      const endY = 4.2 + random() * 7.1;
      const z = frontZ + 0.58 + (random() - 0.5) * 0.06;
      line({ from: new THREE.Vector3(sx, startY, z), to: new THREE.Vector3(sx + (random() - 0.5) * 0.035, endY, z), count: 115, base: random() < 0.14 ? light : base, opacity: 0.38 + random() * 0.22, radius: 0.006, pointScale: 0.0044, highlightChance: 0.008 });
    }
  };

  // Near-black wet stone with clustered scan returns instead of a flat star field.
  plane({ origin: new THREE.Vector3(-15, -0.01, 7), axisU: new THREE.Vector3(30, 0, 0), axisV: new THREE.Vector3(0, 0, -40), count: 150_000, base: COLORS.charcoal, opacity: 0.52, pointScale: 0.004, jitter: 0.014, gaps: 0.12, highlightChance: 0.004 });
  plane({ origin: new THREE.Vector3(-15, 0.005, 6), axisU: new THREE.Vector3(15, 0, 0), axisV: new THREE.Vector3(0, 0, -33), count: 40_000, base: COLORS.brassDark, opacity: 0.22, pointScale: 0.0022, jitter: 0.012, gaps: 0.26 });
  plane({ origin: new THREE.Vector3(0, 0.006, 6), axisU: new THREE.Vector3(15, 0, 0), axisV: new THREE.Vector3(0, 0, -33), count: 40_000, base: COLORS.mossDark, opacity: 0.2, pointScale: 0.0022, jitter: 0.012, gaps: 0.26 });

  architectureFrame(-1);
  architectureFrame(1);

  // Thin reflected scan streaks make the floor read as wet stone.
  task(58_000, () => {
    const selector = random();
    let reflectionColor: THREE.Color = COLORS.stoneLight;
    let focusX = (random() - 0.5) * 18;
    if (selector < 0.38) {
      reflectionColor = COLORS.brass;
      focusX = -8.8 + seededSigned(Math.floor(random() * 5000)) * 4.4;
    } else if (selector < 0.68) {
      reflectionColor = COLORS.moss;
      focusX = 8.8 + seededSigned(Math.floor(random() * 5000)) * 4.4;
    } else if (selector < 0.84) {
      reflectionColor = COLORS.ember;
      focusX = seededSigned(Math.floor(random() * 5000)) * 2.3;
    }
    const z = 5.2 - Math.pow(random(), 0.72) * 17.5;
    center.set(focusX + (random() - 0.5) * 0.32, 0.018 + random() * 0.012, z);
    push(0.1 + random() * 0.18, reflectionColor, 0.002, identity, 0.1, 0.006, new THREE.Vector3(0.008 + random() * 0.02, 0.0012, 0.035 + random() * 0.11));
  });

  // Central plinth is broad, dark, and only lightly edged in red.
  disk({ at: new THREE.Vector3(0, 0.02, -7.55), radius: 3.0, height: 0.42, count: 24_000, base: COLORS.stone, opacity: 0.46, pointScale: 0.004 });
  disk({ at: new THREE.Vector3(0, 0.43, -7.55), radius: 2.42, height: 0.18, count: 11_000, base: COLORS.ember, opacity: 0.38, pointScale: 0.0035 });

  // Fragmented archive monolith: many thin rails, broken planes, and vertical data traces.
  const towerCenter = new THREE.Vector3(0, 0, -7.55);
  const levels = [
    [4.1, 2.6, 0.62, 1.15, 0.04],
    [3.5, 3.3, 1.55, 1.05, 0.45],
    [4.45, 2.15, 2.58, 1.18, -0.31],
    [3.0, 3.45, 3.66, 1.28, 0.55],
    [2.55, 2.15, 4.82, 1.3, -0.22],
    [1.9, 2.7, 6.0, 1.35, 0.34],
    [1.35, 1.5, 7.22, 4.25, -0.12]
  ] as const;
  levels.forEach(([width, depth, bottom, height, yaw], levelIndex) => {
    const corners = [
      new THREE.Vector3(-width / 2, bottom, -depth / 2),
      new THREE.Vector3(width / 2, bottom, -depth / 2),
      new THREE.Vector3(width / 2, bottom, depth / 2),
      new THREE.Vector3(-width / 2, bottom, depth / 2)
    ].map((point) => point.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(towerCenter));
    const top = corners.map((point) => point.clone().add(new THREE.Vector3(0, height, 0)));
    for (let edge = 0; edge < 4; edge += 1) {
      const next = (edge + 1) % 4;
      line({ from: corners[edge], to: corners[next], count: 740, base: COLORS.vermilion, opacity: 0.68, radius: 0.014, pointScale: 0.0058, highlightChance: 0.006 });
      line({ from: top[edge], to: top[next], count: 740, base: COLORS.vermilion, opacity: 0.68, radius: 0.014, pointScale: 0.0058, highlightChance: 0.006 });
      line({ from: corners[edge], to: top[edge], count: 620, base: COLORS.vermilion, opacity: 0.64, radius: 0.012, pointScale: 0.0054, highlightChance: 0.005 });
    }
    plane({
      origin: new THREE.Vector3(-width * 0.4, bottom + 0.08, towerCenter.z + (levelIndex % 2 ? -0.18 : 0.12)),
      axisU: new THREE.Vector3(width * 0.8, 0, 0),
      axisV: new THREE.Vector3(0, height * 0.88, 0),
      count: 2_800,
      base: COLORS.ember,
      opacity: 0.22,
      pointScale: 0.0027,
      jitter: 0.022,
      gaps: 0.58,
      highlightChance: 0.004
    });
  });
  for (let strand = 0; strand < 88; strand += 1) {
    const x = seededSigned(strand * 71) * (1.15 + (strand % 6) * 0.14);
    const z = towerCenter.z + seededSigned(strand * 113 + 17) * 1.55;
    const start = 0.55 + (strand % 8) * 0.17;
    const end = 5.1 + (strand % 13) * 0.34;
    line({
      from: new THREE.Vector3(x, start, z),
      to: new THREE.Vector3(x + seededSigned(strand + 4) * 0.1, end, z + seededSigned(strand + 33) * 0.1),
      count: 410,
      base: strand % 11 === 0 ? COLORS.brassLight : COLORS.vermilion,
      opacity: strand % 11 === 0 ? 0.5 : 0.4,
      radius: 0.01,
      pointScale: 0.0048,
      highlightChance: 0.004
    });
  }
  for (let rail = 0; rail < 38; rail += 1) {
    const y = 0.9 + rail * 0.22;
    const half = 1.0 + (rail % 7) * 0.18;
    const z = towerCenter.z + seededSigned(rail * 43) * 1.2;
    line({ from: new THREE.Vector3(-half, y, z), to: new THREE.Vector3(half, y + seededSigned(rail) * 0.12, z + seededSigned(rail + 8) * 0.24), count: 260, base: COLORS.vermilion, opacity: 0.52, radius: 0.012, pointScale: 0.0046 });
  }

  // Right-hand constellation sits deep inside the pavilion.
  const nodeRandom = mulberry32(30912026);
  const nodes = Array.from({ length: 42 }, (_, index) => {
    const angle = nodeRandom() * Math.PI * 2;
    const radius = 0.45 + Math.sqrt(nodeRandom()) * 3.4;
    return new THREE.Vector3(9.0 + Math.cos(angle) * radius, 4.7 + Math.sin(angle) * radius * 0.75, -11.9 - nodeRandom() * 1.7 + (index % 3) * 0.12);
  });
  nodes.forEach((node, index) => {
    const nearest = nodes
      .map((other, otherIndex) => ({ other, otherIndex, distance: node.distanceToSquared(other) }))
      .filter(({ otherIndex }) => otherIndex > index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, index % 5 === 0 ? 3 : 2);
    nearest.forEach(({ other }) => line({ from: node, to: other, count: 230, base: COLORS.mossLight, opacity: 0.43, radius: 0.01, pointScale: 0.0026, highlightChance: 0.026 }));
    cloud({ at: node, radius: new THREE.Vector3(0.045, 0.045, 0.045), count: 120, base: index % 4 === 0 ? COLORS.lamp : COLORS.mossLight, opacity: 0.76, pointScale: index % 4 === 0 ? 0.0048 : 0.0034, highlightChance: 0.08 });
  });

  // Archive text slab and fine horizontal returns in the warm pavilion.
  plane({ origin: new THREE.Vector3(-11.3, 2.0, -11.65), axisU: new THREE.Vector3(2.05, 0, 0), axisV: new THREE.Vector3(0, 4.8, 0), count: 5_800, base: COLORS.brassDark, opacity: 0.32, pointScale: 0.003, gaps: 0.28, highlightChance: 0.008 });
  for (let row = 0; row < 24; row += 1) {
    const width = 0.65 + (row % 6) * 0.18;
    line({ from: new THREE.Vector3(-11.1, 6.35 - row * 0.16, -11.55), to: new THREE.Vector3(-11.1 + width, 6.35 - row * 0.16, -11.55), count: 95, base: row % 7 === 0 ? COLORS.lamp : COLORS.brassLight, opacity: 0.52, radius: 0.008, pointScale: 0.0028, highlightChance: 0.03 });
  }

  // Small lamps and pale planting fragments create the inhabited courtyard scale.
  const lamps = [
    [-4.5, 1.4], [-2.7, -0.8], [-5.1, -3.4], [-3.2, -6.0], [-5.6, -9.0], [-7.0, -5.6], [-8.8, -7.2],
    [4.5, 1.4], [2.7, -0.8], [5.1, -3.4], [3.2, -6.0], [5.6, -9.0], [7.0, -5.6], [8.8, -7.2]
  ];
  lamps.forEach(([x, z]) => {
    line({ from: new THREE.Vector3(x, 0.02, z), to: new THREE.Vector3(x, 0.58, z), count: 92, base: COLORS.stoneLight, opacity: 0.42, radius: 0.015, pointScale: 0.003 });
    cloud({ at: new THREE.Vector3(x, 0.62, z), radius: new THREE.Vector3(0.04, 0.04, 0.04), count: 84, base: COLORS.lamp, opacity: 0.86, pointScale: 0.0042, highlightChance: 0.16 });
  });

  const plants = [
    [-13.0, -4.7], [-12.6, -9.8], [-5.0, -9.6], [-11.5, -16],
    [13.0, -4.7], [12.6, -9.8], [5.0, -9.6], [11.5, -16]
  ];
  plants.forEach(([x, z], index) => {
    const base = x < 0 ? COLORS.brassLight : COLORS.mossLight;
    cloud({ at: new THREE.Vector3(x, 0.8 + (index % 2) * 0.18, z), radius: new THREE.Vector3(0.72, 1.2, 0.64), count: 1_650, base, opacity: 0.28, pointScale: 0.0033, shell: true, highlightChance: 0.008 });
    for (let branch = 0; branch < 9; branch += 1) {
      line({ from: new THREE.Vector3(x, 0.08, z), to: new THREE.Vector3(x + seededSigned(index * 20 + branch) * 0.6, 0.45 + branch * 0.14, z + seededSigned(index * 31 + branch) * 0.55), count: 84, base, opacity: 0.3, radius: 0.012, pointScale: 0.0028 });
    }
  });

  // Residual returns cling to architectural boundaries, never filling the scene as uniform noise.
  const ambientCount = Math.max(0, total - planned);
  planned += ambientCount;
  tasks.push({ count: ambientCount, emit: () => {
    const side = random() < 0.5 ? -1 : 1;
    const wallBias = Math.pow(random(), 0.38);
    center.set(side * (3.4 + wallBias * 11.2), 0.2 + random() * 10.2, 4 - random() * 31);
    const base = side < 0 ? COLORS.brassDark : COLORS.mossDark;
    push(0.06 + wallBias * 0.12, base, 0.0024 + random() * 0.0018, identity, 0.14, 0.002);
  } });

  return { tasks };
}

export function createConceptGallerySplats(mobile: boolean, onProgress?: (progress: number) => void): ScanResult {
  const count = mobile ? 520_000 : 1_000_000;
  const packedSplats = new PackedSplats({
    maxSplats: count,
    construct: (splats) => {
      const { tasks } = createScanBuilder(splats, count);
      const plannedCount = tasks.reduce((sum, scanTask) => sum + scanTask.count, 0);
      const budgetScale = Math.min(1, count / Math.max(1, plannedCount));
      let emitted = 0;
      for (const scanTask of tasks) {
        const taskBudget = Math.min(count - emitted, Math.floor(scanTask.count * budgetScale));
        for (let index = 0; index < taskBudget; index += 1) scanTask.emit(index);
        emitted += taskBudget;
        onProgress?.(Math.min(1, emitted / count));
        if (emitted >= count) break;
      }
      const finalTask = tasks.at(-1);
      while (finalTask && emitted < count) {
        finalTask.emit(emitted);
        emitted += 1;
      }
      onProgress?.(1);
    }
  });
  const mesh = new SplatMesh({ packedSplats });
  mesh.name = "gauss-archive-cinematic-million-scan";
  return { mesh, count };
}
