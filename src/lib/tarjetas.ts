import { getEntry } from "astro:content";
import { relatosDeMateria } from "./contenidoPorMateria";
import { conjuntoDeRelato } from "./desbloqueo";
import { type Arista, construirGrafo, type Entidad, type Grafo } from "./grafo";

export interface Tarjeta {
	id: string;
	pregunta: string;
	respuesta: string;
	// Entidades de las que depende esta tarjeta. Una tarjeta está disponible
	// cuando todas están en el conjunto de lo leído (modo aventura, paso 4).
	ids: string[];
	// Tipo de relación de origen ("padre_de", "atributo:simbolo"...). Documenta
	// de dónde sale la tarjeta; no lo consume nada todavía fuera de aquí.
	tipoRelacion: string;
	// Si la respuesta es un conjunto (varios nombres) en vez de un valor único.
	// Regla de qué tarjeta entra en qué juego (§3.7): solo las de valor único
	// entran en el juego de emparejar y tienen distractores (opción múltiple).
	conjunto: boolean;
	// Opciones falsas ya calculadas (regla de distractores, §3.6). Vacío en las
	// de conjunto: no hay opción múltiple para una respuesta que es un listado.
	distractores: string[];
}

interface Grupo {
	pregunta: string;
	respuestas: string[];
	ids: Set<string>;
	tipoRelacion: string;
}

const MAX_DISTRACTORES = 3;

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

// Candidatos no conectados a `sujetoId` por `tipoRelacion` (en cualquier
// dirección, bajo cualquier fuente), del mismo `tipo` que `tipoEntidad`, y
// fuera de `excluidosExtra` — así una respuesta también-correcta por otra
// variante nunca aparece como opción falsa (§3.6, caso Afrodita). Compartido
// por los distractores de opción múltiple (una respuesta excluida) y por los
// negativos de pertenencia (todo un grupo de respuestas excluido a la vez).
export function candidatosNoConectados(
	grafo: Grafo,
	sujetoId: string,
	tipoRelacion: string,
	tipoEntidad: string,
	excluidosExtra: Set<string>,
	// Mismo scope que generarTarjetas/generarPertenencia (modo aventura): sin
	// esto, una entidad todavía no desbloqueada puede colarse como distractor
	// u opción falsa de pertenencia.
	soloIds?: Set<string>,
): Entidad[] {
	const sujeto = grafo.entidades.get(sujetoId);
	if (!sujeto) return [];

	const otroLado = grafo.registro[tipoRelacion]?.inversa;
	const tiposConexion = new Set([tipoRelacion, otroLado].filter(Boolean));
	const excluidos = new Set(excluidosExtra);
	excluidos.add(sujetoId); // una entidad nunca es candidata de una relación consigo misma
	for (const r of sujeto.relaciones) {
		if (tiposConexion.has(r.tipo)) excluidos.add(r.destino);
	}

	return [...grafo.entidades.values()].filter(
		(e) =>
			e.tipo === tipoEntidad &&
			!excluidos.has(e.id) &&
			(!soloIds || soloIds.has(e.id)),
	);
}

// Distractores de una tarjeta de relación: entidades del mismo `tipo` que la
// respuesta correcta, excluyendo cualquier entidad conectada al sujeto de la
// pregunta por ESE tipo de relación (en cualquier dirección, bajo cualquier
// fuente) — así una respuesta también-correcta por otra variante nunca
// aparece como opción falsa (§3.6, caso Afrodita).
function distractoresDeRelacion(
	grafo: Grafo,
	sujetoId: string,
	respuestaId: string,
	tipoRelacion: string,
	soloIds?: Set<string>,
): string[] {
	const respuesta = grafo.entidades.get(respuestaId);
	if (!respuesta) return [];
	const candidatos = candidatosNoConectados(
		grafo,
		sujetoId,
		tipoRelacion,
		respuesta.tipo,
		new Set([respuestaId]),
		soloIds,
	);
	return barajar(candidatos)
		.slice(0, MAX_DISTRACTORES)
		.map((e) => e.nombre);
}

// Distractores de una tarjeta de atributo: el mismo campo en otras entidades
// del mismo tipo (p.ej. el símbolo de otras entidades del mismo tipo, no de
// la entidad de la propia tarjeta).
function distractoresDeAtributo(
	grafo: Grafo,
	sujeto: Entidad,
	clave: string,
): string[] {
	const candidatos = [...grafo.entidades.values()].filter(
		(e) => e.id !== sujeto.id && e.tipo === sujeto.tipo && e.atributos?.[clave],
	);
	return barajar(candidatos)
		.slice(0, MAX_DISTRACTORES)
		.map((e) => String(e.atributos?.[clave]));
}

