# Mosaico Nómada

Juego n.º 7 de **Un juego cada día**, edición del **24 de octubre de 2026** en **America/Santo_Domingo**. Seis siluetas originales para completar con poliminós de cuatro y cinco casillas. Selecciona, gira y coloca; sin reloj ni límite de intentos.

Juego: https://mitchell-castillo.github.io/mosaico-nomada/

Repositorio: https://github.com/mitchell-castillo/mosaico-nomada

Catálogo: https://mitchell-castillo.github.io/daily-games/

## Jugar

1. Selecciona un retazo en la bandeja. Su letra y color identifican la pieza; el punto señala el ancla, la primera casilla de su fila superior.
2. Gíralo en pasos de 90° si hace falta. No se reflejan las piezas.
3. Pulsa la casilla donde irá el punto. Cubre toda la silueta, sin superponer ni cubrir los huecos oscuros. La vista previa y el texto explican si encaja.
4. Puedes seleccionar una pieza ya colocada y moverla, o devolverla a la bandeja con Retirar. Las colocaciones inválidas no cambian el tablero.

Ratón y pantalla táctil usan selección y pulsación, sin necesidad de arrastrar. Con teclado: Tab recorre controles, Enter o Espacio activa; las flechas recorren las casillas cuando el foco está en el tablero; R gira a la derecha, Q a la izquierda, Z deshace, Supr retira, Escape cancela. La forma se describe por filas y columnas en la etiqueta accesible de cada pieza. Los atajos de juego se suspenden en el diálogo de reinicio.

Completar un paisaje abre el siguiente. Los intentos de todos los paisajes quedan guardados al cambiar de tablero. Reiniciar pide confirmación y vacía solo el tablero actual y su historial. Las marcas de paisajes completados y el mejor número de cambios se conservan. Deshacer restaura hasta 200 cambios por tablero, también después de recargar; puede deshacer la última pieza de un mosaico completo sin cerrar el siguiente paisaje ya abierto.

## Los seis paisajes

| Paisaje | Casillas | Piezas | Rasgo espacial |
| --- | ---: | ---: | --- |
| Patio de arcilla | 12 | 3 | Marco rectangular introductorio |
| Arco de sal | 18 | 4 | Hendidura abierta en la base |
| Duna escalonada | 19 | 4 | Dos bordes escalonados |
| Ventana azul | 24 | 6 | Hueco interior que permanece libre |
| Caravana | 26 | 6 | Esquinas recortadas y espacio irregular |
| Atlas de retazos | 32 | 8 | Ocho retazos para la silueta mayor |

Son tableros fijos, diseñados para esta edición; el juego no cambia por la zona horaria del navegador. Los poliminós son formas geométricas clásicas. La originalidad de esta entrega está en sus seis composiciones, presentación y progresión. No usa rutas inerciales, iluminación de barcos, gestión de huertos, conexiones ferroviarias, memoria secuencial ni equilibrio de pesos. Puede haber varias soluciones; no se exige una solución única.

## Comprobar y desarrollar

Requiere **Node.js 22 o posterior** para las herramientas; comprobado aquí con Node.js 24.18.0. No hace falta instalar paquetes ni compilar.

```sh
npm run check
npm test
npm run solve
npm start
```

`npm start` sirve únicamente este proyecto en `http://127.0.0.1:8765/mosaico-nomada/`. Es una herramienta opcional de desarrollo, no un backend del juego. Ctrl+C detiene el servidor. No usarlo como servidor público.

`check` verifica sintaxis de todos los módulos, recursos relativos, base de accesibilidad y ausencia de llamadas de red en el código del juego, y ejecuta las pruebas. `solve` busca una solución por tablero con un algoritmo de cobertura exacta independiente del reductor de juego. `tests/solutions.json` conserva otra solución constructiva; se comprueba la validez de ambas y su ejecución mediante las acciones públicas del juego. `scripts/design.mjs` documenta la construcción determinista del contenido; regenerarlo es una tarea de autoría y no ocurre al jugar.

Los tests de interfaz ejecutan los manejadores reales de `src/app.js` con un adaptador DOM mínimo sin renderizado. **No sustituyen una prueba de navegador**, de layout, de diálogo nativo, táctil real o lector de pantalla. La revisión visual debe realizarse por separado sobre una versión servida en el navegador.

## Guardado y privacidad

Clave única: `daily-games:mosaico-nomada:v1`.

```json
{
  "version": 1,
  "currentLevel": 0,
  "completed": { "0": { "bestMoves": 3 } },
  "run": { "boards": [] },
  "updatedAt": "fecha ISO"
}
```

Los índices son cero-based. `run.boards` guarda seis objetos con `placements`, `moves` e `history`. Cada colocación tiene la letra como clave y coordenadas enteras `x`, `y`, `r`; `r` está entre 0 y 3. El resumen es compatible con el lector actual de `daily-games`: `completed[index].bestMoves` es entero positivo. Un cambio es una colocación, traslado o retirada válida; seleccionar, girar, cancelar o intentar una acción inválida no suma. Deshacer revierte también ese contador. No se presenta como un ranking global.

Solo se lee o escribe esta clave. No se toca el progreso de otros juegos. Una recarga recupera los intentos válidos y su historial, sin restaurar selección, vista previa ni diálogos abiertos. Se validan posiciones, colisiones, números de cambios e historiales al cargar. Datos corruptos o incompatibles se descartan de forma segura. Si localStorage falla, se muestra un aviso y se puede seguir jugando en memoria; no se promete conservar esa sesión. El modo privado o borrar los datos del navegador puede eliminar el avance. No hay sincronización entre dispositivos.

No hay cuentas, tracking, analytics, contador global de partidas, cookies, peticiones de gameplay, fuentes remotas, dependencias externas de ejecución ni backend. La página carga solo sus archivos estáticos. El enlace al catálogo funciona cuando el jugador decide abrirlo.

## GitHub Pages

Publicar la raíz de este repositorio desde `main` mediante GitHub Pages. Todos los recursos usan rutas relativas (`./styles.css`, `./src/app.js`, `./assets/...`), compatibles con `/mosaico-nomada/`. Se incluye `.nojekyll`. No hace falta un build ni secretos. El workflow de validación ejecuta las comprobaciones en cada push y pull request, sin secretos.

El catálogo es un repositorio separado. Para actualizar la ficha, conservar los registros existentes de `daily-games/games.json`, copiar la portada original y verificar el despliegue antes de marcar el nuevo registro como `published`. Los cambios a este juego se realizan solo en este repositorio.

## Archivos

- `src/geometry.js`: giros, ancla, ocupación y validez geométrica.
- `src/model.js`: reglas, progresión, deshacer, confirmación y normalización.
- `src/storage.js`: único punto de acceso al almacenamiento.
- `src/app.js`, `index.html`, `styles.css`: interfaz en español, eventos y responsive.
- `src/levels.js`: seis siluetas y sus inventarios originales.
- `assets/`: portada y favicon SVG originales, sin recursos enlazados.
- `scripts/`, `tests/`: comprobaciones, autoría y pruebas reproducibles.

