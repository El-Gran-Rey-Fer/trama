# Calendario de construcción

Compañero de `esqueleto-proyecto.md`. El esqueleto dice **qué** se construye; este documento dice
**en qué orden, con qué herramientas y cómo saber que un paso está terminado**.

---

## Cómo usar este documento

La unidad es la **sesión**: un rato en el que te sientas a trabajar. No hay horas ni semanas
porque el ritmo real es irregular. Si una sesión cunde y cierras dos hitos, mejor.

Cada hito está escrito para ser autosuficiente. Para trabajar uno en una conversación nueva,
adjunta `esqueleto-proyecto.md` + este documento y di qué hito vas a hacer. La sección de cada
hito ya contiene el contexto, lo que entra, lo que **no** entra y cómo verificar que terminó.

**Las tres partes no son equivalentes:**

- **Parte I (PoC)** — tres hitos, en orden estricto, bloqueantes. Hasta que no acaben, todo lo
  demás está en suspenso.
- **Parte II (consolidación)** — nueve bloques independientes. Orden libre, ataca el que te apetezca.
- **Parte III (v2)** — bloques grandes, cada uno con su propio riesgo. No empiezan hasta que la
  Parte II esté razonablemente cerrada.

---

## Reglas que no cambian

1. **`src/` es desechable, `content/` es el activo.** Puedes tirar toda la interfaz y rehacerla
   sin tocar una línea de contenido. Rediseñar cuesta lo mismo con 10 entidades que con 400.
2. **No escribas volumen de contenido hasta cerrar el esquema** (final del hito 2). Diez entidades
   y un relato. Todo lo demás se puede rehacer barato; el contenido redactado, no.
3. **La regla invariante se protege con un test, no con disciplina.** Ver hito 4.
4. **Reserva los huecos aunque no los implementes.** Ver la sección siguiente.
5. **El esquema se cambia cuando duele, sin ceremonia.** Es más barato ahora que nunca.

---

## Huecos a reservar en el hito 1

Campos que **no se implementan** en el PoC pero cuya forma se decide ya, porque retrofitearlos
a un grafo poblado es lo más caro que hay en este proyecto. Basta con que el esquema los admita
como opcionales y el cargador no se rompa si están.

| Hueco | Forma | Lo desbloquea |
|---|---|---|
| Idiomas | Bloque `idiomas` en `materia.yaml`, `nombre_i18n` opcional en entidad | Bloque G |
| Enlaces externos | Lista `enlaces` con `tipo` + `url`, y `wikidata` opcional | Bloque H |
| Timeline | `era` + `orden` en entidades y relatos; `eras` ordenadas en `materia.yaml` | Bloque J |
| Mapa | `coordenadas: {lat, lon}` y `mapeable: bool` en lugares | Bloque M |
| Rutas de aprendizaje | Bloque `rutas` en `materia.yaml` | Bloque N |

Ninguno cuesta más de tres líneas ahora. Todos cuestan un script de migración después.

---

# Parte I — PoC

Tres sesiones. La tesis que validan es esta:

> Escribes `hijo_de: crono` **una vez** y obtienes cuatro cosas: la ficha de Zeus, la ficha de
> Crono con la inversa, la tarjeta "¿quién es el padre de Zeus?" y la tarjeta "¿quién es hijo
> de Crono?".

Eso es lo que no tiene Wikipedia y lo único que justifica construir esto. El PoC existe para
saber si es verdad y si además es agradable de usar.

**Contenido semilla** (el mismo para los tres hitos, escrito en el hito 1):

- Tres generaciones: Urano, Gea → Crono, Rea → Zeus, Hera, Poseidón, Hades
- Un relato completo: la Titanomaquia, que engancha las tres generaciones
- Dos entidades no-personaje: el rayo y el Olimpo, para comprobar que el esquema aguanta
  objetos y lugares y no solo dioses

