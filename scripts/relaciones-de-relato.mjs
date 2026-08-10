#!/usr/bin/env node
// Repasa las relaciones de acción/parentesco de los participantes de un
// relato, da de alta las entidades que el MDX cita (`<E id="..." />`,
// `participantes`, `lugar`) y que todavía no tienen YAML, sugiere las
// relaciones que probablemente falten leyendo la prosa, y las aplica de
// forma interactiva escribiendo directamente en el YAML de la entidad
// sujeto. Contrapartida de escritura de validar-contenido.mjs (que solo lee
// y valida).
//
// Uso: pnpm relaciones-de-relato <id-de-relato>
//
// El heurístico de la fase de sugerencia es de texto, no de lenguaje: busca
// raíces de verbo cerca de dos participantes en el mismo párrafo. Va a fallar
// en frases indirectas o con sujeto implícito — para eso está la fase de
// completar a mano, y siempre puede pedirse a un agente que lea el relato y
// rellene lo que el heurístico no cace.
//
// Sin la fase de alta de entidades, un `<E id="tifon" />` sin YAML propio
// hace que el resto del script (repaso, sugerencia, escritura) trate a
// "tifon" como inexistente: la sugerencia aparecía pero `confirmarYEscribir`
// se negaba a aplicarla ("no existe el YAML de..."). Dar de alta la entidad
// primero es lo que permite que las relaciones sugeridas después se lleguen
// a escribir de verdad.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import readline from "node:readline/promises";
import { fileURLToPath } from "node:url";
import { parse, parseDocument } from "yaml";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_ENTIDADES = path.join(RAIZ, "content/mitologia-griega/entidades");
const CARPETA_RELATOS = path.join(RAIZ, "content/mitologia-griega/relatos");
const FICHERO_MATERIA = path.join(
	RAIZ,
	"content/mitologia-griega/materia.yaml",
);

// Raíces de conjugación asociadas a cada tipo de relación de acción, para la
// sugerencia por lectura. Ampliable: si un mito usa un verbo que no está
// aquí, añade la raíz en vez de esperar que el heurístico lo adivine.
const VERBOS_POR_TIPO = {
	devora_a: ["devor"],
	encierra_a: ["encierr", "encerr"],
	rapta_a: ["rapt"],
	castiga_a: ["castig"],
	mata_a: ["mat"],
	mutila_a: ["mutil", "castr"],
	forja: ["forj"],
	construye: ["constru"],
	modela_a: ["model"],
};

function relativa(ruta) {
	return path.relative(RAIZ, ruta);
}

function listarYaml(carpeta) {
	// recursive: true porque las entidades viven en subcarpetas por tipo.
	return readdirSync(carpeta, { recursive: true })
		.filter((f) => f.endsWith(".yaml"))
		.map((f) => path.join(carpeta, f));
}

function listarMdx(carpeta) {
	// recursive: true porque los relatos viven en subcarpetas por era.
	return readdirSync(carpeta, { recursive: true })
		.filter((f) => f.endsWith(".mdx"))
		.map((f) => path.join(carpeta, f));
}

// Busca el .mdx de un relato por su `id` de frontmatter, no por ruta directa:
// con subcarpetas por era no hay forma de derivar la ruta solo a partir del id.
function buscarRelatoPorId(id) {
	for (const ruta of listarMdx(CARPETA_RELATOS)) {
		const texto = readFileSync(ruta, "utf-8");
		if (texto.match(/^id:\s*(.+)$/m)?.[1]?.trim() === id) {
			return { ruta, texto };
		}
	}
	return null;
}

function cargarMateria() {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	return parse(texto);
}

function cargarRegistroRelaciones() {
	return cargarMateria().relaciones ?? {};
}

function cargarTipos() {
	return cargarMateria().tipos ?? [];
}

function cargarEtiquetas() {
	return cargarMateria().etiquetas ?? [];
}

function indexarEntidades() {
	const indice = new Map();
	for (const ruta of listarYaml(CARPETA_ENTIDADES)) {
		const datos = parse(readFileSync(ruta, "utf-8"));
		if (datos?.id) indice.set(datos.id, { ruta, datos });
	}
	return indice;
}

function indexarRelatos() {
	const ids = new Set();
	for (const ruta of listarMdx(CARPETA_RELATOS)) {
		const texto = readFileSync(ruta, "utf-8");
		const id = texto.match(/^id:\s*(.+)$/m)?.[1]?.trim();
		if (id) ids.add(id);
	}
	return ids;
}

