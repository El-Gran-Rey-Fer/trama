#!/usr/bin/env node
// Servidor local para subir-prosa.html. Dos tareas sobre el mismo servidor:
//
// 1. Relaciones de un relato ya escrito (antes "curar-relaciones"): alta de
//    entidades citadas sin YAML, sugerencia de relaciones por lectura,
//    relaciones a mano. Mismo alcance que relaciones-de-relato.mjs, pero con
//    formularios en el navegador en vez de prompts de terminal.
// 2. Aterrizar una prosa nueva (de entidad, de obra o de relato) en el
//    fichero correcto de `content/`: valida las reglas cerradas de
//    docs/guia-de-prosa.md (sin frontmatter en prosa de entidad/obra, límite
//    de `<E>`, autoenlace prohibido, lista de componentes permitida) antes de
//    escribir, y da de alta los ids nuevos que la prosa cite.
//
// Sin dependencias nuevas: solo módulos nativos de Node y el parser `yaml`
// que ya usa el resto del proyecto.
//
// Uso: pnpm subir-prosa
//
// Duplica helpers de relaciones-de-relato.mjs (indexar entidades, extraer
// ids citados, heurístico de sugerencia, escritura de relación) en vez de
// importarlos: ningún otro script del proyecto comparte módulo con otro
// (nueva-obra.mjs y curar-obra.mjs tampoco lo hacen), así que cada uno se
// sigue pudiendo lanzar y leer de forma aislada.

import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse, parseDocument, Scalar } from "yaml";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_ENTIDADES = path.join(RAIZ, "content/mitologia-griega/entidades");
const CARPETA_RELATOS = path.join(RAIZ, "content/mitologia-griega/relatos");
const FICHERO_MATERIA = path.join(
	RAIZ,
	"content/mitologia-griega/materia.yaml",
);
const PUERTO = 4323;

const ID_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const TIPO_RELACION_VALIDO = /^[a-z][a-z0-9]*(_[a-z0-9]+)*$/;

// Mismas raíces de verbo que relaciones-de-relato.mjs — si se amplían allí,
// hay que ampliarlas aquí también.
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

function cargarMateria() {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	return parse(texto);
}

function indexarEntidades() {
	const indice = new Map();
	for (const ruta of listarYaml(CARPETA_ENTIDADES)) {
		const datos = parse(readFileSync(ruta, "utf-8"));
		if (datos?.id) indice.set(datos.id, { ruta, datos });
	}
	return indice;
}

