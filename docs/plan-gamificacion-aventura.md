# Plan de trabajo — Gamificación del modo aventura

Documento de trabajo. Compañero de `plan-modo-aventura.md`, `capa-de-progresion.md`,
`plan-imagenes-y-album.md`, `esqueleto-proyecto.md`, `DESIGN.md` y `estado-del-proyecto.md`.

**Este documento manda sobre los anteriores donde se contradigan, y aquí se contradicen varias
cosas a propósito.** Los planes previos se escribieron durante el piloto, con cinco relatos y
sin recorrido real. Nada de aquello estaba escrito en piedra. La sección 12 lista exactamente
qué se reescribe y por qué.

---

## 1. El diagnóstico

Sandbox funciona y mejora solo: cada relato nuevo lo hace más completo como enciclopedia.
Aventura tiene la estructura —capítulos, examen, desbloqueo, juegos— pero **no se siente como
un juego, se siente como un índice con etiquetas de estado**.

Tres causas, y ninguna es de contenido:

1. **El bloqueo no bloquea.** Un capítulo por delante enseña su nombre y su resumen y se puede
   entrar. Un candado que no cierra nada no es progresión, es decoración.
2. **Sandbox y aventura son la misma pantalla con distinto texto.** La portada actual dice
   "Cerrado" en modo sandbox, donde nada se cierra. El modo no se nota.
3. **No hay recompensa por dominar nada concreto.** Cerrar un capítulo es la única señal de
   avance, y llega cada varias sesiones.

Y una cuarta que no es de aventura pero condiciona todo lo que se escriba ahora: **esto tiene
que sobrevivir a la segunda materia.** `trama/historiadeespana/` va a existir, y ninguna de las
mecánicas de este documento puede quedar cableada a Grecia. Ver §10.

---

## 2. La regla de acceso

Es la decisión de fondo del documento. Sustituye a la regla de desbloqueo anterior.

> **La unidad de acceso es el capítulo. La unidad de estudio es el relato.**
>
> En aventura es visitable todo lo que esté en el conjunto de un capítulo desbloqueado
> —participantes de sus relatos ∪ `entidades_extra`—. Marcar un relato como leído no abre
> navegación: abre **tarjetas, casilla de álbum y examen**.

Por qué el capítulo y no el relato: si el acceso colgara de "marcado como leído", saltar a la
ficha de Gea a mitad de un relato sería imposible, y ese es justo el gesto que hace útil un
sitio de mitología. Separar navegación de estudio lo resuelve sin abrir el mapa entero.

**Las relaciones desde una ficha no desbloquean nunca.** Llegas a Zeus porque leíste su
capítulo, no porque Crono lo enlace. Sin esta cláusula el muro se evapora en dos saltos.

### 2.1 Consecuencias, con su tratamiento

| Situación | Qué se hace |
|---|---|
| Relación de una ficha a entidad no desbloqueada | **Silueta del álbum**, sin nombre, no clicable. Ni enlace muerto ni nombre filtrado; el hueco es gancho |
| `<E />` en prosa a entidad no desbloqueada | **Texto plano atenuado, con el nombre visible.** En prosa el nombre hace falta para que la frase se entienda |
| Buscador en aventura | Busca **solo lo desbloqueado**. Si no, el muro se salta escribiendo |
| Álbum en aventura | Ya funciona así por diseño. Sin cambios |

**El coste, aceptado:** en aventura no se puede consultar de un vistazo quién es hijo de Zeus.
Eso es exactamente el reparto entre los dos modos.

**El spoiler intra-capítulo, aceptado y con contención:** dentro del capítulo abierto se puede
visitar a Atenea antes de leer su nacimiento. Es correcto —dentro de un capítulo los relatos ya
están abiertos en cualquier orden— y es **un argumento más para capítulos pequeños**. Con 2-3
relatos y ~8 entidades la ventana es de una sesión; con capítulos de diez relatos se abre media
era de golpe.

---

## 3. Vocabulario de estados

Hay una colisión que arreglar antes de tocar ninguna pantalla: en los documentos "cerrado"
significa *examen aprobado*; en la portada actual significa *no accesible todavía*. Son
opuestos. **Se elimina "cerrado" del vocabulario del producto.**

| Situación real | Aventura | Sandbox |
|---|---|---|
| Capítulo declarado sin relatos escritos | Próximamente | Próximamente |
| Contenido escrito, no alcanzado | Bloqueado | **Disponible** |
| Contenido escrito, es el activo | En curso | **Disponible** |
| Examen aprobado | **Superado** | **Disponible** |

