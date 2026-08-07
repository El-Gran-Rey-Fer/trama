// Módulo de cliente: el muro de aventura (modo aventura, bloque W). Decide,
// para una página cualquiera, si su contenido real es accesible o si hay que
// tapar y mostrar el aviso — y calcula el mensaje que ese aviso comparte con
// el módulo de continuación de la portada (§6 del plan: "cero cálculo
// duplicado").

import {
	alternarModo,
	type CapituloResumen,
	capituloActivoId,
	type EstadoV1,
	entidadAccesible,
	leerEstado,
} from "./estado";
import { rutaExamen, rutaRelato } from "./rutas";

export interface PasoAccionable {
	capituloId: string;
	capituloNombre: string;
	// Fragmento en minúsculas, sin punto final: "te falta 1 relato por leer" |
	// "aprueba el examen para seguir". Lo reutilizan tanto el muro (§4.3) como
	// el módulo de continuación (§6), cada uno con su propia plantilla.
	detalle: string;
	hrefAccion: string;
}

// Siempre el paso del capítulo ACTIVO (§4.3): un clic en un capítulo lejano
// nunca menciona el intermedio bloqueado, solo dónde está de verdad el
// jugador. `cadena` tiene que ser la lista completa de capítulos activos —
// `capituloActivoId`/`calcularEstadosCapitulos` necesitan verla entera para
// saber cuál es el primero sin completar.
export function calcularPasoAccionable(
	cadena: CapituloResumen[],
	estado: EstadoV1,
	materiaSlug: string,
): PasoAccionable | undefined {
	const activoId = capituloActivoId(cadena, estado);
	const capitulo = cadena.find((c) => c.id === activoId);
	if (!capitulo) return undefined;

	const pendientes = capitulo.relatos.filter(
		(r) => !estado.leidos.includes(r.id),
	);
	if (pendientes.length > 0) {
		return {
			capituloId: capitulo.id,
			capituloNombre: capitulo.nombre,
			detalle:
				pendientes.length === 1
					? "te falta 1 relato por leer"
					: `te faltan ${pendientes.length} relatos por leer`,
			hrefAccion: rutaRelato(materiaSlug, pendientes[0].id),
		};
	}

	return {
		capituloId: capitulo.id,
		capituloNombre: capitulo.nombre,
		detalle: "aprueba el examen para seguir",
		hrefAccion: rutaExamen(materiaSlug, capitulo.id),
	};
}

// Aplica el muro sobre el markup que ya emitió `Muro.astro`: revela
// `#muro-contenido` si es accesible (o si el modo es sandbox — §5, sandbox
// no tiene muro), o `#muro-aviso` con el mensaje calculado si no.
export function aplicarMuro(
	cadena: CapituloResumen[],
	capitulosQueDesbloquean: string[],
	materiaSlug: string,
): void {
	const contenido = document.getElementById("muro-contenido");
	const aviso = document.getElementById("muro-aviso");
	if (!contenido || !aviso) return;

	const estado = leerEstado();
	const accesible =
		estado.modo === "sandbox" ||
		entidadAccesible(cadena, capitulosQueDesbloquean, estado);

	if (accesible) {
		contenido.hidden = false;
		aviso.hidden = true;
		return;
	}

	const paso = calcularPasoAccionable(cadena, estado, materiaSlug);
	const mensajeEl = aviso.querySelector<HTMLElement>("[data-muro-mensaje]");
	const accionEl = aviso.querySelector<HTMLAnchorElement>("[data-muro-accion]");
	if (mensajeEl) {
		mensajeEl.textContent = paso
			? `Sigues en ${paso.capituloNombre}. ${paso.detalle.charAt(0).toUpperCase()}${paso.detalle.slice(1)}.`
			: "Este contenido todavía no está a tu alcance en el modo aventura.";
	}
	if (accionEl) {
		if (paso) {
			accionEl.href = paso.hrefAccion;
			accionEl.hidden = false;
		} else {
			accionEl.hidden = true;
		}
	}
	contenido.hidden = true;
	aviso.hidden = false;
}

// Botón "Verlo en sandbox" del muro (§4.2, segundo y discreto): solo aparece
// cuando el aviso ya está visible, y el aviso solo se muestra en aventura —
// así que aquí siempre se pasa a sandbox, nunca al revés.
export function verEnSandboxYRecargar(): void {
	alternarModo(leerEstado());
	location.reload();
}
