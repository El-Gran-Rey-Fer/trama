import { TIPOS_GENEALOGIA } from "./arbol";
import { type Arista, type Grafo, obtenerEntidad } from "./grafo";

// Súper-grafo navegable (fuera del plan de imágenes y álbum original, pedido
// después de A7). Deliberadamente NO es "el grafo entero de golpe" — el
// propio calendario-construccion.md llama a eso una madeja ilegible. Se
// filtra por familia semántica de relación: una vista por tema, nunca todos
// los tipos a la vez.
//
// La agrupación es semántica, no por tamaño actual: `hermanos` es su propia
// familia aunque hoy tenga pocas aristas, porque conceptualmente es un tema
// distinto de `parentesco`, y el corpus va a crecer con más mitos.
export interface FamiliaRelacion {
	id: string;
	etiqueta: string;
	// Todos los nombres de tipo a filtrar en grafo.aristas, incluidas las
	// inversas por si algún día se autorían directamente (defensivo, sin
	// coste: un tipo que nunca aparece como original simplemente no filtra
	// nada).
	tipos: string[];
	// Sub-tipos que se distinguen por color en esta familia, en el orden en
	// que toman color de la paleta. Vacío cuando la familia es un solo tipo
	// conceptual (aunque el registro lo parta en variantes con/sin madre).
	tiposCanonicos: string[];
}

export const FAMILIAS: FamiliaRelacion[] = [
	{
		id: "parentesco",
		etiqueta: "Parentesco",
		tipos: TIPOS_GENEALOGIA,
		tiposCanonicos: [],
	},
	{
		id: "consortes",
		etiqueta: "Consortes",
		tipos: ["consorte_de"],
		tiposCanonicos: [],
	},
	{
		id: "hermanos",
		etiqueta: "Hermanos",
		tipos: ["hermano_de"],
		tiposCanonicos: [],
	},
	{
		id: "relatos",
		etiqueta: "Relatos",
		tipos: ["participa_en", "tiene_participante"],
		tiposCanonicos: [],
	},
	{
		id: "lugares",
		etiqueta: "Lugares",
		tipos: ["habitado_por", "habita", "ocurre_en", "escenario_de"],
		tiposCanonicos: ["habitado_por", "ocurre_en"],
	},
	{
		id: "objetos",
		etiqueta: "Objetos",
		tipos: [
			"portado_por",
			"porta",
			"forjado_por",
			"forja",
			"construido_por",
			"construye",
		],
		tiposCanonicos: ["portado_por", "forjado_por", "construido_por"],
	},
	{
		id: "acciones",
		etiqueta: "Acciones",
		tipos: [
			"devora_a",
			"devorado_por",
			"encierra_a",
			"encerrado_por",
			"rapta_a",
			"raptado_por",
			"castiga_a",
			"castigado_por",
			"mata_a",
			"matado_por",
			"mutila_a",
			"mutilado_por",
		],
		tiposCanonicos: [
			"devora_a",
			"encierra_a",
			"rapta_a",
			"castiga_a",
			"mata_a",
			"mutila_a",
		],
	},
	{
		id: "obras",
		etiqueta: "Obras",
		tipos: ["representa", "representado_en"],
		tiposCanonicos: [],
	},
];

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

export interface VistaGrafo {
	familia: FamiliaRelacion;
	nodos: NodoGrafo[];
	enlaces: EnlaceGrafo[];
	ancho: number;
	alto: number;
}

const ESPACIO_HERMANOS = 90;
const ESPACIO_GENERACION = 130;
const MARGEN = 45;

function agregar<K>(mapa: Map<K, string[]>, clave: K, valor: string) {
	const lista = mapa.get(clave);
	if (lista) lista.push(valor);
	else mapa.set(clave, [valor]);
}

