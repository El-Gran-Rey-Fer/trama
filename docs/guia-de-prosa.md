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

## 2. Los tres tipos de prosa

| | **Relato** | **Página editorial** | **Prosa de entidad** |
|---|---|---|---|
| Qué es | Un mito narrado: la Titanomaquia, el rapto de Europa | Un artículo transversal: los doce olímpicos, la etimología de Zeus | El cuerpo de una ficha: quién es Zeus, qué es el rayo |
| Vive en | `content/<materia>/relatos/<id>.mdx` | `content/<materia>/paginas/<slug>.mdx` | `content/<materia>/entidades/<id>.mdx` |
| Frontmatter | Sí, es un nodo del grafo | Sí, `slug` y `titulo` | **No.** Los campos están en el `.yaml` hermano |
| ¿Es parte del grafo? | **Sí.** Es una entidad de pleno derecho, con id, participantes y lugar | Solo apunta hacia dentro; no pertenece al grafo | Es el cuerpo de un nodo que ya existe |
| Genera tarjetas | Sí, automáticas | No, solo manuales | No. Es material de lectura |
| Voz | Narrativa, pasado | Expositiva, presente | Expositiva, presente |
| Extensión | 600-1.200 palabras | Libre | 150-350 palabras |

Si dudas de cuál estás escribiendo, la pregunta es: **¿esto pasó, esto explica, o esto
describe?** Lo que pasó es un relato. Lo que explica, ordena o compara es una página
editorial. Lo que describe a una entidad concreta es su prosa.

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
era: edad-de-los-olimpicos
orden: 500
fuente_principal: metamorfosis
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
al Olimpo en participante). Los ids tienen que existir: ver §9.

**`lugar`** — opcional. Un solo id, el escenario principal. Si el mito recorre medio
Mediterráneo, elige dónde ocurre lo esencial o déjalo fuera.

**`era`** — obligatorio. En qué era de la materia cae el relato. Los ids están declarados en
`materia.yaml`, en orden cronológico:

| id | Qué abarca |
|---|---|
| `cosmogonia` | Del origen al final del reinado de Urano |
| `edad-de-los-titanes` | El reinado de Crono, hasta la Titanomaquia inclusive |
| `edad-de-los-olimpicos` | Zeus en el trono; los mitos divinos |
| `edad-de-los-heroes` | Heracles, Teseo, Perseo, las sagas locales |
| `guerra-de-troya` | La guerra y los regresos |

El criterio de corte es el reinado, no el tema: la castración de Urano cierra la cosmogonía y
la Titanomaquia cierra la edad de los Titanes. Si un mito cabe en dos —los hay— elige la era
en la que ocurre y anótalo en la entrega. Si de verdad no cabe en ninguna, no inventes un id:
proponlo en las notas.

**`orden`** — obligatorio. Posición del relato **dentro de su era**, no en la cronología
global. **Múltiplos de 100**, y empieza alrededor de 500 en vez de 100: los mitos más
tempranos de una era son casi siempre los que todavía no están escritos, y quieres dejarles
sitio delante.

Que sea local a la era es lo que hace que el campo se pueda rellenar. Nadie puede situar un
mito en una escala global que no ve —el resultado son números inventados que no significan
nada— pero dentro de una era, con cinco o diez mitos, la pregunta "¿esto va antes o después de
aquello?" sí tiene respuesta. Si no sabes qué hay ya en esa era, pon un múltiplo de 100
razonable y dilo en la entrega.

**`fuente_principal`** — opcional. Id de la obra antigua que estás siguiendo. **El id es la
obra, no el autor**: `teogonia`, `iliada`, `metamorfosis`, `biblioteca`,
`himno-homerico-demeter`. Importa porque la mitología se contradice y conviene dejar claro qué
versión cuentas. El registro de fuentes puede no tener todavía la obra que usas; si es así,
inclúyela igualmente y anótalo en la entrega, con autor y obra completos.

