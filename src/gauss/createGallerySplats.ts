import { PackedSplats, SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { GALLERY_COLORS } from "./galleryData";

type SurfaceOptions = {
  origin: THREE.Vector3;
  axisU: THREE.Vector3;
  axisV: THREE.Vector3;
  step: number;
  scale: THREE.Vector3;
  color: THREE.Color;
  colorVariance?: number;
  density?: number;
  opacity?: number;
  jitter?: number;
  quaternion?: THREE.Quaternion;
};

type LineOptions = {
  from: THREE.Vector3;
  to: THREE.Vector3;
  step: number;
  radius: number;
  color: THREE.Color;
  opacity?: number;
};

const tempCenter = new THREE.Vector3();
const tempScale = new THREE.Vector3();
const tempColor = new THREE.Color();
const identity = new THREE.Quaternion();

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function addSurface(splats: PackedSplats, options: SurfaceOptions, random: () => number) {
  const countU = Math.max(2, Math.ceil(options.axisU.length() / options.step));
  const countV = Math.max(2, Math.ceil(options.axisV.length() / options.step));
  const unitU = options.axisU.clone().multiplyScalar(1 / countU);
  const unitV = options.axisV.clone().multiplyScalar(1 / countV);
  const jitter = options.jitter ?? options.step * 0.26;
  const opacity = options.opacity ?? 0.76;
  const variance = options.colorVariance ?? 0.1;

  for (let u = 0; u <= countU; u += 1) {
    for (let v = 0; v <= countV; v += 1) {
      if (random() > (options.density ?? 0.92)) continue;
      tempCenter
        .copy(options.origin)
        .addScaledVector(unitU, u)
        .addScaledVector(unitV, v)
        .add(new THREE.Vector3((random() - 0.5) * jitter, (random() - 0.5) * jitter, (random() - 0.5) * jitter));
      tempScale.copy(options.scale).multiplyScalar(0.38 + random() * 0.24);
      tempColor.copy(options.color).offsetHSL((random() - 0.5) * variance * 0.15, 0, (random() - 0.5) * variance);
      splats.pushSplat(tempCenter, tempScale, options.quaternion ?? identity, opacity * (0.78 + random() * 0.22), tempColor);
    }
  }
}

function addLine(splats: PackedSplats, options: LineOptions, random: () => number) {
  const delta = options.to.clone().sub(options.from);
  const length = delta.length();
  const count = Math.max(2, Math.ceil(length / options.step));
  const direction = delta.normalize();
  for (let index = 0; index <= count; index += 1) {
    tempCenter.copy(options.from).addScaledVector(direction, (index / count) * length);
    tempCenter.x += (random() - 0.5) * options.radius;
    tempCenter.y += (random() - 0.5) * options.radius;
    tempCenter.z += (random() - 0.5) * options.radius;
    tempScale.set(options.radius, options.radius, options.radius);
    splats.pushSplat(tempCenter, tempScale, identity, options.opacity ?? 0.85, options.color);
  }
}

function addArchiveCore(splats: PackedSplats, step: number, random: () => number) {
  const towerCenter = new THREE.Vector3(0, 0, -8.5);
  const frames = [
    { width: 4.4, depth: 3.0, bottom: 0.3, height: 1.65, rotation: 0.04 },
    { width: 3.1, depth: 3.7, bottom: 1.85, height: 1.8, rotation: 0.42 },
    { width: 4.7, depth: 2.25, bottom: 3.5, height: 1.65, rotation: -0.24 },
    { width: 2.8, depth: 3.5, bottom: 5.0, height: 2.0, rotation: 0.55 },
    { width: 2.1, depth: 2.1, bottom: 6.85, height: 2.5, rotation: -0.16 }
  ];

  frames.forEach((frame) => {
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, frame.rotation, 0));
    const localCorners = [
      new THREE.Vector3(-frame.width / 2, frame.bottom, -frame.depth / 2),
      new THREE.Vector3(frame.width / 2, frame.bottom, -frame.depth / 2),
      new THREE.Vector3(frame.width / 2, frame.bottom, frame.depth / 2),
      new THREE.Vector3(-frame.width / 2, frame.bottom, frame.depth / 2)
    ];
    const bottom = localCorners.map((corner) => corner.applyQuaternion(quaternion).add(towerCenter));
    const top = bottom.map((corner) => corner.clone().add(new THREE.Vector3(0, frame.height, 0)));
    for (let edge = 0; edge < 4; edge += 1) {
      const next = (edge + 1) % 4;
      addLine(splats, { from: bottom[edge], to: bottom[next], step: step * 0.42, radius: step * 0.075, color: GALLERY_COLORS.vermilion, opacity: 0.9 }, random);
      addLine(splats, { from: top[edge], to: top[next], step: step * 0.42, radius: step * 0.075, color: GALLERY_COLORS.vermilion, opacity: 0.9 }, random);
      addLine(splats, { from: bottom[edge], to: top[edge], step: step * 0.42, radius: step * 0.075, color: GALLERY_COLORS.vermilion, opacity: 0.9 }, random);
    }
  });

  for (let column = 0; column < 42; column += 1) {
    const x = (random() - 0.5) * 3.5;
    const z = -8.5 + (random() - 0.5) * 2.35;
    const bottom = 0.35 + random() * 3.8;
    const height = 1.2 + random() * 5.4;
    addLine(splats, {
      from: new THREE.Vector3(x, bottom, z),
      to: new THREE.Vector3(x + (random() - 0.5) * 0.5, Math.min(9.4, bottom + height), z + (random() - 0.5) * 0.5),
      step: step * 0.48,
      radius: step * 0.055,
      color: GALLERY_COLORS.vermilion,
      opacity: 0.72
    }, random);
  }
}

