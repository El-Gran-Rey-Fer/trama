// Módulo de cliente: construye una casilla (retrato o inicial sobre color de
// tipo) con las mismas clases y el mismo CSS global que Casilla.astro
// (Base.astro), para los sitios donde la casilla se construye en cliente en
// vez de en servidor — la minificha de `<E />` (lib/minifichas.ts) y el
// álbum (plan de imágenes y álbum, paso A4), que revela sus casillas después
// de leer `localStorage`, algo que el build no puede saber.

import { rutaActivo } from "./rutas";

export interface DatosRetrato {
	archivo: string;
	alt?: string;
	foco?: [number, number];
}

export function crearCasilla(
	nombre: string,
	tipo: string,
	retrato: DatosRetrato | null,
): HTMLElement {
	const casilla = document.createElement("div");
	casilla.className = "casilla";

	if (retrato) {
		const img = document.createElement("img");
		img.className = "casilla-img";
		img.src = rutaActivo(retrato.archivo);
		img.alt = retrato.alt ?? nombre;
		if (retrato.foco) {
			img.style.objectPosition = `${retrato.foco[0]}% ${retrato.foco[1]}%`;
		}
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
