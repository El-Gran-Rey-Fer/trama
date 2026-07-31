# Estado del proyecto — cierre del lote 1 de contenido

Instantánea del proyecto tras el PoC y el primer lote de contenido. Compañero de
`esqueleto-proyecto.md` (arquitectura), `calendario-construccion.md` (orden de trabajo),
`capa-de-progresion.md` (estructura de sesión), `guia-de-prosa.md` (contenido) y
`DESIGN.md` (interfaz).

**Este documento manda sobre los otros donde se contradigan.** Los cuatro primeros se
escribieron antes de que existiera contenido real; la sección 3 lista exactamente en qué han
quedado desfasados.

---

## 1. Dónde está el proyecto

Los tres hitos del PoC están hechos y desplegados. El primer lote de contenido —cuatro relatos
nuevos y las entidades que arrastraron— también.

| | Estado |
|---|---|
| Hitos 1-3 (PoC) | Cerrados |
| Lote 1 de contenido | Desplegado en `main` |
| Bloques A-U de Parte II y III | Ninguno empezado |

Contenido en producción: **5 relatos**, ~**50 entidades**, **107 tarjetas**, 58 páginas.

Los cinco relatos son `castracion-de-urano`, `titanomaquia`, `nacimiento-de-atenea`,
`rapto-de-persefone` y `teseo-y-el-minotauro`.

**Ninguna entidad tiene prosa todavía.** Es lo primero que hay que hacer y está en §6.

---

## 2. El diagnóstico que originó este lote

Al recorrer el PoC, la sensación era la de un diccionario: cada ficha era una frase de
`resumen` y una lista de flechas, y las tarjetas preguntaban solo quién era hijo de quién.

El diagnóstico, que sigue vigente y explica casi todo lo que se decidió después:

> El PoC se construyó sobre la parte de la mitología griega que es más fácil de convertir en
> datos —la genealogía— y **lo que es fácil de modelar se convirtió en lo que el producto dice
> que es la materia.** La genealogía es andamio, no contenido.

De ahí salieron tres frentes. El primero y el segundo están hechos; el tercero está a medias:

1. **La entidad no tenía dónde decir qué es.** Resuelto: prosa de entidad (§3.1).
2. **El grafo solo tenía relaciones de parentesco.** Resuelto: ocho tipos de acción (§4.4).
   De las 28 tarjetas que añadió el último turno, 28 son de acción.
3. **El sitio no tiene forma.** `era` ya existe en los datos, pero **nada en la interfaz la
   consume todavía**. Es deuda abierta (§5).

---

## 3. Qué ha quedado desfasado en los otros documentos

Léelos con estas correcciones delante.

### `esqueleto-proyecto.md`

| Dónde | Qué dice | Qué vale ahora |
|---|---|---|
| §3.3, ejemplo de relato | `orden: 47` global | `era` + `orden` local a la era. Ver §4.2 |
| §3.3 y §6, ejemplos | `fuente: hesiodo`, `fuente_principal: ovidio` | El id de fuente es la **obra**: `teogonia`, `metamorfosis`. Ver §4.1 |
| §3.1, ejemplo de Zeus | Entidad = YAML puro | La entidad admite un `.mdx` hermano opcional. Ver §3.1 de este doc |
| §3.2, registro de fuentes | `{ nombre, siglo }` | `{ autor, obra, siglo }`, con `autor` opcional |

### `calendario-construccion.md`

- El hueco `Timeline` del hito 1 **ya no es un hueco**: `era` y `orden` están implementados y
  poblados. El bloque J sigue pendiente, pero solo la vista.
- El hueco `Rutas de aprendizaje` fue absorbido por los capítulos de `capa-de-progresion.md`.
- Los bloques A y K han acumulado deuda concreta durante este lote. Ver §5.

### `guia-de-prosa.md`

