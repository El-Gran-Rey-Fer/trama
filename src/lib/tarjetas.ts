import { construirGrafo } from "./grafo";

export interface Tarjeta {
	id: string;
	pregunta: string;
	respuesta: string;
	// Entidades de las que depende esta tarjeta. Una tarjeta está disponible
	// cuando todas están en el conjunto de lo leído (modo aventura, paso 4);
	// también es la base de la regla de distractores (paso 6: mismo `tipo`,
	// excluyendo cualquier entidad que aparezca en `ids` de una tarjeta que
	// las conecte).
	ids: string[];
	// Tipo de relación de origen ("padre_de", "atributo:simbolo"...). Lo usa
	// la regla de distractores del paso 6 para saber qué `tipo` de entidad
	// buscar y qué excluir.
	tipoRelacion: string;
	// Si la respuesta es un conjunto (varios nombres) en vez de un valor
	// único. Solo las de valor único entran en el juego de emparejar (§3.7).
	conjunto: boolean;
}

interface Grupo {
	pregunta: string;
	respuestas: string[];
	ids: Set<string>;
	tipoRelacion: string;
}

export async function generarTarjetas(
	materiaId: string,
	// Restringe a las aristas cuyos dos extremos estén en el conjunto (capítulos,
	// modo aventura, paso 3). Sin filtro, genera todas las tarjetas de la materia.
	soloIds?: Set<string>,
): Promise<Tarjeta[]> {
	const grafo = await construirGrafo(materiaId);
	const tarjetas: Tarjeta[] = [];
	// Relaciones de conjunto (ej. tiene_participante) agrupan todas las aristas
	// origen+tipo en una sola tarjeta, en vez de una por arista: el id no lleva
	// destino porque la respuesta no es un único destino, es todos ellos.
	const grupos = new Map<string, Grupo>();

	for (const { origenId, relacion } of grafo.aristas) {
		if (soloIds && (!soloIds.has(origenId) || !soloIds.has(relacion.destino))) {
			continue;
		}
		const definicion = grafo.registro[relacion.tipo];
		if (!definicion) continue;
		const origen = grafo.entidades.get(origenId);
		const destino = grafo.entidades.get(relacion.destino);
		if (!origen || !destino) continue;

		if (definicion.pregunta && definicion.tarjeta !== false) {
			const pregunta = definicion.pregunta.replace("{origen}", origen.nombre);
			if (definicion.conjunto) {
				const id = `${origenId}:${relacion.tipo}`;
				const grupo = grupos.get(id) ?? {
					pregunta,
					respuestas: [],
					ids: new Set([origenId]),
					tipoRelacion: relacion.tipo,
				};
				grupo.respuestas.push(destino.nombre);
				grupo.ids.add(relacion.destino);
				grupos.set(id, grupo);
			} else {
				tarjetas.push({
					id: `${origenId}:${relacion.tipo}:${relacion.destino}`,
					pregunta,
					respuesta: destino.nombre,
					ids: [origenId, relacion.destino],
					tipoRelacion: relacion.tipo,
					conjunto: false,
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
				const grupo = grupos.get(id) ?? {
					pregunta,
					respuestas: [],
					ids: new Set([relacion.destino]),
					tipoRelacion: definicion.inversa,
				};
				grupo.respuestas.push(origen.nombre);
				grupo.ids.add(origenId);
				grupos.set(id, grupo);
			} else {
				tarjetas.push({
					id: `${relacion.destino}:${definicion.inversa}:${origenId}`,
					pregunta,
					respuesta: origen.nombre,
					ids: [relacion.destino, origenId],
					tipoRelacion: definicion.inversa,
					conjunto: false,
				});
			}
		}
	}

	for (const [id, grupo] of grupos) {
		tarjetas.push({
			id,
			pregunta: grupo.pregunta,
			respuesta: grupo.respuestas.join(", "),
			ids: [...grupo.ids],
			tipoRelacion: grupo.tipoRelacion,
			conjunto: true,
		});
	}

	return tarjetas;
}
