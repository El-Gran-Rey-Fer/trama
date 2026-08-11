# Mapa de contenido — mitología griega

El temario completo. **Sustituye a las versiones anteriores.**

- **§2-§6, el mapa.** El orden en que se lee. Es la estructura del sitio.
- **§9, los tramos.** El orden en que se escribe. **No es el mismo.**
- **§10, la deuda de grafo.** Entidades y arreglos que arrastran capítulos ya escritos.
- **§12, la tabla de seguimiento.**

### Vocabulario

`hito` y `bloque` están cogidos por `calendario-construccion.md` — hitos 1-3 son el PoC,
bloques A-U la consolidación. Para el contenido:

| | Qué es |
|---|---|
| **lote** | La unidad de sesión: uno o dos relatos. El lote 1 fueron los cinco relatos originales, el 2 el arranque de la cosmogonía. **El siguiente es el lote 3** |
| **tramo** | Las once agrupaciones grandes de §9. Un tramo son varios lotes |
| **capítulo** | `era.número`, tal como se declara en `materia.yaml` |

---

## 1. Las cuatro reglas que hacen que esto sea finito

### 1.1 El límite del corpus

Entra lo que hace falta para leer lo que se conservó: la *Teogonía* y los *Trabajos*, los himnos
homéricos, la *Ilíada*, la *Odisea*, las tragedias, Apolonio, Apolodoro y Ovidio. La *Biblioteca*
de Apolodoro es prácticamente el índice exhaustivo del mito griego y sirve de tope.

Fuera: variantes locales, escolios, mitografía helenística de detalle, cultos regionales.

### 1.2 Relato, entidad de paso o catálogo

| | Qué es | Ejemplo | Cómo se aprende |
|---|---|---|---|
| **Relato** | Pasa algo | La caza de Calidón | Se lee. Desbloquea tarjetas |
| **Entidad de paso** | Existe y aparece | Pegaso, Quirón, Cerbero | Se encuentra al leer |
| **Catálogo** | Una lista con sentido | Los hijos de la Noche | Página editorial con `<Coleccion />` |

### 1.3 Un mito es un relato; un capítulo agrupa dos o tres

Los doce trabajos son **doce relatos**, no dos. La unidad de escritura es el mito completo, por
corto que sea; la unidad de sesión es el capítulo. **Un capítulo son 2-3 relatos y unas ocho
entidades nuevas** — el techo es del álbum, no del contenido.

### 1.4 El grafo no es el árbol completo; es el árbol que el contenido usa

Océano y Tetis tuvieron tres mil hijas y tres mil ríos. **Una entidad entra sola cuando aparece
en algún sitio del mapa; el resto se agrupa en una estirpe.** Estigia y Metis sí; las otras 2.998
Oceánides son un nodo llamado `oceanides`.

Es la regla de §1.2 aplicada a la genealogía, y es lo que impide que el grafo crezca sin techo.

---

## 2. Era 1 · Cosmogonía

| # | Capítulo | Relatos | Estado |
|---|---|---|---|
| **1.1** | Del Caos al primer rey | `nacimiento-del-cosmos`, `castracion-de-urano` | **escrito** |

Una era, un capítulo. No es un hueco: la cosmogonía griega es corta y todo lo demás que hay en
ella son genealogías. **Arrastra la mayor deuda de grafo del proyecto** — ver §10.

**Páginas editoriales:** *Los hijos de la Noche* · *El mar antiguo* · *Otras cosmogonías*
(la órfica, la pelásgica: tres versiones incompatibles del origen, el mejor sitio para estrenar
`<Fuente />` a lo grande)

---

## 3. Era 2 · Edad de los Titanes

El reinado de Crono. **El orden de esta era cambia respecto de la versión anterior del mapa.**

| # | Capítulo | Relatos | Estado |
|---|---|---|---|
| **2.1** | El rey que devora | `crono-devora-a-sus-hijos` | **escrito** |
| **2.2** | La creación de los mortales | `la-raza-de-oro`, `prometeo-modela-a-los-hombres` | pendiente |
| **2.3** | La guerra por el cosmos | `titanomaquia` **escrito, a recortar**, `el-castigo-de-los-vencidos` | pendiente |

