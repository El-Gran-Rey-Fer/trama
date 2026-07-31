# Capa de progresión

Addendum a `esqueleto-proyecto.md` y `calendario-construccion.md`. Los dos primeros documentos
describen un motor de conocimiento correcto que produce, sin querer, un diccionario. Este
describe la capa que lo convierte en algo que se recorre.

Al final está la lista de cambios que hay que hacer en los otros dos documentos y las fichas de
bloque listas para pegar en la Parte II y la Parte III del calendario.

---

## 1. El diagnóstico, en una frase

> La unidad del sitio es la ficha, y un sitio cuya unidad es la entrada es un diccionario por
> mucho grafo que tenga detrás.

Hay dos verbos —navegar y practicar— y están desconectados. El relato no lleva a ningún sitio y
la baraja no viene de ningún sitio. Lo que falta no son vistas nuevas (mapa, timeline): es que
exista **una sesión con principio y final**.

---

## 2. La decisión de granularidad: la era no basta

Las cinco eras ya declaradas en `materia.yaml` son la espina dorsal correcta —salen del dominio,
no de la app, y su orden no es arbitrario— pero cinco unidades no son una progresión. Son cinco
carpetas.

Se añade **un nivel intermedio, el capítulo**:

| Nivel | Cuántos | Qué es | Dónde vive |
|---|---|---|---|
| **Era** | 5, fijas | Acto. Se completa al cerrar todos sus capítulos | Ya existe: campo `era` |
| **Capítulo** | ~40-50 al final | Unidad de trabajo: una sentada | **Nuevo**, en `materia.yaml` |
| Relato / entidad | Cientos | El contenido | Ya existe |

**Un capítulo es 1-3 relatos y 15-25 tarjetas.** Ese es el tamaño diana: lo que se lee y se
practica de una vez sin que apetezca dejarlo a medias.

### Lo que hace que esto sea barato

El capítulo es **puramente editorial y vive entero en `materia.yaml`**. No se toca ni un
`.yaml` de entidad ni un frontmatter de relato. Reorganizar el temario entero es editar un
fichero; no es un script de migración.

Es la misma decisión que el calendario ya tomó en el bloque N y por la misma razón: el grafo
sabe que Crono es padre de Zeus, pero no sabe por dónde conviene empezar. **Eso es criterio
pedagógico, no topología.** El bloque N queda absorbido aquí (ver §8).

### Un capítulo no es un contenedor de contenido

Es una selección sobre contenido que existe por su cuenta. Un relato puede no estar en ningún
capítulo: entonces es lectura libre y sus tarjetas se desbloquean igual al leerlo. Los capítulos
son la vía principal, no la totalidad del mapa.

Esto importa porque impide que escribir contenido quede bloqueado por mantener el temario.

---

## 3. Esquema del capítulo

```yaml
# content/mitologia-griega/materia.yaml
capitulos:
  - id: el-primer-linaje
    nombre: El primer linaje
    era: cosmogonia
    orden: 100
    resumen: De dónde sale todo y por qué el primer rey del cosmos dura tan poco.
    relatos: [castracion-de-urano]        # en orden de lectura
    entidades_extra: [caos, tartaro]      # solo lo que no sea participante de un relato
    examen:
      aciertos: 8
      de: 10
    medalla: primeras-generaciones        # opcional
```

**El conjunto del capítulo** —de donde salen sus tarjetas y su examen— se calcula:

```
participantes de sus relatos  ∪  entidades_extra
```

No se lista a mano lo que el grafo puede derivar. `entidades_extra` existe solo para lo que
importa y no participa en ninguna narración (el Tártaro, el Caos, un objeto que solo se
menciona). Si esa lista crece por encima de tres o cuatro ids, casi siempre significa que falta
un relato.

`orden` en múltiplos de 100 dentro de la era, por lo mismo que en los relatos: vas a querer
insertar capítulos en medio.

### Medallas

