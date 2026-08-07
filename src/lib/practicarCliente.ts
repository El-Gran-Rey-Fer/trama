// UI de tarjeta-flip de /practicar, extraída a módulo compartido (bloque V):
// el mazo suelto de materia y el mazo acotado a un capítulo
// (c/[id]/practicar.astro) son la misma interfaz sobre datos distintos —
// misma lógica, dos puntos de entrada, en vez de duplicar el script.
import { tarjetasDisponibles } from "./disponibilidad";
import { leerEstado } from "./estado";
import type { Tarjeta } from "./tarjetas";

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

// Lee `#datos-practicar` (mismo id en las dos páginas que montan este
// módulo) y engancha los mismos elementos por id de la plantilla compartida.
export function montarPracticar(): void {
	const datosEl = document.getElementById("datos-practicar");
	const { tarjetas, relatoConjuntos } = datosEl
		? (JSON.parse(datosEl.textContent ?? "{}") as {
				tarjetas: Tarjeta[];
				relatoConjuntos: Record<string, string[]>;
			})
		: { tarjetas: [] as Tarjeta[], relatoConjuntos: {} };

	const elTarjeta = document.getElementById("tarjeta");
	const elEyebrow = document.getElementById("eyebrow");
	const elTexto = document.getElementById("texto-tarjeta");
	const elHint = document.getElementById("hint");
	const elProgreso = document.getElementById("progreso");
	const elSiguiente = document.getElementById("siguiente");
	const elVacio = document.getElementById("vacio");
	const elContenido = document.querySelector<HTMLElement>(".contenido-tarjeta");
	const elReiniciar = document.getElementById("reiniciar");

	let mazo: Tarjeta[] = [];
	let indice = 0;
	let volteada = false;

	function pintar() {
		if (
			!elTarjeta ||
			!elEyebrow ||
			!elTexto ||
			!elHint ||
			!elProgreso ||
			!elSiguiente
		) {
			return;
		}
		const actual = mazo[indice];
		elProgreso.textContent = `Quedan ${mazo.length - indice}`;
		elEyebrow.textContent = volteada ? "RESPUESTA" : "PREGUNTA";
		elTexto.textContent = volteada ? actual.respuesta : actual.pregunta;
		elHint.textContent = volteada
			? "Toca para volver a la pregunta"
			: "Toca la tarjeta para ver la respuesta";
		elTarjeta.classList.toggle("volteada", volteada);
		elSiguiente.textContent =
			indice === mazo.length - 1 ? "Repasar de nuevo" : "Siguiente tarjeta";
	}

	// "Reiniciar" arriba y "Repasar de nuevo" al final del mazo hacen lo
	// mismo: rebarajar. Sin tope de tamaño (a diferencia de emparejar,
	// limitado a 6 parejas para caber en pantalla): aquí se repasa todo lo
	// disponible, una tarjeta a la vez.
	function iniciar() {
		const disponibles = tarjetasDisponibles(
			tarjetas,
			relatoConjuntos,
			leerEstado(),
		);
		if (disponibles.length === 0) {
			elContenido?.setAttribute("hidden", "");
			elVacio?.removeAttribute("hidden");
			return;
		}
		elContenido?.removeAttribute("hidden");
		elVacio?.setAttribute("hidden", "");
		mazo = barajar(disponibles);
		indice = 0;
		volteada = false;
		pintar();
	}

	elTarjeta?.addEventListener("click", () => {
		volteada = !volteada;
		pintar();
	});

	elSiguiente?.addEventListener("click", () => {
		if (indice === mazo.length - 1) {
			iniciar();
			return;
		}
		indice += 1;
		volteada = false;
		pintar();
	});

	elReiniciar?.addEventListener("click", iniciar);

	iniciar();
}