function extraerFrontmatterYCuerpo(texto) {
	const coincidencia = texto.match(
		/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/,
	);
	if (!coincidencia)
		throw new Error("el relato no tiene bloque de frontmatter");
	return { frontmatter: coincidencia[1], cuerpo: coincidencia[2] };
}

function relacionesDe(entrada) {
	return entrada?.datos.relaciones ?? [];
}

// Todo id que el MDX cita de verdad: `participantes`, `lugar` (frontmatter) y
// cualquier `<E id="..." />` del cuerpo. Es más amplio que `participantes`
// a propósito — un relato menciona lugares (`<E id="etna" />`) que nunca son
// "participantes" pero igual necesitan YAML propio, o el `<E />` revienta en
// build (src/components/E.astro).
function extraerIdsCitados(datosRelato, cuerpo) {
	const ids = new Set(datosRelato.participantes ?? []);
	if (datosRelato.lugar) ids.add(datosRelato.lugar);
	for (const m of cuerpo.matchAll(/<E\s+id\s*=\s*["']([^"']+)["']/g)) {
		ids.add(m[1]);
	}
	return [...ids];
}

// Sugerencia de `nombre` a partir del id (p. ej. "monte-otris" -> "Monte
// otris"): un punto de partida editable, nunca el valor final — un id sin
// tildes no puede recuperar "Tifón" a partir de "tifon", así que siempre se
// pide confirmación a mano.
function nombrePropuestoDesdeId(id) {
	const palabras = id.split("-");
	return [
		palabras[0][0].toUpperCase() + palabras[0].slice(1),
		...palabras.slice(1),
	].join(" ");
}

function construirYamlEntidad({ id, tipo, nombre, resumen, etiquetas }) {
	let yaml = `id: ${id}\ntipo: ${tipo}\nnombre: ${nombre}\nresumen: ${resumen}\n`;
	if (etiquetas && etiquetas.length > 0) {
		yaml += `etiquetas: [${etiquetas.join(", ")}]\n`;
	}
	return yaml;
}

// Fase 0: da de alta, una por una, las entidades citadas por el relato que
// todavía no tienen YAML (ni son otro relato: `<E />` también puede apuntar
// a un relato). Cada alta queda anotada en `entidades` para que el resto del
// script (repaso, sugerencia, escritura) las trate como ya existentes.
async function altaDeEntidadesFaltantes(idsCitados, entidades, idsRelatos, rl) {
	const faltantes = idsCitados.filter(
		(id) => !entidades.has(id) && !idsRelatos.has(id),
	);
	if (faltantes.length === 0) return;

	const tipos = cargarTipos();
	const etiquetasDisponibles = cargarEtiquetas();
	console.log(
		`\nEntidades citadas en el relato sin YAML propio: ${faltantes.join(", ")}\n`,
	);

	for (const id of faltantes) {
		const crear = (await rl.question(`¿Dar de alta "${id}"? (S/n) `))
			.trim()
			.toLowerCase();
		if (crear === "n") continue;

		const nombrePropuesto = nombrePropuestoDesdeId(id);
		const nombre =
			(
				await rl.question(`  nombre (enter para "${nombrePropuesto}"): `)
			).trim() || nombrePropuesto;

		let tipo;
		while (!tipo) {
			console.log(
				`  tipo — ${tipos.map((t, i) => `${i + 1}) ${t}`).join(", ")}`,
			);
			const respuesta = (
				await rl.question("  elige número o escribe el tipo: ")
			).trim();
			const porNumero = tipos[Number(respuesta) - 1];
			tipo = porNumero ?? (tipos.includes(respuesta) ? respuesta : undefined);
			if (!tipo)
				console.log(`  "${respuesta}" no es un tipo válido, prueba otra vez.`);
		}

		const resumen =
			(
				await rl.question("  resumen (opcional, enter para PENDIENTE): ")
			).trim() || "PENDIENTE";

		console.log(
			`  etiquetas — ${etiquetasDisponibles.map((e, i) => `${i + 1}) ${e}`).join(", ")}`,
		);
		const respuestaEtiquetas = (
			await rl.question(
				"  elige números separados por coma (opcional, enter para ninguna): ",
			)
		).trim();
		const etiquetas = respuestaEtiquetas
			? respuestaEtiquetas
					.split(",")
					.map((s) => s.trim())
					.filter(Boolean)
					.map((s) => etiquetasDisponibles[Number(s) - 1] ?? s)
					.filter((e) => {
						const valida = etiquetasDisponibles.includes(e);
						if (!valida)
							console.log(`  "${e}" no es una etiqueta válida, se descarta.`);
						return valida;
					})
			: [];

		const ruta = path.join(CARPETA_ENTIDADES, tipo, `${id}.yaml`);
		const datos = { id, tipo, nombre, resumen, etiquetas };
		mkdirSync(path.dirname(ruta), { recursive: true });
		writeFileSync(ruta, construirYamlEntidad(datos));
		entidades.set(id, { ruta, datos });
		console.log(`  Escrito ${relativa(ruta)}`);
	}
}

