> **Estado: propuesta pendiente de aprobar, todavía no aplicada.** Este documento es
> la respuesta de Claude Code al encargo de `prompt-claude-code-bloque-v.md` sobre
> `plan-gamificacion-aventura.md` — "propón y para" antes de tocar código. Se vuelca
> aquí para poder seguir la conversación desde otro ordenador. Cuando el bloque se
> aplique de verdad, este fichero se borra (o se reduce a nota histórica); no es
> documentación viva del proyecto como el resto de `docs/`.

# Bloque V — Base: vocabulario, sandbox diferencial y multi-materia

## Contexto

`plan-gamificacion-aventura.md` diagnostica que el modo aventura "se siente como un
índice con etiquetas de estado" en vez de un juego, por tres causas (el bloqueo no
bloquea, sandbox y aventura comparten vocabulario, no hay recompensa por dominar
nada) más una transversal: el estado tiene que sobrevivir a la segunda materia
(`historiadeespana`). El bloque V es la base sobre la que se apoyan W-Z: namespacea
el estado por materia antes de que le añadan campos nuevos, unifica el vocabulario
de estados, diferencia sandbox de aventura en la portada, y declara el contrato
multi-materia en `materia.yaml`.

Investigación contra el disco (no contra los documentos) hecha antes de este plan;
tres hallazgos cambian el trabajo respecto a lo que el encargo daba por hecho:

1. **`relatos: []` ya funciona.** El schema Zod no exige `.min(1)` y `cargarCapitulos`
   ya excluye los capítulos sin relatos escritos (`activo: false`) de la lista que
   alimenta la cadena de desbloqueo. Nada que tocar aquí.
2. **La colisión de "cerrado" ya existe en el código, no solo en el texto.**
   `calcularEstadosCapitulos` (`src/lib/estado.ts:101-122`) usa el mismo literal
   `"cerrado"` tanto para "examen superado" como para "todavía no alcanzado" — hace
   falta un valor nuevo en el enum, no un cambio de rótulo.
3. **El grep de §10 da hoy 13 ficheros, no cero.** Ver la sección dedicada más abajo:
   una parte se sanea de verdad en este bloque, otra parte queda excluida con una
   razón documentada porque arreglarla de verdad es una refactorización de
   arquitectura de contenido ajena a la gamificación.

## Decisiones ya confirmadas (por el usuario)

- **Vocabulario de capítulo activo:** se mantiene la distinción actual
  "Abierto" (activo, nada leído) vs "En curso" (activo, algo leído) — no se colapsan
  en un solo rótulo, aunque la tabla literal del §3 del plan solo liste tres filas.
- **Migración de `localStorage`:** se borra la clave global vieja (`trama:estado`)
  tras copiar su contenido a la clave namespaceada. Es un movimiento de una sola vez:
  en cuanto se ejecuta, el código nunca vuelve a escribir en la clave vieja.
- **Namespacing por materia:** vía atributo en el DOM. `Base.astro` estampa
  `data-materia={materiaSlug}` en `<html>`; `estado.ts` lo lee internamente. Las
  firmas de `leerEstado()`, `guardarEstado()`, `estadoPorDefecto()`,
  `exportarEstado()`, `importarEstado()` no cambian — cero cambios en los ~12
  ficheros que ya las llaman.
- **CI del grep de §10 ("saneo completo"):** con el matiz de la sección siguiente.

## El grep de §10: qué se sanea de verdad y qué queda excluido, y por qué

`grep -riE "grieg|mito|titan|zeus|olimp|hesiod" src/` da hoy coincidencias en 13
ficheros. Investigando cada uno, no todos son del mismo tipo:

**Se arreglan de verdad (bugs reales o texto):**
- `src/components/E.astro` y `src/components/Fuente.astro` hardcodean
  `getEntry("materias", "mitologia-griega")` — no reciben la materia de ningún sitio,
  literalmente no podrían resolver una segunda materia. Se resuelven leyendo
  `Astro.params.materia` (el slug de la ruta actual, disponible en cualquier
  componente del árbol de una misma request/generación, no solo en la página) y
  buscando el entry cuyo `data.slug` coincida, en vez de la constante fija.
  **Nota de riesgo:** no hay forma de verificarlo sin levantar el dev server —
  primer paso de la verificación de este bloque, antes de dar el resto por bueno.
- `src/pages/index.astro` hardcodea `<a href={rutaMateria("gr")}>Mitología griega</a>`
  — se sustituye por un listado real de la colección `materias` (hoy una, pero deja
  de estar cableado a "gr").
- `src/pages/[materia]/c/[id].astro:53` — `tipo: nodo?.tipo ?? "mito"` de fallback. Se
  cambia a `"desconocido"`. `Casilla.astro:35` ya tiene fallback de color seguro
  (`var(--color-tipo-${tipo}, var(--color-tarjeta-borde))`), así que no rompe nada.
