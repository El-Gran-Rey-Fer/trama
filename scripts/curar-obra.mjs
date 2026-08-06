#!/usr/bin/env node
// Servidor local para curar-obra.html. Plan de imágenes y álbum, carril B: da de
// alta obras desde una imagen (del ordenador o ya presente en el repo), y
// gestiona sus relaciones `representa` con foco. Sin dependencias nuevas: solo
// módulos nativos de Node.
//
// Uso: pnpm curar-obra

import { createReadStream } from "node:fs";
import { mkdir, readdir, readFile, rename, writeFile } from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_IMG = path.join(RAIZ, "public/img/gr");
const CARPETA_OBRAS = path.join(CARPETA_IMG, "obras");
const CARPETA_ENTIDADES = path.join(RAIZ, "content/mitologia-griega/entidades");
// Las obras viven en su propia subcarpeta dentro de entidades/ (no mezclarse
// con el resto), igual que sus imágenes viven en public/img/gr/obras/. El id
// sigue saliendo del YAML, no de la ruta (content.config.ts glob recursivo),
// así que esto no cambia cómo se resuelven las relaciones.
const CARPETA_ENTIDADES_OBRAS = path.join(CARPETA_ENTIDADES, "obras");
const CARPETA_RELATOS = path.join(RAIZ, "content/mitologia-griega/relatos");
const PUERTO = 4322;

const EXTENSIONES_PERMITIDAS = new Set([
	"jpg",
	"jpeg",
	"png",
	"webp",
	"gif",
	"svg",
]);
const TIPOS_MIME = {
	".html": "text/html; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".png": "image/png",
	".webp": "image/webp",
	".gif": "image/gif",
	".svg": "image/svg+xml",
};

// --- utilidades de texto/YAML, a mano: el resto del proyecto tampoco usa un
// parser de YAML (ver nueva-obra.mjs), y estos ficheros los escribimos nosotros
// mismos con un formato controlado. ---

function idValido(id) {
	return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id);
}

