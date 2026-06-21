import * as THREE from 'three';
import {
  box,
  createArchiveStack,
  createAtriumShell,
  createFloorStarMap,
  createGlassRail,
  createImagePlane,
  createLabelTexture,
  createLightStrip,
  createMaterialLibrary,
  createMemberWall,
  createPortalDoor,
  createProcessTable,
  createRobotArm,
  createScaffold,
  createStepStairs,
  lineBetween,
  plane
} from './space-assets.js';

const stage = document.querySelector('#space-stage');
const panelKicker = document.querySelector('#space-kicker');
const panelTitle = document.querySelector('#space-title');
const panelDescription = document.querySelector('#space-description');
const panelLink = document.querySelector('#active-link');
const enterButton = document.querySelector('#enter-roam');
const mobileButtons = document.querySelectorAll('[data-move]');
const roomButtons = document.querySelectorAll('[data-room]');

const rooms = [
  {
    id: 'atrium',
    kicker: 'Museum Agent Atrium',
    title: '导览大厅',
    concept: 'AI-Native Archive Atrium',
    description: '主入口、Museum Agent 导览台与全馆空间索引。作品、项目、Prompt、Skill、成员、历史和建设现场在这里被组织成可选择的路线。',
    href: '../archive/index.html',
    image: '../assets/space-concepts/ai-native-archive-atrium.jpg',
    position: new THREE.Vector3(0, 0, 0),
    camera: new THREE.Vector3(0, 2.65, 18),
    target: new THREE.Vector3(0, 2.6, -4.5),
    accent: 0xff6b4a,
    secondary: 0x9ce37d
  },
  {
    id: 'construction',
    kicker: 'Human on the Loop',
    title: '建设现场展厅',
    concept: 'AI Construction Site Museum',
    description: '把博物馆的生成过程本身作为展品：Prompt、Skill、代码、测试、提交记录、策展决策和贡献记录共同形成一条建设路线。',
    href: '../progress/index.html',
    image: '../assets/space-concepts/ai-construction-site-museum.jpg',
    position: new THREE.Vector3(-34, 0, -20),
    camera: new THREE.Vector3(-34, 2.7, -4.2),
    target: new THREE.Vector3(-34, 2.6, -26),
    accent: 0xe7c15f,
    secondary: 0xff6b4a
  },
  {
    id: 'starmap',
    kicker: 'Community Star Map',
    title: '社群星图展厅',
    concept: 'Community Star-Map Museum',
    description: '把作品、项目、成员、历史、研究问题和未来方向转译成社群关系星图。Museum Agent 可以生成 5 分钟、15 分钟或研究路线。',
    href: '../members/index.html',
    image: '../assets/space-concepts/community-star-map-museum.jpg',
    position: new THREE.Vector3(34, 0, -20),
    camera: new THREE.Vector3(34, 5.2, -2.5),
    target: new THREE.Vector3(34, 1.8, -24),
    accent: 0x9ce37d,
    secondary: 0xe7c15f
  }
];

let renderer;
let scene;
let camera;
let textureLoader;
let materials;
let activeRoom = rooms[0];
let lastFrameTime = performance.now();
let elapsedTime = 0;
let yaw = 0;
let pitch = -0.08;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };
let ambientStars;
let frameCount = 0;

const keys = new Set();
const mobileMoves = new Set();
const animated = {
  rings: [],
  floaters: [],
  pulseLights: [],
  starMaps: []
};

const player = {
  position: rooms[0].camera.clone(),
  speed: 13
};

init();

function init() {
  try {
    materials = createMaterialLibrary();
    textureLoader = new THREE.TextureLoader();

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050607);
    scene.fog = new THREE.FogExp2(0x050607, 0.0085);

    camera = new THREE.PerspectiveCamera(64, window.innerWidth / window.innerHeight, 0.1, 260);
    setLookAtFromTarget(rooms[0].target);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.domElement.setAttribute('data-space-canvas', 'true');
    stage.appendChild(renderer.domElement);

    addLighting();
    addMuseumGround();
    buildAtrium(rooms[0]);
    buildConstructionHall(rooms[1]);
    buildStarMapHall(rooms[2]);
    addConnectorPaths();
    addAmbientStars();
    bindControls();
    setActiveRoom(rooms[0], true);
    exposeDebugStats();

    document.body.dataset.threeReady = 'true';
    window.__spaceReady = true;
    animate();
  } catch (error) {
    showError(error);
  }
}