Da ~25 aristas y ~40 tarjetas automáticas. Contenido real, no lorem ipsum: si el relato es
texto falso no puedes juzgar si leer con enlaces incrustados funciona.

---

## Hito 1 — Se navega

**Objetivo:** hacer clic de Zeus a Crono a Rea y volver, desde el móvil, en una URL pública.

**Entra:**
- Proyecto Astro 7 + TypeScript `strict` + despliegue a GitHub Pages funcionando **antes** que
  cualquier otra cosa
- 10 entidades YAML con el contenido semilla
- `materia.yaml` con los tipos de relación que usan esas 10 entidades, y los huecos reservados
- `grafo.ts`: carga, indexa por id, resuelve inversas
- `FichaEntidad.astro` y la ruta `/[materia]/e/[id]`
- Un índice de materia que liste las entidades

**No entra:** validación, estilo más allá de que se lea, fuentes/variantes, relaciones simétricas
o comodín, idiomas, enlaces externos.

**Herramientas:**

| Qué | Por qué |
|---|---|
| Node 22+ | Mínimo de Astro desde la versión 6 |
| Astro 7 | Content Layer con loader `glob()` — lee `.yaml` de forma nativa |
| pnpm | Rápido y con `node_modules` sano |
| Zod 4 (viene con Astro) | Campos obligatorios y tipos validados gratis en el build |
| Biome | Linter + formateador en una sola herramienta |
| GitHub Actions + `withastro/action` | Workflow oficial, ~15 líneas |
| Claude Code | Fase mecánica y bien documentada — es donde más rinde |

**Trampas concretas:**
- Si el repo es un *project page* (`usuario.github.io/proyecto`), configura `site` y `base` en
  `astro.config.mjs` **en el primer commit**. Si no, todo funciona en local y nada en producción.
- `grafo.ts` debe fusionar entidades YAML y frontmatter MDX en un mismo índice desde el principio,
  aunque en este hito todavía no haya MDX. Añadirlo después es un parche.
- Al resolver la inversa, propaga también la fuente de la arista original. Todavía no la usas,
  pero si el cargador no lo contempla lo vas a arreglar dos veces.

**Terminado cuando:** el sitio está desplegado y navegas el grafo con el pulgar.

---

## Hito 2 — Se lee

**Objetivo:** cerrar el bucle. Leo un mito → clico en un personaje → veo su ficha → vuelvo.
Este es el hito que decide si el esquema aguanta.

**Entra:**
- `@astrojs/mdx`
- La Titanomaquia **escrita entera**, no un párrafo de prueba
- `<E id="…" />` como enlace normal
- Ruta `/[materia]/m/[id]` y layout de lectura
- Los relatos aparecen en la ficha de sus participantes (la inversa de `participantes`)

**No entra:** la mini-ficha al pasar el ratón. Es agradable, no es la tesis. Va al bloque D.

**Esta es la puerta de decisión del proyecto.** El relato entero va a contestar:
- ¿`participantes` basta, o hace falta distinguir protagonista de figurante?
- ¿Los relatos declaran `relaciones` propias tan a menudo que debería ser campo de primera clase?
- ¿`orden: 47` escala, o vas a renumerar cada vez que insertes un mito entre dos?
- ¿Cuántos `<E />` por párrafo hacen que el texto sea incómodo de leer?

**Si algo chirría, para y cambia el esquema.** Con 10 entidades es una tarde.

**Terminado cuando:** lees la Titanomaquia de principio a fin sin que te apetezca cambiar nada
del formato.

---

## Hito 3 — Se practica

**Objetivo:** comprobar que el material generado automáticamente desde el grafo es material de
estudio decente.

**Entra:**
- `tarjetas.ts` con **una sola familia de plantillas**: las de relación, declaradas en
  `materia.yaml`
- Ruta `/[materia]/practicar`: baraja barajada, tarjeta, la giras, siguiente
- Contador de "quedan N"

