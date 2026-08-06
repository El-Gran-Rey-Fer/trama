#!/usr/bin/env node
// Servidor local para curar-relaciones.html: versión visual de
// relaciones-de-relato.mjs (mismo alcance — alta de entidades citadas,
// sugerencia por lectura, relaciones a mano — pero en el navegador en vez de
// la terminal). Sin dependencias nuevas: solo módulos nativos de Node y el
// parser `yaml` que ya usa el resto del proyecto.
//
// Uso: pnpm curar-relaciones
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
import { parse, parseDocument } from "yaml";

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
	return parse(texto)["mitologia-griega"];
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

function construirYamlEntidad({ id, tipo, nombre, resumen }) {
	return `id: ${id}\ntipo: ${tipo}\nnombre: ${nombre}\nresumen: ${resumen}\n`;
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
	const relaciones = doc.getIn(["mitologia-griega", "relaciones"], true);

	const definicionDirecta = { inversa };
	if (simetrica) definicionDirecta.simetrica = true;
	if (pregunta) definicionDirecta.pregunta = pregunta;
	if (preguntaInversa) definicionDirecta.pregunta_inversa = preguntaInversa;
	if (conjunto) definicionDirecta.conjunto = true;
	if (conjuntoInversa) definicionDirecta.conjunto_inversa = true;
	relaciones.set(tipo, doc.createNode(definicionDirecta));

	if (!simetrica) relaciones.set(inversa, doc.createNode({ inversa: tipo }));

	writeFileSync(FICHERO_MATERIA, doc.toString());
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

	if (!ID_VALIDO.test(id))
		return responderJson(res, 400, {
			error: "id inválido: minúsculas, números y guiones",
		});
	if (!nombre) return responderJson(res, 400, { error: "falta nombre" });

	const tipos = cargarMateria().tipos ?? [];
	if (!tipos.includes(tipo))
		return responderJson(res, 400, {
			error: `tipo "${tipo}" no está en materia.yaml`,
		});

	const entidades = indexarEntidades();
	const idsRelatos = new Set(listarRelatos().map((r) => r.id));
	if (entidades.has(id) || idsRelatos.has(id))
		return responderJson(res, 409, { error: `"${id}" ya existe` });

	const ruta = path.join(CARPETA_ENTIDADES, tipo, `${id}.yaml`);
	mkdirSync(path.dirname(ruta), { recursive: true });
	writeFileSync(ruta, construirYamlEntidad({ id, tipo, nombre, resumen }));
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

const servidor = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	try {
		if (req.method === "GET" && url.pathname === "/") {
			res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
			return res.end(
				readFileSync(path.join(RAIZ, "scripts/curar-relaciones.html")),
			);
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
		res.writeHead(404);
		res.end("no encontrado");
	} catch (error) {
		console.error(error);
		responderJson(res, 500, { error: error.message });
	}
});

servidor.listen(PUERTO, () => {
	console.log(`Curar relaciones: http://localhost:${PUERTO}`);
});