Dos familias, y solo la segunda hay que escribirla:

**De recorrido** — automáticas, sin declarar nada: capítulo cerrado, era cerrada, primer examen
perfecto. Salen del estado.

**De cobertura** — declaradas a mano, y son las buenas porque hablan del dominio y no de la app:

```yaml
medallas:
  doce-olimpicos:
    nombre: El Olimpo al completo
    descripcion: Conoces a los doce dioses olímpicos.
    filtro: { etiquetas: [olimpico] }
    umbral: 1.0        # fracción del conjunto con la tarjeta en estado "sabida"
```

`filtro` es **el mismo objeto declarativo cerrado de `<Coleccion />`** (bloque E). No es una
función, no es una expresión: si permites lógica aquí, `content/` empieza a contener lógica y la
regla invariante se cuela por la puerta de atrás. Una medalla es una consulta guardada con
nombre bonito.

**Lo que no se hace: rachas.** Castigan la ausencia, se rompen en el primer viaje y convierten
un sitio para aprender a tu ritmo en una obligación diaria. El motor es el capítulo cerrado, no
el día no fallado.

---

## 4. Las tres reglas de la capa

### 4.1 El bloqueo es de la pista, nunca del contenido

> Toda URL es accesible siempre. Lo único que se desbloquea es la vía guiada.

`/gr/e/zeus` responde el primer día. La ficha de Zeus, sus relaciones, sus relatos: todo visible.
Lo que está cerrado es el capítulo 4 *como paso de la vía*, y las tarjetas de contenido no leído
*en el modo práctica*.

Tres razones, en orden de peso:

1. Esconder contenido en un sitio de aprendizaje es hostil. El que quiere saltar a Heracles el
   primer día tiene derecho.
2. Es un sitio estático público. El bloqueo sería decorativo: las URLs son adivinables y el
   contenido está en el HTML.
3. Un enlace compartido tiene que funcionar para quien lo recibe.

### 4.2 Modo libre

Un interruptor global, persistente, visible sin buscarlo: **modo vía / modo libre**.

| | Vía | Libre |
|---|---|---|
| Navegación | Todo | Todo |
| Tarjetas en práctica | Solo desbloqueadas | Todas |
| Juegos | Los del capítulo actual | Todos, con selector de era o etiqueta |
| Capítulos | El siguiente abierto | Todos |
| Progreso y SRS | Se registra | **También se registra** |

Que el progreso cuente en los dos modos no es un detalle: si el modo libre no cuenta, es un modo
de castigo y nadie lo usa dos veces. Lo único que el modo libre no da es cerrar un capítulo — eso
requiere su examen, se haga cuando se haga.

### 4.3 Se desbloquea leyendo, se avanza examinándose

**La unidad de desbloqueo es el relato leído, no la ficha visitada.** Si desbloqueas por visitar
fichas, lo que se aprende es a hacer clic en todo. Si desbloqueas por relato, la sesión tiene
forma: lees la Titanomaquia → se abren doce tarjetas → las practicas → has terminado algo.

Regla operativa: al marcar un relato como leído, pasan a **disponibles** las tarjetas cuyos dos
extremos están en el conjunto de ese relato (`participantes` + `lugar`). Las tarjetas de atributo
y de epíteto, las de sus participantes.

Marcar como leído: botón explícito al final del relato. Nada de detección por scroll —falla, y
falla de la peor manera, que es en silencio.

---

## 5. El examen

**No es un generador nuevo.** Igual que el quiz del bloque K, consume las tarjetas que
`tarjetas.ts` ya emite; lo único propio es la selección, el formato mixto y el umbral.

- 10 preguntas del conjunto del capítulo, priorizando las que el SRS marca como flojas
- Formatos mezclados: flashcard, opción múltiple, emparejar, ordenar — reutiliza los bloques Q y R
- Umbral por defecto 8 de 10, declarado por capítulo por si alguno merece otro
- **Reintento inmediato, sin penalización, sin vidas, sin cuenta atrás**

