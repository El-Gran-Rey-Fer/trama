# Plan de trabajo — Modo aventura

Documento de trabajo para el siguiente tramo. Compañero de `esqueleto-proyecto.md`
(arquitectura), `capa-de-progresion.md` (de dónde salen los capítulos), `guia-de-prosa.md`
(contenido) y `estado-del-proyecto.md` (dónde estábamos).

**Este documento manda sobre los anteriores donde se contradigan.** La sección 6 lista
exactamente en qué.

**Cómo se usa:** se adjunta a una conversación de Claude Code junto con
`estado-del-proyecto.md` y se dice qué paso se va a hacer. Cada paso de la sección 4 es
autosuficiente: dice qué entra, qué no entra, cómo verificar que terminó y con qué trampa
va a topar. Al final hay una plantilla de encargo lista para pegar.

---

## 1. Qué se está construyendo y por qué ahora

El objetivo del tramo es que exista **un bucle completo que se pueda recorrer y enseñar**:

> Entro → veo un mapa de eras y capítulos → abro el primero → leo su relato → marco leído →
> se abren tarjetas que antes no estaban → las practico → me examino → el capítulo se cierra
> y se abre el siguiente.

Hoy hay cinco relatos y una era vacía. **Eso no es motivo para esperar.** La estructura es lo
que le dice al contenido qué escribir: sin capítulos, "escribe más mitos" no tiene diana; con
capítulos, la diana es "faltan dos relatos para cerrar la edad de los Titanes". Definir la
estructura después de escribir el contenido significa escribir a ciegas y reorganizar luego.

El frontend y la dirección visual se están haciendo **en paralelo y por otra vía**. Nada de
este documento decide colores, tipografía ni maquetación. Lo que sí hace es dejar montadas
las pantallas y los estados que ese trabajo tendrá que vestir.

---

## 2. Estado de partida

| | |
|---|---|
| Relatos | 5: `castracion-de-urano`, `titanomaquia`, `nacimiento-de-atenea`, `rapto-de-persefone`, `teseo-y-el-minotauro` |
| Entidades | ~50, la mayoría stubs de cuatro campos |
| Tarjetas | 107, **todas derivadas de relaciones** |
| Prosa de entidad | Escrita: Urano, Crono, Zeus |
| Eras pobladas | cosmogonía (1), titanes (1), olímpicos (2), héroes (1). **Guerra de Troya, vacía** |
| Persistencia | No existe. Nada se guarda entre sesiones |

---

## 3. Decisiones cerradas

No volver a abrirlas sin motivo nuevo.

### 3.1 Dos modos, y se llaman así

**Aventura** — la vía guiada. La portada es el mapa de eras y capítulos. Un capítulo abierto,
los demás cerrados. Dentro de un capítulo: sus relatos en orden, botón de leído al final de
cada uno, las tarjetas que ese relato desbloquea, y el examen. Aprobar cierra el capítulo y
abre el siguiente.

**Sandbox** — la wikipedia. Todo navegable, todas las tarjetas practicables, todos los juegos
con selector libre de era o etiqueta. Sin capítulos y sin exámenes.

El interruptor es global, persistente y visible sin buscarlo.

### 3.2 El bloqueo es de la vía, nunca del contenido

Toda URL responde siempre, en los dos modos. Un capítulo cerrado **se señala, no se tapa**:
nada de fichas borrosas ni de "desbloquea para ver". Tres razones, en orden de peso: esconder
contenido en un sitio para aprender es hostil; es un sitio estático y el candado sería
decorativo porque el contenido está en el HTML; y un enlace compartido tiene que funcionar
para quien lo recibe.

### 3.3 El progreso cuenta igual en los dos modos

Lo único que sandbox no da es cerrar un capítulo, porque eso requiere su examen. Si el modo
libre no sumara, sería un modo de castigo y nadie lo usaría dos veces.

### 3.4 Se desbloquea leyendo

La unidad de desbloqueo es **el relato marcado como leído**, no la ficha visitada. Si
desbloquea visitar fichas, lo que se aprende es a hacer clic en todo.

Botón explícito al final del relato, con acuse de recibo. **Nada de detección por scroll:**
falla, y falla en silencio.

