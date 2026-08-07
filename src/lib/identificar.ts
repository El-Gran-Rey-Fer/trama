import { construirGrafo, type Imagen } from "./grafo";
import { candidatosNoConectados } from "./tarjetas";

// Juego de identificar (reservado desde `materia.yaml` junto a la relación
// `representa`/`representado_en`, plan de imágenes y álbum §3.1, bloque S de
// capa-de-progresion.md): sale la imagen de una obra y hay que elegir a quién
// o qué representa, con distractores falsos. Una ronda por cada arista
// `representa` (obra -> entidad o relato), igual que juegoArbol.ts genera una
// ronda por hueco del árbol.
export interface RondaIdentificar {
	// Solo la entidad/relato representado, no la obra: una obra nunca es
	// `participante` de un relato (desbloqueo.ts), así que si `ids` incluyera
	// su id el juego se quedaría sin rondas disponibles en modo aventura.
	ids: string[];
	imagen: Imagen;
	foco?: [number, number];
	recorte?: [number, number];
	opciones: { id: string; nombre: string }[];
	correctaId: string;
}

const MAX_DISTRACTORES = 3;

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

export async function generarRondasIdentificar(
	materiaId: string,
): Promise<RondaIdentificar[]> {
	const grafo = await construirGrafo(materiaId);
	const rondas: RondaIdentificar[] = [];

	for (const { origenId, relacion } of grafo.aristas) {
		if (relacion.tipo !== "representa") continue;

		const obra = grafo.entidades.get(origenId);
		if (!obra?.imagen) continue;
		const destino = grafo.entidades.get(relacion.destino);
		if (!destino) continue;

		// Misma regla de exclusión que el quiz de tarjetas (bloque K): nunca una
		// entidad que esta obra también representa, sea del tipo que sea el
		// resto de figuras del cuadro.
		const distractores = barajar(
			candidatosNoConectados(
				grafo,
				origenId,
				"representa",
				destino.tipo,
				new Set([destino.id]),
			),
		).slice(0, MAX_DISTRACTORES);
		if (distractores.length === 0) continue;

		const opciones = barajar([
			{ id: destino.id, nombre: destino.nombre },
			...distractores.map((d) => ({ id: d.id, nombre: d.nombre })),
		]);

		rondas.push({
			ids: [destino.id],
			imagen: obra.imagen,
			foco: relacion.foco,
			recorte: relacion.recorte,
			opciones,
			correctaId: destino.id,
		});
	}

	return rondas;
}
