// Módulo de cliente: construye los popovers de `<E />` una sola vez por
// página, fuera del flujo de la prosa. Modo aventura, paso A2 (plan de
// imágenes y álbum) — ver el comentario en E.astro para el porqué.

import { rutaActivo } from "./rutas";

interface DatosMiniFicha {
	tipo: string;
	nombre: string;
	epitetos: string[];
	resumen: string;
	href: string;
	etiquetaVerMas: string;
	retrato: { archivo: string; alt?: string; foco?: [number, number] } | null;
}

// Misma marca que Casilla.astro (mismas clases, mismo CSS global en
// Base.astro): esta es la única versión que se construye en cliente, porque
// la minificha vive fuera del render de Astro.
function crearCasilla(
	nombre: string,
	tipo: string,
	datos: DatosMiniFicha["retrato"],
): HTMLElement {
	const casilla = document.createElement("div");
	casilla.className = "casilla";

	if (datos) {
		const img = document.createElement("img");
		img.className = "casilla-img";
		img.src = rutaActivo(datos.archivo);
		img.alt = datos.alt ?? nombre;
		if (datos.foco)
			img.style.objectPosition = `${datos.foco[0]}% ${datos.foco[1]}%`;
		casilla.appendChild(img);
	} else {
		const inicial = document.createElement("div");
		inicial.className = "casilla-inicial";
		inicial.style.backgroundColor = `var(--color-tipo-${tipo}, var(--color-tarjeta-borde))`;
		inicial.textContent = nombre.trim().charAt(0).toUpperCase();
		casilla.appendChild(inicial);
	}

	return casilla;
}

function crearMiniFicha(popoverId: string, datos: DatosMiniFicha): HTMLElement {
	const div = document.createElement("div");
	div.id = popoverId;
	div.setAttribute("popover", "auto");
	div.className = "mini-ficha";

	const tirador = document.createElement("div");
	tirador.className = "tirador";
	div.appendChild(tirador);

	const cabecera = document.createElement("div");
	cabecera.className = "mini-cabecera";
	cabecera.appendChild(crearCasilla(datos.nombre, datos.tipo, datos.retrato));

	const textoCabecera = document.createElement("div");
	const tipo = document.createElement("p");
	tipo.className = "mini-tipo";
	tipo.textContent = datos.tipo;
	textoCabecera.appendChild(tipo);

	const nombre = document.createElement("p");
	nombre.className = "mini-nombre";
	nombre.textContent = datos.nombre;
	textoCabecera.appendChild(nombre);

	cabecera.appendChild(textoCabecera);
	div.appendChild(cabecera);

	if (datos.epitetos.length > 0) {
		const lista = document.createElement("ul");
		lista.className = "mini-chips";
		for (const epiteto of datos.epitetos) {
			const li = document.createElement("li");
			li.textContent = epiteto;
			lista.appendChild(li);
		}
		div.appendChild(lista);
	}

	const resumen = document.createElement("p");
	resumen.className = "mini-resumen";
	resumen.textContent = datos.resumen;
	div.appendChild(resumen);

	const acciones = document.createElement("div");
	acciones.className = "mini-acciones";

	const cerrar = document.createElement("button");
	cerrar.type = "button";
	cerrar.setAttribute("popovertarget", popoverId);
	cerrar.setAttribute("popovertargetaction", "hide");
	cerrar.className = "mini-cerrar";
	cerrar.textContent = "Cerrar";
	acciones.appendChild(cerrar);

	const ver = document.createElement("a");
	ver.href = datos.href;
	ver.className = "mini-ver";
	ver.textContent = datos.etiquetaVerMas;
	acciones.appendChild(ver);

	div.appendChild(acciones);
	return div;
}

export function montarMinifichas(contenedor: HTMLElement): void {
	const bloquesDatos = document.querySelectorAll<HTMLScriptElement>(
		'script[type="application/json"][data-mini-ficha]',
	);
	for (const bloque of bloquesDatos) {
		const popoverId = bloque.dataset.miniFicha;
		if (!popoverId || document.getElementById(popoverId)) continue;
		const datos = JSON.parse(bloque.textContent ?? "{}") as DatosMiniFicha;
		contenedor.appendChild(crearMiniFicha(popoverId, datos));
	}
}
