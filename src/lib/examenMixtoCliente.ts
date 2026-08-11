// Módulo de cliente: motor de examen mixto del examen de capítulo. Sustituye
// a examenCliente.ts (que solo hacía opción múltiple sobre `Tarjeta`): mezcla
// los cuatro tipos de ronda que ya existen como juegos de practicar y son
// pregunta-y-respuesta de una sola ronda —opción múltiple, pertenencia,
// completar el árbol, identificar— y los presenta todos con el mismo patrón
// de feedback + "Siguiente", en vez del autoavance por timeout que tenía el
// examen de solo-opción-múltiple. Emparejar y ordenar no entran: son juegos
// de tablero completo, no rondas de una sola pregunta con acierto/fallo
// inmediato.

import { crearCasilla } from "./casillaCliente";
import { marcarTarjetaAcertada } from "./estado";
import type { RondaIdentificar } from "./identificar";
import type { RondaArbol } from "./juegoArbol";
import type { TarjetaPertenencia } from "./pertenencia";
import { rutaActivo } from "./rutas";
import type { Tarjeta } from "./tarjetas";

export type PreguntaMixta =
	| { tipo: "opcion-multiple"; tarjeta: Tarjeta }
	| { tipo: "pertenencia"; ronda: TarjetaPertenencia }
	| { tipo: "arbol"; ronda: RondaArbol }
	| { tipo: "identificar"; ronda: RondaIdentificar };

export interface FalloExamen {
	textoPregunta: string;
	textoRespuesta: string;
}

export interface ResultadoExamenMixto {
	aciertos: number;
	total: number;
	necesarios: number;
	superado: boolean;
	falladas: FalloExamen[];
}

export interface OpcionesExamenMixto {
	tablero: HTMLElement;
	elProgreso: HTMLElement | null;
	elSinPreguntas: HTMLElement | null;
	preguntas: PreguntaMixta[];
	umbral: { aciertos: number; de: number };
	maxPreguntas?: number;
	onResultado: (
		resultado: ResultadoExamenMixto,
		reintentar: () => void,
	) => void;
}

type Resolver = (
	correcta: boolean,
	textoPregunta: string,
	textoRespuesta: string,
) => void;

function barajar<T>(arr: T[]): T[] {
	const copia = [...arr];
	for (let i = copia.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copia[i], copia[j]] = [copia[j], copia[i]];
	}
	return copia;
}

// El veredicto se escribe dentro de la propia casilla que se marca (su
// `.marca-opcion`), no en un aviso aparte debajo de las opciones.
function marcarOpcion(
	boton: HTMLButtonElement,
	resultado: "acierto" | "fallo",
) {
	boton.classList.add(resultado);
	const marca = boton.querySelector<HTMLElement>(".marca-opcion");
	if (marca) {
		marca.classList.add(resultado);
		marca.textContent = resultado === "acierto" ? "Correcto" : "Incorrecto";
	}
}

function renderOpcionMultiple(
	tablero: HTMLElement,
	tarjeta: Tarjeta,
	resolver: Resolver,
) {
	const p = document.createElement("p");
	p.className = "texto-pregunta";
	p.textContent = tarjeta.pregunta;
	tablero.appendChild(p);

	const lista = document.createElement("div");
	lista.className = "opciones";
	for (const opcion of barajar([tarjeta.respuesta, ...tarjeta.distractores])) {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.className = "opcion";
		boton.dataset.valor = opcion;
		const spanTexto = document.createElement("span");
		spanTexto.className = "texto-opcion";
		spanTexto.textContent = opcion;
		const spanMarca = document.createElement("span");
		spanMarca.className = "marca-opcion";
		boton.append(spanTexto, spanMarca);
		boton.addEventListener("click", () => {
			const correcta = opcion === tarjeta.respuesta;
			if (correcta) marcarTarjetaAcertada(tarjeta.id);
			for (const otro of lista.querySelectorAll<HTMLButtonElement>("button")) {
				otro.disabled = true;
				if (otro.dataset.valor === tarjeta.respuesta)
					marcarOpcion(otro, "acierto");
				else if (otro === boton) marcarOpcion(otro, "fallo");
			}
			resolver(correcta, tarjeta.pregunta, tarjeta.respuesta);
		});
		lista.appendChild(boton);
	}
	tablero.appendChild(lista);
}

