import { construirGrafo } from "./grafo";

export interface Tarjeta {
	id: string;
	pregunta: string;
	respuesta: string;
}

interface Grupo {
	pregunta: string;
	respuestas: string[];
}

export async function generarTarjetas(materiaId: string): Promise<Tarjeta[]> {
	const grafo = await construirGrafo(materiaId);
	const tarjetas: Tarjeta[] = [];
	// Relaciones de conjunto (ej. tiene_participante) agrupan todas las aristas
	// origen+tipo en una sola tarjeta, en vez de una por arista: el id no lleva
	// destino porque la respuesta no es un único destino, es todos ellos.
	const grupos = new Map<string, Grupo>();

	for (const { origenId, relacion } of grafo.aristas) {
		const definicion = grafo.registro[relacion.tipo];
		if (!definicion) continue;
		const origen = grafo.entidades.get(origenId);
		const destino = grafo.entidades.get(relacion.destino);
		if (!origen || !destino) continue;

		if (definicion.pregunta && definicion.tarjeta !== false) {
			const pregunta = definicion.pregunta.replace("{origen}", origen.nombre);
			if (definicion.conjunto) {
				const id = `${origenId}:${relacion.tipo}`;
				const grupo = grupos.get(id) ?? { pregunta, respuestas: [] };
				grupo.respuestas.push(destino.nombre);
				grupos.set(id, grupo);
			} else {
				tarjetas.push({
					id: `${origenId}:${relacion.tipo}:${relacion.destino}`,
					pregunta,
					respuesta: destino.nombre,
				});
			}
		}

		if (definicion.pregunta_inversa && definicion.tarjeta_inversa !== false) {
			const pregunta = definicion.pregunta_inversa.replace(
				"{destino}",
				destino.nombre,
			);
			if (definicion.conjunto_inversa) {
				const id = `${relacion.destino}:${definicion.inversa}`;
				const grupo = grupos.get(id) ?? { pregunta, respuestas: [] };
				grupo.respuestas.push(origen.nombre);
				grupos.set(id, grupo);
			} else {
				tarjetas.push({
					id: `${relacion.destino}:${definicion.inversa}:${origenId}`,
					pregunta,
					respuesta: origen.nombre,
				});
			}
		}
	}

	for (const [id, grupo] of grupos) {
		tarjetas.push({
			id,
			pregunta: grupo.pregunta,
			respuesta: grupo.respuestas.join(", "),
		});
	}

	return tarjetas;
}
