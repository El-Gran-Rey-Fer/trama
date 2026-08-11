// Conjunto de ids "desbloqueados" por un relato leído: sus participantes más su
// lugar. Lo consumen tanto capitulos.ts (conjunto de un capítulo) como la página
// de práctica (qué tarjetas están disponibles). Modo aventura, paso 3 y paso 4.
export function conjuntoDeRelato(data: {
	participantes?: string[];
	lugar?: string[];
}): string[] {
	const ids = [...(data.participantes ?? [])];
	ids.push(...(data.lugar ?? []));
	return ids;
}
