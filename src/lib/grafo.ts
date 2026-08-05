import { getCollection, getEntry, render } from "astro:content";

type ContenidoRenderizado = Awaited<ReturnType<typeof render>>["Content"];

export interface RelacionCruda {
	tipo: string;
	destino: string;
	fuente?: string;
	principal?: boolean;
	foco?: [number, number];
	recorte?: [number, number];
	nota?: string;
}

export interface RelacionResuelta extends RelacionCruda {
	inferida: boolean;
}

export type TipoNodo = "entidad" | "relato";

export interface Imagen {
	archivo: string;
	credito?: string;
	origen?: string;
	alt?: string;
	ancho?: number;
	alto?: number;
}

export interface RegistroRelacion {
	inversa: string;
	simetrica?: boolean;
	pregunta?: string;
	pregunta_inversa?: string;
	conjunto?: boolean;
	conjunto_inversa?: boolean;
	tarjeta?: boolean;
	tarjeta_inversa?: boolean;
	pertenencia?: string;
	pertenencia_inversa?: string;
}

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
	imagen?: Imagen;
	retrato?: string;
	relaciones: RelacionResuelta[];
	prosa?: ContenidoRenderizado;
}

export interface Arista {
	origenId: string;
	relacion: RelacionCruda;
}

export interface PlantillasTarjeta {
	atributos?: Record<string, string>;
	epiteto?: string;
}

export interface Grafo {
	materiaId: string;
	slug: string;
	entidades: Map<string, Entidad>;
	registro: Record<string, RegistroRelacion>;
	aristas: Arista[];
	plantillasTarjeta: PlantillasTarjeta;
}

function claveArista(tipo: string, destino: string): string {
	return `${tipo}:${destino}`;
}

export async function construirGrafo(materiaId: string): Promise<Grafo> {
	const [
		entradasEntidades,
		entradasProsaEntidad,
		entradasRelatos,
		materiaEntry,
	] = await Promise.all([
		getCollection("entidades"),
		getCollection("entidadesProsa"),
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
	const aristasOriginales: Arista[] = [];

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

	// La prosa de entidad es un fichero hermano opcional (mismo id que el YAML,
	// por nombre de fichero). Un .mdx sin su .yaml correspondiente es un error
	// de contenido, no un caso silencioso: rompe el build con un mensaje claro.
	for (const entradaProsa of entradasProsaEntidad) {
		const entidad = entidades.get(entradaProsa.id);
		if (!entidad) {
			throw new Error(
				`content/${materiaId}/entidades/${entradaProsa.id}.mdx no tiene su ${entradaProsa.id}.yaml correspondiente`,
			);
		}
		const { Content } = await render(entradaProsa);
		entidad.prosa = Content;
	}

	for (const entrada of entradasRelatos) {
		// `lugar` es azúcar sintáctico sobre el mismo mecanismo de relaciones: se
		// convierte aquí en una arista `ocurre_en` más (el relato es el origen:
		// "la Titanomaquia ocurre_en el Monte Olimpo"), para no tener dos formas
		// distintas de declarar lo mismo. `participantes` se trata aparte, más
		// abajo, porque su arista va en sentido contrario (ver ese bloque).
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

	// `participantes` vive en el frontmatter del relato, pero la arista se autoría
	// desde la entidad hacia el relato ("Zeus participa_en la Titanomaquia"), no
	// al revés: es la entidad la que hace algo, el relato es donde lo hace. Por
	// eso se añade sobre el nodo del participante, no sobre el del relato, y solo
	// puede hacerse aquí, después de que todos los nodos ya existan en el mapa.
	for (const entrada of entradasRelatos) {
		for (const participanteId of entrada.data.participantes ?? []) {
			const participante = entidades.get(participanteId);
			if (!participante) continue; // id inexistente: lo detecta scripts/validar-contenido.mjs (plan de imágenes y álbum, paso A5), no aquí
			const relacion: RelacionCruda = {
				tipo: "participa_en",
				destino: entrada.id,
			};
			participante.relaciones.push({ ...relacion, inferida: false });
			clavesPorEntidad
				.get(participanteId)
				?.add(claveArista(relacion.tipo, relacion.destino));
			aristasOriginales.push({ origenId: participanteId, relacion });
		}
	}

	// Pasada 2: sintetizar inversas SOLO a partir de aristasOriginales
	// (nunca releyendo entidad.relaciones, que ya puede contener inferidas),
	// deduplicando por origen+tipo+destino para que declarar una relación
	// por los dos lados sea inocuo en vez de producir aristas repetidas.
	for (const { origenId, relacion } of aristasOriginales) {
		const definicion = registro[relacion.tipo];
		if (!definicion) continue; // tipo no registrado: se conserva la arista tal cual, sin inversa (fuera del alcance de A5)
		const destino = entidades.get(relacion.destino);
		if (!destino) continue; // destino inexistente: lo detecta scripts/validar-contenido.mjs (paso A5), no aquí

		const clave = claveArista(definicion.inversa, origenId);
		const clavesDestino = clavesPorEntidad.get(relacion.destino);
		if (clavesDestino?.has(clave)) continue; // ya existe (autoría o inferida): no duplicar

		destino.relaciones.push({
			tipo: definicion.inversa,
			destino: origenId,
			fuente: relacion.fuente, // propagación explícita, aunque no se use todavía
			principal: relacion.principal,
			foco: relacion.foco, // idem: el foco vive en `representa`, la inversa lo hereda
			recorte: relacion.recorte, // idem: tamaño del recorte, ligado al foco
			nota: relacion.nota,
			inferida: true,
		});
		clavesDestino?.add(clave);
	}

	return {
		materiaId,
		slug: materiaEntry.data.slug,
		entidades,
		registro,
		aristas: aristasOriginales,
		plantillasTarjeta: materiaEntry.data.plantillas_tarjeta ?? {},
	};
}

export function obtenerEntidad(grafo: Grafo, id: string): Entidad | undefined {
	return grafo.entidades.get(id);
}