**Qué pasa al fallar** es la decisión de diseño importante: no se vuelve al principio del
capítulo. Se muestran las preguntas falladas, se ofrece practicar **solo esas**, y el reintento
está a un clic. Un examen que te devuelve a la casilla de salida enseña a no examinarse.

Al aprobar: capítulo cerrado, medalla si la hay, siguiente capítulo abierto, y la pantalla lo
dice con algo que se vea. Es el único momento del sitio donde vale la pena hacer ruido.

---

## 6. Estado persistido

Extiende el JSON versionado del bloque C. Sigue siendo un solo objeto en `localStorage` y sigue
entrando entero en el export/import.

```json
{
  "v": 2,
  "tarjetas":  { "zeus:hijo_de:crono": { "ef": 2.5, "intervalo": 6, "proxima": "2026-08-12" } },
  "leidos":    ["titanomaquia", "castracion-de-urano"],
  "capitulos": { "el-primer-linaje": { "estado": "cerrado", "intentos": 2 } },
  "medallas":  ["primeras-generaciones"],
  "modo": "via"
}
```

`v: 2` desde el primer día de esta capa, con migración desde `v: 1`. Es la razón por la que el
calendario exigía versionar el JSON antes de necesitarlo.

Lo que **no** se persiste: nada derivable. Las tarjetas disponibles se calculan de `leidos` cruzado
con el grafo en cada carga; guardarlas es una copia que se queda vieja el día que edites un relato.

---

## 7. Bloques nuevos

Fichas en el formato del calendario. Van a la Parte II salvo donde se indica.

---

### Bloque O — Capítulos y desbloqueo *(2 sesiones)*

El bloque que hace el trabajo. Los demás son consecuencia.

**Entra:**
- `capitulos` en `materia.yaml` + carga y validación (era existente, relatos existentes, ids
  únicos, ningún relato en dos capítulos)
- Portada de materia rehecha: cinco eras, sus capítulos, estado de cada uno
- Ruta `/[materia]/c/[id]` — la página del capítulo: resumen, relatos en orden, tarjetas, examen
- Marcar relato como leído + `leidos` en `localStorage`
- Cálculo de tarjetas disponibles; la página de práctica las filtra
- Interruptor vía / libre

**No entra:** examen (bloque P), medallas (bloque P), juegos.

**Prerrequisito:** bloque C. Sin persistencia no hay estado que desbloquear.

**Trampa:** con el contenido del PoC solo hay material para dos o tres capítulos. Constrúyelo con
esos dos y no esperes a tener temario. El temario crece con el bloque I.

**Verificación:** entras nuevo, ves un capítulo abierto y cuatro cerrados, lees su relato, aparecen
tarjetas que antes no estaban, y con el interruptor en libre aparecen todas.

---

### Bloque P — Examen, niveles y medallas *(1-2 sesiones)*

**Entra:** el examen de §5, cierre de capítulo, apertura del siguiente, registro `medallas`,
las de recorrido automáticas y las de cobertura declaradas, y una página donde se vean.

**Prerrequisitos:** O, y **K si quieres opción múltiple dentro del examen** — la trampa de los
distractores de Afrodita se agrava en un examen, donde un falso negativo te bloquea un capítulo.
Sin K, examen solo con formatos que no necesiten distractores.

**Verificación:** suspende a propósito. Comprueba que puedes reintentar en dos clics, que solo te
ofrece repasar lo fallado y que en ningún momento has perdido acceso a nada.

---

### Bloque Q — Emparejar *(1 sesión)*

Rejilla de seis pares, arrastrar o clic-clic. La misma tarjeta que ya emite `tarjetas.ts`,
presentada distinto: cero contenido nuevo, cero generador nuevo.

Es el que más sensación de juego da por menos trabajo, y por eso va el primero de los cuatro.