En código el estado sigue siendo un enum; lo que se unifica es la palabra que ve la persona.

**Consecuencia de "Próximamente":** un capítulo puede declarar `relatos: []`. La validación que
exigía relatos existentes se ablanda para permitirlo. Y esos capítulos **no cuentan en la
cadena de desbloqueo**: si 3.2 está vacío, superar 3.1 abre 3.5.

---

## 4. El muro de aventura

### 4.1 En aventura no se entra a lo bloqueado

Cambio duro respecto a `plan-modo-aventura.md` §3.2 y `capa-de-progresion.md` §4.1. Aquellas
decían "se señala, no se tapa". Ahora se tapa.

**Lo que las salva:** el contenido sigue siendo accesible siempre, a través del interruptor de
modo. El escape existe, es un clic y es global. Lo que se pierde es el acceso *sin decidir el
modo*, y eso es precisamente lo que hace que aventura se sienta como una vía.

**Lo que esto convierte en crítico:** el interruptor de modo pasa de comodidad a pieza
estructural. Tiene que estar **en el propio aviso de bloqueo**, no solo en la barra.

### 4.2 El aviso

Dos acciones, y el orden importa:

1. **Primero y principal:** el paso accionable de progreso.
2. **Segundo y más discreto:** "Verlo en sandbox".

Si el sandbox va delante, estás enseñando a saltarse la vía. Ese es el riesgo real del muro
duro: si sandbox es el escape de cada fricción, aventura se abandona en la tercera pared y no
vuelve. Volver a aventura tiene que ser tan fácil como salir.

### 4.3 El mensaje apunta al paso accionable, no al eslabón anterior

La cadena literal se rompe sola: si estoy en 2.1 con relatos sin leer y clico 6.3, "aprueba el
examen de 6.2" es inútil porque 6.2 también está bloqueado.

**Regla:** el aviso calcula el **único paso que ahora mismo es accionable** y enlaza a él.

| Situación del usuario | Texto |
|---|---|
| Capítulo activo con relatos sin leer | "Sigues en *2.1 El rey que devora*. Te faltan 2 relatos por leer." + enlace al primero que falta |
| Capítulo activo con todo leído, examen pendiente | "Aprueba el examen de *2.1 El rey que devora* para seguir." + enlace al examen |
| Clic en un capítulo lejano | El mismo mensaje del estado actual. **Nunca menciona el capítulo intermedio bloqueado** |

### 4.4 El examen exige el capítulo entero leído

Botón **visible y deshabilitado**, nunca oculto, hasta que todos los `relatos` del capítulo
estén en `leidos`. El texto deshabilitado lista los que faltan, cada uno enlazado.

### 4.5 Llegada por URL directa

Con el modo en aventura y una URL de capítulo bloqueado —compartida, buscada, adivinada—: se
muestra el muro con las mismas dos acciones de §4.2. No hay 404 y no hay muro ciego.

---

## 5. Sandbox diferencial

La portada actual renderiza en sandbox el vocabulario de aventura. Sandbox no tiene progresión,
así que no puede tener estados de progresión.

**Donde aventura muestra estado, sandbox muestra peso de contenido:**

```
2.2  La guerra por el cosmos
     3 relatos · 18 entidades · 24 tarjetas
```

Es información real, es lo que un lector de enciclopedia quiere antes de entrar, y hace la
pantalla obviamente distinta sin duplicar componentes.

| | Aventura | Sandbox |
|---|---|---|
| Estado del capítulo | Bloqueado / En curso / Superado / Próximamente | Disponible / Próximamente |
| Bajo el título | Estado y progreso de lectura | Recuento de contenido |
| Acción del capítulo | Leer → examinarse | **Practicar este capítulo** |
| Examen | Sí | **No existe** |
| Módulo de continuación | Sí (§6) | No |

---

## 6. Módulo de continuación

En aventura, arriba del todo, antes de las eras:

```
CONTINÚA
2.1 · El rey que devora — te faltan 2 relatos          [Seguir →]
```

Es lo que convierte la portada en "el juego" en vez de en "el índice", y es de lo más barato
del documento: todo el estado que necesita ya se calcula para §4.3.

---

## 7. Automarcado de lectura

`plan-modo-aventura.md` §3.4 decía "nada de detección por scroll: falla, y falla en silencio".
La objeción era buena y el mecanismo era el problema, no la idea.

**Qué entra:**

- Elemento centinela al final de la prosa con `IntersectionObserver` — no cálculo de scroll,
  que es lo que realmente falla.