function renderPertenencia(
	tablero: HTMLElement,
	ronda: TarjetaPertenencia,
	resolver: Resolver,
) {
	const tarjeta = document.createElement("p");
	tarjeta.className = "tarjeta-pertenencia";
	tarjeta.textContent = ronda.pregunta;
	tablero.appendChild(tarjeta);

	const opciones = document.createElement("div");
	opciones.className = "opciones-pertenencia";
	tablero.appendChild(opciones);

	for (const [texto, icono, valor] of [
		["Sí", "✓", true],
		["No", "✕", false],
	] as const) {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.className = "opcion-pertenencia";
		boton.dataset.valor = String(valor);

		const spanIcono = document.createElement("span");
		spanIcono.className = "icono-pertenencia";
		spanIcono.textContent = icono;
		const spanTexto = document.createElement("span");
		spanTexto.textContent = texto;
		const spanMarca = document.createElement("span");
		spanMarca.className = "marca-opcion";
		boton.append(spanIcono, spanTexto, spanMarca);

		boton.addEventListener("click", () => {
			const correcta = valor === ronda.respuesta;
			for (const otro of opciones.querySelectorAll<HTMLButtonElement>(
				"button",
			)) {
				otro.disabled = true;
				const otroValor = otro.dataset.valor === "true";
				if (otroValor === ronda.respuesta) marcarOpcion(otro, "acierto");
				else if (otro === boton) marcarOpcion(otro, "fallo");
			}
			resolver(correcta, ronda.pregunta, ronda.respuesta ? "Sí" : "No");
		});
		opciones.appendChild(boton);
	}
}