### Por qué cambia el orden

La raza de oro vive **mientras reina Crono**. Ponerla después de la Titanomaquia rompía el hilo:
se ganaba una guerra, se creaban unos mortales y luego se repartía el mundo. Ahora se sigue —
reino, mortales, guerra, los vencidos al Tártaro, el reparto (ya en 3.1), Tifón.

**Sin esto, Prometeo roba el fuego en la era 3 y no hay a quién dárselo.**

### Las dos versiones de 2.2

Prometeo modelando hombres de barro es tradición posterior y no está en Hesíodo: las dos son
incompatibles en el *cuándo*. No se resuelve — se muestran las dos con `<Fuente />` y se dice que
no encajan. Es de lo poco que este sitio hace y una enciclopedia no.

### El recorte de `titanomaquia`

El relato escrito termina con el reparto del mundo entre Zeus, Poseidón y Hades. **Ese final se
corta** y pasa a ser `el-reparto-del-cosmos`, en 3.1. La Titanomaquia acaba con la victoria.

`el-castigo-de-los-vencidos` recoge lo que Hesíodo cuenta después y hoy no está en ningún sitio:
los Titanes al Tártaro, los Hecatónquiros de carceleros, Atlas sosteniendo el cielo. **Los
premios a los aliados —el juramento por la Estigia, los honores de Hécate— no van aquí**: van con
el reparto, porque son el orden nuevo y no el final del viejo.

Así el corte de era cae exactamente donde debe: el castigo cierra el reinado de Crono, el reparto
abre el de Zeus.

**Páginas editoriales:** *Las cinco edades del hombre* · *Los doce Titanes y su descendencia*

---

## 4. Era 3 · Edad de los olímpicos

Veintisiete capítulos. **No se ordena por tiempo, se ordena por dios**: los mitos divinos no
tienen secuencia y fingir que la tienen produce un orden falso que además hay que defender en el
juego de ordenar.

### 4.1 La consolidación del poder

| # | Capítulo | Relatos |
|---|---|---|
| 3.1 | El trono amenazado | `el-reparto-del-cosmos`, `tifon` |
| 3.2 | Zeus y Hera | `las-bodas-de-zeus-y-hera`, `la-conjura-del-olimpo` |
| 3.3 | La soberbia castigada | `los-aloadas`, `salmoneo` |
| 3.4 | El reino de los muertos | `sisifo-engana-a-la-muerte`, `ixion-y-la-rueda` |
| 3.5 | Los castigos eternos | `tantalo-y-la-mesa-de-los-dioses`, `ticio-y-los-buitres`, `el-agua-de-las-danaides` |

El **3.4** hace que el inframundo sea un sitio y no un campo: estrena Tánatos, Estigia, Caronte,
Cerbero, los tres jueces y la geografía entera. Es infraestructura de cuatro descensos posteriores.

### 4.2 Los doce, uno a uno

| # | Capítulo | Relatos |
|---|---|---|
| 3.6 | Atenea y la ciudad | `nacimiento-de-atenea` **escrito**, `la-disputa-por-el-atica` |
| 3.7 | El señor del mar | `poseidon-y-amimone`, `los-muros-de-troya` |
| 3.8 | Deméter y las estaciones | `rapto-de-persefone` **escrito**, `demeter-en-eleusis`, `triptolemo` |
| 3.9 | Apolo y Ártemis | `nacimiento-en-delos`, `apolo-y-piton` |
| 3.10 | Los amores de Apolo | `dafne`, `jacinto`, `coronis` |
| 3.11 | Asclepio | `asclepio-y-los-muertos`, `apolo-al-servicio-de-admeto` |
| 3.12 | Los que desafiaron a Apolo | `marsias`, `niobe` |
| 3.13 | Ártemis y los cazadores | `acteon`, `calisto`, `orion` |
| 3.14 | El ladrón recién nacido | `nacimiento-de-hermes` |
| 3.15 | Hefesto, el dios que cojea | `caida-de-hefesto`, `el-trono-de-oro` |
| 3.16 | La red | `ares-y-afrodita`, `erictonio` |
| 3.17 | Afrodita | `adonis`, `pigmalion` |
| 3.18 | Dioniso, el que llega de fuera | `nacimiento-de-dioniso`, `dioniso-y-los-piratas` |
| 3.19 | Penteo y las bacantes | `penteo`, `licurgo-de-tracia`, `midas` |