// Heurístico: para cada FRASE (no párrafo — un párrafo mezcla demasiadas
// acciones distintas y dispara combinaciones sin sentido) donde aparecen, por
// id o por nombre, al menos dos participantes, y donde aparece una raíz de
// verbo de algún tipo de acción, sugiere esa relación entre cada par de
// participantes de la frase que todavía no la tenga declarada. No intenta
// identificar sujeto/objeto gramatical — de ahí que haya que confirmar cada
// sugerencia a mano, y de ahí también que frases con sujeto implícito ("los
// arrojaron al Tártaro") no generen sugerencia: sin un participante nombrado
// como sujeto, no hay nada que emparejar.
function sugerirPorLectura(cuerpo, participantes, entidades, registro) {
	const sugerencias = [];
	const vistas = new Set();
	const frases = cuerpo
		.replace(/\s+/g, " ")
		.split(/(?<=[.!?])\s+/)
		.map((f) => f.trim())
		.filter(Boolean);

	for (const frase of frases) {
		const minusculas = frase.toLowerCase();
		const enFrase = participantes.filter((pid) => {
			const nombre = entidades.get(pid)?.datos.nombre;
			return frase.includes(pid) || (nombre && frase.includes(nombre));
		});
		if (enFrase.length < 2) continue;

		for (const [tipo, raices] of Object.entries(VERBOS_POR_TIPO)) {
			if (!(tipo in registro)) continue;
			if (!raices.some((raiz) => minusculas.includes(raiz))) continue;

			for (const origen of enFrase) {
				for (const destino of enFrase) {
					if (origen === destino) continue;
					const clave = `${origen}:${tipo}:${destino}`;
					if (vistas.has(clave)) continue;
					const yaExiste = relacionesDe(entidades.get(origen)).some(
						(r) => r.tipo === tipo && r.destino === destino,
					);
					if (yaExiste) continue;
					vistas.add(clave);
					sugerencias.push({ origen, tipo, destino, fragmento: frase });
				}
			}
		}
	}
	return sugerencias;
}

function escribirRelacion(entrada, { tipo, destino, fuente, principal }) {
	const textoActual = readFileSync(entrada.ruta, "utf-8");
	const doc = parseDocument(textoActual);
	// `doc.set(k, [])` guarda el array plano tal cual, sin convertirlo en nodo
	// YAML (YAMLMap#set no pasa el valor por createNode) — el `.add` de abajo
	// reventaría con "doc.get(...).add is not a function" en la primera
	// relación de cualquier entidad sin `relaciones:` previo, justo el caso de
	// una entidad recién dada de alta por altaDeEntidadesFaltantes.
	if (!doc.has("relaciones")) doc.set("relaciones", doc.createNode([]));
	const nuevaRelacion = { tipo, destino };
	if (fuente) nuevaRelacion.fuente = fuente;
	if (principal === false) nuevaRelacion.principal = false;
	doc.get("relaciones", true).add(doc.createNode(nuevaRelacion));
	writeFileSync(entrada.ruta, doc.toString());
	entrada.datos.relaciones = [...relacionesDe(entrada), nuevaRelacion];
}

const TIPO_RELACION_VALIDO = /^[a-z]+(_[a-z]+)*$/;