function addLighting() {
  scene.add(new THREE.HemisphereLight(0xf2f0e6, 0x111314, 1.9));

  const key = new THREE.DirectionalLight(0xf2f0e6, 3.2);
  key.position.set(-10, 26, 18);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 88;
  scene.add(key);

  [
    [0xff6b4a, 0, 6, 4, 42],
    [0x9ce37d, 34, 7, -16, 44],
    [0xe7c15f, -34, 7, -16, 44]
  ].forEach(([color, x, y, z, distance]) => {
    const light = new THREE.PointLight(color, 9, distance, 1.8);
    light.position.set(x, y, z);
    scene.add(light);
    animated.pulseLights.push(light);
  });
}

function addMuseumGround() {
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 76),
    new THREE.MeshStandardMaterial({ color: 0x161715, roughness: 0.86, metalness: 0.08 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, -0.04, -14);
  ground.receiveShadow = true;
  scene.add(ground);

  const grid = new THREE.GridHelper(96, 48, 0x6e675c, 0x2d302d);
  grid.position.set(0, 0.02, -14);
  grid.material.opacity = 0.14;
  grid.material.transparent = true;
  scene.add(grid);
}

function buildAtrium(room) {
  const group = new THREE.Group();
  group.name = 'AI-Native Archive Atrium';
  group.position.copy(room.position);
  group.userData.room = room;
  scene.add(group);

  const shell = createAtriumShell(materials, { width: 28, depth: 22, height: 10 });
  group.add(shell);

  addConceptBackdrop(group, room, 14.7, 8.25, [0, 5.1, -10.82], room.accent);
  addHallTitle(group, room, [0, 9.25, -10.25]);

  const lowerStairs = createStepStairs(materials, 8, 9.5);
  lowerStairs.position.set(0, 0.04, 8.2);
  group.add(lowerStairs);

  addAgentRouteCore(group, room, [0, 1.35, 0.55], 4.3, ['Works', 'Projects', 'Prompts', 'Skills', 'Members', 'History']);

  const archive = createArchiveStack(materials, 7, 7);
  archive.position.set(-10.8, 1.1, -5.8);
  archive.rotation.y = Math.PI / 2;
  group.add(archive);

  const promptLab = createProcessTable(materials, 5.2);
  promptLab.position.set(-9.3, 0.05, 2.9);
  promptLab.rotation.y = Math.PI / 2;
  group.add(promptLab);

  const members = createMemberWall(materials, 6.2, 3.1);
  members.position.set(7.9, 3.0, -7.8);
  members.rotation.y = -0.25;
  group.add(members);

  const timeline = createTimelineWall('COMMUNITY HISTORY', ['2016', '2020', '2024', 'AI'], room.accent);
  timeline.position.set(11.45, 3.2, -2.4);
  timeline.rotation.y = -Math.PI / 2;
  group.add(timeline);

  [
    ['ARCHIVE STACKS', -11.75, 5.85, -6.2, Math.PI / 2],
    ['PROMPT / SKILL LAB', -11.75, 2.85, 3.0, Math.PI / 2],
    ['MEMBER WALL', 7.9, 5.35, -7.15, -0.25],
    ['CONSTRUCTION / PROCESS', 10.7, 2.25, 4.4, -Math.PI / 2],
    ['RESEARCH ROOMS', -3.8, 4.4, -9.55, 0]
  ].forEach(([label, x, y, z, rot]) => {
    const sign = createSmallSign(label, room.secondary);
    sign.position.set(x, y, z);
    sign.rotation.y = rot;
    group.add(sign);
  });

  const sideDoor = createPortalDoor(materials, 'RESEARCH', '#9ce37d');
  sideDoor.position.set(-4.4, 1.85, -10.44);
  group.add(sideDoor);

  const processDoor = createPortalDoor(materials, 'BUILD PROCESS', '#ff6b4a');
  processDoor.position.set(10.85, 1.75, 4.4);
  processDoor.rotation.y = -Math.PI / 2;
  group.add(processDoor);
}