function renderArbol(
	tablero: HTMLElement,
	ronda: RondaArbol,
	resolver: Resolver,
) {
	const scroll = document.createElement("div");
	scroll.className = "arbol-juego-scroll";
	const lienzo = document.createElement("div");
	lienzo.className = "arbol-juego-lienzo";
	lienzo.style.width = `${ronda.ancho}px`;
	lienzo.style.height = `${ronda.alto}px`;

	const svgNS = "http://www.w3.org/2000/svg";
	const svg = document.createElementNS(svgNS, "svg");
	svg.setAttribute("class", "arbol-juego-svg");
	svg.setAttribute("width", String(ronda.ancho));
	svg.setAttribute("height", String(ronda.alto));
	svg.setAttribute("viewBox", `0 0 ${ronda.ancho} ${ronda.alto}`);

	const posiciones = new Map(
		[...ronda.nodos, ...ronda.uniones].map((n) => [n.id, n]),
	);
	for (const enlace of ronda.enlaces) {
		const desde = posiciones.get(enlace.desde);
		const hasta = posiciones.get(enlace.hasta);
		if (!desde || !hasta) continue;
		const linea = document.createElementNS(svgNS, "line");
		linea.setAttribute("x1", String(desde.x));
		linea.setAttribute("y1", String(desde.y));
		linea.setAttribute("x2", String(hasta.x));
		linea.setAttribute("y2", String(hasta.y));
		linea.setAttribute("stroke", enlace.color);
		svg.appendChild(linea);
	}
	for (const union of ronda.uniones) {
		const circulo = document.createElementNS(svgNS, "circle");
		circulo.setAttribute("class", "arbol-juego-union");
		circulo.setAttribute("cx", String(union.x));
		circulo.setAttribute("cy", String(union.y));
		circulo.setAttribute("r", "3.5");
		svg.appendChild(circulo);
	}
	lienzo.appendChild(svg);

	let hueco: {
		nodo: RondaArbol["nodos"][number];
		caja: HTMLElement;
		nombreEl: HTMLElement;
	} | null = null;
	let raizNombre = "";
	for (const nodo of ronda.nodos) {
		if (nodo.esRaiz) raizNombre = nodo.nombre;
		const envoltorio = document.createElement("div");
		envoltorio.className = "arbol-juego-nodo";
		envoltorio.style.left = `${nodo.x}px`;
		envoltorio.style.top = `${nodo.y}px`;
		if (nodo.esRaiz) envoltorio.classList.add("raiz");

		const nombreEl = document.createElement("span");
		nombreEl.className = "arbol-juego-nombre";
		let caja: HTMLElement;
		if (nodo.esHueco) {
			caja = document.createElement("div");
			caja.className = "arbol-juego-hueco";
			caja.textContent = "?";
			nombreEl.textContent = "?";
			hueco = { nodo, caja, nombreEl };
		} else {
			caja = crearCasilla(nodo.nombre, nodo.tipo, null);
			caja.classList.add("arbol-juego-casilla");
			nombreEl.textContent = nodo.nombre;
		}
		envoltorio.append(caja, nombreEl);
		lienzo.appendChild(envoltorio);
	}
	scroll.appendChild(lienzo);
	tablero.appendChild(scroll);

	const textoPregunta = `Árbol genealógico de ${raizNombre || "la entidad"}`;
	const nombreCorrecta =
		ronda.opciones.find((o) => o.id === ronda.correctaId)?.nombre ?? "";

	const opciones = document.createElement("div");
	opciones.className = "opciones-arbol";
	for (const opcion of ronda.opciones) {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.className = "opcion-arbol";
		boton.dataset.id = opcion.id;
		const spanTexto = document.createElement("span");
		spanTexto.className = "texto-opcion";
		spanTexto.textContent = opcion.nombre;
		const spanMarca = document.createElement("span");
		spanMarca.className = "marca-opcion";
		boton.append(spanTexto, spanMarca);
		boton.addEventListener("click", () => {
			const correcta = opcion.id === ronda.correctaId;
			for (const otro of opciones.querySelectorAll<HTMLButtonElement>(
				"button",
			)) {
				otro.disabled = true;
				if (otro.dataset.id === ronda.correctaId) marcarOpcion(otro, "acierto");
				else if (otro === boton) marcarOpcion(otro, "fallo");
			}
			if (hueco) {
				const casillaRevelada = crearCasilla(
					hueco.nodo.nombre,
					hueco.nodo.tipo,
					null,
				);
				casillaRevelada.classList.add(
					"arbol-juego-casilla",
					correcta ? "acierto" : "fallo",
				);
				hueco.caja.replaceWith(casillaRevelada);
				hueco.nombreEl.textContent = hueco.nodo.nombre;
			}
			resolver(correcta, textoPregunta, nombreCorrecta);
		});
		opciones.appendChild(boton);
	}
	tablero.appendChild(opciones);
}

