import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { createServer } from "node:http";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";

const execute = promisify(execFile);
const binary = process.env.ALFALFA_BROWSER ?? "alfalfabrowser";
const runner = process.argv[2] ?? "terminal";
const profile = mkdtempSync(join(tmpdir(), "alfalfabrowser-rechazo-"));
const env = { ...process.env, CUYBROWSER_HOME: profile };
const counters = { denied: 0, probe: 0 };

const server = createServer((request, response) => {
  if (request.method === "POST" && request.url === "/submit?case=denied") {
    counters.denied++;
  } else if (request.method === "POST" && request.url === "/submit?case=probe") {
    counters.probe++;
  } else if (request.method === "GET" && request.url === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" }).end(`
      <!doctype html>
      <title>Prueba de rechazo</title>
      <form action="/submit?case=denied" method="post">
        <input type="hidden" name="demo" value="prueba">
        <button type="submit">Enviar formulario de prueba</button>
      </form>
    `);
    return;
  } else {
    response.writeHead(404).end();
    return;
  }

  request.resume();
  response.writeHead(200).end("POST recibido");
});

async function browser(...args) {
  let stdout;
  try {
    ({ stdout } = await execute(binary, [...args, "--json"], { env, timeout: 20_000 }));
  } catch (error) {
    if (!error.stdout?.trim()) throw error;
    stdout = error.stdout;
  }
  return JSON.parse(stdout);
}

function expectOK(response) {
  assert.equal(response.ok, true, JSON.stringify(response));
  return response.data;
}

let browserStarted = false;
try {
  // Solo este daemon desechable usa el canal CLI de aprobación.
  writeFileSync(join(profile, "policy.yaml"), "approval: cli\nconfirm: [submit_forms]\n");
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const origin = `http://127.0.0.1:${server.address().port}`;

  const control = await fetch(`${origin}/submit?case=probe`, { method: "POST" });
  assert.equal(control.status, 200);
  await control.text();
  assert.equal(counters.probe, 1);

  expectOK(await browser("start", "--headless"));
  browserStarted = true;
  expectOK(await browser("navigate", origin));
  const found = expectOK(await browser("find", "Enviar formulario de prueba", "--role", "button"));
  assert.equal(found.matches.length, 1);

  const request = await browser("click", found.matches[0].ref);
  assert.equal(request.error?.code, "CONFIRMATION_REQUIRED", JSON.stringify(request));
  const before = counters.denied;
  const id = request.error.confirmation.confirmation_id;
  const [decision] = await Promise.all([
    browser("confirm", id),
    // Respuesta sintética del fixture al canal humano del daemon de prueba.
    execute(binary, ["deny", id], { env, timeout: 5000 }),
  ]);
  assert.equal(decision.error?.code, "CONFIRMATION_DENIED", JSON.stringify(decision));
  const status = expectOK(await browser("status"));
  assert.equal(status.tabs.find((tab) => tab.active)?.url, `${origin}/`);
  const after = counters.denied;
  assert.equal(before, 0);
  assert.equal(after, 0);

  console.log(JSON.stringify({
    runner,
    test: "browser",
    requested: request.error.code,
    decision: decision.error.code,
    before,
    after,
    positiveControl: counters.probe,
  }, null, 2));
} finally {
  if (browserStarted) await browser("stop").catch(() => {});
  if (server.listening) {
    await new Promise((resolve) => {
      server.close(resolve);
      server.closeAllConnections();
    });
  }
  rmSync(profile, { recursive: true, force: true });
}
