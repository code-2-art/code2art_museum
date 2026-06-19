import * as THREE from 'three';

const stage = document.querySelector('#space-stage');
const panelTitle = document.querySelector('#space-title');
const panelLink = document.querySelector('#active-link');
const enterButton = document.querySelector('#enter-roam');
const mobileButtons = document.querySelectorAll('[data-move]');

const portals = [
  {
    id: 'home',
    title: '首页广场',
    label: 'Home',
    description: '回到普通版首页，查看项目气质和历史节点。',
    href: '../index.html',
    position: new THREE.Vector3(0, 0, 8),
    color: 0x9ce37d
  },
  {
    id: 'exhibits',
    title: '展品星廊',
    label: 'Exhibits',
    description: '浏览第一批作品、项目、Prompt 和历史馆藏。',
    href: '../exhibits/index.html',
    position: new THREE.Vector3(-13, 0, -6),
    color: 0xff6b4a
  },
  {
    id: 'detail',
    title: '展品详情舱',
    label: 'Detail',
    description: '进入单件展品，查看作品、过程、代码与 Prompt 线索。',
    href: '../exhibits/c2a-001/index.html',
    position: new THREE.Vector3(13, 0, -6),
    color: 0xe7c15f
  },
  {
    id: 'profiles',
    title: '成员轨道',
    label: 'Profiles',
    description: '访问成员 Profile，连接身份、工具栈和代表作品。',
    href: '../profiles/index.html',
    position: new THREE.Vector3(-10, 0, 10),
    color: 0x7db8ff
  },
  {
    id: 'contributors',
    title: '贡献者墙',
    label: 'Builders',
    description: '查看贡献者墙，让参与者看到回报和署名。',
    href: '../contributors/index.html',
    position: new THREE.Vector3(10, 0, 10),
    color: 0xf2f0e6
  }
];

let renderer;
let scene;
let camera;
let lastFrameTime = performance.now();
let elapsedTime = 0;
let starField;
let portalGroups = [];
let activePortal = portals[0];
let yaw = 0;
let pitch = -0.08;
let isDragging = false;
let lastPointer = { x: 0, y: 0 };
const keys = new Set();
const mobileMoves = new Set();

const player = {
  position: new THREE.Vector3(0, 2.4, 18),
  velocity: new THREE.Vector3(),
  speed: 11
};

init();

function init() {
  try {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x07080b);
    scene.fog = new THREE.FogExp2(0x07080b, 0.018);

    camera = new THREE.PerspectiveCamera(68, window.innerWidth / window.innerHeight, 0.1, 240);

    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', preserveDrawingBuffer: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    stage.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('data-space-canvas', 'true');

    addWorld();
    addPortals();
    bindControls();
    setActivePortal(portals[0]);

    document.body.dataset.threeReady = 'true';
    window.__spaceReady = true;
    animate();
  } catch (error) {
    showError(error);
  }
}

function addWorld() {
  const ambient = new THREE.HemisphereLight(0xf2f0e6, 0x111827, 1.4);
  scene.add(ambient);

  const key = new THREE.DirectionalLight(0x9ce37d, 2.1);
  key.position.set(-8, 16, 7);
  scene.add(key);

  const warm = new THREE.PointLight(0xff6b4a, 26, 62, 1.8);
  warm.position.set(7, 9, 2);
  scene.add(warm);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(46, 96),
    new THREE.MeshStandardMaterial({
      color: 0x10141a,
      roughness: 0.92,
      metalness: 0.18
    })
  );
  floor.rotation.x = -Math.PI / 2;
  scene.add(floor);

  const grid = new THREE.GridHelper(92, 46, 0x9ce37d, 0x30363d);
  grid.material.opacity = 0.28;
  grid.material.transparent = true;
  scene.add(grid);

  const ringMaterial = new THREE.MeshBasicMaterial({ color: 0x9ce37d, wireframe: true, transparent: true, opacity: 0.16 });
  [13, 22, 33].forEach((radius, index) => {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.018, 8, 160), ringMaterial.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = 0.04 + index * 0.03;
    scene.add(ring);
  });

  starField = createStars();
  scene.add(starField);

  const central = new THREE.Mesh(
    new THREE.IcosahedronGeometry(1.35, 1),
    new THREE.MeshStandardMaterial({ color: 0xf2f0e6, emissive: 0x24331d, roughness: 0.36, metalness: 0.28 })
  );
  central.position.set(0, 2.5, 0);
  central.name = 'museum-core';
  scene.add(central);
}

