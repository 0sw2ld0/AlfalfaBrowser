import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { createServer, type Server } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, expect, it } from "vitest";
import { Core } from "../../src/core/core.js";
import type { Decision } from "../../src/core/security/approver.js";
import { tools } from "../../src/tools/index.js";

const home = mkdtempSync(join(tmpdir(), "cb-local-tab-"));
process.env.CUYBROWSER_HOME = home;
let site: string;
const approvals: string[] = [];
let decision: Decision = "denied";
let core: Core;
let server: Server;
let origin: string;

const page = `<!doctype html><title>Prueba local</title>
<input aria-label="Nombre"><input aria-label="Secreto" type="password">
<button onclick="this.textContent='Hecho'">Incrementar</button>
<a href="/redirect">Redirigir</a>`;

beforeAll(async () => {
  server = createServer((request, response) => {
    if (request.url === "/redirect") {
      response.writeHead(302, { Location: site });
      response.end();
    } else if (request.headers.host?.startsWith("externo.localhost:")) {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(`<button onclick="this.textContent='Hecho'">Externo</button>`);
    } else {
      response.writeHead(200, { "Content-Type": "text/html" });
      response.end(page);
    }
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  site = origin.replace("127.0.0.1", "externo.localhost");
  writeFileSync(join(home, "policy.yaml"), "approval: native-dialog\n");
  core = new Core(tools, { request: async ({ description }) => {
    approvals.push(description);
    return decision;
  } });
  expect(await core.call("start", { browser: "chrome", headless: true })).toMatchObject({ ok: true });
});

afterAll(async () => {
  await core?.session.stop();
  await new Promise<void>((resolve) => server?.close(() => resolve()));
  rmSync(home, { recursive: true, force: true });
});

async function ref(label: string): Promise<string> {
  const snapshot = await core.call("snapshot", {});
  if (!snapshot.ok) throw new Error(JSON.stringify(snapshot));
  const line = (snapshot.data as { text: string }).text.split("\n").find((line) => line.includes(label));
  const result = line?.match(/\[(e\d+)\]/)?.[1];
  if (!result) throw new Error(`Sin ref para ${label}: ${line}`);
  return result;
}

async function confirm(result: Awaited<ReturnType<Core["call"]>>) {
  expect(result).toMatchObject({ ok: false, error: { code: "CONFIRMATION_REQUIRED" } });
  if (result.ok || !result.error.confirmation) throw new Error(JSON.stringify(result));
  return core.call("confirm", { confirmation_id: result.error.confirmation.confirmation_id });
}

it("acota la aprobación a pestaña y origen, y vuelve a solo lectura después de un redirect", async () => {
  const tab = core.session.activeTab();
  expect(await core.call("navigate", { url: origin })).toMatchObject({ ok: true });

  const click = { tab: tab.id, origin, ref: await ref("Incrementar"), action: "click" };
  expect(await confirm(await core.call("local_tab_action", click)))
    .toMatchObject({ ok: false, error: { code: "CONFIRMATION_DENIED" } });
  expect(await tab.page.getByText("Incrementar").count()).toBe(1);

  decision = "approved";
  const input = { tab: tab.id, origin, ref: await ref("Nombre"), action: "type", text: "Luna" };
  expect(await confirm(await core.call("local_tab_action", input))).toMatchObject({ ok: true });
  expect(approvals.at(-1)).toContain(`pestaña ${tab.id} de ${origin}`);
  expect(await tab.page.getByRole("textbox").first().inputValue()).toBe("Luna");
  expect(await core.call("local_tab_action", { ...input, ref: await ref("Secreto") }))
    .toMatchObject({ ok: false, error: { code: "SENSITIVE_FIELD" } });
  expect(await core.call("local_tab_action", click)).toMatchObject({ ok: true });
  expect(await tab.page.getByText("Hecho").count()).toBe(1);
  expect(approvals).toHaveLength(2);

  const next = await core.session.newTab();
  await next.page.goto(origin);
  expect(await core.call("local_tab_action", click)).toMatchObject({ ok: false, error: { code: "BLOCKED_BY_POLICY" } });
  expect(await core.call("local_tab_action", { ...click, tab: next.id, ref: await ref("Incrementar") }))
    .toMatchObject({ ok: false, error: { code: "CONFIRMATION_REQUIRED" } });
  await core.call("tab_select", { id: tab.id });

  await tab.page.route("http://127.0.0.1:9999/", (route) =>
    route.fulfill({ contentType: "text/html", body: page }));
  await tab.page.goto("http://127.0.0.1:9999/");
  expect(await core.call("local_tab_action", click)).toMatchObject({ ok: false, error: { code: "BLOCKED_BY_POLICY" } });
  expect(await core.call("local_tab_action", { ...click, origin: "http://127.0.0.1:9999", ref: await ref("Incrementar") }))
    .toMatchObject({ ok: false, error: { code: "CONFIRMATION_REQUIRED" } });

  await tab.page.goto(origin);
  const redirect = { ...click, ref: await ref("Redirigir") };
  expect(await confirm(await core.call("local_tab_action", redirect))).toMatchObject({
    ok: true, data: { navigated: true, url: `${site}/` },
  });
  expect(await core.call("local_tab_action", { ...click, origin: site, ref: await ref("Externo") }))
    .toMatchObject({ ok: false, error: { code: "BLOCKED_BY_POLICY" } });
  expect(await tab.page.getByText("Externo").count()).toBe(1);
  await tab.page.goto(origin);
  expect(await core.call("local_tab_action", { ...click, ref: await ref("Incrementar") }))
    .toMatchObject({ ok: false, error: { code: "CONFIRMATION_REQUIRED" } });
});
