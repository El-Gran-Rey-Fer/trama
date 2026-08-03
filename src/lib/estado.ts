// Módulo de cliente: localStorage no existe en build. A diferencia de grafo.ts o
// tarjetas.ts (que corren en Node al generar el sitio estático), este módulo solo
// se ejecuta en el navegador, importado desde un <script type="module">.

export interface EstadoTarjeta {
	ef: number;
	intervalo: number;
	proxima: string;
}

export interface EstadoCapitulo {
	estado: "cerrado" | "abierto" | "en-curso";
	intentos: number;
}

export interface EstadoV1 {
	v: 1;
	tarjetas: Record<string, EstadoTarjeta>;
	leidos: string[];
	capitulos: Record<string, EstadoCapitulo>;
	medallas: string[];
	// Modo aventura, plan de imágenes y álbum, paso A4: ids de entidad que
	// superaron su examen de personaje. Es el estado "dominado" del álbum
	// (§3.4) — se consigue aprobando ese examen, no acumulando en segundo
	// plano si cada tarjeta se acertó alguna vez.
	dominados: string[];
	modo: "aventura" | "sandbox";
}

const CLAVE = "trama:estado";

export function estadoPorDefecto(): EstadoV1 {
	return {
		v: 1,
		tarjetas: {},
		leidos: [],
		capitulos: {},
		medallas: [],
		dominados: [],
		modo: "aventura",
	};
}

function esEstadoV1(valor: unknown): valor is EstadoV1 {
	return (
		typeof valor === "object" &&
		valor !== null &&
		(valor as { v?: unknown }).v === 1
	);
}

// `dominados` se añadió después de que `v: 1` empezara a persistirse: un
// estado guardado antes de este paso no lo lleva. Normalizar aquí, en vez de
// subir a `v: 2`, porque no cambia la forma de nada que ya existiera (mismo
// criterio que ya se aplicó al no versionar por cada campo nuevo).
function normalizar(estado: EstadoV1): EstadoV1 {
	estado.dominados ??= [];
	return estado;
}

export function leerEstado(): EstadoV1 {
	const bruto = localStorage.getItem(CLAVE);
	if (!bruto) return estadoPorDefecto();
	try {
		const valor: unknown = JSON.parse(bruto);
		if (!esEstadoV1(valor)) return estadoPorDefecto();
		return normalizar(valor);
	} catch {
		return estadoPorDefecto();
	}
}

export function guardarEstado(estado: EstadoV1): void {
	localStorage.setItem(CLAVE, JSON.stringify(estado));
}

export function exportarEstado(): void {
	const estado = leerEstado();
	const blob = new Blob([JSON.stringify(estado, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `trama-estado-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export interface CapituloResumen {
	id: string;
	relatos: string[];
}

export type EstadoVisualCapitulo = "abierto" | "en-curso" | "cerrado";

// Los capítulos ya completados salen "cerrado". El primero sin completar es el
// activo de la vía guiada ("abierto", o "en-curso" si ya se leyó algún relato
// suyo); todos los que vienen después están "cerrado" porque aún no se llega.
// Recibe la lista YA ordenada (era, luego orden dentro de la era).
export function calcularEstadosCapitulos(
	capitulosOrdenados: CapituloResumen[],
	estado: EstadoV1,
): Record<string, EstadoVisualCapitulo> {
	const resultado: Record<string, EstadoVisualCapitulo> = {};
	let activoAsignado = false;
	for (const capitulo of capitulosOrdenados) {
		const completado = estado.capitulos[capitulo.id]?.estado === "cerrado";
		if (completado) {
			resultado[capitulo.id] = "cerrado";
			continue;
		}
		if (activoAsignado) {
			resultado[capitulo.id] = "cerrado";
			continue;
		}
		const algoLeido = capitulo.relatos.some((r) => estado.leidos.includes(r));
		resultado[capitulo.id] = algoLeido ? "en-curso" : "abierto";
		activoAsignado = true;
	}
	return resultado;
}

export async function importarEstado(
	archivo: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
	let valor: unknown;
	try {
		valor = JSON.parse(await archivo.text());
	} catch {
		return { ok: false, error: "El fichero no es JSON válido." };
	}
	if (!esEstadoV1(valor)) {
		return {
			ok: false,
			error: "El fichero no tiene el formato esperado (v: 1).",
		};
	}
	guardarEstado(normalizar(valor));
	return { ok: true };
}

export type EstadoCasilla = "sin-encontrar" | "encontrado" | "dominado";

// "Encontrado": la entidad aparece en algún relato marcado como leído.
// "Dominado": superó su examen de personaje (A4). Recibe el mismo
// `relatoConjuntos` (relato -> ids que desbloquea) que ya usa
// `tarjetasDisponibles`, para no recalcular esa relación dos veces.
export function calcularEstadosCasillas(
	entidadIds: string[],
	relatoConjuntos: Record<string, string[]>,
	estado: EstadoV1,
): Record<string, EstadoCasilla> {
	const encontradas = new Set<string>();
	for (const relatoId of estado.leidos) {
		for (const id of relatoConjuntos[relatoId] ?? []) encontradas.add(id);
	}
	const resultado: Record<string, EstadoCasilla> = {};
	for (const id of entidadIds) {
		if (estado.dominados.includes(id)) resultado[id] = "dominado";
		else if (encontradas.has(id)) resultado[id] = "encontrado";
		else resultado[id] = "sin-encontrar";
	}
	return resultado;
}

export interface NivelCosmetico {
	id: string;
	nombre: string;
	umbral: number;
}

// Nivel cosmético (§3.5 del plan): sale de cobertura —cromos dominados y
// capítulos cerrados—, nunca de constancia. Se toma el umbral más alto que la
// cobertura ya supera; `niveles` viene ordenado de menor a mayor umbral.
export function calcularNivel(
	niveles: NivelCosmetico[],
	totalEntidades: number,
	totalCapitulos: number,
	estado: EstadoV1,
): NivelCosmetico | undefined {
	const total = totalEntidades + totalCapitulos;
	if (total === 0 || niveles.length === 0) return undefined;
	const capitulosCerrados = Object.values(estado.capitulos).filter(
		(c) => c.estado === "cerrado",
	).length;
	const cobertura = (estado.dominados.length + capitulosCerrados) / total;
	let elegido = niveles[0];
	for (const nivel of niveles) {
		if (cobertura >= nivel.umbral) elegido = nivel;
	}
	return elegido;
}