**`etiquetas`** — opcional. En minúsculas y con guiones, como los ids. Son transversales:
`metamorfosis`, `zeus-amores`, `castigo-divino`. Sirven para que una página editorial pueda
recogerlas después con una consulta. Están declaradas en `materia.yaml`: usa las que existan y
propón las nuevas en la entrega. No inventes etiquetas de un solo uso; una etiqueta que solo
tiene un miembro no es una etiqueta.

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
son textos expositivos. En un relato, no: ver §8.

---

## 5. Prosa de entidad — formato exacto

Una entidad puede llevar, opcionalmente, un cuerpo de prosa: un fichero hermano del YAML,
con el mismo nombre y extensión `.mdx`.

```
content/mitologia-griega/entidades/zeus.yaml    ← los datos
content/mitologia-griega/entidades/zeus.mdx     ← la prosa, opcional
```

**El `.mdx` no lleva frontmatter.** Todos los campos viven en el YAML; el id sale del nombre
del fichero. Si escribes frontmatter aquí, se ignora o rompe el build.

Es el único de los tres tipos de prosa que es opcional. Una entidad sin `.mdx` es una entidad
perfectamente válida.

### Qué va aquí y qué no

Esta es la sección entera en una regla:

> **Si una frase podría ser un campo, es un campo. Si podría ser un relato, es un relato.
> La prosa de entidad es lo que queda.**

Los campos ya dicen que Zeus es rey de los dioses, que su símbolo es el rayo y que es hijo de
Crono. Escribir eso otra vez en prosa no añade nada y además crea el riesgo de que un día el
YAML cambie y el texto se quede mintiendo. Lo que los campos no pueden decir es cómo funciona
esa figura: de dónde le viene la autoridad, qué papel juega cuando aparece, qué representa,
en qué se contradice consigo misma.

**No narres mitos aquí.** Es la trampa principal. La prosa de Zeus no cuenta la Titanomaquia:
la Titanomaquia es un relato y ya aparece sola en su ficha porque lo declara en
`participantes`. Puedes aludir a un mito de pasada para explicar algo, nunca contarlo.

Si al escribir se te va a cinco párrafos y te ves narrando, lo que tienes no es prosa de
entidad: es un relato o un ensayo. Sácalo a `relatos/` o a `paginas/` y deja aquí lo que
describe a la entidad.

### Extensión y voz

**Dos a cuatro párrafos. Entre 150 y 350 palabras.** Menos para objetos y lugares: uno o dos
párrafos bastan casi siempre. Es una ficha, no un artículo, y compite por atención con las
relaciones y los relatos que hay debajo.

**Presente y expositivo**, como las páginas editoriales, no como los relatos. Describes lo que
la entidad es, no lo que pasó. El pasado solo aparece para hechos concretos que se mencionan
al paso.

**Sin encabezados y sin viñetas**, igual que en los relatos. En trescientas palabras un `##`
es ruido.

Todo lo de §8 (voz y estilo) sigue vigente sin excepción: sin voz de wiki, sin dirigirte al
lector, sin juzgar, sin inventar, y las versiones contradictorias marcadas con `<Fuente />`
en vez de mezcladas.

### Componentes y enlaces

Aquí solo caben dos de los cuatro componentes: `<E />` y `<Fuente />`. Una `<Coleccion />` o
una `<TablaComparativa />` dentro de una ficha compiten con lo que la ficha ya muestra por su
cuenta; si echas en falta una, es señal de que lo que estás escribiendo es una página
editorial.

Valen las reglas de §7, con dos aprietes:

- **Dos o tres `<E />` en el texto entero**, no por párrafo. El texto es corto y la ficha ya
  está rodeada de enlaces por todos lados.
- **Nunca enlaces la entidad de la que trata la ficha.** En `zeus.mdx` no se enlaza a Zeus,
  ni siquiera con texto interno.

