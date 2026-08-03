# Mapa de contenido — mitología griega

Entregable del **carril D** de `plan-imagenes-y-album.md`. No es un índice de la mitología
griega: es **la diana**. Dice qué escribir después, en qué orden y qué arrastra cada cosa.

Estructura: `era → capítulo → relatos → entidades que arrastra`.

**Estados de relato:**

| Estado | Qué significa |
|---|---|
| **escrito** | Existe el `.mdx` y está desplegado |
| **pendiente** | Decidido que entra. Falta escribirlo |
| **no decidido** | Cabe, pero no está claro que valga la pena o dónde va |

**Este documento no manda sobre nada.** Es una diana, no una decisión. Un capítulo puede
reorganizarse editando ocho líneas de `materia.yaml`, y ese era todo el argumento de tenerlos
ahí.

---

## 1. Las cinco reglas que gobiernan el mapa

Salen de restricciones que ya existen, no son nuevas.

1. **Un capítulo necesita al menos un relato.** El desbloqueo es "marcar leído". Un capítulo
   con cero relatos no se puede cerrar nunca. Esto descarta los capítulos puramente
   genealógicos: los hijos de la Noche o la descendencia de Ponto son **páginas editoriales**,
   no capítulos.
2. **Un capítulo son 1-3 relatos y 15-25 tarjetas.** El tamaño de una sentada.
3. **Techo de entidades nuevas por capítulo: unas diez.** Es nuevo aquí y es por el álbum: un
   capítulo que arrastra treinta figuras abre treinta casillas vacías de golpe, y el álbum pasa
   de "me faltan tres" a "no llego nunca". Donde el mito no cabe en diez, se parte en dos
   capítulos.
4. **`entidades_extra` de tres o cuatro ids como mucho.** Si crece, falta un relato.
5. **El corte de era es el reinado, no el tema.** Ya estaba decidido. Su consecuencia
   incómoda está en §2.3: Prometeo, Tifón y los Gigantes son mitos de Titanes y de monstruos
   antiguos que ocurren **bajo el reinado de Zeus**, y por tanto van a la era de los olímpicos.

---

## 2. Era 1 · Cosmogonía

Del vacío al primer regicidio. Es la era más corta del mapa y está bien que lo sea.

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 1 | **Del Caos al primer rey** | `nacimiento-del-cosmos` | pendiente | ~8 |
| | | `castracion-de-urano` | **escrito** | — |

**`nacimiento-del-cosmos`** arrastra: `caos`, `nix`, `erebo`, `eter`, `hemera`, `ponto`,
`eros`, `ourea`. Ya existen `gea`, `urano`, `tartaro`.

**`castracion-de-urano`** ya arrastró: `crono`, `rea`, `hoz-de-adamante`, `erinias`,
`gigantes`, `melias`, `afrodita`, los doce Titanes, `ciclopes`, `hecatonquiros`.

### Lo que se queda fuera a propósito

| Contenido | Por qué no es capítulo | Dónde va |
|---|---|---|
| Los hijos de la Noche (Hipnos, Tánatos, las Moiras, Némesis, Éride) | Es una genealogía, no una narración | Página editorial. Éride entra de verdad en la era 5 |
| La descendencia de Ponto (Nereo, Forcis, Ceto, las Gorgonas, las Grayas) | Igual, y además su pago está en Perseo | Se declaran cuando las arrastre `perseo-y-medusa` |
| Océano y Tetis, los tres mil ríos | Inflaría el álbum sin enseñar nada | Fuera |

**Un solo capítulo cierra una era entera.** Es honesto: la cosmogonía griega es corta. Y tiene
una ventaja de producto que no es menor — el primer acto del mapa se cierra con **un relato de
trabajo**, así que quien entra ve un acto completado en la primera sesión.

---

## 3. Era 2 · Edad de los Titanes

El reinado de Crono. Dos capítulos, y con ellos la era se cierra.

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 2 | **El rey que devora** | `crono-devora-a-sus-hijos` | pendiente | ~6 |
| 3 | **La guerra por el cosmos** | `liberacion-de-los-ciclopes` | no decidido | ~2 |
| | | `titanomaquia` | **escrito** | — |

**`crono-devora-a-sus-hijos`** arrastra: `piedra-de-delfos` (el ónfalos), `amaltea`,
`curetes`, `creta`, `monte-ida`, `metis`. Ya existen `crono`, `rea`, `hestia`, `demeter`,
`hera`, `hades`, `poseidon`, `zeus`.