**Hestia no tiene capítulo porque no tiene mitos.** Ni uno. Su ficha se sostiene sin prosa
narrativa, y merece decirse explícitamente en el sitio: es información sobre cómo funciona el
panteón.

**Poseidón casi tampoco.** Sus mitos son cameos en historias de otros, y 3.7 es el mínimo para
que exista como personaje.

### 4.3 Los mortales bajo Zeus

| # | Capítulo | Relatos |
|---|---|---|
| 3.20 | El fuego y la mujer | `prometeo-y-el-fuego`, `pandora` |
| 3.21 | El diluvio | `licaon`, `deucalion-y-pirra` |
| 3.22 | Zeus y los linajes | `rapto-de-europa`, `io` |
| 3.23 | Leda y los Dioscuros | `leda`, `castor-y-polux` |

El **3.22** es el puente a Creta y el **3.23** a Troya: sin Leda no hay Helena, y Cástor y Pólux
navegan con los argonautas.

### 4.4 El repertorio ovidiano

**No es un bloque que se hace de una vez**: es relleno de lujo, se escribe de uno en uno cuando
cansa un ciclo largo, y son los mitos con más obra pictórica detrás.

| # | Capítulo | Relatos |
|---|---|---|
| 3.24 | Faetón | `faeton` |
| 3.25 | Cuerpos que cambian | `narciso-y-eco`, `aracne`, `erisicton` |
| 3.26 | Amores desgraciados | `piramo-y-tisbe`, `ceix-y-alcione`, `baucis-y-filemon` |
| 3.27 | La casa de Atenas | `tereo-procne-y-filomela`, `cefalo-y-procris`, `boreas-y-oritia` |

**Páginas editoriales:** *Los doce olímpicos* · *Catasterismos* · *La geografía del inframundo* ·
*Los reyes de Atenas* · *Las Musas* · *El cortejo de Dioniso*

---

## 5. Era 4 · Edad de los héroes

Cuarenta y dos capítulos. Se organiza **por ciclo**, y los ciclos se escriben enteros o no se
empiezan.

### 5.1 Argos y Perseo

| # | Capítulo | Relatos |
|---|---|---|
| 4.1 | Las Danaides | `danao-y-egipto`, `hipermnestra` |
| 4.2 | La lluvia de oro | `danae-y-acrisio` |
| 4.3 | La cabeza de la Gorgona | `perseo-y-medusa` |
| 4.4 | El monstruo del mar | `perseo-y-andromeda`, `la-muerte-de-acrisio` |
| 4.5 | El jinete que quiso subir | `belerofonte-y-la-quimera` |

Pegaso nace en 4.3 y se monta en 4.5. Es el único caso del mapa donde una entidad justifica que
dos ciclos vayan seguidos.

### 5.2 Creta y Teseo

| # | Capítulo | Relatos |
|---|---|---|
| 4.6 | El rey de Creta | `minos-y-el-toro`, `pasifae` |
| 4.7 | El artesano | `dedalo-e-icaro`, `dedalo-y-cocalo` |
| 4.8 | El camino a Atenas | `teseo-camino-a-atenas`, `medea-en-atenas` |
| 4.9 | El laberinto | `teseo-y-el-minotauro` **escrito** |
| 4.10 | Las velas negras | `ariadna-en-naxos`, `la-muerte-de-egeo` |
| 4.11 | Las amazonas | `teseo-e-hipolita` |
| 4.12 | Fedra e Hipólito | `fedra-e-hipolito` |
| 4.13 | Pirítoo | `la-centauromaquia`, `el-descenso-al-hades` |