Si necesitas referirte a un relato desde la prosa, comprueba antes si `<E />` resuelve ids de
relato. Si no lo hace todavía, nómbralo sin enlazar y anótalo en la entrega.

### Entidades que no son personajes

Aquí es donde esta prosa vale más, porque es donde el grafo dice menos. De un dios el grafo
cuenta bastante; del rayo o del Tártaro cuenta casi nada y la ficha se queda desnuda.

Lo que hay que contestar es: qué es, de dónde sale, qué hace y qué significa. Uno o dos
párrafos.

### Cuándo no escribir nada

La prosa es opcional y la ficha se comporta bien sin ella. Una entidad que existe sobre todo
para ser destino de un enlace —un lugar que solo se menciona, un personaje de una sola
aparición— no necesita cuerpo. **Un párrafo de relleno es peor que ningún párrafo:** ocupa el
sitio bueno de la ficha para no decir nada.

### Ejemplo — personaje

Ruta: `content/mitologia-griega/entidades/zeus.mdx`

```mdx
Zeus gobierna, y gobernar en la mitología griega no significa ser el más sabio ni el más
justo, sino haber ganado. Su autoridad nace de una victoria militar sobre <E id="crono">su
padre</E> y se sostiene sobre el reparto que hizo después con sus hermanos: el cielo para
él, el mar y el mundo subterráneo para los otros dos. Cuando los mitos lo muestran cediendo
ante el destino o negociando con otro dios, están recordando que su poder tiene límites y
que él los conoce.

La otra mitad de su figura son los amores. Se une a diosas, a ninfas y a mujeres mortales, a
menudo bajo una forma prestada, y de esas uniones sale buena parte del mapa heroico griego:
Heracles, Perseo, Helena, los reyes de Creta. Para un griego antiguo eso no era escándalo
sino genealogía; media Grecia descendía de él y las ciudades lo sabían.

De ahí viene su tercer papel, el de garante. Zeus protege al suplicante, al huésped y al
juramento —competencias que sus epítetos recogen una por una— y castiga a quien los viola.
```

Fíjate en lo que **no** hace: no dice que sea el rey de los dioses ni que su símbolo sea el
rayo, porque eso son campos. No cuenta la Titanomaquia, solo se apoya en ella. No enumera los
epítetos: explica para qué sirven.

### Ejemplo — objeto

Ruta: `content/mitologia-griega/entidades/rayo.mdx`

```mdx
El rayo es el arma con la que se gana la guerra por el cosmos, y su origen importa tanto
como su efecto: no es una capacidad natural de <E id="zeus" />, sino un regalo. Se lo
fabrican los Cíclopes al quedar libres, y esa deuda es la que inclina la balanza de la
guerra contra los Titanes.

Como objeto funciona menos como arma que como signo. Un lugar donde ha caído un rayo queda
consagrado por ese solo hecho. Y en la iconografía es lo que identifica a Zeus sin necesidad
de inscripción, igual que el tridente identifica a Poseidón.
```

### Entrega

Igual que en §10: ruta completa, el MDX entero en un bloque de código, los ids nuevos que
hagan falta y las notas. Si escribes prosa para varias entidades de una vez, una ruta y un
bloque por entidad.

---

## 6. Lo que puedes poner en el cuerpo

La lista es cerrada. Estos cuatro componentes y nada más:

| Componente | Para qué |
|---|---|
| `<E id="crono" />` | Enlaza a una entidad. Autocerrado, muestra su nombre; con texto interno (`<E id="crono">su padre</E>`), muestra ese texto. Ambas formas llevan a su ficha |
| `<Fuente id="teogonia" />` | Cita solo el autor de una fuente antigua (la obra queda en un `title`, visible al pasar el ratón). `<Fuente id="teogonia" obra />` cita autor y obra completos. En obras anónimas se muestra la obra |
| `<Coleccion filtro={{ … }} orden="…" />` | Listado generado desde el grafo |
| `<TablaComparativa entidades={[…]} atributos={[…]} />` | Comparativa de entidades |