**Trampa:** un acierto en emparejar no es un acierto de SRS. La pista visual hace la mitad del
trabajo. Regístralo como refuerzo suave —o no lo registres— pero no como repaso superado.

---

### Bloque R — Ordenar cronológicamente *(1 sesión, y sustituye a medio bloque J)*

Cinco relatos de una era, desordenados, a colocar. Los datos ya existen: `era` + `orden`.

**Esto es el timeline, pero con un verbo en vez de con una vista.** Si vas a hacer el bloque J,
haz esto antes: es una décima parte del trabajo y contesta si la cronología le interesa a alguien.
El timeline dual del bloque J sigue teniendo sentido después, y sobre todo cuando entre historia.

---

### Bloque S — Obras e iconografía *(2-3 sesiones — el que más cambia la cara del sitio)*

Buena parte del "veo un diccionario" es que estás viendo texto. Un título, seis campos y una
lista de enlaces es literalmente el formato de una entrada de diccionario, le pongas la
tipografía que le pongas.

**Una obra de arte es una entidad más.** Sin excepciones al modelo:

```yaml
id: rapto-de-europa-tiziano
tipo: obra
nombre: El rapto de Europa
resumen: Tiziano pinta a Europa ya sobre el toro, en pleno mar y sin salida.
atributos:
  autor: Tiziano
  fecha: 1562
  soporte: óleo sobre lienzo
  museo: Isabella Stewart Gardner, Boston
relaciones:
  - tipo: representa
    destino: rapto-de-europa
  - tipo: representa
    destino: europa
enlaces:
  - tipo: commons
    url: https://commons.wikimedia.org/wiki/File:...
```

`representa` / `representado_en`. Escribes la obra una vez y aparece en la ficha de Europa, en la
de Zeus y en el relato. Es el truco del proyecto aplicado a otra cosa.

De ahí sale gratis el **juego de identificar**: se muestra la imagen y se elige a quién o qué mito
representa. Los distractores salen de entidades del mismo tipo, con la misma regla de exclusión
del bloque K.

**El coste no es de código, es de curación.** Wikimedia Commons, el Met (Open Access) y el
Rijksmuseum dan dominio público con metadatos decentes. Presupuesta el tiempo de buscar imágenes,
no el de escribir el componente.

**Precaución legal, y no es menor:** dominio público de la obra ≠ dominio público de la
fotografía. Quédate en Commons con licencia explícita y en los programas Open Access de los
museos, y guarda la atribución en el YAML.

**Empieza por tres obras y mira el efecto en las fichas antes de curar treinta.**

---

### Bloque T — Situar en el mapa *(1 sesión, antes del bloque M)*

Sale un nombre —Creta, Delfos, el Olimpo— y se hace clic en el mapa base SVG del Mediterráneo.

Mismo movimiento que en R: el mapa como juego cuesta una fracción del mapa como vista y contesta
si merece la pena hacer el mapa como vista. Prerrequisito de esquema idéntico al del bloque M:
`coordenadas: {lat, lon}` y `mapeable: false` para el Hades y el Tártaro.

---

### Bloque U — Layout de lectura *(1-2 sesiones)*

No es "una pasada de diseño": es una decisión de estructura disfrazada de estética. **Si la ficha
sigue siendo campos apilados, ningún color la salva.**

Lo que hay que decidir aquí, y hacerlo antes de tener cuarenta fichas escritas:

- La jerarquía de la ficha: imagen y prosa arriba, campos y relaciones como aparato debajo. Ahora
  mismo es al revés y por eso se lee como una entrada de diccionario
- Ancho de lectura y tipografía del relato — es el sitio donde se pasa el tiempo
- Cómo se ve un `<E />` sin que el texto parezca una alfombra de enlaces
- El estado de capítulo: abierto, en curso, cerrado, sin recurrir solo al color

Cabe hacerlo antes que Q, R, S o T. No cabe hacerlo antes que O: no se maqueta una estructura que
todavía no existe.