function buildConstructionHall(room) {
  const group = new THREE.Group();
  group.name = 'AI Construction Site Museum';
  group.position.copy(room.position);
  group.userData.room = room;
  scene.add(group);

  const shell = createAtriumShell(materials, { width: 29, depth: 22, height: 9.2 });
  group.add(shell);
  addConceptBackdrop(group, room, 14.7, 8.25, [0, 5.1, -10.82], room.accent);
  addHallTitle(group, room, [0, 9.05, -10.25]);

  const scaffold = createScaffold(materials, 13.5, 6.2, 4.2);
  scaffold.position.set(5.2, 0.25, -3.2);
  group.add(scaffold);

  const suspended = createFloatingPanel('ASSEMBLING NEW EXHIBIT', 'AI agents organize, annotate, connect.', '#e7c15f');
  suspended.position.set(4.3, 5.25, -4.35);
  group.add(suspended);
  animated.floaters.push({ mesh: suspended, baseY: suspended.position.y, offset: 0.4 });

  addAgentRouteCore(group, room, [-1.2, 1.28, 1.4], 4.7, ['Prompt Card', 'Source Code', 'Skill Module', 'Member', 'Commit', 'Validate']);

  for (let i = 0; i < 5; i += 1) {
    const table = createProcessTable(materials, 3.8);
    table.position.set(-7.2 + i * 3.6, 0.04, 5.6);
    table.rotation.y = i % 2 ? 0.08 : -0.08;
    group.add(table);
  }

  const robotA = createRobotArm(materials);
  robotA.position.set(8.4, 0.18, 3.1);
  robotA.rotation.y = -0.4;
  group.add(robotA);

  const robotB = createRobotArm(materials);
  robotB.position.set(10.3, 0.18, 6.0);
  robotB.rotation.y = -1.15;
  robotB.scale.setScalar(0.9);
  group.add(robotB);

  const logPanel = createFloatingPanel('BUILD LOG', 'prompt / code / commit / validation', '#ff6b4a');
  logPanel.position.set(9.9, 2.35, 0.15);
  logPanel.rotation.y = -0.35;
  group.add(logPanel);

  const promptWorkflow = createFloatingPanel('PROMPT WORKFLOW', 'context -> harness -> loop -> exhibit', '#e7c15f');
  promptWorkflow.position.set(5.9, 3.1, 2.2);
  promptWorkflow.rotation.y = -0.42;
  group.add(promptWorkflow);

  const archive = createArchiveStack(materials, 6, 6);
  archive.position.set(-11.2, 1.25, -4.8);
  archive.rotation.y = Math.PI / 2;
  group.add(archive);

  ['CURATORIAL DECISIONS', 'AI AGENTS AT WORK', 'LIVING ARCHIVE', 'TEST / VALIDATION'].forEach((label, i) => {
    const sign = createSmallSign(label, i % 2 ? room.secondary : room.accent);
    sign.position.set(-9.5 + i * 6.2, i < 2 ? 5.3 : 2.7, i < 2 ? -8.1 : 0.8);
    sign.rotation.y = i === 0 ? 0 : i === 1 ? -0.2 : i === 2 ? Math.PI / 2 : -0.35;
    group.add(sign);
  });
}

