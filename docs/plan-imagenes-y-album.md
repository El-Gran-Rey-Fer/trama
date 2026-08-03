# Plan de trabajo — Imágenes, álbum y carriles paralelos

Documento de trabajo para el tramo posterior al MVP del modo aventura. Compañero de
`esqueleto-proyecto.md` (arquitectura), `plan-modo-aventura.md` (de dónde venimos),
`guia-de-prosa.md` (contenido) y `DESIGN.md` (interfaz).

**Este documento manda sobre los anteriores donde se contradigan.** La sección 7 lista
exactamente en qué.

**Cómo se usa:** a diferencia de los planes anteriores, este no es una secuencia. Son
**cinco carriles que corren en paralelo**, porque así es como se está trabajando: Claude
Code aplicando cambios, Claude Design proponiendo diseño, y escritura y curación de
imágenes a mano. Cada carril dice qué entra, en qué orden interno y dónde toca a los
demás. Al final hay plantillas de encargo listas para pegar.

---

## 1. Qué se está construyendo y por qué ahora

El MVP del modo aventura está cerrado: se entra, se ve el mapa de eras y capítulos, se
lee un relato, se marca leído, se abren tarjetas, se practica, se juega a emparejar y a
ordenar, y el examen cierra el capítulo y abre el siguiente.

Lo que el recorrido a mano ha enseñado es que **el sitio ya funciona y no se ve**. Todo
lo que no es la ficha de entidad está sin vestir, los juegos los primeros. Y hay un
segundo hallazgo, menos evidente y más importante:

> La única imagen que existe reveló que el esquema de imagen no aguanta. Y al mirar por
> qué, resultó que lo que hace falta no es arreglar un recorte: es que **la
> representación visual es un eje de aprendizaje propio**, no una decoración de la ficha.

Reconocer a Heracles por la piel de león y el garrote, o a Zeus por el rayo y el águila,
es exactamente lo que este sitio puede enseñar y una lista de nombres no. Eso convierte
las imágenes en contenido de primera clase, con su modelo, sus tarjetas y su juego.

De ahí sale el tercer hilo, que resuelve dos problemas a la vez: **el álbum de cromos.**
El índice alfabético de todas las entidades no escala y, además, el modo aventura se
parecía demasiado a la enciclopedia. Un álbum con casillas que se llenan es el índice de
aventura y es la mecánica de progreso que faltaba, sin inventar nada nuevo.

---

## 2. Estado de partida

| | |
|---|---|
| Modo aventura | Pasos 1-9 hechos y desplegados. 70 páginas |
| Relatos | 5: `castracion-de-urano`, `titanomaquia`, `nacimiento-de-atenea`, `rapto-de-persefone`, `teseo-y-el-minotauro` |
| Entidades | ~50. 19 deidades con `epitetos` y `atributos` rellenos |
| Tarjetas | ~180: relación, atributo y epíteto |
| Juegos | Emparejar y ordenar, dentro de una concha común |
| Examen | Solo opción múltiple. Sin priorización por dificultad (no hay SRS) |
| Persistencia | `localStorage`, `v: 1`, con exportar e importar |
| Prosa de entidad | Escrita: Urano, Crono, Zeus |
| Imágenes | **Una**, y con el esquema equivocado |
| Diseño | Solo la ficha de entidad y la lectura. Juegos y capítulos, sin vestir |

### Deuda heredada del tramo anterior

Anotada por Claude Code al cerrar, y sigue abierta:

- El examen es solo opción múltiple. Emparejar y ordenar no entran en la secuencia de
  diez preguntas porque no estaba decidido cómo se puntúan. **Se decide en §3.8.**
- No hay reintento solo de lo fallado: el botón repite el examen entero. Aceptable.
- "Priorizando lo que esté flojo" no está implementado, y no lo estará hasta que haya
  repetición espaciada. Las preguntas salen barajadas.

---

## 3. Decisiones cerradas

No volver a abrirlas sin motivo nuevo.

### 3.1 Una obra es una entidad, y el campo `imagen:` de la entidad desaparece

