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

// Ids de todo `<E id="..." />` citado en el cuerpo (MDX crudo, sin compilar)
// de un relato. A diferencia de `conjuntoDeRelato` (curado a mano en
// `participantes`/`lugar`, de donde salen tarjetas y examen), esto es un
// espejo automático de la prosa: cualquier entidad que el relato enlaza
// aparece aquí, la haya curado o no quien lo escribió. Existe para que el
// desbloqueo de un `<E />` (capitulos.ts, `capitulosQueDesbloquean`) nunca
// dependa de que nadie se acuerde de sumar la mención a `participantes` —
// si el mito ya es accesible, todo lo que enlaza en su prosa lo es también.
export function mencionesDeRelato(cuerpo: string): string[] {
	return [...cuerpo.matchAll(/<E\s+id="([^"]+)"/g)].map((m) => m[1]);
}