Es el relato con **mejor relación entre entidades nuevas y peso narrativo de todo el mapa**:
seis ids y a cambio quedan colocados los seis hijos de Crono, que son la mitad del Olimpo.

**`liberacion-de-los-ciclopes`** está marcado *no decidido* porque cabe entero dentro de la
Titanomaquia y probablemente ya está ahí. Se decide releyendo el relato escrito, no aquí. Lo
que sí falta pase lo que pase es la arista `ciclopes → forja → rayo`, ya anotada como deuda.

---

## 4. Era 3 · Edad de los olímpicos

La era más grande del mapa y la que menos cronología tiene. **No se ordena por tiempo, se
ordena por dios**, porque los mitos divinos no tienen secuencia y fingir que la tienen produce
un orden falso que además hay que defender en el juego de ordenar.

### 4.1 Consolidación del poder

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 4 | **El reparto y el último desafío** | `el-reparto-del-cosmos` | pendiente | ~3 |
| | | `tifon` | pendiente | ~6 |

`el-reparto-del-cosmos`: los tres lotes, el Olimpo y la tierra como territorio común. Arrastra
`olimpo`, `mar`, y poco más — casi todo existe. Es corto y es el que hace legible el resto.

`tifon`: arrastra `tifon`, `equidna`, `etna`, `delfine`, `nervios-de-zeus`, `sicilia`. Es el
mito que explica de dónde salen la Quimera, Cerbero, la Hidra y la Esfinge — **paga cuatro
veces en la era de los héroes**.

> **La Gigantomaquia no está aquí, y es una decisión.** Los Gigantes solo mueren si golpea un
> mortal, y ese mortal es Heracles. Ponerla en esta era obliga a que Heracles aparezca antes de
> existir. Va al bloque de Heracles (§5.3), aceptando que temáticamente pertenece aquí.

### 4.2 Los dioses, por bloques

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 5 | **Atenea y la ciudad** | `nacimiento-de-atenea` | **escrito** | — |
| | | `disputa-por-el-atica` | pendiente | ~5 |
| | | `aracne` | no decidido | ~2 |
| 6 | **Apolo y Ártemis** | `nacimiento-en-delos` | pendiente | ~5 |
| | | `apolo-y-piton` | pendiente | ~4 |
| 7 | **Deméter y las estaciones** | `rapto-de-persefone` | **escrito** | — |
| | | `demeter-en-eleusis` | no decidido | ~4 |
| 8 | **El ladrón recién nacido** | `nacimiento-de-hermes` | pendiente | ~6 |
| 9 | **Hefesto, el dios que cojea** | `caida-de-hefesto` | pendiente | ~4 |
| | | `la-red-de-hefesto` | pendiente | ~2 |
| 10 | **Dioniso, el que llega de fuera** | `nacimiento-de-dioniso` | pendiente | ~6 |
| | | `dioniso-y-los-piratas` | no decidido | ~3 |

Detalle de lo que arrastra cada uno:

- **`disputa-por-el-atica`** — `cecrope`, `atenas`, `acropolis`, `olivo`, `fuente-salada`.
  Convierte a Atenea de "la que nació de una cabeza" en una diosa con dominio.
- **`aracne`** — `aracne`, `lidia`. Fuente ovidiana, no hesiódica. Marcado *no decidido*
  porque quizá rinde más en un capítulo de metamorfosis (§4.4).
- **`nacimiento-en-delos`** — `leto`, `delos`, `apolo`, `artemis`, `palmera`. Ártemis nace
  primero y asiste al parto de su hermano: es el detalle que hace que el mito se recuerde.
- **`apolo-y-piton`** — `piton`, `delfos`, `pitia`, `tripode`. **Delfos es infraestructura**:
  a partir de aquí, todos los héroes consultan un oráculo que ya existe.
- **`demeter-en-eleusis`** — `eleusis`, `demofonte`, `celeo`, `metanira`. Cabe dentro del rapto;
  se decide releyendo lo escrito.
- **`nacimiento-de-hermes`** — `hermes`, `maya`, `lira`, `tortuga`, `caduceo`, `cilene`.
- **`caida-de-hefesto`** — `lemnos`, `trono-de-oro`, `fragua`, `tetis`.
- **`la-red-de-hefesto`** — `red-de-hefesto`, `helios`. Reutiliza Ares y Afrodita, que ya están.
- **`nacimiento-de-dioniso`** — `semele`, `dioniso`, `nisa`, `menades`, `tirso`, `satiros`.