function buildStarMapHall(room) {
  const group = new THREE.Group();
  group.name = 'Community Star-Map Museum';
  group.position.copy(room.position);
  group.userData.room = room;
  scene.add(group);

  const shell = createAtriumShell(materials, { width: 31, depth: 22, height: 9.6 });
  group.add(shell);
  addConceptBackdrop(group, room, 14.7, 8.25, [0, 5.1, -10.82], room.accent);
  addHallTitle(group, room, [0, 9.15, -10.25]);

  const starmap = createFloorStarMap(materials, 8.6, 150, 17);
  starmap.position.set(0, 0.1, 0.75);
  group.add(starmap);
  animated.starMaps.push(starmap);

  addAgentRouteCore(group, room, [0, 1.25, 0.85], 6.5, ['HUDOIT', 'Works', 'Tools', 'AI Native', 'Community', 'Future'], true);

  const doorData = [
    ['WORKS GALLERY', -8.7, -4.8, 0.32],
    ['PROJECTS HALL', 0, -9.45, 0],
    ['PROMPT / SKILL LAB', 8.7, -4.8, -0.32],
    ['HISTORY ARCHIVE', -11.2, 1.8, Math.PI / 2],
    ['RESEARCH ROOM', 11.2, 1.8, -Math.PI / 2],
    ['BUILD PROCESS', 8.8, 6.3, -0.65],
    ['MEMBER WALL', -8.8, 6.3, 0.65]
  ];
  doorData.forEach(([label, x, z, rot]) => {
    const door = createPortalDoor(materials, label, '#9ce37d');
    door.position.set(x, 1.74, z);
    door.rotation.y = rot;
    group.add(door);
  });

  const routePanel = createFloatingPanel('ROUTE', '5 MIN / 15 MIN / RESEARCH', '#f2f0e6');
  routePanel.position.set(11.2, 4.25, 2.6);
  routePanel.rotation.y = -Math.PI / 2.3;
  group.add(routePanel);

  const balconyLeft = createGlassRail(8.2, materials);
  balconyLeft.position.set(-7.6, 4.75, -2.7);
  group.add(balconyLeft);
  const balconyRight = createGlassRail(8.2, materials);
  balconyRight.position.set(7.6, 4.75, -2.7);
  group.add(balconyRight);
}

function addConceptBackdrop(group, room, width, height, position, accent) {
  const image = createImagePlane(textureLoader, room.image, width, height);
  image.position.set(position[0], position[1], position[2]);
  image.renderOrder = 3;
  group.add(image);

  const glowFrame = new THREE.Group();
  const top = createLightStrip(width + 0.6, accent, true);
  top.position.set(position[0], position[1] + height / 2 + 0.16, position[2] + 0.06);
  glowFrame.add(top);
  const bottom = createLightStrip(width + 0.15, accent, true);
  bottom.position.set(position[0], position[1] - height / 2 - 0.16, position[2] + 0.06);
  glowFrame.add(bottom);
  [-width / 2 - 0.18, width / 2 + 0.18].forEach((x) => {
    const side = createLightStrip(height + 0.4, accent, false);
    side.position.set(position[0] + x, position[1], position[2] + 0.06);
    glowFrame.add(side);
  });
  group.add(glowFrame);
}

function addHallTitle(group, room, position) {
  const texture = createLabelTexture({
    eyebrow: room.kicker,
    title: room.concept,
    subtitle: room.description,
    width: 1400,
    height: 340,
    accent: `#${room.accent.toString(16).padStart(6, '0')}`
  });
  const sign = plane(10.8, 2.62, new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false }), position);
  sign.renderOrder = 5;
  group.add(sign);
}