Al marcar leído pasan a disponibles las tarjetas cuyos dos extremos están en el conjunto del
relato (`participantes` + `lugar`), más las de atributo y epíteto de esos participantes.

### 3.5 Nada se autoevalúa

Se descarta la flashcard de "gírala y dime si acertaste". O se evalúa de verdad o no se
cuenta. La consecuencia es buena y ahorra trabajo:

> **El examen no es un formato aparte: es los juegos, en modo evaluado, sacando preguntas del
> conjunto del capítulo.**

Cada juego que se monta mejora el examen automáticamente. Y el examen no puede existir hasta
que haya al menos dos mecánicas evaluables.

### 3.6 La regla de los distractores

Las opciones falsas salen de entidades del mismo `tipo`, **excluyendo toda entidad conectada
por ese tipo de relación en cualquier dirección y bajo cualquier fuente.**

Esto resuelve el caso Afrodita: si la pregunta es quién es su padre y la respuesta marcada es
Urano, Zeus no puede aparecer como opción falsa, porque también lo es según la *Ilíada*.
Marcar la respuesta correcta y que el sistema diga que has fallado es el peor fallo posible;
en un examen con umbral, además, **te bloquea la progresión por acertar**.

Con esta regla, la opción múltiple funciona **sin necesidad de modelar antes las variantes por
fuente**. Modelar fuentes sigue pendiente, pero deja de ser prerrequisito de nada.

### 3.7 Qué tarjeta entra en qué juego

Una relación puede tener varias respuestas válidas: "¿de quién es padre Urano?" responde
cuatro nombres y con Zeus responderá cuarenta.

| Formato | Regla |
|---|---|
| Opción múltiple | Vale en las dos direcciones, con la regla 3.6 |
| Emparejar | **Solo tarjetas con respuesta única.** Cuatro cartas que encajan en el mismo hueco es un tablero ambiguo, no difícil |
| Ordenar | Solo relatos, por `era` + `orden` |

Es una regla de selección, no un generador nuevo.

### 3.8 Nada de rachas ni cuentas atrás

El motor es el capítulo cerrado, no el día no fallado. Ningún elemento puede castigar la
ausencia.

### 3.9 Ids de tarjeta deterministas

Derivados del contenido: `zeus:hijo_de:crono`, `zeus:attr:simbolo`. Nunca un índice de array.
Un id inestable borra el historial del usuario cada vez que se inserte una entidad.

---

## 4. El orden de trabajo

Nueve pasos. Los cuatro primeros son el armazón y van en orden estricto. Del 5 en adelante hay
margen, pero el que está escrito es el bueno.

---

### Paso 1 — Persistencia

Todo lo demás cuelga de aquí. Sin esto no hay nada que desbloquear ni capítulo que cerrar.

**Entra:**
- Un **único** objeto en `localStorage`, versionado desde el primer día
- Wrapper con lectura, escritura y valor por defecto si no hay nada guardado
- **Exportar e importar como fichero.** Son veinte líneas y es la única defensa del usuario
  contra borrar los datos del navegador. Ocupa el hueco de las cuentas que se descartaron

```json
{
  "v": 1,
  "tarjetas":  { "zeus:hijo_de:crono": { "ef": 2.5, "intervalo": 6, "proxima": "2026-08-12" } },
  "leidos":    ["titanomaquia"],
  "capitulos": { "el-primer-linaje": { "estado": "cerrado", "intentos": 2 } },
  "medallas":  [],
  "modo": "aventura"
}
```

**Empieza en `v: 1`, no en `v: 2`.** `capa-de-progresion.md` pedía `v: 2` con migración desde
`v: 1`, pero el `v: 1` nunca llegó a existir en ningún navegador. Escribir un migrador de algo
que nadie tiene es trabajo por ceremonia.

**No entra:** el algoritmo de repetición espaciada. De momento basta con marcar visto o no
visto; el intervalo puede ser un campo que todavía nadie calcula.

**No se persiste nada derivable.** Las tarjetas disponibles se calculan de `leidos` cruzado
con el grafo en cada carga. Guardarlas es una copia que se queda vieja el día que edites un
relato.

**Verificación:** exportas, borras los datos del navegador, importas, y está todo.

---

### Paso 2 — Declarar los capítulos

