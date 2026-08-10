import { TIPOS_GENEALOGIA } from "./arbol";
import { type Arista, type Grafo, obtenerEntidad } from "./grafo";

// Árbol de parentesco navegable (fuera del plan de imágenes y álbum
// original, pedido después de A7). El propio calendario-construccion.md
// avisa de que "el grafo entero" con 200 entidades es una madeja ilegible:
// esta vista se queda solo con la familia de relación de parentesco
// (padre/madre/hijo), que es la que tiene layout resuelto y la que de
// verdad se quiere consultar. El resto de familias de relación (consortes,
// relatos, lugares, objetos, acciones, obras) se probaron y se
// descartaron: no aportaban sobre lo que ya cuenta la ficha de cada
// entidad.
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
}

export interface VistaGrafo {
	familia: FamiliaRelacion;
	nodos: NodoGrafo[];
	uniones: UnionGrafo[];
	enlaces: EnlaceGrafo[];
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

// Layout por capas (generación). Capa = camino más largo desde una raíz
// (nadie declarado como su padre/madre), no el campo `generacion` de la
// entidad: ese campo solo está relleno en 8 de 58 entidades y quedaría
// vacío para el resto.
function layoutJerarquico(
	aristas: Arista[],
): Map<string, { x: number; y: number }> {
	// Solo padre_de/madre_de/hijo_de deciden la capa (la generación); los
	// hermanos no tienen dirección jerárquica y ya caen en la misma capa que
	// sus padres compartidos, así que se excluyen aquí y solo se dibujan como
	// enlace en `construirVistaFamilia`.
	const padreHijo: { padre: string; hijo: string }[] = aristas
		.filter((a) => TIPOS_GENEALOGIA.includes(a.relacion.tipo))
		.map((a) =>
			a.relacion.tipo === "hijo_de"
				? { padre: a.relacion.destino, hijo: a.origenId }
				: { padre: a.origenId, hijo: a.relacion.destino },
		);

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

	// Pareja = comparte al menos un hijo con padre_de/madre_de ya resueltos
	// (`fusionarUniones` los fusiona en un solo nodo de unión). Si sus dos
	// miembros no caen en columnas contiguas, ese nodo de unión aparece a
	// medio camino de toda la fila, y sus líneas cruzan por encima de
	// hermanos que no tienen nada que ver — así que aquí se agrupan antes de
	// asignar x.
	const parejas = new Map<string, string>();
	{
		const padresPorHijo = new Map<string, string[]>();
		for (const a of aristas) {
			if (a.relacion.tipo !== "padre_de" && a.relacion.tipo !== "madre_de")
				continue;
			agregar(padresPorHijo, a.relacion.destino, a.origenId);
		}
		for (const lista of padresPorHijo.values()) {
			if (lista.length !== 2) continue;
			const [a, b] = lista;
			if (!parejas.has(a)) parejas.set(a, b);
			if (!parejas.has(b)) parejas.set(b, a);
		}
	}

	// Kahn por grado de entrada, relajando la capa al camino más largo visto.
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

	const porCapa = new Map<number, string[]>();
	for (const [id, l] of capa) {
		const lista = porCapa.get(l);
		if (lista) lista.push(id);
		else porCapa.set(l, [id]);
	}

	const xPorId = new Map<string, number>();
	function baricentro(id: string): number {
		const padres = padresDe.get(id) ?? [];
		if (padres.length === 0) return Number.POSITIVE_INFINITY;
		return padres.reduce((s, p) => s + (xPorId.get(p) ?? 0), 0) / padres.length;
	}

	const capasOrdenadas = [...porCapa.keys()].sort((a, b) => a - b);
	for (const l of capasOrdenadas) {
		const nodos = [...(porCapa.get(l) ?? [])];
		if (l === 0) nodos.sort();
		else nodos.sort((a, b) => baricentro(a) - baricentro(b));

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

		agrupados.forEach((id, idx) => {
			xPorId.set(id, idx * ESPACIO_HERMANOS);
		});
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

// Solo padre_de/madre_de traen el rol ya resuelto (ver el comentario de
// resolución de género en grafo.ts): son los únicos que pueden fusionarse en
// un nodo de unión. `hijo_de` sin resolver (estirpes que nacen "de la
// sangre" de un solo progenitor sin género conocido, tipo melias/gigantes
// apuntando a Urano) se queda como línea directa — no hay pareja que fusionar.
const TIPOS_ROL_CONOCIDO = ["padre_de", "madre_de"];

// Cuando un hijo tiene sus dos progenitores en la misma capa (el caso normal:
// padre y madre son de la misma generación), se sustituyen sus dos líneas
// directas por un nodo de unión a medio camino entre ambos: una línea corta
// de cada progenitor hasta la unión (con su color de padre/madre) y una sola
// línea neutra de la unión a cada hijo compartido, en vez de dos líneas por
// hijo que se cruzan entre sí.
function fusionarUniones(
	aristasGenealogicas: Arista[],
	posiciones: Map<string, { x: number; y: number }>,
): { uniones: UnionGrafo[]; enlaces: EnlaceGrafo[] } {
	const porHijo = new Map<string, { padreId: string; tipo: string }[]>();
	const directas: Arista[] = [];
	for (const a of aristasGenealogicas) {
		if (!TIPOS_ROL_CONOCIDO.includes(a.relacion.tipo)) {
			directas.push(a);
			continue;
		}
		agregar(porHijo, a.relacion.destino, {
			padreId: a.origenId,
			tipo: a.relacion.tipo,
		});
	}

	const uniones: UnionGrafo[] = [];
	const unionPorPareja = new Map<string, UnionGrafo>();
	const enlaces: EnlaceGrafo[] = directas.map((a) => ({
		desde: a.origenId,
		hasta: a.relacion.destino,
		tipo: a.relacion.tipo,
		color: colorDeTipo(FAMILIA_PARENTESCO, a.relacion.tipo),
	}));

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
			union = { id: `union:${clave}`, x: (posA.x + posB.x) / 2, y: posA.y };
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

export function construirVistaFamilia(grafo: Grafo): VistaGrafo | undefined {
	const familia = FAMILIA_PARENTESCO;
	const aristas = grafo.aristas.filter((a) =>
		familia.tipos.includes(a.relacion.tipo),
	);
	if (aristas.length === 0) return undefined;

	const ids = new Set<string>();
	for (const a of aristas) {
		ids.add(a.origenId);
		ids.add(a.relacion.destino);
	}

	const posiciones = layoutJerarquico(aristas);

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

	return {
		familia,
		nodos,
		uniones,
		enlaces,
		ancho: maxX - minX + MARGEN * 2,
		alto: maxY - minY + MARGEN * 2,
	};
}