// Registra un tipo de relación nuevo en el `relaciones:` de materia.yaml.
// A propósito NO usa parseDocument/toString (el patrón de escribirRelacion):
// materia.yaml tiene bloques con formato a mano (comentarios, un `capitulos:`
// con su propia indentación) que el serializador de `yaml` reformatea al
// volcar el documento entero, aunque no se toque esa parte — se comprobó
// haciendo un round-trip sin cambios y comparando el diff. Edición de texto
// dirigida, como el resto de escritura de YAML en curar-obra.mjs.
function registrarTipoRelacion({
	tipo,
	inversa,
	simetrica,
	pregunta,
	preguntaInversa,
}) {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	const lineas = texto.split("\n");
	if (lineas.some((l) => l === `    ${tipo}:`))
		throw new Error(`"${tipo}" ya existe en materia.yaml`);
	const indiceFuentes = lineas.indexOf("  fuentes:");
	if (indiceFuentes === -1)
		throw new Error('no encuentro "  fuentes:" en materia.yaml; no se escribe');

	const inversaReal = simetrica ? tipo : inversa;
	const bloque = [`    ${tipo}:`, `      inversa: ${inversaReal}`];
	if (simetrica) bloque.push("      simetrica: true");
	if (pregunta) bloque.push(`      pregunta: "${pregunta}"`);
	if (preguntaInversa)
		bloque.push(`      pregunta_inversa: "${preguntaInversa}"`);
	// La inversa se registra también, aunque sea solo con `inversa:` — mismo
	// patrón "documentado por completitud" que devora_a/devorado_por: nadie la
	// autoría a mano, pero conserva la simetría del registro.
	if (!simetrica && !lineas.some((l) => l === `    ${inversa}:`)) {
		bloque.push(`    ${inversa}:`, `      inversa: ${tipo}`);
	}

	lineas.splice(indiceFuentes, 0, ...bloque, "");
	writeFileSync(FICHERO_MATERIA, lineas.join("\n"));
}

async function elegirOrigen(rl, idsCitados) {
	console.log(
		`  origen — ${idsCitados.map((id, i) => `${i + 1}) ${id}`).join(", ")}`,
	);
	const respuesta = (
		await rl.question("  elige número o escribe el id: ")
	).trim();
	return idsCitados[Number(respuesta) - 1] ?? respuesta;
}

// Pide un nombre de relación nueva (ya se sabe que no está en `registro`),
// pregunta lo mínimo que exige registroRelacionSchema (`inversa` es
// obligatorio) y la escribe en materia.yaml. Devuelve el tipo tal cual
// (registrado o no) para que confirmarYEscribir dé el mensaje de error
// habitual si el usuario declina crearla.
async function crearTipoRelacion(rl, registro, tipo) {
	if (!TIPO_RELACION_VALIDO.test(tipo)) {
		console.log(
			`  "${tipo}" no sigue la convención (minúsculas y guion bajo); no se crea.`,
		);
		return tipo;
	}
	const simetricaResp = (
		await rl.question(
			`  ¿"${tipo}" es simétrica (mismo tipo en las dos direcciones, como "hermano_de")? (s/N) `,
		)
	)
		.trim()
		.toLowerCase();
	const simetrica = simetricaResp === "s";
	let inversa = tipo;
	if (!simetrica) {
		inversa = (
			await rl.question(
				`  nombre de su relación inversa (p. ej. "${tipo}_de"): `,
			)
		).trim();
		if (!inversa) {
			console.log("  falta la inversa; no se crea.");
			return tipo;
		}
	}
	const pregunta = (
		await rl.question(
			"  pregunta de práctica (opcional, usa {origen}/{destino}, enter para omitir): ",
		)
	).trim();
	const preguntaInversa = pregunta
		? (
				await rl.question("  pregunta inversa (opcional, enter para omitir): ")
			).trim()
		: "";

	registrarTipoRelacion({
		tipo,
		inversa,
		simetrica,
		pregunta,
		preguntaInversa,
	});
	registro[tipo] = { inversa: simetrica ? tipo : inversa };
	if (!simetrica && !(inversa in registro))
		registro[inversa] = { inversa: tipo };
	console.log(
		`  Registrada "${tipo}" en materia.yaml (inversa: "${simetrica ? tipo : inversa}").`,
	);
	return tipo;
}

async function elegirTipoRelacion(rl, registro) {
	const tipos = Object.keys(registro);
	console.log(`  tipo — ${tipos.map((t, i) => `${i + 1}) ${t}`).join(", ")}`);
	const respuesta = (
		await rl.question(
			'  elige número, escribe el tipo, o "nueva" para crear uno: ',
		)
	).trim();

	const porNumero = tipos[Number(respuesta) - 1];
	if (porNumero) return porNumero;
	if (tipos.includes(respuesta)) return respuesta;
	if (!respuesta) return respuesta;

	if (respuesta.toLowerCase() === "nueva") {
		const nombre = (
			await rl.question("  nombre de la relación nueva: ")
		).trim();
		return nombre ? crearTipoRelacion(rl, registro, nombre) : respuesta;
	}

	const crear = (
		await rl.question(
			`  "${respuesta}" no está en materia.yaml. ¿Crearla? (S/n) `,
		)
	)
		.trim()
		.toLowerCase();
	if (crear === "n") return respuesta;
	return crearTipoRelacion(rl, registro, respuesta);
}