function addAgentRouteCore(group, room, position, radius, labels, wide = false) {
  const color = new THREE.Color(room.accent);
  const secondary = new THREE.Color(room.secondary);
  const center = new THREE.Vector3(position[0], position[1], position[2]);

  const orb = new THREE.Mesh(
    new THREE.SphereGeometry(wide ? 0.64 : 0.58, 48, 24),
    new THREE.MeshStandardMaterial({ color: 0xf2f0e6, roughness: 0.32, metalness: 0.12, emissive: color, emissiveIntensity: 0.34 })
  );
  orb.position.copy(center);
  orb.castShadow = true;
  group.add(orb);
  animated.floaters.push({ mesh: orb, baseY: center.y, offset: room.position.x * 0.01 });

  [radius * 0.36, radius * 0.55, radius * 0.78, radius].forEach((r, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.018, 8, 180),
      new THREE.MeshBasicMaterial({ color: i % 2 ? room.secondary : room.accent, transparent: true, opacity: 0.25 - i * 0.025 })
    );
    ring.position.set(center.x, 0.18 + i * 0.02, center.z);
    ring.rotation.x = Math.PI / 2;
    group.add(ring);
    animated.rings.push({ mesh: ring, speed: 0.06 + i * 0.03 });
  });

  const agentPrompt = plane(
    wide ? 5.4 : 4.7,
    0.9,
    new THREE.MeshBasicMaterial({
      map: createLabelTexture({
        title: 'Museum Agent',
        subtitle: wide ? 'route: 5 min / 15 min / research' : 'spatial route ready',
        width: 900,
        height: 220,
        accent: `#${room.accent.toString(16).padStart(6, '0')}`
      }),
      transparent: true,
      depthWrite: false
    }),
    [center.x, center.y + 1.06, center.z + 0.04],
    [-0.18, 0, 0]
  );
  agentPrompt.renderOrder = 8;
  group.add(agentPrompt);

  labels.forEach((label, index) => {
    const angle = -Math.PI * 0.86 + (index / labels.length) * Math.PI * 1.72;
    const x = center.x + Math.cos(angle) * radius * 0.86;
    const z = center.z + Math.sin(angle) * radius * 0.65;
    const nodeColor = index % 2 ? secondary : color;
    const node = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.62, 0.18, 36),
      new THREE.MeshStandardMaterial({ color: 0x1f211f, roughness: 0.42, metalness: 0.18, emissive: nodeColor, emissiveIntensity: 0.22 })
    );
    node.position.set(x, 0.32, z);
    node.castShadow = true;
    group.add(node);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.95, 0.016, 8, 96),
      new THREE.MeshBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.58 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.set(x, 0.48, z);
    group.add(halo);
    animated.rings.push({ mesh: halo, speed: 0.12 + index * 0.012 });

    const labelPlane = plane(
      wide ? 2.25 : 1.85,
      0.58,
      new THREE.MeshBasicMaterial({
        map: createLabelTexture({ title: label, width: 520, height: 180, accent: `#${nodeColor.getHexString()}`, align: 'center' }),
        transparent: true,
        depthWrite: false
      }),
      [x, 0.95, z],
      [-0.28, 0, 0]
    );
    labelPlane.renderOrder = 7;
    group.add(labelPlane);

    group.add(lineBetween(new THREE.Vector3(center.x, 0.42, center.z), new THREE.Vector3(x, 0.42, z), nodeColor, 0.42));
  });
}

function addConnectorPaths() {
  const hub = new THREE.Vector3(0, 0.1, 8.8);
  rooms.slice(1).forEach((room) => {
    const destination = room.position.clone().add(new THREE.Vector3(0, 0.1, 8.6));
    const path = new THREE.CatmullRomCurve3([
      hub,
      new THREE.Vector3(room.position.x * 0.36, 0.1, 1.5),
      destination
    ]);
    const points = path.getPoints(90);
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const line = new THREE.Line(
      geometry,
      new THREE.LineBasicMaterial({ color: room.accent, transparent: true, opacity: 0.52 })
    );
    scene.add(line);
  });
}

function addAmbientStars() {
  const positions = [];
  const colors = [];
  const palette = [new THREE.Color(0xff6b4a), new THREE.Color(0x9ce37d), new THREE.Color(0xe7c15f), new THREE.Color(0xf2f0e6)];
  let seed = 42;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  for (let i = 0; i < 1300; i += 1) {
    const radius = 45 + random() * 92;
    const angle = random() * Math.PI * 2;
    const height = 4 + random() * 56;
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius - 22);
    const color = palette[i % palette.length];
    colors.push(color.r, color.g, color.b);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  ambientStars = new THREE.Points(geometry, new THREE.PointsMaterial({ size: 0.065, vertexColors: true, transparent: true, opacity: 0.58 }));
  scene.add(ambientStars);
}

