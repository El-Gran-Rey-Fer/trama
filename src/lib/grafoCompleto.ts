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
// esta misma vista (línea directa o nodo de unión — ver `fusionarUniones`),
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

// Como `subgrafoEgo`, pero la ascendencia solo asciende (nunca vuelve a
// bajar a otros hijos de un progenitor) y el descenso solo desciende —
// así que un progenitor con una camada numerosa no cuela a los hermanos del
// centro, y un hijo con dos progenitores solo trae la arista del progenitor
// que sí es línea directa del centro, no a su pareja.
function subgrafoLineaDirecta(
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

	let fronteraArriba = [centro];
	for (let paso = 0; paso < profundidad; paso++) {
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
	for (let paso = 0; paso < profundidad; paso++) {
		const siguiente: string[] = [];
		for (const id of fronteraAbajo) {
			const c = capa.get(id) ?? 0;
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

// Layout por capas (generación): orden horizontal por baricentro de los
// progenitores (con importancia y orden alfabético como desempate) más
// agrupado de parejas contiguas, y una segunda pasada de abajo hacia
// arriba que centra cada nodo sobre sus hijos. Sin `capaPrecalculada`, la
// capa se calcula por alcance desde las raíces (vista de toda la
// materia); con ella (ventana de ego — ver `subgrafoEgo`), se usa tal
// cual, con signo — el resto del layout es agnóstico al rango de `capa`.
function layoutJerarquico(
	aristas: Arista[],
	importancia: Map<string, number>,
	capaPrecalculada?: Map<string, number>,
): Map<string, { x: number; y: number }> {
	const padreHijo = aristas.map(normalizarRol).map((r) => ({
		padre: r.padreId,
		hijo: r.hijoId,
	}));

	const ids = new Set<string>();
	for (const a of aristas) {
		ids.add(a.origenId);
		ids.add(a.relacion.destino);
	}

	const hijosDe = new Map<string, string[]>();
	const padresDe = new Map<string, string[]>();
	for (const e of padreHijo) {
		agregar(hijosDe, e.padre, e.hijo);
		agregar(padresDe, e.hijo, e.padre);
	}

	// Pareja = comparte al menos un hijo con rol ya resuelto (`fusionarUniones`
	// los fusiona en un solo nodo de unión). Si sus dos miembros no caen en
	// columnas contiguas, ese nodo de unión aparece a medio camino de toda la
	// fila, y sus líneas cruzan por encima de hermanos que no tienen nada que
	// ver — así que aquí se agrupan antes de asignar x.
	const parejas = new Map<string, string>();
	{
		const padresPorHijo = new Map<string, string[]>();
		for (const { padre, hijo } of padreHijo)
			agregar(padresPorHijo, hijo, padre);
		for (const lista of padresPorHijo.values()) {
			if (lista.length !== 2) continue;
			const [a, b] = lista;
			if (!parejas.has(a)) parejas.set(a, b);
			if (!parejas.has(b)) parejas.set(b, a);
		}
	}

	const capa = capaPrecalculada ?? capaPorAlcance(ids, hijosDe, padresDe);

	const porCapa = new Map<number, string[]>();
	for (const [id, l] of capa) agregar(porCapa, l, id);

	const xPorId = new Map<string, number>();
	function baricentro(id: string): number {
		const padres = padresDe.get(id) ?? [];
		if (padres.length === 0) return Number.POSITIVE_INFINITY;
		return padres.reduce((s, p) => s + (xPorId.get(p) ?? 0), 0) / padres.length;
	}

	const ordenPorCapa = new Map<number, string[]>();
	const capasOrdenadas = [...porCapa.keys()].sort((a, b) => a - b);
	for (const l of capasOrdenadas) {
		const nodos = [...(porCapa.get(l) ?? [])];
		// Un único comparador para todas las capas: baricentro primero (sin
		// progenitores conocidos en la ventana, ambos dan Infinity y se cae a
		// importancia/alfabético — el caso de las raíces de la vista completa,
		// o del extremo visible de una ventana de ego), importancia como
		// desempate en vez del orden de inserción, id como último desempate
		// para que el resultado sea determinista.
		nodos.sort((a, b) => {
			const ba = baricentro(a);
			const bb = baricentro(b);
			if (ba !== bb && (Number.isFinite(ba) || Number.isFinite(bb)))
				return ba - bb;
			return (
				(importancia.get(b) ?? 0) - (importancia.get(a) ?? 0) ||
				a.localeCompare(b)
			);
		});

		const vistos = new Set<string>();
		const agrupados: string[] = [];
		for (const id of nodos) {
			if (vistos.has(id)) continue;
			vistos.add(id);
			agrupados.push(id);
			const parejaId = parejas.get(id);
			if (parejaId && !vistos.has(parejaId) && capa.get(parejaId) === l) {
				vistos.add(parejaId);
				agrupados.push(parejaId);
			}
		}

		ordenPorCapa.set(l, agrupados);
		agrupados.forEach((id, idx) => {
			xPorId.set(id, idx * ESPACIO_HERMANOS);
		});
	}

	// Centrado de abajo hacia arriba: cada nodo se reposiciona (sin
	// reordenar) sobre la media de sus hijos, de la capa más profunda a la
	// más alta. Una sola pasada basta porque cada capa solo depende de la de
	// abajo, ya recalculada. Cuando el hueco a la izquierda no alcanza para
	// centrar del todo, `Math.max` empuja lo mínimo necesario en vez de
	// romper el espaciado o el orden ya establecido.
	for (const l of [...capasOrdenadas].reverse()) {
		const orden = ordenPorCapa.get(l) ?? [];
		let anterior = Number.NEGATIVE_INFINITY;
		for (const id of orden) {
			const hijos = hijosDe.get(id) ?? [];
			const deseada =
				hijos.length > 0
					? hijos.reduce((s, h) => s + (xPorId.get(h) ?? 0), 0) / hijos.length
					: (xPorId.get(id) ?? 0);
			const x = Math.max(deseada, anterior + ESPACIO_HERMANOS);
			xPorId.set(id, x);
			anterior = x;
		}
	}

	const posiciones = new Map<string, { x: number; y: number }>();
	for (const id of ids) {
		posiciones.set(id, {
			x: xPorId.get(id) ?? 0,
			y: (capa.get(id) ?? 0) * ESPACIO_GENERACION,
		});
	}
	return posiciones;
}

// Cuando un hijo tiene sus dos progenitores en la misma capa (el caso
// normal: padre y madre son de la misma generación), se sustituyen sus dos
// líneas directas por un nodo de unión a medio camino entre ambos: líneas
// cortas de cada progenitor a la unión (con su color de padre/madre) y una
// sola línea neutra de la unión a cada hijo compartido, en vez de dos
// líneas por hijo que se cruzan entre sí.
function fusionarUniones(
	aristasGenealogicas: Arista[],
	posiciones: Map<string, { x: number; y: number }>,
): { uniones: UnionGrafo[]; enlaces: EnlaceGrafo[] } {
	const porHijo = new Map<
		string,
		{ padreId: string; tipo: "padre_de" | "madre_de" }[]
	>();
	for (const a of aristasGenealogicas) {
		const rol = normalizarRol(a);
		agregar(porHijo, rol.hijoId, { padreId: rol.padreId, tipo: rol.tipo });
	}

	const uniones: UnionGrafo[] = [];
	const unionPorPareja = new Map<string, UnionGrafo>();
	const enlaces: EnlaceGrafo[] = [];

	for (const [hijoId, padres] of porHijo) {
		const posA = padres[0] && posiciones.get(padres[0].padreId);
		const posB = padres[1] && posiciones.get(padres[1].padreId);
		if (padres.length !== 2 || !posA || !posB || posA.y !== posB.y) {
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
				x: (posA.x + posB.x) / 2,
				y: posA.y,
				padres: [a.padreId, b.padreId],
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

export function construirVistaFamilia(
	grafo: Grafo,
	ventana?: VentanaEgo,
): VistaGrafo | undefined {
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

	const posiciones = layoutJerarquico(aristas, importancia, capaPrecalculada);

	const nodos: NodoGrafo[] = [...ids]
		.map((id) => {
			const entidad = obtenerEntidad(grafo, id);
			const pos = posiciones.get(id);
			if (!entidad || !pos) return undefined;
			return { id, nombre: entidad.nombre, tipo: entidad.tipo, ...pos };
		})
		.filter((n): n is NodoGrafo => n !== undefined);

	const { uniones, enlaces } = fusionarUniones(aristas, posiciones);

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
