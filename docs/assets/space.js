import * as THREE from 'three';

const stage = document.querySelector('#space-stage');
const panelKicker = document.querySelector('#space-kicker');
const panelTitle = document.querySelector('#space-title');
const panelDescription = document.querySelector('#space-description');
const panelLink = document.querySelector('#active-link');
const enterButton = document.querySelector('#enter-roam');
const mobileButtons = document.querySelectorAll('[data-move]');
const roomButtons = document.querySelectorAll('[data-room]');

const roomDefinitions = [
  {
    id: 'atrium',
    kicker: 'Museum Agent Atrium',
    title: '导览大厅',
    label: 'AI-Native Archive Atrium',
    description: '主入口、Museum Agent 导览台与全馆空间索引。作品、项目、Prompt、Skill、成员、历史和建设现场在这里被组织成可选择的路线。',
    href: '../archive/index.html',
    image: '../assets/space-concepts/ai-native-archive-atrium.jpg',
    position: new THREE.Vector3(0, 0, 0),
    color: 0xff6b4a,
    secondary: 0x9ce37d,
    nodes: ['Works', 'Projects', 'Prompts', 'Skills', 'Members', 'History']
  },
  {
    id: 'construction',
    kicker: 'Human on the Loop',
    title: '建设现场展厅',
    label: 'AI Construction Site Museum',
    description: '把博物馆的生成过程本身作为展品：Prompt、Skill、代码、测试、提交记录、策展决策和贡献记录共同形成一条建设路线。',
    href: '../progress/index.html',
    image: '../assets/space-concepts/ai-construction-site-museum.jpg',
    position: new THREE.Vector3(-27, 0, -26),
    color: 0xe7c15f,
    secondary: 0xff6b4a,
    nodes: ['Prompt', 'Source', 'Skill', 'Commit', 'Validate', 'Curate']
  },
  {
    id: 'starmap',
    kicker: 'Community Star Map',
    title: '社群星图展厅',
    label: 'Community Star-Map Museum',
    description: '把作品、项目、成员、历史、研究问题和未来方向转译成社群关系星图。Museum Agent 可以生成 5 分钟、15 分钟或研究路线。',
    href: '../members/index.html',
    image: '../assets/space-concepts/community-star-map-museum.jpg',
    position: new THREE.Vector3(27, 0, -26),
    color: 0x9ce37d,
    secondary: 0xe7c15f,
    nodes: ['HUDOIT', 'Works', 'Tools', 'AI Native', 'Community', 'Future']
  }
];

let renderer;
let scene;
let camera;
let textureLoader;
let lastFrameTime = performance.now();
let elapsedTime = 0;
let starField;
let activeRoom = roomDefinitions[0];
let yaw = 0;
let pitch = -0.08;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };

const keys = new Set();
const mobileMoves = new Set();
const animated = {
  rings: [],
  pulses: [],
  stars: []
};

const player = {
  position: new THREE.Vector3(0, 2.5, 22),
  speed: 12.5
};

init();

function init() {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080b);
    scene.fog = new THREE.FogExp2(0x07080b, 0.012);
    textureLoader = new THREE.TextureLoader();

    camera = new THREE.PerspectiveCamera(66, window.innerWidth / window.innerHeight, 0.1, 260);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.setAttribute('data-space-canvas', 'true');
    stage.appendChild(renderer.domElement);

    addWorld();
    roomDefinitions.forEach((room, index) => addRoom(room, index));
    addWayfindingPaths();
    bindControls();
    setActiveRoom(roomDefinitions[0], true);

    document.body.dataset.threeReady = 'true';
    window.__spaceReady = true;
    animate();
  } catch (error) {
    showError(error);
  }
}