function createSmallSign(label, accent) {
  return plane(
    3.2,
    0.7,
    new THREE.MeshBasicMaterial({
      map: createLabelTexture({ title: label, width: 760, height: 190, accent: `#${accent.toString(16).padStart(6, '0')}`, align: 'center' }),
      transparent: true,
      depthWrite: false
    })
  );
}

function createTimelineWall(title, years, accent) {
  const group = new THREE.Group();
  group.add(box(6.4, 3.2, 0.16, materials.blackPanel, [0, 1.6, 0]));
  const titleSign = createSmallSign(title, accent);
  titleSign.position.set(0, 2.85, 0.12);
  group.add(titleSign);
  years.forEach((year, index) => {
    const x = -2.5 + index * 1.65;
    group.add(box(0.08, 0.08, 0.12, index % 2 ? materials.greenGlow : materials.redGlow, [x, 1.48, 0.18]));
    const label = createSmallSign(year, index % 2 ? 0x9ce37d : 0xff6b4a);
    label.scale.setScalar(0.38);
    label.position.set(x, 1.95 + (index % 2) * 0.32, 0.2);
    group.add(label);
    if (index < years.length - 1) {
      group.add(lineBetween(new THREE.Vector3(x, 1.48, 0.19), new THREE.Vector3(x + 1.65, 1.48, 0.19), accent, 0.62));
    }
  });
  return group;
}

function createFloatingPanel(title, subtitle, accent) {
  const group = new THREE.Group();
  const panel = plane(
    4.1,
    1.35,
    new THREE.MeshBasicMaterial({
      map: createLabelTexture({ title, subtitle, width: 900, height: 280, accent }),
      transparent: true,
      depthWrite: false
    })
  );
  panel.renderOrder = 9;
  group.add(panel);
  group.add(box(4.25, 1.48, 0.08, materials.darkGlass, [0, 0, -0.04]));
  return group;
}

function bindControls() {
  window.addEventListener('resize', onResize);
  window.addEventListener('keydown', (event) => {
    keys.add(event.code);
    if (event.code === 'Enter') {
      window.location.href = activeRoom.href;
    }
  });
  window.addEventListener('keyup', (event) => keys.delete(event.code));

  renderer.domElement.addEventListener('click', () => {
    renderer.domElement.focus();
    if (document.pointerLockElement !== renderer.domElement && !isTouchDevice()) {
      renderer.domElement.requestPointerLock?.();
    }
  });
  renderer.domElement.addEventListener('pointerdown', (event) => {
    isDragging = true;
    lastPointer = { x: event.clientX, y: event.clientY };
  });
  window.addEventListener('pointerup', () => {
    isDragging = false;
  });
  window.addEventListener('pointermove', (event) => {
    if (document.pointerLockElement === renderer.domElement) {
      updateLook(event.movementX, event.movementY);
    } else if (isDragging) {
      updateLook(event.clientX - lastPointer.x, event.clientY - lastPointer.y);
      lastPointer = { x: event.clientX, y: event.clientY };
    }
  });

  enterButton.addEventListener('click', () => {
    renderer.domElement.requestPointerLock?.();
    renderer.domElement.focus();
  });

  roomButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const room = rooms.find((item) => item.id === button.dataset.room);
      if (room) focusRoom(room);
    });
  });

  mobileButtons.forEach((button) => {
    const move = button.dataset.move;
    button.addEventListener('pointerdown', (event) => {
      event.preventDefault();
      mobileMoves.add(move);
    });
    button.addEventListener('pointerup', () => mobileMoves.delete(move));
    button.addEventListener('pointerleave', () => mobileMoves.delete(move));
    button.addEventListener('pointercancel', () => mobileMoves.delete(move));
  });
}

function updateLook(dx, dy) {
  yaw -= dx * 0.0022;
  pitch -= dy * 0.0019;
  pitch = Math.max(-0.8, Math.min(0.52, pitch));
}

function focusRoom(room) {
  player.position.copy(room.camera);
  setLookAtFromTarget(room.target);
  setActiveRoom(room, true);
}

