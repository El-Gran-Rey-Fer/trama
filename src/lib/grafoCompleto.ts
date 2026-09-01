import ELK from "elkjs";
import type { ElkExtendedEdge, ElkNode } from "elkjs/lib/elk-api";
import {
	type Arista,
	type Grafo,
	obtenerEntidad,
	TIPOS_GENEALOGIA,
} from "./grafo";

// Motor único de árbol de parentesco (fuera del plan de imágenes y álbum
// original, pedido después de A7). El propio calendario-construccion.md
// avisa de que "el grafo entero" con 200 entidades es una madeja ilegible:
// esta vista se queda solo con la familia de relación de parentesco
// (padre/madre/hijo), que es la que tiene layout resuelto y la que de
// verdad se quiere consultar. El resto de familias de relación (consortes,
// relatos, lugares, objetos, acciones, obras) se probaron y se
// descartaron: no aportaban sobre lo que ya cuenta la ficha de cada
// entidad.
//
// Sirve dos modos con el mismo layout: la vista de toda la materia
// (`construirVistaFamilia(grafo)`) y una ventana de ego centrada en una
// entidad, ±N generaciones (`construirVistaFamilia(grafo, {centro,
// profundidad})`) — la que usan la página de árbol por-entidad y el juego
// "completar el árbol". Antes cada una tenía su propio motor (este, y un
// segundo basado en d3-hierarchy que duplicaba antepasados compartidos en
// vez de fusionarlos); se unificaron en uno para que colores, nodos de
// unión, orden por importancia y divisores de generación salgan iguales
// en las tres vistas.
//
// `hermano_de` no se dibuja: desde que se deriva de la filiación compartida
// (grafo.ts), dos hermanos siempre tienen ya un padre/madre común pintado en
// esta misma vista (línea directa o nodo de unión — ver `detectarUniones`),
// así que la línea de hermandad es pura redundancia visual. Con un
// progenitor de familia numerosa esa redundancia crece en C(n,2): una
// camada de una docena de hijos son 66 líneas cruzadas por nada.
export interface FamiliaRelacion {
	id: string;
	etiqueta: string;
	tipos: string[];
	// Sub-tipos que se distinguen por color en esta familia, en el orden en
	// que toman color de la paleta.
	tiposCanonicos: string[];
}

export const FAMILIA_PARENTESCO: FamiliaRelacion = {
	id: "parentesco",
	etiqueta: "Parentesco",
	tipos: TIPOS_GENEALOGIA,
	tiposCanonicos: ["padre_de", "madre_de"],
};

const PALETA_ARISTA = [
	"var(--color-arista-1)",
	"var(--color-arista-2)",
	"var(--color-arista-3)",
	"var(--color-arista-4)",
	"var(--color-arista-5)",
	"var(--color-arista-6)",
];

export function colorDeTipo(familia: FamiliaRelacion, tipo: string): string {
	const indice = familia.tiposCanonicos.indexOf(tipo);
	if (indice === -1) return "var(--color-tarjeta-borde)";
	return PALETA_ARISTA[indice % PALETA_ARISTA.length];
}

export interface NodoGrafo {
	id: string;
	// Id de la entidad real que representa este nodo — igual a `id` salvo en
	// una copia de hub duplicado (§3, ver `aplicarDuplicados`), donde `id`
	// es sintético (`entidad#union:...`) e `idEntidad` es el id real, el que
	// hace falta para enlazar a la ficha o resolver el retrato.
	idEntidad: string;
	// Hub con varias uniones relevantes en esta vista, repartido en una
	// copia por unión en vez de concentrar todas sus líneas en un único
	// nodo. Solo puede darse en la vista de toda la materia.
	duplicado?: boolean;
	// Peso visual (§4 del doc de spec): tronco vs. ramas laterales, según
	// `importancia` (`contarRelaciones`) — no hay tier de importancia en el
	// contenido, así que se deriva del propio grafo. Ausente en la ventana
	// de ego (todas las entidades se dibujan igual ahí, la vista ya está
	// acotada de por sí).
	peso?: "grande" | "normal" | "pequeno";
	// Id del grupo de "rama densa" (§4) que oculta este nodo por defecto —
	// ver `agruparRamasDensas`. Ausente si el nodo se ve siempre.
	colapsadoEn?: string;
	nombre: string;
	tipo: string;
	x: number;
	y: number;
}

export interface EnlaceGrafo {
	desde: string;
	hasta: string;
	tipo: string;
	color: string;
	// Puntos de quiebro intermedios (sin incluir los extremos, que son las
	// posiciones de `desde`/`hasta`) para dibujar el conector en ángulo
	// recto en vez de una diagonal — ver `elk.edgeRouting` en
	// `calcularPosiciones`. Ausente si el tramo es recto (sin quiebro).
	puntos?: { x: number; y: number }[];
	// Grosor visual (§4): toma el peso del extremo que es una entidad real
	// (el progenitor si el enlace sale de él, el hijo si sale de una
	// unión — ver `calcularGrosor`). Ausente en la ventana de ego.
	grosor?: "grueso" | "normal" | "fino";
}

export interface UnionGrafo {
	id: string;
	x: number;
	y: number;
	// Los dos ids reales que fusiona, para quien necesite reconstruir "quién
	// es el padre/madre de este hijo" sin parsear el id sintético.
	padres: [string, string];
}

export interface VentanaEgo {
	centro: string;
	profundidad: number;
	// Versión "simplificada" pedida para la ficha y el reto de completar el
	// árbol: solo la línea directa de `centro` (sus progenitores y los
	// progenitores de estos, sus hijos y los hijos de estos), sin hermanos ni
	// tíos/primos. `subgrafoEgo` sube y baja desde CUALQUIER nodo visitado, así
	// que una familia numerosa en cualquier generación mete de rebote a todos
	// sus hijos (docenas de hermanos del centro, si el que tiene la camada es
	// un progenitor); esta variante solo continúa ascendiendo desde
	// ascendientes y descendiendo desde descendientes, nunca cruza al lado.
	soloLineaDirecta?: boolean;
	// Profundidad de descenso, si es distinta de `profundidad` (que entonces
	// solo rige la subida). La ficha embebida solo tiene sitio para los hijos
	// directos, no dos generaciones enteras de descendientes — con un
	// progenitor prolífico (Gea y sus ~20 hijos entre varias parejas), incluso
	// recortados a `MAX_HIJOS_LINEA_DIRECTA` cada uno, dos generaciones de
	// descendientes siguen siendo un revoltijo en un hueco tan pequeño. El
	// reto de completar el árbol sí tiene pantalla completa y no la usa (se
	// queda con `profundidad` en los dos sentidos).
	profundidadDescendientes?: number;
}