function addConstellation(splats: PackedSplats, step: number, random: () => number) {
  const nodes = [
    [-10.5, 7.4, -21], [-8.3, 5.7, -23], [-11.8, 4.1, -25], [-7.2, 3.3, -27],
    [8.8, 7.5, -19], [11.2, 6.2, -22], [7.6, 4.7, -24], [10.5, 3.1, -28],
    [5.8, 7.9, -29], [-5.6, 6.8, -30], [0, 9.2, -33], [0, 5.2, -35]
  ].map(([x, y, z]) => new THREE.Vector3(x, y, z));
  const links = [[0, 1], [1, 2], [1, 3], [4, 5], [4, 6], [5, 7], [6, 7], [8, 10], [9, 10], [10, 11], [3, 9], [7, 8]];

  links.forEach(([a, b]) => addLine(splats, {
    from: nodes[a],
    to: nodes[b],
    step: step * 0.72,
    radius: step * 0.2,
    color: GALLERY_COLORS.moss,
    opacity: 0.78
  }, random));

  nodes.forEach((node, nodeIndex) => {
    for (let index = 0; index < 46; index += 1) {
      const phi = Math.acos(1 - 2 * random());
      const theta = Math.PI * 2 * random();
      const radius = 0.18 + random() * (nodeIndex % 3 === 0 ? 0.42 : 0.28);
      tempCenter.set(
        node.x + radius * Math.sin(phi) * Math.cos(theta),
        node.y + radius * Math.cos(phi),
        node.z + radius * Math.sin(phi) * Math.sin(theta)
      );
      tempScale.setScalar(step * (0.34 + random() * 0.34));
      tempColor.copy(GALLERY_COLORS.moss).lerp(GALLERY_COLORS.brass, random() * 0.45);
      splats.pushSplat(tempCenter, tempScale, identity, 0.96, tempColor);
    }
  });
}

function addArchitecture(splats: PackedSplats, step: number, random: () => number) {
  const floorRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
  addSurface(splats, {
    origin: new THREE.Vector3(-15, 0, 7),
    axisU: new THREE.Vector3(30, 0, 0),
    axisV: new THREE.Vector3(0, 0, -45),
    step,
    scale: new THREE.Vector3(step * 0.58, step * 0.58, step * 0.1),
    color: GALLERY_COLORS.stone,
    colorVariance: 0.2,
    opacity: 0.72,
    quaternion: floorRotation
  }, random);

  [-15, 15].forEach((x, side) => {
    addSurface(splats, {
      origin: new THREE.Vector3(x, 0, 7),
      axisU: new THREE.Vector3(0, 0, -45),
      axisV: new THREE.Vector3(0, 12, 0),
      step: step * 1.08,
      scale: new THREE.Vector3(step * 0.5, step * 0.5, step * 0.12),
      color: side === 0 ? GALLERY_COLORS.brass : GALLERY_COLORS.moss,
      colorVariance: 0.28,
      opacity: 0.42
    }, random);
  });

  [-11, -6.5, 6.5, 11].forEach((x, columnIndex) => {
    for (let z = 4; z >= -34; z -= 7.5) {
      addSurface(splats, {
        origin: new THREE.Vector3(x - 0.22, 0, z),
        axisU: new THREE.Vector3(0.44, 0, 0),
        axisV: new THREE.Vector3(0, 10.5, 0),
        step: step * 0.58,
        scale: new THREE.Vector3(step * 0.46, step * 0.46, step * 0.12),
        color: columnIndex < 2 ? GALLERY_COLORS.brass : GALLERY_COLORS.moss,
        opacity: 0.58
      }, random);
    }
  });

  for (let z = 3; z >= -35; z -= 6.5) {
    addLine(splats, {
      from: new THREE.Vector3(-14.5, 10.2, z),
      to: new THREE.Vector3(14.5, 10.2, z),
      step: step * 0.66,
      radius: step * 0.16,
      color: GALLERY_COLORS.brass,
      opacity: 0.72
    }, random);
  }

  for (let row = 0; row < 8; row += 1) {
    const z = -12 - row * 3.1;
    const color = row % 2 === 0 ? GALLERY_COLORS.paper : GALLERY_COLORS.brass;
    addLine(splats, {
      from: new THREE.Vector3(-12.8, 1.2 + (row % 3) * 0.72, z),
      to: new THREE.Vector3(-5.2, 1.2 + (row % 3) * 0.72, z - 0.5),
      step: step * 0.58,
      radius: step * 0.14,
      color,
      opacity: 0.8
    }, random);
  }
}

export type GallerySplatResult = {
  mesh: SplatMesh;
  count: number;
  quality: "desktop" | "mobile";
};

export function createGallerySplats(mobile: boolean): GallerySplatResult {
  const random = mulberry32(20162026);
  const step = mobile ? 0.48 : 0.34;
  const packedSplats = new PackedSplats({
    construct: (splats) => {
      addArchitecture(splats, step, random);
      addArchiveCore(splats, step, random);
      addConstellation(splats, step, random);
    }
  });
  const mesh = new SplatMesh({ packedSplats });
  mesh.name = "gauss-archive-procedural-scene";
  return {
    mesh,
    count: packedSplats.numSplats,
    quality: mobile ? "mobile" : "desktop"
  };
}