**No entra:** SM-2, `localStorage`, progreso persistente, plantillas de atributo, alias o
epítetos, tarjetas manuales, opción múltiple.

**Por qué no entra el SRS:** la pregunta que estás respondiendo es si las preguntas derivadas
del grafo valen la pena. Una baraja tonta la contesta igual de bien que un algoritmo completo,
y el algoritmo no cambia según la respuesta.

**Decisión que sí hay que tomar aquí, aunque no persistas nada:** el id de tarjeta tiene que ser
**derivado del contenido y determinista** — `zeus:padre_de:atenea`, `zeus:attr:simbolo` — nunca
un índice de array. En cuanto el bloque C persista progreso, un id inestable borra el historial
del usuario cada vez que insertes una entidad.

**Terminado cuando:** te pasas la baraja entera y sabes si esto le sirve a Cami o no.

---

## Decisión después del hito 3

Si el PoC dice que sí, sigue a la Parte II en el orden que quieras.

Si dice que no, has gastado tres sesiones y `content/` sobrevive intacto para lo que decidas
montar en su lugar.

---

# Parte II — Consolidación

Nueve bloques independientes. Ninguno bloquea a otro salvo donde se indica. Esta es la ventaja
real de haber separado `src/` de `content/`.

---

### Bloque A — Validación en el build *(1-2 sesiones)*

`validar.ts` y los seis fallos de la sección 7 del esqueleto. Zod ya te cubre los campos
obligatorios y los tipos; `reference()` de Astro valida que `destino`, `participantes` y
`menciona` apunten a ids existentes. Lo que tienes que escribir a mano es la comprobación de
relaciones no declaradas, ids duplicados, fuentes fuera del registro y `principal` múltiple.

Para el "¿querías decir `padre_de`?": `fastest-levenshtein`, o veinte líneas propias.

**Incluye aquí el test de la regla invariante:** lee todos los ids de `content/`, haz grep sobre
`src/`, falla si aparece alguno. Quince líneas, y es lo único que te va a mantener honesto
cuando tengas prisa.

**Verificación:** rompe a propósito cada uno de los seis casos y comprueba que el mensaje se
entiende sin abrir el código.

---

### Bloque B — Fuentes y variantes *(1-2 sesiones)*

Hasta ahora has elegido entidades que no se contradicen. Aquí entra Afrodita.

- Registro `fuentes` en `materia.yaml`
- `fuente` + `principal` en las relaciones, con "sin fuente = principal" normalizado al cargar
- La ficha agrupa variantes por fuente ("según Homero…")
- `tarjetas.ts` excluye lo que no sea `principal`

**Dependencia oculta:** esto cambia la generación de tarjetas, así que tiene que estar hecho
antes del bloque K (quiz), que es donde una variante mal tratada produce una respuesta marcada
como incorrecta siendo correcta.

**Caso de prueba:** Afrodita, hija de Urano según Hesíodo y de Zeus y Dione según Homero.
Diséñalo con ella delante, no con Zeus.

---

### Bloque C — SRS y progreso *(2-3 sesiones)*

- `srs.ts`: SM-2 simplificado, ~100 líneas, función pura
- `progreso.ts`: wrapper de `localStorage`
- La página de práctica pasa a mostrar solo lo pendiente

**Vitest entra aquí obligatoriamente.** Simula 30 días de repasos: los bugs de intervalos no se
ven a ojo y se descubren tres semanas después.

**Tres cosas que no son opcionales:**
1. Ids de tarjeta derivados del contenido (ya decidido en el hito 3)
2. JSON versionado desde el primer día: `{ v: 1, tarjetas: {…} }`. Sin eso no puedes migrar nunca
3. **Exportar / importar progreso como fichero.** Veinte líneas, y es la única defensa del
   usuario contra borrar los datos del navegador. Descartaste cuentas y sincronización; esto
   ocupa su hueco