El campo suelto que se había empezado a usar ya llevaba crédito, origen y alt: cuatro
quintas partes de una entidad. Le faltaban autor, fecha y periodo. Así que la pregunta no
era si modelar las obras, sino si hacerlo ahora o migrarlas dentro de treinta imágenes.

```yaml
# content/mitologia-griega/entidades/jupiter-louvre-lens.yaml
id: jupiter-louvre-lens
tipo: obra
nombre: Júpiter
resumen: Estatua romana de Júpiter con el rayo en la mano y el águila a sus pies.
atributos:
  autor: desconocido
  fecha: siglo I
  periodo: romano
  soporte: escultura
  museo: Louvre-Lens
imagen:
  archivo: /img/gr/obras/jupiter-louvre-lens.jpg
  credito: "Foto: Jamain, CC BY-SA 4.0"
  origen: https://commons.wikimedia.org/wiki/File:Jupiter_J1a.jpg
  alt: Estatua de mármol de Júpiter portando un rayo, con un águila a sus pies
relaciones:
  - tipo: representa
    destino: zeus
    foco: [50, 18]
  - tipo: representa
    destino: rayo
  - tipo: representa
    destino: aguila
```

Cuatro cosas que esto da y el campo suelto no:

1. **Un fichero por obra en `/img/gr/obras/<id>.jpg`.** Diez Zeus son diez obras, no
   `zeus-2.jpg`, `zeus-3.jpg`.
2. **`representa: rayo`** convierte el atributo iconográfico en grafo. "¿Qué lleva en la
   mano?" sale solo, y con él el juego de reconocer por símbolos.
3. **`periodo` y `soporte`** hacen consultable el eje de mezclar vasija ática,
   renacimiento e ilustración moderna: "el mismo dios visto en cinco épocas" es una
   pantalla que sale del grafo y que no tiene nadie.
4. **Cero migración después.** Es el argumento de siempre: un esquema que se arregla con
   treinta ficheros escritos cuesta un script; con tres, cuesta nada.

**Una obra puede representar un mito.** Un relato es una entidad de pleno derecho, así
que `representa: rapto-de-persefone` funciona sin añadir nada al esquema. Un cuadro
declara el mito y a todos los que salen en él, y aparece solo en las seis fichas.

La entidad gana **un solo campo, opcional**: `retrato: <id-de-obra>`, para decir cuál de
sus obras es la de cabecera. Si no está, se toma la primera.

**Relación:** `representa` / `representado_en`. Va al registro de `materia.yaml`.

### 3.2 El foco vive en la relación, no en la obra

`foco: [x, y]` en porcentajes, sobre la relación `representa`. Es lo que resuelve el
recorte y lo que permite que un cuadro de grupo dé retratos correctos para cada figura
que sale en él: el mismo JPG, dos focos distintos, dos avatares bien encuadrados.

Se traduce a `object-position` en el contenedor, sea el panel ancho de la ficha o la
casilla cuadrada del álbum. **Una imagen, un número, dos contenedores.** No se recortan
ficheros a mano y no hay dos categorías de imagen.

**El foco solo hace falta donde la obra vaya a servir de retrato.** Para el mito, para la
granada y para el casco de Hades no se pone: se muestra la obra entera. Esto baja mucho
el trabajo por imagen — dos o tres focos, no siete.

### 3.3 La casilla es un componente, y aparece en tres sitios

Retrato o, si no hay obra, inicial sobre el color del tipo de entidad —el patrón de
Gmail. Nunca un icono de imagen rota ni un rectángulo gris: la casilla sin retrato tiene
diseño propio y se lee como "esta figura aún no tiene imagen", no como un fallo.

El mismo componente sirve en:

- La **cuadrícula de participantes** de un relato, tipo reparto de IMDb
- La **minificha** que sale al pulsar un `<E />`
- El **álbum**, con un estado más (sin encontrar)

Que sea un componente y no tres es la razón de que Design lo resuelva una sola vez.

### 3.4 El álbum de cromos, con dos estados

En modo aventura, el índice **es** el álbum: una plantilla con casillas que se llenan. Los
huecos se ven, y eso es intencionado — la silueta vacía es la que dice que Heracles existe
y todavía no lo tienes.