// Distractores de una tarjeta de epíteto (pregunta inversa: dado el epíteto,
// qué entidad es): otras entidades del mismo tipo que la respuesta correcta.
function distractoresDeEpiteto(grafo: Grafo, respuesta: Entidad): string[] {
	const candidatos = [...grafo.entidades.values()].filter(
		(e) => e.id !== respuesta.id && e.tipo === respuesta.tipo,
	);
	return barajar(candidatos)
		.slice(0, MAX_DISTRACTORES)
		.map((e) => e.nombre);
}

// Arity real de cada grupo origen+tipo (o destino+tipo, para la dirección
// inversa) en TODO el grafo, sin filtrar por `soloIds` — es una propiedad del
// contenido, no del progreso de lectura. La usa `decideConjunto` para las
// relaciones marcadas `conjunto: dinamico`/`conjunto_inversa: dinamico` en el
// registro: si un grupo así nunca tiene más de una arista, sigue generando la
// tarjeta de valor único de siempre (con distractores, en el juego de
// emparejar); en cuanto algún grupo alcanza dos o más (ej. un relato con dos
// `lugar`), esa tarjeta concreta pasa a ser de conjunto — sin afectar a
// ninguna relación que no lleve esa marca.
function contarPorClave(
	aristas: Arista[],
	clave: (a: Arista) => string,
): Map<string, number> {
	const conteo = new Map<string, number>();
	for (const arista of aristas) {
		const k = clave(arista);
		conteo.set(k, (conteo.get(k) ?? 0) + 1);
	}
	return conteo;
}

// Conjunto solo si hace falta: `true` en el registro siempre agrupa (sin
// tocar ninguna relación ya declarada así, aunque algún grupo suyo tenga hoy
// una sola arista — cambiarle el comportamiento le cambiaría el id de
// tarjeta, y esos son permanentes a partir del bloque C). Sin marca, sigue
// sin agrupar nunca, exactamente como hasta ahora. `"dinamico"` es el tercer
// estado, opt-in: decide por la arity real de ESE grupo. Misma función para
// las dos direcciones, así una relación futura con el mismo problema que
// `ocurre_en` solo necesita declarar `"dinamico"`, sin tocar este fichero.
function decideConjunto(
	flag: boolean | "dinamico" | undefined,
	conteo: Map<string, number>,
	clave: string,
): boolean {
	if (flag === "dinamico") return (conteo.get(clave) ?? 0) > 1;
	return flag === true;
}

export async function generarTarjetas(
	materiaId: string,
	// Restringe a las aristas/entidades cuyos ids estén en el conjunto
	// (capítulos, modo aventura, paso 3). Sin filtro, genera todas las
	// tarjetas de la materia.
	soloIds?: Set<string>,
): Promise<Tarjeta[]> {
	const grafo = await construirGrafo(materiaId);
	const tarjetas: Tarjeta[] = [];
	// Relaciones de conjunto (ej. tiene_participante) agrupan todas las aristas
	// origen+tipo en una sola tarjeta, en vez de una por arista: el id no lleva
	// destino porque la respuesta no es un único destino, es todos ellos.
	const grupos = new Map<string, Grupo>();

	const conteoOrigenTipo = contarPorClave(
		grafo.aristas,
		({ origenId, relacion }) => `${origenId}:${relacion.tipo}`,
	);
	const conteoDestinoTipo = contarPorClave(
		grafo.aristas,
		({ relacion }) => `${relacion.destino}:${relacion.tipo}`,
	);

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
			const claveOrigen = `${origenId}:${relacion.tipo}`;
			if (decideConjunto(definicion.conjunto, conteoOrigenTipo, claveOrigen)) {
				const id = claveOrigen;
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
					distractores: distractoresDeRelacion(
						grafo,
						origenId,
						relacion.destino,
						relacion.tipo,
						soloIds,
					),
				});
			}
		}

		if (definicion.pregunta_inversa && definicion.tarjeta_inversa !== false) {
			const pregunta = definicion.pregunta_inversa.replace(
				"{destino}",
				destino.nombre,
			);
			const claveDestino = `${relacion.destino}:${relacion.tipo}`;
			if (
				decideConjunto(
					definicion.conjunto_inversa,
					conteoDestinoTipo,
					claveDestino,
				)
			) {
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
					distractores: distractoresDeRelacion(
						grafo,
						relacion.destino,
						origenId,
						definicion.inversa,
						soloIds,
					),
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
			distractores: [],
		});
	}

	// Tarjetas de atributo y de epíteto (paso 6): no salen de una arista, salen
	// de los campos propios de la entidad. Un único id (la propia entidad): se
	// desbloquean con ella, igual que cualquier otra tarjeta que dependa solo
	// de una entidad leída.
	const plantillasAtributo = grafo.plantillasTarjeta.atributos ?? {};
	const plantillaEpiteto = grafo.plantillasTarjeta.epiteto;
	for (const entidad of grafo.entidades.values()) {
		if (soloIds && !soloIds.has(entidad.id)) continue;

		for (const [clave, plantilla] of Object.entries(plantillasAtributo)) {
			const valor = entidad.atributos?.[clave];
			if (!valor) continue;
			tarjetas.push({
				id: `${entidad.id}:atributo:${clave}`,
				pregunta: plantilla.replace("{origen}", entidad.nombre),
				respuesta: String(valor),
				ids: [entidad.id],
				tipoRelacion: `atributo:${clave}`,
				conjunto: false,
				distractores: distractoresDeAtributo(grafo, entidad, clave),
			});
		}

		if (plantillaEpiteto) {
			for (const epiteto of entidad.epitetos ?? []) {
				tarjetas.push({
					id: `${entidad.id}:epiteto:${epiteto}`,
					pregunta: plantillaEpiteto.replace("{epiteto}", epiteto),
					respuesta: entidad.nombre,
					ids: [entidad.id],
					tipoRelacion: "epiteto",
					conjunto: false,
					distractores: distractoresDeEpiteto(grafo, entidad),
				});
			}
		}
	}

	return tarjetas;
}