Editorial y cero código. Un capítulo son ocho líneas de YAML y **vive entero en
`materia.yaml`**: no se toca ni un `.yaml` de entidad ni un frontmatter de relato.
Reorganizar el temario entero es editar un fichero.

```yaml
capitulos:
  - id: el-primer-linaje
    nombre: El primer linaje
    era: cosmogonia
    orden: 100
    resumen: De dónde sale todo y por qué el primer rey del cosmos dura tan poco.
    relatos: [castracion-de-urano]
    entidades_extra: [caos, tartaro]
    examen:
      aciertos: 8
      de: 10
```

El conjunto del capítulo —de donde salen sus tarjetas y su examen— se calcula como
`participantes de sus relatos ∪ entidades_extra`. **No se lista a mano lo que el grafo puede
derivar.** `entidades_extra` es solo para lo que importa y no participa en ninguna narración.
Si esa lista pasa de tres o cuatro ids, suele significar que falta un relato.

`orden` en múltiplos de 100 dentro de la era, por lo mismo que en los relatos: vas a querer
insertar capítulos en medio.

Con el contenido de hoy salen cuatro o cinco:

| Capítulo | Era | Relatos |
|---|---|---|
| El primer linaje | cosmogonía | `castracion-de-urano` |
| La guerra por el cosmos | titanes | `titanomaquia` |
| (uno o dos) | olímpicos | `nacimiento-de-atenea`, `rapto-de-persefone` |
| El laberinto | héroes | `teseo-y-el-minotauro` |

**Un capítulo no es un contenedor.** Es una selección sobre contenido que existe por su cuenta.
Un relato puede no estar en ningún capítulo: entonces es lectura libre y sus tarjetas se
desbloquean igual al leerlo. Esto es lo que impide que escribir contenido quede bloqueado por
mantener el temario.

**Validación que entra aquí:** era existente, relatos existentes, ids únicos, ningún relato en
dos capítulos.

**Decisión que hay que tomar y no descubrir:** la guerra de Troya está vacía y tres eras
tienen un solo capítulo. O la portada las enseña vacías —que es honesto y además dice que
esto crece— o solo aparecen las que tienen algo. Es una línea de código y es lo primero que se
ve al entrar.

---

### Paso 3 — Portada de aventura

Esta pantalla **es** el modo aventura. Sin ella no existe.

**Entra:**
- Las cinco eras en orden, sus capítulos, y el estado de cada uno
- Estado de capítulo: abierto, en curso, cerrado. **Distinguible sin recurrir solo al color**
- Ruta de capítulo: resumen, sus relatos en orden, sus tarjetas, su examen (todavía sin
  examen funcional)

**No entra:** maquetación fina. La dirección visual llega por la otra vía; aquí se montan la
estructura y los estados que esa vía tendrá que vestir.

**Verificación:** un recién llegado sabe por dónde empezar sin preguntarle a nadie.

---

### Paso 4 — Desbloqueo y modos

**Entra:**
- Botón de "marcar como leído" al final del relato, con acuse de recibo
- `leidos` en el estado persistido
- Cálculo de tarjetas disponibles y filtrado de la página de práctica
- Interruptor aventura / sandbox, global y persistente

**Verificación:** entras nuevo, ves un capítulo abierto y el resto cerrados, lees su relato,
aparecen tarjetas que antes no estaban, y al pasar a sandbox aparecen todas. En ningún momento
has perdido acceso a ninguna URL.

Con esto ya se recorre algo aunque todavía no se cierre nada.

---

### Paso 5 — Rellenar los YAML

Mecánico, no es prosa. Media sesión.

Las quince entidades que salen en los capítulos existentes necesitan `epitetos`, `alias` y
`atributos` (símbolo, dominio, culto, equivalente romano). Hoy casi ninguna los tiene:
`zeus.yaml` tiene una sola relación propia y ni un epíteto.

Por qué antes del paso 6 y no después: las plantillas nuevas de tarjeta cosechan estos campos.
Sin campos que cosechar, escribir las plantillas no produce ni una tarjeta.

**Arista pendiente que se arregla aquí:** `ciclopes → forja → rayo`.

---

### Paso 6 — Ampliar el generador de tarjetas

Hoy las 107 tarjetas salen **todas** de relaciones, y por eso preguntan siempre quién es hijo
de quién y quién devora a quién. Es el diagnóstico que ya se hizo del PoC —la genealogía es
andamio, no contenido— y sigue vivo dentro de las tarjetas.