El **4.10** cierra un agujero real: el relato escrito se corta en la fuga, y `naxos` y `mar-egeo`
ya existen como entidades apuntando a escenas que no ocurren en ningún sitio.

### 5.3 Heracles

Once capítulos. No cabe en menos y conviene saberlo antes de empezar.

| # | Capítulo | Relatos |
|---|---|---|
| 4.14 | El niño que estranguló serpientes | `nacimiento-de-heracles`, `las-serpientes-de-la-cuna` |
| 4.15 | La locura | `heracles-y-megara`, `el-oraculo-de-delfos` |
| 4.16 | Las primeras fieras | `leon-de-nemea`, `hidra-de-lerna`, `cierva-de-cerinia` |
| 4.17 | El Peloponeso limpio | `jabali-de-erimanto`, `establos-de-augias`, `aves-del-estinfalo` |
| 4.18 | Más allá del mar | `el-toro-de-creta`, `yeguas-de-diomedes`, `cinturon-de-hipolita` |
| 4.19 | Los confines del mundo | `bueyes-de-gerion`, `manzanas-de-las-hesperides`, `cerbero` |
| 4.20 | Por el camino | `anteo`, `la-liberacion-de-prometeo`, `hesione` |
| 4.21 | Alcestis | `alcestis` |
| 4.22 | La Gigantomaquia | `la-gigantomaquia` |
| 4.23 | Ónfale | `ifito`, `onfale` |
| 4.24 | La túnica y la pira | `deyanira-y-neso`, `la-muerte-de-heracles` |

**Los doce trabajos son doce relatos en cuatro capítulos de tres.** El corte entre 4.16 y 4.17 es
de tamaño y no finge otra cosa; el de 4.18 a 4.19 sí es un arco: cruzar el mar, y luego salirse
del mundo.

**La Gigantomaquia vive aquí y no en la era 3**, aunque temáticamente pertenezca allí: los
Gigantes solo mueren si golpea un mortal, y ese mortal es Heracles.

### 5.4 Tebas

| # | Capítulo | Relatos |
|---|---|---|
| 4.25 | Cadmo funda Tebas | `cadmo-y-el-dragon`, `las-bodas-de-harmonia` |
| 4.26 | Anfión y Zeto | `los-muros-de-tebas` |
| 4.27 | Edipo y la esfinge | `edipo-y-la-esfinge` |
| 4.28 | La verdad de Edipo | `la-verdad-de-edipo` |
| 4.29 | Los siete contra Tebas | `los-siete`, `anfiarao` |
| 4.30 | Antígona | `antigona` |
| 4.31 | Los Epígonos | `alcmeon-y-el-collar` |

### 5.5 Los argonautas

| # | Capítulo | Relatos |
|---|---|---|
| 4.32 | El carnero de oro | `frixo-y-hele`, `atamante-e-ino` |
| 4.33 | La nave Argo | `pelias-y-jason`, `hilas` |
| 4.34 | Fineo y las rocas | `las-harpias`, `las-simplegades` |
| 4.35 | La Cólquide | `los-toros-de-bronce`, `el-dragon-y-el-vellocino` |
| 4.36 | El regreso | `apsirto`, `talos`, `las-sirenas-y-orfeo` |
| 4.37 | Medea | `la-muerte-de-pelias`, `medea-en-corinto` |

### 5.6 Fuera de ciclo

| # | Capítulo | Relatos |
|---|---|---|
| 4.38 | La caza de Calidón | `el-jabali-de-calidon`, `el-tizon-de-altea` |
| 4.39 | Atalanta | `la-carrera-de-atalanta` |
| 4.40 | Orfeo | `orfeo-y-euridice`, `la-muerte-de-orfeo` |
| 4.41 | Pélope | `pelope-y-enomao` |
| 4.42 | Atreo y Tiestes | `el-banquete-de-tiestes` |