---

## 8. Cambios en los documentos existentes

### En `calendario-construccion.md`

| Dónde | Cambio |
|---|---|
| Huecos del hito 1 | El hueco `rutas` pasa a llamarse `capitulos` y adopta el esquema de §3 |
| Huecos del hito 1 | **Hueco nuevo:** `tipo: obra` y relación `representa`/`representado_en`. Tres líneas en `materia.yaml`, cero migración después |
| Bloque C | Añade `leidos`, `capitulos`, `medallas`, `modo` al JSON, y `v: 2` |
| Bloque J | Deja de ser la vía principal de la cronología. Va después de R, y con historia como justificación real |
| Bloque M | Igual: después de T |
| **Bloque N** | **Queda absorbido.** La ruta de aprendizaje *son* los capítulos. Sobrevive solo el panel de progreso, que se funde con la página de medallas del bloque P |
| Dependencias | `Hito 3 → C → O → P`; `O → Q, R, S, T, U`; `K → P` (solo si el examen lleva opción múltiple) |

### En `esqueleto-proyecto.md`

- §5 Rutas: añadir `/gr/c/[id]` (capítulo) y `/gr/jugar/[juego]`
- §8 Catálogo: los cuatro juegos y el examen entran como categoría propia, no como variantes de
  flashcards
- §9 Fuera de alcance: sigue vigente entero. Nada de esto necesita backend ni cuentas

### En `guia-de-prosa.md`

- §5 gana un caso: **prosa de obra**. Uno o dos párrafos que digan qué se ve, qué momento del mito
  eligió el artista y qué decisión tomó. No es una ficha de museo: los datos duros son campos
- El resumen de una obra es el que más peso carga, porque se lee bajo la imagen en el juego de
  identificar

---

## 9. Riesgos y contención

**El capítulo se convierte en trabajo de mantenimiento.** Es el riesgo real. Contención: un
capítulo son ocho líneas de YAML y los relatos existen por su cuenta. Si escribir el temario
empieza a frenar la escritura de contenido, deja capítulos sin cubrir — el contenido suelto se
lee y se practica igual.

**La medalla se convierte en el objetivo.** Si se puede cerrar un capítulo sin leer nada, se hará.
Contención: el examen sale de las tarjetas del capítulo, y esas tarjetas solo están disponibles
tras leer. Se puede forzar por modo libre, y está bien: quien elige saltarse la lectura sabe lo
que hace.

**Los cuatro juegos a la vez.** No los abras juntos. Si el sitio mejora con Q, R, S y T
desplegados el mismo día, no vas a saber cuál lo arregló ni cuál mantener.

**Contención global, en el espíritu del bloque L:** date un número de sesiones por adelantado para
O + P + Q + U. Si al agotarlo la sensación de diccionario sigue ahí, el problema no era la capa de
progresión y toca replantear otra cosa — pero `content/` sigue intacto, que es todo el argumento
de haber separado `src/` de `content/`.

---

## 10. Orden recomendado

```
C (SRS) ──> O (capítulos) ──> P (examen y medallas)
                │
                ├──> U  layout de lectura
                ├──> Q  emparejar
                ├──> S  obras ──> juego de identificar
                ├──> R  ordenar ──> J  timeline dual
                └──> T  situar ───> M  mapa
```

**Las cuatro primeras cosas que harías:** O, luego U, luego Q, luego tres obras del bloque S solo
para ver el efecto en las fichas. Con eso ya sabes si el problema era estructural.

---

## 11. Una nota sobre el PoC

Esto no es que el PoC haya fallado. La tesis —escribes una arista y obtienes cuatro cosas— se
validó. Lo que pasó es que era una tesis incompleta: validaba el motor, no el producto.

Es información buena y barata, y llega con diez entidades escritas en vez de con doscientas. Que
es exactamente para lo que estaba el PoC.
