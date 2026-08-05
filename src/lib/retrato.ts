import { type Entidad, type Grafo, type Imagen, obtenerEntidad } from "./grafo";

export interface RetratoResuelto {
	imagen: Imagen;
	foco?: [number, number];
	recorte?: [number, number];
}

// La entidad declara qué obra usar de retrato con `retrato`; si no lo
// declara, se toma la primera obra que la `representa` (plan de imágenes y
// álbum §3.1). El foco (y su recorte) viven en esa relación, no en la obra
// (§3.2), y ya llegan resueltos en `representado_en` porque grafo.ts los
// propaga al sintetizar la inversa.
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

	return { imagen: obra.imagen, foco: elegida.foco, recorte: elegida.recorte };
}

// La ficha nunca deja que un recorte extremo (mucho más alto que ancho, o
// viceversa) rompa el layout: se acota dentro de un rango razonable. El
// resultado sigue siendo fiel al recorte dentro de ese rango; fuera de él,
// `object-fit: cover` recorta un poco más de lo dibujado en vez de estirar la
// página.
const RATIO_MIN = 0.5;
const RATIO_MAX = 3;

export function calcularAspectRatio(
	imagen: Imagen,
	recorte: [number, number],
): number | undefined {
	if (!imagen.ancho || !imagen.alto) return undefined;
	const ratio =
		((recorte[0] / 100) * imagen.ancho) / ((recorte[1] / 100) * imagen.alto);
	return Math.min(Math.max(ratio, RATIO_MIN), RATIO_MAX);
}