- **Guard:** el centinela solo cuenta si entra en vista **después de un scroll real**. Sin
  esto, un relato corto en pantalla grande se marca solo al abrirlo.
- **Acuse visible con deshacer.** No es silencioso. Se marca, se dice, y se puede revertir.
- **El botón manual sigue existiendo.** Si el observer no dispara, el estado es el de hoy: la
  degradación es segura.

### 7.1 Leídos y no leídos, visibles

En la página del capítulo, cada relato lleva su estado, y **no puede distinguirse solo por
color**. Tres estados, no dos:

| Estado | Significa |
|---|---|
| Sin leer | — |
| Leído | Sus tarjetas están disponibles |
| Practicado | Ya se ha acertado alguna de sus tarjetas |

El tercero existe porque "leído" solo dice que pasaste por ahí, y el examen necesita más que
eso. Es también el insumo de §8.

---

## 8. Medallas de personaje

**Se derivan, no se declaran.** Una entrada en `materia.yaml` por personaje sería la lista más
larga del fichero y pediría mantenimiento con cada relación nueva. Las medallas de cobertura
(doce olímpicos) siguen declaradas porque son recorte editorial; esta es mecánica y sale del
grafo.

**Regla:** toda entidad cuyo `tipo` esté en `tipos_coleccionables` y tenga al menos 3 tarjetas
propias genera automáticamente la medalla "Conoces a [nombre]".

**`tipos_coleccionables` se declara en `materia.yaml`.** En Grecia serán `primordial`, `titan`,
`dios`, `heroe`, `monstruo`; en historia de España serán otros. Cablearlos en `src/` sería
romper la regla invariante — ver §10.

**Tarjeta propia** = tarjeta cuyo origen es esa entidad: sus relaciones donde es origen
declarado, sus atributos, sus epítetos, sus alias. **No cuentan** las tarjetas donde solo
aparece como respuesta de la pregunta de otra entidad. Si contaran, "conoces a Zeus" se ganaría
respondiendo sobre sus hijos.

**Umbral 0.8, sobre "acertada alguna vez", no sobre "en estado sabida ahora mismo".** Con Zeus
acumulando treinta tarjetas propias, exigir el 100% simultáneo es la definición de imposible. Y
"alguna vez" evita depender de la repetición espaciada real, que sigue sin existir: basta un
conjunto persistido de ids acertados. Una vez ganada se queda ganada — es una fotografía, no un
estado vivo.

**Dónde se ve:** `plan-imagenes-y-album.md` §3.4 dejó el tercer estado de la casilla
("dominado") sin criterio, pendiente de Design. **Ya está decidido: dominado es exactamente
esta medalla.** No hay pantalla nueva.

**Riesgo:** un umbral de 0.8 sin explicar se siente arbitrario. La ficha de la medalla dice
"80% de sus preguntas propias", no solo el nombre bonito.

---

## 9. Reto del día

**Lo que no es:** una racha. Nada de días consecutivos, nada que penalice la ausencia.

**Lo que es:** cinco preguntas generadas de forma determinista a partir de la fecha
(`YYYY-MM-DD` hasheada), sacadas de tarjetas que el progreso ya desbloqueó —nunca adelanta
contenido no leído—. Mismo shell de juego que el examen, formatos mezclados, **sin umbral**: no
bloquea ni desbloquea nada. Es práctica con forma de evento.

Sin backend: el pool se calcula en cliente a partir de `leidos`, así que ya sale distinto por
persona sin servidor ni cuentas. Si `leidos` está vacío, cae al primer capítulo disponible en
vez de fallar.

**Se persiste un contador acumulado y nada más:**

```json
"retos": { "completados": 12, "ultimaFecha": "2026-08-05" }
```

`ultimaFecha` sirve para decir "hoy ya lo hiciste" y ofrecer repetirlo, no para impedirlo. **No
se persiste racha ni lista de fechas.** El contador es seguro porque un hueco no le resta.

**Medallas asociadas, en total acumulado y nunca consecutivo:** "10 retos", "50 retos". Jamás
"7 días seguidos".

**No alimenta el nivel cosmético**, que sale solo de cobertura. Decisión heredada sin cambios.

**Riesgo:** si se coloca en el sitio más visible de la portada parece la vía principal. Módulo
secundario, por debajo del de continuación.

---

## 10. Multi-materia

Todo lo anterior se está escribiendo para `trama/gr/`, pero `trama/historiadeespana/` va a
existir. Esto no es aspiración: son cuatro sitios concretos donde la mecánica se cablea a
Grecia si nadie lo impide.

