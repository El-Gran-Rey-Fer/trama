import { construirGrafo, type Entidad } from "./grafo";
import { candidatosNoConectados } from "./tarjetas";

// Juego de pertenencia (plan de imágenes y álbum, paso A6): para cada grupo
// de relación `conjunto`/`conjunto_inversa` (ej. "los hijos de Urano"),
// pregunta sí/no sobre un candidato en vez de opción múltiple con N
// respuestas correctas. No sustituye la tarjeta agrupada de tarjetas.ts
// (esa sigue sirviendo a /practicar como flip-card); es una vista aparte
// sobre las mismas aristas.
export interface TarjetaPertenencia {
	id: string;
	pregunta: string;
	respuesta: boolean;
	ids: string[];
	tipoRelacion: string;
}

interface Grupo {
	anclaId: string;
	tipoRelacion: string;
	plantilla: string;
	miembros: Set<string>;
}

const MAX_NEGATIVOS = 3;

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

export async function generarPertenencia(
	materiaId: string,
	soloIds?: Set<string>,
): Promise<TarjetaPertenencia[]> {
	const grafo = await construirGrafo(materiaId);
	const grupos = new Map<string, Grupo>();

	for (const { origenId, relacion } of grafo.aristas) {
		if (soloIds && (!soloIds.has(origenId) || !soloIds.has(relacion.destino))) {
			continue;
		}
		const definicion = grafo.registro[relacion.tipo];
		if (!definicion) continue;
		if (
			!grafo.entidades.has(origenId) ||
			!grafo.entidades.has(relacion.destino)
		) {
			continue;
		}

		if (definicion.pertenencia && definicion.conjunto) {
			const id = `${origenId}:${relacion.tipo}`;
			const grupo = grupos.get(id) ?? {
				anclaId: origenId,
				tipoRelacion: relacion.tipo,
				plantilla: definicion.pertenencia,
				miembros: new Set<string>(),
			};
			grupo.miembros.add(relacion.destino);
			grupos.set(id, grupo);
		}

		if (definicion.pertenencia_inversa && definicion.conjunto_inversa) {
			const id = `${relacion.destino}:${definicion.inversa}`;
			const grupo = grupos.get(id) ?? {
				anclaId: relacion.destino,
				tipoRelacion: definicion.inversa,
				plantilla: definicion.pertenencia_inversa,
				miembros: new Set<string>(),
			};
			grupo.miembros.add(origenId);
			grupos.set(id, grupo);
		}
	}

	const tarjetas: TarjetaPertenencia[] = [];
	for (const [id, grupo] of grupos) {
		const ancla = grafo.entidades.get(grupo.anclaId);
		if (!ancla) continue;
		const miembros = [...grupo.miembros]
			.map((miembroId) => grafo.entidades.get(miembroId))
			.filter((e): e is Entidad => e !== undefined);
		if (miembros.length === 0) continue;

		const frasear = (candidato: Entidad) =>
			grupo.plantilla
				.replace("{origen}", ancla.nombre)
				.replace("{destino}", ancla.nombre)
				.replace("{candidato}", candidato.nombre);

		for (const miembro of miembros) {
			tarjetas.push({
				id: `${id}:pertenencia:${miembro.id}`,
				pregunta: frasear(miembro),
				respuesta: true,
				ids: [grupo.anclaId, miembro.id],
				tipoRelacion: grupo.tipoRelacion,
			});
		}

		// Los negativos salen del mismo criterio que los distractores de opción
		// múltiple (mismo `tipo`, no conectado por esta relación bajo ninguna
		// fuente), pero como un grupo de hijos puede mezclar tipos (un miembro
		// puede ser de un tipo y otro de un tipo distinto), se calcula por cada
		// tipo presente en el grupo, no solo el del primer miembro.
		const tiposMiembros = new Set(miembros.map((m) => m.tipo));
		const vistos = new Set<string>();
		const pool: Entidad[] = [];
		for (const tipo of tiposMiembros) {
			for (const candidato of candidatosNoConectados(
				grafo,
				grupo.anclaId,
				grupo.tipoRelacion,
				tipo,
				grupo.miembros,
			)) {
				if (vistos.has(candidato.id)) continue;
				vistos.add(candidato.id);
				pool.push(candidato);
			}
		}

		for (const negativo of barajar(pool).slice(0, MAX_NEGATIVOS)) {
			tarjetas.push({
				id: `${id}:pertenencia:${negativo.id}`,
				pregunta: frasear(negativo),
				respuesta: false,
				ids: [grupo.anclaId, negativo.id],
				tipoRelacion: grupo.tipoRelacion,
			});
		}
	}

	return tarjetas;
}