---

### Bloque D — Prosa enlazada completa *(1 sesión)*

La mini-ficha al pasar el ratón sobre `<E />`.

Empieza sin JavaScript: un `<a>` con la mini-ficha en un contenedor oculto que CSS muestra al
hacer hover cubre el 90 % de los casos. Si necesitas posicionamiento fino, la **Popover API +
CSS anchor positioning** ya tienen soporte razonable; **Floating UI** (~3 KB) es la alternativa
si necesitas compatibilidad amplia.

---

### Bloque E — Colección y páginas editoriales *(1 sesión)*

`<Coleccion filtro={…} orden="…" />` y las dos rutas de página editorial.

**Decisión importante:** el filtro es un objeto declarativo cerrado (`{ tipo, etiquetas,
relacion }`), nunca una función. Si permites funciones arbitrarias en MDX, `content/` empieza a
contener lógica y la regla invariante se te cuela por la puerta de atrás.

---

### Bloque F — Tabla comparativa *(1 sesión)*

Tu primera isla. Aquí eliges el framework de islas para todo el proyecto.

**Preact** (`@astrojs/preact`): ~3 KB frente a ~45 de React, misma sintaxis, y tus dos islas no
necesitan nada del ecosistema React. Svelte es igual de válido. Lo que no harías es meter React
para ordenar una tabla en un sitio cuyo argumento es que carga instantáneo.

**Regla para todas las islas:** los datos se calculan en build y se pasan como props
serializadas. La isla ordena y filtra sobre un array que ya tiene; nunca toca el grafo.

---

### Bloque G — Idiomas *(2 sesiones)*

Regla que gobierna todo el bloque:

> El español es el idioma canónico del contenido. Se traducen el esqueleto y el vocabulario,
> nunca la prosa. Una traducción de prosa es una excepción deliberada por fichero.

| Capa | Volumen | ¿Se traduce? |
|---|---|---|
| Interfaz | ~100 cadenas, fijo | Sí, una vez |
| Vocabulario de materia (tipos, relaciones, atributos) | ~30 términos, cerrado | Sí, una vez |
| Plantillas de pregunta | ~15, en `materia.yaml` | Sí, una vez |
| Nombres de entidad | Casi todos idénticos | Solo las excepciones |
| **Prosa de relatos y ensayos** | **Ilimitado** | **No** |

Las cuatro primeras filas son finitas: añadir francés cuesta una tarde y no vuelve a costar nada.

**Implementación:**
- Routing i18n nativo de Astro — `/es/gr/e/zeus`
- `etiqueta: { es: …, en: …, fr: … }` en cada relación y atributo de `materia.yaml`
- `nombre_i18n` opcional solo donde el nombre difiera de verdad (el rayo → thunderbolt → foudre).
  Zeus, Hera y Creta no necesitan nada; los equivalentes romanos ya están en `alias`
- Prosa: `rapto-de-europa.mdx` canónico + `rapto-de-europa.en.mdx` opcional. Si no existe, se
  muestra el español con un aviso explícito

**El regalo:** las tarjetas salen traducidas gratis. Como no existe ningún fichero de preguntas,
traducir 15 plantillas traduce las 2.000 tarjetas que acabes teniendo.

**Nota pedagógica:** un selector de idioma global es contraproducente si el objetivo es que Cami
aprenda español — se pone en inglés el primer día y no vuelve. Funciona mejor como escape hatch
localizado: español por defecto siempre, con un "ver en inglés" por bloque para cuando se atasca.

---

### Bloque H — Enlaces externos *(media sesión)*

Genérico desde el principio, no un campo `wikipedia:`:

```yaml
enlaces:
  - tipo: wikipedia
    url: https://es.wikipedia.org/wiki/Zeus
  - tipo: theoi
    url: https://www.theoi.com/Olympios/Zeus.html
```