| Qué | Dónde se declara |
|---|---|
| `tipos_coleccionables` para las medallas de personaje | `materia.yaml` |
| Etiqueta visible del eje temporal ("Eras" / "Periodos" / "Siglos") | `materia.yaml` |
| Nombres de niveles cosméticos | `materia.yaml` (ya estaba) |
| Umbrales de medalla de recorrido | `materia.yaml` |

**El estado en `localStorage` se namespacea por materia.** Hoy es una sola clave; el día que
entre la segunda materia los progresos se pisan. Migración incluida, y se hace **antes** de
añadirle campos nuevos al estado, no después.

**El interruptor de modo también es por materia.** Se puede querer aventura en mitología y
sandbox en historia.

**Test verificable, no una intención:**

```
grep -riE "grieg|mito|titan|zeus|olimp|hesiod" src/    →  cero resultados
```

Es la regla invariante que ya existe (`src/` nunca referencia entidades concretas), extendida a
esta capa y comprobable en CI.

---

## 11. Maquetación

Diagnóstico de la portada actual: en ~2500px de ancho se usan ~1000, la lista es plana, y con
94 capítulos previstos eso es una tira de scroll donde la era activa se pierde.

**El layout lo propone Design**, con las tres opciones de §11.2 sobre la mesa. Lo que este
documento fija son los requisitos que cualquiera de las tres tiene que cumplir.

### 11.1 Requisitos, para Design y para Claude Code

- **Escala a 94 capítulos y 5 eras** sin scroll infinito. Es la prueba que suspende la portada
  de hoy.
- **La era es navegación, no encabezado decorativo.** Debe poder plegarse/desplegarse o
  seleccionarse, con progreso visible por era (`3/8`).
- **En móvil, eras colapsables.** La lista larga solo es aceptable dentro de una era.
- **Los estados de §3 se distinguen sin recurrir solo al color.** Regla ya vigente.
- **El módulo de continuación (§6) va primero**, por encima de las eras, solo en aventura.
- **El reto del día va por debajo del de continuación.** Nunca lo primero.
- **Sandbox y aventura comparten componentes, no vocabulario.** Un solo componente de capítulo
  con dos modos de render, no dos pantallas.

### 11.2 Las tres opciones, con su lectura

| Opción | A favor | En contra |
|---|---|---|
| **Maestro-detalle** (columna de eras a la izquierda, cuadrícula de capítulos a la derecha) | Usa el ancho de verdad, escala a 94 sin scroll, la era se convierte en navegación | Dos niveles de selección; en móvil colapsa a acordeón, así que son dos layouts |
| **Acordeón por eras** en desktop y móvil | Barato, escala, un solo layout | Sigue desaprovechando el ancho en desktop |
| **Camino serpenteante** tipo senda | Es lo que más "juego" parece | Escala fatal: 94 nodos son un scroll larguísimo y en móvil caben dos por pantalla |

---

## 12. Qué queda desfasado

| Documento | Qué decía | Qué vale ahora |
|---|---|---|
| `plan-modo-aventura.md` §3.2 | "El bloqueo es de la vía, nunca del contenido. Se señala, no se tapa" | En aventura **sí se tapa**. El escape es el interruptor de modo, presente en el propio aviso. §4.1 |
| `capa-de-progresion.md` §4.1 | Igual | Igual |
| `plan-modo-aventura.md` §3.4 | La unidad de desbloqueo es el relato leído | La unidad **de acceso** es el capítulo; el relato leído desbloquea estudio, no navegación. §2 |
| `plan-modo-aventura.md` §3.4 | "Nada de detección por scroll" | Entra, con `IntersectionObserver`, guard y deshacer. §7 |
| `plan-modo-aventura.md` paso 2 | Un relato puede no estar en ningún capítulo | **Imposible por estructura.** Un relato huérfano es prosa que nadie leerá en el modo principal: es **fallo de build** |
| `plan-modo-aventura.md` paso 2 | Validación: relatos existentes | Se ablanda: `relatos: []` es válido y produce "Próximamente". §3 |
| Portada actual | "Cerrado" en sandbox | "Cerrado" desaparece del vocabulario. §3 |
| `plan-imagenes-y-album.md` §3.4 | Estado "dominado": "lo que decida Design" | Decidido: es la medalla de personaje. §8 |
| `DESIGN.md` | Prioridades de diseño anteriores | La portada de materia sube: es la pantalla que decide si aventura se siente como un juego. §11 |

Sigue vigente: la regla invariante y el modelo de datos de `esqueleto-proyecto.md`,
`guia-de-prosa.md` entero, y la decisión de **no hacer rachas**.

---