### 4.3 Mortales bajo Zeus

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 11 | **El fuego y la mujer** | `prometeo-y-el-fuego` | pendiente | ~5 |
| | | `pandora` | pendiente | ~4 |
| 12 | **El diluvio** | `deucalion-y-pirra` | pendiente | ~4 |
| 13 | **Zeus y los linajes** | `rapto-de-europa` | pendiente | ~5 |
| | | `io` | no decidido | ~5 |

- **`prometeo-y-el-fuego`** — `prometeo`, `mecone`, `ferula`, `caucaso`, `aguila-de-prometeo`.
- **`pandora`** — `pandora`, `epimeteo`, `pitos`, `esperanza`. Ocho ids entre los dos y a
  cambio, dos de los mitos más citados de la cultura occidental.
- **`deucalion-y-pirra`** — `deucalion`, `pirra`, `parnaso`, `arca`. *No decidido* si va con
  Prometeo o como capítulo propio; depende de si se escribe también la edad de oro.
- **`rapto-de-europa`** — `europa`, `minos`, `radamantis`, `sarpedon`, `tiro`. **Este es el
  puente a Creta**: sin él, Minos aparece en el laberinto sin venir de ningún sitio. Es la
  deuda más visible del contenido actual.
- **`io`** — `io`, `argos-panoptes`, `pavo-real`, `tabano`, `epafo`.

### 4.4 Capítulos opcionales de esta era

| Capítulo | Relatos | Por qué está en duda |
|---|---|---|
| **Castigos ejemplares** | `tantalo`, `sisifo`, `ixion`, `las-danaides` | Cuatro mitos cortos sin relación entre sí salvo el castigo. Funciona como capítulo temático y da cuerpo al Tártaro, pero rompe la regla de 1-3 relatos |
| **Cuerpos que cambian** | `aracne`, `narciso-y-eco`, `dafne`, `niobe`, `midas` | Igual: es una antología ovidiana. Su ventaja es que son mitos brevísimos con muchísima obra pictórica detrás — **es el capítulo que más rinde para el juego de identificar** |

Los dos se dejan **no decididos** y se resuelven de la misma manera: probar si un capítulo de
cuatro o cinco micro-relatos se sostiene, o si la regla de tres relatos es dura.

---

## 5. Era 4 · Edad de los héroes

La era donde el coste se dispara. **Cada héroe arrastra entre quince y treinta entidades
nuevas.** Regla que sale de aquí y que conviene respetar: **no abrir dos héroes a la vez.**

### 5.1 Perseo

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 14 | **La cabeza de la Gorgona** | `perseo-y-medusa` | pendiente | ~12 |
| 15 | **El monstruo del mar** | `perseo-y-andromeda` | pendiente | ~6 |

`perseo-y-medusa` arrastra: `perseo`, `danae`, `acrisio`, `serifos`, `polidectes`, `grayas`,
`gorgonas`, `medusa`, `pegaso`, `sandalias-aladas`, `zurron`, `harpe`. Reutiliza
`casco-de-hades`, **que ya existe en el proyecto**.

Doce es más del techo de diez, y aquí se acepta: es el mito con más objetos identificables por
sí solos de todo el corpus. Es exactamente el material del juego de reconocer por símbolos.

`perseo-y-andromeda`: `andromeda`, `cefeo`, `casiopea`, `ceto`, `etiopia`, `crisaor`.

### 5.2 Belerofonte

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 16 | **El jinete que quiso subir** | `belerofonte-y-la-quimera` | no decidido | ~7 |

`belerofonte`, `quimera`, `preto`, `estenebea`, `yobates`, `brida-de-oro`, `licia`. Reutiliza
Pegaso, que ya vendría de Perseo. Está *no decidido* porque es un héroe de segunda fila y el
mismo esfuerzo puesto en Heracles rinde más. Su argumento a favor: es la mejor historia de
hibris del corpus y es corta.

### 5.3 Heracles

El bloque más grande del mapa. Cuatro capítulos, y no cabe en menos.

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 17 | **El niño y la locura** | `nacimiento-de-heracles`, `la-locura-de-heracles` | pendiente | ~9 |
| 18 | **Los trabajos del Peloponeso** | `los-primeros-trabajos` | pendiente | ~10 |
| 19 | **Los trabajos del fin del mundo** | `los-ultimos-trabajos` | pendiente | ~12 |
| 20 | **La túnica y la pira** | `gigantomaquia`, `muerte-de-heracles` | pendiente | ~10 |

