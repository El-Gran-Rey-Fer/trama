# Brief de diseño — Trama

Documento para Claude Design y para cualquiera que toque la interfaz. Dice qué es este
sitio, contra qué se diseña y qué decisiones están cerradas. Compañero de
`esqueleto-proyecto.md` (arquitectura), `capa-de-progresion.md` (estructura de sesión) y
`guia-de-prosa.md` (contenido).

---

## 1. Qué es y para quién

Trama es un sitio estático para aprender dominios narrativos. La primera materia es
mitología griega. El lector tipo es alguien que está aprendiendo: no sabe quién es Crono
cuando llega, y quiere saberlo cuando se va.

**El sitio se usa desde el móvil, con el pulgar, en ratos sueltos.** El escritorio es el
caso secundario. Cualquier decisión que funcione bien en un monitor de 27" y regular en
una pantalla de 390 px está mal tomada.

Cuatro actos:

1. **Leer** un mito de 600-1.200 palabras de principio a fin
2. **Saltar** desde el texto a la ficha de un personaje y volver
3. **Practicar** tarjetas y jugar
4. **Cerrar** un capítulo con su examen

Los tres primeros ya existen. El cuarto es lo que convierte una colección de fichas en
algo que se recorre, y es la razón de que este brief no sea solo tipografía.

**La unidad de la sesión es el capítulo, no la ficha.** Un capítulo son uno a tres relatos
y quince a veinticinco tarjetas: lo que se lee y se practica de una sentada. Si el diseño
hace que la unidad percibida siga siendo la ficha, el sitio seguirá pareciendo un
diccionario por mucho que se maquete bien.

---

## 2. Restricciones que no se negocian

Vienen de la arquitectura, no del gusto.

- **`src/` nunca menciona una entidad concreta.** No existe "la página de Zeus". Existe
  la ficha de entidad, que a veces recibe a Zeus. Ningún diseño puede depender de datos
  que una entidad concreta tenga y otra no.
- **Sitio estático, sin servidor.** El JavaScript es opcional en la lectura y la
  navegación; es obligatorio en tarjetas, juegos y tabla comparativa. Lo que no lleva JS
  tiene que seguir funcionando sin él.
- **El contenido manda sobre la plantilla.** Los campos de una entidad son libres por
  materia y crecen con el tiempo. El diseño tiene que aguantar campos que aún no existen.
- **Carga instantánea.** Es media parte del argumento del proyecto. Fuentes web: dos como
  mucho, con `font-display: swap` y subconjunto latino. Cero imágenes decorativas.
- **Accesible sin ceremonia.** Foco de teclado visible, contraste AA en texto corrido,
  `prefers-reduced-motion` respetado.
- **Nada de rachas ni cuentas atrás.** Decisión cerrada. El motor es el capítulo cerrado,
  no el día no fallado. Ningún elemento de la interfaz puede castigar la ausencia.

---

## 3. El problema de diseño número uno: `<E />`

Es el enlace en línea que lleva de la prosa a una ficha. Aparece hasta tres veces por
párrafo. Es lo único de este sitio que no existe en otros sitios, y es la decisión que no
se puede deshacer barato, porque la guía de prosa ya está escrita encima de ella:

> El texto tiene que leerse bien en voz alta ignorando los enlaces.

De ahí salen dos exigencias contradictorias que hay que resolver a la vez:

- **Invisible mientras se lee.** Un texto donde cada nombre propio va subrayado en azul
  se escanea, no se lee. Tres marcas por párrafo con peso de enlace convencional rompen
  el ritmo de lectura.
- **Descubrible.** Si nadie ve que Crono es pulsable, el grafo no se navega y el proyecto
  entero no tiene sentido.

**El caso táctil es el difícil.** En el móvil no hay hover: la mini-ficha y la navegación
compiten por el mismo gesto. Hay que decidir qué hace un toque sobre `<E />` en una
pantalla táctil, y la respuesta no puede ser "lo mismo que en escritorio".