// Parentesco es la única familia con una dirección semántica clara
// (generación), así que es la única que se dibuja por capas en vez de en
// círculo. Capa = camino más largo desde una raíz (nadie declarado como su
// padre/madre dentro de esta familia), no el campo `generacion` de la
// entidad: ese campo solo está relleno en 8 de 58 entidades y quedaría
// vacío para el resto.
function layoutJerarquico(
	aristas: Arista[],
): Map<string, { x: number; y: number }> {
	const padreHijo: { padre: string; hijo: string }[] = aristas.map((a) =>
		a.relacion.tipo === "hijo_de"
			? { padre: a.relacion.destino, hijo: a.origenId }
			: { padre: a.origenId, hijo: a.relacion.destino },
	);

	const ids = new Set<string>();
	for (const e of padreHijo) {
		ids.add(e.padre);
		ids.add(e.hijo);
	}

	const hijosDe = new Map<string, string[]>();
	const padresDe = new Map<string, string[]>();
	for (const e of padreHijo) {
		agregar(hijosDe, e.padre, e.hijo);
		agregar(padresDe, e.hijo, e.padre);
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
		nodos.forEach((id, idx) => {
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

// El resto de familias no tiene una dirección natural (consortes,
// participación en relatos, quién forja qué...): un círculo es determinista,
// no depende de d3-force, y a esta escala (decenas de nodos por familia) se
// lee mejor que amontonar todo a la izquierda.
function layoutCircular(
	ids: string[],
	grafo: Grafo,
): Map<string, { x: number; y: number }> {
	const ordenados = [...ids].sort((a, b) => {
		const na = obtenerEntidad(grafo, a)?.nombre ?? a;
		const nb = obtenerEntidad(grafo, b)?.nombre ?? b;
		return na.localeCompare(nb, "es");
	});
	const radio = Math.max(80, ordenados.length * 16);
	const posiciones = new Map<string, { x: number; y: number }>();
	ordenados.forEach((id, i) => {
		const angulo = (2 * Math.PI * i) / ordenados.length - Math.PI / 2;
		posiciones.set(id, {
			x: radio + radio * Math.cos(angulo),
			y: radio + radio * Math.sin(angulo),
		});
	});
	return posiciones;
}

export function construirVistaFamilia(
	grafo: Grafo,
	familiaId: string,
): VistaGrafo | undefined {
	const familia = FAMILIAS.find((f) => f.id === familiaId);
	if (!familia) return undefined;

	const aristas = grafo.aristas.filter((a) =>
		familia.tipos.includes(a.relacion.tipo),
	);
	if (aristas.length === 0) return undefined;

	const ids = new Set<string>();
	for (const a of aristas) {
		ids.add(a.origenId);
		ids.add(a.relacion.destino);
	}

	const posiciones =
		familia.id === "parentesco"
			? layoutJerarquico(aristas)
			: layoutCircular([...ids], grafo);

	const nodos: NodoGrafo[] = [...ids]
		.map((id) => {
			const entidad = obtenerEntidad(grafo, id);
			const pos = posiciones.get(id);
			if (!entidad || !pos) return undefined;
			return { id, nombre: entidad.nombre, tipo: entidad.tipo, ...pos };
		})
		.filter((n): n is NodoGrafo => n !== undefined);

	const enlaces: EnlaceGrafo[] = aristas.map((a) => ({
		desde: a.origenId,
		hasta: a.relacion.destino,
		tipo: a.relacion.tipo,
		color: colorDeTipo(familia, a.relacion.tipo),
	}));

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
		familia,
		nodos,
		enlaces,
		ancho: maxX - minX + MARGEN * 2,
		alto: maxY - minY + MARGEN * 2,
	};
}

// Recuento de aristas por familia, para la landing (§ index.astro): cuántas
// hay hoy, sin construir el layout completo de las que no se van a mostrar.
export function contarAristasPorFamilia(grafo: Grafo): Map<string, number> {
	const conteo = new Map<string, number>();
	for (const familia of FAMILIAS) {
		const n = grafo.aristas.filter((a) =>
			familia.tipos.includes(a.relacion.tipo),
		).length;
		conteo.set(familia.id, n);
	}
	return conteo;
}