// Marcador de "rama densa" colapsada por defecto (§4): sustituye a los
// hijos poco relevantes de un progenitor/unión con muchos hijos. Los nodos
// y enlaces reales siguen en `VistaGrafo.nodos`/`enlaces` (nada se pierde,
// solo se empieza oculto — `NodoGrafo.colapsadoEn` referencia este id), así
// que expandir es un cambio de visibilidad en el cliente, no un recálculo.
export interface GrupoColapsado {
	id: string;
	x: number;
	y: number;
	cantidad: number;
	// Nodo o unión del que cuelga el grupo — para que el filtro por tipo
	// (§5) pueda ocultar también el marcador cuando lo que lo origina
	// desaparece (si no, quedaría flotando sin ningún trazo que lo
	// justifique).
	origen: string;
}

export interface VistaGrafo {
	familia: FamiliaRelacion;
	nodos: NodoGrafo[];
	uniones: UnionGrafo[];
	enlaces: EnlaceGrafo[];
	grupos: GrupoColapsado[];
	// Coordenada `y` de cada generación presente, de arriba a abajo — para
	// dibujar divisores entre filas.
	filas: number[];
	ancho: number;
	alto: number;
}

const ESPACIO_HERMANOS = 90;
const ESPACIO_GENERACION = 130;
const MARGEN = 45;

function agregar<K, V>(mapa: Map<K, V[]>, clave: K, valor: V) {
	const lista = mapa.get(clave);
	if (lista) lista.push(valor);
	else mapa.set(clave, [valor]);
}

// Normaliza una arista de TIPOS_GENEALOGIA a la forma padre->hijo con el rol
// resuelto. `hijo_de` sin género resuelto por `grafo.ts` (el destino no
// declara `genero` o no hay entrada para él en `inversa_por_genero`) es
// siempre el caso por defecto que el propio esquema declara —
// `hijo_de.inversa: padre_de` en `materia.yaml` — así que se interpreta
// como tal aquí, sin tocar `grafo.ts`.
interface RolPadre {
	padreId: string;
	hijoId: string;
	tipo: "padre_de" | "madre_de";
}

function normalizarRol(a: Arista): RolPadre {
	if (a.relacion.tipo === "hijo_de") {
		return {
			padreId: a.relacion.destino,
			hijoId: a.origenId,
			tipo: "padre_de",
		};
	}
	return {
		padreId: a.origenId,
		hijoId: a.relacion.destino,
		tipo: a.relacion.tipo as "padre_de" | "madre_de",
	};
}

// Importancia = cuántas aristas (de cualquier tipo, no solo parentesco)
// tocan a esta entidad en el grafo completo de la materia — proxy de cuán
// central es al relato sin depender de ningún campo de contenido nuevo (no
// existe ningún "tier"/"importancia" en el esquema, y añadirlo obligaría a
// etiquetar a mano el centenar largo de entidades de cada materia).
function contarRelaciones(aristas: Arista[]): Map<string, number> {
	const conteo = new Map<string, number>();
	const inc = (id: string) => conteo.set(id, (conteo.get(id) ?? 0) + 1);
	for (const a of aristas) {
		inc(a.origenId);
		inc(a.relacion.destino);
	}
	return conteo;
}

// BFS de aristas de TIPOS_GENEALOGIA alcanzables desde `centro` en
// cualquier sentido (ascendiendo vía progenitores, descendiendo vía hijos),
// hasta `profundidad` saltos. `capa` sale con signo: centro = 0,
// ascendientes negativos, descendientes positivos, por la distancia más
// corta (primera vez que se visita cada id).
function subgrafoEgo(
	aristasGenealogicas: Arista[],
	centro: string,
	profundidad: number,
): { aristas: Arista[]; capa: Map<string, number> } {
	const porPadre = new Map<string, Arista[]>();
	const porHijo = new Map<string, Arista[]>();
	for (const a of aristasGenealogicas) {
		const rol = normalizarRol(a);
		agregar(porPadre, rol.padreId, a);
		agregar(porHijo, rol.hijoId, a);
	}

	const capa = new Map<string, number>([[centro, 0]]);
	const vistas = new Set<Arista>();
	const aristas: Arista[] = [];
	let frontera = [centro];
	for (let paso = 0; paso < profundidad; paso++) {
		const siguiente: string[] = [];
		for (const id of frontera) {
			const c = capa.get(id) ?? 0;
			for (const a of porHijo.get(id) ?? []) {
				if (!vistas.has(a)) {
					vistas.add(a);
					aristas.push(a);
				}
				const { padreId } = normalizarRol(a);
				if (!capa.has(padreId)) {
					capa.set(padreId, c - 1);
					siguiente.push(padreId);
				}
			}
			for (const a of porPadre.get(id) ?? []) {
				if (!vistas.has(a)) {
					vistas.add(a);
					aristas.push(a);
				}
				const { hijoId } = normalizarRol(a);
				if (!capa.has(hijoId)) {
					capa.set(hijoId, c + 1);
					siguiente.push(hijoId);
				}
			}
		}
		frontera = siguiente;
	}
	return { aristas, capa };
}

// Tope de hijos que se expanden por nodo en la línea directa: sin él, un
// progenitor prolífico (Gea, con más de veinte hijos entre varias parejas)
// desborda igual el ancho compacto, solo que por debajo en vez de al lado.
// No hace falta tope simétrico al ascender: un id tiene como mucho dos
// aristas de entrada (padre_de + madre_de).
const MAX_HIJOS_LINEA_DIRECTA = 6;

