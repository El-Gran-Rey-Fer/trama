# Guía de prosa para Trama

Documento autocontenido. Quien lo lea puede escribir cualquier texto para el proyecto sin
haber visto el resto de la documentación.

**Cómo se usa:** se adjunta a una conversación nueva junto con la petición concreta
("escribe la Titanomaquia"). Al final hay una plantilla de encargo lista para pegar.

---

## 1. Contexto mínimo

**Trama** es una plataforma de aprendizaje para dominios narrativos. La primera materia es
mitología griega; vendrán otras mitologías e historia. Es un sitio estático: no hay servidor,
no hay cuentas de usuario.

Lo que hay que entender para escribir en él son dos ideas.

**Primera: el contenido son datos, no páginas.** Cada personaje, objeto y lugar es un fichero
YAML con campos y relaciones. Cada relación se escribe **una sola vez** y el sistema deriva la
inversa: si `crono.yaml` declara `padre_de: zeus`, la ficha de Zeus muestra "hijo de: Crono"
sin que nadie lo escriba. De ahí sale también, más adelante, el material de estudio: las
tarjetas se generan solas a partir del grafo, sin que exista ningún fichero de preguntas.

La consecuencia para quien escribe prosa: **no mantienes listas a mano**. No enumeras los
mitos de Heracles en su ficha. Escribes el mito y declaras `participantes: [heracles]`, y su
ficha se actualiza sola. Si te sorprendes escribiendo un inventario, algo va mal.

**Segunda: la interfaz es desechable, el contenido no.** Toda la interfaz puede tirarse y
rehacerse sin tocar una línea de `content/`. Por eso la prosa nunca puede depender del aspecto
que tiene ahora: nada de "como se ve en la tabla de la derecha", nada de "más abajo",
nada de referencias a colores, botones o disposición.

**La regla que lo protege todo:** `src/` (la interfaz) nunca menciona una entidad concreta, y
`content/` (lo que escribes) nunca contiene lógica. Escribes datos y texto. Nada más.

---

## 2. Los dos tipos de prosa

| | **Relato** | **Página editorial** |
|---|---|---|
| Qué es | Un mito narrado: la Titanomaquia, el rapto de Europa | Un artículo transversal: los doce olímpicos, la etimología de Zeus |
| Vive en | `content/<materia>/relatos/<id>.mdx` | `content/<materia>/paginas/<slug>.mdx` |
| ¿Es parte del grafo? | **Sí.** Es una entidad de pleno derecho, con id, participantes y lugar | Solo apunta hacia dentro; no pertenece al grafo |
| Genera tarjetas | Sí, automáticas | No, solo manuales |
| Voz | Narrativa | Expositiva |

Si dudas de cuál estás escribiendo, la pregunta es: **¿esto pasó, o esto explica?** Lo que pasó
es un relato. Lo que explica, ordena o compara es una página editorial.

---

## 3. Relato — formato exacto

Ruta: `content/mitologia-griega/relatos/<id>.mdx`, donde `<id>` es el mismo valor del campo
`id`. El nombre del fichero y el id nunca se separan.

```mdx
---
id: rapto-de-europa
tipo: mito
nombre: El rapto de Europa
resumen: Zeus, transformado en toro blanco, secuestra a Europa y la lleva a Creta.
participantes: [zeus, europa, cadmo]
lugar: tiro
orden: 4700
fuente_principal: ovidio
etiquetas: [metamorfosis, zeus-amores]
---

Europa, hija del rey Agenor de <E id="tiro" />, jugaba en la playa cuando apareció entre
el rebaño un toro de una blancura imposible…
```

### Los campos, uno a uno

**`id`** — obligatorio. En minúsculas, sin tildes ni eñes, palabras separadas por guiones:
`titanomaquia`, `rapto-de-europa`, `nacimiento-de-atenea`. Único en toda la materia. No lo
cambies nunca una vez publicado: es la URL y es lo que apuntan las tarjetas.

**`tipo`** — obligatorio. Para relatos, normalmente `mito`. Los tipos se declaran en
`materia.yaml`; si necesitas uno nuevo (`leyenda`, `batalla`), no lo inventes en silencio:
anótalo en la entrega.

**`nombre`** — obligatorio. Como aparece en títulos y enlaces. Con artículo si suena natural
("El rapto de Europa"), sin él si no.

**`resumen`** — obligatorio, y es el campo que más se subestima. Aparece en listados, en los
índices y en la mini-ficha que sale al pasar el ratón. **Una sola frase, 15-30 palabras, que
se entienda sola**, sin haber leído el relato ni saber quién es nadie. Escríbelo en presente.
No es un gancho ni un titular: es información.

**`participantes`** — lista de ids de entidades que intervienen. Es lo que hace que el relato
aparezca en la ficha de cada uno de ellos. Incluye a quien actúa o le pasa algo; **no**
incluyas a quien solo se menciona de pasada ("más blanco que la nieve del Olimpo" no convierte
al Olimpo en participante). Los ids tienen que existir: ver §8.

