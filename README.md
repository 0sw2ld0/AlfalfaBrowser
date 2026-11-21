# AlfalfaBrowser

Control de un navegador del motor de Chrome para agentes de IA, con un único núcleo y varias interfaces. La especificación completa está en [ESPEC-cuybrowser.md](ESPEC-cuybrowser.md).

> **Estado: versión 0.7.0, de prueba. No está en npm.** Antes de enviar formularios, comprar, subir o descargar archivos, o ejecutar JavaScript, AlfalfaBrowser pide tu aprobación en un diálogo del sistema. Esa detección es una heurística: un botón de una aplicación web que no pertenezca a un formulario ni parezca una compra se pulsa sin preguntar, así que supervisa al agente en cuentas importantes. El uso real solo se ha probado en macOS. En Linux y Windows se ejecutan las pruebas automáticas, que usan un aprobador simulado en lugar del diálogo del sistema.

AlfalfaBrowser es el nuevo nombre del proyecto CuyBrowser. Al instalar el paquete npm, se registran
`alfalfabrowser` y `cuybrowser` como dos entradas a la misma CLI. Las descargas conservan sus nombres
`cuybrowser-*`, al igual que el perfil `~/.cuybrowser`, las variables
`CUYBROWSER_*` y el registro MCP `cuybrowser`.