Los tipos de enlace se declaran en `materia.yaml`, igual que las relaciones. Cuando entre
mitología nórdica vas a querer otras fuentes.

**La versión elegante, si ya hiciste el bloque G:** guarda `wikidata: Q34` en vez de tres URLs y
resuelve los sitelinks en build. Una línea por entidad en lugar de tres, y la Wikipedia en los
tres idiomas sale sola.

**Precaución de diseño:** ponlo en un pie de "para saber más", no como botón destacado. Si el
enlace a Wikipedia es lo más visible de la ficha, le estás diciendo al lector que tu contenido
es el resumen y el bueno está fuera.

---

### Bloque I — Contenido a volumen *(continuo)*

Antes de escribir la entidad número once, media sesión de herramientas de autoría:

1. **Genera un JSON Schema desde `materia.yaml`** y engánchalo a la extensión YAML de VS Code.
   Autocompletado de tipos de relación mientras escribes y errores en rojo antes del build. Es el
   mejor retorno por tiempo invertido de todo el proyecto.
2. Un script `pnpm nuevo entidad zeus` que escupa el esqueleto con los campos obligatorios.

Objetivo del bloque: los doce olímpicos y sus mitos principales.

---

# Parte III — v2

Bloques grandes. Cada uno tiene un riesgo propio y ninguno es prerrequisito de otro.

---

### Bloque J — Timeline dual *(2-3 sesiones)*

El requisito del esqueleto §3.5: soportar orden relativo (mitología) y fechas absolutas
(historia) **desde el diseño**, no reescribirlo cuando entre historia.

**La decisión que lo hace o lo rompe:** el componente no debe saber en qué modo está. Normaliza
los dos al cargar a una misma estructura ordenable:

- Modo relativo: `(índice_de_era, orden)` — clave numérica compuesta
- Modo absoluto: fecha — clave numérica

El componente recibe `{ clave, etiqueta, precision }` y dibuja. Si en algún sitio del componente
hay un `if (modo === 'relativo')`, lo has hecho mal.

**Lo que se olvida siempre:** `precision`. Una fecha `exacta` es un punto; `siglo`, `aprox` y
`legendaria` son bandas. Si no lo contemplas en el primer diseño, retrofitear bandas a un
componente que dibuja puntos es reescribirlo.

**Prerrequisito:** `era` declarado en `materia.yaml` con orden explícito, y `orden` relleno en el
contenido. O sea: no lo hagas antes del bloque I o el timeline saldrá vacío.

---

### Bloque K — Quiz con distractores *(1-2 sesiones)*

El quiz **no es un generador nuevo**: consume las mismas tarjetas que el SRS y las presenta
distinto. `tarjetas.ts` emite; el quiz es una vista.

Lo único de verdad nuevo es la selección de distractores, y ahí hay una trampa seria.

**La trampa:** el esqueleto dice "entidades del mismo `tipo` que no tengan esa relación". Si lo
implementas literalmente sobre relaciones `principal`, Afrodita rompe el quiz: "¿quién es el
padre de Afrodita?" con respuesta Urano puede ofrecerte Zeus como distractor — y Zeus **es** su
padre según Homero. El usuario acierta y le dices que ha fallado.

**Regla:** excluye del conjunto de distractores toda entidad conectada por ese tipo de relación
bajo **cualquier** fuente, no solo la principal. Y excluye también la relación inversa.

**Calidad de distractor** (por orden de dificultad creciente para el jugador):
1. Mismo `tipo` — la línea base del esqueleto, a menudo demasiado fácil
2. Mismo `tipo` + misma `generacion` o etiquetas compartidas
3. Entidades que aparecen en los mismos relatos — vecinas en el grafo

Empieza por la 1, mide si aburre, sube.

**Prerrequisito real:** bloque B. Sin fuentes bien modeladas el quiz produce falsos negativos.

---

### Bloque L — Árbol y grafo de relaciones *(riesgo alto — ver contención)*

