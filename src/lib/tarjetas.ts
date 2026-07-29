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

		// El id se ancla siempre a la arista tal como se autorió (origen, tipo,
		// destino), nunca a la dirección en la que se pregunta: si se usara el
		// tipo inverso y se intercambiaran origen/destino para la carta inversa,
		// una relación simétrica autoriada por los dos lados (que el grafo
		// tolera a propósito) produciría el mismo id en ambos sentidos.
		if (definicion.pregunta) {
			tarjetas.push({
				id: `${origenId}:${relacion.tipo}:${relacion.destino}:directa`,
				pregunta: definicion.pregunta.replace("{origen}", origen.nombre),
				respuesta: destino.nombre,
			});
		}
		if (definicion.pregunta_inversa) {
			tarjetas.push({
				id: `${origenId}:${relacion.tipo}:${relacion.destino}:inversa`,
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
