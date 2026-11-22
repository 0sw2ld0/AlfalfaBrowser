import { z } from "zod";
import { resolveElement, watchNavigation } from "../core/element.js";
import { CuyError } from "../core/errors.js";
import { defineTool, type ToolContext } from "../core/registry.js";
import { clickGate } from "../core/security/classify.js";
import { classifySensitive, SENSITIVE_HINT } from "../core/security/sensitive.js";

function localTarget(session: ToolContext["session"], id: string, expected: string) {
  const tab = session.activeTab();
  const url = URL.canParse(tab.page.url()) ? new URL(tab.page.url()) : null;
  if (!session.usesManagedChrome || tab.id !== id || !url ||
      !["http:", "https:"].includes(url.protocol) ||
      !["localhost", "127.0.0.1", "[::1]"].includes(url.hostname) ||
      url.origin !== expected) {
    throw new CuyError("BLOCKED_BY_POLICY", "Solo lectura: cambió la pestaña o el origen local autorizado.");
  }
  return tab;
}

const attributes = ["type", "name", "id", "autocomplete"] as const;

// El objeto pertenece al documento autorizado. La comprobación y el evento DOM ocurren
// juntos en un mundo aislado. No se envían coordenadas ni teclas a la ventana de Chrome.
const perform = `function(origin, action, text, attributes, expected) {
  if (window.top !== window || location.origin !== origin || this.ownerDocument !== document ||
      !this.isConnected || !(this instanceof HTMLElement) || this.matches("iframe,frame,[disabled],[aria-disabled=true]")) {
    return false;
  }
  if (action === "click") {
    HTMLElement.prototype.click.call(this);
    return true;
  }
  if (this.matches("[readonly],:disabled") ||
      !attributes.every((attribute, index) => (this.getAttribute(attribute) ?? "") === expected[index])) return false;
  const prototype = this instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype :
      this instanceof HTMLInputElement && ["text", "search", "email", "tel", "url"].includes(this.type)
        ? HTMLInputElement.prototype : null;
  if (!prototype) return false;
  Object.getOwnPropertyDescriptor(prototype, "value").set.call(this, text);
  this.dispatchEvent(new Event("input", {bubbles: true, composed: true}));
  return true;
}`;

export default defineTool({
  name: "local_tab_action",
  description: "Pulsa un elemento o rellena un campo de la pestaña local autorizada de Chrome.",
  params: z.strictObject({
    tab: z.string().describe("Id de la pestaña activa devuelto por status."),
    origin: z.string().describe("Origen exacto de localhost, incluido el puerto."),
    ref: z.string().regex(/^e[0-9]+$/).describe("Ref del documento principal devuelta por snapshot."),
    action: z.enum(["click", "type"]).describe("Clic semántico o reemplazar el texto del campo."),
    text: z.string().max(10000).optional().describe("Texto para type."),
  }),
  risk: "action",
  auditRedact: ["text"],
  gate: async ({ session }, { tab: id, origin, ref, action, text }) => {
    const tab = localTarget(session, id, origin);
    if (action === "type" && text === undefined) throw new CuyError("INVALID_PARAMS", "type requiere text.");
    const generation = tab.documentGeneration;
    const sensitive = action === "click" ? await clickGate(tab, ref) : null;
    if (tab.localControlOrigin === origin && !sensitive) return null;
    const grant = tab.localControlOrigin !== origin;
    return {
      kinds: sensitive?.kinds ?? [],
      mandatory: grant,
      scope: generation,
      description: [
        grant ? `Permitir clics y escritura en la pestaña ${id} de ${origin} durante esta sesión.` : "",
        sensitive?.description,
      ].filter(Boolean).join(" "),
    };
  },
  handler: async ({ session, warnings }, { tab: id, origin, ref, action, text }) => {
    const tab = localTarget(session, id, origin);
    const generation = tab.documentGeneration;
    const element = await resolveElement(tab, ref, true);
    try {
      const attrs = action === "type" ? await element.attributes() : {};
      if (classifySensitive(attrs)) throw new CuyError("SENSITIVE_FIELD", "Campo sensible bloqueado.", SENSITIVE_HINT);
      return await watchNavigation(tab, () => session.tabIds(), warnings, async () => {
        if (localTarget(session, id, origin).documentGeneration !== generation) {
          throw new CuyError("BLOCKED_BY_POLICY", "Solo lectura: el documento cambió antes de la acción.");
        }
        tab.localControlOrigin = origin;
        const done = await element.call<boolean>(perform, origin, action, text ?? "", attributes,
          attributes.map((name) => attrs[name] ?? ""));
        if (!done) throw new CuyError("BLOCKED_BY_POLICY", "La acción requiere un elemento editable o pulsable del documento local.");
      });
    } finally {
      await element.dispose();
    }
  },
});