**Está al día.** Se reescribió durante este lote: incorpora `era`, `orden` local, la sección §5
de prosa de entidad y el checklist correspondiente. Es el documento que hay que adjuntar tal
cual a cualquier encargo de texto.

### `capa-de-progresion.md` y `DESIGN.md`

Sin contradicciones. Nota útil: los capítulos del bloque O declaran `era`, y ese prerrequisito
**ya está satisfecho**.

---

## 4. Decisiones cerradas en este lote

No volver a discutirlas sin motivo nuevo.

### 4.1 Una fuente es una obra, no un autor

El id del registro `fuentes` es la obra. Con la clave en el autor no se pueden citar la
*Teogonía* y los *Trabajos* por separado, y `himno-homerico-demeter` no tiene autor al que
indexar.

Renombrados aplicados: `hesiodo`→`teogonia`, `homero`→`iliada`, `apolodoro`→`biblioteca`.
Nuevas: `metamorfosis`, `vida-de-teseo`, `olimpicas`, `himno-homerico-atenea`,
`himno-homerico-demeter`.

El valor es `{ autor, obra, siglo }` con **`autor` opcional**: en obras anónimas se omite, no se
pone "anónimo". `Fuente.astro` cae a `obra` cuando falta el autor.

### 4.2 `era` obligatoria, `orden` local a la era

Cinco eras declaradas en `materia.yaml` **como lista**, no como mapa: el orden es la posición y
así no puede quedar inconsistente.

```
cosmogonia · edad-de-los-titanes · edad-de-los-olimpicos · edad-de-los-heroes · guerra-de-troya
```

El criterio de corte es el reinado, no el tema: la castración de Urano cierra la cosmogonía, la
Titanomaquia cierra la edad de los Titanes.

`orden` es múltiplo de 100 **dentro de la era**, empezando alrededor de 500. El motivo por el
que se adelantó desde la Parte III: cuatro conversaciones independientes produjeron 200, 1000,
1200 y 5200, porque nadie puede situar un mito en una escala global que no ve. No se estabiliza,
empeora con cada relato.

Las **entidades no llevan `era`** todavía, y a propósito: no tienen `orden`, así que no hay
valores malos acumulándose. Se añadirá cuando el timeline lo pida.

### 4.3 Taxonomía: tipos, etiquetas y ejes

**Los tipos no llevan género ni adjetivo.** `primordial`, `dios`, `titan`, `heroe`, `mortal`,
`monstruo`. El motivo es funcional: los distractores de opción múltiple salen de entidades del
mismo `tipo`, así que `titanide` partiría el conjunto de los Titanes en dos por una razón
gramatical. El género es un problema de presentación y se resolverá con un campo aparte.

**`primordial`, `titan` y `dios` son estratos generacionales** y mutuamente excluyentes.
`olimpico` es un subconjunto curado dentro de `dios`, y por eso es **etiqueta**, no tipo. Nunca
`diosa olimpica`: eso mezcla dos ejes.

**Una etiqueta no repite lo que ya dice un campo.** Fuera `heroes` y `monstruos` (los dice
`tipo`), `inframundo` (lo dice `lugar`) y `cosmogonia` (lo dice `era`).

**Pero sí se declaran ejes con pocos miembros.** El registro incluye `ciclo-cretense`,
`ciclo-tebano`, `ciclo-argivo` y `ciclo-troyano` con tres de ellos vacíos. Los ciclos míticos
son un eje geográfico y dinástico ortogonal a las eras, con miembros futuros conocidos. Declarar
la convención ahora evita que la próxima conversación invente `mitos-cretenses`.

> Matiz importante: la regla de la guía —"una etiqueta que solo tiene un miembro no es una
> etiqueta"— sirve para etiquetas **inventadas al escribir**, no para ejes que ya se sabe que
> existen. Quitar una etiqueta correcta pierde conocimiento editorial que nadie va a reponer
> después.

