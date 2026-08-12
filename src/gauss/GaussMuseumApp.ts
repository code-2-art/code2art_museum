import { SparkRenderer, type SplatMesh } from "@sparkjsdev/spark";
import * as THREE from "three";
import { createGallerySplats, type GalleryRenderMode } from "./createGallerySplats";
import { AUTO_TOUR_PATH, CENTRAL_ARCHIVE, GALLERY_BOUNDS, GALLERY_COLORS, GALLERY_ZONES } from "./galleryData";

type DebugReceipt = {
  renderer: "Spark 2.1.0";
  source: "procedural-packed-splats" | "procedural-million-scan";
  splatCount: number;
  quality: "desktop" | "mobile";
  mode: GalleryRenderMode;
  zones: string[];
  frameCount: number;
  activeZone: string;
  cameraPosition: number[];
  autoTour: boolean;
};

declare global {
  interface Window {
    __gaussMuseumDebug?: DebugReceipt;
  }
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
const MODE_STORAGE_KEY = "code2art-gauss-render-mode-v1";

export class GaussMuseumApp {
  private readonly root: HTMLElement;
  private readonly canvas: HTMLCanvasElement;
  private readonly scene = new THREE.Scene();
  private readonly camera = new THREE.PerspectiveCamera(66, 1, 0.05, 140);
  private readonly player = new THREE.Vector3(0, 1.65, 5.2);
  private readonly keys = new Set<string>();
  private readonly manualInput = new THREE.Vector2();
  private readonly mobile: boolean;
  private readonly renderer: THREE.WebGLRenderer;
  private readonly spark: SparkRenderer;
  private splatMesh: SplatMesh;
  private readonly tourCurve = new THREE.CatmullRomCurve3([...AUTO_TOUR_PATH], true, "catmullrom", 0.24);
  private readonly loading: HTMLElement;
  private readonly loadingLabel: HTMLElement;
  private readonly zoneLabel: HTMLElement;
  private readonly qualityLabel: HTMLElement;
  private readonly autoTourButtons: HTMLButtonElement[];
  private readonly modeButtons: HTMLButtonElement[];
  private readonly helpDialog: HTMLDialogElement;
  private yaw = 0;
  private pitch = -0.04;
  private frameCount = 0;
  private fpsFrameCount = 0;
  private fpsSampleStart = performance.now();
  private autoTour = false;
  private tourProgress = 0;
  private activeZone = GALLERY_ZONES[0];
  private dragPointer: number | null = null;
  private dragX = 0;
  private dragY = 0;
  private joystickPointer: number | null = null;
  private contextLost = false;
  private lastRenderTime = 0;
  private splatCount: number;
  private readonly quality: "desktop" | "mobile";
  private mode: GalleryRenderMode;
  private switchingMode = false;

  constructor(root: HTMLElement) {
    this.root = root;
    this.canvas = this.requireElement<HTMLCanvasElement>("[data-gauss-canvas]");
    this.loading = this.requireElement<HTMLElement>("[data-gauss-loading]");
    this.loadingLabel = this.requireElement<HTMLElement>("[data-loading-label]");
    this.zoneLabel = this.requireElement<HTMLElement>("[data-zone-label]");
    this.qualityLabel = this.requireElement<HTMLElement>("[data-quality-label]");
    this.helpDialog = this.requireElement<HTMLDialogElement>("[data-help-dialog]");
    this.autoTourButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-auto-tour]"));
    this.modeButtons = Array.from(root.querySelectorAll<HTMLButtonElement>("[data-gallery-mode]"));
    this.mobile = matchMedia("(pointer: coarse), (max-width: 720px)").matches;
    this.mode = this.getInitialMode();
    if (this.mode === "concept") {
      this.player.set(0, 2.05, 6.1);
      this.pitch = 0.08;
    }
    this.camera.fov = this.mode === "concept" ? 66 : 62;

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: false,
      alpha: false,
      powerPreference: "high-performance"
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.setClearColor(GALLERY_COLORS.background, 1);
    this.renderer.setAnimationLoop((time) => this.render(time));

    this.spark = new SparkRenderer({
      renderer: this.renderer,
      maxStdDev: 2,
      minPixelRadius: this.mobile ? 0.6 : 0.42,
      maxPixelRadius: 420,
      focalAdjustment: 1.9,
      sortRadial: true,
      minSortIntervalMs: this.mobile ? 42 : 18
    });
    this.spark.name = "spark-gaussian-renderer";
    this.scene.add(this.spark);

    const gallery = createGallerySplats(this.mobile, this.mode, (progress) => this.updateLoadingProgress(progress));
    this.splatMesh = gallery.mesh;
    this.splatCount = gallery.count;
    this.quality = gallery.quality;
    this.mode = gallery.mode;
    this.scene.add(this.splatMesh);
    this.updateModeControls();

    this.camera.rotation.order = "YXZ";
    this.scene.background = GALLERY_COLORS.background;
    this.bindEvents();
    this.resize();
    this.updateCamera();
    this.updateDebugReceipt();
  }

  async initialize() {
    this.loadingLabel.textContent = this.mode === "concept" ? "正在重建百万级扫描…" : "正在生成高斯展厅…";
    await this.splatMesh.initialized;
    this.updateSplatBoundsReceipt();
    this.loadingLabel.textContent = `${this.splatCount.toLocaleString("zh-CN")} 个高斯点已就绪`;
    this.root.dataset.ready = "true";
    window.dispatchEvent(new CustomEvent("gauss-museum-ready", { detail: window.__gaussMuseumDebug }));
    window.setTimeout(() => this.loading.classList.add("is-hidden"), 450);
  }

  private updateSplatBoundsReceipt() {
    const bounds = this.splatMesh.getBoundingBox();
    this.root.dataset.splatBounds = [...bounds.min.toArray(), ...bounds.max.toArray()]
      .map((value) => Number(value.toFixed(2)))
      .join(",");
  }

  private getInitialMode(): GalleryRenderMode {
    try {
      return localStorage.getItem(MODE_STORAGE_KEY) === "concept" ? "concept" : "performance";
    } catch {
      return "performance";
    }
  }

  private updateLoadingProgress(progress: number) {
    if (this.mode !== "concept") return;
    this.loadingLabel.textContent = `正在重建百万级扫描 · ${Math.round(progress * 100)}%`;
  }

  private requireElement<T extends Element>(selector: string): T {
    const element = this.root.querySelector<T>(selector);
    if (!element) throw new Error(`Missing Gauss Museum element: ${selector}`);
    return element;
  }

  private bindEvents() {
    window.addEventListener("resize", () => this.resize());
    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        this.setAutoTour(false);
        event.preventDefault();
      }
      if (event.code === "KeyH") this.openHelp();
      if (event.code === "KeyT") this.setAutoTour(!this.autoTour);
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    document.addEventListener("pointerlockchange", () => {
      this.root.dataset.pointerLocked = String(document.pointerLockElement === this.canvas);
    });
    document.addEventListener("mousemove", (event) => {
      if (document.pointerLockElement === this.canvas) this.updateLook(event.movementX, event.movementY);
    });

    this.canvas.addEventListener("click", () => {
      if (!this.mobile && document.pointerLockElement !== this.canvas) this.canvas.requestPointerLock?.();
    });
    this.canvas.addEventListener("pointerdown", (event) => {
      if (!this.mobile) return;
      this.dragPointer = event.pointerId;
      this.dragX = event.clientX;
      this.dragY = event.clientY;
      this.canvas.setPointerCapture(event.pointerId);
    });
    this.canvas.addEventListener("pointermove", (event) => {
      if (event.pointerId !== this.dragPointer) return;
      this.updateLook(event.clientX - this.dragX, event.clientY - this.dragY);
      this.dragX = event.clientX;
      this.dragY = event.clientY;
    });
    this.canvas.addEventListener("pointerup", (event) => {
      if (event.pointerId === this.dragPointer) this.dragPointer = null;
    });
    this.canvas.addEventListener("pointercancel", () => { this.dragPointer = null; });
    this.canvas.addEventListener("webglcontextlost", (event) => {
      event.preventDefault();
      this.contextLost = true;
      this.root.dataset.contextLost = "true";
      this.qualityLabel.textContent = "图形上下文已暂停";
    });
    this.canvas.addEventListener("webglcontextrestored", () => {
      this.contextLost = false;
      this.root.dataset.contextLost = "false";
      this.qualityLabel.textContent = this.mobile ? "移动质量" : "高质量";
    });

    this.autoTourButtons.forEach((button) => button.addEventListener("click", (event) => {
      event.stopPropagation();
      this.setAutoTour(!this.autoTour);
    }));
    this.modeButtons.forEach((button) => button.addEventListener("click", (event) => {
      event.stopPropagation();
      const nextMode = button.dataset.galleryMode as GalleryRenderMode;
      void this.setGalleryMode(nextMode);
    }));
    this.root.querySelectorAll<HTMLButtonElement>("[data-open-help]").forEach((button) => {
      button.addEventListener("click", (event) => {
        event.stopPropagation();
        this.openHelp();
      });
    });
    this.requireElement<HTMLButtonElement>("[data-reset-view]").addEventListener("click", (event) => {
      event.stopPropagation();
      this.setAutoTour(false);
      this.yaw = 0;
      this.pitch = this.mode === "concept" ? 0.08 : -0.04;
    });
    this.requireElement<HTMLButtonElement>("[data-close-help]").addEventListener("click", () => this.helpDialog.close());
    this.helpDialog.addEventListener("click", (event) => {
      if (event.target === this.helpDialog) this.helpDialog.close();
    });
    this.bindJoystick();
  }

  private updateModeControls() {
    this.root.dataset.galleryMode = this.mode;
    this.modeButtons.forEach((button) => {
      const active = button.dataset.galleryMode === this.mode;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", String(active));
      button.disabled = this.switchingMode;
    });
  }

  private async setGalleryMode(nextMode: GalleryRenderMode) {
    if (nextMode === this.mode || this.switchingMode || !["performance", "concept"].includes(nextMode)) return;
    this.switchingMode = true;
    this.modeButtons.forEach((button) => { button.disabled = true; });
    this.loading.classList.remove("is-hidden");
    this.loadingLabel.textContent = nextMode === "concept" ? "正在重建百万级扫描 · 0%" : "正在恢复高性能版本…";

    const previousMesh = this.splatMesh;
    const previousMode = this.mode;
    this.mode = nextMode;
    try {
      const gallery = createGallerySplats(this.mobile, nextMode, (progress) => this.updateLoadingProgress(progress));
      await gallery.mesh.initialized;
      this.scene.add(gallery.mesh);
      this.scene.remove(previousMesh);
      previousMesh.dispose();
      this.splatMesh = gallery.mesh;
      this.splatCount = gallery.count;
      this.mode = gallery.mode;
      if (this.mode === "concept") {
        this.player.set(0, 2.05, 6.1);
        this.pitch = 0.08;
      } else {
        this.player.set(0, 1.65, 5.2);
        this.pitch = -0.04;
      }
      this.camera.fov = this.mode === "concept" ? 66 : 62;
      this.camera.updateProjectionMatrix();
      this.updateSplatBoundsReceipt();
      try { localStorage.setItem(MODE_STORAGE_KEY, this.mode); } catch { /* private browsing */ }
      this.loadingLabel.textContent = `${this.splatCount.toLocaleString("zh-CN")} 个高斯点已就绪`;
      this.updateDebugReceipt();
      window.dispatchEvent(new CustomEvent("gauss-museum-mode-change", { detail: window.__gaussMuseumDebug }));
      window.setTimeout(() => this.loading.classList.add("is-hidden"), 320);
    } catch (error) {
      this.mode = previousMode;
      this.loading.classList.add("is-hidden");
      this.qualityLabel.textContent = "版本切换失败 · 已保留当前场景";
      console.error("Failed to switch Gauss Museum mode", error);
    } finally {
      this.switchingMode = false;
      this.updateModeControls();
    }
  }

  private bindJoystick() {
    const joystick = this.requireElement<HTMLElement>("[data-joystick]");
    const knob = this.requireElement<HTMLElement>("[data-joystick-knob]");
    const reset = () => {
      this.joystickPointer = null;
      this.manualInput.set(0, 0);
      knob.style.transform = "translate3d(0, 0, 0)";
    };
    const update = (event: PointerEvent) => {
      const bounds = joystick.getBoundingClientRect();
      const radius = bounds.width * 0.32;
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const length = Math.max(1, Math.hypot(dx, dy));
      const scale = Math.min(1, radius / length);
      const x = dx * scale;
      const y = dy * scale;
      knob.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      this.manualInput.set(x / radius, -y / radius);
      this.setAutoTour(false);
    };
    joystick.addEventListener("pointerdown", (event) => {
      event.stopPropagation();
      this.joystickPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      update(event);
    });
    joystick.addEventListener("pointermove", (event) => {
      if (event.pointerId === this.joystickPointer) update(event);
    });
    joystick.addEventListener("pointerup", reset);
    joystick.addEventListener("pointercancel", reset);
  }

  private openHelp() {
    if (document.pointerLockElement === this.canvas) document.exitPointerLock();
    if (!this.helpDialog.open) this.helpDialog.showModal();
  }

  private setAutoTour(next: boolean) {
    this.autoTour = next;
    if (next) {
      const nearest = this.tourCurve.getSpacedPoints(160)
        .map((point, index) => ({ index, distance: point.distanceToSquared(this.player) }))
        .sort((a, b) => a.distance - b.distance)[0];
      this.tourProgress = nearest.index / 160;
    }
    this.autoTourButtons.forEach((button) => {
      button.classList.toggle("is-active", next);
      button.setAttribute("aria-pressed", String(next));
      const label = button.querySelector<HTMLElement>("[data-auto-tour-label]");
      if (label) label.textContent = next ? "停止导览" : "自动导览";
    });
  }

  private updateLook(dx: number, dy: number) {
    this.setAutoTour(false);
    this.yaw -= dx * (this.mobile ? 0.004 : 0.0022);
    this.pitch = clamp(this.pitch - dy * (this.mobile ? 0.0036 : 0.0019), -0.82, 0.58);
  }

  private updateMovement(delta: number) {
    if (this.autoTour) {
      this.tourProgress = (this.tourProgress + delta * 0.022) % 1;
      const target = this.tourCurve.getPointAt(this.tourProgress);
      const next = this.tourCurve.getPointAt((this.tourProgress + 0.008) % 1);
      this.player.lerp(target, 1 - Math.exp(-delta * 5));
      const direction = next.clone().sub(this.player);
      this.yaw = Math.atan2(direction.x, -direction.z);
      this.pitch = Math.atan2(direction.y, Math.hypot(direction.x, direction.z));
      return;
    }

    const input = this.manualInput.clone();
    if (this.keys.has("KeyW") || this.keys.has("ArrowUp")) input.y += 1;
    if (this.keys.has("KeyS") || this.keys.has("ArrowDown")) input.y -= 1;
    if (this.keys.has("KeyA") || this.keys.has("ArrowLeft")) input.x -= 1;
    if (this.keys.has("KeyD") || this.keys.has("ArrowRight")) input.x += 1;
    if (input.lengthSq() === 0) return;

    input.normalize();
    const forward = new THREE.Vector3(Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, Math.sin(this.yaw));
    const desired = this.player.clone()
      .addScaledVector(forward, input.y * delta * 5.2)
      .addScaledVector(right, input.x * delta * 5.2);
    this.player.copy(this.resolveCollision(desired));
  }

  private resolveCollision(desired: THREE.Vector3) {
    desired.x = clamp(desired.x, GALLERY_BOUNDS.min.x, GALLERY_BOUNDS.max.x);
    desired.z = clamp(desired.z, GALLERY_BOUNDS.min.y, GALLERY_BOUNDS.max.y);
    const dx = desired.x - CENTRAL_ARCHIVE.center.x;
    const dz = desired.z - CENTRAL_ARCHIVE.center.y;
    const distance = Math.hypot(dx, dz);
    if (distance < CENTRAL_ARCHIVE.radius) {
      const scale = CENTRAL_ARCHIVE.radius / Math.max(distance, 0.001);
      desired.x = CENTRAL_ARCHIVE.center.x + dx * scale;
      desired.z = CENTRAL_ARCHIVE.center.y + dz * scale;
    }
    desired.y = this.mode === "concept" ? 2.05 : 1.65;
    return desired;
  }

  private updateCamera() {
    this.camera.position.copy(this.player);
    this.camera.rotation.set(this.pitch, this.yaw, 0, "YXZ");
  }

  private updateZone() {
    let nearest = this.activeZone;
    let distance = Number.POSITIVE_INFINITY;
    for (const zone of GALLERY_ZONES) {
      const dx = zone.position.x - this.player.x;
      const dz = zone.position.z - this.player.z;
      const nextDistance = dx * dx + dz * dz;
      if (nextDistance < distance) {
        nearest = zone;
        distance = nextDistance;
      }
    }
    if (nearest !== this.activeZone) {
      this.activeZone = nearest;
      this.zoneLabel.animate([{ opacity: 0.3, transform: "translateY(5px)" }, { opacity: 1, transform: "translateY(0)" }], { duration: 360 });
      this.zoneLabel.textContent = nearest.label;
      this.root.dataset.activeZone = nearest.id;
    }
  }

  private updateFps(time: number) {
    this.fpsFrameCount += 1;
    const elapsed = time - this.fpsSampleStart;
    if (elapsed < 800) return;
    const fps = Math.round((this.fpsFrameCount * 1000) / elapsed);
    const label = this.mode === "concept" ? "概念高质量" : this.mobile ? "移动高性能" : "高性能";
    this.qualityLabel.textContent = `${label} · ${fps} FPS`;
    this.fpsFrameCount = 0;
    this.fpsSampleStart = time;
  }

  private updateDebugReceipt() {
    const receipt: DebugReceipt = {
      renderer: "Spark 2.1.0",
      source: this.mode === "concept" ? "procedural-million-scan" : "procedural-packed-splats",
      splatCount: this.splatCount,
      quality: this.quality,
      mode: this.mode,
      zones: GALLERY_ZONES.map((zone) => zone.id),
      frameCount: this.frameCount,
      activeZone: this.activeZone.id,
      cameraPosition: this.camera.position.toArray().map((value) => Number(value.toFixed(3))),
      autoTour: this.autoTour
    };
    window.__gaussMuseumDebug = receipt;
    this.root.dataset.splatSource = receipt.source;
    this.root.dataset.splatCount = String(receipt.splatCount);
    this.root.dataset.galleryMode = receipt.mode;
    this.root.dataset.frameCount = String(receipt.frameCount);
    this.root.dataset.cameraPosition = receipt.cameraPosition.join(",");
    this.root.dataset.autoTour = String(receipt.autoTour);
  }

  private render(time: number) {
    if (this.contextLost) return;
    const delta = this.lastRenderTime === 0 ? 1 / 60 : Math.min((time - this.lastRenderTime) / 1000, 0.05);
    this.lastRenderTime = time;
    this.frameCount += 1;
    this.updateMovement(delta);
    this.updateCamera();
    this.updateZone();
    this.updateFps(time);
    if (this.frameCount % 30 === 0) this.updateDebugReceipt();
    this.renderer.render(this.scene, this.camera);
  }

  private resize() {
    const width = Math.max(1, this.root.clientWidth);
    const height = Math.max(1, this.root.clientHeight);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, this.mobile ? 1.25 : 1.7);
    this.renderer.setPixelRatio(pixelRatio);
    this.renderer.setSize(width, height, false);
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }
}
