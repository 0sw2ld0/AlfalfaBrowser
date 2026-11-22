import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { BrowserActivity } from "../../src/core/browser-activity.js";
import { Core } from "../../src/core/core.js";
import { tools } from "../../src/tools/index.js";

const home = mkdtempSync(join(tmpdir(), "browser-activity-"));
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

it("renders only in the target tab, preserves page input and removes the decoration", async () => {
  const tab = core.session.activeTab();
  const { page } = tab;
  expect(tab.activity).toBeUndefined();
  const other = await page.context().newPage();
  await page.route("https://activity.test/**", (route) => route.fulfill({
    contentType: "text/html",
    body: '<button style="position:fixed;bottom:10px;right:10px" onclick="this.textContent=\'Clicked\'">Click me</button>',
  }));
  try {
    await page.bringToFront();
    await page.goto("https://activity.test/first");
    const activity = new BrowserActivity(page);
    const overlay = page.locator("[data-alfalfabrowser-activity]");

    activity.start();
    await overlay.waitFor({ state: "visible" });
    expect(await overlay.getAttribute("aria-hidden")).toBe("true");
    expect(await overlay.evaluate((element) => getComputedStyle(element).pointerEvents)).toBe("none");
    expect(await other.locator("[data-alfalfabrowser-activity]").count()).toBe(0);
    await page.getByRole("button", { name: "Click me" }).click();
    expect(await page.getByRole("button").textContent()).toBe("Clicked");

    await page.goto("https://activity.test/second");
    await overlay.waitFor({ state: "visible" });
    const clean = await page.screenshot({ style: activity.screenshotStyle });
    await expect.poll(async () => clean.equals(await page.screenshot())).toBe(false);

    activity.finish();
    await overlay.waitFor({ state: "detached" });
    expect(clean.equals(await page.screenshot())).toBe(true);

    activity.start();
    await overlay.waitFor({ state: "visible" });
    activity.hide();
    await overlay.waitFor({ state: "detached" });
  } finally {
    await other.close();
  }
});