- **17** — `heracles`, `alcmena`, `anfitrion`, `megara`, `tebas`, `euristeo`, `lino`,
  `serpientes-de-la-cuna`, `tirinto`.
- **18** — `leon-de-nemea`, `piel-de-leon`, `garrote`, `hidra-de-lerna`, `yolao`,
  `cierva-de-cerinia`, `jabali-de-erimanto`, `establos-de-augias`, `aves-del-estinfalo`,
  `centauros`.
- **19** — `toro-de-creta` (**ya existe**), `yeguas-de-diomedes`, `hipolita`, `cinturon`,
  `amazonas`, `gerion`, `hesperides`, `manzanas-de-oro`, `ladon`, `cerbero`, `atlas`,
  `gibraltar`.
- **20** — `deyanira`, `neso`, `tunica-de-neso`, `monte-eta`, `hebe`, `yole`, más los Gigantes
  con nombre: `alcioneo`, `porfirion`, `flegra`.

**Los doce trabajos son un problema de diseño, no de escritura.** Doce episodios en dos
relatos es demasiado por relato; en doce relatos rompe el tamaño de capítulo. La agrupación
propuesta —seis y seis, por geografía— es la menos mala, y se valida escribiendo el primero.

### 5.4 Teseo y Creta

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 21 | **El camino a Atenas** | `teseo-camino-a-atenas` | pendiente | ~10 |
| 22 | **El laberinto** | `teseo-y-el-minotauro` | **escrito** | — |
| 23 | **El artesano** | `pasifae-y-el-toro`, `dedalo-e-icaro` | pendiente | ~7 |
| 24 | **Después de Creta** | `fedra-e-hipolito`, `teseo-y-piritoo` | no decidido | ~8 |

- **21** — `etra`, `trecen`, `espada-de-egeo`, `sinis`, `esciron`, `cercion`, `procustes`,
  `periferetes`, `medea`, `maraton`. Es el capítulo que arregla el problema actual: hoy Teseo
  llega al laberinto sin biografía.
- **23** — `dedalo`, `icaro`, `pasifae`, `vaca-de-madera`, `alas-de-cera`, `cocalo`, `perdix`.
  Reutiliza `laberinto-de-creta` y `minotauro`, ya existentes.

### 5.5 Los argonautas

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 25 | **El vellocino** | `jason-y-el-vellocino` | pendiente | ~14 |
| 26 | **Medea** | `medea-en-corinto` | pendiente | ~5 |

`jason`, `pelias`, `argo`, `argonautas`, `yolco`, `quiron`, `hilas`, `fineo`, `harpias`,
`simplegades`, `colquide`, `eetes`, `vellocino-de-oro`, `dragon-de-la-colquide`,
`dientes-de-dragon`, `talos`. Después: `corinto`, `glauce`, `creonte`, `carro-del-sol`.

### 5.6 Tebas

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 27 | **La fundación** | `cadmo-funda-tebas` | pendiente | ~7 |
| 28 | **Edipo** | `edipo-y-la-esfinge` | pendiente | ~8 |
| 29 | **Los siete** | `los-siete-contra-tebas`, `antigona` | no decidido | ~9 |

`cadmo`, `dragon-de-ares`, `espartos`, `harmonia`, `collar-de-harmonia`, `agave`, `penteo`.
Luego `layo`, `edipo`, `yocasta`, `esfinge`, `tiresias`, `citeron`, `polibo`, `merope`.
Después `eteocles`, `polinices`, `antigona`, `ismene`, `creonte-de-tebas`, `adrasto`,
`anfiarao`, `capaneo`, `epigonos`.

Cadmo enlaza hacia atrás con `rapto-de-europa` (es su hermano) y hacia adelante con Dioniso
(es su nieto). **Es el nudo mejor conectado de toda la era** y por eso merece capítulo propio.

### 5.7 Sueltos

| Capítulo | Relatos | Estado | Nota |
|---|---|---|---|
| **La caza de Calidón** | `el-jabali-de-calidon` | no decidido | Trae a `atalanta`, `meleagro`, `altea`, `tizon`. Es el único sitio donde entra una heroína con agencia propia |
| **Orfeo** | `orfeo-y-euridice` | pendiente | `orfeo`, `euridice`. **Cierra el inframundo**: con el rapto de Perséfone ya escrito, dos relatos bastan para que el Hades sea un sitio y no un campo |