**4.41 y 4.42 son el prólogo obligatorio de la era 5.** La maldición de los Atridas empieza con la
carrera de carros de Pélope y el banquete de Tiestes; sin ellos, Clitemnestra mata a Agamenón por
celos y el ciclo entero pierde su motor.

**Páginas editoriales:** *Los centauros* · *Las amazonas* · *La genealogía de los monstruos* ·
*La casa de los Atridas* · *Los reyes de Micenas*

---

## 6. Era 5 · Guerra de Troya

| # | Capítulo | Relatos |
|---|---|---|
| 5.1 | Las bodas de Peleo y Tetis | `peleo-y-tetis`, `el-bano-de-aquiles` |
| 5.2 | La manzana | `eris-y-la-manzana`, `el-juicio-de-paris` |
| 5.3 | El rapto de Helena | `el-juramento-de-tindaro`, `paris-y-helena` |
| 5.4 | La flota en Áulide | `la-locura-de-odiseo`, `aquiles-en-esciros`, `ifigenia` |
| 5.5 | La cólera de Aquiles | `crises-y-briseida`, `la-embajada` |
| 5.6 | Héctor y Andrómaca | `la-aristia-de-diomedes`, `hector-y-andromaca` |
| 5.7 | Patroclo | `la-muerte-de-patroclo`, `la-armadura-de-aquiles` |
| 5.8 | La muerte de Héctor | `aquiles-y-hector` |
| 5.9 | El rescate de Príamo | `priamo-en-la-tienda` |
| 5.10 | Pentesilea y Memnón | `pentesilea`, `memnon` |
| 5.11 | La muerte de Aquiles | `paris-y-el-talon` |
| 5.12 | La locura de Áyax | `las-armas-de-aquiles`, `la-muerte-de-ayax` |
| 5.13 | El caballo de madera | `filoctetes`, `el-paladio`, `el-caballo` |
| 5.14 | La caída de Troya | `laocoonte`, `el-saqueo`, `hecuba-y-polixena` |
| 5.15 | El regreso de Agamenón | `clitemnestra-y-egisto` |
| 5.16 | Orestes | `orestes-y-electra`, `el-juicio-del-areopago` |
| 5.17 | El cíclope | `los-ciconos-y-los-lotofagos`, `polifemo` |
| 5.18 | Circe y los muertos | `eolo-y-los-lestrigones`, `circe`, `la-nekyia` |
| 5.19 | El camino a casa | `las-sirenas`, `escila-y-caribdis`, `las-vacas-del-sol`, `calipso` |
| 5.20 | Ítaca | `los-feacios`, `eumeo-y-telemaco` |
| 5.21 | Los pretendientes | `la-prueba-del-arco`, `penelope` |

Los muros de Troya (3.7) y Hesíone (4.20) ya han sembrado por qué Poseidón odia la ciudad y por
qué Príamo reina en ella.

**Decisión abierta:** de 5.17 a 5.21 es la Odisea. O son cinco capítulos de esta era, o son una
sexta era. Se resuelve al escribirla — añadir una era cuesta una línea en `materia.yaml`;
deshacerla cuando ya hay contenido declarado con `era: los-regresos`, no.

**Páginas editoriales:** *El catálogo de las naves* · *Los dioses toman partido* · *Lo que la
Ilíada no cuenta*

---

## 7. Dónde entran los nombres que no son capítulo