function createStars() {
  const geometry = new THREE.BufferGeometry();
  const positions = [];
  const colors = [];
  const palette = [new THREE.Color(0x9ce37d), new THREE.Color(0xff6b4a), new THREE.Color(0xe7c15f), new THREE.Color(0xf2f0e6)];
  for (let i = 0; i < 900; i += 1) {
    const radius = 34 + Math.random() * 78;
    const angle = Math.random() * Math.PI * 2;
    const height = 4 + Math.random() * 52;
    positions.push(Math.cos(angle) * radius, height, Math.sin(angle) * radius);
    const color = palette[i % palette.length];
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  return new THREE.Points(
    geometry,
    new THREE.PointsMaterial({ size: 0.08, vertexColors: true, transparent: true, opacity: 0.82 })
  );
}

function addPortals() {
  portalGroups = portals.map((portal, index) => {
    const group = new THREE.Group();
    group.position.copy(portal.position);
    group.userData.portal = portal;

    const color = new THREE.Color(portal.color);
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(2.25, 0.06, 14, 80),
      new THREE.MeshStandardMaterial({ color, emissive: color.clone().multiplyScalar(0.45), roughness: 0.42, metalness: 0.3 })
    );
    ring.position.y = 2.7;
    ring.rotation.y = index * 0.35;
    ring.userData.portal = portal;
    group.add(ring);

    const gate = new THREE.Mesh(
      new THREE.BoxGeometry(3.6, 3.1, 0.16),
      new THREE.MeshStandardMaterial({ color: 0x151922, emissive: color.clone().multiplyScalar(0.08), roughness: 0.68, metalness: 0.22 })
    );
    gate.position.y = 2.1;
    gate.userData.portal = portal;
    group.add(gate);

    const label = new THREE.Mesh(
      new THREE.PlaneGeometry(3.45, 1.16),
      new THREE.MeshBasicMaterial({ map: createLabelTexture(portal), transparent: true, side: THREE.DoubleSide, depthTest: false, depthWrite: false })
    );
    label.position.set(0, 2.32, 0.22);
    label.rotation.y = Math.PI;
    label.renderOrder = 10;
    label.userData.portal = portal;
    group.add(label);

    const plinth = new THREE.Mesh(
      new THREE.CylinderGeometry(2.1, 2.4, 0.55, 40),
      new THREE.MeshStandardMaterial({ color: 0x222824, roughness: 0.78, metalness: 0.26 })
    );
    plinth.position.y = 0.28;
    group.add(plinth);

    const beam = new THREE.PointLight(portal.color, 3.2, 13, 2);
    beam.position.set(0, 3.7, 0);
    group.add(beam);

    group.lookAt(0, 1.4, 0);
    scene.add(group);
    return group;
  });
}

function createLabelTexture(portal) {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 360;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = 'rgba(11, 12, 16, 0.86)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = '#9ce37d';
  ctx.lineWidth = 8;
  ctx.strokeRect(18, 18, canvas.width - 36, canvas.height - 36);
  ctx.fillStyle = '#9ce37d';
  ctx.font = '700 42px Arial, sans-serif';
  ctx.fillText(portal.label.toUpperCase(), 56, 90);
  ctx.fillStyle = '#f2f0e6';
  ctx.font = '700 72px Arial, sans-serif';
  wrapText(ctx, portal.title, 56, 178, 900, 76);
  ctx.fillStyle = '#b8b4a8';
  ctx.font = '400 34px Arial, sans-serif';
  wrapText(ctx, portal.description, 56, 274, 900, 42);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
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
      window.location.href = activePortal.href;
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
  panelLink.addEventListener('click', (event) => {
    if (!activePortal?.href) {
      event.preventDefault();
    }
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

function updateMovement(delta) {
  const forward = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw) * -1).normalize();
  const right = new THREE.Vector3(Math.cos(yaw), 0, Math.sin(yaw)).normalize();
  const move = new THREE.Vector3();

  if (keys.has('KeyW') || keys.has('ArrowUp') || mobileMoves.has('forward')) move.add(forward);
  if (keys.has('KeyS') || keys.has('ArrowDown') || mobileMoves.has('back')) move.sub(forward);
  if (keys.has('KeyD') || keys.has('ArrowRight') || mobileMoves.has('right')) move.add(right);
  if (keys.has('KeyA') || keys.has('ArrowLeft') || mobileMoves.has('left')) move.sub(right);

  if (move.lengthSq() > 0) {
    move.normalize().multiplyScalar(player.speed * delta);
    player.position.add(move);
    const radius = Math.sqrt(player.position.x * player.position.x + player.position.z * player.position.z);
    if (radius > 38) {
      player.position.x *= 38 / radius;
      player.position.z *= 38 / radius;
    }
  }

  camera.position.copy(player.position);
  camera.rotation.order = 'YXZ';
  camera.rotation.y = yaw;
  camera.rotation.x = pitch;
}

function updateActivePortal() {
  let closest = portals[0];
  let closestDistance = Infinity;
  for (const portal of portals) {
    const distance = portal.position.distanceTo(player.position);
    if (distance < closestDistance) {
      closestDistance = distance;
      closest = portal;
    }
  }
  if (closest !== activePortal) {
    setActivePortal(closest);
  }
}

function setActivePortal(portal) {
  activePortal = portal;
  panelTitle.textContent = portal.title;
  panelLink.href = portal.href;
  panelLink.textContent = `进入${portal.title}`;
}

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  elapsedTime += delta;
  updateMovement(delta);
  updateActivePortal();

  if (starField) {
    starField.rotation.y += delta * 0.018;
  }
  portalGroups.forEach((group, index) => {
    const ring = group.children[0];
    ring.rotation.z += delta * (0.35 + index * 0.03);
    group.position.y = Math.sin(elapsedTime * 0.75 + index) * 0.08;
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