// Como `subgrafoEgo`, pero la ascendencia solo asciende (nunca vuelve a
// bajar a otros hijos de un progenitor) y el descenso solo desciende —
// así que un progenitor con una camada numerosa no cuela a los hermanos del
// centro, y un hijo con dos progenitores solo trae la arista del progenitor
// que sí es línea directa del centro, no a su pareja. Además, al descender,
// cada nodo se queda con como mucho `MAX_HIJOS_LINEA_DIRECTA` hijos (los de
// mayor `importancia`): el resto se ve en "Ver árbol completo".
function subgrafoLineaDirecta(
	aristasGenealogicas: Arista[],
	centro: string,
	profundidadArriba: number,
	profundidadAbajo: number,
	importancia: Map<string, number>,
): { aristas: Arista[]; capa: Map<string, number> } {
	const porPadre = new Map<string, Arista[]>();
	const porHijo = new Map<string, Arista[]>();
	for (const a of aristasGenealogicas) {
		const rol = normalizarRol(a);
		agregar(porPadre, rol.padreId, a);
		agregar(porHijo, rol.hijoId, a);
	}

	const capa = new Map<string, number>([[centro, 0]]);
	const vistas = new Set<Arista>();
	const aristas: Arista[] = [];

	let fronteraArriba = [centro];
	for (let paso = 0; paso < profundidadArriba; paso++) {
		const siguiente: string[] = [];
		for (const id of fronteraArriba) {
			const c = capa.get(id) ?? 0;
			for (const a of porHijo.get(id) ?? []) {
				if (!vistas.has(a)) {
					vistas.add(a);
					aristas.push(a);
				}
				const { padreId } = normalizarRol(a);
				if (!capa.has(padreId)) {
					capa.set(padreId, c - 1);
					siguiente.push(padreId);
				}
			}
		}
		fronteraArriba = siguiente;
	}

	let fronteraAbajo = [centro];
	for (let paso = 0; paso < profundidadAbajo; paso++) {
		const siguiente: string[] = [];
		for (const id of fronteraAbajo) {
			const c = capa.get(id) ?? 0;
			const hijos = (porPadre.get(id) ?? [])
				.map((a) => ({ arista: a, hijoId: normalizarRol(a).hijoId }))
				.sort(
					(x, y) =>
						(importancia.get(y.hijoId) ?? 0) -
							(importancia.get(x.hijoId) ?? 0) ||
						x.hijoId.localeCompare(y.hijoId),
				)
				.slice(0, MAX_HIJOS_LINEA_DIRECTA);
			for (const { arista: a, hijoId } of hijos) {
				if (!vistas.has(a)) {
					vistas.add(a);
					aristas.push(a);
				}
				if (!capa.has(hijoId)) {
					capa.set(hijoId, c + 1);
					siguiente.push(hijoId);
				}
			}
		}
		fronteraAbajo = siguiente;
	}

	return { aristas, capa };
}

// Kahn por grado de entrada, relajando la capa al camino más largo visto.
// Capa = camino más largo desde una raíz (nadie declarado como su
// padre/madre) — no el campo `generacion` de la entidad: ese campo solo
// está relleno en 8 de 58 entidades y quedaría vacío para el resto.
function capaPorAlcance(
	ids: Set<string>,
	hijosDe: Map<string, string[]>,
	padresDe: Map<string, string[]>,
): Map<string, number> {
	const indegreeRestante = new Map<string, number>();
	for (const id of ids)
		indegreeRestante.set(id, (padresDe.get(id) ?? []).length);

	const capa = new Map<string, number>();
	const cola = [...ids].filter((id) => indegreeRestante.get(id) === 0).sort();
	for (const id of cola) capa.set(id, 0);

	let i = 0;
	while (i < cola.length) {
		const actual = cola[i];
		i++;
		for (const hijo of hijosDe.get(actual) ?? []) {
			const candidata = (capa.get(actual) ?? 0) + 1;
			capa.set(hijo, Math.max(capa.get(hijo) ?? 0, candidata));
			const restante = (indegreeRestante.get(hijo) ?? 0) - 1;
			indegreeRestante.set(hijo, restante);
			if (restante === 0) cola.push(hijo);
		}
	}
	// Ciclo (no debería pasar con datos correctos): lo que quede sin visitar
	// se ancla a capa 0 en vez de colgar el build.
	for (const id of ids) if (!capa.has(id)) capa.set(id, 0);
	return capa;
}

interface UnionDetectada {
	id: string;
	padres: [string, string];
	capa: number;
}

// Cuando un hijo tiene dos progenitores conocidos, se sustituyen sus dos
// líneas directas por un nodo de unión: líneas cortas de cada progenitor a
// la unión (con su color de padre/madre) y una sola línea neutra de la
// unión a cada hijo compartido, en vez de dos líneas por hijo que se cruzan
// entre sí. Puramente estructural (capa, no posición todavía) para poder
// decidirlo antes del layout: el nodo de unión entra como un nodo más en el
// grafo que resuelve elk, y su cercanía a ambos progenitores la resuelve el
// propio algoritmo de cruces — no hace falta forzarla a mano.
function detectarUniones(
	aristasGenealogicas: Arista[],
	capa: Map<string, number>,
): { uniones: UnionDetectada[]; enlaces: EnlaceGrafo[] } {
	const porHijo = new Map<
		string,
		{ padreId: string; tipo: "padre_de" | "madre_de" }[]
	>();
	for (const a of aristasGenealogicas) {
		const rol = normalizarRol(a);
		agregar(porHijo, rol.hijoId, { padreId: rol.padreId, tipo: rol.tipo });
	}

	const uniones: UnionDetectada[] = [];
	const unionPorPareja = new Map<string, UnionDetectada>();
	const enlaces: EnlaceGrafo[] = [];

	for (const [hijoId, padres] of porHijo) {
		const capaA = padres[0] && capa.get(padres[0].padreId);
		const capaB = padres[1] && capa.get(padres[1].padreId);
		if (padres.length !== 2 || capaA === undefined || capaB === undefined) {
			// Un solo progenitor conocido: sin fusión, línea directa.
			for (const p of padres) {
				enlaces.push({
					desde: p.padreId,
					hasta: hijoId,
					tipo: p.tipo,
					color: colorDeTipo(FAMILIA_PARENTESCO, p.tipo),
				});
			}
			continue;
		}

		// Los dos progenitores no siempre caen en la misma capa: un
		// progenitor puede ser a la vez hijo y pareja del otro (relato
		// real de la materia, no dato mal formado), así que el camino más
		// largo desde las raíces los deja en capas distintas aunque tengan
		// hijos en común. Fusionar solo cuando coinciden dejaba sin unión
		// a generaciones enteras. La unión se coloca en la capa del
		// progenitor más profundo (el hijo de un padre siempre está en una
		// capa posterior a la de sus dos progenitores, se cumpla o no la
		// igualdad, así que `max` nunca invade la fila de los hijos).
		const [a, b] = padres;
		const clave = [a.padreId, b.padreId].sort().join("+");
		let union = unionPorPareja.get(clave);
		if (!union) {
			union = {
				id: `union:${clave}`,
				padres: [a.padreId, b.padreId],
				capa: Math.max(capaA, capaB),
			};
			unionPorPareja.set(clave, union);
			uniones.push(union);
			enlaces.push({
				desde: a.padreId,
				hasta: union.id,
				tipo: a.tipo,
				color: colorDeTipo(FAMILIA_PARENTESCO, a.tipo),
			});
			enlaces.push({
				desde: b.padreId,
				hasta: union.id,
				tipo: b.tipo,
				color: colorDeTipo(FAMILIA_PARENTESCO, b.tipo),
			});
		}
		enlaces.push({
			desde: union.id,
			hasta: hijoId,
			tipo: "union_de",
			color: "var(--color-tarjeta-borde)",
		});
	}

	return { uniones, enlaces };
}