| Entidad | No tiene mito propio porque… | Se encuentra en |
|---|---|---|
| **Los doce Titanes** | Su función es ser padres de | Declarados en 1.1. Ver §8 |
| **Las Moiras** | Son una función, no un personaje | Hijas de Zeus y Temis. Actúan en 4.38 y 4.21 |
| **Pegaso** | Nace y se monta, no protagoniza | 4.3 y 4.5 |
| **Quirón** | Es el maestro de todos | Hijo de Crono y Fílira. 3.11, 4.20, 4.33 |
| **Cerbero, Caronte, Estigia** | Son la geografía del inframundo | 3.4, y otra vez en 4.13, 4.19, 4.40, 5.18 |
| **Las Musas** | Catálogo | Hijas de Zeus y Mnemósine. Actúan en 4.40 |
| **Iris, Hebe, Ganimedes** | Cargo, no biografía | Ficha con atributos. Hebe cierra 4.24 |
| **Las Nereidas** | Catálogo. Tetis es la excepción | Página *El mar antiguo*; Tetis en 5.1 y 5.7 |
| **Las Gorgonas y las Grayas** | Existen para ser vencidas | 4.3 |
| **Las Harpías, las Sirenas** | Obstáculos | 4.34, 4.36, 5.19 |
| **Escila y Caribdis** | Obstáculos, pero Escila **sí** tiene origen ovidiano | 5.19; su origen cabe en 3.25 |
| **Los centauros** | Colectivo. Quirón es aparte | 4.13, 4.24 |
| **Las amazonas** | Colectivo | 4.11, 4.18, 5.10 |
| **Helios, Eos, Selene** | Hijos de Hiperión y Tea | Helios en 3.16, 3.24, 5.19. Eos en 5.10 |
| **Hécate** | Acompaña, no protagoniza | Hija de Perses y Asteria. 3.8, 4.37 |
| **Némesis, Éride** | Actúan una vez cada una | Éride en 5.2 |

**El criterio, en una frase:** si una entidad no es sujeto de ninguna oración en ningún mito
conservado, no es un capítulo — es una ficha que se llena con atributos, ascendencia y
descendencia, y se encuentra leyendo.

---

## 8. Los Titanes: YAML rico, prosa cero

Los doce parecen el caso extremo de "no tienen mitos". Pero **su grafo no es pobre: es lo único
que tienen y es abundante.** Jápeto no hace nada en ningún mito, y su ficha bien declarada dice
algo fuerte: los cuatro hermanos que se enfrentan a Zeus por los mortales salen todos de él.

Son el contenido más barato del proyecto y de los que más rinden, porque desatascan medio grafo:

| Padres | Desatasca |
|---|---|
| Océano + Tetis | `metis`, `estigia`, y las estirpes `oceanides` y `rios` |
| Hiperión + Tea | `helios`, `eos`, `selene` |
| Ceo + Febe | `leto` — y por tanto Apolo y Ártemis |
| Crío + Euribia | `astreo`, `perses`, `palas` |
| Perses + Asteria | `hecate` |
| Jápeto + Clímene | `atlas`, `prometeo`, `epimeteo`, `menecio` |
| Zeus + Temis | **las Moiras y las Horas** |
| Zeus + Mnemósine | **las Musas** |
| Crono + Fílira | `quiron` |

Las tres últimas filas son las importantes. Moiras y Musas dejan de ser catálogos huérfanos, y
Quirón sale hijo de Crono — que es exactamente lo que explica por qué no es un centauro como los
demás. Hoy eso habría que contarlo en prosa; **el grafo lo dice solo**.

---

## 9. El orden de escritura

### Las tres reglas

1. **Un ciclo se termina o no se empieza.** Medio Heracles deja ocho capítulos abiertos, cuarenta
   casillas vacías en el álbum y una era que parece rota.
2. **Lo que es infraestructura va antes que lo que la usa.** Delfos antes que cualquier héroe. El
   inframundo antes que los cuatro descensos. Los Atridas antes que Troya.
3. **El repertorio ovidiano y las páginas editoriales no son un tramo: son descanso.**

### Los tramos

