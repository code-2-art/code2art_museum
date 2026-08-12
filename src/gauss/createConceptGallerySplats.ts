import { PackedSplats, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";

type ScanTask = {
  count: number;
  emit: (index: number) => void;
};

type ScanResult = {
  mesh: SplatMesh;
  count: number;
};

const COLORS = {
  gold: new THREE.Color("#c39452"),
  deepGold: new THREE.Color("#70502e"),
  green: new THREE.Color("#6f9d5d"),
  deepGreen: new THREE.Color("#345d3b"),
  vermilion: new THREE.Color("#ef4d24"),
  ember: new THREE.Color("#9d2818"),
  paper: new THREE.Color("#fff1c2"),
  stone: new THREE.Color("#574a38"),
  charcoal: new THREE.Color("#211d17")
} as const;

const center = new THREE.Vector3();
const scale = new THREE.Vector3();
const color = new THREE.Color();
const identity = new THREE.Quaternion();
const quaternion = new THREE.Quaternion();
const direction = new THREE.Vector3();

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function createScanBuilder(splats: PackedSplats, total: number) {
  const random = mulberry32(22082026);
  const densityScale = total / 1_000_000;
  const tasks: ScanTask[] = [];
  let planned = 0;

  const varyColor = (base: THREE.Color, lightness = 0.18, paperChance = 0.015) => {
    color.copy(base).offsetHSL(
      (random() - 0.5) * 0.025,
      (random() - 0.5) * 0.08,
      0.045 + (random() - 0.5) * lightness
    );
    if (random() < paperChance) color.lerp(COLORS.paper, 0.62 + random() * 0.28);
  };

  const emit = (opacity: number, base: THREE.Color, pointScale: number, rotation = identity, lightness = 0.18, paperChance = 0.015) => {
    varyColor(base, lightness, paperChance);
    const size = pointScale * 1.22 * (0.65 + random() * 0.8);
    scale.set(size * (0.78 + random() * 0.44), size * (0.78 + random() * 0.44), size * (0.78 + random() * 0.44));
    splats.pushSplat(center, scale, rotation, opacity * (0.72 + random() * 0.28), color);
  };

  const task = (count: number, taskEmitter: (index: number) => void) => {
    const safeCount = Math.max(0, Math.floor(count * densityScale));
    planned += safeCount;
    tasks.push({ count: safeCount, emit: taskEmitter });
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
    lightness?: number;
    paperChance?: number;
  }) => task(options.count, () => {
    const u = random();
    const v = random();
    center.copy(options.origin)
      .addScaledVector(options.axisU, u)
      .addScaledVector(options.axisV, v);
    const jitter = options.jitter ?? 0.035;
    center.x += (random() - 0.5) * jitter;
    center.y += (random() - 0.5) * jitter;
    center.z += (random() - 0.5) * jitter;
    const gapFade = random() < (options.gaps ?? 0.08) ? 0.24 : 1;
    emit(options.opacity * gapFade, options.base, options.pointScale, identity, options.lightness, options.paperChance);
  });

  const box = (options: {
    at: THREE.Vector3;
    size: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    pointScale?: number;
    yaw?: number;
    gaps?: number;
    paperChance?: number;
  }) => {
    const { x: width, y: height, z: depth } = options.size;
    const areas = [width * height, width * height, depth * height, depth * height, width * depth, width * depth];
    const areaTotal = areas.reduce((sum, area) => sum + area, 0);
    const yaw = options.yaw ?? 0;
    const cos = Math.cos(yaw);
    const sin = Math.sin(yaw);
    quaternion.setFromEuler(new THREE.Euler(0, yaw, 0));
    task(options.count, () => {
      let faceRoll = random() * areaTotal;
      let face = 0;
      while (face < areas.length - 1 && faceRoll > areas[face]) {
        faceRoll -= areas[face];
        face += 1;
      }
      let localX = (random() - 0.5) * width;
      let localY = (random() - 0.5) * height;
      let localZ = (random() - 0.5) * depth;
      if (face === 0) localZ = -depth / 2;
      if (face === 1) localZ = depth / 2;
      if (face === 2) localX = -width / 2;
      if (face === 3) localX = width / 2;
      if (face === 4) localY = -height / 2;
      if (face === 5) localY = height / 2;
      const normalJitter = 0.045;
      localX += (random() - 0.5) * normalJitter;
      localY += (random() - 0.5) * normalJitter;
      localZ += (random() - 0.5) * normalJitter;
      center.set(
        options.at.x + localX * cos + localZ * sin,
        options.at.y + localY,
        options.at.z - localX * sin + localZ * cos
      );
      const gapFade = random() < (options.gaps ?? 0.1) ? 0.18 : 1;
      emit((options.opacity ?? 0.66) * gapFade, options.base, options.pointScale ?? 0.018, quaternion, 0.2, options.paperChance);
    });
  };

  const line = (options: {
    from: THREE.Vector3;
    to: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    radius?: number;
    pointScale?: number;
    paperChance?: number;
  }) => {
    direction.copy(options.to).sub(options.from);
    const lineDirection = direction.clone();
    task(options.count, () => {
      center.copy(options.from).addScaledVector(lineDirection, random());
      const radius = options.radius ?? 0.035;
      center.x += (random() - 0.5) * radius;
      center.y += (random() - 0.5) * radius;
      center.z += (random() - 0.5) * radius;
      emit(options.opacity ?? 0.78, options.base, options.pointScale ?? 0.014, identity, 0.16, options.paperChance);
    });
  };

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
    const chooseSide = random() < 0.5;
    const radius = chooseSide ? options.radius + (random() - 0.5) * 0.08 : Math.sqrt(random()) * options.radius;
    center.set(
      options.at.x + Math.cos(angle) * radius,
      options.at.y + (chooseSide ? random() * options.height : (random() < 0.5 ? 0 : options.height)),
      options.at.z + Math.sin(angle) * radius
    );
    emit(options.opacity ?? 0.64, options.base, options.pointScale ?? 0.016, identity, 0.2, 0.02);
  });

  const cloud = (options: {
    at: THREE.Vector3;
    radius: THREE.Vector3;
    count: number;
    base: THREE.Color;
    opacity?: number;
    pointScale?: number;
    shell?: boolean;
    paperChance?: number;
  }) => task(options.count, () => {
    const phi = Math.acos(1 - 2 * random());
    const theta = random() * Math.PI * 2;
    const radial = options.shell ? 0.72 + random() * 0.28 : Math.cbrt(random());
    center.set(
      options.at.x + Math.sin(phi) * Math.cos(theta) * options.radius.x * radial,
      options.at.y + Math.cos(phi) * options.radius.y * radial,
      options.at.z + Math.sin(phi) * Math.sin(theta) * options.radius.z * radial
    );
    emit(options.opacity ?? 0.54, options.base, options.pointScale ?? 0.014, identity, 0.24, options.paperChance);
  });

  const pavilion = (side: -1 | 1) => {
    const base = side < 0 ? COLORS.gold : COLORS.green;
    const deep = side < 0 ? COLORS.deepGold : COLORS.deepGreen;
    const x = side * 9.4;
    const innerEdge = side * 4.2;
    const outerEdge = side * 14.6;
    const hallZ = (value: number) => value + 3.6;

    // Monumental portal, ceiling, side wall, and a second frame establish real architectural depth.
    box({ at: new THREE.Vector3(innerEdge, 5.2, hallZ(-17)), size: new THREE.Vector3(0.65, 10.4, 1.15), count: 15_000, base, pointScale: 0.016 });
    box({ at: new THREE.Vector3(outerEdge, 5.2, hallZ(-17)), size: new THREE.Vector3(0.65, 10.4, 1.15), count: 15_000, base, pointScale: 0.016 });
    box({ at: new THREE.Vector3(x, 10.05, hallZ(-17)), size: new THREE.Vector3(11.1, 0.72, 1.2), count: 17_000, base, pointScale: 0.017 });
    box({ at: new THREE.Vector3(x, 10.7, hallZ(-23)), size: new THREE.Vector3(11.2, 0.58, 11.5), count: 18_000, base: deep, pointScale: 0.017 });
    box({ at: new THREE.Vector3(outerEdge, 5.1, hallZ(-23)), size: new THREE.Vector3(0.56, 10.2, 12), count: 24_000, base: deep, pointScale: 0.016, gaps: 0.2 });

    box({ at: new THREE.Vector3(side * 5.7, 4.35, hallZ(-22.6)), size: new THREE.Vector3(0.45, 8.7, 0.65), count: 9_000, base, pointScale: 0.014 });
    box({ at: new THREE.Vector3(side * 12.8, 4.35, hallZ(-22.6)), size: new THREE.Vector3(0.45, 8.7, 0.65), count: 9_000, base, pointScale: 0.014 });
    box({ at: new THREE.Vector3(x, 8.45, hallZ(-22.6)), size: new THREE.Vector3(7.5, 0.46, 0.72), count: 9_000, base, pointScale: 0.014 });

    [20, 26, 32].forEach((depth, index) => {
      box({ at: new THREE.Vector3(side * 6.2, 4, hallZ(-depth)), size: new THREE.Vector3(0.35, 8, 0.5), count: 5_500, base: index === 0 ? base : deep, pointScale: 0.013 });
      box({ at: new THREE.Vector3(side * 12.4, 4, hallZ(-depth)), size: new THREE.Vector3(0.35, 8, 0.5), count: 5_500, base: index === 0 ? base : deep, pointScale: 0.013 });
      box({ at: new THREE.Vector3(x, 7.8, hallZ(-depth)), size: new THREE.Vector3(6.5, 0.36, 0.55), count: 5_500, base: index === 0 ? base : deep, pointScale: 0.013 });
    });

    // Raised dais and six stairs make each side read as an inhabitable room.
    for (let stepIndex = 0; stepIndex < 6; stepIndex += 1) {
      box({
        at: new THREE.Vector3(x, 0.12 + stepIndex * 0.13, hallZ(-14.1 - stepIndex * 0.55)),
        size: new THREE.Vector3(7.5 - stepIndex * 0.16, 0.22, 0.72),
        count: 2_500,
        base: indexColor(base, COLORS.stone, stepIndex / 11),
        opacity: 0.58,
        pointScale: 0.015,
        gaps: 0.04
      });
    }
    box({ at: new THREE.Vector3(x, 0.92, hallZ(-20.2)), size: new THREE.Vector3(8.1, 0.3, 8.6), count: 19_000, base: deep, opacity: 0.48, pointScale: 0.014, gaps: 0.08 });

    // Interior scan fragments: side walls, a rear platform, benches, and slender trees.
    plane({
      origin: new THREE.Vector3(side < 0 ? -14.15 : 4.15, 0.35, hallZ(-15.2)),
      axisU: new THREE.Vector3(9.9, 0, 0),
      axisV: new THREE.Vector3(0, 8.9, 0),
      count: 18_000,
      base: deep,
      opacity: 0.3,
      pointScale: 0.01,
      gaps: 0.46,
      paperChance: 0.018
    });
    box({ at: new THREE.Vector3(x, 1.18, hallZ(-24.2)), size: new THREE.Vector3(6.2, 0.42, 2.6), count: 10_000, base, opacity: 0.44, pointScale: 0.011, gaps: 0.18 });
    box({ at: new THREE.Vector3(x, 1.72, hallZ(-25.2)), size: new THREE.Vector3(4.8, 0.3, 0.7), count: 4_000, base: COLORS.stone, opacity: 0.55, pointScale: 0.01, gaps: 0.1, paperChance: 0.035 });
    [-2.7, -1.3, 1.3, 2.7].forEach((offset, treeIndex) => {
      const treeX = x + offset;
      line({ from: new THREE.Vector3(treeX, 1.2, hallZ(-26.2)), to: new THREE.Vector3(treeX + side * 0.16, 4.2 + (treeIndex % 2) * 0.5, hallZ(-26.2)), count: 420, base: COLORS.stone, opacity: 0.6, radius: 0.05, pointScale: 0.009 });
      cloud({ at: new THREE.Vector3(treeX, 4.15 + (treeIndex % 2) * 0.45, hallZ(-26.2)), radius: new THREE.Vector3(0.55, 1.15, 0.55), count: 1_500, base, opacity: 0.38, pointScale: 0.009, shell: true, paperChance: 0.018 });
    });
  };

  const indexColor = (a: THREE.Color, b: THREE.Color, amount: number) => a.clone().lerp(b, amount);

  // Ground is organized as broad reflective scan bands rather than uniform noise.
  plane({ origin: new THREE.Vector3(-15, 0, 7), axisU: new THREE.Vector3(30, 0, 0), axisV: new THREE.Vector3(0, 0, -45), count: 136_000, base: COLORS.stone, opacity: 0.34, pointScale: 0.0042, jitter: 0.02, gaps: 0.08, paperChance: 0.11 });
  plane({ origin: new THREE.Vector3(-14.5, 0.018, 4), axisU: new THREE.Vector3(13.5, 0, 0), axisV: new THREE.Vector3(0, 0, -39), count: 31_000, base: COLORS.deepGold, opacity: 0.25, pointScale: 0.0034, gaps: 0.18 });
  plane({ origin: new THREE.Vector3(1, 0.022, 4), axisU: new THREE.Vector3(13.5, 0, 0), axisV: new THREE.Vector3(0, 0, -39), count: 31_000, base: COLORS.deepGreen, opacity: 0.23, pointScale: 0.0034, gaps: 0.18 });

  pavilion(-1);
  pavilion(1);

  // Near-field walls and roof ribs wrap the viewer in the scanned hall instead of leaving a black void.
  box({ at: new THREE.Vector3(-14.72, 5.2, -4.8), size: new THREE.Vector3(0.48, 10.4, 23.5), count: 34_000, base: COLORS.deepGold, opacity: 0.38, pointScale: 0.012, gaps: 0.34, paperChance: 0.025 });
  box({ at: new THREE.Vector3(14.72, 5.2, -4.8), size: new THREE.Vector3(0.48, 10.4, 23.5), count: 34_000, base: COLORS.deepGreen, opacity: 0.36, pointScale: 0.012, gaps: 0.34, paperChance: 0.025 });
  [-1.5, -7.5, -13.5, -19.5, -25.5].forEach((z, index) => {
    box({
      at: new THREE.Vector3(0, 10.65, z),
      size: new THREE.Vector3(29.2, 0.42, 0.48),
      count: 6_400,
      base: index % 2 === 0 ? COLORS.deepGold : COLORS.stone,
      opacity: 0.38,
      pointScale: 0.011,
      gaps: 0.2,
      paperChance: 0.018
    });
  });
  plane({ origin: new THREE.Vector3(-14.4, 10.82, 4.5), axisU: new THREE.Vector3(28.8, 0, 0), axisV: new THREE.Vector3(0, 0, -31), count: 31_000, base: COLORS.charcoal, opacity: 0.18, pointScale: 0.008, gaps: 0.46, paperChance: 0.018 });

  // A brighter central path catches the courtyard lights like the wet scan surface in the reference.
  plane({ origin: new THREE.Vector3(-3.5, 0.035, 6.5), axisU: new THREE.Vector3(7, 0, 0), axisV: new THREE.Vector3(0, 0, -37), count: 52_000, base: COLORS.stone, opacity: 0.46, pointScale: 0.0055, jitter: 0.018, gaps: 0.08, paperChance: 0.23 });

  // Archive plaque in the left pavilion, represented by layered luminous scan lines.
  box({ at: new THREE.Vector3(-10.7, 3.5, -18.1), size: new THREE.Vector3(2.2, 5.3, 0.16), count: 7_000, base: COLORS.deepGold, opacity: 0.52, pointScale: 0.011, gaps: 0.2, paperChance: 0.04 });
  for (let row = 0; row < 22; row += 1) {
    const width = 0.72 + (row % 5) * 0.21;
    line({
      from: new THREE.Vector3(-11.55, 5.65 - row * 0.19, -17.98),
      to: new THREE.Vector3(-11.55 + width, 5.65 - row * 0.19, -17.98),
      count: 115,
      base: row % 6 === 0 ? COLORS.paper : COLORS.gold,
      opacity: 0.82,
      radius: 0.014,
      pointScale: 0.007,
      paperChance: 0.04
    });
  }

  // Central plinth anchors the archive sculpture in the courtyard.
  disk({ at: new THREE.Vector3(0, 0.02, -9.4), radius: 3.55, height: 0.5, count: 28_000, base: COLORS.stone, opacity: 0.62, pointScale: 0.016 });
  disk({ at: new THREE.Vector3(0, 0.5, -9.4), radius: 2.78, height: 0.28, count: 14_000, base: COLORS.ember, opacity: 0.62, pointScale: 0.014 });

  // Volumetric archive tower: stacked frames plus dense vertical data strands.
  const towerLevels = [
    [4.4, 3.0, 0.8, 1.55, 0.05], [3.25, 3.8, 2.25, 1.65, 0.43],
    [4.85, 2.35, 3.8, 1.5, -0.26], [3.15, 3.65, 5.2, 1.8, 0.58],
    [2.3, 2.4, 6.9, 1.75, -0.18], [1.55, 1.75, 8.55, 2.5, 0.31]
  ] as const;
  towerLevels.forEach(([width, depth, bottom, height, yaw]) => {
    const corners = [
      new THREE.Vector3(-width / 2, bottom, -depth / 2), new THREE.Vector3(width / 2, bottom, -depth / 2),
      new THREE.Vector3(width / 2, bottom, depth / 2), new THREE.Vector3(-width / 2, bottom, depth / 2)
    ].map((point) => point.applyAxisAngle(new THREE.Vector3(0, 1, 0), yaw).add(new THREE.Vector3(0, 0, -9.4)));
    const top = corners.map((point) => point.clone().add(new THREE.Vector3(0, height, 0)));
    for (let edge = 0; edge < 4; edge += 1) {
      const next = (edge + 1) % 4;
      line({ from: corners[edge], to: corners[next], count: 1_150, base: COLORS.vermilion, opacity: 0.86, radius: 0.045, pointScale: 0.012 });
      line({ from: top[edge], to: top[next], count: 1_150, base: COLORS.vermilion, opacity: 0.86, radius: 0.045, pointScale: 0.012 });
      line({ from: corners[edge], to: top[edge], count: 950, base: COLORS.vermilion, opacity: 0.84, radius: 0.04, pointScale: 0.011 });
    }

    // Broken data planes inside every frame add volume without turning the tower into an opaque mesh.
    plane({
      origin: new THREE.Vector3(-width * 0.44, bottom + 0.12, -9.4),
      axisU: new THREE.Vector3(width * 0.88, 0, 0),
      axisV: new THREE.Vector3(0, height * 0.82, 0),
      count: 2_800,
      base: COLORS.ember,
      opacity: 0.34,
      pointScale: 0.008,
      jitter: 0.04,
      gaps: 0.52,
      paperChance: 0.025
    });
  });
  for (let strand = 0; strand < 54; strand += 1) {
    const x = (randomSigned(strand * 73) * 1.95);
    const z = -9.4 + randomSigned(strand * 97 + 11) * 1.5;
    const start = 0.85 + (strand % 7) * 0.22;
    const end = 5.8 + (strand % 11) * 0.42;
    line({ from: new THREE.Vector3(x, start, z), to: new THREE.Vector3(x + randomSigned(strand) * 0.2, end, z + randomSigned(strand + 33) * 0.2), count: 520, base: strand % 5 === 0 ? COLORS.paper : COLORS.vermilion, opacity: 0.64, radius: 0.03, pointScale: 0.009 });
  }

  // Community constellation occupies the right pavilion as a luminous data sculpture.
  const constellationRandom = mulberry32(30912026);
  const constellationNodes = Array.from({ length: 34 }, (_, index) => {
    const angle = constellationRandom() * Math.PI * 2;
    const radius = 0.8 + Math.sqrt(constellationRandom()) * 3.5;
    return new THREE.Vector3(9.2 + Math.cos(angle) * radius, 4.8 + Math.sin(angle) * radius * 0.82, -15.6 - constellationRandom() * 2.4 + (index % 3) * 0.16);
  });
  constellationNodes.forEach((node, index) => {
    const candidates = constellationNodes
      .map((other, otherIndex) => ({ other, otherIndex, distance: node.distanceToSquared(other) }))
      .filter(({ otherIndex }) => otherIndex > index)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, index % 4 === 0 ? 3 : 2);
    candidates.forEach(({ other }) => line({ from: node, to: other, count: 360, base: COLORS.green, opacity: 0.68, radius: 0.025, pointScale: 0.009, paperChance: 0.08 }));
    cloud({ at: node, radius: new THREE.Vector3(0.12, 0.12, 0.12), count: 520, base: index % 5 === 0 ? COLORS.paper : COLORS.green, opacity: 0.92, pointScale: index % 5 === 0 ? 0.009 : 0.007, shell: false, paperChance: 0.22 });
  });
  // A second constellation layer gives the right chamber the dense luminous depth of the reference.
  const constellationBack = constellationNodes.slice(0, 18).map((node, index) => node.clone().add(new THREE.Vector3((index % 3 - 1) * 0.42, (index % 4 - 1.5) * 0.3, -2.2)));
  constellationBack.forEach((node, index) => {
    const target = constellationBack[(index * 5 + 7) % constellationBack.length];
    line({ from: node, to: target, count: 280, base: index % 4 === 0 ? COLORS.paper : COLORS.green, opacity: 0.55, radius: 0.02, pointScale: 0.007, paperChance: 0.1 });
    cloud({ at: node, radius: new THREE.Vector3(0.1, 0.1, 0.1), count: 320, base: index % 4 === 0 ? COLORS.paper : COLORS.green, opacity: 0.82, pointScale: 0.007, paperChance: 0.18 });
  });

  // Warm path lights and scanned planting beds make the courtyard feel occupied.
  const lampPositions: THREE.Vector3[] = [];
  for (let row = 0; row < 2; row += 1) {
    for (let index = 0; index < 7; index += 1) {
      const z = 1 - index * 4.55;
      lampPositions.push(new THREE.Vector3(-2.9 - row * 2.9, 0, z));
      lampPositions.push(new THREE.Vector3(2.9 + row * 2.9, 0, z));
    }
  }
  lampPositions.forEach((lamp, index) => {
    line({ from: lamp, to: lamp.clone().add(new THREE.Vector3(0, 0.78, 0)), count: 150, base: COLORS.stone, opacity: 0.68, radius: 0.035, pointScale: 0.012 });
    cloud({ at: lamp.clone().add(new THREE.Vector3(0, 0.84, 0)), radius: new THREE.Vector3(0.085, 0.085, 0.085), count: 260, base: COLORS.paper, opacity: 0.96, pointScale: 0.007, shell: false, paperChance: 0.55 });
  });

  const plantingPositions = [
    [-13.6, -7], [-13.6, -12], [-12.9, -18], [-4.4, -13], [-5.2, -25], [-13.2, -29],
    [13.6, -7], [13.6, -12], [12.9, -18], [4.4, -13], [5.2, -25], [13.2, -29]
  ];
  plantingPositions.forEach(([x, z], index) => {
    const plantColor = x < 0 ? COLORS.gold : COLORS.green;
    cloud({ at: new THREE.Vector3(x, 0.8 + (index % 3) * 0.12, z), radius: new THREE.Vector3(0.72, 1.35, 0.72), count: 2_200, base: plantColor, opacity: 0.48, pointScale: 0.011, shell: true, paperChance: 0.025 });
    for (let branch = 0; branch < 7; branch += 1) {
      line({ from: new THREE.Vector3(x, 0.08, z), to: new THREE.Vector3(x + randomSigned(index * 17 + branch) * 0.55, 0.7 + branch * 0.16, z + randomSigned(index * 29 + branch) * 0.55), count: 110, base: plantColor, opacity: 0.5, radius: 0.025, pointScale: 0.009 });
    }
  });

  const ambientCount = Math.max(0, total - planned);
  planned += ambientCount;
  tasks.push({ count: ambientCount, emit: () => {
    const side = random() < 0.5 ? -1 : 1;
    center.set((random() - 0.5) * 30, 0.2 + random() * 10.8, 6 - random() * 43);
    const base = side < 0 ? COLORS.deepGold : COLORS.deepGreen;
    const proximity = Math.min(1, Math.abs(center.x) / 14);
    emit(0.08 + proximity * 0.16, base, 0.006 + random() * 0.008, identity, 0.24, 0.008);
  } });

  return { tasks, planned };
}

function randomSigned(seed: number) {
  const value = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return (value - Math.floor(value)) * 2 - 1;
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
  mesh.name = "gauss-archive-architectural-million-scan";
  return { mesh, count };
}