Resuelve esto primero, con la Titanomaquia entera delante. No con un párrafo de muestra.

---

## 4. Los estados contra los que se diseña

Cualquier propuesta de ficha de entidad se juzga con todos a la vez. Si uno se rompe, la
propuesta no vale.

| Caso | Qué prueba |
|---|---|
| **Zeus** | Ficha saturada: alias, epítetos, muchas relaciones, prosa, media docena de relatos |
| **Tártaro** (o cualquier stub) | Ficha desnuda: los cuatro campos obligatorios y nada más. Tiene que verse deliberada, no rota |
| **Afrodita** | Variantes contradictorias por fuente. Hija de Urano según la *Teogonía*, de Zeus según la *Ilíada*. Ambas se muestran, ninguna parece un error |
| **Rayo** | Entidad que no es personaje. Sin genealogía, sin retrato, con relaciones de otro tipo |
| **Obra** | Entidad cuyo contenido principal es una imagen. Cuadro o vasija, con autor, fecha y museo como campos, y `representa` hacia mito y personajes |

El estado por defecto de este sitio es el segundo, no el primero. La mayoría de las
entidades son stubs y lo van a seguir siendo.

**La jerarquía de la ficha se invierte.** Hoy son campos apilados con la prosa al final, y
por eso se lee como una entrada de diccionario. Va al revés: imagen y prosa arriba, campos
y relaciones debajo como aparato. Esta decisión hay que tomarla antes de tener cuarenta
fichas escritas, no después.

---

## 5. Qué se diseña, y en este orden

1. **Layout de lectura + `<E />`** — el relato completo. Tipografía de cuerpo, medida de
   línea, ritmo vertical. Es el 80 % del valor.
2. **Ficha de entidad** — todos los estados de §4, con la jerarquía invertida. Móvil primero.
3. **Índice de materia** — cinco eras, sus capítulos, y el estado de cada uno. Es la espina
   dorsal del sitio, no un listado. Un recién llegado tiene que saber por dónde empezar sin
   preguntarle a nadie.
4. **Página de capítulo** — resumen, relatos en orden, tarjetas, examen. La pantalla donde
   empieza y acaba una sesión.
5. **Tarjeta de práctica** — pantalla completa, una cosa a la vez, botones donde llega el
   pulgar sin recolocar la mano.
6. **Concha de juego** — ver §6.
7. **Examen y cierre de capítulo** — ver §6.
8. **Portada** — la última, y la que menos importa.

### Lo que no se diseña todavía

Timeline, árbol genealógico, grafo, mapa y panel de progreso como vistas. No existen los
datos y diseñarlos ahora es inventarse el problema. Ojo a la trampa: la cronología y la
geografía **sí** entran, pero como juegos (§6), que cuestan una fracción y contestan si la
vista merece existir.

---

## 6. La capa de juego

Cuatro juegos previstos, y ninguno es contenido nuevo: todos consumen la misma tarjeta que
ya existe, presentada distinto.

| Juego | Qué se hace | Estado |
|---|---|---|
| **Emparejar** | Rejilla de seis pares, arrastrar o clic-clic | El primero |
| **Ordenar** | Cinco relatos de una era, desordenados, a colocar | Después |
| **Identificar** | Sale una imagen, se elige a quién o qué mito representa | Depende de que haya obras |
| **Situar** | Sale un nombre, se hace clic en el mapa del Mediterráneo | El último |

**Se diseña una concha, no cuatro juegos.** Mismo marco, mismo indicador de avance, mismo
lenguaje de acierto y de fallo, mismo sitio para el botón de salir. Lo que cambia dentro es
el tablero. Si cada juego trae su propia cara, el sitio deja de ser un sitio y pasa a ser
cuatro mini-apps con el mismo logotipo.

**No se abren los cuatro a la vez.** Se diseña la concha con emparejar dentro, se ve si
funciona, y los demás entran encajando en ella.

### El examen

Diez preguntas del capítulo, umbral de ocho. Formatos mezclados dentro de la misma sesión.