---

## 6. Era 5 · Guerra de Troya

**Hoy está vacía y es la era más cara del mapa.** Bien contada son 60-80 entidades nuevas.

| # | Capítulo | Relatos | Estado | Entidades nuevas |
|---|---|---|---|---|
| 30 | **La manzana** | `bodas-de-peleo-y-tetis`, `juicio-de-paris` | pendiente | ~8 |
| 31 | **La flota** | `el-rapto-de-helena`, `el-sacrificio-de-ifigenia` | pendiente | ~10 |
| 32 | **La cólera de Aquiles** | `la-colera-de-aquiles` | pendiente | ~9 |
| 33 | **Patroclo y Héctor** | `la-muerte-de-patroclo`, `el-rescate-de-priamo` | pendiente | ~8 |
| 34 | **La caída** | `la-muerte-de-aquiles`, `el-caballo-de-troya` | pendiente | ~10 |
| 35 | **Los regresos** | `el-regreso-de-agamenon` | pendiente | ~7 |

- **30** — `eris`, `manzana-de-la-discordia`, `paris`, `peleo`, `tetis`, `troya`, `ida-troyano`,
  `helena`. Reutiliza Hera, Atenea y Afrodita, **que ya existen las tres**.
- **31** — `menelao`, `agamenon`, `clitemnestra`, `tindaro`, `ifigenia`, `aulide`, `calcante`,
  `odiseo`, `aquiles`, `esciros`.
- **32** — `briseida`, `crises`, `criseida`, `nestor`, `ayax`, `diomedes`, `hector`, `andromaca`,
  `mirmidones`.
- **33** — `patroclo`, `priamo`, `hecuba`, `armadura-de-aquiles`, `escamandro`, `sarpedon-licio`,
  `glauco`, `automedonte`.
- **34** — `talon-de-aquiles`, `filoctetes`, `neoptolemo`, `paladio`, `caballo-de-troya`,
  `sinon`, `laocoonte`, `casandra`, `astianacte`, `eneas`.
- **35** — `egisto`, `orestes`, `electra`, `micenas`, `pilades`, `furias-de-orestes`.

### La Odisea, y una decisión estructural

La Odisea no cabe en la era de la guerra sin forzarla, y son otros 25-30 ids: `polifemo`,
`circe`, `sirenas`, `escila`, `caribdis`, `calipso`, `nausicaa`, `feacios`, `eolo`,
`lestrigones`, `lotofagos`, `penelope`, `telemaco`, `eumeo`, `argos-el-perro`, `pretendientes`,
`itaca`, `el-arco`, `tiresias-en-el-hades`.

Dos salidas, y hay que elegir una antes de escribir la primera línea:

1. **Tres capítulos finales dentro de `guerra-de-troya`.** Cero cambios de esquema. El coste es
   que la era acaba pesando el doble que ninguna otra.
2. **Una sexta era, `los-regresos`.** Es correcta —los *nostoi* son un ciclo aparte en la
   tradición— pero toca las cinco eras declaradas, que son el único eje del sitio que se ha
   tratado como fijo.

**Recomendación: la opción 1**, y se parte en una sexta era solo si al escribirla se nota que
no cabe. Añadir una era cuesta una línea en `materia.yaml`; deshacerla cuando ya hay contenido
declarado con `era: los-regresos`, no.

---

## 7. Recuento

| Era | Capítulos | Relatos escritos | Pendientes | No decididos |
|---|---|---|---|---|
| Cosmogonía | 1 | 1 | 1 | 0 |
| Edad de los Titanes | 2 | 1 | 1 | 1 |
| Edad de los olímpicos | 10 (+2 opcionales) | 2 | 14 | 8 |
| Edad de los héroes | 16 (+2 opcionales) | 1 | 18 | 6 |
| Guerra de Troya | 6 (+3 de la Odisea) | 0 | 11 | 0 |
| **Total** | **~38** | **5** | **~45** | **~15** |

Unas **500-600 entidades** si se escribe todo, frente a las ~50 de hoy. El mapa completo es
un proyecto de años; **la mitad del mapa es un sitio que ya merece la pena**.

---

## 8. Orden de implementación

Tandas, no calendario. Cada tanda son uno o dos relatos y termina declarando su capítulo en
`materia.yaml`. Ese es el bucle entero.

Tres criterios, en este orden:

1. **Coste marginal de entidades.** Un relato que reutiliza lo que existe es cinco veces más
   barato que uno que abre un linaje.