function addWorld() {
  scene.add(new THREE.HemisphereLight(0xf2f0e6, 0x14181c, 1.6));

  const key = new THREE.DirectionalLight(0xf2f0e6, 2.3);
  key.position.set(-12, 20, 14);
  scene.add(key);

  const red = new THREE.PointLight(0xff6b4a, 34, 70, 1.6);
  red.position.set(0, 9, 3);
  scene.add(red);

  const green = new THREE.PointLight(0x9ce37d, 26, 80, 1.7);
  green.position.set(16, 10, -22);
  scene.add(green);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(96, 82),
    new THREE.MeshStandardMaterial({ color: 0x111316, roughness: 0.84, metalness: 0.08 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.z = -12;
  scene.add(floor);

  const grid = new THREE.GridHelper(96, 48, 0xb8b4a8, 0x2f3436);
  grid.position.z = -12;
  grid.material.opacity = 0.16;
  grid.material.transparent = true;
  scene.add(grid);

  starField = createAmbientStars();
  scene.add(starField);

  const titlePanel = new THREE.Mesh(
    new THREE.PlaneGeometry(16, 2.2),
    new THREE.MeshBasicMaterial({ map: createTextTexture('code2art museum', 'AI 原生 3D 展馆', '#f2f0e6', '#ff6b4a'), transparent: true, side: THREE.DoubleSide })
  );
  titlePanel.position.set(0, 7.2, 16);
  titlePanel.rotation.x = -0.1;
  scene.add(titlePanel);
}

function addRoom(room, index) {
  const group = new THREE.Group();
  group.position.copy(room.position);
  group.userData.room = room;
  scene.add(group);

  const color = new THREE.Color(room.color);
  const secondary = new THREE.Color(room.secondary);

  addRoomShell(group, color, secondary);
  addConceptPoster(group, room);
  addRoomTitle(group, room, color);
  addAgentCore(group, room, index);
  addArchiveNodes(group, room, color, secondary);

  if (room.id === 'construction') {
    addConstructionLanguage(group, color);
  }
  if (room.id === 'starmap') {
    addStarMapLanguage(group, color, secondary);
  }
}

function addRoomShell(group, color, secondary) {
  const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x1a1d1d, roughness: 0.8, metalness: 0.15 });
  const platform = new THREE.Mesh(new THREE.BoxGeometry(20, 0.35, 15), floorMaterial);
  platform.position.y = 0.05;
  group.add(platform);

  const wallMaterial = new THREE.MeshStandardMaterial({ color: 0x2c2c2a, roughness: 0.72, metalness: 0.08 });
  const backWall = new THREE.Mesh(new THREE.BoxGeometry(20, 7, 0.42), wallMaterial);
  backWall.position.set(0, 3.5, -7.3);
  group.add(backWall);

  const leftWall = new THREE.Mesh(new THREE.BoxGeometry(0.42, 5.4, 15), wallMaterial);
  leftWall.position.set(-10.2, 2.7, 0);
  group.add(leftWall);

  const rightWall = leftWall.clone();
  rightWall.position.x = 10.2;
  group.add(rightWall);

  const lintel = new THREE.Mesh(
    new THREE.BoxGeometry(20.8, 0.22, 0.32),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.72 })
  );
  lintel.position.set(0, 7.05, -7.02);
  group.add(lintel);

  [-6.5, 0, 6.5].forEach((x) => {
    const uplight = new THREE.PointLight(secondary, 3.6, 12, 2);
    uplight.position.set(x, 2.5, -5.6);
    group.add(uplight);
  });
}

function addConceptPoster(group, room) {
  const texture = textureLoader.load(room.image);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;

  const poster = new THREE.Mesh(
    new THREE.PlaneGeometry(10.8, 6.08),
    new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
  );
  poster.position.set(0, 3.65, -7.06);
  poster.renderOrder = 2;
  group.add(poster);

  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(11.25, 6.5, 0.1),
    new THREE.MeshBasicMaterial({ color: 0xf2f0e6, transparent: true, opacity: 0.08 })
  );
  frame.position.set(0, 3.65, -7.12);
  group.add(frame);
}

function addRoomTitle(group, room, color) {
  const label = new THREE.Mesh(
    new THREE.PlaneGeometry(9.4, 1.9),
    new THREE.MeshBasicMaterial({ map: createRoomLabelTexture(room, color), transparent: true, side: THREE.DoubleSide, depthWrite: false })
  );
  label.position.set(0, 6.95, -6.74);
  label.renderOrder = 4;
  group.add(label);
}

function addAgentCore(group, room, index) {
  const color = new THREE.Color(room.color);
  const core = new THREE.Mesh(
    new THREE.IcosahedronGeometry(0.72, 2),
    new THREE.MeshStandardMaterial({ color: 0xf2f0e6, emissive: color.clone().multiplyScalar(0.36), roughness: 0.28, metalness: 0.2 })
  );
  core.position.set(0, 1.45, 1.5);
  group.add(core);
  animated.pulses.push({ mesh: core, offset: index * 0.9, base: 0.72 });

  [1.8, 2.8, 4.1].forEach((radius, ringIndex) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.018, 8, 128),
      new THREE.MeshBasicMaterial({ color: room.color, transparent: true, opacity: 0.38 - ringIndex * 0.07 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.26 + ringIndex * 0.035, 1.5);
    group.add(ring);
    animated.rings.push({ mesh: ring, speed: 0.14 + ringIndex * 0.08, offset: index });
  });

  const prompt = new THREE.Mesh(
    new THREE.PlaneGeometry(5.8, 0.82),
    new THREE.MeshBasicMaterial({ map: createTextTexture('Museum Agent', 'personalized route ready', '#f2f0e6', '#b8b4a8'), transparent: true, depthWrite: false })
  );
  prompt.position.set(0, 2.55, 1.5);
  prompt.renderOrder = 3;
  group.add(prompt);
}

