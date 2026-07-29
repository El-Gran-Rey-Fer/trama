import { getCollection, getEntry } from "astro:content";

export interface RelacionCruda {
	tipo: string;
	destino: string;
	fuente?: string;
	principal?: boolean;
	nota?: string;
}

export interface RelacionResuelta extends RelacionCruda {
	inferida: boolean;
}

export interface Entidad {
	id: string;
	materia: string;
	tipo: string;
	nombre: string;
	resumen: string;
	alias?: string[];
	epitetos?: string[];
	atributos?: Record<string, unknown>;
	etiquetas?: string[];
	generacion?: number;
	imagen?: string;
	relaciones: RelacionResuelta[];
}

export interface Grafo {
	materiaId: string;
	slug: string;
	entidades: Map<string, Entidad>;
}

function claveArista(tipo: string, destino: string): string {
	return `${tipo}:${destino}`;
}

export async function construirGrafo(materiaId: string): Promise<Grafo> {
	const [entradas, materiaEntry] = await Promise.all([
		getCollection("entidades"),
		getEntry("materias", materiaId),
	]);

	if (!materiaEntry) {
		throw new Error(`No existe materia.yaml para "${materiaId}"`);
	}
	const registro = materiaEntry.data.relaciones;

	// Pasada 1: indexar entidades y recolectar las aristas ORIGINALES
	// (autoría en YAML) en una lista aparte, antes de mutar nada.
	const entidades = new Map<string, Entidad>();
	const clavesPorEntidad = new Map<string, Set<string>>();
	const aristasOriginales: Array<{
		origenId: string;
		relacion: RelacionCruda;
	}> = [];

	for (const entrada of entradas) {
		const relacionesAutoria = entrada.data.relaciones ?? [];
		entidades.set(entrada.id, {
			...entrada.data,
			materia: materiaId,
			relaciones: relacionesAutoria.map((r) => ({ ...r, inferida: false })),
		});
		clavesPorEntidad.set(
			entrada.id,
			new Set(relacionesAutoria.map((r) => claveArista(r.tipo, r.destino))),
		);
		for (const relacion of relacionesAutoria) {
			aristasOriginales.push({ origenId: entrada.id, relacion });
		}
	}

	// Pasada 2: sintetizar inversas SOLO a partir de aristasOriginales
	// (nunca releyendo entidad.relaciones, que ya puede contener inferidas),
	// deduplicando por origen+tipo+destino para que declarar una relación
	// por los dos lados sea inocuo en vez de producir aristas repetidas.
	for (const { origenId, relacion } of aristasOriginales) {
		const definicion = registro[relacion.tipo];
		if (!definicion) continue; // tipo no registrado: se conserva la arista tal cual, sin inversa (validar esto es Bloque A)
		const destino = entidades.get(relacion.destino);
		if (!destino) continue; // destino inexistente: se ignora (idem, validación es Bloque A)

		const clave = claveArista(definicion.inversa, origenId);
		const clavesDestino = clavesPorEntidad.get(relacion.destino);
		if (clavesDestino?.has(clave)) continue; // ya existe (autoría o inferida): no duplicar

		destino.relaciones.push({
			tipo: definicion.inversa,
			destino: origenId,
			fuente: relacion.fuente, // propagación explícita, aunque no se use todavía
			principal: relacion.principal,
			nota: relacion.nota,
			inferida: true,
		});
		clavesDestino?.add(clave);
	}

	return { materiaId, slug: materiaEntry.data.slug, entidades };
}

export function obtenerEntidad(grafo: Grafo, id: string): Entidad | undefined {
	return grafo.entidades.get(id);
}
