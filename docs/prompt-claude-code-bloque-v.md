# Prompt para Claude Code — Bloque V

Pegar en una conversación nueva de Claude Code, adjuntando `plan-gamificacion-aventura.md`
junto con `estado-del-proyecto.md`, `plan-modo-aventura.md`, `capa-de-progresion.md` y
`plan-imagenes-y-album.md`.

Para los bloques siguientes, cambiar la letra y el listado de "qué entra". Todo lo demás del
prompt vale igual.

---

Adjunto `plan-gamificacion-aventura.md` junto con el resto de documentos del proyecto. Vamos
con el **bloque V — Base: vocabulario, sandbox diferencial y multi-materia**.

**Antes de nada, sobre los documentos.** `plan-gamificacion-aventura.md` manda sobre los demás
donde se contradigan, y su §12 lista exactamente qué reescribe. Varias reglas de los planes
anteriores están deliberadamente derogadas: no me apliques la versión vieja porque la
encuentres escrita en otro sitio, y si ves una contradicción que §12 **no** recoge, párate y
dímelo en vez de elegir tú.

**Primer paso, antes de tocar nada:**

1. `git status --short`.
2. Confírmame **contra el disco, no contra los documentos**, cómo está hoy: dónde vive el
   estado en `localStorage` y con qué clave y versión, cómo se renderiza la portada de materia,
   dónde se decide el texto de estado de un capítulo, dónde vive el interruptor de modo, y qué
   valida hoy el esquema de `capitulos`.

Los documentos describen el proyecto con retraso. Si algo del bloque ya está hecho, o está
hecho de otra forma, quiero saberlo antes de que escribas una línea.

**Segundo paso — propón y para.** Dime qué ficheros vas a tocar, qué campos y nombres nuevos
hacen falta, los textos exactos que van a aparecer en pantalla, y cualquier sitio donde el plan
resulte incómodo o incompleto contra el código real. **No apliques nada hasta que te lo
apruebe.** Los nombres de campo y los ids no se cambian gratis una vez puestos.

**Qué entra en este bloque:**

- **Namespaceado del estado en `localStorage` por materia**, con migración desde la clave
  actual. Va primero dentro del bloque: es más barato migrar antes de añadirle campos nuevos al
  estado, y los bloques W-Z van a añadirlos.
- **El interruptor de modo pasa a ser por materia**, no global.
- **Vocabulario de estados de §3.** "Cerrado" desaparece del producto: colisiona consigo mismo
  (en los documentos significa *aprobado*, en la portada actual significa *no accesible*). Los
  estados en código siguen siendo un enum; lo que se unifica es la palabra visible.
- **`relatos: []` pasa a ser válido** y produce "Próximamente". La validación que exigía
  relatos existentes se ablanda para permitirlo. Y esos capítulos **no cuentan en la cadena de
  desbloqueo**: si 3.2 está vacío, superar 3.1 abre 3.5.
- **Render diferencial de sandbox (§5).** Donde aventura muestra estado, sandbox muestra
  recuento de contenido (`3 relatos · 18 entidades · 24 tarjetas`), la acción del capítulo pasa
  a "Practicar este capítulo", y el examen no existe. **Un solo componente de capítulo con dos
  modos de render, no dos pantallas.**
- **`tipos_coleccionables` y la etiqueta visible del eje temporal en `materia.yaml`.** No se
  consumen todavía —son del bloque Y y de la interfaz— pero se declaran aquí porque son el
  contrato multi-materia.
- **Fallo de build si un relato no está en ningún capítulo.** Antes era una válvula de escape
  permitida; ahora un relato huérfano es prosa que nadie leerá en el modo principal.
- **El `grep` de §10 como comprobación en CI:**
  `grep -riE "grieg|mito|titan|zeus|olimp|hesiod" src/` debe dar cero.

**Qué NO entra:** el muro (bloque W), el automarcado (X), las medallas de personaje (Y), el
reto del día (Z), y toda la maquetación, que va por la vía de Design.

**Verificación con la que tienes que terminar:**

- El `grep` da cero.
- Cambiar de modo cambia el vocabulario de la portada, no solo el color.
- Un capítulo con `relatos: []` compila y sale como "Próximamente", y la cadena de desbloqueo
  lo salta.
- Un estado guardado con la clave antigua sigue ahí después de la migración: exportar, limpiar,
  importar, comprobar.

Y `git status --short` al terminar.

**Cómo trabajamos**, por si no está en tu memoria de sesión: un bloque, un turno, un commit. Lo
mecánico lo completas; lo que requiere criterio lo propones y esperas. Si un paso necesita un
componente o un campo que no está declarado, se anota y se propone — no se inventa en silencio.