function renderIdentificar(
	tablero: HTMLElement,
	ronda: RondaIdentificar,
	resolver: Resolver,
) {
	const figura = document.createElement("figure");
	figura.className = "figura-identificar";
	const img = document.createElement("img");
	img.src = rutaActivo(ronda.imagen.archivo);
	img.alt = ronda.imagen.alt ?? "";
	figura.appendChild(img);

	let marcado = false;
	if (ronda.foco && ronda.recorte) {
		marcado = true;
		const [fx, fy] = ronda.foco;
		const [rw, rh] = ronda.recorte;
		const marco = document.createElement("div");
		marco.className = "marco-identificar";
		marco.style.left = `${Math.max(0, Math.min(100 - rw, fx - rw / 2))}%`;
		marco.style.top = `${Math.max(0, Math.min(100 - rh, fy - rh / 2))}%`;
		marco.style.width = `${Math.min(100, rw)}%`;
		marco.style.height = `${Math.min(100, rh)}%`;
		figura.appendChild(marco);
	} else if (ronda.foco) {
		marcado = true;
		const marca = document.createElement("div");
		marca.className = "marca-identificar";
		marca.style.left = `${ronda.foco[0]}%`;
		marca.style.top = `${ronda.foco[1]}%`;
		figura.appendChild(marca);
	}
	tablero.appendChild(figura);

	const textoPregunta = marcado
		? "¿Quién o qué es lo señalado?"
		: "¿Quién o qué representa esta obra?";
	const pregunta = document.createElement("p");
	pregunta.className = "pregunta-identificar";
	pregunta.textContent = textoPregunta;
	tablero.appendChild(pregunta);

	const nombreCorrecta =
		ronda.opciones.find((o) => o.id === ronda.correctaId)?.nombre ?? "";

	const opciones = document.createElement("div");
	opciones.className = "opciones-identificar";
	tablero.appendChild(opciones);

	for (const opcion of ronda.opciones) {
		const boton = document.createElement("button");
		boton.type = "button";
		boton.className = "opcion-identificar";
		boton.dataset.id = opcion.id;
		const spanTexto = document.createElement("span");
		spanTexto.className = "texto-opcion";
		spanTexto.textContent = opcion.nombre;
		const spanMarca = document.createElement("span");
		spanMarca.className = "marca-opcion";
		boton.append(spanTexto, spanMarca);
		boton.addEventListener("click", () => {
			const correcta = opcion.id === ronda.correctaId;
			for (const otro of opciones.querySelectorAll<HTMLButtonElement>(
				"button",
			)) {
				otro.disabled = true;
				if (otro.dataset.id === ronda.correctaId) marcarOpcion(otro, "acierto");
				else if (otro === boton) marcarOpcion(otro, "fallo");
			}
			resolver(correcta, textoPregunta, nombreCorrecta);
		});
		opciones.appendChild(boton);
	}
}

export function iniciarExamenMixto(opciones: OpcionesExamenMixto): void {
	const { tablero, elProgreso, elSinPreguntas, preguntas, umbral } = opciones;
	const maxPreguntas = opciones.maxPreguntas ?? 10;

	function ejecutar() {
		if (preguntas.length < 3) {
			elSinPreguntas?.removeAttribute("hidden");
			return;
		}

		const tanda = barajar(preguntas).slice(0, maxPreguntas);
		// Mismo escalado de umbral que el examen de solo-opción-múltiple: si hay
		// menos preguntas evaluables que las `de` declaradas, no exige de facto
		// un 10/10 encubierto.
		const necesarios = Math.max(
			1,
			Math.round((umbral.aciertos / umbral.de) * tanda.length),
		);

		let indice = 0;
		let aciertos = 0;
		const falladas: FalloExamen[] = [];

		function actualizarProgreso() {
			if (elProgreso) elProgreso.textContent = `${indice} / ${tanda.length}`;
		}

		function mostrarPregunta() {
			tablero.innerHTML = "";
			const item = tanda[indice];
			if (item.tipo === "opcion-multiple") {
				renderOpcionMultiple(tablero, item.tarjeta, resolver);
			} else if (item.tipo === "pertenencia") {
				renderPertenencia(tablero, item.ronda, resolver);
			} else if (item.tipo === "arbol") {
				renderArbol(tablero, item.ronda, resolver);
			} else {
				renderIdentificar(tablero, item.ronda, resolver);
			}
		}

		function resolver(
			correcta: boolean,
			textoPregunta: string,
			textoRespuesta: string,
		) {
			if (correcta) aciertos += 1;
			else falladas.push({ textoPregunta, textoRespuesta });
			mostrarSiguiente();
		}

		function mostrarSiguiente() {
			const siguienteBoton = document.createElement("button");
			siguienteBoton.type = "button";
			siguienteBoton.className = "boton-siguiente";
			siguienteBoton.textContent =
				indice === tanda.length - 1 ? "Ver resultado" : "Siguiente";
			siguienteBoton.addEventListener("click", () => {
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
			});
			tablero.appendChild(siguienteBoton);
		}

		actualizarProgreso();
		mostrarPregunta();
	}

	ejecutar();
}