| Estado | Cómo se consigue | Qué se ve |
|---|---|---|
| **Sin encontrar** | — | Casilla vacía con su forma, sin nombre o con silueta |
| **Encontrado** | Sale en un relato marcado como leído | Retrato (o inicial) y nombre |
| **Dominado** | Sus tarjetas superadas / capítulo aprobado | Marcado: sello, borde, lo que decida Design |

**Por qué dos estados y no uno.** Con uno hay que elegir entre dos cosas malas: si basta
leer, el álbum se llena solo y no significa nada; si hace falta examen, un personaje
secundario que sale en un relato pero en ninguna pregunta no se puede conseguir nunca.
Con dos, leer te da la figura y estudiar te la valida, y el "hazte con todos" tiene dos
niveles de profundidad sin mecánicas nuevas.

**Esto no contradice el bloqueo de §3.2 de `plan-modo-aventura.md`.** El álbum registra lo
que se ha recorrido, no lo que está permitido ver: la ficha de Heracles responde el primer
día aunque su casilla esté vacía.

### 3.5 Niveles cosméticos, con nombres del dominio

"Aspirante a héroe", "estudiante de Quirón". Es cosmética y es barato: una tabla de
umbrales sobre un número que el álbum ya calcula.

Dos condiciones que lo mantienen sano:

- **El nivel sale de cobertura, nunca de constancia.** Cromos del álbum y capítulos
  cerrados. En el momento en que un nivel se pierde por no entrar, es una racha con otro
  nombre, y las rachas están descartadas por escrito.
- **Los nombres se declaran en `materia.yaml`**, como cualquier otro registro. Son del
  dominio: en la mitología nórdica serán otros.

### 3.6 El índice tiene dos caras

| | Sandbox | Aventura |
|---|---|---|
| Qué es | Enciclopedia | Álbum |
| Agrupación | Por `tipo`, y dentro por era o etiqueta | Por capítulo o era, en casillas |
| Qué muestra | Todo, siempre | Todo, con estado de cada casilla |

La lista alfabética plana desaparece de las dos. No escala y no dice nada.

### 3.7 Design lee, Claude Code escribe

Claude Design lee el estado directamente del repo y propone. Claude Code es el **único
escritor**. No hay conflicto posible por construcción.

**La única precaución:** Design lee `main`. Si Code está trabajando en rama, Design está
diseñando contra una estructura que ya cambió. **Mergear antes de pedir una pasada de
diseño.**

### 3.8 El examen cuenta pares y posiciones, no tableros

Resuelve la deuda que dejó abierta el tramo anterior. Para que emparejar y ordenar quepan
en una secuencia de diez preguntas con umbral de ocho, la unidad de puntuación no puede
ser el tablero:

- Un **emparejar** de tres pares vale **tres preguntas**
- Un **ordenar** de cuatro relatos vale **tres aciertos** posibles (las transiciones)
- Una **opción múltiple** vale una

Así "8 de 10" significa lo mismo en cualquier formato y los formatos se pueden mezclar sin
que el umbral se desequilibre.

### 3.9 El árbol genealógico sube de prioridad

Estaba aparcado con el timeline y el mapa. Sube por un motivo concreto: **es la única de
las tres vistas cuyos datos están completos.** El `orden` de los relatos se rellenó a ojo
y el mapa tiene lugares sin coordenadas y entidades que no están en ningún sitio; la
genealogía está entera en el grafo desde el PoC, porque es sobre lo que se construyó.

**Vista primero, juego después** — al revés que con ordenar y situar, y a propósito: aquí
no hace falta que un juego barato conteste si la vista merece existir, porque ya se sabe
que sí.

Contención, que sigue vigente: red-ego a profundidad 2 desde una entidad, **solo
genealogía**, layout calculado en tiempo de build y servido como SVG estático. El grafo
general completo es una madeja ilegible y el mejor candidato del proyecto a agujero negro.

Como juego —arrastrar a Rea a su hueco— tiene algo que emparejar y ordenar no tienen: la
posición correcta enseña la estructura, no solo el par. Y reutiliza la casilla de §3.3 como
pieza arrastrable.

### 3.10 Hay dos mapas, y son distintos