interface NodoPlan {
	id: string;
	idEntidad: string;
	duplicado: boolean;
}

// Reparte un hub (entidad con 2+ uniones relevantes en esta vista — un
// progenitor con hijos de varias parejas distintas) en una copia por unión,
// en vez de una única posición con todas las líneas convergiendo (§3 del
// doc de spec).
// Solo se llama desde la vista de toda la materia: las ventanas de ego
// (ficha, árbol por-entidad, juego de completar el árbol) ya están acotadas
// por profundidad y `MAX_HIJOS_LINEA_DIRECTA`, así que en la práctica no
// acumulan suficientes uniones para que el problema aparezca ahí — y evita
// tener que enseñar a esos consumidores (que comparan ids de nodo con ids
// de entidad reales) a resolver copias.
function aplicarDuplicados(
	idsBase: Set<string>,
	uniones: UnionDetectada[],
	enlaces: EnlaceGrafo[],
): { nodos: NodoPlan[]; enlaces: EnlaceGrafo[] } {
	const unionesPorPadre = new Map<string, UnionDetectada[]>();
	for (const u of uniones) {
		agregar(unionesPorPadre, u.padres[0], u);
		agregar(unionesPorPadre, u.padres[1], u);
	}

	// Copia elegida para todo lo que no pertenece a ninguna unión en
	// concreto (la arista que trae al propio hub como hijo de su capa
	// anterior, o un hijo suyo con un solo progenitor conocido): la primera
	// por orden de id de unión, determinista entre builds.
	const copiaPrimaria = new Map<string, string>();
	const copiaPorUnion = new Map<string, string>(); // clave `${hub}|${union.id}`
	const nodos: NodoPlan[] = [];

	for (const id of idsBase) {
		const us = unionesPorPadre.get(id);
		if (!us || us.length < 2) {
			nodos.push({ id, idEntidad: id, duplicado: false });
			continue;
		}
		const ordenadas = [...us].sort((a, b) => a.id.localeCompare(b.id));
		ordenadas.forEach((u, i) => {
			const copiaId = `${id}#${u.id}`;
			copiaPorUnion.set(`${id}|${u.id}`, copiaId);
			if (i === 0) copiaPrimaria.set(id, copiaId);
			nodos.push({ id: copiaId, idEntidad: id, duplicado: true });
		});
	}

	const enlacesReescritos = enlaces.map((e) => {
		const copiaDesde = copiaPorUnion.get(`${e.desde}|${e.hasta}`);
		if (copiaDesde) return { ...e, desde: copiaDesde };
		const primariaDesde = copiaPrimaria.get(e.desde);
		const primariaHasta = copiaPrimaria.get(e.hasta);
		if (!primariaDesde && !primariaHasta) return e;
		return {
			...e,
			desde: primariaDesde ?? e.desde,
			hasta: primariaHasta ?? e.hasta,
		};
	});

	// Sin línea conectora entre copias de un mismo hub: con el criterio de
	// unión ya sin exigir la misma capa (ver `detectarUniones`), una
	// entidad muy prolífica reparte sus copias por grupos de descendencia
	// muy distintos y lejanos entre sí — la línea acababa cruzando medio
	// lienzo, más ruido del que quitaba. El borde punteado de cada copia
	// (§3, en el marcado) ya basta para leer "esto es un duplicado".

	return { nodos, enlaces: enlacesReescritos };
}

// Tamaño nominal de cada nodo para elk. Antes del enrutado ortogonal esto
// daba igual (las líneas eran rectas entre centros, ajenas al tamaño real
// de la casilla en CSS) y bastaba un punto de 8px — pero `ORTHOGONAL` sí
// usa el tamaño declarado para decidir por dónde caben los tramos rectos,
// así que un nodo "de mentira" mucho más pequeño que la casilla real
// (44-64px según la vista) deja hueco de sobra donde no lo hay de verdad,
// y el conector acaba cruzando por encima de un vecino. Con un tamaño
// realista, `ESPACIO_HERMANOS`/`ESPACIO_GENERACION` (pensadas como
// distancia centro-a-centro) se pasan a elk como el hueco borde-a-borde
// que le falta descontar, para no ensanchar el lienzo de más.
const TAMANO_NODO_ELK = 56;
const ESPACIO_MINIMO_ELK = 16;