async function main() {
	const id = process.argv[2];
	if (!id) {
		console.error("Uso: pnpm relaciones-de-relato <id-de-relato>");
		process.exit(1);
	}

	const encontrado = buscarRelatoPorId(id);
	if (!encontrado) {
		console.error(
			`No existe ningún relato con id "${id}" en ${relativa(CARPETA_RELATOS)}`,
		);
		process.exit(1);
	}
	const { texto: textoRelato } = encontrado;

	const { frontmatter, cuerpo } = extraerFrontmatterYCuerpo(textoRelato);
	const datosRelato = parse(frontmatter);
	const idsCitados = extraerIdsCitados(datosRelato, cuerpo);
	if (idsCitados.length === 0) {
		console.log(
			"Este relato no declara `participantes`/`lugar` ni cita `<E />`; nada que repasar.",
		);
		return;
	}

	const entidades = indexarEntidades();
	const idsRelatos = indexarRelatos();
	const registro = cargarRegistroRelaciones();
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout,
	});

	// --- fase 0: alta de entidades citadas sin YAML ---
	await altaDeEntidadesFaltantes(idsCitados, entidades, idsRelatos, rl);

	// --- fase 1: repaso ---
	console.log(
		`\n${datosRelato.nombre ?? id} — entidades citadas y sus relaciones actuales:\n`,
	);
	for (const pid of idsCitados) {
		const entrada = entidades.get(pid);
		console.log(`${pid}:`);
		if (!entrada) {
			console.log("  (no encuentro su YAML)");
			continue;
		}
		const relaciones = relacionesDe(entrada);
		if (relaciones.length === 0) {
			console.log("  (sin relaciones declaradas)");
			continue;
		}
		for (const r of relaciones) {
			const extra = [
				r.fuente && `fuente: ${r.fuente}`,
				r.principal === false && "no principal",
			]
				.filter(Boolean)
				.join(", ");
			console.log(`  ${r.tipo} → ${r.destino}${extra ? ` (${extra})` : ""}`);
		}
	}

	// --- fase 2: sugerencia por lectura ---
	const sugerencias = sugerirPorLectura(
		cuerpo,
		idsCitados,
		entidades,
		registro,
	);
	if (sugerencias.length > 0) {
		console.log(
			"\nSugerencias por lectura (heurístico de texto — revisa antes de aceptar):\n",
		);
		sugerencias.forEach((s, i) => {
			console.log(`  [${i + 1}] ${s.origen} --${s.tipo}--> ${s.destino}`);
			console.log(`      "…${s.fragmento}…"`);
		});
	} else {
		console.log("\nSin sugerencias por lectura (o ya están todas declaradas).");
	}

	// --- fase 3: completar interactivo ---
	function idConocido(candidato) {
		return entidades.has(candidato) || idsRelatos.has(candidato);
	}

	async function confirmarYEscribir({
		origen,
		tipo,
		destino,
		fuente,
		principal,
	}) {
		const entrada = entidades.get(origen);
		if (!entrada) {
			console.log(`  No existe el YAML de "${origen}"; no se escribe.`);
			return;
		}
		if (!(tipo in registro)) {
			console.log(
				`  "${tipo}" no está en el registro de materia.yaml; no se escribe.`,
			);
			return;
		}
		if (!idConocido(destino)) {
			console.log(`  "${destino}" no es un id conocido; no se escribe.`);
			return;
		}
		escribirRelacion(entrada, { tipo, destino, fuente, principal });
		console.log(`  Escrito en ${relativa(entrada.ruta)}`);
	}

	for (const s of sugerencias) {
		const respuesta = (
			await rl.question(
				`\n¿Aceptar "${s.origen} --${s.tipo}--> ${s.destino}"? (s/N) `,
			)
		)
			.trim()
			.toLowerCase();
		if (respuesta === "s") await confirmarYEscribir(s);
	}

	for (;;) {
		const seguir = (await rl.question("\n¿Añadir otra relación a mano? (s/N) "))
			.trim()
			.toLowerCase();
		if (seguir !== "s") break;

		const origen = await elegirOrigen(rl, idsCitados);
		const tipo = await elegirTipoRelacion(rl, registro);
		const destino = (await rl.question("  destino: ")).trim();
		const fuenteBruta = (
			await rl.question("  fuente (opcional, enter para omitir): ")
		).trim();
		const fuente = fuenteBruta || undefined;
		let principal;
		if (fuente) {
			const p = (await rl.question("  ¿es la relación principal? (S/n): "))
				.trim()
				.toLowerCase();
			principal = p === "n" ? false : undefined;
		}
		await confirmarYEscribir({ origen, tipo, destino, fuente, principal });
	}

	rl.close();
}

main();
