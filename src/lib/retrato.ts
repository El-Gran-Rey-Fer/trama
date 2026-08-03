import { type Entidad, type Grafo, type Imagen, obtenerEntidad } from "./grafo";

export interface RetratoResuelto {
	imagen: Imagen;
	foco?: [number, number];
}

// La entidad declara qué obra usar de retrato con `retrato`; si no lo
// declara, se toma la primera obra que la `representa` (plan de imágenes y
// álbum §3.1). El foco vive en esa relación, no en la obra (§3.2), y ya
// llega resuelto en `representado_en` porque grafo.ts lo propaga al
// sintetizar la inversa.
export function resolverRetrato(
	grafo: Grafo,
	entidad: Entidad,
): RetratoResuelto | undefined {
	const candidatas = entidad.relaciones.filter(
		(r) => r.tipo === "representado_en",
	);
	if (candidatas.length === 0) return undefined;

	const elegida = entidad.retrato
		? (candidatas.find((r) => r.destino === entidad.retrato) ?? candidatas[0])
		: candidatas[0];

	const obra = obtenerEntidad(grafo, elegida.destino);
	if (!obra?.imagen) return undefined;

	return { imagen: obra.imagen, foco: elegida.foco };
}
