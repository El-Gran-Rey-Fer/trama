import { getCollection, getEntry } from "astro:content";
import { conjuntoDeRelato } from "./desbloqueo";

export interface Capitulo {
	id: string;
	nombre: string;
	era: string;
	orden: number;
	resumen?: string;
	// Lista prevista del mapa, exista o no todavía cada relato.
	relatos: string[];
	entidadesExtra: string[];
	examen: { aciertos: number; de: number };
	// Se activa solo con que exista el primero de sus relatos previstos — no hay
	// paso manual de "promoción". Mientras sea false, el capítulo no es más que
	// un nombre en la lista de "Próximamente".
	activo: boolean;
	// participantes + lugar de los relatos ya escritos, más entidades_extra. De
	// aquí salen las tarjetas y el examen del capítulo — no se lista a mano lo
	// que el grafo deriva, y nunca incluye nada de un relato que no existe.
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
	const relatosAsignados = new Set<string>();
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
		// Un relato previsto en dos capítulos a la vez es casi siempre un
		// copiar-pegar mal hecho en materia.yaml — vale la pena seguir
		// cazándolo aunque el relato todavía no exista.
		for (const relatoId of c.relatos) {
			if (relatosAsignados.has(relatoId)) {
				throw new Error(
					`el relato ${relatoId} está previsto en más de un capítulo`,
				);
			}
			relatosAsignados.add(relatoId);
		}
	}

	const capitulos: Capitulo[] = capitulosCrudos.map((c) => {
		const relatosEscritos = c.relatos.filter((id) => relatosPorId.has(id));
		const conjunto = new Set<string>(c.entidades_extra ?? []);
		for (const relatoId of relatosEscritos) {
			const data = relatosPorId.get(relatoId);
			if (!data) continue;
			for (const p of conjuntoDeRelato(data)) conjunto.add(p);
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
			activo: relatosEscritos.length > 0,
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
