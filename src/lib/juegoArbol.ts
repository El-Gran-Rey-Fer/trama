import { construirArbolGenealogico, TIPOS_GENEALOGIA } from "./arbol";
import { construirGrafo, type Grafo } from "./grafo";

// Juego "completar el árbol", pedido después de A7: mismo árbol de ego a
// profundidad 2 que ya usa la ficha (/e/[id]/arbol/), pero con un nodo oculto
// y una tanda de opciones para adivinarlo. La posición en el árbol es la
// pista principal; el nombre no se revela hasta responder.
export interface RondaArbol {
	// Todas las entidades del árbol de esta ronda, para el filtro de
	// disponibilidad (mismo contrato que Tarjeta/TarjetaPertenencia:
	// disponible en aventura solo si TODAS están en lo leído).
	ids: string[];
	nodos: {
		clave: string;
		nombre: string;
		tipo: string;
		x: number;
		y: number;
		esHueco: boolean;
	}[];
	enlaces: { desde: string; hasta: string }[];
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
// direcciones fusionadas (autoría + inferidas).
function distractoresGenealogia(
	grafo: Grafo,
	anclaId: string,
	tipoEntidad: string,
	excluidos: Set<string>,
) {
	const ancla = grafo.entidades.get(anclaId);
	const conectados = new Set(
		(ancla?.relaciones ?? [])
			.filter((r) => TIPOS_GENEALOGIA.includes(r.tipo))
			.map((r) => r.destino),
	);
	return [...grafo.entidades.values()].filter(
		(e) =>
			e.kind === "entidad" &&
			e.tipo === tipoEntidad &&
			e.id !== anclaId &&
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

		const arbol = construirArbolGenealogico(grafo, raiz.id);
		if (!arbol) continue;

		const claveANodo = new Map(arbol.nodos.map((n) => [n.clave, n]));
		const anclaDe = new Map<string, string>(); // clave del hueco -> id del ancla
		for (const enlace of arbol.enlaces) {
			const nodoAncla = claveANodo.get(enlace.desde);
			if (nodoAncla) anclaDe.set(enlace.hasta, nodoAncla.id);
		}

		for (const nodo of arbol.nodos) {
			if (nodo.esRaiz) continue;
			const anclaId = anclaDe.get(nodo.clave);
			if (!anclaId) continue;

			const idsDelArbol = arbol.nodos.map((n) => n.id);
			const excluidos = new Set([...idsDelArbol]);
			const distractores = barajar(
				distractoresGenealogia(grafo, anclaId, nodo.tipo, excluidos),
			).slice(0, MAX_DISTRACTORES);
			if (distractores.length === 0) continue;

			const opciones = barajar([
				{ id: nodo.id, nombre: nodo.nombre },
				...distractores.map((d) => ({ id: d.id, nombre: d.nombre })),
			]);

			rondas.push({
				ids: [...new Set(idsDelArbol)],
				nodos: arbol.nodos.map((n) => ({
					clave: n.clave,
					nombre: n.nombre,
					tipo: n.tipo,
					x: n.x,
					y: n.y,
					esHueco: n.clave === nodo.clave,
				})),
				enlaces: arbol.enlaces,
				ancho: arbol.ancho,
				alto: arbol.alto,
				opciones,
				correctaId: nodo.id,
			});

			if (rondas.length >= LIMITE_CANDIDATOS) break;
		}
	}

	return rondas;
}
