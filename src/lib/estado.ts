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
	// Bloque Y (medallas de personaje, plan de gamificación §8): ids de
	// tarjeta acertados alguna vez, sin importar si siguen "vigentes" (no hay
	// repetición espaciada real todavía). Es un conjunto que solo crece — la
	// medalla de personaje ("dominado" del álbum) se deriva de esto en cada
	// render, no se declara aquí; ver calcularMedallasPersonaje.
	tarjetasAcertadas: string[];
	modo: "aventura" | "sandbox";
}

const CLAVE_VIEJA = "trama:estado";

// Namespacing por materia (bloque V, plan de gamificación §10): sin esto, la
// segunda materia (historiadeespana) pisaría el progreso de la primera. Se
// lee del DOM en vez de recibir la materia como parámetro para no cambiar la
// firma de ninguna función pública de este módulo — Base.astro estampa
// `data-materia` en `<html>` (bloque V), y todo lo que importa estado.ts vive
// bajo `[materia]/`, así que faltar el atributo es un error de programación,
// no un caso a degradar en silencio.
function materiaActual(): string {
	const materia = document.documentElement.dataset.materia;
	if (!materia) {
		throw new Error(
			"estado.ts requiere data-materia en <html> (lo estampa Base.astro)",
		);
	}
	return materia;
}

function claveEstado(materiaSlug: string): string {
	return `trama:estado:${materiaSlug}`;
}

export function estadoPorDefecto(): EstadoV1 {
	return {
		v: 1,
		tarjetas: {},
		leidos: [],
		capitulos: {},
		medallas: [],
		tarjetasAcertadas: [],
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

// `tarjetasAcertadas` se añadió después de que `v: 1` empezara a
// persistirse: un estado guardado antes de este paso no lo lleva.
// Normalizar aquí, en vez de subir a `v: 2`, porque no cambia la forma de
// nada que ya existiera (mismo criterio que ya se aplicó a `dominados`, que
// este mismo cambio retira — un estado viejo puede traerlo como propiedad
// huérfana; no está en el tipo, así que nada vuelve a leerlo).
function normalizar(estado: EstadoV1): EstadoV1 {
	estado.tarjetasAcertadas ??= [];
	return estado;
}

// Migración de la clave global vieja a la namespaceada (bloque V): de una
// sola vez, la primera vez que se lee estado tras el cambio. En cuanto se
// ejecuta, `guardarEstado` nunca vuelve a escribir en `CLAVE_VIEJA` — se
// borra aquí mismo para que no quede una copia obsoleta rondando.
function migrarSiHaceFalta(clave: string): void {
	if (localStorage.getItem(clave)) return;
	const bruto = localStorage.getItem(CLAVE_VIEJA);
	if (!bruto) return;
	try {
		const valor: unknown = JSON.parse(bruto);
		if (esEstadoV1(valor)) {
			localStorage.setItem(clave, JSON.stringify(normalizar(valor)));
		}
	} catch {
		// Clave vieja corrupta: no hay nada que migrar, se borra igual abajo.
	}
	localStorage.removeItem(CLAVE_VIEJA);
}

export function leerEstado(): EstadoV1 {
	const clave = claveEstado(materiaActual());
	migrarSiHaceFalta(clave);
	const bruto = localStorage.getItem(clave);
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
	localStorage.setItem(claveEstado(materiaActual()), JSON.stringify(estado));
}

// Punto de instrumentación compartido por los dos únicos sitios donde se
// sabe, en el momento del click, que una Tarjeta.id concreta se acertó
// (examenMixtoCliente.ts y el juego de opción múltiple de jugar/[juego].astro
// — el resto de juegos no producen una Tarjeta.id individual, o son
// flashcards sin acierto/fallo). Idempotente: acertar la misma tarjeta otra
// vez no hace nada, `tarjetasAcertadas` solo crece.
export function marcarTarjetaAcertada(tarjetaId: string): void {
	const estado = leerEstado();
	if (estado.tarjetasAcertadas.includes(tarjetaId)) return;
	estado.tarjetasAcertadas.push(tarjetaId);
	guardarEstado(estado);
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

export interface RelatoResumen {
	id: string;
	nombre: string;
}

// Relatos YA ESCRITOS del capítulo, con nombre — los previstos sin escribir
// no tienen página que enlazar y nunca pueden aparecer en `leidos`, así que
// no entran en el cálculo de estado ni en los mensajes del muro (bloque W).
export interface CapituloResumen {
	id: string;
	nombre: string;
	relatos: RelatoResumen[];
}

// "Cerrado" desaparece del vocabulario visible (bloque V, plan de
// gamificación §3): colisionaba consigo mismo, examen aprobado en los
// documentos, no accesible todavía en la portada. En código sigue siendo un
// enum; lo que cambia es la palabra. `EstadoCapitulo.estado` (el tipo
// persistido, arriba) no cambia — sigue siendo el que ya usa examen.astro.
export type EstadoVisualCapitulo =
	| "bloqueado"
	| "abierto"
	| "en-curso"
	| "superado";

// Los capítulos ya completados salen "superado" (antes "cerrado", colisión
// con "no alcanzado" — ver arriba). El primero sin completar es el activo de
// la vía guiada ("abierto", o "en-curso" si ya se leyó algún relato suyo);
// todos los que vienen después están "bloqueado" porque aún no se llega.
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
			resultado[capitulo.id] = "superado";
			continue;
		}
		if (activoAsignado) {
			resultado[capitulo.id] = "bloqueado";
			continue;
		}
		const algoLeido = capitulo.relatos.some((r) =>
			estado.leidos.includes(r.id),
		);
		resultado[capitulo.id] = algoLeido ? "en-curso" : "abierto";
		activoAsignado = true;
	}
	return resultado;
}

