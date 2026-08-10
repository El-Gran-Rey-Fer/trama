import { getEntry, render } from "astro:content";
import {
	entidadesDeMateria,
	entidadesProsaDeMateria,
	relatosDeMateria,
} from "./contenidoPorMateria";

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
	inversa_por_genero?: Record<string, string>;
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
	// Opcional solo en `tipo: obra` (content.config.ts); el resto de tipos lo
	// exige validar-contenido.mjs.
	resumen?: string;
	alias?: string[];
	epitetos?: string[];
	atributos?: Record<string, unknown>;
	etiquetas?: string[];
	generacion?: number;
	genero?: string;
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

// Plan de imágenes y álbum, paso A7 / bloque "hermandad derivada". Igual que
// `ocurre_en`/`participa_en` más abajo en este fichero, son nombres de
// vocabulario del esquema (tipos de relación), no entidades concretas:
// hardcodearlos aquí no rompe la regla de neutralidad de `src/`.
export const TIPOS_GENEALOGIA = ["padre_de", "madre_de", "hijo_de"];

export async function construirGrafo(materiaId: string): Promise<Grafo> {
	const [
		entradasEntidades,
		entradasProsaEntidad,
		entradasRelatos,
		materiaEntry,
	] = await Promise.all([
		entidadesDeMateria(materiaId),
		entidadesProsaDeMateria(materiaId),
		relatosDeMateria(materiaId),
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
		// "este relato ocurre_en aquel lugar"), para no tener dos formas
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
	// desde la entidad hacia el relato ("esta entidad participa_en aquel relato"),
	// no al revés: es la entidad la que hace algo, el relato es donde lo hace. Por
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

	// Resolución de aristas cuyo tipo depende del género del destino (ej.
	// hijo_de: el destino puede ser el padre o la madre). `inversa_por_genero`
	// en el registro dice a qué tipo "real" equivale la arista cuando el
	// destino tiene ese género — la arista se trata entonces como si el
	// destino la hubiera autoriado directamente en sentido contrario, con
	// ese tipo. Así da igual qué lado del contenido escribe la relación (el
	// hijo o el progenitor); todo lo que viene después (preguntas,
	// agrupación, síntesis de inversas) ve una arista ya canónica. Sin
	// `genero` en el destino, o sin entrada para ese género, la arista se
	// deja tal cual (es el caso por defecto: melias/gigantes/erinias
	// apuntando a Urano, que no lo necesita).
	const aristas: Arista[] = aristasOriginales.map(({ origenId, relacion }) => {
		const definicion = registro[relacion.tipo];
		const destino = entidades.get(relacion.destino);
		const tipoResuelto =
			destino?.genero && definicion?.inversa_por_genero?.[destino.genero];
		if (!tipoResuelto) return { origenId, relacion };
		return {
			origenId: relacion.destino,
			relacion: { ...relacion, tipo: tipoResuelto, destino: origenId },
		};
	});

	// Pasada 2: sintetizar inversas SOLO a partir de `aristas` (nunca
	// releyendo entidad.relaciones, que ya puede contener inferidas),
	// deduplicando por origen+tipo+destino para que declarar una relación
	// por los dos lados sea inocuo en vez de producir aristas repetidas.
	for (const { origenId, relacion } of aristas) {
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

	// Pasada 3: derivar `hermano_de` de la filiación ya canónica (bloque
	// "hermandad derivada"). Criterio: al menos un progenitor en común, salvo
	// que una de las dos entidades sea antepasada de la otra (guarda de
	// ascendencia — ej. Tártaro y Tifón, padre e hijo y a la vez ambos hijos
	// de Gea). Es simétrica y su inversa es ella misma, pero la pasada 2 ya ha
	// corrido, así que aquí hay que completar los dos sentidos a mano.
	const hijosPorPadre = new Map<
		string,
		{ hijoId: string; relacion: RelacionCruda }[]
	>();
	const padresDeHijo = new Map<string, string[]>();
	for (const { origenId, relacion } of aristas) {
		if (!TIPOS_GENEALOGIA.includes(relacion.tipo)) continue;
		const [padreId, hijoId] =
			relacion.tipo === "hijo_de"
				? [relacion.destino, origenId]
				: [origenId, relacion.destino];
		if (!hijosPorPadre.has(padreId)) hijosPorPadre.set(padreId, []);
		hijosPorPadre.get(padreId)?.push({ hijoId, relacion });
		if (!padresDeHijo.has(hijoId)) padresDeHijo.set(hijoId, []);
		padresDeHijo.get(hijoId)?.push(padreId);
	}

	function esAncestro(posibleAncestro: string, id: string): boolean {
		const pendientes = [...(padresDeHijo.get(id) ?? [])];
		const visitados = new Set<string>();
		while (pendientes.length > 0) {
			const padreId = pendientes.pop();
			if (padreId === undefined || visitados.has(padreId)) continue;
			if (padreId === posibleAncestro) return true;
			visitados.add(padreId);
			pendientes.push(...(padresDeHijo.get(padreId) ?? []));
		}
		return false;
	}

	// Cada progenitor con dos o más hijos produce una "candidatura" de
	// hermandad por cada par. Un par visto vía dos progenitores compartidos
	// (ej. Equidna y Tifón, hijos de Gea y de Tártaro a la vez) se fusiona en
	// una sola entrada en vez de duplicarse.
	interface ParHermanos {
		a: string;
		b: string;
		principalFalso: boolean;
		fuentes: Set<string | undefined>;
	}
	const pares = new Map<string, ParHermanos>();
	for (const hijos of hijosPorPadre.values()) {
		for (let i = 0; i < hijos.length; i++) {
			for (let j = i + 1; j < hijos.length; j++) {
				const x = hijos[i];
				const y = hijos[j];
				if (x.hijoId === y.hijoId) continue;
				const [a, b] = [x.hijoId, y.hijoId].sort();
				const clave = `${a}|${b}`;
				const par = pares.get(clave) ?? {
					a,
					b,
					principalFalso: false,
					fuentes: new Set<string | undefined>(),
				};
				// Variantes se propagan: una hermandad derivada es
				// `principal: false` si cualquiera de las aristas de filiación
				// que la producen lo es.
				if (x.relacion.principal === false || y.relacion.principal === false) {
					par.principalFalso = true;
				}
				par.fuentes.add(x.relacion.fuente);
				par.fuentes.add(y.relacion.fuente);
				pares.set(clave, par);
			}
		}
	}

	for (const { a, b, principalFalso, fuentes } of pares.values()) {
		if (esAncestro(a, b) || esAncestro(b, a)) continue;
		// Ya existe (autoría o inferida) en cualquiera de los dos sentidos: no
		// duplicar, aunque las declaradas a mano se hayan retirado del
		// contenido.
		const yaExiste =
			clavesPorEntidad.get(a)?.has(claveArista("hermano_de", b)) ||
			clavesPorEntidad.get(b)?.has(claveArista("hermano_de", a));
		if (yaExiste) continue;

		const principal = principalFalso ? false : undefined;
		// La fuente se propaga solo si todas las aristas de filiación que
		// producen el par coinciden en ella; si difieren (o falta en alguna),
		// la arista derivada queda sin fuente.
		const fuente = fuentes.size === 1 ? [...fuentes][0] : undefined;

		aristas.push({
			origenId: a,
			relacion: { tipo: "hermano_de", destino: b, principal, fuente },
		});
		entidades.get(a)?.relaciones.push({
			tipo: "hermano_de",
			destino: b,
			principal,
			fuente,
			inferida: true,
		});
		entidades.get(b)?.relaciones.push({
			tipo: "hermano_de",
			destino: a,
			principal,
			fuente,
			inferida: true,
		});
		clavesPorEntidad.get(a)?.add(claveArista("hermano_de", b));
		clavesPorEntidad.get(b)?.add(claveArista("hermano_de", a));
	}

	return {
		materiaId,
		slug: materiaEntry.data.slug,
		entidades,
		registro,
		aristas,
		plantillasTarjeta: materiaEntry.data.plantillas_tarjeta ?? {},
	};
}

export function obtenerEntidad(grafo: Grafo, id: string): Entidad | undefined {
	return grafo.entidades.get(id);
}