// Delega en elk (algoritmo `layered`, un Sugiyama real) el orden horizontal
// dentro de cada capa y la minimización de cruces — la propia capa
// (generación) sigue siendo nuestra, vía `capaPorAlcance` o la ventana de
// ego precalculada; elk solo decide "quién va al lado de quién" dentro de
// cada fila que ya le fijamos con `elk.partitioning`.
async function calcularPosiciones(
	nodoPlan: NodoPlan[],
	uniones: UnionDetectada[],
	enlaces: EnlaceGrafo[],
	capa: Map<string, number>,
): Promise<{
	posiciones: Map<string, { x: number; y: number }>;
	quiebres: Map<number, { x: number; y: number }[]>;
}> {
	// La ventana de ego usa capas con signo (centro en 0, ascendientes
	// negativos) — elk solo necesita el orden relativo, así que se normaliza
	// aquí sin tocar el `capa` de dominio que usa el resto del código.
	const valores = [...capa.values()];
	const minCapa = valores.length > 0 ? Math.min(...valores) : 0;
	const particion = (c: number) => String(c - minCapa);

	const nodosElk: ElkNode[] = [
		...nodoPlan.map((n) => ({
			id: n.id,
			width: TAMANO_NODO_ELK,
			height: TAMANO_NODO_ELK,
			layoutOptions: {
				"elk.partitioning.partition": particion(capa.get(n.idEntidad) ?? 0),
			},
		})),
		...uniones.map((u) => ({
			id: u.id,
			width: TAMANO_NODO_ELK,
			height: TAMANO_NODO_ELK,
			layoutOptions: { "elk.partitioning.partition": particion(u.capa) },
		})),
	];

	const edgesElk: ElkExtendedEdge[] = enlaces.map((e, i) => ({
		id: `e${i}`,
		sources: [e.desde],
		targets: [e.hasta],
	}));

	const elk = new ELK();
	const resultado = await elk.layout({
		id: "raiz",
		layoutOptions: {
			"elk.algorithm": "layered",
			"elk.direction": "DOWN",
			"elk.partitioning.activate": "true",
			"elk.spacing.nodeNode": String(
				Math.max(ESPACIO_MINIMO_ELK, ESPACIO_HERMANOS - TAMANO_NODO_ELK),
			),
			"elk.layered.spacing.nodeNodeBetweenLayers": String(
				Math.max(ESPACIO_MINIMO_ELK, ESPACIO_GENERACION - TAMANO_NODO_ELK),
			),
			// Conectores en ángulo recto (§1 del doc de spec): más fáciles de
			// seguir que una diagonal cuando hay muchos cruces potenciales.
			"elk.edgeRouting": "ORTHOGONAL",
			// Colchón explícito entre un tramo y un nodo ajeno por el que
			// pasa cerca — sin esto un conector puede rozar visualmente la
			// casilla de un vecino aunque no la atraviese del todo.
			"elk.spacing.edgeNode": String(ESPACIO_MINIMO_ELK),
			// Sin esto, cada arista que sale de un mismo nodo (p.ej. una
			// unión con media docena de hijos) recibe su propio punto de
			// salida repartido a lo ancho del nodo — y como el punto que de
			// verdad se dibuja es el centro exacto de la casilla (más abajo,
			// `posiciones`), el primer tramo entre ese centro y el punto de
			// salida real de elk queda en diagonal: un "pico" saliendo de
			// cada nodo con varias líneas. Fusionando las aristas que
			// comparten origen o destino, todas salen del mismo punto (el
			// centro) y el primer tramo compartido sí es recto.
			"elk.layered.mergeEdges": "true",
			// Con el heurístico de colocación por defecto (Brandes-Köpf), un
			// hijo de un solo progenitor podía acabar posicionado en medio de
			// la descendencia de una pareja sin ninguna relación con él, solo
			// porque esa columna daba un tramo más recto en algún otro punto
			// del grafo — ilegible, dos familias sin parentesco pegadas visual-
			// mente. `NETWORK_SIMPLEX` (busca el óptimo global de "cercanía",
			// no solo tramos rectos) + más pasadas de `thoroughness` agrupan
			// mucho mejor cada familia. El build tarda igual (~30s): el coste
			// solo pesa en las ~440 llamadas con grafos pequeños de la ventana
			// de ego, donde da igual, y una única llamada grande (grafo
			// completo) no repite lo bastante como para notarse.
			"elk.layered.nodePlacement.strategy": "NETWORK_SIMPLEX",
			"elk.layered.thoroughness": "30",
		},
		children: nodosElk,
		edges: edgesElk,
	});

	const posiciones = new Map<string, { x: number; y: number }>();
	for (const nodo of resultado.children ?? []) {
		posiciones.set(nodo.id, {
			x: (nodo.x ?? 0) + TAMANO_NODO_ELK / 2,
			y: (nodo.y ?? 0) + TAMANO_NODO_ELK / 2,
		});
	}

	// Solo los quiebres intermedios: los extremos los pone `posiciones` (el
	// centro real de cada nodo, no el borde de la caja nominal de 8px que
	// ve elk) para que el conector arranque y termine exactamente donde se
	// pinta cada casilla.
	const quiebres = new Map<number, { x: number; y: number }[]>();
	for (const edge of resultado.edges ?? []) {
		const indice = Number(edge.id.slice(1));
		const puntos = edge.sections?.[0]?.bendPoints;
		if (puntos && puntos.length > 0) {
			quiebres.set(
				indice,
				puntos.map((p) => ({ x: p.x, y: p.y })),
			);
		}
	}

	// Elk minimiza cruces globales, no "que el nodo de unión quede centrado
	// entre sus dos progenitores" — no tiene ese concepto, para elk es un
	// nodo más. El resultado: la unión sale alineada bajo cualquiera de los
	// dos (el que le da un tramo recto a elk), nunca entre ambos, y de paso
	// puede acabar en la misma columna que la descendencia de un progenitor
	// sin relación, como si fuera hermana suya. Se recoloca aquí a mano.
	//
	// Posiciones de los nodos reales (elk ya las coloca de una vez, no
	// cambian en el resto de esta función) — hace falta tenerlas ANTES de
	// la pasada 1 para poder comprobar si el punto "en la fila de los
	// progenitores" de una unión simétrica coincide por casualidad con la
	// posición exacta de un nodo real ajeno (dos hermanos, mismo hueco
	// entre generaciones, un tercer hermano puede acabar justo en medio).
	const entidadesRealesSolas = nodoPlan
		.map((n) => {
			const p = posiciones.get(n.id);
			return p ? { id: n.id, x: p.x, y: p.y } : undefined;
		})
		.filter((n): n is { id: string; x: number; y: number } => n !== undefined);
	const coincideConNodoReal = (
		x: number,
		y: number,
		idsExcluidos: string[],
	): boolean => {
		const mitad = TAMANO_NODO_ELK / 2;
		return entidadesRealesSolas.some(
			(n) =>
				!idsExcluidos.includes(n.id) &&
				Math.abs(n.x - x) < mitad &&
				Math.abs(n.y - y) < mitad,
		);
	};

	// PASADA 1: solo posiciones. Ninguna unión traza su línea todavía —
	// hace falta que las 20 tengan ya su posición FINAL antes de trazar
	// nada, porque el trazado (pasada 2) evita otras uniones además de
	// nodos reales, y una unión trazada antes de tiempo no existiría como
	// obstáculo para las líneas de otra procesada después.
	const entrantesPorUnion = new Map<string, { e: EnlaceGrafo; i: number }[]>();
	const salientesPorUnion = new Map<string, { e: EnlaceGrafo; i: number }[]>();
	for (const u of uniones) {
		const entrantes = enlaces
			.map((e, i) => ({ e, i }))
			.filter(({ e }) => e.hasta === u.id);
		const posPadres = entrantes
			.map(({ e }) => posiciones.get(e.desde))
			.filter((p): p is { x: number; y: number } => p !== undefined);
		if (posPadres.length !== 2) continue; // dato incompleto: se deja como salió de elk

		const salientes = enlaces
			.map((e, i) => ({ e, i }))
			.filter(({ e }) => e.desde === u.id);
		entrantesPorUnion.set(u.id, entrantes);
		salientesPorUnion.set(u.id, salientes);

		const nuevaX = (posPadres[0].x + posPadres[1].x) / 2;
		// Caso normal (los dos progenitores comparten fila, p. ej. Crono y
		// Rea): la unión es el punto de "pareja" y vive en esa misma fila —
		// el tramo hasta los hijos lo recorre aparte el quiebro unión→hijo.
		//
		// Caso asimétrico (un progenitor llega por un camino mucho más
		// largo que el otro — p. ej. Ío frente a Zeus, o Libia frente a
		// Poseidón — y quedan a varias generaciones de distancia), O el
		// punto "en la fila de los progenitores" coincide por casualidad
		// con un nodo real ajeno (dos hermanos contiguos, un tercero puede
		// acabar exactamente en medio): no hay una fila segura única, así
		// que la unión se reparte a medio camino entre progenitores E
		// hijos, para no aterrizar encima de algo que no le corresponde.
		const yPadres = (posPadres[0].y + posPadres[1].y) / 2;
		let nuevaY = yPadres;
		const idsPadres = entrantes.map(({ e }) => e.desde);
		if (
			posPadres[0].y !== posPadres[1].y ||
			coincideConNodoReal(nuevaX, yPadres, idsPadres)
		) {
			const posHijos = salientes
				.map(({ e }) => posiciones.get(e.hasta))
				.filter((p): p is { x: number; y: number } => p !== undefined);
			const posUnionOriginal = posiciones.get(u.id);
			const yHijos =
				posHijos.length > 0
					? posHijos.reduce((s, p) => s + p.y, 0) / posHijos.length
					: (posUnionOriginal?.y ?? yPadres);
			nuevaY = (yPadres + yHijos) / 2;
		}
		posiciones.set(u.id, { x: nuevaX, y: nuevaY });
	}

	// El resto de esta función traza líneas: cada quiebro (dónde gira de
	// vertical a horizontal) no es un punto fijo, se prueban varias alturas
	// y — si ninguna sirve — varios desvíos por una tercera columna, hasta
	// dar con la primera que no atraviese ninguna entidad ajena (nodo real
	// o unión). Hace falta variar tanto porque la unión puede caer varias
	// generaciones por debajo de sus progenitores como porque, aunque no
	// caiga, ahora vive en la misma fila que sus progenitores — una fila ya
	// ocupada por hermanos, otras uniones y las líneas que elk trazó para
	// ellos sin saber que esta unión iba a aparecer ahí después.
	const entidadesReales = [...entidadesRealesSolas];
	// Las uniones se añaden aparte porque su posición final (arriba) no
	// existe hasta que termina la pasada 1 — a diferencia de los nodos
	// reales, que elk ya coloca de una vez.
	for (const u of uniones) {
		const p = posiciones.get(u.id);
		if (p) entidadesReales.push({ id: u.id, x: p.x, y: p.y });
	}

	const cruzaAlguna = (
		idA: string,
		idB: string,
		puntos: { x: number; y: number }[],
	): boolean => {
		const mitad = TAMANO_NODO_ELK / 2;
		for (const caja of entidadesReales) {
			if (caja.id === idA || caja.id === idB) continue;
			for (let i = 0; i < puntos.length - 1; i++) {
				const [p1, p2] = [puntos[i], puntos[i + 1]];
				const minX = Math.min(p1.x, p2.x);
				const maxX = Math.max(p1.x, p2.x);
				const minY = Math.min(p1.y, p2.y);
				const maxY = Math.max(p1.y, p2.y);
				if (
					maxX >= caja.x - mitad &&
					minX <= caja.x + mitad &&
					maxY >= caja.y - mitad &&
					minY <= caja.y + mitad
				) {
					return true;
				}
			}
		}
		return false;
	};

	// Todas las fracciones posibles (0, 0.05, ..., 1), priorizadas por
	// cercanía a la fracción "natural" de cada tipo de tramo — la primera
	// que no choque con nada se usa tal cual, así que en el caso normal
	// (sin obstáculos) el resultado es idéntico al de antes.
	const TODAS_FRACCIONES = Array.from({ length: 21 }, (_, i) => i / 20);
	const fraccionesPriorizadas = (preferida: number): number[] =>
		[...TODAS_FRACCIONES].sort(
			(a, b) => Math.abs(a - preferida) - Math.abs(b - preferida),
		);
	// Rejilla de desvíos por una tercera columna (para cuando ningún
	// quiebro simple queda libre — pasa cuando la columna de `a` y la de
	// `b` tienen cada una algo ajeno en la fila intermedia, y cambiar solo
	// la altura del quiebro no ayuda porque la última vertical siempre
	// acaba cruzando alguna de las dos columnas). Varía tanto la columna
	// del desvío como la altura de sus dos quiebros, no un único valor fijo.
	//
	// La columna del desvío no se limita al tramo entre `a` y `b`: cuando
	// los dos extremos están cerca entre sí (p. ej. dos hermanos contiguos),
	// todo el hueco entre ambos puede estar ocupado por un tercero — hace
	// falta poder salir por fuera, a la izquierda de `a` o a la derecha de
	// `b`, no solo pasar por en medio.
	const DESVIOS_FX_ENTRE = [0.5, 0.4, 0.6, 0.3, 0.7, 0.2, 0.8];
	const MARGEN_ESCAPE = ESPACIO_HERMANOS + TAMANO_NODO_ELK;
	const DESVIOS_Y = [
		[0.15, 0.85],
		[0.25, 0.75],
		[0.1, 0.9],
		[0.35, 0.65],
	] as const;

	// Progenitor→unión: preferida 1 (a la altura de la unión) — cada
	// progenitor baja hasta la fila de la unión y ahí gira, encontrándose
	// con el otro justo en el punto (ver más arriba).
	const PREFERIDA_ENTRADA = 1;
	// Unión→hijo: preferida 0.5 — reparte varios hijos en un tronco común
	// (mergeEdges) sin sesgar hacia ninguno.
	const PREFERIDA_SALIDA = 0.5;
	// Tramo directo (sin unión de por medio): sin preferencia de forma
	// propia, solo hace falta ALGÚN quiebro ortogonal libre.
	const PREFERIDA_DIRECTA = 0.5;

	const buscarQuiebro = (
		idA: string,
		a: { x: number; y: number },
		idB: string,
		b: { x: number; y: number },
		preferida: number,
	): { x: number; y: number }[] => {
		if (a.x === b.x) return [];
		for (const f of fraccionesPriorizadas(preferida)) {
			const y = a.y + (b.y - a.y) * f;
			const puntos = [
				{ x: a.x, y },
				{ x: b.x, y },
			];
			if (!cruzaAlguna(idA, idB, [a, ...puntos, b])) return puntos;
		}
		const columnasDesvio = [
			...DESVIOS_FX_ENTRE.map((fx) => a.x + (b.x - a.x) * fx),
			Math.min(a.x, b.x) - MARGEN_ESCAPE,
			Math.max(a.x, b.x) + MARGEN_ESCAPE,
		];
		for (const [fy1, fy2] of DESVIOS_Y) {
			for (const midX of columnasDesvio) {
				const y1 = a.y + (b.y - a.y) * fy1;
				const y2 = a.y + (b.y - a.y) * fy2;
				const puntos = [
					{ x: a.x, y: y1 },
					{ x: midX, y: y1 },
					{ x: midX, y: y2 },
					{ x: b.x, y: y2 },
				];
				if (!cruzaAlguna(idA, idB, [a, ...puntos, b])) return puntos;
			}
		}
		// Zona ya muy congestionada incluso con la rejilla de desvíos — no
		// hay más que probar, se deja el quiebro simple en la fracción
		// preferida.
		const y = a.y + (b.y - a.y) * preferida;
		return [
			{ x: a.x, y },
			{ x: b.x, y },
		];
	};

	// PASADA 2: con las 20 uniones ya en su posición final, se traza cada
	// tramo progenitor↔unión↔hijo.
	const indicesDeUniones = new Set<number>();
	for (const u of uniones) {
		const nuevaPos = posiciones.get(u.id);
		const entrantes = entrantesPorUnion.get(u.id);
		const salientes = salientesPorUnion.get(u.id);
		if (!nuevaPos || !entrantes || !salientes) continue;

		for (const { e, i } of entrantes) {
			const posPadre = posiciones.get(e.desde);
			if (!posPadre) continue;
			quiebres.set(
				i,
				buscarQuiebro(e.desde, posPadre, u.id, nuevaPos, PREFERIDA_ENTRADA),
			);
			indicesDeUniones.add(i);
		}
		for (const { e, i } of salientes) {
			const posHijo = posiciones.get(e.hasta);
			if (!posHijo) continue;
			quiebres.set(
				i,
				buscarQuiebro(u.id, nuevaPos, e.hasta, posHijo, PREFERIDA_SALIDA),
			);
			indicesDeUniones.add(i);
		}
	}

	// PASADA 3: el resto de tramos (sin ninguna unión de por medio) ya
	// traía un trazado válido de elk, pero elk lo calculó sin saber que
	// una unión iba a aparecer más tarde en su camino (pasada 1) — se
	// revalida contra el resultado final y solo se recalcula si hace
	// falta, para no tocar el trazado de elk (normalmente mejor que el
	// quiebro local de aquí) donde ya sigue siendo válido.
	for (let i = 0; i < enlaces.length; i++) {
		if (indicesDeUniones.has(i)) continue;
		const e = enlaces[i];
		const posA = posiciones.get(e.desde);
		const posB = posiciones.get(e.hasta);
		if (!posA || !posB) continue;
		const actuales = quiebres.get(i) ?? [];
		if (!cruzaAlguna(e.desde, e.hasta, [posA, ...actuales, posB])) continue;
		quiebres.set(
			i,
			buscarQuiebro(e.desde, posA, e.hasta, posB, PREFERIDA_DIRECTA),
		);
	}

	return { posiciones, quiebres };
}