## 13. Bloques

Formato de los planes anteriores. Las letras siguen desde `U`.

### Bloque V — Base: vocabulario, sandbox diferencial y multi-materia

Va primero porque toca el estado persistido, y es más barato migrar antes de añadirle campos.

**Entra:** namespaceado de `localStorage` por materia con migración · modo por materia ·
vocabulario de estados de §3 · `relatos: []` válido y capítulos vacíos saltados en la cadena ·
render diferencial de sandbox (§5) · `tipos_coleccionables` y etiqueta del eje en
`materia.yaml` · fallo de build para relatos huérfanos · el `grep` de §10 en CI.

**No entra:** muro, medallas, reto, maquetación.

**Verificación:** el `grep` da cero. Se cambia de modo y la portada cambia de vocabulario, no
solo de color. Un capítulo con `relatos: []` compila y sale como "Próximamente".

### Bloque W — El muro y la cadena de mensajes

**Entra:** regla de acceso de §2 · silueta no clicable en relaciones · `<E />` atenuado en
prosa · buscador filtrado · muro con las dos acciones en el orden de §4.2 · cálculo del paso
accionable (§4.3) · examen deshabilitado sin lectura completa (§4.4) · muro por URL directa
(§4.5) · módulo de continuación (§6).

**Prerrequisito:** bloque V.

**Verificación:** con progreso a medias, clicar un capítulo lejano da el mensaje del capítulo
*activo*, no del intermedio. La ficha de Crono muestra a Zeus como silueta si su capítulo no
está abierto. Un clic en el interruptor lo abre todo y otro clic vuelve.

### Bloque X — Automarcado y estado de lectura

**Entra:** centinela con `IntersectionObserver` · guard de scroll real · acuse con deshacer ·
botón manual conservado · tres estados de relato en la página del capítulo (§7.1).

**Verificación:** un relato que cabe en una pantalla **no** se marca solo al abrirlo. Con el
JavaScript desactivado, el botón manual sigue funcionando.

### Bloque Y — Medallas de personaje

**Entra:** cálculo de tarjetas propias por entidad · `tarjetasAcertadas` en el estado ·
generación automática desde `tipos_coleccionables` · el tercer estado de la casilla del álbum
pasa a consumir esta medalla.

**No entra:** **ninguna entrada nueva en `materia.yaml` por personaje.** Si un turno propone
declarar medallas de personaje a mano, el bloque se ha entendido mal.

**Verificación:** con un personaje de pocas tarjetas, acertar el 80% de las suyas propias
cambia su casilla del álbum sin recargar a mano.

### Bloque Z — Reto del día

**Entra:** selección determinista por fecha · shell del examen reutilizado · contador
`retos.completados` · medallas de 10 y 50 · colocación secundaria en la portada.

**No entra:** nada de servidor, nada consecutivo, nada que toque el nivel cosmético.

**Verificación:** dos días seguidos dan retos distintos. Borrar `localStorage` y volver un
tercer día no rompe nada; el contador simplemente no subió.

### Encargo paralelo a Design

Los requisitos de §11.1 y las tres opciones de §11.2. Puede arrancar en cuanto V y W estén
mergeados a `main` — Design lee `main`, así que **mergear antes de pedir la pasada**.

---

## 14. Orden

```
V (base) ──> W (muro) ──> X (automarcado) ──> Y (medallas) ──> Z (reto)
                 └──────> Design (portada), tras mergear W
```

V y W son el 80% de la sensación buscada y casi todo es lectura de estado que ya existe. X, Y y
Z son independientes entre sí y pueden caer en sesiones sueltas.

---

## Apéndice — plantilla de encargo para Claude Code

> Adjunto `plan-gamificacion-aventura.md` con el resto de documentos del proyecto. Vamos con el
> **bloque [V/W/X/Y/Z]**.
>
> Ese documento manda sobre los demás donde se contradigan, y su §12 dice exactamente qué
> reescribe: no me apliques la regla vieja porque la encuentres escrita en otro sitio.
>
> Antes de tocar nada: `git status --short`, y confírmame **contra el disco**, no contra los
> documentos, si los prerrequisitos del bloque están cerrados de verdad.
>
> Primero **propón y para**: qué ficheros vas a tocar, qué ids, campos y textos exactos hacen
> falta, y cualquier sitio donde el plan resulte incómodo o incompleto contra el código real.
> No apliques nada hasta que te lo apruebe.
>
> Cuando lo apruebe, aplica solo ese bloque, termina con la verificación de su ficha y con
> `git status --short`.

Un bloque, un turno, un commit.
