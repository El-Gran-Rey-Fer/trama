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

export interface VistaGrafo {
	familia: FamiliaRelacion;
	nodos: NodoGrafo[];
	uniones: UnionGrafo[];
	enlaces: EnlaceGrafo[];
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

// Cuando un hijo tiene sus dos progenitores en la misma capa (el caso
// normal: padre y madre son de la misma generación), se sustituyen sus dos
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
		if (
			padres.length !== 2 ||
			capaA === undefined ||
			capaB === undefined ||
			capaA !== capaB
		) {
			// Un solo progenitor conocido, o datos que no caen en la misma
			// capa (no debería pasar con genealogía bien formada): sin
			// fusión, línea directa por cada progenitor conocido.
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

		const [a, b] = padres;
		const clave = [a.padreId, b.padreId].sort().join("+");
		let union = unionPorPareja.get(clave);
		if (!union) {
			union = {
				id: `union:${clave}`,
				padres: [a.padreId, b.padreId],
				capa: capaA,
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

// Tamaño nominal de cada nodo para elk: el layout siempre ha tratado los
// nodos como puntos (el tamaño visual real lo decide la casilla en CSS,
// sobre las coordenadas ya resueltas aquí), así que basta un tamaño pequeño
// y uniforme — el espaciado real lo dan las opciones `elk.spacing.*` de
// abajo, pensadas para reproducir el ritmo visual de siempre
// (`ESPACIO_HERMANOS`/`ESPACIO_GENERACION`).
const TAMANO_NODO_ELK = 8;

// Delega en elk (algoritmo `layered`, un Sugiyama real) el orden horizontal
// dentro de cada capa y la minimización de cruces — la propia capa
// (generación) sigue siendo nuestra, vía `capaPorAlcance` o la ventana de
// ego precalculada; elk solo decide "quién va al lado de quién" dentro de
// cada fila que ya le fijamos con `elk.partitioning`.
async function calcularPosiciones(
	ids: Set<string>,
	uniones: UnionDetectada[],
	enlaces: EnlaceGrafo[],
	capa: Map<string, number>,
): Promise<Map<string, { x: number; y: number }>> {
	// La ventana de ego usa capas con signo (centro en 0, ascendientes
	// negativos) — elk solo necesita el orden relativo, así que se normaliza
	// aquí sin tocar el `capa` de dominio que usa el resto del código.
	const valores = [...capa.values()];
	const minCapa = valores.length > 0 ? Math.min(...valores) : 0;
	const particion = (c: number) => String(c - minCapa);

	const nodosElk: ElkNode[] = [
		...[...ids].map((id) => ({
			id,
			width: TAMANO_NODO_ELK,
			height: TAMANO_NODO_ELK,
			layoutOptions: {
				"elk.partitioning.partition": particion(capa.get(id) ?? 0),
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
			"elk.spacing.nodeNode": String(ESPACIO_HERMANOS),
			"elk.layered.spacing.nodeNodeBetweenLayers": String(ESPACIO_GENERACION),
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
	return posiciones;
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

	const { uniones: unionesDetectadas, enlaces } = detectarUniones(
		aristas,
		capa,
	);
	const posiciones = await calcularPosiciones(
		ids,
		unionesDetectadas,
		enlaces,
		capa,
	);

	const nodos: NodoGrafo[] = [...ids]
		.map((id) => {
			const entidad = obtenerEntidad(grafo, id);
			const pos = posiciones.get(id);
			if (!entidad || !pos) return undefined;
			return { id, nombre: entidad.nombre, tipo: entidad.tipo, ...pos };
		})
		.filter((n): n is NodoGrafo => n !== undefined);

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

	const filas = [...new Set(nodos.map((n) => n.y))].sort((a, b) => a - b);

	return {
		familia,
		nodos,
		uniones,
		enlaces,
		filas,
		ancho: maxX - minX + MARGEN * 2,
		alto: maxY - minY + MARGEN * 2,
	};
}
