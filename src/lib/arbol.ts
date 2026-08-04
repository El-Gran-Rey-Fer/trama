import { hierarchy, tree } from "d3-hierarchy";
import { type Entidad, type Grafo, obtenerEntidad } from "./grafo";

// Plan de imágenes y álbum, paso A7. Igual que `ocurre_en`/`participa_en` en
// grafo.ts, estos son nombres de vocabulario del esquema (tipos de
// relación), no entidades concretas: hardcodearlos aquí no rompe la regla
// invariante.
export const TIPOS_GENEALOGIA = ["padre_de", "madre_de", "hijo_de"];
const TIPOS_ASCENDENCIA = ["hijo_de"];
const TIPOS_DESCENDENCIA = ["padre_de", "madre_de"];

export interface NodoArbol {
	id: string;
	nombre: string;
	tipo: string;
	clave: string;
	x: number;
	y: number;
	esRaiz: boolean;
}

export interface EnlaceArbol {
	desde: string;
	hasta: string;
}

export interface ArbolGenealogico {
	nodos: NodoArbol[];
	enlaces: EnlaceArbol[];
	ancho: number;
	alto: number;
}

interface NodoCrudo {
	entidad: Entidad;
	clave: string;
	hijos: NodoCrudo[];
}

const ESPACIO_HERMANOS = 90;
const ESPACIO_GENERACION = 130;
const MARGEN = 45;

// Antepasados compartidos (p. ej. Urano y Gea vistos desde Zeus vía Crono y
// vía Rea) se duplican como hojas separadas en vez de fusionarse en un nodo
// pareja: es más simple y es lo estándar en un diagrama de abanico
// genealógico. Por eso cada instancia lleva su propia `clave`, distinta del
// `id` de la entidad que representa.
function construirSubarbol(
	grafo: Grafo,
	idRaiz: string,
	tipos: string[],
	profundidad: number,
): NodoCrudo | undefined {
	let contador = 0;
	function paso(id: string, nivel: number): NodoCrudo | undefined {
		const entidad = obtenerEntidad(grafo, id);
		if (!entidad) return undefined;
		contador += 1;
		const clave = `${id}#${contador}`;
		let hijos: NodoCrudo[] = [];
		if (nivel < profundidad) {
			const destinos = new Set(
				entidad.relaciones
					.filter((r) => tipos.includes(r.tipo))
					.map((r) => r.destino),
			);
			hijos = [...destinos]
				.map((destinoId) => paso(destinoId, nivel + 1))
				.filter((n): n is NodoCrudo => n !== undefined);
		}
		return { entidad, clave, hijos };
	}
	return paso(idRaiz, 0);
}

function layoutSubarbol(
	raiz: NodoCrudo,
	invertirY: boolean,
): { nodos: NodoArbol[]; enlaces: EnlaceArbol[] } {
	const raizH = hierarchy(raiz, (d) => d.hijos);
	tree<NodoCrudo>().nodeSize([ESPACIO_HERMANOS, ESPACIO_GENERACION])(raizH);
	const offsetX = raizH.x ?? 0;

	const nodos: NodoArbol[] = raizH.descendants().map((n) => ({
		id: n.data.entidad.id,
		nombre: n.data.entidad.nombre,
		tipo: n.data.entidad.tipo,
		clave: n.data.clave,
		x: (n.x ?? 0) - offsetX,
		y: invertirY ? -(n.y ?? 0) : (n.y ?? 0),
		esRaiz: n.depth === 0,
	}));

	const enlaces: EnlaceArbol[] = raizH
		.links()
		.map((l) => ({ desde: l.source.data.clave, hasta: l.target.data.clave }));

	return { nodos, enlaces };
}

// Red-ego a profundidad 2 desde una entidad, solo relaciones de genealogía:
// dos generaciones hacia arriba y dos hacia abajo, compartiendo la raíz.
export function construirArbolGenealogico(
	grafo: Grafo,
	id: string,
	profundidad = 2,
): ArbolGenealogico | undefined {
	const raizAscendientes = construirSubarbol(
		grafo,
		id,
		TIPOS_ASCENDENCIA,
		profundidad,
	);
	const raizDescendientes = construirSubarbol(
		grafo,
		id,
		TIPOS_DESCENDENCIA,
		profundidad,
	);
	if (!raizAscendientes || !raizDescendientes) return undefined;

	const ascendientes = layoutSubarbol(raizAscendientes, true);
	const descendientes = layoutSubarbol(raizDescendientes, false);

	// La raíz existe en los dos subárboles; se conserva solo la de
	// descendientes.
	const nodos = [
		...descendientes.nodos,
		...ascendientes.nodos.filter((n) => !n.esRaiz),
	];
	const enlaces = [...descendientes.enlaces, ...ascendientes.enlaces];

	if (nodos.length <= 1) return undefined; // sin antepasados ni descendientes conocidos

	const xs = nodos.map((n) => n.x);
	const ys = nodos.map((n) => n.y);
	const minX = Math.min(...xs);
	const maxX = Math.max(...xs);
	const minY = Math.min(...ys);
	const maxY = Math.max(...ys);

	for (const n of nodos) {
		n.x = n.x - minX + MARGEN;
		n.y = n.y - minY + MARGEN;
	}

	return {
		nodos,
		enlaces,
		ancho: maxX - minX + MARGEN * 2,
		alto: maxY - minY + MARGEN * 2,
	};
}