**`lugar`** — opcional. Un solo id, el escenario principal. Si el mito recorre medio
Mediterráneo, elige dónde ocurre lo esencial o déjalo fuera.

**`orden`** — opcional pero recomendable. Posición del relato en la cronología mítica. **Usa
múltiplos de 100** (100, 200, 300…). El motivo es práctico: cuando dentro de seis meses tengas
que meter un mito entre dos, quieres poder escribir `250` en lugar de renumerar cuarenta
ficheros.

**`fuente_principal`** — opcional. Id de la fuente antigua que estás siguiendo: `hesiodo`,
`homero`, `ovidio`. Importa porque la mitología se contradice y conviene dejar claro qué
versión cuentas. El registro de fuentes puede no existir todavía en `materia.yaml`; si es así,
inclúyelo igualmente y anótalo en la entrega.

**`etiquetas`** — opcional. En minúsculas y con guiones, como los ids. Son transversales:
`metamorfosis`, `zeus-amores`, `castigo-divino`. Sirven para que una página editorial pueda
recogerlas después con una consulta. No inventes etiquetas de un solo uso; una etiqueta que
solo tiene un miembro no es una etiqueta.

**`relaciones`** — opcional. Un relato puede declarar relaciones como cualquier entidad, p. ej.
`precede_a: fundacion-de-tebas`. Úsalo con moderación y solo con tipos ya declarados.

---

## 4. Página editorial — dos formas

Ruta: `content/mitologia-griega/paginas/<slug>.mdx`.

**Forma A — introducción más consulta.** Escribes la prosa y el listado sale del grafo solo:

```mdx
---
slug: los-doce-olimpicos
titulo: Los doce olímpicos
---

Tras la Titanomaquia, doce divinidades fijaron su morada en el Olimpo…

<Coleccion filtro={{ etiquetas: ["olimpico"] }} orden="generacion" />
```

La gracia es que añades a Hestia con la etiqueta correcta y la página crece sola. **Nunca
escribas a mano una lista que el grafo pueda generar.**

**Forma B — ensayo.** No forma parte del grafo, pero enlaza hacia dentro:

```mdx
---
slug: etimologia-de-zeus
titulo: La etimología de Zeus
menciona: [zeus, jupiter]
---

La raíz protoindoeuropea *dyeu- ("cielo luminoso") da nombre tanto a Zeus…
```

`menciona` hace que el ensayo aparezca como lectura relacionada en la ficha de esas entidades.

En las páginas editoriales **sí** puedes usar encabezados de Markdown (`##`) y listas, porque
son textos expositivos. En un relato, no: ver §7.

---

## 5. Lo que puedes poner en el cuerpo

La lista es cerrada. Estos cuatro componentes y nada más:

| Componente | Para qué |
|---|---|
| `<E id="crono" />` | Enlaza a una entidad. Muestra su nombre y lleva a su ficha |
| `<Fuente id="ovidio" />` | Cita una fuente antigua con su nombre completo |
| `<Coleccion filtro={{ … }} orden="…" />` | Listado generado desde el grafo |
| `<TablaComparativa entidades={[…]} atributos={[…]} />` | Comparativa de entidades |

**Prohibido todo lo demás.** Nada de imports, nada de expresiones de JavaScript, nada de
componentes inventados, nada de HTML suelto. El contenido no contiene lógica; en el momento en
que la contiene, la arquitectura del proyecto se rompe por la puerta de atrás.

Si al escribir echas de menos un componente que no está en esa tabla, **para y anótalo en la
entrega**. Crear componentes es trabajo de la interfaz, no del texto.

---

## 6. Cómo se enlaza con `<E />`

Esto es lo que distingue un texto de Trama de un texto cualquiera, y es donde es más fácil
pasarse.

1. **Solo la primera mención relevante de cada entidad.** Si Crono sale nueve veces, se enlaza
   una. Un texto donde cada nombre propio es un enlace es un texto que nadie lee: lo escanea.
2. **Máximo tres por párrafo**, y menos si el párrafo es corto. Si te salen más, el párrafo
   está haciendo de índice en vez de narrar.
3. **Nunca en el `resumen` ni en ningún campo del frontmatter.** Solo en el cuerpo.
4. **No enlaces la entidad de la que trata la propia página.** En el relato de la Titanomaquia
   no se enlaza a la Titanomaquia.
5. **Enlaza el nombre, no el concepto difuso.** `<E id="olimpo" />` sobre la palabra "Olimpo",
   no sobre "la montaña donde vivían".
6. `<E />` se escribe **autocerrado**: `<E id="crono" />`, y renderiza el nombre de la entidad.
   Si necesitas enlazar con otras palabras ("su padre", "el Cronida"), **no lo hagas**: esa
   variante todavía no existe. Reescribe la frase para que el nombre aparezca, o anótalo.

Regla de oro: **el texto tiene que leerse bien en voz alta ignorando los enlaces.** Si al
quitarlos mentalmente la prosa se vuelve rara o repetitiva, hay demasiados.