- **Al fallar no se vuelve al principio.** Se muestran las falladas, se ofrece practicar
  solo esas, y el reintento está a un clic. Sin penalización, sin vidas, sin cuenta atrás.
  Un examen que te devuelve a la casilla de salida enseña a no examinarse.
- **Al aprobar sí se hace ruido.** Capítulo cerrado, medalla si la hay, siguiente capítulo
  abierto. Es el único momento del sitio donde una celebración está justificada, y por eso
  tiene que verse: si el cierre de capítulo se siente igual que pasar de página, la capa
  entera no sirve para nada.

### Estados y controles

- **Estado de capítulo:** abierto, en curso, cerrado. Tiene que distinguirse **sin recurrir
  solo al color**.
- **Interruptor vía / libre:** global, persistente y visible sin buscarlo. En modo libre se
  practica todo y se juega a todo. No es un modo de castigo: el progreso cuenta igual en
  los dos, y el diseño no debe sugerir lo contrario.
- **Marcar relato como leído:** botón explícito al final del relato. Es el gesto que
  desbloquea tarjetas, así que tiene que verse y tiene que dar acuse de recibo.
- **Medallas:** una página donde se vean. Hablan del dominio, no de la app — "conoces a los
  doce olímpicos", no "has entrado siete días".

### Lo que el bloqueo no es

Toda URL es accesible siempre. Lo único que se cierra es la vía guiada. El diseño no puede
poner candados sobre contenido navegable: nada de fichas borrosas, nada de "desbloquea para
ver". Un capítulo cerrado se señala, no se tapa.

---

## 7. Dirección visual — decisión abierta

Esta es la parte que hay que decidir explorando, no aquí. Pero sí conviene cerrar de
antemano lo que **no** queremos.

**El default a evitar:** fondo crema tipo papel, serif de display de alto contraste,
acento terracota, capiteles y hojas de laurel. Es adonde va cualquier generador de
diseño al oír "mitología griega". No está mal, está *elegido por otro*. Si acabamos ahí,
que sea después de haber visto alternativas y no antes.

Tres direcciones que sí parten de este proyecto en concreto:

- **Manual escolar bueno.** Sans compacta, blanco, un único acento fuerte, jerarquía
  agresiva, cero atmósfera. El argumento: esto es material de estudio, no un museo. Es la
  dirección honesta, y la que mejor aguanta la capa de juego sin volverse infantil.
- **Edición crítica.** Márgenes anchos, notas al margen, tipografía de edición filológica.
  El argumento es el mejor de los tres: el esquema ya modela fuentes y variantes, así que
  el diseño puede hacer visible la estructura que de verdad distingue este sitio de
  Wikipedia — que aquí las contradicciones se muestran en vez de resolverse. Riesgo: es la
  que peor se lleva con los juegos y el examen.
- **Cerámica ática.** Paleta tomada de la figura negra real (negro, ocre, el rojo de la
  arcilla), no de la idea genérica de "antigüedad". Riesgo alto de caer en el default de
  arriba; solo vale si se hace con referencia delante.

Elige una, llévala hasta el final, y guarda las otras dos. No mezcles.

**Prueba de esfuerzo de la dirección elegida:** tiene que sostener a la vez un relato de
mil palabras, una rejilla de emparejar y una pantalla de "capítulo cerrado". Si una
dirección solo funciona para la lectura, no vale para este sitio.

---

## 8. Qué se entrega al repo

El diseño aterriza como:

1. **`src/styles/tokens.css`** — variables CSS: color, escala tipográfica, espaciado,
   radios, sombras, y los estados de capítulo y de tarjeta. Fuente única. Ningún componente
   define un color a mano.
2. **Los componentes de `src/components/` reescritos** contra esos tokens.
3. **Nota de decisiones** — qué se eligió y qué se descartó, para no volver a discutirlo.

Nada de esto toca `content/`. Si un cambio de diseño exige tocar contenido, el diseño está
mal planteado.
