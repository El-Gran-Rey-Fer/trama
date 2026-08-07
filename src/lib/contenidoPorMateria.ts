import { getCollection } from "astro:content";

// content.config.ts carga `entidades`, `entidadesProsa` y `relatos` desde
// content/*/... — una sola colección astro para todas las materias, no una
// por materia. El filtro se hace aquí por `filePath` (metadato que Astro
// adjunta a cada entrada cargada con el loader `glob`, relativo a la raíz del
// proyecto: "content/<materiaId>/..."), no por el id: el id sigue siendo el
// id crudo del YAML/MDX, sin prefijo de materia, para no romper `destino:
// <id>` en las relaciones ni las rutas que ya lo usan tal cual.
function esDeMateria(materiaId: string) {
	return (entry: { filePath?: string }) =>
		entry.filePath?.startsWith(`content/${materiaId}/`) ?? false;
}

export function entidadesDeMateria(materiaId: string) {
	return getCollection("entidades", esDeMateria(materiaId));
}

export function entidadesProsaDeMateria(materiaId: string) {
	return getCollection("entidadesProsa", esDeMateria(materiaId));
}

export function relatosDeMateria(materiaId: string) {
	return getCollection("relatos", esDeMateria(materiaId));
}
