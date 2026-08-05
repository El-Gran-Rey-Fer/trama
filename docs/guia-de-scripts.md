# Guía de scripts

Los scripts de `scripts/` están pensados para poder usarse por tu cuenta, en paralelo
a una sesión de Claude Code (o cuando se acaben los créditos y trabajes "offline").
Ninguno depende de que Claude Code esté abierto: son Node normal, se lanzan desde
tu propio terminal.

Regla general: si Claude Code está tocando `content/` a la vez que tú, evita editar
el mismo fichero por los dos lados a la vez. Estos scripts son seguros de compaginar
porque tienden a trabajar fichero a fichero (una obra, un relato).

## Índice

- [`pnpm nueva-obra <url-de-commons> <id>`](#pnpm-nueva-obra-url-de-commons-id)
- [`pnpm curar-obra`](#pnpm-curar-obra)
- [`pnpm relaciones-de-relato <id-de-relato>`](#pnpm-relaciones-de-relato-id-de-relato)
- [`pnpm curar-relaciones`](#pnpm-curar-relaciones)
- [`pnpm indice-de-contenido`](#pnpm-indice-de-contenido)
- [`pnpm validar-contenido`](#pnpm-validar-contenido)
- [Flujo sugerido en paralelo con Claude Code](#flujo-sugerido-en-paralelo-con-claude-code)
- [Comitear desde el terminal](#comitear-desde-el-terminal)

## `pnpm nueva-obra <url-de-commons> <id>`

Da de alta una obra a partir de una URL de fichero de Wikimedia Commons: descarga la
imagen a `public/img/gr/obras/<id>.<ext>` y escribe
`content/mitologia-griega/entidades/obras/<id>.yaml` con crédito/origen/alt (los campos
que Commons no da de forma fiable quedan como `PENDIENTE`).

No es interactivo ni levanta servidor: corre, imprime dos rutas y termina.

```bash
pnpm nueva-obra "https://commons.wikimedia.org/wiki/File:Ejemplo.jpg" mi-obra-id
```

Falla (y no escribe nada) si la URL no es de un fichero (`File:...`) o si Commons no
devuelve `imageinfo`. Después de correrlo, revisa a mano el YAML: quedan pendientes
autor/fecha/periodo/soporte/museo, el `alt` final, y las `relaciones: representa`
(para eso está `curar-obra`).

## `pnpm curar-obra`

Levanta un servidor local (puerto **4322**) con una UI en el navegador
(`scripts/curar-obra.html`) para dar de alta obras desde una imagen (subida o ya
presente en el repo) y gestionar sus relaciones `representa` con foco/recorte, además
de marcar el retrato principal de una entidad.

```bash
pnpm curar-obra
# abre http://localhost:4322 en el navegador
```

Se queda en primer plano ocupando la terminal mientras el servidor está vivo. Para
usarlo en paralelo a una sesión de Claude Code, ábrelo en su propia pestaña/terminal;
no hace falta pararlo para que Claude Code edite otros ficheros.

Para pararlo:

```bash
# Ctrl+C en la terminal donde corre, o si lo perdiste de vista:
pkill -f "node scripts/curar-obra.mjs"
```

Si el puerto 4322 queda ocupado por una instancia zombie (p. ej. la terminal se
cerró sin Ctrl+C), el mismo `pkill` de arriba lo libera antes de relanzar:

```bash
pkill -f "node scripts/curar-obra.mjs"; pnpm curar-obra
```

## `pnpm relaciones-de-relato <id-de-relato>`

Paso final tras escribir (o tocar) un `.mdx` en `content/mitologia-griega/relatos/`.
Trabaja en tres fases sobre todo id que el relato cita de verdad —
`participantes`, `lugar` y cualquier `<E id="..." />` del cuerpo, no solo
`participantes`—:

1. **Alta de entidades.** Si el relato cita un id sin YAML propio (p. ej. un
   monstruo o un lugar nuevo que solo existía en la prosa), lo detecta y te
   pide, uno a uno, nombre/tipo/resumen para darlo de alta en
   `content/mitologia-griega/entidades/`. Sin esto, `<E id="..." />` revienta
   en build en cuanto Astro intenta resolver la entidad.
2. **Sugerencia por lectura.** Repasa las relaciones de acción de cada entidad
   citada y sugiere las que probablemente falten leyendo la prosa
   (heurístico de texto, no de lenguaje: puede fallar en frases con sujeto
   implícito o indirectas).
3. **Aplicación.** Cada sugerencia aceptada (y cualquier relación añadida a
   mano) se escribe de verdad en el YAML de la entidad sujeto — no es solo un
   listado, cambia el fichero en el disco.

```bash
pnpm relaciones-de-relato tifon-contra-zeus
```

Es interactivo (alta de entidades, `s/N` por cada sugerencia y luego relaciones a
mano). No lo lances en background: necesita tu respuesta en la terminal.

## `pnpm curar-relaciones`

Levanta un servidor local (puerto **4323**) con una UI en el navegador
(`scripts/curar-relaciones.html`): la misma tarea que `relaciones-de-relato`
(alta de entidades citadas sin YAML, sugerencia por lectura, relaciones a mano)
pero con formularios en vez de prompts de terminal. Elige un relato en el
desplegable y las tres fases aparecen como secciones de la página; cada alta o
relación se escribe en el YAML al confirmarla, igual que en el CLI.

```bash
pnpm curar-relaciones
# abre http://localhost:4323 en el navegador
```

Se queda en primer plano ocupando la terminal mientras el servidor está vivo
(mismo patrón que `curar-obra`); ábrelo en su propia pestaña/terminal para
compaginarlo con una sesión de Claude Code. Para pararlo, Ctrl+C, o si quedó
zombie: `pkill -f "node scripts/curar-relaciones.mjs"`.

## `pnpm indice-de-contenido`

Foto de dónde está el contenido, no un validador (para validar están los errores de
`validar-contenido`): qué relatos existen por era/capítulo (y cuáles faltan por
escribir), relatos escritos pero sin capítulo en `materia.yaml`, notas de huecos
futuros dejadas como comentarios en `materia.yaml`, entidades por tipo (marcando
cuáles tienen `.mdx` propio), y entidades sueltas o totalmente aisladas del grafo de
relaciones.

```bash
pnpm indice-de-contenido
```

No interactivo, no escribe nada — solo imprime por consola. Buen punto de partida al
retomar el proyecto (con o sin Claude Code a mano) para decidir qué entidad o relato
tocar a continuación.

## `pnpm validar-contenido`

Valida referencias cruzadas entre ficheros de `content/`: ids que no existen,
etiquetas/fuentes fuera del registro de `materia.yaml`, `foco` fuera de rango 0-100,
obras sin `imagen.origen`, resúmenes que faltan. Reporta `fichero:línea: mensaje`.
No interactivo, no escribe nada — solo lee y sale con código de error si hay
problemas.

```bash
pnpm validar-contenido
```

También corre automáticamente dentro de `pnpm build`. Es el script más barato de
lanzar a menudo: úsalo después de tocar cualquier YAML/MDX a mano, tanto si lo
editaste tú como si lo hizo Claude Code.

## Flujo sugerido en paralelo con Claude Code

1. Deja `pnpm curar-obra` corriendo en una terminal aparte mientras Claude Code
   trabaja en otra cosa (p. ej. un componente `.astro`) — no compiten por los
   mismos ficheros salvo que ambos toquéis la misma obra a la vez.
2. Si vas a dar de alta varias obras nuevas a mano, usa `nueva-obra` +
   `curar-obra` para las relaciones; corre `validar-contenido` al terminar cada
   tanda para detectar destinos rotos antes de que Claude Code construya sobre
   ellos.
3. Para relatos nuevos, `relaciones-de-relato` es el paso final tras escribir el
   MDX — sea quien sea quien lo haya escrito.

## Comitear desde el terminal

Estos scripts no comitean por ti. Una vez termines una tanda de cambios (curar
obras, completar relaciones, etc.), valida y comitea a mano:

```bash
pnpm validar-contenido
git status
git add content/ public/img/gr/
git commit -m "Curar obras: <resumen breve de lo que hiciste>"
git push
```

Ajusta las rutas de `git add` a lo que realmente tocaste (p. ej. añade
`content/mitologia-griega/relatos/` si trabajaste con `relaciones-de-relato`). Revisa
`git status` antes del `add` para no arrastrar ficheros que no querías incluir.
