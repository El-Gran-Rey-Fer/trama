// Módulo de cliente: motor de examen de opción múltiple, compartido por el
// examen de capítulo y el examen de personaje (plan de imágenes y álbum,
// paso A4). Antes vivía duplicado dentro del <script> de cada página; se
// extrae aquí porque el segundo caso lo necesitó igual que el primero.

import type { Tarjeta } from "./tarjetas";

export interface ResultadoExamen {
	aciertos: number;
	total: number;
	necesarios: number;
	superado: boolean;
	falladas: Tarjeta[];
}

export interface OpcionesExamen {
	tablero: HTMLElement;
	elProgreso: HTMLElement | null;
	elSinPreguntas: HTMLElement | null;
	preguntas: Tarjeta[];
	umbral: { aciertos: number; de: number };
	maxPreguntas?: number;
	// Recibe también `reintentar`, para que quien llama decida cómo ofrecer
	// un segundo intento (mismo lenguaje que ya usaba el examen de capítulo:
	// sin penalización, sin vidas, sin cuenta atrás).
	onResultado: (resultado: ResultadoExamen, reintentar: () => void) => void;
}

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

export function iniciarExamenOpcionMultiple(opciones: OpcionesExamen): void {
	const { tablero, elProgreso, elSinPreguntas, preguntas, umbral } = opciones;
	const maxPreguntas = opciones.maxPreguntas ?? 10;

	function ejecutar() {
		if (preguntas.length < 3) {
			elSinPreguntas?.removeAttribute("hidden");
			return;
		}

		const tanda = barajar(preguntas).slice(0, maxPreguntas);
		// El umbral se escala si hay menos preguntas evaluables que las `de`
		// declaradas, para no exigir de facto un 10/10 encubierto.
		const necesarios = Math.max(
			1,
			Math.round((umbral.aciertos / umbral.de) * tanda.length),
		);

		let indice = 0;
		let aciertos = 0;
		const falladas: Tarjeta[] = [];

		function actualizarProgreso() {
			if (elProgreso) elProgreso.textContent = `${indice} / ${tanda.length}`;
		}

		function mostrarPregunta() {
			tablero.innerHTML = "";
			const pregunta = tanda[indice];
			const opcionesPregunta = barajar([
				pregunta.respuesta,
				...pregunta.distractores,
			]);

			const p = document.createElement("p");
			p.className = "texto-pregunta";
			p.textContent = pregunta.pregunta;
			tablero.appendChild(p);

			const lista = document.createElement("div");
			lista.className = "opciones";
			for (const opcion of opcionesPregunta) {
				const boton = document.createElement("button");
				boton.type = "button";
				boton.className = "opcion";
				boton.textContent = opcion;
				boton.addEventListener("click", () => {
					for (const otro of lista.querySelectorAll("button")) {
						(otro as HTMLButtonElement).disabled = true;
					}
					const correcta = opcion === pregunta.respuesta;
					boton.classList.add(correcta ? "acierto" : "fallo");
					if (correcta) {
						aciertos += 1;
					} else {
						falladas.push(pregunta);
						for (const otro of lista.querySelectorAll("button")) {
							if (otro.textContent === pregunta.respuesta) {
								otro.classList.add("acierto");
							}
						}
					}
					setTimeout(() => {
						indice += 1;
						actualizarProgreso();
						if (indice < tanda.length) {
							mostrarPregunta();
						} else {
							const superado = aciertos >= necesarios;
							opciones.onResultado(
								{
									aciertos,
									total: tanda.length,
									necesarios,
									superado,
									falladas,
								},
								ejecutar,
							);
						}
					}, 700);
				});
				lista.appendChild(boton);
			}
			tablero.appendChild(lista);
		}

		actualizarProgreso();
		mostrarPregunta();
	}

	ejecutar();
}
