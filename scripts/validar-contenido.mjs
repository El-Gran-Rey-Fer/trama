#!/usr/bin/env node
// Valida referencias cruzadas entre ficheros de `content/` antes de build.
// Astro ya valida tipos vía Zod (content.config.ts), pero no cruza ids entre
// ficheros ni reporta línea real: un error de schema siempre da `:0:0`. Plan
// de imágenes y álbum, carril A, paso A5.
//
// Uso: pnpm validar-contenido (o automático dentro de `pnpm build`)

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { LineCounter, parse, parseDocument } from "yaml";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_ENTIDADES = path.join(RAIZ, "content/mitologia-griega/entidades");
const CARPETA_RELATOS = path.join(RAIZ, "content/mitologia-griega/relatos");
const FICHERO_MATERIA = path.join(
	RAIZ,
	"content/mitologia-griega/materia.yaml",
);

const ID_VALIDO = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const errores = [];

function relativa(rutaAbsoluta) {
	return path.relative(RAIZ, rutaAbsoluta);
}

function error(rutaAbsoluta, linea, mensaje) {
	errores.push(`${relativa(rutaAbsoluta)}:${linea}: ${mensaje}`);
}

// Extrae el bloque de frontmatter de un .mdx y cuántas líneas del fichero
// original lo preceden, para poder traducir línea-dentro-del-bloque a
// línea-real-del-fichero.
function extraerFrontmatter(texto) {
	const coincidencia = texto.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
	if (!coincidencia) return null;
	return { bloque: coincidencia[1], offsetLineas: 1 };
}

// Parsea YAML dejando localizar la línea real de cualquier ruta de claves
// (ej. ["relaciones", 2, "foco"]) con `documento.linea([...])`.
function parsearConLinea(texto, offsetLineas = 0) {
	const lineCounter = new LineCounter();
	const doc = parseDocument(texto, { lineCounter });
	return {
		datos: doc.toJS() ?? {},
		linea(rutaClaves) {
			const nodo = doc.getIn(rutaClaves, true);
			const rango = nodo?.range ?? doc.contents?.range;
			if (!rango) return offsetLineas + 1;
			return offsetLineas + lineCounter.linePos(rango[0]).line;
		},
	};
}

