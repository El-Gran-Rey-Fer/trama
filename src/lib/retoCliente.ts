// Módulo de cliente: reto del día (bloque Z, plan de gamificación §9). Toma
// el pool de preguntas evaluables de toda la materia (generado en build,
// igual que /practicar) y en el navegador lo acota a lo ya desbloqueado y
// elige 5 de forma determinista a partir de la fecha — así sale distinto por
// persona, sin backend ni cuentas.

import { tarjetasDisponibles } from "./disponibilidad";
import type { EstadoV1 } from "./estado";
import type { PreguntaMixta } from "./examenMixtoCliente";
import type { RondaIdentificar } from "./identificar";
import type { RondaArbol } from "./juegoArbol";
import type { TarjetaPertenencia } from "./pertenencia";
import type { Tarjeta } from "./tarjetas";

export interface DatosReto {
	tarjetas: Tarjeta[];
	pertenencia: TarjetaPertenencia[];
	rondasArbol: RondaArbol[];
	rondasIdentificar: RondaIdentificar[];
	relatoConjuntos: Record<string, string[]>;
	// Conjunto del primer capítulo activo — solo se usa como respaldo cuando
	// `leidos` está vacío (§9: "cae al primer capítulo disponible en vez de
	// fallar"), para que el reto no salga vacío el primer día.
	idsPrimerCapitulo: string[];
}

// Envoltorio de tarjetasDisponibles con el respaldo de §9: sin nada leído
// todavía, en vez de un pool vacío se usa el primer capítulo. Sandbox sigue
// sin filtro, como en cualquier otro sitio de la app.
function disponiblesConRespaldo<T extends { ids: string[] }>(
	items: T[],
	relatoConjuntos: Record<string, string[]>,
	idsPrimerCapitulo: string[],
	estado: EstadoV1,
): T[] {
	if (estado.modo === "sandbox" || estado.leidos.length > 0) {
		return tarjetasDisponibles(items, relatoConjuntos, estado);
	}
	const conjunto = new Set(idsPrimerCapitulo);
	return items.filter((item) => item.ids.every((id) => conjunto.has(id)));
}

// Mismo criterio que examen.astro: de las tarjetas, solo las evaluables
// (opción múltiple con al menos un distractor real) — las de conjunto son
// para /practicar, no para preguntar-y-responder.
export function poolDisponible(
	datos: DatosReto,
	estado: EstadoV1,
): PreguntaMixta[] {
	const { relatoConjuntos, idsPrimerCapitulo } = datos;
	const tarjetas = disponiblesConRespaldo(
		datos.tarjetas.filter((t) => !t.conjunto && t.distractores.length > 0),
		relatoConjuntos,
		idsPrimerCapitulo,
		estado,
	);
	const pertenencia = disponiblesConRespaldo(
		datos.pertenencia,
		relatoConjuntos,
		idsPrimerCapitulo,
		estado,
	);
	const rondasArbol = disponiblesConRespaldo(
		datos.rondasArbol,
		relatoConjuntos,
		idsPrimerCapitulo,
		estado,
	);
	const rondasIdentificar = disponiblesConRespaldo(
		datos.rondasIdentificar,
		relatoConjuntos,
		idsPrimerCapitulo,
		estado,
	);

	return [
		...tarjetas.map(
			(tarjeta): PreguntaMixta => ({ tipo: "opcion-multiple", tarjeta }),
		),
		...pertenencia.map(
			(ronda): PreguntaMixta => ({ tipo: "pertenencia", ronda }),
		),
		...rondasArbol.map((ronda): PreguntaMixta => ({ tipo: "arbol", ronda })),
		...rondasIdentificar.map(
			(ronda): PreguntaMixta => ({ tipo: "identificar", ronda }),
		),
	];
}

// Hash de cadena determinista (FNV-1a de 32 bits) — misma fecha, mismo
// número, en cualquier navegador.
function hashCadena(texto: string): number {
	let h = 0x811c9dc5;
	for (let i = 0; i < texto.length; i++) {
		h ^= texto.charCodeAt(i);
		h = Math.imul(h, 0x01000193);
	}
	return h >>> 0;
}

// PRNG determinista a partir de un entero (mulberry32): mismo seed, misma
// secuencia — es lo que hace que el reto de hoy sea igual en cada carga y
// distinto del de mañana.
function mulberry32(seed: number): () => number {
	let a = seed;
	return () => {
		a |= 0;
		a = (a + 0x6d2b79f5) | 0;
		let t = Math.imul(a ^ (a >>> 15), 1 | a);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

// Selección determinista de `cantidad` preguntas a partir de `fecha`
// (`YYYY-MM-DD`). El orden de juego no importa (examenMixtoCliente lo
// rebaraja con Math.random en cada intento) — lo determinista es solo el
// CONJUNTO elegido.
export function seleccionarReto(
	pool: PreguntaMixta[],
	fecha: string,
	cantidad = 5,
): PreguntaMixta[] {
	const azar = mulberry32(hashCadena(fecha));
	const copia = [...pool];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(azar() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia.slice(0, cantidad);
}