Una decisión que evita construir el equivocado:

- **Mapa cosmológico** — Olimpo arriba, tierra en medio, inframundo abajo, Tártaro debajo
  de todo, Océano rodeando. Es la cosmología griega y **sí tiene sitio para el Tártaro**,
  que en un mapa del Mediterráneo es justo la entidad que rompe el sistema. Sirve para la
  cosmogonía y para los mitos divinos.
- **Mapa geográfico** — Dodona, Delfos, Atenas, Troya, Pilos, Micenas, Creta. Cobra
  sentido según avanzan las eras, y es el que valdrá tal cual para el módulo de historia.

No son fases del mismo trabajo: son dos ilustraciones con puntos encima, y probablemente
dos juegos de situar. Ninguno entra en este tramo, pero **el prerrequisito de esquema sí
conviene reservarlo**: `coordenadas: {lat, lon}` en lugares y `mapeable: false` para lo que
no está en ningún sitio.

---

## 4. Los carriles

Cinco. A es secuencial por dentro; los demás corren cuando se pueda.

---

### Carril A — Claude Code

Único escritor del repo. El orden interno importa: los tres primeros desbloquean a los
demás y a los otros carriles.

#### A1 · Esquema de obra y script de alta

**Entra:**
- `tipo: obra` y relación `representa`/`representado_en` con `foco` opcional, en
  `materia.yaml`
- Campo `retrato` opcional en la entidad
- Carpeta `/img/gr/obras/`
- **`pnpm nueva-obra <url-de-commons>`**: lee la página de Commons y escupe el YAML con
  autor, fecha, soporte, museo, crédito, origen y alt rellenos. Deja a mano solo
  `representa` y `foco`
- Migrar la única obra existente (Júpiter del Louvre-Lens) al modelo nuevo

**Por qué va primero:** es literalmente lo que desbloquea el carril B. Sin el script, cada
imagen cuesta doce líneas escritas a mano y la curación se hace cuesta arriba desde la
tercera.

**Trampa:** los metadatos de Commons no son uniformes. El script tiene que dejar huecos
marcados en vez de inventar valores, y no debe fallar si falta el autor — en obras
antiguas casi siempre falta, y `desconocido` es un valor legítimo, no un error.

**Verificación:** `pnpm nueva-obra <url>` con tres URLs distintas de Commons produce tres
YAML válidos que compilan.

#### A2 · El salto de línea de `<E />`

Independiente de todo lo demás, y probablemente media hora.

**Diagnóstico:** apareció con las minifichas. `E.astro` emite un elemento de bloque
(`<div>`, `<p>`, `<ul>`, un encabezado) dentro del párrafo; el navegador cierra el `<p>`
ahí mismo y abre otro. Por eso el corte cae siempre justo después del enlace.

**Arreglo:** todo lo que `<E />` emita tiene que ser válido dentro de un párrafo — solo
`<span>` y `<a>`, con el `display` cambiado por CSS. Si la minificha necesita estructura de
bloque, sale del flujo con la Popover API en vez de vivir anidada en el texto.

**Verificación:** la castración de Urano se lee entera sin cortes, y el HTML servido no
tiene ningún `</p>` que nadie escribió.

#### A3 · Render de imagen y casilla

**Entra:**
- Panel de ficha con `object-position` derivado del `foco` (adiós al recorte actual)
- Componente de casilla: retrato, o inicial sobre el color del tipo
- Cuadrícula de participantes al final del relato
- Casilla en las minifichas

**No entra:** maquetación fina. Estructura y estados; Design los viste después.

**Nota de colocación:** la cuadrícula de participantes queda hoy justo encima del botón de
"marcar como leído", que es el gesto que mueve todo el sistema. El botón se sube o se
desplaza para que no compitan.

**Con A1-A3 aplicados, el carril B arranca sin esperar a nada más.**

#### A4 · Índice, dos caras, y el álbum

**Entra:**
- Sandbox: índice agrupado por `tipo`, y dentro por era. Fuera la lista alfabética plana
- Aventura: el álbum, con los tres estados de §3.4
- Cálculo de encontrado (de `leidos` cruzado con el grafo) y de dominado (de tarjetas y
  capítulos)
