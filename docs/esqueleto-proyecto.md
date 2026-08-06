# Esqueleto del proyecto

Plataforma de aprendizaje para dominios narrativos. Materia inicial: mitología griega.
Materias previstas a medio plazo: otras mitologías (nórdica, egipcia), historia.

---

## 1. Decisiones cerradas

| Decisión | Elección | Por qué |
|---|---|---|
| Framework | Astro | Contenido en Markdown/MDX, JS solo donde hace falta (islas) |
| Hosting | GitHub Pages | Gratis, sitio estático, cero mantenimiento |
| Backend | Ninguno | No hay cuentas ni sincronización en v1 |
| Persistencia | `localStorage` | Progreso y SRS viven en el navegador |
| Datos de consulta | YAML, un fichero por entidad | Se edita a mano sin dolor, diffs de git legibles |
| Contenido de lectura | MDX con frontmatter | Prosa con bloques intercalados |
| Idioma de la interfaz | Español | — |

### La regla invariante

> `src/` nunca menciona una entidad concreta. `content/` nunca importa de `src/`.

Todo componente recibe datos por props o los pide al grafo. En el momento en que aparece
`if (id === 'zeus')` dentro de un componente, el proyecto ha dejado de ser una plataforma
y ha vuelto a ser una web de mitología griega.

### La regla de formato

> YAML para lo que se consulta. MDX para lo que se lee.

Una ficha de Zeus son campos. Un relato es un texto. No se mezclan.

---

## 2. Los tres tipos de contenido

Todo lo que existe en la plataforma es una de estas tres cosas. La distinción no es
cosmética: determina dónde vive, cómo se escribe y si genera tarjetas.

| Tipo | Ejemplos | Formato | Tarjetas |
|---|---|---|---|
| **Entidad** | Zeus, Europa, el rayo, el Olimpo | YAML puro | Automáticas |
| **Relato** | El rapto de Europa, la Titanomaquia | MDX con frontmatter | Automáticas |
| **Página editorial** | Los doce olímpicos, etimología de Zeus | MDX con frontmatter | Solo manuales |

**Un relato es una entidad de pleno derecho.** Tiene id, participantes, lugar y orden, y
además un cuerpo en prosa. Esto es lo que resuelve el problema de los personajes que salen
en todas partes: la página de Heracles no lista sus mitos porque alguien los escribiera
allí, sino porque cuarenta relatos lo declaran en `participantes` y la ficha muestra la
inversa. Escribes el mito de la Hidra y Heracles se actualiza solo.

---

## 3. Modelo de datos

### 3.1 Entidad

`content/mitologia-griega/entidades/zeus.yaml`

```yaml
id: zeus
tipo: dios
nombre: Zeus
alias:
  - Ζεύς
  - Júpiter        # equivalente romano
epitetos:
  - Tonante
  - Padre de los dioses
resumen: >
  Rey de los dioses olímpicos y señor del cielo y el trueno.
atributos:          # libres por materia, declarados en materia.yaml
  dominio: cielo, trueno, ley
  simbolo: rayo, águila, roble
  culto: Olimpia, Dodona
relaciones:
  - tipo: hijo_de
    destino: crono
  - tipo: padre_de
    destino: atenea
etiquetas: [olimpico, primera-generacion]
generacion: 2       # para el timeline en modo relativo
imagen: /img/gr/zeus.jpg
```

Campos obligatorios: `id`, `tipo`, `nombre`, `resumen`. Con esos cuatro ya renderiza.

### 3.2 Relaciones

Viven dentro de la entidad. El grafo se construye al cargar y **resuelve las inversas
automáticamente**: escribes cada relación una sola vez.

#### El registro es ampliable, no cerrado

`materia.yaml` no es una cárcel: es un registro. Añadir un tipo nuevo son tres líneas.
Lo que hace el sistema es **fallar en el build si usas una relación no declarada**, y
sugerir la más parecida:

```
✗ content/.../heracles.yaml:14
  Relación "padre" no declarada en materia.yaml
  ¿Querías decir "padre_de"?
```

Creces todo lo que necesites y nunca acabas con `padre_de`, `padre` y `progenitor_de`
conviviendo en el mismo grafo.

