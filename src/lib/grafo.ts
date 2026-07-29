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

export type TipoNodo = "entidad" | "relato";

export interface Entidad {
	id: string;
	kind: TipoNodo;
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
	const [entradasEntidades, entradasRelatos, materiaEntry] = await Promise.all([
		getCollection("entidades"),
		getCollection("relatos"),
		getEntry("materias", materiaId),
	]);

	if (!materiaEntry) {
		throw new Error(`No existe materia.yaml para "${materiaId}"`);
	}
	const registro = materiaEntry.data.relaciones;

	// Pasada 1: indexar entidades y relatos (un relato es una entidad de pleno
	// derecho) y recolectar las aristas ORIGINALES en una lista aparte, antes
	// de mutar nada.
	const entidades = new Map<string, Entidad>();
	const clavesPorEntidad = new Map<string, Set<string>>();
	const aristasOriginales: Array<{
		origenId: string;
		relacion: RelacionCruda;
	}> = [];

	function indexar(
		id: string,
		kind: TipoNodo,
		data: Omit<Entidad, "id" | "kind" | "materia" | "relaciones">,
		relacionesPropias: RelacionCruda[],
		relacionesDerivadas: RelacionCruda[],
	) {
		const relacionesAutoria = [...relacionesPropias, ...relacionesDerivadas];
		entidades.set(id, {
			...data,
			id,
			kind,
			materia: materiaId,
			relaciones: relacionesAutoria.map((r) => ({ ...r, inferida: false })),
		});
		clavesPorEntidad.set(
			id,
			new Set(relacionesAutoria.map((r) => claveArista(r.tipo, r.destino))),
		);
		for (const relacion of relacionesAutoria) {
			aristasOriginales.push({ origenId: id, relacion });
		}
	}

	for (const entrada of entradasEntidades) {
		indexar(
			entrada.id,
			"entidad",
			entrada.data,
			entrada.data.relaciones ?? [],
			[],
		);
	}
	for (const entrada of entradasRelatos) {
		// El campo `lugar` de un relato se convierte aquí en una arista `ocurre_en`
		// más, para no duplicar el concepto con una segunda forma de declararlo.
		const relacionesDerivadas: RelacionCruda[] = entrada.data.lugar
			? [{ tipo: "ocurre_en", destino: entrada.data.lugar }]
			: [];
		indexar(
			entrada.id,
			"relato",
			entrada.data,
			entrada.data.relaciones ?? [],
			relacionesDerivadas,
		);
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