// Tarjetas de una entidad alcanzables por algún juego de acierto/fallo por id
// individual — hoy solo opción múltiple marca una Tarjeta.id concreta como
// acertada. Mismo filtro que ya usan c/[id]/examen.astro y jugar/[juego].astro
// para decidir qué tarjeta entra en ese juego: una de conjunto (agrupa varias
// aristas) o sin distractores nunca podría marcarse acertada por ningún
// mecanismo existente, así que no cuenta como "tarjeta propia" a efectos de
// la medalla del bloque Y — si contara, el 80% sería inalcanzable de raíz.
export function tarjetasPropiasPorEntidad(
	tarjetas: Tarjeta[],
): Record<string, string[]> {
	const resultado: Record<string, string[]> = {};
	for (const tarjeta of tarjetas) {
		if (tarjeta.conjunto || tarjeta.distractores.length === 0) continue;
		const entidadId = tarjeta.id.slice(0, tarjeta.id.indexOf(":"));
		if (!resultado[entidadId]) resultado[entidadId] = [];
		resultado[entidadId].push(tarjeta.id);
	}
	return resultado;
}

// Compone lo anterior con el filtro de materia (bloque Y, plan de
// gamificación §8): `tipos_coleccionables` decide qué TIPOS de entidad
// pueden llegar a tener medalla. El umbral de 3 tarjetas mínimas y el 80% de
// aciertos son derivación de cliente (estado.ts, depende de localStorage) —
// aquí solo se filtra por tipo, que es dato de build.
export async function tarjetasPropiasColeccionables(
	materiaId: string,
): Promise<Record<string, string[]>> {
	const grafo = await construirGrafo(materiaId);
	const materiaEntry = await getEntry("materias", materiaId);
	const tiposColeccionables = new Set(
		materiaEntry?.data.tipos_coleccionables ?? [],
	);
	const propias = tarjetasPropiasPorEntidad(await generarTarjetas(materiaId));
	const resultado: Record<string, string[]> = {};
	for (const [entidadId, ids] of Object.entries(propias)) {
		const tipo = grafo.entidades.get(entidadId)?.tipo;
		if (tipo && tiposColeccionables.has(tipo)) resultado[entidadId] = ids;
	}
	return resultado;
}

// Tarjetas propias de un relato (bloque X, plan de gamificación §7.1, estado
// "practicado"): unión de las tarjetas propias de toda entidad en su
// `conjuntoDeRelato` (participantes + lugar) — mismas dos piezas que ya
// componen `capitulosQueDesbloquean`/`conjunto` en capitulos.ts, aquí
// recombinadas por tarjeta en vez de por capítulo. Una entidad que reaparece
// en varios relatos cuenta en todos ellos: no hay noción de "relato dueño" en
// el modelo de datos, así que practicar una tarjeta suya practica el relato
// que se esté mirando, sea o no el que la introdujo.
export async function tarjetasPropiasPorRelato(
	materiaId: string,
): Promise<Record<string, string[]>> {
	const relatos = await relatosDeMateria(materiaId);
	const propiasPorEntidad = tarjetasPropiasPorEntidad(
		await generarTarjetas(materiaId),
	);
	const resultado: Record<string, string[]> = {};
	for (const relato of relatos) {
		const ids = new Set<string>();
		for (const entidadId of conjuntoDeRelato(relato.data)) {
			for (const tarjetaId of propiasPorEntidad[entidadId] ?? []) {
				ids.add(tarjetaId);
			}
		}
		resultado[relato.id] = [...ids];
	}
	return resultado;
}