| Tramo | Qué entra | Capítulos | Qué demuestra |
|---|---|---|---|
| **1 · El origen** | Eras 1 y 2 completas, más el trono amenazado | 1.1, 2.1-2.3, 3.1 | *Casi hecho.* Dos actos cerrados desde la primera sesión |
| **2 · La infraestructura** | El inframundo, los castigos, Delfos, Prometeo, el diluvio | 3.4, 3.5, 3.9, 3.20, 3.21 | Ningún héroe consulta un oráculo que no está declarado ni baja a un sitio que no existe |
| **3 · El Olimpo al completo** | Los doce, uno a uno | 3.2, 3.3, 3.6-3.8, 3.10-3.19 | Es el tramo que hace que el sitio parezca completo aunque no lo esté |
| **4 · El primer héroe** | Perseo entero, más Belerofonte | 4.1-4.5 | Valida la forma «ciclo heroico» con cinco capítulos en vez de once. **Y es el material iconográfico más rico del corpus** |
| **5 · Creta y Teseo** | Europa, Minos, Dédalo, Teseo entero | 3.22, 4.6-4.13 | Cierra lo que ya está medio escrito |
| **6 · Heracles** | Los once | 4.14-4.24 | El más caro y el más reconocible. No se empieza hasta que 4 y 5 estén cerrados |
| **7 · Tebas** | Cadmo, Edipo, los Siete | 4.25-4.31 | El nudo mejor conectado: enlaza con Europa, con Dioniso y con Ares |
| **8 · Los argonautas** | Los seis | 4.32-4.37 | Cierra Quirón, Medea y las Sirenas |
| **9 · Los preludios** | Leda, Calidón, Atalanta, Orfeo, Pélope, Atreo | 3.23, 4.38-4.42 | Sin esto, la era 5 no tiene motor |
| **10 · Troya** | De las bodas a la caída | 5.1-5.14 | El pago del proyecto entero |
| **11 · Los regresos** | Orestes y la Odisea | 5.15-5.21 | Y aquí se decide si hay una sexta era |
| **· continuo** | Faetón, ovidianos, páginas editoriales | 3.24-3.27 | Descanso entre ciclos. No se planifica |

### Por qué este orden y no el del mapa

**Perseo antes que Heracles:** cinco capítulos frente a once, y Heracles desciende de Perseo, así
que el linaje ya está puesto cuando llegue.

**Creta antes que Heracles** porque es lo único del mapa que ya está medio escrito y a medias. Un
capítulo cerrado que cuenta media historia es peor que un capítulo que falta.

**El Olimpo completo antes que cualquier héroe**, aunque sean quince capítulos: los héroes se
pasan el corpus rezando a dioses, y quien llega a Heracles sin saber quién es Hera no entiende por
qué todo le sale mal.

**Troya la penúltima**, y no por gusto: la Ilíada empieza *in medias res* y supone conocido el
resto del mito. Escribirla antes es escribir para nadie.

**El atajo, si la era vacía molesta antes de tiempo:** el capítulo 5.2. La manzana y el juicio de
Paris cuestan unos ocho ids nuevos porque las tres diosas que compiten ya existen.

---

## 10. Deuda de grafo

Entidades y arreglos que arrastran capítulos **ya escritos**. No es trabajo futuro: es trabajo
vencido, y explica por qué los capítulos más antiguos son los que peor grafo tienen.

### 1.1 · Del Caos al primer rey

Los doce Titanes existen solo dentro del colectivo `titanes`. Faltan como entidades:

`oceano` · `tetis-titanide` · `ceo` · `febe` · `crio` · `hiperion` · `tea` · `japeto` ·
`temis` · `mnemosine`

Y sus consortes, que son quienes cierran las cadenas de §8: `climene` · `euribia` · `asteria` ·
`perses` · `filira`

Estirpes nuevas: `oceanides` · `rios`

Arreglos: `hijo_de: [urano, gea]` en `titanes`, `ciclopes` y `hecatonquiros` — hoy sus resúmenes
lo dicen y el grafo no. Y `lugar: chipre` en `castracion-de-urano`, que explica la ficha
huérfana de Chipre.

### 2.1 · El rey que devora

`rea` declara `madre_de` para cuatro de sus seis hijos: faltan Deméter y Hestia. `crono` sí los
tiene los seis, así que es asimetría pura.

### 2.3 · La guerra por el cosmos

**Recortar `titanomaquia`:** quitar el reparto del final, que pasa a 3.1.

Entidades nuevas: `atlas` · `menecio` · `estigia`

Arreglo: la arista `ciclopes → forja → rayo`, que hoy no existe.

---

