# Árbol genealógico completo — especificación de diseño

## Contexto

La vista actual (force-directed, `d3-force` o similar) muestra las 65+ entidades del
grafo con relaciones `padre_de`/`madre_de` en rojo y verde, sin capas ni contención.
El resultado es una madeja: líneas diagonales cruzándose, hubs (Gea, Urano, Zeus) con
demasiadas conexiones saliendo en todas direcciones, y sin jerarquía visual entre el
tronco principal del mito y las ramas secundarias.

**Decisión: se muestra el árbol completo, no un recorte por profundidad.** El problema
a resolver es de layout y densidad visual, no de alcance de datos.

**Alcance de relaciones:** solo `padre_de` / `madre_de` (y sus inversas). No se incluyen
relaciones de acción (`devora_a`, `mata_a`, `encierra_a`, etc.) en esta vista.

---

## 1. Layout

Cambiar el algoritmo de layout de fuerzas (`d3-force`) a un layout de capas tipo
**Sugiyama** (`dagre` o `elk.js`). La diferencia con `d3-hierarchy` (tidy tree): no
asume que cada nodo tiene un único padre, así que admite directamente la estructura
real del grafo (dos padres por hijo) sin forzar preprocesado a árbol estricto.

- Filas fijas por generación (capas), no posición libre calculada por física.
- El propio algoritmo minimiza cruces de líneas como objetivo — es su función
  principal, no un efecto secundario.
- Layout calculado en build time si el grafo no cambia en runtime; servido como
  SVG (o posiciones) estático. Sin recalcular en cada carga de página.

**Conectores:** ortogonales (ángulo recto), no diagonales. Más fáciles de seguir
visualmente cuando hay muchos cruces potenciales.

---

## 2. Nodos de unión

Cuando dos entidades tienen hijos en común (ej. Gea + Urano, Zeus + Hera), no se
dibujan dos líneas independientes (una roja desde el padre, una verde desde la
madre) convergiendo en cada hijo. En su lugar:

- Se genera un **nodo de unión sintético** entre los dos progenitores (un punto
  pequeño, no una entidad real del grafo).
- De ese nodo de unión sale **una sola línea** hacia cada hijo común.
- Si se quiere conservar la distinción padre/madre, se resuelve como un detalle
  visual en el propio nodo de unión (ej. medio punto rojo / medio verde), nunca
  como dos trazos de línea compitiendo por el mismo nodo hijo.

Esto es lo que elimina el cruce rojo/verde en las convergencias, que es el ruido
visual más molesto de la vista actual.

---

## 3. Nodos duplicados (multi-unión)

Entidades con varias uniones relevantes dentro del árbol (Zeus, Gea, Urano) no se
dibujan una sola vez con múltiples líneas saliendo en todas direcciones. Se dibujan:

- **Una copia por unión relevante**, cada una marcada visualmente como duplicado
  (borde punteado o relleno rayado — mismo lenguaje visual en toda la vista).
- Las copias se conectan entre sí con una línea fina discontinua, para dejar claro
  que son la misma entidad.

Esto reparte la densidad del hub en vez de concentrarla en un único nodo con
demasiadas conexiones.

---

## 4. Peso visual — tronco vs. ramas

El árbol necesita un centro de gravedad legible antes de que el ojo se pierda en
las ramas secundarias.

- **Tronco principal** (Caos → primordiales → Titanes → Olímpicos): nodos más
  grandes, líneas más gruesas.
- **Ramas laterales** (ninfas menores, monstruos secundarios, estirpes como
  Oceánides o Ríos): nodos más pequeños, líneas más finas.
- **Colapso por defecto en ramas densas:** cuando un nodo tiene muchos hijos poco
  relevantes para el tronco (ej. los doce hijos de Urano, o toda la descendencia de
  Océano/Tetis), se muestra colapsado como `▸ 12 hijos`, expandible al clic. No se
  oculta información — se oculta densidad hasta que se pide.

---

## 5. Interacción y filtros

- **Foco al pasar el ratón / clic:** resaltar ancestros + descendientes directos
  del nodo seleccionado; atenuar (opacidad baja, no ocultar) el resto del árbol.
  Mantiene la vista de conjunto pero hace legible una rama concreta bajo demanda.
- **Filtro por generación/era:** permitir atenuar o retirar temporalmente ciertas
  franjas (ej. ocultar Caos-Titanes para mirar solo Olímpicos-Héroes).
- **Minimapa + pan/zoom:** necesario en cuanto el árbol completo no quepa cómodo
  en una pantalla — para no perder la orientación de conjunto al hacer zoom en
  una rama.

No se incluyen filtros por tipo de relación distinto de genealogía (ver Alcance,
arriba) — esta vista es solo `padre_de`/`madre_de`.

---

## 6. Notas técnicas para implementación

- Fuente de datos: relaciones `padre_de`/`madre_de` (y sus inversas) tal como se
  derivan hoy en `grafo.ts`. No requiere nuevos campos en YAML salvo lo que ya
  esté pendiente en la deuda de grafo (§10 del mapa de contenido).
- El nodo de unión y los duplicados son construcciones de la capa de
  visualización, no entidades del grafo — no tocan el modelo de datos ni el
  namespace compartido de ids.
- Sugerencia de librería: `dagre` o `elk.js` para el layout de capas; evaluar cuál
  da mejor resultado con la densidad real del grafo (65-900 entidades según
  crezca el contenido) antes de comprometerse.
- El colapso de ramas densas (§4) necesita persistir su estado si se quiere que
  sobreviva a un re-render, aunque no necesariamente entre sesiones.
