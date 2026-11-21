import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { BrowserPointer } from "../../src/core/browser-pointer.js";
import { Core } from "../../src/core/core.js";
import { tools } from "../../src/tools/index.js";

const home = mkdtempSync(join(tmpdir(), "browser-pointer-"));
process.env.CUYBROWSER_HOME = home;
let core: Core;

beforeAll(async () => {
  core = new Core(tools, { request: async () => "denied" });
  const result = await core.call("start", { headless: true });
  expect(result.ok, JSON.stringify(result)).toBe(true);
}, 60_000);

afterAll(async () => {
  await core?.shutdown();
  rmSync(home, { recursive: true, force: true });
});

it("anchors the leaf to the click without blocking input or changing a tool screenshot", async () => {
  const tab = core.session.activeTab();
  const { page } = tab;
  expect(tab.pointer).toBeUndefined();
  await page.setContent(`
    <button style="position:absolute;top:50px;left:50px;width:100px;height:80px"
            onclick="this.textContent='Clicked'">Click me</button>
  `);
  const point = { x: 100, y: 90 };
  const pointer = new BrowserPointer(page);
  pointer.show(point, true);
  const overlay = page.locator("[data-alfalfabrowser-pointer]");
  await overlay.waitFor({ state: "visible" });
  const bounds = await overlay.boundingBox();
  expect(bounds).toEqual({ x: point.x - 14, y: point.y - 18, width: 64, height: 64 });
  expect(await overlay.getAttribute("aria-hidden")).toBe("true");
  expect(await overlay.evaluate((element) => (element as HTMLElement).inert)).toBe(true);
  await page.mouse.click(point.x, point.y);
  expect(await page.getByRole("button").textContent()).toBe("Clicked");
  const visible = await page.screenshot();
  const toolCapture = await page.screenshot({ style: pointer.screenshotStyle });
  expect(toolCapture.equals(visible)).toBe(false);
  await overlay.waitFor({ state: "detached" });
  expect(toolCapture.equals(await page.screenshot())).toBe(true);
});