Registro final, 11: `sucesion-divina`, `profecia`, `rapto`, `mito-etiologico`, `castigo-divino`,
`zeus-amores`, `guerra`, y los cuatro `ciclo-*`.

### 4.4 Relaciones de acción

Ocho tipos nuevos, que son lo que hace que el grafo deje de ser un árbol genealógico:

`devora_a` · `encierra_a` · `rapta_a` · `castiga_a` · `mata_a` · `mutila_a` · `forja` ·
`construye`

**Los ids de relación van en presente.** El mito no tiene tiempo verbal y las fichas son presente
expositivo. `mata_a`, no `mato_a`.

`forja` y `construye` son dos tipos y no uno genérico: "¿quién forja el rayo?" y "¿quién
construye el laberinto?" son mejores tarjetas que "¿quién crea X?".

**Tipos rechazados, con su motivo, para que no vuelvan:**

| Tipo | Por qué no |
|---|---|
| `nace_de` | Es `hijo_de` con pasos extra. Con los dos en el grafo, "¿quién es hijo de Urano?" tiene dos respuestas según qué relación se consulte. El **modo** de nacer es prosa; el **hecho** de la filiación es un campo |
| `envia_a` | Verbo demasiado genérico. "¿A quién envía Zeus?" es una tarjeta pobre |
| `muere_en` | Etiológico y de un solo uso. Va en la prosa de entidad |
| `profetiza_a` | Lo interesante de una profecía es **qué** dice, no a quién. Es tarjeta manual |

### 4.5 Prosa de entidad

Una entidad admite un `.mdx` hermano del `.yaml`, con el mismo nombre y **sin frontmatter**. El
id sale del nombre del fichero, así que no puede desincronizarse.

La regla que la gobierna, y que además la hace inmune al crecimiento del YAML:

> Si una frase podría ser un campo, es un campo. Si podría ser un relato, es un relato.
> La prosa de entidad es lo que queda.

Un texto que enumera datos caduca en cuanto alguien edita el YAML. Un texto que explica cómo
funciona una figura no caduca nunca. **Omitir es gratis; afirmar es lo que se rompe.** El test al
escribir cada frase: *¿seguiría siendo verdad y no redundante si el YAML se duplicara?*

Formato completo en `guia-de-prosa.md` §5.

---

## 5. Deuda anotada

Nada de esto está roto hoy. Está apuntado para no redescubrirlo.