**Prohibido todo lo demás.** Nada de imports, nada de expresiones de JavaScript, nada de
componentes inventados, nada de HTML suelto. El contenido no contiene lógica; en el momento en
que la contiene, la arquitectura del proyecto se rompe por la puerta de atrás.

En la prosa de entidad la lista es más corta todavía: solo `<E />` y `<Fuente />`. Ver §5.

Si al escribir echas de menos un componente que no está en esa tabla, **para y anótalo en la
entrega**. Crear componentes es trabajo de la interfaz, no del texto.

---

## 7. Cómo se enlaza con `<E />`

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
6. **El nombre de una entidad nunca lleva artículo integrado** (`nombre: Rayo`, no
   `nombre: El rayo`). Es lo que permite escribir "el `<E id="rayo" />`" en la prosa y que
   salga "el Rayo" en vez de "el El rayo". Si al leerlo en voz alta el artículo se duplica o
   falta, el problema está en el `nombre` de la entidad, no en cómo la enlazaste: anótalo en
   la entrega en vez de retorcer la frase para esquivarlo.
7. `<E />` tiene dos formas y las dos enlazan igual. Autocerrada (`<E id="crono" />`) renderiza
   el nombre de la entidad. Con texto interno (`<E id="crono">su padre</E>`) renderiza ese
   texto en su lugar. Usa la segunda forma para posesivos, epítetos o variantes ("su padre",
   "el Cronida") que no calzan con el nombre canónico — no como excusa para enlazar frases
   enteras o conceptos difusos (sigue valiendo la regla 5).

Regla de oro: **el texto tiene que leerse bien en voz alta ignorando los enlaces.** Si al
quitarlos mentalmente la prosa se vuelve rara o repetitiva, hay demasiados.

---

## 8. Voz y estilo

**El lector está aprendiendo.** Escribe en español claro y concreto. Frases de longitud
normal, vocabulario preciso pero no rebuscado. Cuando una palabra técnica merece aprenderse
—teogonía, libación, oráculo— úsala y explícala de pasada en la misma frase, sin nota al pie y
sin paréntesis pedante.

**Relatos: pasado, tercera persona, narración.** Cuentas algo que pasó. Sin encabezados, sin
viñetas, sin apartados: un texto seguido, en párrafos. Entre 600 y 1.200 palabras para un mito
central; menos si el mito es breve, y no lo infles para llegar.

**Páginas editoriales: presente, expositivo.** Aquí sí caben encabezados y listas.

**Prosa de entidad: presente, expositivo, y corta.** Sin encabezados. Ver §5.

**Sin voz de wiki.** Nada de "en este artículo veremos", "cabe destacar", "como es sabido",
"nos encontramos ante". Empieza por el hecho.

**Sin dirigirte al lector.** Ni "imagina que", ni "verás que", ni preguntas retóricas.

**Sin juzgar.** Los mitos están llenos de raptos, venganzas y castigos desmedidos. Se cuentan
como lo que son, sin moralina moderna y sin celebrarlos. El tono es el de quien narra, no el de
quien opina.

**Las contradicciones se cuentan, no se ocultan.** La mitología se contradice a sí misma. En el
cuerpo cuentas la versión principal —la de `fuente_principal`— con naturalidad. Cuando otra
versión importa, la señalas explícitamente: "La versión de `<Fuente id="iliada" />` añade
que…". Nunca mezcles dos versiones en una sola frase como si fueran una.

**No inventes.** Ni genealogías, ni epítetos, ni detalles "que suenan bien". Si un dato es
inseguro, escríbelo como inseguro o déjalo fuera. Este contenido es material de estudio: un
dato inventado se convierte en una tarjeta que enseña algo falso.

---

## 9. Los ids tienen que existir

Esto rompe el build, así que es la parte menos negociable del documento.