function escaparEscalar(valor) {
	const texto = String(valor ?? "");
	const necesitaComillas =
		texto === "" ||
		texto.trim() !== texto ||
		/^[-?:!&*[\]{}|>'"%@`#]/.test(texto) ||
		texto.includes(": ") ||
		texto.includes(" #");
	if (!necesitaComillas) return texto;
	return `"${texto.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function construirBloqueRelaciones(items) {
	return items
		.map((item) => {
			const lineas = [`  - tipo: ${item.tipo}`, `    destino: ${item.destino}`];
			if (item.foco)
				lineas.push(`    foco: [${item.foco[0]}, ${item.foco[1]}]`);
			if (item.recorte)
				lineas.push(`    recorte: [${item.recorte[0]}, ${item.recorte[1]}]`);
			if (item.nota) lineas.push(`    nota: ${escaparEscalar(item.nota)}`);
			return lineas.join("\n");
		})
		.join("\n");
}

function parsearItemsRelaciones(bloqueTexto) {
	const lineas = bloqueTexto.split("\n");
	const items = [];
	let actual = null;
	for (const linea of lineas) {
		if (/^ {2}- /.test(linea)) {
			if (actual) items.push(actual);
			actual = [linea];
		} else if (actual) {
			actual.push(linea);
		}
	}
	if (actual) items.push(actual);
	return items.map((lineasItem) => {
		const texto = lineasItem.join("\n");
		const tipo = texto.match(/tipo:\s*(.+)$/m)?.[1]?.trim();
		return { texto, tipo };
	});
}

// Localiza, dentro de `lineas`, el bloque indentado que cuelga de una clave de
// nivel superior (p. ej. `relaciones:` o `imagen:`): el índice de esa línea y
// el índice donde termina su contenido indentado.
function localizarBloqueClave(lineas, clave) {
	const indiceClave = lineas.findIndex((l) =>
		new RegExp(`^${clave}:\\s*$`).test(l),
	);
	if (indiceClave === -1) return null;
	let fin = indiceClave + 1;
	while (
		fin < lineas.length &&
		(lineas[fin] === "" || /^ {2,}/.test(lineas[fin]))
	)
		fin++;
	return { indiceClave, fin };
}

function localizarBloqueRelaciones(lineas) {
	return localizarBloqueClave(lineas, "relaciones");
}

// Añade, reemplaza o quita una línea `  <campo>: <valor>` dentro del bloque
// `imagen:` de una obra ya existente. Mismo estilo regex-based que el resto
// del fichero: no hay parser de YAML, se edita texto con cuidado.
function escribirCampoImagen(yamlTexto, campo, valor) {
	const lineas = yamlTexto.split("\n");
	const bloque = localizarBloqueClave(lineas, "imagen");
	if (!bloque) return yamlTexto; // toda obra tiene `imagen`; no debería pasar
	const indiceRelativo = lineas
		.slice(bloque.indiceClave + 1, bloque.fin)
		.findIndex((l) => new RegExp(`^\\s{2}${campo}:`).test(l));
	const indiceAbsoluto =
		indiceRelativo === -1 ? -1 : bloque.indiceClave + 1 + indiceRelativo;
	if (valor === null || valor === undefined) {
		if (indiceAbsoluto === -1) return yamlTexto;
		lineas.splice(indiceAbsoluto, 1);
		return lineas.join("\n");
	}
	if (indiceAbsoluto !== -1) {
		lineas[indiceAbsoluto] = `  ${campo}: ${valor}`;
		return lineas.join("\n");
	}
	lineas.splice(bloque.fin, 0, `  ${campo}: ${valor}`);
	return lineas.join("\n");
}

function parsearRelacionesRepresenta(yamlTexto) {
	const lineas = yamlTexto.split("\n");
	const bloque = localizarBloqueRelaciones(lineas);
	if (!bloque) return [];
	const items = parsearItemsRelaciones(
		lineas.slice(bloque.indiceClave + 1, bloque.fin).join("\n"),
	);
	return items
		.filter((item) => item.tipo === "representa")
		.map((item) => {
			const destino = item.texto.match(/destino:\s*(.+)$/m)?.[1]?.trim();
			const focoBruto = item.texto.match(/foco:\s*\[([^\]]+)\]/m)?.[1];
			const recorteBruto = item.texto.match(/recorte:\s*\[([^\]]+)\]/m)?.[1];
			const nota = item.texto.match(/nota:\s*(.+)$/m)?.[1]?.trim();
			const foco = focoBruto
				? focoBruto.split(",").map((n) => Number(n.trim()))
				: undefined;
			const recorte = recorteBruto
				? recorteBruto.split(",").map((n) => Number(n.trim()))
				: undefined;
			return { destino, foco, recorte, nota };
		});
}

// Sustituye, dentro de `relaciones:`, solo los items `tipo: representa` por
// `nuevasRepresenta`. Conserva cualquier otro tipo de relación tal cual estaba,
// y quita la clave entera si al final no queda ningún item (el schema espera un
// array, no una clave vacía).
function reemplazarRelacionesRepresenta(yamlTexto, nuevasRepresenta) {
	const lineas = yamlTexto.split("\n");
	const bloqueNuevo = construirBloqueRelaciones(
		nuevasRepresenta.map((r) => ({
			tipo: "representa",
			destino: r.destino,
			foco: r.foco,
			recorte: r.recorte,
			nota: r.nota,
		})),
	);
	const bloque = localizarBloqueRelaciones(lineas);

	if (!bloque) {
		let fin = lineas.length;
		while (
			fin > 0 &&
			(lineas[fin - 1].trim() === "" || lineas[fin - 1].trim().startsWith("#"))
		)
			fin--;
		const cabecera = lineas.slice(0, fin);
		while (cabecera.length && cabecera[cabecera.length - 1].trim() === "")
			cabecera.pop();
		if (!bloqueNuevo) return `${cabecera.join("\n")}\n`;
		return `${cabecera.join("\n")}\nrelaciones:\n${bloqueNuevo}\n`;
	}

	const items = parsearItemsRelaciones(
		lineas.slice(bloque.indiceClave + 1, bloque.fin).join("\n"),
	);
	const conservados = items
		.filter((item) => item.tipo !== "representa")
		.map((item) => item.texto);
	const partes = bloqueNuevo ? [...conservados, bloqueNuevo] : conservados;

	const antes = lineas.slice(0, bloque.indiceClave);
	const despues = lineas.slice(bloque.fin);

	if (partes.length === 0)
		return `${[...antes, ...despues].join("\n").replace(/\n*$/, "")}\n`;
	return `${[...antes, "relaciones:", partes.join("\n"), ...despues].join("\n").replace(/\n*$/, "")}\n`;
}

// Sin atributos (autor/fecha/periodo/soporte/museo): nada los lee todavía —
// son de una pantalla que no es de este hito — y pedirlos en cada obra hacía
// la curación pesada para cero beneficio actual. Un solo campo de fuente en
// vez de credito+origen separados: casi siempre es el mismo enlace de
// Wikimedia Commons, y separar en dos no aportaba nada que ese enlace no diera
// ya. Se escribe solo en `origen`: el render (FichaEntidad.astro) muestra la
// etiqueta "Fuente" cuando no hay `credito` propio, así que no hace falta
// duplicar el enlace. Tampoco se pide `alt`: si falta, el render cae solo al
// nombre de la entidad (Casilla.astro, FichaEntidad.astro,
// casillaCliente.ts) — escribir aquí un "PENDIENTE" sería peor que ese valor
// por defecto.
function construirYamlObraNueva({
	id,
	nombre,
	fuente,
	archivo,
	ancho,
	alto,
	relaciones,
}) {
	const lineas = [
		`id: ${id}`,
		"tipo: obra",
		`nombre: ${escaparEscalar(nombre)}`,
		"imagen:",
		`  archivo: ${archivo}`,
		`  origen: ${escaparEscalar(fuente)}`,
	];
	if (ancho) lineas.push(`  ancho: ${ancho}`);
	if (alto) lineas.push(`  alto: ${alto}`);
	const bloqueRelaciones = construirBloqueRelaciones(
		relaciones.map((r) => ({
			tipo: "representa",
			destino: r.destino,
			foco: r.foco,
			recorte: r.recorte,
			nota: r.nota,
		})),
	);
	if (bloqueRelaciones) lineas.push("relaciones:", bloqueRelaciones);
	return `${lineas.join("\n")}\n`;
}

// --- lectura del estado del repo ---

async function listarEntidades() {
	const resultado = [];
	for (const carpeta of [
		CARPETA_ENTIDADES,
		CARPETA_ENTIDADES_OBRAS,
		CARPETA_RELATOS,
	]) {
		// Los relatos viven en subcarpetas por era; entidades/obras no tiene anidamiento propio.
		const ficheros = await readdir(carpeta, {
			recursive: carpeta === CARPETA_RELATOS,
		}).catch(() => []);
		for (const fichero of ficheros) {
			if (!fichero.endsWith(".yaml") && !fichero.endsWith(".mdx")) continue;
			const texto = await readFile(path.join(carpeta, fichero), "utf8");
			const id = texto.match(/^id:\s*(.+)$/m)?.[1]?.trim();
			const nombre = texto.match(/^nombre:\s*(.+)$/m)?.[1]?.trim();
			const tipo = texto.match(/^tipo:\s*(.+)$/m)?.[1]?.trim();
			const retrato = texto.match(/^retrato:\s*(.+)$/m)?.[1]?.trim();
			if (id && nombre)
				resultado.push({
					id,
					nombre: nombre.replace(/^"|"$/g, ""),
					tipo,
					retrato,
				});
		}
	}
	resultado.sort((a, b) => a.nombre.localeCompare(b.nombre, "es"));
	return resultado;
}

async function listarImagenes() {
	async function recorrer(carpeta, prefijo) {
		const entradas = await readdir(carpeta, { withFileTypes: true }).catch(
			() => [],
		);
		let resultado = [];
		for (const entrada of entradas) {
			if (entrada.isDirectory()) {
				resultado = resultado.concat(
					await recorrer(
						path.join(carpeta, entrada.name),
						`${prefijo}${entrada.name}/`,
					),
				);
			} else {
				const ext = path.extname(entrada.name).slice(1).toLowerCase();
				if (!EXTENSIONES_PERMITIDAS.has(ext)) continue;
				const id = entrada.name.slice(0, -(ext.length + 1));
				resultado.push({ ruta: `${prefijo}${entrada.name}`, id, ext });
			}
		}
		return resultado;
	}
	const imagenes = await recorrer(CARPETA_IMG, "");
	const resultado = [];
	for (const img of imagenes) {
		const tieneYaml = await readFile(
			path.join(CARPETA_ENTIDADES_OBRAS, `${img.id}.yaml`),
			"utf8",
		)
			.then(() => true)
			.catch(() => false);
		resultado.push({ ...img, tieneYaml });
	}
	resultado.sort((a, b) => a.ruta.localeCompare(b.ruta, "es"));
	return resultado;
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

async function manejarNuevaObra(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const id = String(cuerpo.id || "").trim();
	if (!idValido(id))
		return responderJson(res, 400, {
			error: "id inválido: minúsculas, números y guiones",
		});
	const fuente = String(cuerpo.fuente || "").trim();
	if (!fuente)
		return responderJson(res, 400, {
			error:
				"falta la fuente (enlace de Wikimedia Commons u origen equivalente)",
		});

	const rutaYaml = path.join(CARPETA_ENTIDADES_OBRAS, `${id}.yaml`);
	const yaExiste = await readFile(rutaYaml, "utf8")
		.then(() => true)
		.catch(() => false);
	if (yaExiste)
		return responderJson(res, 409, {
			error: `ya existe content/mitologia-griega/entidades/obras/${id}.yaml`,
		});

	const origenImagen = cuerpo.origenImagen || {};
	let extension;
	await mkdir(CARPETA_OBRAS, { recursive: true });
	await mkdir(CARPETA_ENTIDADES_OBRAS, { recursive: true });
	const rutaDestino = (ext) => path.join(CARPETA_OBRAS, `${id}.${ext}`);

	if (origenImagen.modo === "subida") {
		extension = String(origenImagen.nombreArchivo || "")
			.split(".")
			.pop()
			.toLowerCase();
		if (!EXTENSIONES_PERMITIDAS.has(extension))
			return responderJson(res, 400, {
				error: `extensión no permitida: ${extension}`,
			});
		const datos = Buffer.from(
			String(origenImagen.datosBase64 || "")
				.split(",")
				.pop(),
			"base64",
		);
		await writeFile(rutaDestino(extension), datos);
	} else if (origenImagen.modo === "repo") {
		const rutaRelativa = String(origenImagen.ruta || "");
		const rutaAbsoluta = path.normalize(path.join(CARPETA_IMG, rutaRelativa));
		if (!rutaAbsoluta.startsWith(CARPETA_IMG))
			return responderJson(res, 400, { error: "ruta fuera de public/img/gr" });
		extension = path.extname(rutaAbsoluta).slice(1).toLowerCase();
		if (!EXTENSIONES_PERMITIDAS.has(extension))
			return responderJson(res, 400, {
				error: `extensión no permitida: ${extension}`,
			});
		if (rutaAbsoluta !== rutaDestino(extension))
			await rename(rutaAbsoluta, rutaDestino(extension));
	} else {
		return responderJson(res, 400, {
			error: "origenImagen.modo debe ser 'subida' o 'repo'",
		});
	}

	const yaml = construirYamlObraNueva({
		id,
		nombre: cuerpo.nombre || id,
		fuente,
		archivo: `/img/gr/obras/${id}.${extension}`,
		ancho: Number(cuerpo.imagenAncho) || undefined,
		alto: Number(cuerpo.imagenAlto) || undefined,
		relaciones: Array.isArray(cuerpo.relaciones) ? cuerpo.relaciones : [],
	});
	await writeFile(rutaYaml, yaml);
	responderJson(res, 200, { ok: true, id });
}

async function manejarGuardarRelaciones(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const id = String(cuerpo.id || "").trim();
	const rutaYaml = path.join(CARPETA_ENTIDADES_OBRAS, `${id}.yaml`);
	const yamlActual = await readFile(rutaYaml, "utf8").catch(() => null);
	if (yamlActual === null)
		return responderJson(res, 404, {
			error: `no existe content/mitologia-griega/entidades/obras/${id}.yaml`,
		});

	const relaciones = Array.isArray(cuerpo.relaciones) ? cuerpo.relaciones : [];
	let yamlNuevo = reemplazarRelacionesRepresenta(yamlActual, relaciones);
	// Autocompleta las dimensiones naturales de la imagen la primera vez que se
	// reabre y guarda una obra ya existente (curada antes de este campo).
	if (cuerpo.imagenAncho)
		yamlNuevo = escribirCampoImagen(
			yamlNuevo,
			"ancho",
			Number(cuerpo.imagenAncho),
		);
	if (cuerpo.imagenAlto)
		yamlNuevo = escribirCampoImagen(
			yamlNuevo,
			"alto",
			Number(cuerpo.imagenAlto),
		);
	await writeFile(rutaYaml, yamlNuevo);
	responderJson(res, 200, { ok: true });
}

// Localiza el fichero de una entidad "normal" (no obra) por id, probando las
// dos carpetas donde puede vivir. Los relatos viven en CARPETA_RELATOS como
// `.mdx` y no tienen campo `retrato`; no se prueban aquí a propósito.
async function rutaEntidad(id) {
	for (const carpeta of [CARPETA_ENTIDADES, CARPETA_ENTIDADES_OBRAS]) {
		const ruta = path.join(carpeta, `${id}.yaml`);
		const existe = await readFile(ruta, "utf8")
			.then(() => true)
			.catch(() => false);
		if (existe) return ruta;
	}
	return null;
}

// Añade, reemplaza o quita la línea `retrato: <id-obra>` (campo escalar de
// nivel superior, no una lista) en el YAML de una entidad.
function escribirCampoRetrato(yamlTexto, obraId) {
	const lineas = yamlTexto.split("\n");
	const indice = lineas.findIndex((l) => /^retrato:\s*.*$/.test(l));
	if (obraId === null) {
		if (indice === -1) return yamlTexto;
		lineas.splice(indice, 1);
		return lineas.join("\n");
	}
	if (indice !== -1) {
		lineas[indice] = `retrato: ${obraId}`;
		return lineas.join("\n");
	}
	const texto = lineas.join("\n").replace(/\n*$/, "");
	return `${texto}\nretrato: ${obraId}\n`;
}

async function manejarRetrato(req, res) {
	const cuerpo = await leerCuerpoJson(req);
	const destino = String(cuerpo.destino || "").trim();
	const obraId =
		cuerpo.obraId === null ? null : String(cuerpo.obraId || "").trim();
	const ruta = await rutaEntidad(destino);
	if (!ruta)
		return responderJson(res, 404, {
			error: `no existe entidades/${destino}.yaml (¿es un relato?)`,
		});
	const yamlActual = await readFile(ruta, "utf8");
	await writeFile(ruta, escribirCampoRetrato(yamlActual, obraId));
	responderJson(res, 200, { ok: true });
}

async function manejarObra(_req, res, url) {
	const id = url.searchParams.get("id") || "";
	const rutaYaml = path.join(CARPETA_ENTIDADES_OBRAS, `${id}.yaml`);
	const yamlActual = await readFile(rutaYaml, "utf8").catch(() => null);
	if (yamlActual === null)
		return responderJson(res, 404, { error: "no existe" });
	responderJson(res, 200, {
		relaciones: parsearRelacionesRepresenta(yamlActual),
	});
}

async function servirEstatico(_req, res, rutaFichero) {
	const contentType =
		TIPOS_MIME[path.extname(rutaFichero).toLowerCase()] ||
		"application/octet-stream";
	res.writeHead(200, { "content-type": contentType });
	createReadStream(rutaFichero).pipe(res);
}

const servidor = http.createServer(async (req, res) => {
	const url = new URL(req.url, `http://${req.headers.host}`);
	try {
		if (req.method === "GET" && url.pathname === "/") {
			return servirEstatico(
				req,
				res,
				path.join(RAIZ, "scripts/curar-obra.html"),
			);
		}
		if (req.method === "GET" && url.pathname === "/api/entidades") {
			return responderJson(res, 200, await listarEntidades());
		}
		if (req.method === "GET" && url.pathname === "/api/imagenes") {
			return responderJson(res, 200, await listarImagenes());
		}
		if (req.method === "GET" && url.pathname === "/api/obra") {
			return manejarObra(req, res, url);
		}
		if (req.method === "POST" && url.pathname === "/api/nueva-obra") {
			return await manejarNuevaObra(req, res);
		}
		if (req.method === "POST" && url.pathname === "/api/relaciones") {
			return await manejarGuardarRelaciones(req, res);
		}
		if (req.method === "POST" && url.pathname === "/api/retrato") {
			return await manejarRetrato(req, res);
		}
		if (req.method === "GET" && url.pathname.startsWith("/img/gr/")) {
			const rutaRelativa = decodeURIComponent(
				url.pathname.slice("/img/gr/".length),
			);
			const rutaAbsoluta = path.normalize(path.join(CARPETA_IMG, rutaRelativa));
			if (!rutaAbsoluta.startsWith(CARPETA_IMG)) {
				res.writeHead(400);
				return res.end("ruta inválida");
			}
			return servirEstatico(req, res, rutaAbsoluta);
		}
		res.writeHead(404);
		res.end("no encontrado");
	} catch (error) {
		console.error(error);
		responderJson(res, 500, { error: error.message });
	}
});

servidor.listen(PUERTO, () => {
	console.log(`Curar obra: http://localhost:${PUERTO}`);
});
