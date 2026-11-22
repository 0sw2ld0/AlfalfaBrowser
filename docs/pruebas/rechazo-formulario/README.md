# Reproducir el rechazo de un formulario en localhost

Este ejemplo abre un formulario en un navegador sin ventana, rechaza el envío y comprueba el contador
del servidor local. Usa AlfalfaBrowser 0.8.0 o posterior, Node.js 20 o posterior y un navegador compatible
instalado.

## Ejecutar la prueba

Desde la raíz del repositorio, pide a AlfalfaCode o a un agente de VS Code que ejecute este guion.
También se puede ejecutar en una terminal. Ajusta la ruta al binario si está fuera del `PATH`.

```sh
ALFALFA_BROWSER=/ruta/a/alfalfabrowser node docs/pruebas/rechazo-formulario/prueba.mjs
```

1. El guion abre un servidor en `127.0.0.1` con puerto efímero. Envía un POST a una ruta separada para
   comprobar que el servidor registra envíos.
2. El clic en «Enviar formulario de prueba» debe devolver `CONFIRMATION_REQUIRED`.
3. El guion simula el rechazo que normalmente decide una persona. Lo hace por el canal CLI de un
   daemon con **perfil temporal exclusivo de la prueba**. En una sesión real, la decisión corresponde
   a la persona usuaria.
4. `confirm` debe devolver `CONFIRMATION_DENIED`. La pestaña sigue en el formulario y su contador
   debe quedar en cero antes y después del rechazo.

El guion cierra el servidor y el navegador de prueba cuando termina. Imprime un resultado en JSON.

## Resultados registrados

Las dos ejecuciones usaron AlfalfaBrowser 0.8.0. En ambas, el servidor recibió un POST de control y
cero POST del formulario rechazado.

- [JSON de AlfalfaCode](resultados/alfalfacode-browser.json)
- [JSON de VS Code](resultados/vscode-browser.json)