// Cortes por percentil, no por valor absoluto: `importancia` no tiene una
// escala fija (depende de cuántas relaciones de cualquier tipo tenga cada
// entidad en el grafo completo de la materia), así que un umbral fijo se
// desajustaría según crezca el contenido. Con percentiles el tronco es
// siempre "el 15% más conectado de esta vista", sin recalibrar a mano.
function calcularPesos(
	idsVista: Set<string>,
	importancia: Map<string, number>,
): Map<string, "grande" | "normal" | "pequeno"> {
	const valores = [...idsVista]
		.map((id) => importancia.get(id) ?? 0)
		.sort((a, b) => a - b);
	const percentil = (p: number) =>
		valores[Math.min(valores.length - 1, Math.floor(p * valores.length))] ?? 0;
	const corteGrande = percentil(0.85);
	const cortePequeno = percentil(0.5);

	const pesos = new Map<string, "grande" | "normal" | "pequeno">();
	for (const id of idsVista) {
		const v = importancia.get(id) ?? 0;
		pesos.set(
			id,
			v >= corteGrande ? "grande" : v <= cortePequeno ? "pequeno" : "normal",
		);
	}
	return pesos;
}

// El grosor de un enlace toma el peso de quien de los dos extremos es una
// entidad real (nunca el de la unión, que es un punto sintético sin peso
// propio): el progenitor si el enlace sale de él hacia una unión o un hijo
// directo, el hijo si el enlace sale de una unión.
const GROSOR_POR_PESO = {
	grande: "grueso",
	normal: "normal",
	pequeno: "fino",
} as const;