function setLookAtFromTarget(target) {
  const direction = target.clone().sub(player.position);
  yaw = Math.atan2(direction.x, -direction.z);
  pitch = Math.atan2(direction.y, Math.sqrt(direction.x * direction.x + direction.z * direction.z));
}

function updateMovement(delta) {
  const forward = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw)).normalize();
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw)).normalize();
  const move = new THREE.Vector3();

  if (keys.has('KeyW') || keys.has('ArrowUp') || mobileMoves.has('forward')) move.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown') || mobileMoves.has('back')) move.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight') || mobileMoves.has('right')) move.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft') || mobileMoves.has('left')) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(player.speed * delta);
    player.position.add(move);
    player.position.x = Math.max(-51, Math.min(51, player.position.x));
    player.position.z = Math.max(-42, Math.min(23, player.position.z));
  }

  camera.position.copy(player.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function updateActiveRoom() {
  let closest = rooms[0];
  let closestDistance = Infinity;
  rooms.forEach((room) => {
    const distance = room.position.distanceTo(player.position);
    if (distance < closestDistance) {
      closest = room;
      closestDistance = distance;
    }
  });
  if (closest !== activeRoom) setActiveRoom(closest);
}

function setActiveRoom(room, force = false) {
  if (!force && room === activeRoom) return;
  activeRoom = room;
  panelKicker.textContent = room.kicker;
  panelTitle.textContent = room.title;
  panelDescription.textContent = room.description;
  panelLink.href = room.href;
  panelLink.textContent = `打开${room.title}入口`;
  roomButtons.forEach((button) => button.classList.toggle('is-active', button.dataset.room === room.id));
}

function animate() {
  requestAnimationFrame(animate);
  frameCount += 1;
  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsedTime += delta;

  updateMovement(delta);
  updateActiveRoom();

  if (ambientStars) ambientStars.rotation.y += delta * 0.006;
  animated.rings.forEach(({ mesh, speed }) => {
    mesh.rotation.z += delta * speed;
  });
  animated.floaters.forEach(({ mesh, baseY, offset }) => {
    mesh.position.y = baseY + Math.sin(elapsedTime * 1.2 + offset) * 0.075;
  });
  animated.pulseLights.forEach((light, index) => {
    light.intensity = 8 + Math.sin(elapsedTime * 1.4 + index) * 1.4;
  });
  animated.starMaps.forEach((map) => {
    map.rotation.y += delta * 0.018;
  });

  renderer.render(scene, camera);
}

function exposeDebugStats() {
  const counts = { meshes: 0, lines: 0, points: 0, lights: 0, groups: 0 };
  scene.traverse((object) => {
    if (object.isMesh) counts.meshes += 1;
    if (object.isLine) counts.lines += 1;
    if (object.isPoints) counts.points += 1;
    if (object.isLight) counts.lights += 1;
    if (object.isGroup) counts.groups += 1;
  });
  window.__spaceMuseumDebug = {
    version: 'high-fidelity-procedural-assets',
    rooms: rooms.map((room) => ({
      id: room.id,
      title: room.title,
      concept: room.concept,
      position: room.position.toArray()
    })),
    counts,
    get activeRoom() {
      return activeRoom.id;
    },
    get frameCount() {
      return frameCount;
    },
    get cameraPosition() {
      return camera.position.toArray();
    }
  };
  document.body.dataset.spaceDebugVersion = 'high-fidelity-procedural-assets';
  document.body.dataset.spaceDebugRooms = String(rooms.length);
  document.body.dataset.spaceDebugMeshes = String(counts.meshes);
  document.body.dataset.spaceDebugLines = String(counts.lines);
  document.body.dataset.spaceDebugPoints = String(counts.points);
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function isTouchDevice() {
  return window.matchMedia('(pointer: coarse)').matches;
}

function showError(error) {
  const message = document.createElement('p');
  message.className = 'space-error';
  message.textContent = `3D 展馆加载失败：${error.message}`;
  document.body.appendChild(message);
}