// El capítulo activo es el único "abierto" o "en-curso" que devuelve
// `calcularEstadosCapitulos` — el resto está superado (por delante) o
// bloqueado (por detrás). Modo aventura, bloque W: es el capítulo al que
// apunta siempre el mensaje del muro (§4.3), nunca al intermedio bloqueado
// que el usuario intentó visitar.
export function capituloActivoId(
	cadena: CapituloResumen[],
	estado: EstadoV1,
): string | undefined {
	const estados = calcularEstadosCapitulos(cadena, estado);
	return cadena.find(
		(c) => estados[c.id] === "abierto" || estados[c.id] === "en-curso",
	)?.id;
}

const ESTADOS_ACCESIBLES = new Set<EstadoVisualCapitulo>([
	"abierto",
	"en-curso",
	"superado",
]);

// Una entidad o un relato es accesible en aventura si al menos uno de los
// capítulos que lo contienen —su `conjunto`, o el capítulo que lo declara si
// es un relato (`capitulosQueDesbloquean` en lib/capitulos.ts resuelve cuál
// aplica)— no está bloqueado. Lista vacía = no pertenece a ningún capítulo
// declarado: nunca accesible en aventura, sea cual sea el progreso.
export function entidadAccesible(
	cadena: CapituloResumen[],
	capitulosQueDesbloquean: string[],
	estado: EstadoV1,
): boolean {
	const estados = calcularEstadosCapitulos(cadena, estado);
	return capitulosQueDesbloquean.some((id) => {
		const visual = estados[id];
		return visual !== undefined && ESTADOS_ACCESIBLES.has(visual);
	});
}

// Compartido entre el interruptor global (Base.astro) y el botón "Verlo en
// sandbox" del muro (bloque W) — antes cada uno mutaba `estado.modo` a mano.
export function alternarModo(estado: EstadoV1): EstadoV1["modo"] {
	estado.modo = estado.modo === "aventura" ? "sandbox" : "aventura";
	guardarEstado(estado);
	return estado.modo;
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

export interface MedallaPersonaje {
	ganada: boolean;
	aciertos: number;
	total: number;
}

const UMBRAL_MEDALLA_PERSONAJE = 0.8;
const MINIMO_TARJETAS_PROPIAS = 3;

// Bloque Y (medallas de personaje, plan de gamificación §8): "se derivan, no
// se declaran". `tarjetasPropiasPorEntidad` ya viene filtrada por
// `tipos_coleccionables` (ver lib/tarjetas.ts) — aquí solo se compara contra
// lo acertado alguna vez. Umbral de fracción exacta, sin redondear: con 3
// tarjetas propias hacen falta las 3 (2/3 no llega al 80%); con 5 bastan 4.
// Una vez ganada se queda ganada porque `tarjetasAcertadas` solo crece, no
// hace falta guardar la medalla aparte.
export function calcularMedallasPersonaje(
	tarjetasPropiasPorEntidad: Record<string, string[]>,
	estado: EstadoV1,
): Record<string, MedallaPersonaje> {
	const acertadas = new Set(estado.tarjetasAcertadas);
	const resultado: Record<string, MedallaPersonaje> = {};
	for (const [entidadId, propias] of Object.entries(
		tarjetasPropiasPorEntidad,
	)) {
		const aciertos = propias.filter((id) => acertadas.has(id)).length;
		resultado[entidadId] = {
			aciertos,
			total: propias.length,
			ganada:
				propias.length >= MINIMO_TARJETAS_PROPIAS &&
				aciertos / propias.length >= UMBRAL_MEDALLA_PERSONAJE,
		};
	}
	return resultado;
}

export type EstadoCasilla = "sin-encontrar" | "encontrado" | "dominado";

// "Encontrado": la entidad aparece en algún relato marcado como leído.
// "Dominado": tiene la medalla de personaje del bloque Y (ver
// calcularMedallasPersonaje). Recibe el mismo `relatoConjuntos` (relato ->
// ids que desbloquea) que ya usa `tarjetasDisponibles`, para no recalcular
// esa relación dos veces.
export function calcularEstadosCasillas(
	entidadIds: string[],
	relatoConjuntos: Record<string, string[]>,
	medallas: Record<string, MedallaPersonaje>,
	estado: EstadoV1,
): Record<string, EstadoCasilla> {
	const encontradas = new Set<string>();
	for (const relatoId of estado.leidos) {
		for (const id of relatoConjuntos[relatoId] ?? []) encontradas.add(id);
	}
	const resultado: Record<string, EstadoCasilla> = {};
	for (const id of entidadIds) {
		if (medallas[id]?.ganada) resultado[id] = "dominado";
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
	personajesDominados: number,
	estado: EstadoV1,
): NivelCosmetico | undefined {
	const total = totalEntidades + totalCapitulos;
	if (total === 0 || niveles.length === 0) return undefined;
	const capitulosCerrados = Object.values(estado.capitulos).filter(
		(c) => c.estado === "cerrado",
	).length;
	const cobertura = (personajesDominados + capitulosCerrados) / total;
	let elegido = niveles[0];
	for (const nivel of niveles) {
		if (cobertura >= nivel.umbral) elegido = nivel;
	}
	return elegido;
}