- Comentarios en `src/lib/arbol.ts`, `pertenencia.ts`, `identificar.ts`, `grafo.ts`,
  `rutas.ts`, `tarjetas.ts` y `src/pages/[materia]/album.astro` que citan a Zeus,
  Titanomaquia o "mito" como ejemplo — se reescriben con ejemplos neutros.

**Se excluyen del grep, con excepción documentada en el propio script:**
- `src/content.config.ts` — las 4 rutas literales `./content/mitologia-griega/...`
  son estructurales: cada `defineCollection` está atada a una carpeta. Hacerlo
  genérico por materia es cargar el mecanismo de *loaders* de content collections
  para que descubra materias dinámicamente — una refactorización de arquitectura de
  contenido, no de gamificación, y no la voy a colar dentro de "Base".
- `src/styles/tokens.css` — las 11 variables `--color-tipo-<tipo>` (de las cuales
  solo `titan` y `mito` matchean el regex; `dios`, `heroe`, `monstruo`, etc. son
  igual de específicas de Grecia y no lo matchean por casualidad de vocabulario).
  Renombrar solo las 2 que coinciden con el regex sería teatro, no una solución: el
  sistema entero de "un color CSS fijo por tipo" no es multi-materia hasta que los
  colores salgan de datos (`materia.yaml` o un hash), y eso tampoco es gamificación.

El script nuevo (`scripts/comprobar-src-neutral.mjs`, ver más abajo) documenta estas
dos exclusiones con un comentario explicando el motivo, para que no se lean como un
descuido si alguien las encuentra luego.

**Si prefieres no aceptar estas dos exclusiones** — por ejemplo, si quieres que
`content.config.ts` se generalice ya — dímelo ahora: es un bloque de trabajo bastante
más grande y preferiría que fuera una decisión explícita, no un efecto colateral de
"saneo completo" en Bloque V.

## Ficheros a tocar

### Estado y namespacing

- **`src/lib/estado.ts`**
  - `claveEstado(materiaSlug)` → `` `trama:estado:${materiaSlug}` `` sustituye a la
    constante `CLAVE` fija.
  - Nueva función privada `materiaActual()`: lee
    `document.documentElement.dataset.materia`; lanza si falta (todo módulo que use
    `estado.ts` vive bajo `[materia]/`, así que faltar es un error de programación,
    no un caso a degradar en silencio).
  - `leerEstado()`: si la clave namespaceada no existe, mira la clave vieja global
    `trama:estado`; si existe, la parsea, normaliza, la guarda en la clave nueva y
    **borra la vieja** (`localStorage.removeItem`), luego devuelve el estado migrado.
  - `EstadoVisualCapitulo`: pasa de `"abierto" | "en-curso" | "cerrado"` a
    `"bloqueado" | "abierto" | "en-curso" | "superado"`.
  - `calcularEstadosCapitulos`: capítulo completado → `"superado"` (antes
    `"cerrado"`); primero sin completar → `"abierto"` o `"en-curso"` (igual que hoy);
    el resto → `"bloqueado"` (antes también `"cerrado"`, de ahí la colisión).
  - `EstadoCapitulo` (el tipo persistido, con `estado: "cerrado"|"abierto"|"en-curso"`)
    **no cambia** — sigue siendo el enum interno que ya usa `examen.astro`; solo se
    renombra la capa visual/calculada.

- **`src/layouts/Base.astro`** — añade `data-materia={materiaSlug}` al `<html>`
  (condicionado a que `materiaSlug` exista, igual que ya condiciona la navegación).

### Vocabulario y sandbox diferencial en la portada

- **`src/pages/[materia]/index.astro`**
  - Fallback server-side antes de hidratar: `"Cerrado"` → `"Bloqueado"` (línea 60).
  - Frontmatter: por cada capítulo activo, calcula además
    `{ relatos: c.relatosEscritos.length, entidades: c.conjunto.size, tarjetas: (await generarTarjetas(materiaId, c.conjunto)).length }`
    y lo mete en el JSON `datos-capitulos` (reutiliza `generarTarjetas`, mismo patrón
    que `examen.astro:37`).
  - Script cliente: lee `leerEstado()` una vez.
    - **Aventura:** `calcularEstadosCapitulos` con el mapa de textos nuevo:
      `{ bloqueado: "Bloqueado", abierto: "Abierto", "en-curso": "En curso", superado: "Superado" }`.
      `data-estado-capitulo` se sigue estampando con el valor calculado.
    - **Sandbox:** para cada capítulo activo, `.estado` pasa a
      `` `${relatos} relato${relatos===1?"":"s"} · ${entidades} entidad${entidades===1?"":"es"} · ${tarjetas} tarjeta${tarjetas===1?"":"s"}` ``
      (pluralización mínima, sin librería). No se toca `href` de la fila: en sandbox
      se sigue entrando al capítulo para leer — es el modo enciclopedia, sacar la
      lectura de la portada no tendría sentido con el diagnóstico del propio
      documento (§1). "La acción pasa a practicar" se resuelve dentro de la página
      del capítulo, no en la portada (ver siguiente punto).
  - CSS: `.fila-capitulo[data-estado-capitulo="cerrado"]` →
    `[data-estado-capitulo="bloqueado"]` (solo el bloqueado se atenúa; superado no,
    es un logro).