**Entra:**
- Plantillas de **atributo**: "¿cuál es el símbolo de X?", "¿sobre qué domina X?"
- Plantillas de **alias**: "¿nombre romano de X?"
- Plantillas de **epíteto**: "¿qué dios es el Tonante?"
- La regla de distractores de §3.6
- La regla de qué tarjeta entra en qué juego de §3.7

Las plantillas se escriben **una vez por atributo, en `materia.yaml`**, y se aplican a todo el
contenido. No existe ningún fichero de preguntas y no se va a crear.

**Por qué importa antes del examen:** un examen son diez preguntas del conjunto del capítulo.
Si un capítulo genera ocho tarjetas y las ocho son genealogía, no tienes un examen, tienes un
cuestionario sobre un árbol.

**Verificación:** el capítulo del primer linaje pasa de N a M tarjetas, y las nuevas preguntan
por la materia y no por el parentesco.

---

### Paso 7 — Emparejar

El primer juego. Es el que más sensación de juego da por menos trabajo, y por eso va primero.

Rejilla de seis pares, arrastrar o clic-clic. **Cero contenido nuevo y cero generador nuevo:**
la misma tarjeta que ya emite el generador, presentada distinto. Solo tarjetas de respuesta
única (§3.7).

**Se diseña una concha, no un juego.** Mismo marco, mismo indicador de avance, mismo lenguaje
de acierto y de fallo, mismo sitio para el botón de salir. Los juegos siguientes encajan
dentro. Si cada juego trae su propia cara, el sitio deja de ser un sitio y pasa a ser cuatro
mini-apps con el mismo logotipo.

**Trampa:** un acierto en emparejar no es un acierto de repaso. La pista visual hace la mitad
del trabajo. Regístralo como refuerzo flojo —o no lo registres— pero nunca como repaso
superado.

**No se abren varios juegos a la vez.** Si el sitio mejora con tres desplegados el mismo día,
no vas a saber cuál lo arregló ni cuál mantener.

---

### Paso 8 — Ordenar cronológicamente

Cinco relatos de una era, desordenados, a colocar. **Los datos ya existen** (`era` + `orden`),
no hay que tocar el esquema. Es el juego más barato que queda y encaja en la concha del paso 7.

Además es la cronología con un verbo en vez de con una vista: cuesta una décima parte del
timeline y contesta si a alguien le interesa la cronología antes de construir el timeline.

---

### Paso 9 — Examen y cierre de capítulo

**Aquí se cierra el bucle. Esta es la línea del MVP:** es lo primero que se le puede enseñar a
alguien sin explicarle nada.

**Entra:**
- Diez preguntas del conjunto del capítulo, priorizando lo que esté flojo
- Formatos mezclados en la misma sesión: opción múltiple, emparejar, ordenar
- Umbral por defecto 8 de 10, declarado por capítulo por si alguno merece otro
- Cierre de capítulo, apertura del siguiente, registro en el estado persistido

**Al fallar no se vuelve al principio.** Se muestran las falladas, se ofrece practicar **solo
esas**, y el reintento está a un clic. Sin penalización, sin vidas, sin cuenta atrás. Un examen
que te devuelve a la casilla de salida enseña a no examinarse.

**Al aprobar sí se hace ruido.** Capítulo cerrado, siguiente abierto, y la pantalla lo dice con
algo que se vea. Es el único momento del sitio donde una celebración está justificada, y si el
cierre se siente igual que pasar de página, la capa entera no sirve para nada.

**Verificación:** suspende a propósito. Comprueba que reintentas en dos clics, que solo te
ofrece repasar lo fallado, y que en ningún momento has perdido acceso a nada.

---

## 5. Después del MVP

No entra en este tramo. Escrito para que no se cuele antes de tiempo.

**Situar en el mapa.** Prerrequisito de esquema: `coordenadas: {lat, lon}` en los lugares y
`mapeable: false` para el Hades y el Tártaro —sin ese flag el mapa te pide coordenadas para el
inframundo. Diez lugares son veinte minutos de datos. Mapa base SVG del Mediterráneo, sin
teselas ni claves de API: las fronteras modernas sobre un mapa de mitos son ruido.