**Bloque K (quiz) — la dirección `padre_de` no escala.** La tarjeta `urano:padre_de` ya responde
cuatro nombres y con Zeus responderá cuarenta. La dirección "¿quién es el padre de X?" tiene
respuesta única y funciona; la inversa no. Probablemente haya que generar tarjeta solo en la
dirección de respuesta única y convertir la otra en pregunta de pertenencia ("¿es Melias hija de
Urano?").

**Bloque A (validación) — dos casos nuevos.** La convención de ids (minúsculas, sin tildes, con
guiones) tiene que ser un fallo de build: durante este lote aparecieron cuatro tipos con tilde y
espacio que nadie detectó hasta que se buscaron a mano. Y las **etiquetas contra su registro**:
hoy una etiqueta mal escrita no falla, hace que `<Coleccion />` devuelva una lista vacía. Un
fallo silencioso es peor que un build roto.

**`era` no la consume nadie.** Está en los datos y en el schema, pero ninguna vista la usa. El
índice de materia agrupado por eras es barato y es lo que le daría columna vertebral al sitio.

**Género de los tipos.** Pendiente de resolver como presentación: `genero: f` en la entidad más
etiqueta femenina en `materia.yaml`. No tocar los datos.

**Afrodita.** Su filiación —hija de Urano según la *Teogonía*, de Zeus según la *Ilíada*— sigue
sin modelar a propósito. Es el caso de prueba del **bloque B** y hay que hacerlo con el mecanismo
de `fuente`/`principal` ya montado, no antes.

**`zeus.yaml` está casi vacío.** Una sola relación propia (`devora_a: metis`), sin epítetos ni
atributos. Hay que rellenarlo **antes** de escribir su prosa, o se escribirá prosa para compensar
una ficha desnuda, que es justo lo que la guía intenta evitar.

**Arista que falta:** `ciclopes → forja → rayo`. Se aplicó `gea → forja → hoz-de-adamante` y esta
se quedó fuera. Apareció al releer el ejemplo de prosa del rayo — la guía funcionando como dice
que funciona: la prosa descubre lo que falta.

---

## 6. Lo siguiente, en orden

**1. Prosa de entidad para siete.** Es lo único pendiente antes de poder juzgar el sitio. En tres
tandas:

- **Urano, Crono, Zeus** — los tres estratos, juntos para ver si la voz aguanta en serie. Cuidado
  con el solape: los tres querrán contar la sucesión y solo debe hacerlo Crono. Urano la
  inaugura, Zeus la cierra. (Rellenar `zeus.yaml` antes.)
- **Minotauro, laberinto de Creta, inframundo** — el caso difícil: entidades de las que el grafo
  no dice casi nada y la ficha se queda desnuda.
- **Hades** — el peor entendido de los olímpicos.

Se dejan **sin prosa a propósito** Egeo, la hoz de adamante, las Melias, Andrógeo, el toro de
Creta y Naxos. Son destino de enlace y nada más, y un párrafo de relleno es peor que ninguno.
Que estén desnudas forma parte del experimento.

Al encargar cada tanda: adjuntar `guia-de-prosa.md` y **el YAML completo de esas entidades**. El
fallo más probable de la prosa de entidad es reescribir el `resumen` en tres párrafos, y no se
puede evitar sin ver los campos.

**2. Recorrer el sitio en el móvil.** El camino que mezcla las tres cosas nuevas:
Zeus → Crono → la Titanomaquia → Teseo → el Minotauro.

**3. Decidir según lo que se sienta ahí.** Tres caminos y son excluyentes:

| Si el problema es… | Lo siguiente es… |
|---|---|
| No hay por dónde entrar | Índice de materia por eras (barato, y es la deuda de §5) |
| La baraja no engancha | Las familias de tarjetas que faltan: atributo, epíteto, alias, manuales |
| La información está pero se lee mal | El frontend: bloque U y `DESIGN.md` |

---

## 7. Cómo trabajar con Claude Code en este proyecto

Lecciones de cuatro turnos, todas pagadas con algún susto.

**Partir cada turno en dos: propone y para / aplica.** Lo mecánico se completa; lo que requiere
criterio se propone y espera aprobación. Funcionó especialmente bien con los ids nuevos y con las
aristas de acción, donde un id mal elegido ya no se cambia gratis.

**La fuente de verdad son los ficheros, no las tablas de entrega.** Las tablas de "ids nuevos" que
acompañan a un relato son notas de quien escribió, y están incompletas: durante este lote se
escaparon una entidad entera (`atenea`), una fuente (`ovidio`) y sobró una que nadie referenciaba
(`citera`). Extraer los ids del texto con grep encontró las tres.

**`git status --short` al empezar y al terminar cada bloque.** Tres veces seguidas hubo cambios
sin commitear de origen aparentemente desconocido — todas eran ediciones a mano. Commitea las
tuyas en el momento.

**Rama para los lotes de contenido.** El build queda rojo mientras existan relatos que referencian
entidades que aún no están. La Action de Pages solo corre en `main`, así que en rama no se
despliega nada roto.

**Las listas de "NO TOQUES" van por campo, no por fichero.** Un `no toques afrodita.yaml` pensado
para proteger su filiación bloqueó también arreglar su `tipo`, que no tenía nada que ver.

**Los relatos se pegan a mano; el resto lo hace Claude Code.** No por desconfianza: es que miles
de palabras dentro de un prompt es donde se cuelan las erratas. Leerlas del disco una vez están en
el repo es gratis.