- **`src/pages/[materia]/c/[id].astro`** — añade un segundo bloque junto a
  `.tarjeta-examen`, oculto por defecto, con el botón "Practicar este capítulo" que
  enlaza a la nueva ruta (siguiente punto). Script cliente: si `leerEstado().modo === "sandbox"`,
  oculta `#bloque-examen` y muestra `#bloque-practicar` (mismo patrón que
  `album.astro:150-153`).

- **`src/pages/[materia]/c/[id]/practicar.astro`** (nueva ruta) — práctica de
  tarjetas sueltas acotada al conjunto del capítulo. Reutiliza
  `generarTarjetas(materiaId, capitulo.conjunto)` (igual que `examen.astro`) y
  `tarjetasDisponibles` (igual que `practicar.astro`, que ya es un no-op en modo
  sandbox por `disponibilidad.ts:13`). La UI de tarjeta-flip de `practicar.astro` se
  extrae a un módulo compartido `src/lib/practicarCliente.ts` (misma lógica, dos
  puntos de entrada) en vez de duplicar el script; `practicar.astro` pasa a
  importarlo también.

- **`src/lib/rutas.ts`** — nueva `rutaPracticarCapitulo(materiaSlug, id)` →
  `` `${base()}${materiaSlug}/c/${id}/practicar/` ``.

- **`src/lib/capitulos.ts`** — el interfaz `Capitulo` gana `relatosEscritos: string[]`
  (hoy se calcula como variable local `relatosEscritos` dentro de `cargarCapitulos`
  y se descarta; solo hay que devolverlo).

### Esquema y contenido multi-materia

- **`src/content.config.ts`** — `materiaSchema` gana dos campos opcionales,
  hermanos de `niveles`:
  - `tipos_coleccionables: z.array(z.string()).optional()`
  - `etiqueta_eje_temporal: z.string().optional()`
  No se consumen todavía (son del bloque Y y de la interfaz de Design), solo se
  declaran. Nada que cambiar en el schema de `capitulos.relatos` — ya admite `[]`.

- **`content/mitologia-griega/materia.yaml`** — añade, junto a `niveles`:
  ```yaml
  tipos_coleccionables: [ primordial, titan, dios, heroe, monstruo ]
  etiqueta_eje_temporal: Eras
  ```

- **`scripts/validar-contenido.mjs`** — `cargarMateria()` devuelve además el
  conjunto de todos los ids de `relatos` referenciados en `materia.capitulos` (unión
  sobre todos los capítulos declarados, activos o no); en `main()`, cada relato de
  `documentosRelatos` cuyo id no esté en ese conjunto es un error de build:
  `` `relato "${id}" no está en ningún capítulo` `` en la línea de su `id`.

- **`scripts/comprobar-src-neutral.mjs`** (nuevo) — ejecuta el grep de §10 sobre
  `src/`, excluyendo `content.config.ts` y `styles/tokens.css` con comentario
  explicando el motivo (arriba). Sale con código 1 y lista de coincidencias si algo
  matchea.

- **`package.json`** — `"build"` pasa a
  `"node scripts/validar-contenido.mjs && node scripts/comprobar-src-neutral.mjs && astro build"`.

## Verificación (ficha del bloque, §13)

1. Levantar el dev server y comprobar que una ficha de entidad (`<E id="..." />` en
   un relato) y una cita (`<Fuente ... />`) siguen resolviendo bien tras el cambio en
   `E.astro`/`Fuente.astro` — es el punto de más riesgo de todo el bloque.
2. `node scripts/comprobar-src-neutral.mjs` da cero (con las dos exclusiones
   documentadas).
3. `node scripts/validar-contenido.mjs` sigue en verde con el contenido actual (sin
   huérfanos hoy).
4. Cambiar de modo en la portada cambia el vocabulario completo (aventura: Bloqueado
   / Abierto / En curso / Superado; sandbox: recuento de contenido), no solo el
   color.
5. Un capítulo con `relatos: []` compila y sale como "Próximamente", y la cadena de
   desbloqueo lo salta (ya era así; confirmar que sigue siéndolo).
6. Un estado guardado con la clave antigua (`trama:estado`) migra a
   `trama:estado:gr` en la primera carga tras el cambio, y la clave vieja desaparece.
   Roundtrip completo: exportar, restablecer, importar, comprobar que coincide.
7. En modo sandbox, la página de un capítulo muestra "Practicar este capítulo" en
   vez del examen, y ese botón lleva a un mazo de tarjetas acotado a ese capítulo.
8. `git status --short` al terminar.