function cargarMateria() {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	const datos = parse(texto);
	const materia = datos["mitologia-griega"];
	return {
		etiquetas: new Set(materia.etiquetas ?? []),
		fuentes: new Set(Object.keys(materia.fuentes ?? {})),
	};
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

// Comprobaciones comunes a una entidad de `entidades/*.yaml` y al
// frontmatter de un relato en `relatos/*.mdx`: convención de id, etiquetas y
// fuentes fuera de registro, `foco` fuera de rango, y destinos de relación
// que no existen en ningún otro fichero.
function validarNodo(doc, rutaAbsoluta, registro, idsConocidos) {
	const { datos, linea } = doc;

	if (typeof datos.id === "string" && !ID_VALIDO.test(datos.id)) {
		error(
			rutaAbsoluta,
			linea(["id"]),
			`id "${datos.id}" no cumple la convención (minúsculas, sin tildes, con guiones)`,
		);
	}

	for (const [i, etiqueta] of (datos.etiquetas ?? []).entries()) {
		if (!registro.etiquetas.has(etiqueta)) {
			error(
				rutaAbsoluta,
				linea(["etiquetas", i]),
				`etiqueta "${etiqueta}" no está en el registro de materia.yaml`,
			);
		}
	}

	if (datos.fuente_principal && !registro.fuentes.has(datos.fuente_principal)) {
		error(
			rutaAbsoluta,
			linea(["fuente_principal"]),
			`fuente "${datos.fuente_principal}" no está en el registro de materia.yaml`,
		);
	}

	for (const [i, participanteId] of (datos.participantes ?? []).entries()) {
		if (!idsConocidos.has(participanteId)) {
			error(
				rutaAbsoluta,
				linea(["participantes", i]),
				`participante "${participanteId}" no existe`,
			);
		}
	}

	for (const [i, relacion] of (datos.relaciones ?? []).entries()) {
		if (!idsConocidos.has(relacion.destino)) {
			error(
				rutaAbsoluta,
				linea(["relaciones", i, "destino"]),
				`"${relacion.destino}" (relación "${relacion.tipo}") no existe`,
			);
		}
		if (relacion.fuente && !registro.fuentes.has(relacion.fuente)) {
			error(
				rutaAbsoluta,
				linea(["relaciones", i, "fuente"]),
				`fuente "${relacion.fuente}" no está en el registro de materia.yaml`,
			);
		}
		if (relacion.foco) {
			const [x, y] = relacion.foco;
			if (x < 0 || x > 100 || y < 0 || y > 100) {
				error(
					rutaAbsoluta,
					linea(["relaciones", i, "foco"]),
					`foco [${x}, ${y}] fuera de rango 0-100`,
				);
			}
		}
	}
}

function validarObra(doc, rutaAbsoluta) {
	const { datos, linea } = doc;
	if (datos.tipo !== "obra") return;

	// `credito` es opcional a propósito (curar-obra ya no lo pide: cuando falta,
	// FichaEntidad.astro muestra el enlace de `origen` con la etiqueta
	// "Fuente"). Lo que no puede faltar es `origen` — sin él no hay ni enlace
	// ni forma de verificar la procedencia.
	const lineaImagen = datos.imagen ? linea(["imagen"]) : linea(["id"]);
	if (!datos.imagen?.origen) {
		error(rutaAbsoluta, lineaImagen, "obra sin imagen.origen");
	}
}

// `resumen` es opcional en el schema (content.config.ts) solo para poder
// omitirlo en `tipo: obra`; en el resto de tipos sigue siendo obligatorio,
// y esa parte de la regla vive aquí en vez de en Zod.
function validarResumen(doc, rutaAbsoluta) {
	const { datos, linea } = doc;
	if (datos.tipo !== "obra" && !datos.resumen) {
		error(rutaAbsoluta, linea(["id"]), "falta resumen");
	}
}

function main() {
	const registro = cargarMateria();

	const rutasEntidades = listarYaml(CARPETA_ENTIDADES);
	const rutasRelatos = listarMdx(CARPETA_RELATOS);

	const documentosEntidades = rutasEntidades.map((ruta) => ({
		ruta,
		doc: parsearConLinea(readFileSync(ruta, "utf-8")),
	}));
	const documentosRelatos = rutasRelatos.map((ruta) => {
		const texto = readFileSync(ruta, "utf-8");
		const frontmatter = extraerFrontmatter(texto);
		if (!frontmatter) {
			throw new Error(`${relativa(ruta)} no tiene bloque de frontmatter`);
		}
		return {
			ruta,
			doc: parsearConLinea(frontmatter.bloque, frontmatter.offsetLineas),
		};
	});

	// Un relato es una entidad de pleno derecho (mismo espacio de ids, ver
	// src/lib/grafo.ts): un `representa` o un `participantes` puede apuntar a
	// cualquiera de los dos.
	const idsConocidos = new Set([
		...documentosEntidades.map(({ doc }) => doc.datos.id),
		...documentosRelatos.map(({ doc }) => doc.datos.id),
	]);

	for (const { ruta, doc } of documentosEntidades) {
		validarNodo(doc, ruta, registro, idsConocidos);
		validarObra(doc, ruta);
		validarResumen(doc, ruta);
	}
	for (const { ruta, doc } of documentosRelatos) {
		validarNodo(doc, ruta, registro, idsConocidos);
	}

	if (errores.length > 0) {
		console.error(`\n${errores.length} error(es) de contenido:\n`);
		for (const linea of errores) {
			console.error(`  ${linea}`);
		}
		console.error("");
		process.exit(1);
	}

	console.log(
		`Contenido validado: ${documentosEntidades.length} entidades, ${documentosRelatos.length} relatos.`,
	);
}

main();