- Niveles cosméticos de §3.5, declarados en `materia.yaml`

**No entra:** maquetación. Estructura y estados.

**Trampa:** "dominado" necesita una definición operativa que hoy no existe, porque no hay
SRS. Propuesta provisional: todas las tarjetas de esa entidad acertadas al menos una vez.
Se afina cuando entre la repetición espaciada; el estado persistido no cambia.

#### A5 · Validación

Fallos de build, con fichero y línea en el mensaje:

- Convención de ids: minúsculas, sin tildes, con guiones
- Etiquetas fuera del registro de `materia.yaml`
- Fuentes fuera del registro
- `representa` apuntando a un id inexistente
- `foco` fuera del rango 0-100
- Obra sin `credito` o sin `origen`

**Por qué importa ahora y no antes:** hay dos personas escribiendo ficheros a la vez —
Claude Code y tú, a mano, curando imágenes y relatos. Es exactamente el escenario donde
una errata sobrevive semanas, porque hoy no rompe nada: simplemente `<Coleccion />`
devuelve vacío y esa entidad no aparece donde debería.

**Verificación:** rompe a propósito cada caso y comprueba que el mensaje se entiende sin
abrir el código.

#### A6 · Pertenencia sí/no y puntuación mixta del examen

- Juego de pertenencia: "¿es Melias hija de Urano?". No necesita distractores, evalúa de
  verdad, y **desbloquea las tarjetas de dirección múltiple** que hoy están muertas: la
  deuda anotada de que "¿de quién es padre Urano?" tiene cuatro respuestas y con Zeus
  tendrá cuarenta
- Puntuación por par y por posición de §3.8, para que emparejar y ordenar entren en la
  secuencia de diez

#### A7 · Árbol genealógico

Vista primero: red-ego a profundidad 2, solo genealogía, `d3-hierarchy` (tidy tree,
determinista), **layout calculado en build y servido como SVG estático**. Cero JavaScript
en cliente.

El juego —completar o arrastrar— después, encajando en la concha y reutilizando la casilla.

**Contención:** número de sesiones fijado por adelantado. Si se agota, se entrega la vista
y se cierra el bloque.

---

### Carril B — Curación de imágenes (a mano)

Arranca en cuanto A1-A3 estén aplicados.

**Tres obras primero, y parar.** Un Zeus antiguo, uno renacentista y uno moderno, sobre la
misma entidad. Es la prueba de que el eje de "el mismo dios en cinco épocas" funciona antes
de curar treinta.

**Precaución legal, y no es menor:** dominio público de la obra ≠ dominio público de la
fotografía. Wikimedia Commons con licencia explícita y programas Open Access de museos (el
Met, el Rijksmuseum), y la atribución guardada siempre en el YAML.

**El coste no es de código, es de curación.** Presupuesta el tiempo de buscar imágenes, no
el de escribir el componente.

---

### Carril C — Claude Design

Lee `main`, propone, no escribe. Por orden de dolor:

1. **La concha de juego.** Es donde no hay nada y es lo que más se nota.
2. **Estados de capítulo** — abierto, en curso, cerrado, distinguibles sin recurrir solo al
   color.
3. **Portada de aventura y álbum.**
4. **La casilla** — participante sin retrato y cromo sin encontrar, resueltos a la vez y
   con el mismo lenguaje, porque es el mismo componente.

**No entran las fichas de entidad.** Están razonablemente y no es donde duele.

Sigue vigente entero `DESIGN.md`, incluida la prueba de esfuerzo: la dirección visual tiene
que sostener a la vez un relato de mil palabras, una rejilla de emparejar y una pantalla de
"capítulo cerrado".

---

### Carril D — Mapa de contenido (otro chat)

Entregable: **`mapa-de-contenido.md`**. No es "toda la mitología griega": es la diana.

```
era → capítulos previstos → relatos de cada uno → entidades que arrastran
```

Con estado por relato: **escrito / pendiente / no decidido**. Es lo que convierte "escribe
más mitos" en "faltan dos para cerrar la edad de los Titanes".

No depende de ningún otro carril. Puede arrancar hoy.

---

### Carril E — Prosa de entidad (a mano)