function addArchiveNodes(group, room, color, secondary) {
  const center = new THREE.Vector3(0, 0.45, 1.5);
  const radius = room.id === 'starmap' ? 5.8 : 4.7;

  room.nodes.forEach((label, nodeIndex) => {
    const angle = -Math.PI * 0.88 + (nodeIndex / room.nodes.length) * Math.PI * 1.76;
    const x = Math.cos(angle) * radius;
    const z = 1.4 + Math.sin(angle) * radius * 0.78;
    const nodePosition = new THREE.Vector3(x, 0.56, z);
    const nodeColor = nodeIndex % 2 === 0 ? color : secondary;

    const node = new THREE.Mesh(
      new THREE.CylinderGeometry(0.46, 0.62, 0.24, 32),
      new THREE.MeshStandardMaterial({ color: 0x232523, emissive: nodeColor.clone().multiplyScalar(0.2), roughness: 0.44, metalness: 0.22 })
    );
    node.position.copy(nodePosition);
    group.add(node);

    const halo = new THREE.Mesh(
      new THREE.TorusGeometry(0.94, 0.018, 6, 72),
      new THREE.MeshBasicMaterial({ color: nodeColor, transparent: true, opacity: 0.56 })
    );
    halo.rotation.x = Math.PI / 2;
    halo.position.copy(nodePosition);
    halo.position.y = 0.73;
    group.add(halo);
    animated.rings.push({ mesh: halo, speed: 0.22 + nodeIndex * 0.018, offset: nodeIndex });

    const labelPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(2.05, 0.64),
      new THREE.MeshBasicMaterial({ map: createSmallLabelTexture(label, nodeColor), transparent: true, side: THREE.DoubleSide, depthWrite: false })
    );
    labelPlane.position.set(x, 1.25, z);
    labelPlane.rotation.x = -0.24;
    group.add(labelPlane);

    addLine(group, center, nodePosition, nodeColor, 0.48);
  });
}

function addConstructionLanguage(group, color) {
  const railMaterial = new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.5 });

  for (let i = 0; i < 7; i += 1) {
    const x = -7 + i * 2.3;
    const column = new THREE.Mesh(new THREE.BoxGeometry(0.08, 4.5, 0.08), railMaterial);
    column.position.set(x, 2.4, -1.8);
    group.add(column);
  }

  [1.4, 2.6, 3.8].forEach((y) => {
    const beam = new THREE.Mesh(new THREE.BoxGeometry(15, 0.055, 0.055), railMaterial);
    beam.position.set(0, y, -1.8);
    group.add(beam);
  });

  ['BUILD LOG', 'TEST / VALIDATION', 'CURATORIAL DECISION'].forEach((label, i) => {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.4, 1.2),
      new THREE.MeshBasicMaterial({ map: createSmallLabelTexture(label, new THREE.Color(0xe7c15f)), transparent: true, depthWrite: false })
    );
    panel.position.set(-5.3 + i * 5.3, 2.8 + (i % 2) * 0.55, -1.55);
    panel.renderOrder = 5;
    group.add(panel);
  });
}

function addStarMapLanguage(group, color, secondary) {
  const points = [];
  for (let i = 0; i < 80; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.sqrt(Math.random()) * 7.1;
    points.push(new THREE.Vector3(Math.cos(angle) * radius, 0.72, 1.1 + Math.sin(angle) * radius * 0.82));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const stars = new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ color, size: 0.07, transparent: true, opacity: 0.86 })
  );
  group.add(stars);
  animated.stars.push(stars);

  for (let i = 0; i < points.length - 1; i += 7) {
    addLine(group, points[i], points[i + 1], i % 2 ? color : secondary, 0.22);
  }

  [2.8, 4.8, 6.8].forEach((radius, i) => {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(radius, 0.012, 6, 160),
      new THREE.MeshBasicMaterial({ color: i % 2 ? secondary : color, transparent: true, opacity: 0.18 })
    );
    ring.rotation.x = Math.PI / 2;
    ring.position.set(0, 0.78 + i * 0.025, 1.1);
    group.add(ring);
    animated.rings.push({ mesh: ring, speed: 0.05 + i * 0.025, offset: i });
  });
}