## 11. Recuento

| Era | Capítulos | Relatos | Páginas editoriales |
|---|---|---|---|
| Cosmogonía | 1 | 2 | 3 |
| Edad de los Titanes | 3 | 5 | 2 |
| Edad de los olímpicos | 27 | ~60 | 6 |
| Edad de los héroes | 42 | ~85 | 5 |
| Guerra de Troya | 21 | ~45 | 3 |
| **Total** | **94** | **~196** | **19** |

Entidades estimadas: **700-900**.

**Nada de esto hay que escribirlo entero para tener un sitio que valga.** Con los tramos 1 a 5
—unos 35 capítulos— hay tres eras con cuerpo, dos ciclos heroicos completos y el panteón entero.

---

## 12. Tabla de seguimiento

Se marca cuando el capítulo está declarado en `materia.yaml`, sus relatos escritos y su deuda de
grafo saldada. La prosa de entidad **no** cuenta: es opcional por diseño.

| Tramo | Capítulos | Estado |
|---|---|---|
| 1 · El origen | 1.1, 2.1, 2.2, 2.3, 3.1 | 2 de 5 · *1.1 y 2.1 con deuda de grafo abierta* |
| 2 · La infraestructura | 3.4, 3.5, 3.9, 3.20, 3.21 | 0 de 5 |
| 3 · El Olimpo al completo | 3.2, 3.3, 3.6-3.8, 3.10-3.19 | 0 de 15 · *3.6 y 3.8 a medias* |
| 4 · El primer héroe | 4.1-4.5 | 0 de 5 |
| 5 · Creta y Teseo | 3.22, 4.6-4.13 | 0 de 9 · *4.9 a medias* |
| 6 · Heracles | 4.14-4.24 | 0 de 11 |
| 7 · Tebas | 4.25-4.31 | 0 de 7 |
| 8 · Los argonautas | 4.32-4.37 | 0 de 6 |
| 9 · Los preludios | 3.23, 4.38-4.42 | 0 de 6 |
| 10 · Troya | 5.1-5.14 | 0 de 14 |
| 11 · Los regresos | 5.15-5.21 | 0 de 7 |
| · continuo | 3.24-3.27 | 0 de 4 |

El detalle por relato y por ficha está en `roadmap-de-prosa.html`, que es la versión marcable.

---

## 13. Cambios en `materia.yaml`

Cinco. **Ningún capítulo cambia de id, así que no se pierde progreso.**

```
+ la-creacion-de-los-mortales    era titanes      orden 200    (capítulo nuevo)
~ la-guerra-por-el-cosmos        orden 200 → 300  (pasa a ser 2.3)
~ atenea-y-la-ciudad             orden 200 → 600  (pasa a ser 3.6)
~ demeter-y-las-estaciones       orden 400 → 800  (pasa a ser 3.8)
~ el-laberinto                   orden 100 → 900  (pasa a ser 4.9)
```

Los tres últimos son porque el mapa completo mete capítulos por delante de ellos dentro de su era.

---

## 14. Decisiones abiertas

1. **La Odisea:** cinco capítulos de la era 5, o sexta era.
2. **`bloque` como campo de agrupación.** Con 42 capítulos en la era de los héroes el índice puede
   volverse ilegible. Se decide cuando esa era tenga veinte capítulos reales — las medallas ya se
   resuelven con etiquetas.
3. **El ámbito de ordenar:** con capítulos de 2-3 relatos casi nunca hay tres cosas que ordenar
   dentro de uno. Su ámbito natural es la era.
4. **`lugar` en el conjunto del capítulo.** Hoy es `participantes ∪ entidades_extra` y el
   escenario queda fuera. Se cruza con la decisión pendiente de `lugares` como lista.
5. **La mezcla de formatos del examen no puede ser fija.** La cosmogonía es puro árbol y cero
   imágenes; los trabajos son objetos y sitios con mucha iconografía y poca genealogía; Troya es
   gente y lugares. «10 preguntas, umbral 8» tiene que salir de lo que cada capítulo dé.