function calcularGrosor(
	enlaces: EnlaceGrafo[],
	nodoPorId: Map<string, NodoGrafo>,
): void {
	for (const e of enlaces) {
		const refId = e.tipo === "union_de" ? e.hasta : e.desde;
		const peso = nodoPorId.get(refId)?.peso ?? "normal";
		e.grosor = GROSOR_POR_PESO[peso];
	}
}

// Hijos visibles por defecto antes de agrupar el resto (§4): mismo orden de
// magnitud que `MAX_HIJOS_LINEA_DIRECTA`, la cifra ya establecida en este
// fichero para "cuántos hijos caben sin abrumar". Un resto de 1-2 no
// justifica un grupo (el ahorro visual es menor que el propio marcador), así
// que si no llega a `MIN_GRUPO_COLAPSO` se deja tal cual, sin colapsar.
const UMBRAL_COLAPSO = 6;
const MIN_GRUPO_COLAPSO = 3;

// Reparte los hijos de cada progenitor/unión con demasiados en "visibles"
// (los de mayor `peso`) y "colapsados" (el resto, agrupados tras un
// marcador `▸ N hijos` — ver `GrupoColapsado`). Se llama con `nodos` y
// `enlaces` ya en sus posiciones finales: la posición del marcador es el
// centroide de los hijos que agrupa, así que necesita que esas posiciones
// ya sean definitivas.
function agruparRamasDensas(
	nodos: NodoGrafo[],
	enlaces: EnlaceGrafo[],
): GrupoColapsado[] {
	const nodoPorId = new Map(nodos.map((n) => [n.id, n]));

	const hijosPorOrigen = new Map<string, EnlaceGrafo[]>();
	for (const e of enlaces) {
		// Un enlace "cuenta como hijo" cuando su destino es un nodo real de
		// esta vista (progenitor→hijo directo o unión→hijo) — un enlace
		// progenitor→unión no añade densidad propia, la unión no se dibuja
		// como una casilla más.
		if (nodoPorId.has(e.hasta)) agregar(hijosPorOrigen, e.desde, e);
	}

	const grupos: GrupoColapsado[] = [];
	for (const [origen, hijos] of hijosPorOrigen) {
		if (hijos.length <= UMBRAL_COLAPSO) continue;

		const orden = ["grande", "normal", "pequeno"] as const;
		const ordenados = [...hijos].sort((a, b) => {
			const pa = nodoPorId.get(a.hasta)?.peso ?? "normal";
			const pb = nodoPorId.get(b.hasta)?.peso ?? "normal";
			return (
				orden.indexOf(pa) - orden.indexOf(pb) || a.hasta.localeCompare(b.hasta)
			);
		});
		const resto = ordenados.slice(UMBRAL_COLAPSO);
		if (resto.length < MIN_GRUPO_COLAPSO) continue;

		const grupoId = `colapso:${origen}`;
		const posiciones = resto
			.map((e) => nodoPorId.get(e.hasta))
			.filter((n): n is NodoGrafo => n !== undefined);
		for (const n of posiciones) n.colapsadoEn = grupoId;

		grupos.push({
			id: grupoId,
			x: posiciones.reduce((s, n) => s + n.x, 0) / posiciones.length,
			y: posiciones.reduce((s, n) => s + n.y, 0) / posiciones.length,
			cantidad: posiciones.length,
			origen,
		});
	}
	return grupos;
}