Todo id que aparezca en `participantes`, en `lugar`, en `menciona` o dentro de un `<E />` tiene
que corresponder a una entidad que exista en `content/<materia>/entidades/`. Si apuntas a algo
que no está, el sitio no compila.

Como quien escribe prosa no siempre sabe qué existe ya, la norma es esta: **escribe el texto
con los ids que la narración necesite, y entrega junto a él la lista de los que hacen falta
crear.** No recortes el texto para evitar entidades nuevas — es al revés: la prosa descubre qué
entidades merecen existir.

Al revés también vale: **no propongas entidades que el texto no referencie.** Un id que no es
destino de ningún `<E />` ni de ningún campo no debe crearse; nace huérfano y se queda así.

Convención de ids de entidad, para que las propuestas sean consistentes: minúsculas, sin
tildes, con guiones, en singular y en español. `hidra-de-lerna`, `monte-olimpo`, `egida`.

---

## 10. Qué se entrega

Siempre estas cuatro cosas, en este orden:

1. **La ruta completa del fichero**, p. ej. `content/mitologia-griega/relatos/titanomaquia.mdx`
2. **El MDX entero en un bloque de código**, frontmatter incluido, listo para pegar sin editar
3. **Los ids nuevos que hacen falta**, en una tabla con id, nombre y tipo sugerido — para poder
   crear las entidades antes de compilar
4. **Notas**, si las hay: etiquetas nuevas, obras no registradas en `fuentes`, era ambigua o
   sin id, componentes que se echaron de menos, o cualquier sitio donde el esquema haya
   resultado incómodo

El punto 4 no es relleno. Mientras el proyecto sea joven, **el esquema se cambia cuando duele**,
y quien escribe prosa es el primero que nota dónde duele.

---

## 11. Checklist antes de entregar

- [ ] El id del campo coincide con el nombre del fichero
- [ ] Están los cuatro campos obligatorios: `id`, `tipo`, `nombre`, `resumen`
- [ ] El `resumen` es una frase, en presente, comprensible sin contexto
- [ ] `participantes` incluye a quien actúa, y a nadie que solo se mencione de pasada
- [ ] Lleva `era`, y es uno de los ids declarados
- [ ] `orden` es múltiplo de 100 y está pensado dentro de esa era, no global
- [ ] `fuente_principal` es un id de obra, no de autor
- [ ] Ningún `<E />` en el frontmatter
- [ ] Ninguna entidad enlazada más de una vez
- [ ] Ningún párrafo con más de tres enlaces
- [ ] Solo aparecen los cuatro componentes permitidos
- [ ] Sin encabezados ni viñetas, si es un relato
- [ ] Sin referencias al aspecto visual del sitio
- [ ] Ningún dato inventado; las versiones alternativas van marcadas con `<Fuente />`
- [ ] Está la lista de ids nuevos que hay que crear, y ninguno sobra

Si es prosa de entidad, además:

- [ ] No lleva frontmatter, y el nombre del fichero es el id
- [ ] No repite nada que ya esté en un campo del YAML
- [ ] No narra un mito que sea, o deba ser, un relato aparte
- [ ] Como mucho tres `<E />` en todo el texto, y ninguno a sí misma
- [ ] Solo `<E />` y `<Fuente />`, sin encabezados, entre 150 y 350 palabras

---

## Apéndice — plantilla de encargo

Para pegar en una conversación nueva, adjuntando este documento:

> Adjunto la guía de prosa de Trama. Escribe **[qué]** siguiendo esa guía.
>
> Entidades que ya existen en el proyecto: **[lista de ids, o "no lo sé, propón lo que haga
> falta"]**.
>
> Era y relatos que ya hay en ella: **[era + los `orden` ya usados, o "no lo sé, pon un
> múltiplo de 100 razonable"]**.
>
> Notas: **[obra que quiero seguir, extensión aproximada, algo que deba entrar o quedar
> fuera]**.
>
> Entrega según la sección 10: ruta, MDX completo, ids nuevos necesarios y notas.
