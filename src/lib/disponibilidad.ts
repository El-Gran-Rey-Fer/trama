import type { EstadoV1 } from "./estado";

// Una tarjeta está disponible si todas las entidades de las que depende están
// en el conjunto de lo leído. En modo sandbox no hay filtro: todo está
// disponible siempre (capa-de-progresion.md §4.2). Modo aventura, paso 4.
// Genérico en `T`: sirve igual para `Tarjeta` que para `TarjetaPertenencia`
// (paso A6) — ambas solo aportan `ids`.
export function tarjetasDisponibles<T extends { ids: string[] }>(
	tarjetas: T[],
	relatoConjuntos: Record<string, string[]>,
	estado: EstadoV1,
): T[] {
	if (estado.modo === "sandbox") return tarjetas;
	const conjuntoLeido = new Set<string>();
	for (const relatoId of estado.leidos) {
		for (const id of relatoConjuntos[relatoId] ?? []) conjuntoLeido.add(id);
	}
	return tarjetas.filter((t) => t.ids.every((id) => conjuntoLeido.has(id)));
}
