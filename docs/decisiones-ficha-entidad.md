# Decisiones — ficha de entidad (a partir del handoff de Claude Design)

Aterrizaje del handoff `design_handoff_lectura_ficha` del proyecto "Trama" en
claude.ai/design. Cubre solo la ficha de entidad (`FichaEntidad.astro`), no la pantalla
de lectura ni la mini-ficha (`<E />` sigue sin estilo propio — eso es el resto de
DESIGN.md §5.1 y el bloque D del calendario, fuera de este encargo).

## Elegido

- **Dirección visual: "Manual escolar".** Decisión del usuario, tomada explícitamente
  antes de tocar código (`DESIGN.md` §7 exige elegir una y no mezclar). La "edición
  crítica" se descarta como alternativa; si se quiere retomar, está documentada en el
  handoff, no como tokens muertos en el repo.
- **`src/styles/tokens.css`**, variables de color/radio/peso/fuente de esa dirección
  única. Parcial a propósito: solo lo que necesita la ficha hoy (falta escala
  tipográfica completa, espaciado, sombras y estados de capítulo/tarjeta — eso lo trae
  el resto de DESIGN.md §5 cuando se diseñe).
- **Jerarquía invertida** tal como la fija el prototipo (alta fidelidad según su propio
  README): imagen → tipo → nombre → epítetos → prosa/resumen → campos → relaciones →
  "aparece en". Nota: el propio texto del handoff describe el orden como
  imagen+prosa-antes-que-campos, pero el prototipo interactivo (la pieza de alta
  fidelidad real) pone tipo+nombre inmediatamente después de la imagen; se siguió el
  prototipo.
- **Estado stub deliberado**: nota en cursiva solo cuando la entidad no tiene imagen,
  prosa, atributos, relaciones ni relatos — nunca un hueco en blanco.
- **`entidad.atributos` como tarjeta genérica** (label/valor), reutilizando el mismo
  estilo que el handoff reserva para "obra" (autor/fecha/museo). No se hardcodeó nada
  específico de `tipo: obra`: cualquier entidad con atributos usa la misma tarjeta.

## Descartado / diferido

- **"Fuentes en desacuerdo" (caso Afrodita).** El handoff pide una tarjeta lado a lado
  por fuente cuando dos relaciones se contradicen. Eso depende de agrupar `relaciones`
  por `fuente`, que es exactamente el bloque B (`calendario-construccion.md`), sin
  empezar — y `estado-del-proyecto.md` §5 dice explícitamente que Afrodita se modela
  "con el mecanismo de fuente/principal ya montado, no antes". Hoy Afrodita se ve como
  una ficha normal con su resumen. Cuando entre el bloque B esto se retoma.
- **Ancho más alto de imagen para tipo "obra" (260px vs 220px).** El handoff varía la
  altura según `entidad.tipo === 'obra'`. Se dejó una altura única (220px) para no
  acoplar el componente a un valor concreto de `tipo`, que es vocabulario de contenido,
  no del esquema. Si hace falta la variante se puede añadir como campo de datos
  (`imagen_grande: true`) en vez de mirar `tipo`.
- **Chips de "ver otra ficha" (selector de casos de prueba) y selector de dirección
  visual.** El propio README los marca como "solo en este prototipo, quitar en
  producción".
- **Peso de título 800.** El prototipo pide 800 pero la fuente cargada (IBM Plex Sans
  vía Google Fonts) no tiene ese corte — el máximo real es 700. Se usa 700; el
  navegador habría hecho el mismo *fallback* igualmente.
- **Botón "‹ Relato".** Sin la pantalla de lectura integrada, no hay "relato" al que
  volver de forma fiable — se dejó como enlace a la materia (comportamiento previo del
  componente), mismo estilo visual del handoff (acento, negrita, sin borde).
- **Chips de `entidad.etiquetas`** (p. ej. `olimpico`) que sí mostraba la versión
  anterior del componente. El handoff no las contempla en la ficha — son más un eje de
  filtrado editorial (bloque E, `<Coleccion />`) que contenido para el lector — así que
  se dejaron de renderizar aquí.

## Sin verificar

- **Estado "Obra de ejemplo"** (imagen grande + campos autor/fecha/museo +
  `representa`). El repo todavía no tiene ninguna entidad de tipo obra con imagen real,
  así que el layout de imagen no se ha visto renderizado contra datos reales — solo
  inspeccionado en el prototipo. El código lo soporta (`entidad.imagen` es una URL
  cualquiera), pero falta el caso de prueba real para confirmarlo.