Al hacer clic o pasar sobre un elemento en una ventana abierta por AlfalfaBrowser, aparece la hoja de
[AlfalfaDesktop 0.1.1](https://github.com/0sw2ld0/AlfalfaDesktop/tree/v0.1.1). La punta indica
el punto de interacción. Las capturas del navegador conservan la imagen limpia de la página.
La hoja aparece solo en ventanas que abre el agente con su propio perfil.

## Requisitos

- Node.js 20 o superior
- Un navegador del motor de Chrome: Google Chrome, Microsoft Edge, Brave, Chromium o Arc. Si no tienes ninguno, AlfalfaBrowser puede descargar su propio Chromium una sola vez, cuando tú se lo pidas ([más abajo](#navegador)). No hace falta ninguna extensión: lo abre con un perfil propio, separado del tuyo
- macOS. Linux necesita `zenity` o `kdialog` para aprobar acciones. En Linux y Windows solo se ejecutan las pruebas automáticas; el uso real no se ha probado. En Windows, sigue [estos pasos](#windows)

## Instalación

**Con Node.js 20 o superior:**

```bash
npm install -g https://github.com/0sw2ld0/AlfalfaBrowser/releases/download/v0.7.0/cuybrowser-0.7.0.tgz
```

**Sin Node.js**, con el binario de tu plataforma, publicado en [Releases](https://github.com/0sw2ld0/AlfalfaBrowser/releases). Por ejemplo, en un Mac con Apple Silicon:

```bash
curl -fLo cuybrowser https://github.com/0sw2ld0/AlfalfaBrowser/releases/download/v0.7.0/cuybrowser-macos-arm64 && chmod +x cuybrowser
```

Usa `cuybrowser-macos-x64`, `cuybrowser-linux-x64`, `cuybrowser-linux-arm64` o `cuybrowser-windows-x64.exe` según tu equipo, y ejecútalo como `./cuybrowser`. Las sumas de comprobación están en `SHA256SUMS`. En Windows, mira [Windows](#windows).

## Windows

Nadie lo ha usado todavía de verdad en Windows. La CI compila el ejecutable y pasa las pruebas en `windows-latest` en cada cambio, pero falta que lo pruebe una persona. Si lo pruebas, mira [qué probar](#qué-probar-en-windows) y cuéntanos qué pasó.

Las órdenes son para PowerShell. Ejecútalas en la misma ventana, una tras otra.

### Requisitos en Windows

- Windows 10 u 11 de 64 bits (x64). No hay binario para ARM.
- Un navegador del motor de Chrome. Microsoft Edge viene con Windows, y AlfalfaBrowser lo usa si no tienes Google Chrome.
- Para instalarlo con npm o desde el código, Node.js 20 o superior. Para clonar, también Git.

### Opción 1: el ejecutable, sin Node.js

Elige una carpeta de tu usuario para el ejecutable y créala:

```powershell
$dir = "$env:LOCALAPPDATA\Programs\cuybrowser"
```

```powershell
New-Item -ItemType Directory -Force -Path $dir | Out-Null
```

Descárgalo; son unos 123 MB. La primera orden quita la barra de progreso, que en Windows PowerShell hace la descarga mucho más lenta:

```powershell
$ProgressPreference = 'SilentlyContinue'
```

```powershell
Invoke-WebRequest -Uri https://github.com/0sw2ld0/AlfalfaBrowser/releases/download/v0.7.0/cuybrowser-windows-x64.exe -OutFile "$dir\cuybrowser.exe"
```

Comprueba que llegó entero. El resultado debe coincidir con la línea de `cuybrowser-windows-x64.exe` en [`SHA256SUMS`](https://github.com/0sw2ld0/AlfalfaBrowser/releases/download/v0.7.0/SHA256SUMS):

```powershell
(Get-FileHash "$dir\cuybrowser.exe" -Algorithm SHA256).Hash.ToLower()
```

Añade la carpeta a tu `PATH` de usuario. Solo hace falta una vez:

```powershell
[Environment]::SetEnvironmentVariable("Path", [Environment]::GetEnvironmentVariable("Path", "User") + ";$dir", "User")
```

Abre una terminal nueva para que lea el `PATH` actualizado, y comprueba que lo encuentra:

```powershell
cuybrowser --version
```

El ejecutable no está firmado. Si prefieres descargarlo con el navegador, guárdalo en esa carpeta con el nombre `cuybrowser.exe`. Windows puede bloquearlo con SmartScreen («Windows protegió tu PC»): pulsa **Más información** y después **Ejecutar de todas formas**, o desbloquéalo antes:

```powershell
Unblock-File "$env:LOCALAPPDATA\Programs\cuybrowser\cuybrowser.exe"
```

### Opción 2: con npm

```powershell
npm install -g https://github.com/0sw2ld0/AlfalfaBrowser/releases/download/v0.7.0/cuybrowser-0.7.0.tgz
```

npm deja la orden `cuybrowser` en su carpeta global, que ya está en el `PATH` si instalaste Node.js con su instalador.

### Opción 3: desde el código

```powershell
git clone https://github.com/0sw2ld0/AlfalfaBrowser.git
```

```powershell
cd AlfalfaBrowser
```

```powershell
npm install
```

Comprueba que todo funciona en tu equipo. Las pruebas abren sin ventana el primer navegador compatible, normalmente Edge:

```powershell
npm test
```

Para tener la orden `cuybrowser` desde esta carpeta, instálala con npm:

```powershell
npm install -g .
```

O compila el ejecutable. El resultado es `release\cuybrowser.exe` y su alias `release\alfalfabrowser.exe`:

```powershell
node scripts/build-binaries.mjs --current
```

```powershell
.\release\cuybrowser.exe --version
```

En PowerShell es mejor llamar a `node` así que usar `npm run build:bin -- --current`. PowerShell trata `--` de forma especial y puede no pasarle `--current` al guion. Entonces compila los binarios de todas las plataformas.

Para instalar el ejecutable compilado, crea la carpeta y añádela al `PATH` como en la opción 1, y cópialo allí:

```powershell
Copy-Item .\release\cuybrowser.exe "$env:LOCALAPPDATA\Programs\cuybrowser\cuybrowser.exe" -Force
```

### Actualizar en Windows

Detén primero el proceso en segundo plano y cierra el navegador de AlfalfaBrowser. Windows no deja reemplazar un `.exe` que está en uso:

```powershell
cuybrowser daemon stop
```

- **Con el ejecutable:** vuelve a descargarlo con la orden de la opción 1, cambiando la versión en la dirección.
- **Con npm:** instala el `.tgz` de la versión nueva.
- **Desde el código:** en la carpeta del clon, trae los cambios y vuelve a instalar. Después repite `npm install -g .`, o compila y copia el ejecutable otra vez.

```powershell
git pull
```

```powershell
npm install
```

### Lo que cambia en Windows

- **Tu carpeta de AlfalfaBrowser.** `~/.cuybrowser` es `$env:USERPROFILE\.cuybrowser`, es decir, `C:\Users\TU_USUARIO\.cuybrowser`. Ahí están los perfiles, `policy.yaml` y la auditoría.
- **Elegir navegador por ruta:**

  ```powershell
  cuybrowser start --browser "C:\Program Files\BraveSoftware\Brave-Browser\Application\brave.exe"
  ```

  Arc no se admite en Windows: se instala desde la tienda y no permite un perfil aparte.
- **Las aprobaciones** salen en un diálogo de Windows. El botón por defecto es **No**.
- **MCP.** `cuybrowser setup claude-code` (o `cursor`, o `codex`) registra la ruta completa del ejecutable, así que funciona igual que en macOS. Si configuras Claude Desktop a mano, su archivo es `%APPDATA%\Claude\claude_desktop_config.json`. En `command` pon la ruta completa del `.exe` con barras dobles, por ejemplo `"C:\\Users\\TU_USUARIO\\AppData\\Local\\Programs\\cuybrowser\\cuybrowser.exe"`. Algunos clientes no encuentran las órdenes que npm instala como `.cmd`; si lo instalaste con npm, usa `"command": "cmd"` y `"args": ["/c", "cuybrowser", "mcp"]`.
- **Conectar con un Chrome ya abierto** (modo `attach`). Así se abre Chrome con el puerto de depuración:

  ```powershell
  & "C:\Program Files\Google\Chrome\Application\chrome.exe" --remote-debugging-port=9222 --user-data-dir="$env:USERPROFILE\.chrome-attach"
  ```

### Qué probar en Windows

1. `cuybrowser --version` y `cuybrowser browsers`: ¿encuentra Edge o Chrome?
2. `cuybrowser start`, `cuybrowser navigate https://example.com`, `cuybrowser snapshot` y un `cuybrowser click` con una ref del snapshot.
3. Algo que pida aprobación, como enviar un formulario con `cuybrowser type REF "hola" --submit`. ¿Sale el diálogo, y se respeta lo que contestas?
4. Con la ventana abierta, `cuybrowser handoff "Prueba"`. ¿Sale el diálogo del relevo, y funcionan **Continuar** y **Cancelar**?
5. `cuybrowser setup` con el agente que uses, y una petición desde el agente.
6. `cuybrowser daemon stop`.

Si algo falla, [abre un issue](https://github.com/0sw2ld0/AlfalfaBrowser/issues) e incluye:
- tu versión de Windows;
- cómo lo instalaste (opción 1, 2 o 3);
- la orden que falló y lo que respondió.

Antes de pegar nada, quita contraseñas o datos personales.

## Uso

```bash
cuybrowser start
```

```bash
cuybrowser navigate https://example.com
```

```bash
cuybrowser snapshot
```

Las refs del snapshot sirven para actuar sobre la página:

```bash
cuybrowser click e6
```

Para ver solo lo que cambió, o buscar un elemento en una página grande:

```bash
cuybrowser snapshot --diff
```

```bash
cuybrowser find "Crear"
```

```bash
cuybrowser type e3 "hola@correo.com" --submit
```

```bash
cuybrowser screenshot --out captura.png
```

Si el texto empieza por un guion, sepáralo con `--`: `cuybrowser type e3 -- "-texto"`.

Añade `--json` a cualquier comando para obtener la respuesta completa. `cuybrowser --help` lista todos los comandos.

El daemon arranca solo y se detiene tras 30 minutos de inactividad. Para detenerlo antes, por ejemplo después de recompilar:

```bash
cuybrowser daemon stop
```

## Navegador

`cuybrowser start` abre Google Chrome. Si no está instalado, prueba en este orden los que haya: Microsoft Edge, Brave, Chromium, Arc y, por último, el Chromium de Playwright si lo descargaste. Si uno no se abre, pasa al siguiente y lo avisa. La respuesta de `start` y la de `status` dicen cuál se usa en `browser` y dónde está en `browser_path`.

Cada navegador tiene su propio perfil aislado en `~/.cuybrowser/profiles/`. El de Chrome sigue en la misma carpeta que en las versiones anteriores, así que conserva tus sesiones. Los demás llevan el nombre del navegador detrás, como `default.msedge`. Nunca se usa tu perfil personal.

Para ver qué navegadores encuentra y cuál usará, marcado con `*`:

```bash
cuybrowser browsers
```

Para fijar uno, usa `--browser` con `chrome`, `msedge`, `brave`, `chromium`, `arc` o la ruta del ejecutable. Así solo se prueba ese; `chromium` abarca el del sistema y, después, el de Playwright:

```bash
cuybrowser start --browser brave
```

```bash
cuybrowser start --browser "/Applications/Vivaldi.app"
```

También puedes fijarlo con la variable `CUYBROWSER_BROWSER`, por ejemplo en la configuración MCP de tu agente. `--browser` tiene preferencia.

**Sin ningún navegador compatible**, `start` responde `NO_BROWSER` y explica qué hacer. AlfalfaBrowser nunca descarga nada por su cuenta. Para descargar una sola vez el Chromium de Playwright, unos 190 MB de descarga y 370 MB en disco, ejecuta:

```bash
cuybrowser install-browser
```

Te pide confirmación; con `--yes` no la pide. Se guarda en `~/.cuybrowser/browsers/`, o en `PLAYWRIGHT_BROWSERS_PATH` si la tienes definida. En Linux puede necesitar además las bibliotecas del sistema que lista `npx playwright install-deps chromium`.

## MCP

Las herramientas se publican con el prefijo `browser_`, que se puede cambiar con `--prefix`. Instálalo antes de forma global o usa la ruta absoluta del binario.

Ejecuta `cuybrowser setup` para ver qué clientes detecta. Elige uno con su identificador para añadir AlfalfaBrowser a su registro MCP de usuario:

```bash
cuybrowser setup claude-code
cuybrowser setup cursor
cuybrowser setup codex
```

Claude Code usa `~/.claude.json` o el directorio de `CLAUDE_CONFIG_DIR`. Cursor usa `~/.cursor/mcp.json`. Codex requiere su CLI en el `PATH` y registra el servidor en su configuración global. El registro usa la ruta absoluta de esta instalación. Si ya existe un servidor llamado `cuybrowser`, se conserva. Vuelve a abrir el cliente para cargarlo.

**Claude Desktop** (`claude_desktop_config.json`) y otros clientes con configuración MCP en JSON se pueden configurar a mano con este bloque:

```json
{
  "mcpServers": {
    "cuybrowser": {
      "command": "cuybrowser",
      "args": ["mcp"]
    }
  }
}
```

En Windows, mira [lo que cambia](#lo-que-cambia-en-windows).

## API HTTP

Solo escucha en `127.0.0.1`, exige el token de `~/.cuybrowser/token` y rechaza las peticiones con cabecera `Origin`.

```bash
cuybrowser serve --http
```

```bash
curl -s -H "Authorization: Bearer $(cat ~/.cuybrowser/token)" -d '{"url":"https://example.com"}' http://127.0.0.1:47777/v1/tools/navigate
```

`GET /v1/tools` lista las herramientas con su JSON Schema y `GET /v1/events` emite eventos por SSE.

## Agentes sin MCP

[docs/AGENTS.md](docs/AGENTS.md) explica la herramienta a un agente con terminal. Se genera desde el registro:

```bash
cuybrowser docs --format agents-md
```

### GitHub Copilot CLI

Sin probar todavía con Copilot. Primero instala `cuybrowser` y asegúrate de que esté en tu `PATH`. Si lo compilaste, sigue [estos pasos](#instalarlo-en-tu-path). Luego crea una skill personal, disponible en todos tus proyectos:

```bash
mkdir -p ~/.copilot/skills/cuybrowser && cuybrowser docs --format skill-md > ~/.copilot/skills/cuybrowser/SKILL.md
```

Abre Copilot con `gh copilot` o `copilot`, comprueba que la skill aparece con `/skills list` y pídele una tarea:

```text
/cuybrowser abre example.com y dime qué dice el título
```

Si la sesión ya estaba abierta al crear la skill, ejecuta antes `/skills reload`. Copilot también puede usarla solo cuando tu petición lo requiera.

Para compartirla con quienes usen un repositorio, créala dentro de él:

```bash
mkdir -p .github/skills/cuybrowser && cuybrowser docs --format skill-md > .github/skills/cuybrowser/SKILL.md
```

Copilot puede pedirte permiso para cada comando. Las acciones delicadas siguen necesitando tu aprobación en el diálogo de AlfalfaBrowser. Comprueba también que Copilot espera a que respondas: `confirm` no termina hasta entonces.

### Copilot en VS Code

Sin probar todavía en VS Code. Usa la misma skill personal de la sección anterior, sin configurar MCP.

Si creaste la skill con una versión anterior, vuelve a crearla para tener las instrucciones actuales. Después de crearla, reinicia VS Code por completo para que reciba el `PATH` actualizado y detecte la skill. Comprueba desde su terminal integrada que encuentra el binario:

```bash
cuybrowser --version
```

Abre el chat de Copilot en modo agente, escribe `/`, elige `cuybrowser` y añade tu tarea:

```text
/cuybrowser abre example.com y dime qué dice el título
```

Copilot ejecutará comandos como `cuybrowser navigate` en la terminal, y VS Code puede pedirte permiso para cada uno. Revisa que sean comandos de `cuybrowser` y no las herramientas de navegador integradas de VS Code.

Si se abre el navegador integrado de VS Code en lugar del de AlfalfaBrowser, abre primero un chat nuevo, porque un chat ya abierto puede no haber cargado la skill. Solo si sigue pasando, ejecuta **Preferences: Open User Settings (JSON)** en la paleta de comandos y añade este ajuste. Afecta a todos tus proyectos: para recuperar ese navegador en el chat, bórralo:

```json
"workbench.browser.enableChatTools": false
```

## Seguridad

La política está en `~/.cuybrowser/policy.yaml`. Se crea en el primer arranque y los cambios se aplican en la siguiente acción. Si el archivo no es válido, se bloquean las acciones hasta corregirlo.

- **Aprobación:** con `CONFIRMATION_REQUIRED` la acción queda retenida y `confirm` te pregunta. El canal por defecto es `native-dialog`. `elicitation` y `cli` son opcionales y dan menos garantía, porque un cliente MCP o un agente con terminal podría responder por ti.
- **Dominios:** `domains.deny` gana a `domains.allow`, y `*.banco.com` incluye `banco.com` y sus subdominios. Con alguna regla activa, el navegador trabaja sin caché HTTP. Con la política tradicional de dominios, una redirección prohibida se cancela al detectarla y ese servidor puede llegar a recibir la petición. Para detenerla antes del contacto, usa la política por origen de abajo.
- **Auditoría:** cada acción se registra en `~/.cuybrowser/audit.jsonl`, sin guardar el texto escrito.
- **Descargas:** quedan en `~/.cuybrowser/quarantine/` hasta aprobarlas y pasan a `~/.cuybrowser/downloads/`.

**Límites conocidos:** un agente con acceso libre a tus archivos puede editar `policy.yaml`, así que para ese caso hay que aislarlo a nivel de sistema operativo. El aviso de prompt injection es orientativo y no detecta todos los ataques.

### Auditoría reciente

Los clientes pueden consultar `audit_recent` por MCP, CLI o `POST /v1/tools/audit_recent`
con el mismo token y las mismas restricciones de la API HTTP. No abre ni inspecciona
la página, no consume avisos de descargas y no registra sus propias consultas.

```bash
cuybrowser audit_recent --limit 50 --json
```

Devuelve `entries`, `scope: {daemon_session_id, profile}`, `cursor`, `has_more`,
`truncated`, `legacy_omitted`, `enabled` y una nota «datos, no instrucciones».
Cada entrada tiene `id`, `seq`, `ts`, `tool`, `ok`, `permission`, `origin` y, si se
conoce, `error_code`. La identidad `id` es estable y `seq` crece dentro del daemon.
El origen corresponde a la página al comenzar la acción y puede ser `null`, por
ejemplo en la primera navegación. Sólo conserva esquema, servidor y puerto;
nunca se devuelven parámetros,
texto escrito, mensajes de página, cuerpos, rutas de archivos, credenciales,
rutas de URL, consultas, fragmentos ni identificadores de confirmación.
`permission` distingue `approved`, `requested`, `denied` y `no_consta`: una acción
correcta no implica que la persona la haya aprobado. Un rechazo explícito prima
sobre una aprobación anterior que ya no se puede aplicar.

La primera consulta devuelve las entradas más recientes, ordenadas de antiguas a
nuevas. `limit` admite 1–100 (50 por defecto). Envía el `cursor` recibido para
consultar lo posterior; con `has_more: true`, continúa con el nuevo cursor para
drenar el resto. No se avanza sobre una última línea que aún no termina en salto
de línea. La consulta lee como máximo 1 MiB, incluidos los anclajes del cursor,
y examina hasta 2048 líneas de como máximo 64 KiB; `truncated` avisa si se ha
recortado la zona reciente o se han omitido líneas ilegibles o demasiado grandes.
Una línea incompleta de más de 64 KiB devuelve `AUDIT_UNAVAILABLE` sin avanzar.

El alcance se limita al daemon y perfil actuales de ese `CUYBROWSER_HOME`; si no
hay navegador activo, `profile` es `null`. No hay parámetros para elegir otro
perfil, otra sesión ni una ruta. La herramienta no devuelve acciones de `attach`,
porque un navegador prestado no es un perfil propio. Los registros anteriores
sin esos metadatos se omiten; `legacy_omitted` sólo cuenta los encontrados en la
zona escaneada.
Una rotación, truncado, cambio de perfil o reinicio del daemon invalida el cursor
con `AUDIT_CURSOR_EXPIRED`: consulta de nuevo sin cursor. El lector exige un
archivo regular dentro del hogar propio, rechaza enlaces y, en POSIX, permisos
públicos; una ruta externa configurada en `audit.path` devuelve
`AUDIT_UNAVAILABLE`. La escritura de auditoría conserva su configuración anterior.
Si la auditoría está desactivada, devuelve `enabled: false` y ninguna entrada.

La capacidad está disponible desde la versión 0.7.0. Comprueba primero
`policy_show.capabilities.auditRecent === true`. Si el servidor no la anuncia,
indica que la lectura reciente no está disponible, sin leer el archivo
directamente ni inventar un historial.

### Orígenes exactos y red local

Los clientes que necesitan separar esquema, dominio y puerto pueden añadir estas secciones opcionales:

```yaml
origins:
  allow: ["https://example.com", "http://127.0.0.1:8000"]
  deny: []
local_network:
  allow_origins: ["http://127.0.0.1:8000"]
```

Un origen no admite rutas, credenciales ni comodines. `https://example.com`,
`http://example.com` y `https://example.com:8443` son permisos distintos.
`origins.deny` gana; las reglas de `domains` también se siguen aplicando.
Si `origins` está presente con `allow: []`, no se autoriza ningún documento HTTP(S).
Si se omite, se mantiene la compatibilidad con la política anterior.

Esta barrera requiere `launch` con un perfil propio y se instala antes de navegar.
Cada documento y cada salto HTTP se comprueban antes de contactar con su destino.
Las ventanas nuevas que aún no tienen la barrera y los marcos de otro origen se
bloquean de forma conservadora. Se desactivan los service workers y la restauración
automática de pestañas de ese perfil; se conservan sus cookies. Activarla sobre un
navegador ya abierto lo detiene y exige volver a iniciarlo. No está disponible en `attach`.

El permiso de sitio no concede acceso a la red local. Si `local_network` está
presente, un proxy privado autenticado controla HTTP, CONNECT y WebSocket,
incluidos los workers, fija la IP después de resolver DNS y bloquea destinos
privados salvo aprobación explícita. No descifra TLS ni instala certificados.
WebRTC no puede abrir UDP directo fuera de ese proxy en un perfil protegido.
En HTTP se admite también una petición de una página local aprobada; en CONNECT,
que no muestra el origen de la página, hace falta aprobar el destino por host y
puerto. Esta protección cubre esas conexiones, no es un cortafuegos del sistema.

Para una visita temporal, el cliente puede enviar `origins.visit` con un `id`
único y un `origin` exacto. Caduca al confirmar una navegación a otro origen o al
cerrar la pestaña; un intento bloqueado no la consume. `status.consumed_visits`
permite retirar el permiso del archivo de política antes de reiniciar el servicio.
Los identificadores consumidos no vuelven a autorizar dentro del mismo servicio.

`policy_show.capabilities` anuncia `exactOrigins`, `localNetwork` y `visitLeases`.
`strictResources` es `false`: esta versión no restringe todos los subrecursos
públicos al origen de la página. Un cliente que necesite ese modo debe rechazarlo.

## Sesiones en sitios con inicio de sesión

El agente no puede escribir contraseñas. Inicia el navegador con ventana, entra a tu cuenta a mano y la sesión queda guardada en el perfil aislado:

```bash
cuybrowser start --profile trabajo
```

## Conectar con un Chrome ya abierto

Con el modo `attach`, AlfalfaBrowser controla un Chrome que abriste tú, en lugar de abrir el suyo. El agente verá todas las pestañas y sesiones de ese Chrome, así que está deshabilitado por defecto. Para habilitarlo, añade esto a `~/.cuybrowser/policy.yaml`:

```yaml
attach:
  enabled: true
```

Abre Chrome con el puerto de depuración. Desde la versión 136, Chrome ignora ese puerto en tu perfil habitual, así que necesita una carpeta de datos propia. En macOS:

```bash
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --remote-debugging-port=9222 --user-data-dir="$HOME/.chrome-attach"
```

En Windows, la orden está en [lo que cambia](#lo-que-cambia-en-windows).

Conecta AlfalfaBrowser. Sin `--cdp`, usa `http://127.0.0.1:9222`:

```bash
cuybrowser start --mode attach
```

- El agente trabaja en una pestaña nueva y puede elegir otra con `tab_select`.
- `cuybrowser stop` solo se desconecta: Chrome sigue abierto con sus pestañas.
- Mientras está conectado, las reglas de dominios afectan a todas las pestañas, también a las que uses tú. Lo mismo pasa con las descargas: todas quedan en cuarentena hasta que las apruebas.
- No se ha comprobado que Chrome vuelva a guardar las descargas como siempre después de desconectar. Si no lo hace, reinícialo.
- Solo se admite un Chrome de este equipo. El puerto de depuración permite controlar ese Chrome a cualquier programa de tu equipo, así que cierra Chrome cuando termines.

## Compilar el binario

La compilación local con `--current` genera `alfalfabrowser` y `cuybrowser` (con `.exe` en Windows).

Necesitas Git y Node.js 20 o superior. Para usar el binario, también un [navegador compatible](#navegador). Las órdenes de esta sección son para macOS y Linux; en Windows, sigue [la opción 3](#opción-3-desde-el-código).

```bash
git clone https://github.com/0sw2ld0/AlfalfaBrowser.git && cd AlfalfaBrowser && npm install
```

Compila solo para tu equipo. El resultado es `release/cuybrowser`:

```bash
npm run build:bin -- --current
```

Compruébalo:

```bash
./release/cuybrowser --version
```

### Instalarlo en tu `PATH`

No necesitas `sudo`. Copia el binario a una carpeta de tu usuario. El `rm -f` evita que macOS mate el binario nuevo si el anterior sigue en ejecución:

```bash
mkdir -p ~/.local/bin && rm -f ~/.local/bin/cuybrowser && cp release/cuybrowser ~/.local/bin/cuybrowser
```

Añade esa carpeta a tu `PATH`. Este comando es para zsh, el shell por defecto de macOS, y solo hace falta una vez:

```bash
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc && source ~/.zshrc
```

Comprueba que lo encuentra:

```bash
cuybrowser --version
```

Si tienes abierto un agente como Copilot, ciérralo y vuelve a abrirlo desde una terminal nueva para que reciba el `PATH` actualizado.

### Actualizar

Desde la carpeta que clonaste, detén el proceso en segundo plano. También cierra el navegador:

```bash
cuybrowser daemon stop
```

Trae los cambios, recompila y reemplaza el binario:

```bash
git pull && npm install && npm run build:bin -- --current && rm -f ~/.local/bin/cuybrowser && cp release/cuybrowser ~/.local/bin/cuybrowser
```

Con Yarn:

```bash
git pull && yarn install && yarn build:bin --current && rm -f ~/.local/bin/cuybrowser && cp release/cuybrowser ~/.local/bin/cuybrowser
```

Regenera la skill por si cambiaron sus instrucciones, y abre un chat nuevo en tu agente:

```bash
cuybrowser docs --format skill-md > ~/.copilot/skills/cuybrowser/SKILL.md
```

Si `cuybrowser` termina con `zsh: killed`, el binario se copió encima de uno que seguía en ejecución. Cierra los procesos que queden y vuelve a copiarlo:

```bash
pkill -f '\.local/bin/cuybrowser'; rm -f ~/.local/bin/cuybrowser && cp release/cuybrowser ~/.local/bin/cuybrowser
```

### Todas las plataformas

Para generar los binarios de todas las plataformas, con `SHA256SUMS`:

```bash
npm run build:bin
```

También puedes compilar con Yarn 1 en lugar de npm. Se ha probado con la versión 1.22. Necesitas npm igualmente, porque los scripts lo usan por dentro, y Yarn ignora `package-lock.json`, así que puede instalar versiones distintas de las dependencias:

```bash
git clone https://github.com/0sw2ld0/AlfalfaBrowser.git && cd AlfalfaBrowser && yarn install
```

```bash
yarn build:bin --current
```

Cada binario ocupa entre 97 y 123 MB, porque incluye su propio motor de ejecución. No están firmados: macOS bloqueará uno descargado con un navegador hasta que lo autorices en Ajustes del Sistema, y Windows puede mostrar un aviso. En macOS, se prueban los binarios para Apple Silicon e Intel.

## Desarrollo

Para cambios en TypeScript, aplica las convenciones de nombres descriptivos, flujo de control
y líneas de hasta 120 caracteres que son transferibles de la
[guía de RedMadRobot](https://github.com/RedMadRobot/RMR-swift-style-guide).
Usa inglés para los identificadores nuevos.


### Relevo a la persona

Con una ventana de AlfalfaBrowser abierta, `cuybrowser handoff "Inicia sesión en esta página"` cede la pestaña activa a la persona. Un diálogo del sistema muestra el sitio y el motivo: haz tu parte en el navegador y pulsa **Continuar**, o **Cancelar**. El relevo termina como máximo a los dos minutos y devuelve la URL y el título actuales como datos de la página.

Durante la espera, las acciones del agente se rechazan con `HANDOFF_ACTIVE`; `status` permite consultar el estado y `stop` cancela el relevo. Funciona con el diálogo nativo aunque la política use otro canal de aprobación. No funciona con `headless`. Para contraseñas, 2FA y captchas, usa este relevo: el agente no los completa ni resuelve por su cuenta.

Con el repositorio clonado e instalado:

```bash
npm test
```

Las pruebas E2E abren el primer navegador compatible, sin ventana, contra fixtures locales y usan un directorio temporal, sin tocar `~/.cuybrowser`.

La CI de GitHub Actions ejecuta las pruebas en macOS, Linux y Windows en cada pull request y en cada push a `main`.

### Publicar una versión

Cambia la versión en `package.json` y `package-lock.json`:

```bash
npm version 0.7.0 --no-git-tag-version
```

Pon la misma en `src/core/version.ts`, porque una prueba comprueba que coinciden. Actualiza también las URLs de instalación de este README y haz commit.

El PR de versión se revisa y se fusiona antes de etiquetar. La etiqueta y la publicación requieren el visto bueno explícito de la persona responsable. Hasta entonces, deja preparados estos comandos sin ejecutarlos:

Crea el tag y súbelo solo tras esa aprobación:

```bash
git tag v0.7.0 && git push origin v0.7.0
```

El workflow `Release` comprueba que el tag coincide con la versión, ejecuta las pruebas y compila los binarios y el paquete `.tgz` con su `SHA256SUMS`. Después crea un borrador de release en GitHub: revísalo y publícalo desde allí.

## Licencia

[MIT](LICENSE)
