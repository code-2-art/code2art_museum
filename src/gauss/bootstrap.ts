import { GaussMuseumApp } from "./GaussMuseumApp";

const root = document.querySelector<HTMLElement>("[data-gauss-museum]");

if (root) {
  try {
    const app = new GaussMuseumApp(root);
    app.initialize().catch((error: unknown) => showFailure(root, error));
  } catch (error) {
    showFailure(root, error);
  }
}

function showFailure(root: HTMLElement, error: unknown) {
  console.error("Gauss Museum failed to initialize", error);
  root.dataset.failed = "true";
  const message = root.querySelector<HTMLElement>("[data-fallback-message]");
  if (message) {
    message.textContent = error instanceof Error
      ? `高斯展厅未能启动：${error.message}`
      : "高斯展厅未能启动。";
  }
}
