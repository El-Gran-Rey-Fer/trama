import { construirGrafo } from "./grafo";

export interface Tarjeta {
	id: string;
	pregunta: string;
	respuesta: string;
}

export async function generarTarjetas(materiaId: string): Promise<Tarjeta[]> {
	const grafo = await construirGrafo(materiaId);
	const tarjetas: Tarjeta[] = [];

	for (const { origenId, relacion } of grafo.aristas) {
		const definicion = grafo.registro[relacion.tipo];
		if (!definicion) continue;
		const origen = grafo.entidades.get(origenId);
		const destino = grafo.entidades.get(relacion.destino);
		if (!origen || !destino) continue;

		if (definicion.pregunta) {
			tarjetas.push({
				id: `${origenId}:${relacion.tipo}:${relacion.destino}`,
				pregunta: definicion.pregunta.replace("{origen}", origen.nombre),
				respuesta: destino.nombre,
			});
		}
		if (definicion.pregunta_inversa) {
			tarjetas.push({
				id: `${relacion.destino}:${definicion.inversa}:${origenId}`,
				pregunta: definicion.pregunta_inversa.replace(
					"{destino}",
					destino.nombre,
				),
				respuesta: origen.nombre,
			});
		}
	}

	return tarjetas;
}
