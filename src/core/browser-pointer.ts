import { randomUUID } from "node:crypto";
import type { Page } from "playwright-core";

// Geometry and colors from AlfalfaDesktop 0.1.1 (MIT), with Y pointing down for SVG.
// The path starts at the input point. Scaling its 28-unit height yields an 18px leaf.
const LEAF_PATH = [
  "M 0 0 C 10 1 15 4 16 11 C 19 7 23 7 27 8 C 27 15 23 20 18 21 L 23 25",
  "C 23 27 22 28 20 28 L 14 22 C 11 25 6 25 2 24 C 2 19 3 15 6 13 C 2 10 0 4 0 0 Z",
].join(" ");
const VEIN_PATH = "M 19 24 C 15 18 10 13 4 5 M 14 18 C 17 18 21 14 23 12 M 12 15 C 10 17 8 19 6 20";

export class BrowserPointer {
  private readonly id = randomUUID();

  constructor(private readonly page: Page) {}

  get screenshotStyle(): string {
    return `[data-alfalfabrowser-pointer="${this.id}"] { visibility: hidden !important; }`;
  }

  show(point: { x: number; y: number }, click: boolean): void {
    // Input must still complete if a navigation or dialog prevents the decoration from rendering.
    void this.page.evaluate(({ id, x, y, click, leafPath, veinPath }) => {
      const size = 64;
      const tipX = 14;
      const tipY = 18;
      const scale = 18 / 28;
      const green = "#5cb84a";
      const attributeName = "data-alfalfabrowser-pointer";
      const viewport = document.documentElement;
      if (!viewport || document.visibilityState !== "visible") return;

      viewport.querySelector(`[${attributeName}="${id}"]`)?.remove();
      const overlay = document.createElement("div");
      overlay.setAttribute(attributeName, id);
      overlay.setAttribute("aria-hidden", "true");
      overlay.inert = true;
      const geometry = {
        position: "fixed",
        top: `${y - tipY}px`,
        left: `${x - tipX}px`,
        right: "auto",
        bottom: "auto",
        width: `${size}px`,
        height: `${size}px`,
        margin: "0",
        padding: "0",
        border: "0",
        background: "transparent",
        display: "block",
        "pointer-events": "none",
        "z-index": "2147483647",
      };
      for (const [name, value] of Object.entries(geometry)) overlay.style.setProperty(name, value, "important");

      const shadow = overlay.attachShadow({ mode: "closed" });
      const svgElement = (name: string, attributes: Record<string, string>) => {
        const element = document.createElementNS("http://www.w3.org/2000/svg", name);
        for (const [key, value] of Object.entries(attributes)) element.setAttribute(key, value);
        return element;
      };
      const image = svgElement("svg", { width: String(size), height: String(size), viewBox: `0 0 ${size} ${size}` });
      shadow.append(image);
      if (click) {
        const ring = svgElement("circle", {
          cx: String(tipX), cy: String(tipY), r: "4", fill: "none", stroke: green, "stroke-width": "1.25",
        });
        image.append(ring);
        ring.animate([{ r: "4px", opacity: 0.42 }, { r: "14px", opacity: 0 }], { duration: 500, fill: "forwards" });
      }
      const leaf = svgElement("g", { transform: `translate(${tipX} ${tipY}) scale(${scale})` });
      const stroke = { "vector-effect": "non-scaling-stroke", "stroke-linejoin": "round" };
      leaf.append(
        svgElement("path", {
          ...stroke, d: leafPath, fill: green, stroke: "#000000", "stroke-opacity": "0.62", "stroke-width": "2.25",
        }),
        svgElement("path", { ...stroke, d: leafPath, fill: "none", stroke: "#ffffff", "stroke-width": "1" }),
        svgElement("path", {
          ...stroke, d: veinPath, fill: "none", stroke: "#ffffff", "stroke-opacity": "0.78",
          "stroke-width": "0.8", "stroke-linecap": "round",
        }),
      );
      image.append(leaf);
      viewport.append(overlay);
      const fade = overlay.animate([{ opacity: 1, offset: 0.7 }, { opacity: 0 }], { duration: 1_550 });
      void fade.finished.then(() => overlay.remove(), () => overlay.remove());
    }, { id: this.id, ...point, click, leafPath: LEAF_PATH, veinPath: VEIN_PATH }).catch(() => {});
  }
}