---

## 7. Voz y estilo

**El lector está aprendiendo.** Escribe en español claro y concreto. Frases de longitud
normal, vocabulario preciso pero no rebuscado. Cuando una palabra técnica merece aprenderse
—teogonía, libación, oráculo— úsala y explícala de pasada en la misma frase, sin nota al pie y
sin paréntesis pedante.

**Relatos: pasado, tercera persona, narración.** Cuentas algo que pasó. Sin encabezados, sin
viñetas, sin apartados: un texto seguido, en párrafos. Entre 600 y 1.200 palabras para un mito
central; menos si el mito es breve, y no lo infles para llegar.

**Páginas editoriales: presente, expositivo.** Aquí sí caben encabezados y listas.

**Sin voz de wiki.** Nada de "en este artículo veremos", "cabe destacar", "como es sabido",
"nos encontramos ante". Empieza por el hecho.

**Sin dirigirte al lector.** Ni "imagina que", ni "verás que", ni preguntas retóricas.

**Sin juzgar.** Los mitos están llenos de raptos, venganzas y castigos desmedidos. Se cuentan
como lo que son, sin moralina moderna y sin celebrarlos. El tono es el de quien narra, no el de
quien opina.

**Las contradicciones se cuentan, no se ocultan.** La mitología se contradice a sí misma. En el
cuerpo cuentas la versión principal —la de `fuente_principal`— con naturalidad. Cuando otra
versión importa, la señalas explícitamente: "La versión de `<Fuente id="homero" />` añade
que…". Nunca mezcles dos versiones en una sola frase como si fueran una.

**No inventes.** Ni genealogías, ni epítetos, ni detalles "que suenan bien". Si un dato es
inseguro, escríbelo como inseguro o déjalo fuera. Este contenido es material de estudio: un
dato inventado se convierte en una tarjeta que enseña algo falso.

---

## 8. Los ids tienen que existir

Esto rompe el build, así que es la parte menos negociable del documento.

Todo id que aparezca en `participantes`, en `lugar`, en `menciona` o dentro de un `<E />` tiene
que corresponder a una entidad que exista en `content/<materia>/entidades/`. Si apuntas a algo
que no está, el sitio no compila.

Como quien escribe prosa no siempre sabe qué existe ya, la norma es esta: **escribe el texto
con los ids que la narración necesite, y entrega junto a él la lista de los que hacen falta
crear.** No recortes el texto para evitar entidades nuevas — es al revés: la prosa descubre qué
entidades merecen existir.

Convención de ids de entidad, para que las propuestas sean consistentes: minúsculas, sin
tildes, con guiones, en singular y en español. `hidra-de-lerna`, `monte-olimpo`, `egida`.

---

## 9. Qué se entrega

Siempre estas cuatro cosas, en este orden:

1. **La ruta completa del fichero**, p. ej. `content/mitologia-griega/relatos/titanomaquia.mdx`
2. **El MDX entero en un bloque de código**, frontmatter incluido, listo para pegar sin editar
3. **Los ids nuevos que hacen falta**, en una tabla con id, nombre y tipo sugerido — para poder
   crear las entidades antes de compilar
4. **Notas**, si las hay: etiquetas nuevas, fuentes no registradas, componentes que se echaron
   de menos, o cualquier sitio donde el esquema haya resultado incómodo

El punto 4 no es relleno. Mientras el proyecto sea joven, **el esquema se cambia cuando duele**,
y quien escribe prosa es el primero que nota dónde duele.

---

## 10. Checklist antes de entregar

- [ ] El id del campo coincide con el nombre del fichero
- [ ] Están los cuatro campos obligatorios: `id`, `tipo`, `nombre`, `resumen`
- [ ] El `resumen` es una frase, en presente, comprensible sin contexto
- [ ] `participantes` incluye a quien actúa, y a nadie que solo se mencione de pasada
- [ ] `orden` es múltiplo de 100
- [ ] Ningún `<E />` en el frontmatter
- [ ] Ninguna entidad enlazada más de una vez
- [ ] Ningún párrafo con más de tres enlaces
- [ ] Solo aparecen los cuatro componentes permitidos
- [ ] Sin encabezados ni viñetas, si es un relato
- [ ] Sin referencias al aspecto visual del sitio
- [ ] Ningún dato inventado; las versiones alternativas van marcadas con `<Fuente />`
- [ ] Está la lista de ids nuevos que hay que crear

---

## Apéndice — plantilla de encargo

Para pegar en una conversación nueva, adjuntando este documento:

> Adjunto la guía de prosa de Trama. Escribe **[qué]** siguiendo esa guía.
>
> Entidades que ya existen en el proyecto: **[lista de ids, o "no lo sé, propón lo que haga
> falta"]**.
>
> Notas: **[fuente que quiero seguir, extensión aproximada, algo que deba entrar o quedar
> fuera]**.
>
> Entrega según la sección 9: ruta, MDX completo, ids nuevos necesarios y notas.