```yaml
# content/mitologia-griega/materia.yaml
relaciones:
  padre_de:
    inversa: hijo_de
    pregunta: "¿De quién es padre {origen}?"
    pregunta_inversa: "¿Quién es el padre de {destino}?"
  madre_de:
    inversa: hijo_de
  hermano_de:
    simetrica: true
  consorte_de:
    simetrica: true
  mato_a:
    inversa: muerto_por
  transformo_en:
    inversa: transformado_por
  patron_de:
    inversa: bajo_patronazgo_de
  porta:
    inversa: portado_por
```

#### La relación comodín

Para la cola larga —esas cuarenta conexiones de Heracles que no merecen un tipo formal—
existe un desagüe:

```yaml
- tipo: relacionado_con
  destino: hidra-de-lerna
  nota: segundo trabajo
```

Se muestra en la ficha con su nota. **No genera tarjeta.** Es contenido navegable, no
material de examen.

#### Versiones y fuentes

La mitología se contradice a sí misma y el esquema tiene que asumirlo. Afrodita nace de la
espuma según Hesíodo y es hija de Zeus y Dione según Homero. Si el sistema no lo modela, la
tarjeta "¿quién es la madre de Afrodita?" tiene dos respuestas incompatibles y está rota.

Por eso **toda relación admite fuente**, y una se marca como principal:

```yaml
relaciones:
  - tipo: hija_de
    destino: urano
    fuente: hesiodo
    principal: true
  - tipo: hija_de
    destino: zeus
    fuente: homero
```

Regla: **las tarjetas se generan solo a partir de las relaciones `principal`.** Las
variantes se muestran en la ficha agrupadas por fuente ("según Homero…") y son material de
lectura. Si una relación no lleva `fuente`, se considera principal por defecto.

Las fuentes se declaran en `materia.yaml` con nombre completo, para poder citarlas bien:

```yaml
fuentes:
  hesiodo:  { nombre: "Hesíodo, Teogonía", siglo: -8 }
  homero:   { nombre: "Homero, Ilíada", siglo: -8 }
  ovidio:   { nombre: "Ovidio, Metamorfosis", siglo: 1 }
```

### 3.3 Relato

`content/mitologia-griega/relatos/rapto-de-europa.mdx`

```mdx
---
id: rapto-de-europa
tipo: mito
nombre: El rapto de Europa
resumen: Zeus, transformado en toro blanco, secuestra a Europa y la lleva a Creta.
participantes: [zeus, europa, cadmo]
lugar: tiro
orden: 47
fuente_principal: ovidio
etiquetas: [metamorfosis, zeus-amores]
---

Europa, hija del rey Agenor de <E id="tiro" />, jugaba en la playa cuando
apareció entre el rebaño un toro de una blancura imposible…

<TablaComparativa entidades={["zeus", "poseidon"]} atributos={["dominio"]} />

La versión de <Fuente id="ovidio" /> añade que…
```

El frontmatter es un nodo del grafo. El cuerpo es la narración. Un relato puede declarar
`relaciones` igual que una entidad si conviene (`precede_a: fundacion-de-tebas`).

### 3.4 Página editorial

Dos sabores, ambos en `content/mitologia-griega/paginas/`.

**Consulta guardada más prosa** — escribes la introducción y el listado sale del grafo:

```mdx
---
slug: los-doce-olimpicos
titulo: Los doce olímpicos
---

Tras la Titanomaquia, doce divinidades fijaron su morada en el Olimpo…

<Coleccion filtro={{ etiquetas: ["olimpico"] }} orden="generacion" />
```

Añades a Hestia con la etiqueta correcta y la página crece sola.

**Ensayo puro** — no forma parte del grafo, pero enlaza hacia dentro:

```mdx
---
slug: etimologia-de-zeus
titulo: La etimología de Zeus
menciona: [zeus, jupiter]
---

La raíz protoindoeuropea *dyeu- ("cielo luminoso") da nombre tanto a Zeus…
```

`menciona` hace que la página aparezca en la ficha de Zeus como lectura relacionada. Los
ensayos apuntan al grafo sin pertenecer a él.

### 3.5 Evento y el timeline dual

La mitología no tiene fechas y la historia sí. Un timeline de los olímpicos es *orden
relativo*; uno de la Reconquista es *fechas absolutas*. **El bloque soporta los dos modos
desde el día uno** o hay que reescribirlo entero cuando entre historia.