Pendiente desde el lote anterior, y compite por el mismo tiempo que el carril B. El orden
se decide sobre la marcha.

- **Minotauro, laberinto de Creta, inframundo** — el caso difícil: entidades de las que el
  grafo no dice casi nada
- **Hades** — el peor entendido de los olímpicos

Se dejan **sin prosa a propósito** Egeo, la hoz de adamante, las Melias, Andrógeo, el toro
de Creta y Naxos. Son destino de enlace y nada más.

Al encargar cada tanda: adjuntar `guia-de-prosa.md` y **el YAML completo de esas
entidades**. El fallo más probable es reescribir el `resumen` en tres párrafos.

---

## 5. Dónde se tocan los carriles

| Cruce | Qué hacer |
|---|---|
| B espera a A1-A3 | Sin esquema de obra ni render, curar imágenes es trabajo que hay que rehacer |
| C lee `main` | Mergear antes de pedir una pasada de diseño, o se maqueta lo que ya cambió |
| A4 y la casilla de C | Code monta el álbum con estilo provisional; Design lo viste después. Mismo patrón que en el paso 3 del tramo anterior, y funcionó |
| D alimenta a B y E | El mapa de contenido dice qué relato escribir y de quién buscar imágenes |
| A5 protege a B y E | Cuanto antes entre, menos erratas silenciosas sobreviven |

---

## 6. Ideas apuntadas, fuera de este tramo

**Escritas aquí para que no se pierdan.** Cada una con el motivo del aplazamiento, que es
lo que permite saber cuándo deja de valer.

| Idea | Por qué no ahora | Cuándo se reabre |
|---|---|---|
| **Avatar del jugador** | Cosmético puro y compite con trabajo que sí se ve | Cuando el álbum lleve tiempo funcionando. Si entra, se paga con cobertura, nunca con constancia |
| **Mapa cosmológico** | Es una ilustración a mano; no hay datos que lo bloqueen pero tampoco urgencia | Cuando haya volumen de mitos divinos y cosmogónicos |
| **Mapa geográfico** | Cobra sentido con las eras avanzadas: Delfos, Troya, Micenas, Creta | Cuando la edad de los héroes tenga cinco o seis relatos. Y es la baza real del módulo de historia |
| **Timeline como vista** | El `orden` se rellenó a ojo y no sostiene una vista. El juego de ordenar ya cubre la pregunta | Con el módulo de historia, donde las fechas son precisas |
| **Repetición espaciada real** | El campo ya está en el estado persistido desde el paso 1 | Cuando el volumen de tarjetas haga que barajar al azar se note. Con tests que simulen 30 días |
| **Modelar variantes por fuente** | Ya no bloquea nada: la regla de distractores evita el fallo grave de marcar correcto y que el sistema diga que fallaste | En cuanto se escriban mitos en volumen. Cada relato nuevo trae variantes que hoy se están callando sin querer, y "aquí las contradicciones se muestran en vez de resolverse" es de lo poco que este sitio hace y Wikipedia no |
| **Reintento solo de lo fallado** | El reintento completo funciona y es un clic | Si el examen se alarga |
| **Prioridad por dificultad en el examen** | Depende de la repetición espaciada | Con ella |
| **Grafo general completo** | Madeja ilegible y el mejor candidato a agujero negro del proyecto | Probablemente nunca. El árbol genealógico es el 80 % del valor |
| **Módulo de historia** | Otra materia entera | Cuando la mitología griega esté cerrada. Es donde mapa y timeline como vistas cobran sentido de verdad |

---

## 7. Qué queda desfasado en los otros documentos