El propio esqueleto lo marca como el que más riesgo de agujero negro tiene. Tiene razón, así que
esta ficha es sobre todo contención.

**Nunca renderices "el grafo".** Con 200 entidades es una madeja ilegible y no enseña nada.
Lo que sirve es una vista **acotada**: red-ego a profundidad 2 desde una entidad, filtrada a
**una** familia de relaciones. Genealogía sola es un árbol, y los árboles tienen layouts resueltos.

**Herramienta:** `d3-hierarchy` (tidy tree, determinista, layout reproducible), **no** `d3-force`.
La simulación de fuerzas es un sumidero de tiempo y da un dibujo distinto en cada carga.

**El truco que lo hace barato:** calcula el layout **en build** y sirve SVG estático. Cero
JavaScript en el cliente, cero salto visual, y encaja con todo lo demás del proyecto.

**Contención:** date un límite de sesiones por adelantado. Si al agotarlo el grafo general no
funciona, **entrega solo el árbol genealógico y cierra el bloque.** El árbol genealógico ya es el
80 % del valor; el grafo general es el 20 % que cuesta el 300 %.

---

### Bloque M — Mapa geográfico *(1-2 sesiones)*

**Prerrequisito de esquema:** `coordenadas: {lat, lon}` en los lugares, y un `mapeable: false`
para el Hades, el Tártaro y todo lo que no está en ningún sitio. Sin ese flag el mapa te pide
coordenadas para el inframundo.

**Decisión de herramienta:** para mitología, un **mapa base SVG estilizado del Mediterráneo** con
puntos encima gana a Leaflet + teselas de OpenStreetMap. Sin dependencia de red, sin claves de
API, encaja con el tono, y las fronteras modernas sobre un mapa de mitos son ruido. Reserva las
teselas reales para cuando entre historia, donde la geografía precisa sí importa.

Es el bloque menos cargado pedagógicamente de la Parte III. Buen candidato a hacerlo el último,
o a no hacerlo.

---

### Bloque N — Progreso y ruta de aprendizaje *(2 sesiones)*

Son dos cosas distintas y la segunda es la interesante.

**Panel de progreso** — barato una vez existe el bloque C. Lee `localStorage`, muestra cobertura
por tipo y por etiqueta: "conoces 8 de los 12 olímpicos", "te faltan 3 titanes". Sale del grafo
cruzado con el historial.

**Ruta de aprendizaje** — el orden en que conviene recorrer la materia. Aquí hay una tentación
que conviene resistir: derivarla del grafo automáticamente. No funciona. El grafo sabe que Crono
es padre de Zeus, pero no sabe que conviene empezar por los olímpicos y volver luego a los
titanes. Eso es criterio pedagógico, no topología.

**Declárala a mano en `materia.yaml`:**

```yaml
rutas:
  fundamentos:
    nombre: Los doce olímpicos
    pasos:
      - { tipo: coleccion, filtro: { etiquetas: [olimpico] } }
      - { tipo: relato, id: titanomaquia }
      - { tipo: practicar, filtro: { etiquetas: [olimpico] } }
```

Editorial, legible, y crece a mano al ritmo al que crece el contenido.

---

## Resumen de dependencias

```
Hito 1 ──> Hito 2 ──> Hito 3 ──┬──> A  validación
                                 ├──> B  fuentes ───────> K  quiz
                                 ├──> C  SRS ────────────> N  progreso
                                 ├──> D  prosa enlazada
                                 ├──> E  colección
                                 ├──> F  tabla comparativa
                                 ├──> G  idiomas ────────> H  enlaces (versión Wikidata)
                                 ├──> H  enlaces
                                 ├──> I  contenido ──────> J  timeline
                                 ├──> L  árbol/grafo
                                 └──> M  mapa
```

Fuera de esas cuatro flechas, el orden lo eliges tú.
