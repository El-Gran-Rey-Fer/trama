import { getCollection, getEntry } from "astro:content";

export interface Capitulo {
	id: string;
	nombre: string;
	era: string;
	orden: number;
	resumen: string;
	relatos: string[];
	entidadesExtra: string[];
	examen: { aciertos: number; de: number };
	// participantes + lugar de sus relatos, más entidades_extra. De aquí salen las
	// tarjetas y el examen del capítulo — no se lista a mano lo que el grafo deriva.
	conjunto: Set<string>;
}

export async function cargarCapitulos(materiaId: string): Promise<Capitulo[]> {
	const materiaEntry = await getEntry("materias", materiaId);
	const eras = materiaEntry?.data.eras ?? [];
	const erasIds = new Set(eras.map((e) => e.id));
	const capitulosCrudos = materiaEntry?.data.capitulos ?? [];
	const relatos = await getCollection("relatos");
	const relatosPorId = new Map(relatos.map((r) => [r.id, r.data]));

	const idsVistos = new Set<string>();
	const relatosUsados = new Set<string>();
	for (const c of capitulosCrudos) {
		if (idsVistos.has(c.id)) {
			throw new Error(`capítulo duplicado en materia.yaml: ${c.id}`);
		}
		idsVistos.add(c.id);
		if (!erasIds.has(c.era)) {
			throw new Error(
				`el capítulo ${c.id} referencia una era inexistente: ${c.era}`,
			);
		}
		for (const relatoId of c.relatos) {
			if (!relatosPorId.has(relatoId)) {
				throw new Error(
					`el capítulo ${c.id} referencia un relato inexistente: ${relatoId}`,
				);
			}
			if (relatosUsados.has(relatoId)) {
				throw new Error(`el relato ${relatoId} está en más de un capítulo`);
			}
			relatosUsados.add(relatoId);
		}
	}

	const capitulos: Capitulo[] = capitulosCrudos.map((c) => {
		const conjunto = new Set<string>(c.entidades_extra ?? []);
		for (const relatoId of c.relatos) {
			const data = relatosPorId.get(relatoId);
			if (!data) continue;
			for (const p of data.participantes ?? []) conjunto.add(p);
			if (data.lugar) conjunto.add(data.lugar);
		}
		return {
			id: c.id,
			nombre: c.nombre,
			era: c.era,
			orden: c.orden,
			resumen: c.resumen,
			relatos: c.relatos,
			entidadesExtra: c.entidades_extra ?? [],
			examen: c.examen,
			conjunto,
		};
	});

	const ordenEras = eras.map((e) => e.id);
	capitulos.sort((a, b) => {
		const diferenciaEra = ordenEras.indexOf(a.era) - ordenEras.indexOf(b.era);
		return diferenciaEra !== 0 ? diferenciaEra : a.orden - b.orden;
	});

	return capitulos;
}
