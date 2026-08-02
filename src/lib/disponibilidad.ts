import type { EstadoV1 } from "./estado";
import type { Tarjeta } from "./tarjetas";

// Una tarjeta está disponible si todas las entidades de las que depende están
// en el conjunto de lo leído. En modo sandbox no hay filtro: todo está
// disponible siempre (capa-de-progresion.md §4.2). Modo aventura, paso 4.
export function tarjetasDisponibles(
	tarjetas: Tarjeta[],
	relatoConjuntos: Record<string, string[]>,
	estado: EstadoV1,
): Tarjeta[] {
	if (estado.modo === "sandbox") return tarjetas;
	const conjuntoLeido = new Set<string>();
	for (const relatoId of estado.leidos) {
		for (const id of relatoConjuntos[relatoId] ?? []) conjuntoLeido.add(id);
	}
	return tarjetas.filter((t) => t.ids.every((id) => conjuntoLeido.has(id)));
}
