# AlfalfaBrowser 0.7.1

- `local_tab_action` permite hacer clic y rellenar campos en el documento principal de una pestaña local de Chrome gestionada por AlfalfaBrowser. La aprobación se vincula a la pestaña y al origen exacto, incluido el puerto. Al navegar a otro origen, se revoca el permiso de ese control. [PR #14](https://github.com/0sw2ld0/AlfalfaBrowser/pull/14)
- El paquete conserva el comando `cuybrowser` y el alias `alfalfabrowser`. Los binarios de macOS se publican como `cuybrowser-macos-arm64` para Apple Silicon y `cuybrowser-macos-x64` para Intel. `SHA256SUMS` permite verificar ambos archivos.