```yaml
# Modo relativo (mitología): sin fechas, solo orden dentro de eras
orden: 3
era: edad-de-los-titanes

# Modo absoluto (historia): fechas reales
fecha:
  inicio: 1212-07-16
  fin: 1212-07-16
  precision: exacta      # exacta | aprox | siglo | legendaria
```

La materia declara cuál usa en `materia.yaml` (`timeline: relativo | absoluto`).

---

## 4. Árbol de ficheros

```
proyecto/
├── src/
│   ├── components/
│   │   ├── FichaEntidad.astro
│   │   ├── ProsaEnlazada.astro
│   │   ├── E.astro                    # enlace a entidad con mini-ficha al pasar
│   │   ├── Fuente.astro
│   │   ├── Coleccion.astro            # consulta guardada sobre el grafo
│   │   ├── TablaComparativa.astro     # isla: ordenar + filtrar
│   │   ├── Timeline.astro             # isla: modos relativo y absoluto
│   │   ├── Flashcards.astro           # isla: SRS
│   │   └── ui/                        # primitivas: Card, Pill, Boton
│   ├── layouts/
│   │   ├── LayoutMateria.astro
│   │   ├── LayoutFicha.astro
│   │   └── LayoutLectura.astro
│   ├── lib/
│   │   ├── grafo.ts                   # carga, indexa, resuelve inversas
│   │   ├── validar.ts                 # falla el build ante contenido inconsistente
│   │   ├── tarjetas.ts                # deriva flashcards del grafo
│   │   ├── srs.ts                     # SM-2 simplificado
│   │   └── progreso.ts                # wrapper de localStorage
│   └── pages/
│       ├── index.astro
│       └── [materia]/
│           ├── index.astro
│           ├── e/[id].astro           # ficha de entidad
│           ├── m/[id].astro           # relato
│           ├── p/[slug].astro         # página editorial
│           └── practicar.astro
├── content/
│   └── mitologia-griega/
│       ├── materia.yaml               # tipos, atributos, relaciones, fuentes, timeline
│       ├── entidades/
│       │   ├── dios/
│       │   │   ├── zeus.yaml          # un fichero por entidad, en subcarpeta por `tipo`
│       │   │   └── hera.yaml
│       │   └── titan/
│       │       └── crono.yaml
│       ├── relatos/
│       │   └── edad-de-los-titanes/   # subcarpeta por `era`
│       │       ├── titanomaquia.mdx
│       │       └── rapto-de-europa.mdx
│       └── paginas/
│           ├── los-doce-olimpicos.mdx
│           └── etimologia-de-zeus.mdx
└── public/img/gr/
```

Un fichero por entidad: Astro los lee con un glob, así que cien ficheros cuestan lo mismo
que uno con cien entidades. A cambio, el diff de git dice "has tocado a Zeus" en vez de
"has tocado la línea 447". La subcarpeta (`tipo` en entidades, `era` en relatos) es solo
para navegar el repo — el id sigue saliendo del YAML/frontmatter, nunca de la ruta, así que
moverse de subcarpeta no rompe ninguna relación.

Añadir mitología nórdica = crear `content/mitologia-nordica/` con su `materia.yaml`.
Cero cambios en `src/`.

---

## 5. Rutas

| URL | Qué es |
|---|---|
| `/` | Portada, lista de materias |
| `/gr/` | Índice de la materia: rutas de lectura + buscador |
| `/gr/e/zeus` | Ficha de entidad |
| `/gr/m/rapto-de-europa` | Relato |
| `/gr/p/los-doce-olimpicos` | Página editorial |
| `/gr/practicar` | Modo práctica: tarjetas pendientes |

---

## 6. Generación automática de tarjetas

No existe ningún fichero de preguntas. Las plantillas se escriben **una vez por tipo de
relación o atributo** en `materia.yaml`, y se aplican a todo el contenido.

```yaml
atributos:
  simbolo:
    pregunta: "¿Cuál es el símbolo de {nombre}?"
  dominio:
    pregunta: "¿Sobre qué domina {nombre}?"
```

De la ficha de Zeus, sin escribir una sola pregunta:

| Pregunta | Respuesta | Origen |
|---|---|---|
| ¿Quién es el padre de Zeus? | Crono | `hijo_de: crono` |
| ¿De quién es padre Zeus? | Atenea, Apolo, Ares… | `padre_de: atenea`, `padre_de: apolo`, `padre_de: ares`… |
| ¿Quién es hijo de Crono? | Zeus | la inversa, gratis |
| ¿Cuál es el símbolo de Zeus? | Rayo, águila, roble | `atributos.simbolo` |
| ¿Nombre romano de Zeus? | Júpiter | `alias` |
| ¿Qué dios es "el Tonante"? | Zeus | `epitetos` |

Zeus tiene un solo padre (relación **de respuesta única**: una tarjeta por arista) pero muchos
hijos (relación **de respuesta en conjunto**: todas las aristas `padre_de` de Zeus se agrupan en
una sola tarjeta, con todos los hijos como respuesta). Cada dirección de relación declara en
`materia.yaml` cuál de las dos es. Generar una tarjeta por arista también en las relaciones
uno-a-muchos sería el error de fondo: "¿De quién es padre Zeus?" repetida una vez por hijo, cada
copia con una sola respuesta parcial en vez de la lista completa.

Los distractores de opción múltiple salen de entidades del mismo `tipo` que **no** tengan
esa relación.

**Qué queda excluido de la generación:** las relaciones `relacionado_con`, y las relaciones
con `fuente` que no estén marcadas como `principal`.

### La puerta de escape

Para lo que ninguna plantilla capta —matices, causas, ideas— la entidad o el relato admiten
tarjetas manuales:

```yaml
tarjetas:
  - p: ¿Por qué Atenea nace de la cabeza de Zeus?
    r: Zeus devoró a Metis embarazada al saber que su hijo lo destronaría.
```

Son la excepción, no el motor.

---

## 7. Validación en el build

El validador falla ruidosamente ante:

- Relación o atributo no declarado en `materia.yaml` (con sugerencia por parecido)
- `destino`, `participantes` o `menciona` que apuntan a un id inexistente
- Dos entidades con el mismo `id`
- Fuente citada que no está en el registro de fuentes
- Más de una relación del mismo tipo marcada como `principal` hacia destinos distintos
- Falta un campo obligatorio (`id`, `tipo`, `nombre`, `resumen`)

Un fallo de build es barato. Un grafo silenciosamente roto con doscientas entidades no.

---

## 8. Catálogo de bloques

### v1 — los cinco que sostienen todo

| Bloque | Qué hace | Dificultad |
|---|---|---|
| Ficha de entidad | Alias, atributos, relaciones navegables, variantes por fuente | Baja |
| Prosa enlazada | MDX donde `<E id="…" />` abre mini-ficha al pasar el ratón | Media |
| Colección | Consulta guardada sobre el grafo, embebible en páginas | Baja |
| Tabla comparativa | Entidades en filas, atributos en columnas, ordenable | Media |
| Flashcards SRS | Repetición espaciada, derivadas del grafo, progreso local | Media |

### v2 — cuando v1 funcione

- Timeline dual (relativo y absoluto)
- Árbol/grafo de relaciones — *el que más riesgo de agujero negro tiene*
- Quiz derivado con distractores automáticos
- Mapa geográfico
- Panel de progreso y ruta de aprendizaje

---

## 9. Fuera de alcance en v1

Escrito aquí para no volver a discutirlo:

- Cuentas de usuario, login, sincronización entre dispositivos
- Editor de contenido en el navegador (se edita YAML y MDX en el repo)
- Búsqueda full-text (basta con filtrar por nombre y alias)
- Materias no narrativas: chino, matemáticas
- Generación de contenido con IA en tiempo de ejecución
- App móvil (el sitio es responsive y punto)

---

## 10. Orden de construcción

1. `lib/grafo.ts` y `lib/validar.ts`, con diez entidades de prueba
2. Ficha de entidad y sus rutas — con esto ya se navega
3. `<E />` y prosa enlazada, más un relato real escrito entero
4. `<Coleccion />` y una página editorial
5. Tabla comparativa
6. Tarjetas y SRS
7. Contenido: los doce olímpicos y sus mitos principales

Si en el paso 3 el esquema duele, se cambia el esquema. Es más barato ahora que con
doscientas entidades escritas.