export async function construirVistaFamilia(
	grafo: Grafo,
	ventana?: VentanaEgo,
): Promise<VistaGrafo | undefined> {
	const familia = FAMILIA_PARENTESCO;
	const todasGenealogicas = grafo.aristas.filter((a) =>
		familia.tipos.includes(a.relacion.tipo),
	);
	const importancia = contarRelaciones(grafo.aristas);

	let aristas = todasGenealogicas;
	let capaPrecalculada: Map<string, number> | undefined;
	if (ventana) {
		const sub = ventana.soloLineaDirecta
			? subgrafoLineaDirecta(
					todasGenealogicas,
					ventana.centro,
					ventana.profundidad,
					ventana.profundidadDescendientes ?? ventana.profundidad,
					importancia,
				)
			: subgrafoEgo(todasGenealogicas, ventana.centro, ventana.profundidad);
		aristas = sub.aristas;
		capaPrecalculada = sub.capa;
		if (capaPrecalculada.size <= 1) return undefined; // sin antepasados ni descendientes conocidos
	} else if (aristas.length === 0) {
		return undefined;
	}

	const ids = new Set<string>();
	if (capaPrecalculada) {
		for (const id of capaPrecalculada.keys()) ids.add(id);
	} else {
		for (const a of aristas) {
			ids.add(a.origenId);
			ids.add(a.relacion.destino);
		}
	}

	const capa =
		capaPrecalculada ??
		(() => {
			const hijosDe = new Map<string, string[]>();
			const padresDe = new Map<string, string[]>();
			for (const a of aristas) {
				const rol = normalizarRol(a);
				agregar(hijosDe, rol.padreId, rol.hijoId);
				agregar(padresDe, rol.hijoId, rol.padreId);
			}
			return capaPorAlcance(ids, hijosDe, padresDe);
		})();

	const { uniones: unionesDetectadas, enlaces: enlacesBase } = detectarUniones(
		aristas,
		capa,
	);

	// La duplicación de hubs (§3) solo aplica a la vista de toda la materia
	// — ver el comentario de `aplicarDuplicados`.
	const { nodos: nodoPlan, enlaces } = ventana
		? {
				nodos: [...ids].map(
					(id): NodoPlan => ({ id, idEntidad: id, duplicado: false }),
				),
				enlaces: enlacesBase,
			}
		: aplicarDuplicados(ids, unionesDetectadas, enlacesBase);

	const { posiciones, quiebres } = await calcularPosiciones(
		nodoPlan,
		unionesDetectadas,
		enlaces,
		capa,
	);
	for (const [indice, puntos] of quiebres) {
		const enlace = enlaces[indice];
		if (enlace) enlace.puntos = puntos;
	}

	// Peso visual (§4) solo en la vista de toda la materia — ver el
	// comentario de `NodoGrafo.peso`.
	const pesos = ventana ? undefined : calcularPesos(ids, importancia);

	const nodos: NodoGrafo[] = nodoPlan
		.map((n): NodoGrafo | undefined => {
			const entidad = obtenerEntidad(grafo, n.idEntidad);
			const pos = posiciones.get(n.id);
			if (!entidad || !pos) return undefined;
			return {
				id: n.id,
				idEntidad: n.idEntidad,
				duplicado: n.duplicado,
				peso: pesos?.get(n.idEntidad),
				nombre: entidad.nombre,
				tipo: entidad.tipo,
				...pos,
			};
		})
		.filter((n): n is NodoGrafo => n !== undefined);

	// La posición de la unión sale de elk como la de cualquier otro nodo,
	// salvo que sus dos progenitores estén resueltos — en ese caso ya se
	// recolocó a mano en `calcularPosiciones` (con su propio tramo en
	// ángulo recto reconstruido a la vez, para no romper la consistencia).
	const uniones: UnionGrafo[] = unionesDetectadas
		.map((u) => {
			const pos = posiciones.get(u.id);
			if (!pos) return undefined;
			return { id: u.id, padres: u.padres, ...pos };
		})
		.filter((u): u is UnionGrafo => u !== undefined);

	const xs = [...nodos.map((n) => n.x), ...uniones.map((u) => u.x)];
	const ys = [...nodos.map((n) => n.y), ...uniones.map((u) => u.y)];
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	for (const n of nodos) {
		n.x = n.x - minX + MARGEN;
		n.y = n.y - minY + MARGEN;
	}
	for (const u of uniones) {
		u.x = u.x - minX + MARGEN;
		u.y = u.y - minY + MARGEN;
	}
	for (const e of enlaces) {
		if (!e.puntos) continue;
		e.puntos = e.puntos.map((p) => ({
			x: p.x - minX + MARGEN,
			y: p.y - minY + MARGEN,
		}));
	}

	// Grosor de enlace y colapso de ramas densas (§4): igual que el peso de
	// nodo, solo en la vista de toda la materia — y solo tiene sentido una
	// vez que `nodos` está en sus posiciones finales (el marcador de grupo
	// se coloca en el centroide de lo que oculta).
	const grupos: GrupoColapsado[] = [];
	if (!ventana) {
		calcularGrosor(enlaces, new Map(nodos.map((n) => [n.id, n])));
		grupos.push(...agruparRamasDensas(nodos, enlaces));
	}

	// Incluye la `y` de las uniones, no solo la de `nodos`: en el caso raro
	// donde una unión cae en una capa sin ningún nodo real propio (§5, filtro
	// por generación — necesita una fila válida para cada elemento que
	// filtra), su fila no debe quedar fuera de esta lista.
	const filas = [
		...new Set([...nodos.map((n) => n.y), ...uniones.map((u) => u.y)]),
	].sort((a, b) => a - b);

	return {
		familia,
		nodos,
		uniones,
		enlaces,
		grupos,
		filas,
		ancho: maxX - minX + MARGEN * 2,
		alto: maxY - minY + MARGEN * 2,
	};
}
