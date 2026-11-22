import { randomUUID } from "node:crypto";
import type { Page } from "playwright-core";

const REFRESH_MS = 500;
const LEASE_MS = 2_000;
const FINISH_MS = 900;

export class BrowserActivity {
  private readonly id = randomUUID();
  private refreshTimer?: ReturnType<typeof setInterval>;
  private finishTimer?: ReturnType<typeof setTimeout>;
  private painting = false;

  constructor(private readonly page: Page) {
    page.on("framenavigated", (frame) => {
      if (frame === page.mainFrame() && this.refreshTimer) this.show();
    });
    page.once("close", () => this.clearTimers());
  }

  get screenshotStyle(): string {
    return `[data-alfalfabrowser-activity="${this.id}"] { visibility: hidden !important; }`;
  }

  start(): void {
    this.clearTimers();
    this.refreshTimer = setInterval(() => this.show(), REFRESH_MS);
    this.refreshTimer.unref();
    this.show();
  }

  finish(): void {
    clearTimeout(this.finishTimer);
    this.finishTimer = setTimeout(() => this.hide(), FINISH_MS);
    this.finishTimer.unref();
    this.show();
  }

  hide(): void {
    this.clearTimers();
    void this.paint(0);
  }

  private clearTimers(): void {
    clearInterval(this.refreshTimer);
    clearTimeout(this.finishTimer);
    this.refreshTimer = undefined;
    this.finishTimer = undefined;
  }

  private show(): void {
    if (this.painting) return;
    this.painting = true;
    void this.paint(LEASE_MS).finally(() => {
      this.painting = false;
      if (!this.refreshTimer && !this.finishTimer) void this.paint(0);
    });
  }

  private paint(lease: number): Promise<void> {
    // Decoration never waits on a page that is navigating or has a modal dialog open.
    return this.page.evaluate(({ id, lease }) => {
      const attribute = "data-alfalfabrowser-activity";
      const existing = document.querySelector<HTMLElement>(`[${attribute}="${id}"]`);
      if (!lease) {
        existing?.remove();
        return;
      }
      if (!document.documentElement || !["http:", "https:"].includes(location.protocol)) return;

      const overlay = existing ?? document.createElement("div");
      if (!existing) {
        overlay.setAttribute(attribute, id);
        overlay.setAttribute("aria-hidden", "true");
        overlay.inert = true;
        const frame = {
          position: "fixed",
          inset: "0",
          width: "auto",
          height: "auto",
          display: "block",
          margin: "0",
          padding: "0",
          border: "0",
          "border-radius": "10px",
          background: "transparent",
          "box-shadow": "inset 0 0 0 3px #64c756",
          "pointer-events": "none",
          "z-index": "2147483646",
        };
        for (const [name, value] of Object.entries(frame)) overlay.style.setProperty(name, value, "important");

        const badge = document.createElement("span");
        badge.textContent = "AlfalfaBrowser en uso";
        const badgeStyle = {
          all: "initial",
          visibility: "inherit",
          display: "block",
          position: "absolute",
          bottom: "12px",
          right: "12px",
          "max-width": "calc(100% - 24px)",
          "box-sizing": "border-box",
          padding: "5px 10px",
          "border-radius": "6px",
          background: "#1c4529",
          color: "#ffffff",
          font: "600 13px/1.4 system-ui, sans-serif",
          "box-shadow": "0 1px 4px #0005",
        };
        for (const [name, value] of Object.entries(badgeStyle)) badge.style.setProperty(name, value);
        overlay.attachShadow({ mode: "closed" }).append(badge);
        document.documentElement.append(overlay);
      }

      // Expire in the page too so the badge disappears if the daemon disconnects.
      for (const animation of overlay.getAnimations()) animation.cancel();
      const expiry = overlay.animate([{ opacity: 1 }], { duration: lease });
      void expiry.finished.then(() => overlay.remove(), () => {});
    }, { id: this.id, lease }).catch(() => {});
  }
}