function listarRelatos() {
	return listarMdx(CARPETA_RELATOS)
		.map((ruta) => {
			const texto = readFileSync(ruta, "utf-8");
			const id = texto.match(/^id:\s*(.+)$/m)?.[1]?.trim();
			const nombre = texto.match(/^nombre:\s*(.+)$/m)?.[1]?.trim();
			return id ? { id, nombre: nombre ?? id, ruta } : null;
		})
		.filter(Boolean);
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

// Idéntico a relaciones-de-relato.mjs: todo id que el MDX cita de verdad
// (`participantes`, `lugar`, cualquier `<E id="..." />` del cuerpo), no solo
// `participantes`.
function extraerIdsCitados(datosRelato, cuerpo) {
	const ids = new Set(datosRelato.participantes ?? []);
	if (datosRelato.lugar) ids.add(datosRelato.lugar);
	for (const m of cuerpo.matchAll(/<E\s+id\s*=\s*["']([^"']+)["']/g)) {
		ids.add(m[1]);
	}
	return [...ids];
}

function nombrePropuestoDesdeId(id) {
	const palabras = id.split("-");
	return [
		palabras[0][0].toUpperCase() + palabras[0].slice(1),
		...palabras.slice(1),
	].join(" ");
}

function sugerirPorLectura(cuerpo, idsCitados, entidades, registro) {
	const sugerencias = [];
	const vistas = new Set();
	const frases = cuerpo
		.replace(/\s+/g, " ")
		.split(/(?<=[.!?])\s+/)
		.map((f) => f.trim())
		.filter(Boolean);

	for (const frase of frases) {
		const minusculas = frase.toLowerCase();
		const enFrase = idsCitados.filter((pid) => {
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

function construirYamlEntidad({ id, tipo, nombre, resumen, etiquetas }) {
	let yaml = `id: ${id}\ntipo: ${tipo}\nnombre: ${nombre}\nresumen: ${resumen}\n`;
	if (etiquetas && etiquetas.length > 0) {
		yaml += `etiquetas: [${etiquetas.join(", ")}]\n`;
	}
	return yaml;
}

// Misma corrección que en relaciones-de-relato.mjs: `doc.set(k, [])` guarda
// el array plano tal cual (YAMLMap#set no pasa el valor por createNode), y el
// `.add` de abajo revienta con "doc.get(...).add is not a function" en la
// primera relación de una entidad sin `relaciones:` previo.
function escribirRelacion(entrada, { tipo, destino, fuente, principal }) {
	const textoActual = readFileSync(entrada.ruta, "utf-8");
	const doc = parseDocument(textoActual);
	if (!doc.has("relaciones")) doc.set("relaciones", doc.createNode([]));
	const nuevaRelacion = { tipo, destino };
	if (fuente) nuevaRelacion.fuente = fuente;
	if (principal === false) nuevaRelacion.principal = false;
	doc.get("relaciones", true).add(doc.createNode(nuevaRelacion));
	writeFileSync(entrada.ruta, doc.toString());
}

// Registra un tipo de relación nuevo en materia.yaml. Simétrica escribe una
// sola entrada (inversa: el propio tipo); asimétrica escribe dos, la directa
// con las plantillas y la inversa como puro puntero — mismo patrón que ya usa
// el resto del registro (ver padre_de/hijo_de vs. hermano_de).
function escribirTipoRelacion({
	tipo,
	inversa,
	simetrica,
	pregunta,
	preguntaInversa,
	conjunto,
	conjuntoInversa,
}) {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	const doc = parseDocument(texto);
	const relaciones = doc.get("relaciones", true);

	// entre comillas dobles, como el resto de plantillas pregunta/pregunta_inversa del registro.
	const comillas = (texto) =>
		Object.assign(new Scalar(texto), { type: Scalar.QUOTE_DOUBLE });

	const definicionDirecta = { inversa };
	if (simetrica) definicionDirecta.simetrica = true;
	if (pregunta) definicionDirecta.pregunta = comillas(pregunta);
	if (preguntaInversa)
		definicionDirecta.pregunta_inversa = comillas(preguntaInversa);
	if (conjunto) definicionDirecta.conjunto = true;
	if (conjuntoInversa) definicionDirecta.conjunto_inversa = true;
	relaciones.set(tipo, doc.createNode(definicionDirecta));

	if (!simetrica) relaciones.set(inversa, doc.createNode({ inversa: tipo }));

	writeFileSync(FICHERO_MATERIA, doc.toString());
}

// --- prosa nueva ---

// Mismo criterio que scripts/indice-de-contenido.mjs (mdxDisponibles), pero
// sin filtrar `tipo: obra`: aquí interesan también las obras sin prosa.
function listarEntidadesSinProsa() {
	const mdxDisponibles = new Set(
		listarMdx(CARPETA_ENTIDADES).map((f) => path.basename(f, ".mdx")),
	);
	return listarYaml(CARPETA_ENTIDADES)
		.map((ruta) => parse(readFileSync(ruta, "utf-8")))
		.filter((datos) => datos?.id && !mdxDisponibles.has(datos.id))
		.map((datos) => ({ id: datos.id, nombre: datos.nombre, tipo: datos.tipo }));
}

// Recuento orientativo: quita etiquetas y comentarios MDX antes de contar,
// para no inflar el número con `<E id="...">`.
function contarPalabras(texto) {
	const limpio = texto
		.replace(/\{\/\*[\s\S]*?\*\/\}/g, " ")
		.replace(/<[^>]+>/g, " ");
	return limpio.split(/\s+/).filter(Boolean).length;
}

function extraerComponentesUsados(cuerpo) {
	return [...cuerpo.matchAll(/<\/?([A-Z][a-zA-Z]*)\b/g)].map((m) => m[1]);
}

function extraerIdsEnlazados(cuerpo) {
	return [...cuerpo.matchAll(/<E\s+id\s*=\s*["']([^"']+)["']/g)].map(
		(m) => m[1],
	);
}

// Reglas de docs/guia-de-prosa.md §5/§6/§12 para prosa de entidad y de obra
// (mismo mecanismo, distinto apriete de límites). Las que bloquean son las
// objetivas del checklist; el recuento de palabras solo avisa.
function validarProsaEntidad(cuerpo, { id, tipo }) {
	const errores = [];
	const avisos = [];

	if (/^\s*---/.test(cuerpo)) {
		errores.push("la prosa de entidad/obra no lleva frontmatter (§5/§6)");
	}

	const permitidos = new Set(["E", "Fuente"]);
	const noPermitidos = [
		...new Set(
			extraerComponentesUsados(cuerpo).filter((c) => !permitidos.has(c)),
		),
	];
	if (noPermitidos.length > 0) {
		errores.push(
			`componente(s) no permitidos en prosa de entidad/obra: ${noPermitidos.join(", ")}`,
		);
	}

	const idsEnlazados = extraerIdsEnlazados(cuerpo);
	if (idsEnlazados.includes(id)) {
		errores.push(`la prosa enlaza a su propia entidad ("${id}"): prohibido`);
	}
	const repetidos = [
		...new Set(
			idsEnlazados.filter((eid, i) => idsEnlazados.indexOf(eid) !== i),
		),
	];
	if (repetidos.length > 0) {
		errores.push(
			`entidad(es) enlazada(s) más de una vez: ${repetidos.join(", ")}`,
		);
	}

	const maximoE = tipo === "obra" ? 2 : 3;
	if (idsEnlazados.length > maximoE) {
		errores.push(
			`${idsEnlazados.length} <E /> en el texto, máximo ${maximoE} en prosa de ${tipo === "obra" ? "obra" : "entidad"}`,
		);
	}

	const palabras = contarPalabras(cuerpo);
	const [minimo, maximo] = tipo === "obra" ? [80, 180] : [150, 350];
	if (palabras < minimo || palabras > maximo) {
		avisos.push(
			`${palabras} palabras, fuera de la banda orientativa ${minimo}-${maximo}`,
		);
	}

	return { errores, avisos, idsCitados: [...new Set(idsEnlazados)] };
}

// Reglas de §3/§7/§12 para un relato nuevo (lleva frontmatter completo, y el
// componente permitido es la lista larga: E, Fuente, Coleccion,
// TablaComparativa).
function validarProsaRelato(datosRelato, cuerpo) {
	const errores = [];
	const avisos = [];

	const obligatorios = ["id", "tipo", "nombre", "resumen", "era", "orden"];
	const faltantes = obligatorios.filter(
		(campo) =>
			datosRelato[campo] === undefined ||
			datosRelato[campo] === null ||
			datosRelato[campo] === "",
	);
	if (faltantes.length > 0) {
		errores.push(
			`faltan campos obligatorios en el frontmatter: ${faltantes.join(", ")}`,
		);
	}
	if (datosRelato.id && !ID_VALIDO.test(datosRelato.id)) {
		errores.push(
			`id "${datosRelato.id}" no cumple la convención (minúsculas, sin tildes, con guiones)`,
		);
	}

	const permitidos = new Set(["E", "Fuente", "Coleccion", "TablaComparativa"]);
	const noPermitidos = [
		...new Set(
			extraerComponentesUsados(cuerpo).filter((c) => !permitidos.has(c)),
		),
	];
	if (noPermitidos.length > 0) {
		errores.push(`componente(s) no permitidos: ${noPermitidos.join(", ")}`);
	}

	const idsEnlazados = extraerIdsEnlazados(cuerpo);
	if (datosRelato.id && idsEnlazados.includes(datosRelato.id)) {
		errores.push(
			`la prosa enlaza a su propio relato ("${datosRelato.id}"): prohibido`,
		);
	}

	const palabras = contarPalabras(cuerpo);
	if (palabras < 600 || palabras > 1200) {
		avisos.push(`${palabras} palabras, fuera de la banda orientativa 600-1200`);
	}

	return {
		errores,
		avisos,
		idsCitados: extraerIdsCitados(datosRelato, cuerpo),
	};
}

// --- lectura del estado de un relato para la UI ---

function analizarRelato(id) {
	const relatoResumen = listarRelatos().find((r) => r.id === id);
	if (!relatoResumen) return null;

	const texto = readFileSync(relatoResumen.ruta, "utf-8");
	const { cuerpo } = extraerFrontmatterYCuerpo(texto);
	const datosRelato = parse(extraerFrontmatterYCuerpo(texto).frontmatter);
	const idsCitados = extraerIdsCitados(datosRelato, cuerpo);

	const entidades = indexarEntidades();
	const relatos = listarRelatos();
	const idsRelatos = new Set(relatos.map((r) => r.id));
	const materia = cargarMateria();
	const registro = materia.relaciones ?? {};

	const entidadesInfo = idsCitados.map((eid) => {
		const entrada = entidades.get(eid);
		if (!entrada) return { id: eid, existe: false };
		return {
			id: eid,
			existe: true,
			nombre: entrada.datos.nombre,
			tipo: entrada.datos.tipo,
			relaciones: relacionesDe(entrada),
		};
	});

	const sugerencias = sugerirPorLectura(
		cuerpo,
		idsCitados,
		entidades,
		registro,
	);

	return {
		id,
		nombre: datosRelato.nombre ?? id,
		entidades: entidadesInfo,
		sugerencias,
		tipos: materia.tipos ?? [],
		tiposRelacion: Object.keys(registro),
		fuentes: Object.keys(materia.fuentes ?? {}),
		etiquetas: materia.etiquetas ?? [],
		idsConocidos: [...entidades.keys(), ...idsRelatos].sort((a, b) =>
			a.localeCompare(b, "es"),
		),
		propuestas: Object.fromEntries(
			idsCitados
				.filter((eid) => !entidades.has(eid))
				.map((eid) => [eid, nombrePropuestoDesdeId(eid)]),
		),
	};
}

// --- servidor ---

function leerCuerpoJson(req) {
	return new Promise((resolve, reject) => {
		const trozos = [];
		req.on("data", (trozo) => trozos.push(trozo));
		req.on("end", () => {
			try {
				resolve(
					trozos.length
						? JSON.parse(Buffer.concat(trozos).toString("utf8"))
						: {},
				);
			} catch (error) {
				reject(error);
			}
		});
		req.on("error", reject);
	});
}

function responderJson(res, estado, cuerpo) {
	res.writeHead(estado, { "content-type": "application/json; charset=utf-8" });
	res.end(JSON.stringify(cuerpo));
}

async function manejarAltaEntidad(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const id = String(cuerpo.id || "").trim();
	const nombre = String(cuerpo.nombre || "").trim();
	const tipo = String(cuerpo.tipo || "").trim();
	const resumen = String(cuerpo.resumen || "").trim() || "PENDIENTE";
	const etiquetas = Array.isArray(cuerpo.etiquetas)
		? cuerpo.etiquetas.map((e) => String(e).trim()).filter(Boolean)
		: [];

	if (!ID_VALIDO.test(id))
		return responderJson(res, 400, {
			error: "id inválido: minúsculas, números y guiones",
		});
	if (!nombre) return responderJson(res, 400, { error: "falta nombre" });

	const materia = cargarMateria();
	const tipos = materia.tipos ?? [];
	if (!tipos.includes(tipo))
		return responderJson(res, 400, {
			error: `tipo "${tipo}" no está en materia.yaml`,
		});

	const etiquetasValidas = new Set(materia.etiquetas ?? []);
	const etiquetasDesconocidas = etiquetas.filter(
		(e) => !etiquetasValidas.has(e),
	);
	if (etiquetasDesconocidas.length > 0)
		return responderJson(res, 400, {
			error: `etiqueta(s) desconocida(s): ${etiquetasDesconocidas.join(", ")}`,
		});

	const entidades = indexarEntidades();
	const idsRelatos = new Set(listarRelatos().map((r) => r.id));
	if (entidades.has(id) || idsRelatos.has(id))
		return responderJson(res, 409, { error: `"${id}" ya existe` });

	const ruta = path.join(CARPETA_ENTIDADES, tipo, `${id}.yaml`);
	mkdirSync(path.dirname(ruta), { recursive: true });
	writeFileSync(
		ruta,
		construirYamlEntidad({ id, tipo, nombre, resumen, etiquetas }),
	);
	responderJson(res, 200, { ok: true, ruta: relativa(ruta) });
}

async function manejarRelacion(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const origen = String(cuerpo.origen || "").trim();
	const tipo = String(cuerpo.tipo || "").trim();
	const destino = String(cuerpo.destino || "").trim();
	const fuente = String(cuerpo.fuente || "").trim() || undefined;
	const principal = cuerpo.principal === false ? false : undefined;

	const entidades = indexarEntidades();
	const idsRelatos = new Set(listarRelatos().map((r) => r.id));
	const registro = cargarMateria().relaciones ?? {};

	const entrada = entidades.get(origen);
	if (!entrada)
		return responderJson(res, 404, {
			error: `no existe el YAML de "${origen}"`,
		});
	if (!(tipo in registro))
		return responderJson(res, 400, {
			error: `"${tipo}" no está en el registro de materia.yaml`,
		});
	if (!entidades.has(destino) && !idsRelatos.has(destino))
		return responderJson(res, 400, {
			error: `"${destino}" no es un id conocido`,
		});

	escribirRelacion(entrada, { tipo, destino, fuente, principal });
	responderJson(res, 200, { ok: true, ruta: relativa(entrada.ruta) });
}

async function manejarTipoRelacion(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const tipo = String(cuerpo.tipo || "").trim();
	const simetrica = cuerpo.simetrica === true;
	const inversa = simetrica ? tipo : String(cuerpo.inversa || "").trim();
	const pregunta = String(cuerpo.pregunta || "").trim() || undefined;
	const preguntaInversa =
		String(cuerpo.preguntaInversa || "").trim() || undefined;
	const conjunto = cuerpo.conjunto === true;
	const conjuntoInversa = cuerpo.conjuntoInversa === true;

	if (!TIPO_RELACION_VALIDO.test(tipo))
		return responderJson(res, 400, {
			error: "tipo inválido: minúsculas, números y guiones bajos",
		});
	if (!simetrica) {
		if (!TIPO_RELACION_VALIDO.test(inversa))
			return responderJson(res, 400, {
				error: "inversa inválida: minúsculas, números y guiones bajos",
			});
		if (inversa === tipo)
			return responderJson(res, 400, {
				error: "si tipo e inversa son iguales, marca «simétrica»",
			});
	}

	const registro = cargarMateria().relaciones ?? {};
	if (tipo in registro)
		return responderJson(res, 409, { error: `"${tipo}" ya existe` });
	if (!simetrica && inversa in registro)
		return responderJson(res, 409, { error: `"${inversa}" ya existe` });

	escribirTipoRelacion({
		tipo,
		inversa,
		simetrica,
		pregunta,
		preguntaInversa,
		conjunto,
		conjuntoInversa,
	});
	responderJson(res, 200, { ok: true, tipo, inversa });
}

// Cuerpo de prosa de una entidad o una obra: la entidad tiene que existir ya
// (dada de alta antes, a mano o vía la pestaña de relaciones) — la prosa de
// entidad/obra no crea la entidad, solo le pone cuerpo. Escribe el `.mdx`
// aunque cite ids sin YAML todavía: se devuelven en `idsNuevos` para darlos
// de alta con el mismo formulario que usa la pestaña de relaciones.
async function manejarProsaEntidad(req, res) {
	const cuerpoPeticion = await leerCuerpoJson(req);
	const id = String(cuerpoPeticion.id || "").trim();
	const cuerpo = String(cuerpoPeticion.cuerpo || "");
	const alt = String(cuerpoPeticion.alt || "").trim();

	const entidades = indexarEntidades();
	const entrada = entidades.get(id);
	if (!entrada)
		return responderJson(res, 404, {
			error: `no existe el YAML de "${id}": la prosa de entidad/obra requiere una entidad ya dada de alta`,
		});

	const tipo = entrada.datos.tipo;
	const { errores, avisos, idsCitados } = validarProsaEntidad(cuerpo, {
		id,
		tipo,
	});
	if (errores.length > 0) return responderJson(res, 400, { errores });

	const idsRelatos = new Set(listarRelatos().map((r) => r.id));
	const idsNuevos = idsCitados.filter(
		(eid) => !entidades.has(eid) && !idsRelatos.has(eid),
	);

	const rutaMdx = path.join(path.dirname(entrada.ruta), `${id}.mdx`);
	writeFileSync(rutaMdx, cuerpo);

	if (tipo === "obra" && alt) {
		const doc = parseDocument(readFileSync(entrada.ruta, "utf-8"));
		if (!doc.has("imagen")) doc.set("imagen", doc.createNode({}));
		doc.get("imagen", true).set("alt", alt);
		writeFileSync(entrada.ruta, doc.toString());
	}

	responderJson(res, 200, {
		ok: true,
		ruta: relativa(rutaMdx),
		avisos,
		idsNuevos,
		propuestas: Object.fromEntries(
			idsNuevos.map((eid) => [eid, nombrePropuestoDesdeId(eid)]),
		),
	});
}

// Relato nuevo: a diferencia de la prosa de entidad/obra, aquí sí se crea el
// fichero (con frontmatter completo) desde cero. La carpeta sale de `era`,
// igual que ya viven organizados los relatos existentes.
async function manejarProsaRelato(req, res) {
	const cuerpoPeticion = await leerCuerpoJson(req);
	const mdxCompleto = String(cuerpoPeticion.mdxCompleto || "");

	let frontmatter;
	let cuerpo;
	try {
		({ frontmatter, cuerpo } = extraerFrontmatterYCuerpo(mdxCompleto));
	} catch (error) {
		return responderJson(res, 400, { errores: [error.message] });
	}

	let datosRelato;
	try {
		datosRelato = parse(frontmatter) ?? {};
	} catch (error) {
		return responderJson(res, 400, {
			errores: [`frontmatter inválido: ${error.message}`],
		});
	}

	const { errores, avisos, idsCitados } = validarProsaRelato(
		datosRelato,
		cuerpo,
	);
	if (errores.length > 0) return responderJson(res, 400, { errores });

	const id = datosRelato.id;
	const entidades = indexarEntidades();
	const idsRelatos = new Set(listarRelatos().map((r) => r.id));
	if (entidades.has(id) || idsRelatos.has(id))
		return responderJson(res, 409, { error: `"${id}" ya existe` });

	const era = String(datosRelato.era || "").trim();
	const carpeta = era ? path.join(CARPETA_RELATOS, era) : CARPETA_RELATOS;
	mkdirSync(carpeta, { recursive: true });
	const ruta = path.join(carpeta, `${id}.mdx`);
	writeFileSync(ruta, mdxCompleto);

	const idsNuevos = idsCitados.filter(
		(eid) => eid !== id && !entidades.has(eid) && !idsRelatos.has(eid),
	);

	responderJson(res, 200, {
		ok: true,
		ruta: relativa(ruta),
		avisos,
		idsNuevos,
		propuestas: Object.fromEntries(
			idsNuevos.map((eid) => [eid, nombrePropuestoDesdeId(eid)]),
		),
	});
}

const servidor = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	try {
		if (req.method === "GET" && url.pathname === "/") {
			res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
			return res.end(readFileSync(path.join(RAIZ, "scripts/subir-prosa.html")));
		}
		if (req.method === "GET" && url.pathname === "/api/relatos") {
			return responderJson(
				res,
				200,
				listarRelatos()
					.map(({ id, nombre }) => ({ id, nombre }))
					.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")),
			);
		}
		if (req.method === "GET" && url.pathname === "/api/relato") {
			const id = url.searchParams.get("id") || "";
			const analisis = analizarRelato(id);
			if (!analisis)
				return responderJson(res, 404, {
					error: `no existe el relato "${id}"`,
				});
			return responderJson(res, 200, analisis);
		}
		if (req.method === "POST" && url.pathname === "/api/entidad") {
			return await manejarAltaEntidad(req, res);
		}
		if (req.method === "POST" && url.pathname === "/api/relacion") {
			return await manejarRelacion(req, res);
		}
		if (req.method === "POST" && url.pathname === "/api/tipo-relacion") {
			return await manejarTipoRelacion(req, res);
		}
		if (req.method === "GET" && url.pathname === "/api/materia") {
			const materia = cargarMateria();
			return responderJson(res, 200, {
				tipos: materia.tipos ?? [],
				etiquetas: materia.etiquetas ?? [],
			});
		}
		if (req.method === "GET" && url.pathname === "/api/prosa/pendientes") {
			return responderJson(
				res,
				200,
				listarEntidadesSinProsa().sort((a, b) =>
					(a.nombre ?? "").localeCompare(b.nombre ?? "", "es"),
				),
			);
		}
		if (req.method === "POST" && url.pathname === "/api/prosa/entidad") {
			return await manejarProsaEntidad(req, res);
		}
		if (req.method === "POST" && url.pathname === "/api/prosa/relato") {
			return await manejarProsaRelato(req, res);
		}
		res.writeHead(404);
		res.end("no encontrado");
	} catch (error) {
		console.error(error);
		responderJson(res, 500, { error: error.message });
	}
});

servidor.listen(PUERTO, () => {
	console.log(`Subir prosa: http://localhost:${PUERTO}`);
});