**Obras e identificar.** Una obra de arte es una entidad más, con `tipo: obra`, autor, fecha y
museo como atributos y `representa` hacia el mito y los personajes. Se escribe una vez y
aparece sola en la ficha de Europa, en la de Zeus y en el relato. **El coste no es de código,
es de curación.** Empieza por tres y mira el efecto en las fichas antes de curar treinta.
Precaución legal: dominio público de la obra ≠ dominio público de la fotografía. Wikimedia
Commons con licencia explícita y programas Open Access de museos, y la atribución guardada en
el YAML.

**Las vistas: timeline, mapa, árbol genealógico.** Solo si los juegos de ordenar y situar han
demostrado que la cronología y la geografía le interesan a alguien. Del árbol: calcula el
dibujo en tiempo de build y sirve SVG estático, y limítalo a genealogía desde una entidad a
profundidad 2. El grafo general completo es una madeja ilegible y es el mejor candidato del
proyecto a agujero negro.

**Repetición espaciada de verdad.** El campo ya está en el estado persistido desde el paso 1.
Cuando entre, con tests que simulen treinta días: los bugs de intervalos no se ven a ojo y se
descubren tres semanas después.

**Modelar las variantes por fuente**, con Afrodita delante. Ya no bloquea nada gracias a §3.6.

---

## 6. Qué queda desfasado en los otros documentos

| Documento | Qué decía | Qué vale ahora |
|---|---|---|
| `capa-de-progresion.md` | Modos "vía" y "libre" | Se llaman **aventura** y **sandbox** |
| `capa-de-progresion.md` | El examen es un formato propio con flashcards | El examen **es los juegos** en modo evaluado (§3.5) |
| `capa-de-progresion.md` | Estado persistido en `v: 2` con migración | Empieza en `v: 1`; el `v: 1` anterior nunca existió |
| `capa-de-progresion.md` | La opción múltiple del examen depende de modelar antes las fuentes | Ya no. La regla de distractores de §3.6 lo resuelve |
| `esqueleto-proyecto.md` | Distractores = mismo tipo sin esa relación | Insuficiente. Ver §3.6 |
| `estado-del-proyecto.md` | Ninguna entidad tiene prosa | Urano, Crono y Zeus ya la tienen |
| `estado-del-proyecto.md` | La prosa de entidad es lo siguiente | Va después del MVP. La unidad del capítulo es el relato, no la ficha |

Sigue vigente sin cambios todo lo que dicen `esqueleto-proyecto.md` sobre la regla invariante
y el modelo de datos, `guia-de-prosa.md` entero, y `DESIGN.md` entero.

---

## 7. Cómo trabajar esto con Claude Code

Lecciones ya pagadas en lotes anteriores. Se aplican igual aquí.

**Partir cada turno en dos: propone y para / aplica.** Lo mecánico se completa; lo que requiere
criterio —ids de capítulo, qué relatos agrupar, qué atributos añadir a cada entidad— se propone
y espera aprobación. Un id mal elegido ya no se cambia gratis.

**La fuente de verdad son los ficheros, no las tablas de entrega.** Verifica contra el disco,
no contra lo que dijo el turno anterior que había hecho.

**`git status --short` al empezar y al terminar cada paso.** Ha habido tres veces cambios sin
commitear de origen aparentemente desconocido, y las tres eran ediciones a mano.

**Un paso, un commit.** Los pasos de este documento están escritos para ser esa unidad.

**No inventes componentes ni campos en silencio.** Si un paso necesita algo que no está
declarado, se anota y se propone.

---

## Apéndice — plantilla de encargo

Para pegar en una conversación nueva de Claude Code, adjuntando este documento y
`estado-del-proyecto.md`:

> Adjunto el plan del modo aventura y el estado del proyecto. Vamos con el **paso [N]**.
>
> Lee la ficha de ese paso y el estado de partida. Antes de tocar nada: `git status --short`
> y dime qué encuentras.
>
> Primero **propón y para**: qué ficheros vas a tocar, qué ids o nombres nuevos hacen falta, y
> cualquier sitio donde el plan resulte incómodo o incompleto. No apliques nada hasta que te
> lo apruebe.
>
> Cuando lo apruebe, aplica solo eso, y termina con la verificación que dice la ficha y con
> `git status --short`.