function addWayfindingPaths() {
  const hub = new THREE.Vector3(0, 0.18, 8);
  roomDefinitions.forEach((room) => {
    const entry = room.position.clone().add(new THREE.Vector3(0, 0.18, 6.5));
    addLine(scene, hub, entry, new THREE.Color(room.color), 0.62);
  });
}

function createAmbientStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const palette = [new THREE.Color(0x9ce37d), new THREE.Color(0xff6b4a), new THREE.Color(0xe7c15f), new THREE.Color(0xf2f0e6)];

  for (let i = 0; i < 1200; i += 1) {
    const radius = 38 + Math.random() * 84;
    const angle = Math.random() * Math.PI * 2;
    const height = 5 + Math.random() * 55;
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius - 18);
    const color = palette[i % palette.length];
    colors.push(color.r, color.g, color.b);
  }

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 0.075, vertexColors: true, transparent: true, opacity: 0.62 })
  );
}

function addLine(parent, from, to, color, opacity) {
  const geometry = new THREE.BufferGeometry().setFromPoints([from, to]);
  const line = new THREE.Line(
    geometry,
    new THREE.LineBasicMaterial({ color, transparent: true, opacity })
  );
  parent.add(line);
  return line;
}

function createRoomLabelTexture(room, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 1200;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(7, 8, 11, 0.72)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = `#${color.getHexString()}`;
  ctx.lineWidth = 6;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = `#${color.getHexString()}`;
  ctx.font = '700 42px Arial, sans-serif';
  ctx.fillText(room.kicker.toUpperCase(), 58, 88);
  ctx.fillStyle = '#f2f0e6';
  ctx.font = '700 72px Arial, sans-serif';
  ctx.fillText(room.label, 58, 178);
  ctx.fillStyle = '#b8b4a8';
  ctx.font = '400 36px Arial, sans-serif';
  wrapText(ctx, room.description, 58, 250, 1080, 46);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

function createTextTexture(title, detail, titleColor = '#f2f0e6', detailColor = '#b8b4a8') {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(7, 8, 11, 0.72)';
  roundRect(ctx, 18, 18, canvas.width - 36, canvas.height - 36, 34);
  ctx.fill();
  ctx.fillStyle = titleColor;
  ctx.font = '700 62px Georgia, serif';
  ctx.fillText(title, 76, 112);
  ctx.fillStyle = detailColor;
  ctx.font = '400 34px Arial, sans-serif';
  ctx.fillText(detail, 78, 172);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createSmallLabelTexture(label, color) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 180;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(10, 12, 16, 0.78)';
  roundRect(ctx, 18, 20, canvas.width - 36, canvas.height - 40, 18);
  ctx.fill();
  ctx.strokeStyle = `#${color.getHexString()}`;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = '#f2f0e6';
  ctx.font = '700 42px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(label, canvas.width / 2, 108);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
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

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
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
      const room = roomDefinitions.find((item) => item.id === button.dataset.room);
      if (room) {
        focusRoom(room);
      }
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
  yaw -= dx * 0.0024;
  pitch -= dy * 0.0021;
  pitch = Math.max(-0.82, Math.min(0.52, pitch));
}

function focusRoom(room) {
  const target = room.position.clone();
  player.position.set(target.x, 2.5, target.z + 12);
  yaw = Math.atan2(target.x - player.position.x, -(target.z - player.position.z));
  pitch = -0.11;
  setActiveRoom(room, true);
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
    player.position.x = Math.max(-43, Math.min(43, player.position.x));
    player.position.z = Math.max(-45, Math.min(28, player.position.z));
  }

  camera.position.copy(player.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function updateActiveRoom() {
  let closest = roomDefinitions[0];
  let closestDistance = Infinity;

  roomDefinitions.forEach((room) => {
    const distance = room.position.distanceTo(player.position);
    if (distance < closestDistance) {
      closest = room;
      closestDistance = distance;
    }
  });

  if (closest !== activeRoom) {
    setActiveRoom(closest);
  }
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
  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsedTime += delta;

  updateMovement(delta);
  updateActiveRoom();

  if (starField) starField.rotation.y += delta * 0.012;

  animated.rings.forEach(({ mesh, speed, offset }) => {
    mesh.rotation.z += delta * speed;
    mesh.material.opacity = Math.max(0.09, mesh.material.opacity + Math.sin(elapsedTime + offset) * 0.0008);
  });

  animated.pulses.forEach(({ mesh, offset, base }) => {
    const scale = 1 + Math.sin(elapsedTime * 1.7 + offset) * 0.05;
    mesh.scale.setScalar(scale * base / 0.72);
  });

  animated.stars.forEach((stars, index) => {
    stars.rotation.y += delta * (0.018 + index * 0.005);
  });

  renderer.render(scene, camera);
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