| Documento | Qué decía | Qué vale ahora |
|---|---|---|
| `esqueleto-proyecto.md` §3.1 | `imagen: /img/gr/zeus.jpg` como campo de la entidad | El campo desaparece. La imagen vive en una entidad `obra`, y la entidad apunta con `retrato`. Ver §3.1 |
| `capa-de-progresion.md`, bloque S | Obras como bloque futuro, "después del MVP" | Entra ahora, y es el carril A1 |
| `capa-de-progresion.md`, bloque S | El juego de identificar es lo que justifica las obras | El objetivo principal es **reconocer por símbolos**. `representa` apunta también a objetos (rayo, águila, piel de león), no solo a personas |
| `plan-modo-aventura.md` §5 | Obras, mapa y árbol, todos "después del MVP" sin orden entre ellos | El árbol sube (§3.9); mapa y timeline bajan (§3.10 y §6) |
| `plan-modo-aventura.md` §5 | Un solo mapa, geográfico, del Mediterráneo | Son dos mapas distintos. Ver §3.10 |
| `plan-modo-aventura.md`, paso 9 | "Formatos mezclados" sin definir cómo puntúan | Se puntúa por par y por posición. Ver §3.8 |
| `DESIGN.md` §5 | La ficha de entidad es la prioridad 2 de diseño | Baja. La prioridad es la concha de juego y el álbum. Ver carril C |
| `estado-del-proyecto.md` §6 | La prosa de entidad es lo siguiente | Es el carril E, y compite con la curación de imágenes |

Sigue vigente sin cambios: la regla invariante y el modelo de datos de
`esqueleto-proyecto.md`, `guia-de-prosa.md` entero, y el resto de `DESIGN.md`.

**Pendiente de escribir:** `guia-de-prosa.md` necesita una sección de **prosa de obra** —
uno o dos párrafos que digan qué se ve, qué momento del mito eligió el artista y qué
decisión tomó. No es una ficha de museo: los datos duros son campos. Y el `resumen` de una
obra es el que más peso carga, porque se lee bajo la imagen en el juego de identificar.

---

## 8. Cómo trabajar esto con Claude Code

Lecciones ya pagadas. Se aplican igual aquí.

**Partir cada turno en dos: propone y para / aplica.** Lo mecánico se completa; lo que
requiere criterio —ids de obra, qué entidades declara `representa`, nombres de nivel— se
propone y espera aprobación.

**La fuente de verdad son los ficheros, no las tablas de entrega.** Verifica contra el
disco, no contra lo que dijo el turno anterior.

**`git status --short` al empezar y al terminar cada paso.** Tres veces ha habido cambios
sin commitear de origen aparentemente desconocido, y las tres eran ediciones a mano.

**Un paso, un commit.** Los pasos del carril A están escritos para ser esa unidad.

**Rama para lo que rompa el build.** La Action de Pages solo corre en `main`.

**No inventes componentes ni campos en silencio.** Si un paso necesita algo que no está
declarado, se anota y se propone.

---

## Apéndice — plantillas de encargo

### Para Claude Code

> Adjunto el plan de imágenes y álbum, y el estado del proyecto. Vamos con el paso
> **[A1…A7]**.
>
> Lee la ficha de ese paso. Antes de tocar nada: `git status --short` y dime qué
> encuentras.
>
> Primero **propón y para**: qué ficheros vas a tocar, qué ids o nombres nuevos hacen
> falta, y cualquier sitio donde el plan resulte incómodo o incompleto. No apliques nada
> hasta que te lo apruebe.
>
> Cuando lo apruebe, aplica solo eso, y termina con la verificación que dice la ficha y con
> `git status --short`.

### Para Claude Design

> Adjunto `DESIGN.md` y el plan de imágenes y álbum. Lee el repo tal como está en `main`.
>
> Diseña **[la concha de juego / los estados de capítulo / el álbum / la casilla]**.
>
> Recuerda la prueba de esfuerzo: la dirección tiene que sostener a la vez un relato de mil
> palabras, una rejilla de emparejar y una pantalla de "capítulo cerrado". Móvil primero.
>
> No toques las fichas de entidad.

### Para el chat del mapa de contenido

> Quiero construir `mapa-de-contenido.md` para la mitología griega: las cinco eras, los
> capítulos previstos en cada una, los relatos de cada capítulo y las entidades que
> arrastran, con estado escrito / pendiente / no decidido.
>
> Ya escritos: `castracion-de-urano`, `titanomaquia`, `nacimiento-de-atenea`,
> `rapto-de-persefone`, `teseo-y-el-minotauro`.
>
> No quiero un índice exhaustivo de toda la mitología: quiero la diana de qué escribir
> después y en qué orden.