2. **Cierre de era.** Un acto completo en el mapa vale más que tres capítulos sueltos.
3. **Rendimiento iconográfico.** Mitos cuyas figuras se reconocen por sus objetos: alimentan
   el carril B y el juego de identificar, que hoy no tiene material.

### Las tandas

| Tanda | Qué se escribe | Qué se consigue | Coste |
|---|---|---|---|
| **1** | `nacimiento-del-cosmos`, `crono-devora-a-sus-hijos` | **Dos eras cerradas.** El mapa deja de empezar en mitad de una historia | ~14 ids |
| **2** | `rapto-de-europa` | Minos deja de aparecer de la nada en el laberinto. Arregla la deuda más visible del contenido de hoy | ~5 ids |
| **3** | `prometeo-y-el-fuego`, `pandora` | Los dos mitos más citados del corpus, y el capítulo más barato de toda la era olímpica | ~9 ids |
| **4** | `nacimiento-en-delos`, `apolo-y-piton` | **Delfos existe.** A partir de aquí ningún héroe consulta un oráculo que no está declarado | ~9 ids |
| **5** | `perseo-y-medusa`, `perseo-y-andromeda` | El primer héroe, y el capítulo con más objetos identificables del mapa. Es el que da material real al carril B | ~18 ids |
| **6** | `teseo-camino-a-atenas`, `dedalo-e-icaro` | Se profundiza en un frente ya abierto en vez de abrir otro. Teseo pasa a tener biografía | ~17 ids |
| **7** | `el-reparto-del-cosmos`, `tifon` | Cierra la transición entre eras y deja sembrados Quimera, Hidra, Cerbero y Esfinge | ~9 ids |

**Punto de evaluación después de la tanda 5.** Con siete capítulos declarados y tres eras con
cuerpo, ya se puede juzgar si el álbum motiva, si los capítulos tienen el tamaño correcto y si
el techo de diez entidades es realista. **No escribir las tandas 6 y 7 antes de mirar eso.**

### Después de la evaluación

Se elige un frente y se agota antes de abrir otro:

- **Heracles** (4 capítulos, ~40 ids) — el más caro y el más reconocible
- **Tebas** (2-3 capítulos, ~20 ids) — el mejor conectado, enlaza con Europa y con Dioniso
- **El resto de los olímpicos** (Hermes, Hefesto, Dioniso, Atenea) — barato, y completa el
  Olimpo, que es la medalla de cobertura más obvia del proyecto

### Sobre la era vacía

**La guerra de Troya se deja vacía a propósito**, y es una decisión de coste: es la era más
cara y la única cuya recompensa depende de que el resto ya funcione.

Si la era vacía en el mapa molesta, el atajo barato es **`juicio-de-paris`**: unos ocho ids
nuevos, porque las tres diosas que compiten ya existen. Un solo relato enciende la quinta era.
Es la mejor relación coste/efecto de todo el documento y por eso está anotada aquí, aunque el
orden recomendado la deje para después.

---

## 9. Lo que este mapa le dice a los otros carriles

| Carril | Qué saca de aquí |
|---|---|
| **B — imágenes** | La tanda 5 (Perseo) es la que da objetos reconocibles. Antes de eso, las obras que se curen serán todas de dioses en trono |
| **E — prosa de entidad** | `minotauro`, `laberinto-de-creta` e `inframundo` siguen siendo el caso difícil, y el mapa lo confirma: el inframundo no se llena hasta `orfeo-y-euridice` |
| **A4 — álbum** | El techo de diez entidades por capítulo es un requisito del álbum, no del contenido. Si un capítulo abre treinta casillas, el álbum desmotiva |
| **A7 — árbol** | Las tandas 1 y 2 son las que más densifican la genealogía. El árbol se ve mejor después de ellas |

---

## 10. Decisiones abiertas

Cinco, y ninguna bloquea empezar:

1. **La Odisea:** capítulos finales de la era 5, o sexta era. Se decide al llegar (§6).
2. **Los capítulos-antología** (castigos, metamorfosis): ¿la regla de 1-3 relatos es dura?
3. **Los doce trabajos:** seis y seis, o alguna otra agrupación.
4. **El techo de diez entidades:** Perseo ya lo rompe. Se valida o se sube.
5. **Belerofonte, Calidón y "después de Creta":** los tres son *no decidido* por el mismo
   motivo —rinden menos que la alternativa— y los tres se resuelven cuando haya volumen.
