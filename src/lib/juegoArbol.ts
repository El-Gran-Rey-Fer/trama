import { construirGrafo, type Grafo, TIPOS_GENEALOGIA } from "./grafo";
import { construirVistaFamilia } from "./grafoCompleto";

// Juego "completar el árbol", pedido después de A7: árbol de ego a
// profundidad 2, línea directa (sin hermanos ni tíos/primos — mismo recorte
// que la vista embebida en la ficha), con un nodo oculto y una tanda de
// opciones para adivinarlo. La posición en el árbol es la pista principal; el
// nombre no se revela hasta responder.
export interface RondaArbol {
	// Todas las entidades del árbol de esta ronda, para el filtro de
	// disponibilidad (mismo contrato que Tarjeta/TarjetaPertenencia:
	// disponible en aventura solo si TODAS están en lo leído).
	ids: string[];
	nodos: {
		id: string;
		nombre: string;
		tipo: string;
		x: number;
		y: number;
		esHueco: boolean;
		esRaiz: boolean;
	}[];
	uniones: { id: string; x: number; y: number }[];
	enlaces: { desde: string; hasta: string; color: string }[];
	ancho: number;
	alto: number;
	opciones: { id: string; nombre: string }[];
	correctaId: string;
}

const MAX_DISTRACTORES = 3;
const LIMITE_CANDIDATOS = 200;

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

// Distractores de la misma familia de reglas que tarjetas.ts (§3.6): nunca
// una entidad conectada al ancla por parentesco bajo ninguna fuente. No se
// reutiliza `candidatosNoConectados` porque esa función excluye por UN tipo
// de relación y su inversa; aquí hay que excluir por los tres a la vez
// (padre_de/madre_de/hijo_de), y `entidad.relaciones` ya trae las tres
// direcciones fusionadas (autoría + inferidas). `anclaIds` trae dos ids
// cuando el hueco cuelga de un nodo de unión (los dos progenitores, ver
// `UnionGrafo.padres` en grafoCompleto.ts) — se excluye lo conectado a
// cualquiera de los dos, para no ofrecer un distractor emparentado con uno
// de ellos aunque no lo esté con el otro.
function distractoresGenealogia(
	grafo: Grafo,
	anclaIds: string[],
	tipoEntidad: string,
	excluidos: Set<string>,
) {
	const conectados = new Set<string>();
	for (const anclaId of anclaIds) {
		const ancla = grafo.entidades.get(anclaId);
		for (const r of ancla?.relaciones ?? []) {
			if (TIPOS_GENEALOGIA.includes(r.tipo)) conectados.add(r.destino);
		}
	}
	return [...grafo.entidades.values()].filter(
		(e) =>
			e.kind === "entidad" &&
			e.tipo === tipoEntidad &&
			!anclaIds.includes(e.id) &&
			!conectados.has(e.id) &&
			!excluidos.has(e.id),
	);
}

export async function generarRondasArbol(
	materiaId: string,
): Promise<RondaArbol[]> {
	const grafo = await construirGrafo(materiaId);
	const raices = [...grafo.entidades.values()]
		.filter((e) => e.kind === "entidad")
		.sort((a, b) => a.id.localeCompare(b.id));

	const rondas: RondaArbol[] = [];

	for (const raiz of raices) {
		if (rondas.length >= LIMITE_CANDIDATOS) break;

		const vista = construirVistaFamilia(grafo, {
			centro: raiz.id,
			profundidad: 2,
			soloLineaDirecta: true,
		});
		if (!vista) continue;

		// Ancla de cada hueco potencial: la entidad (o las dos, si la arista
		// entrante viene de un nodo de unión) que lo señala directamente. Las
		// aristas que terminan en un nodo de unión (padre → unión) no cuentan:
		// el hueco tiene que ser una entidad real, adivinable.
		const entidadPorId = new Map(vista.nodos.map((n) => [n.id, n]));
		const unionPorId = new Map(vista.uniones.map((u) => [u.id, u]));
		const anclaDe = new Map<string, string[]>();
		for (const enlace of vista.enlaces) {
			if (!entidadPorId.has(enlace.hasta)) continue;
			const union = unionPorId.get(enlace.desde);
			anclaDe.set(enlace.hasta, union ? union.padres : [enlace.desde]);
		}

		for (const nodo of vista.nodos) {
			if (nodo.id === raiz.id) continue;
			const anclaIds = anclaDe.get(nodo.id);
			if (!anclaIds) continue;

			const idsDelArbol = vista.nodos.map((n) => n.id);
			const excluidos = new Set(idsDelArbol);
			const distractores = barajar(
				distractoresGenealogia(grafo, anclaIds, nodo.tipo, excluidos),
			).slice(0, MAX_DISTRACTORES);
			if (distractores.length === 0) continue;

			const opciones = barajar([
				{ id: nodo.id, nombre: nodo.nombre },
				...distractores.map((d) => ({ id: d.id, nombre: d.nombre })),
			]);

			rondas.push({
				ids: [...new Set(idsDelArbol)],
				nodos: vista.nodos.map((n) => ({
					id: n.id,
					nombre: n.nombre,
					tipo: n.tipo,
					x: n.x,
					y: n.y,
					esHueco: n.id === nodo.id,
					esRaiz: n.id === raiz.id,
				})),
				uniones: vista.uniones.map((u) => ({ id: u.id, x: u.x, y: u.y })),
				enlaces: vista.enlaces.map((e) => ({
					desde: e.desde,
					hasta: e.hasta,
					color: e.color,
				})),
				ancho: vista.ancho,
				alto: vista.alto,
				opciones,
				correctaId: nodo.id,
			});

			if (rondas.length >= LIMITE_CANDIDATOS) break;
		}
	}

	return rondas;
}
