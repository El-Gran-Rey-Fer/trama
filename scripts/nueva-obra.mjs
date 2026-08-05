#!/usr/bin/env node
// Genera el YAML de una entidad `tipo: obra` a partir de una URL de Wikimedia
// Commons, y descarga la imagen a public/img/gr/obras/. Plan de imágenes y
// álbum, carril A, paso A1.
//
// Uso: pnpm nueva-obra <url-de-commons> <id>
//
// Lo que la API de Commons da de forma fiable: crédito (autor + licencia),
// origen (la propia URL) y a veces una descripción en inglés que sirve de
// borrador de `alt`. Lo que NO da de forma fiable: autor real (a veces es un
// museo o "desconocido"), fecha, período, soporte y museo — esos campos
// suelen vivir en texto libre de la plantilla {{Information}} de la página,
// no en metadatos estructurados. El script los deja marcados como
// "PENDIENTE" en vez de inventarlos. `representa` y `foco` se dejan siempre
// vacíos: eso es trabajo de curación, no de metadatos.

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_OBRAS = path.join(RAIZ, "public/img/gr/obras");
const CARPETA_ENTIDADES_OBRAS = path.join(
	RAIZ,
	"content/mitologia-griega/entidades/obras",
);

function quitarEtiquetasHtml(texto) {
	return texto
		.replace(/<[^>]+>/g, "")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function tituloDesdeUrl(url) {
	const decodificada = decodeURIComponent(url);
	const coincidencia = decodificada.match(/File:([^/?#]+)/i);
	if (!coincidencia) {
		throw new Error(
			`No encuentro "File:..." en la URL. ¿Es una URL de fichero de Commons? (${url})`,
		);
	}
	return `File:${coincidencia[1]}`;
}

async function obtenerMetadatos(titulo) {
	const endpoint = new URL("https://commons.wikimedia.org/w/api.php");
	endpoint.searchParams.set("action", "query");
	endpoint.searchParams.set("titles", titulo);
	endpoint.searchParams.set("prop", "imageinfo");
	endpoint.searchParams.set("iiprop", "extmetadata|url");
	endpoint.searchParams.set("format", "json");

	const respuesta = await fetch(endpoint);
	if (!respuesta.ok) {
		throw new Error(
			`La API de Commons respondió ${respuesta.status} para "${titulo}"`,
		);
	}
	const cuerpo = await respuesta.json();
	const paginas = Object.values(cuerpo.query?.pages ?? {});
	const pagina = paginas[0];
	const info = pagina?.imageinfo?.[0];
	if (!info) {
		throw new Error(
			`Commons no devolvió imageinfo para "${titulo}". ¿Existe el fichero?`,
		);
	}
	return info;
}

function valor(extmetadata, clave) {
	const bruto = extmetadata?.[clave]?.value;
	return bruto ? quitarEtiquetasHtml(String(bruto)) : undefined;
}

async function descargarImagen(url, rutaDestino) {
	const respuesta = await fetch(url);
	if (!respuesta.ok) {
		throw new Error(
			`No pude descargar la imagen (${respuesta.status}): ${url}`,
		);
	}
	const buffer = Buffer.from(await respuesta.arrayBuffer());
	await writeFile(rutaDestino, buffer);
}

function construirYaml({ id, nombre, extension, credito, origen, alt, autor }) {
	const lineas = [
		`id: ${id}`,
		"tipo: obra",
		`nombre: ${nombre}`,
		"atributos:",
		`  autor: ${autor ?? "desconocido"}`,
		"  fecha: PENDIENTE",
		"  periodo: PENDIENTE",
		"  soporte: PENDIENTE",
		"  museo: PENDIENTE",
		"imagen:",
		`  archivo: /img/gr/obras/${id}.${extension}`,
		`  credito: "${credito ?? "PENDIENTE: revisar autor/licencia"}"`,
		`  origen: ${origen}`,
		`  alt: ${alt ?? "PENDIENTE: describe la imagen"}`,
		"# PENDIENTE: relaciones: representa (+ foco donde sirva de retrato).",
		"# Ver plan-imagenes-y-album.md §3.1/§3.2. No se deja `relaciones:` vacío",
		"# a propósito: una clave sin valor puede parsear como objeto, no como",
		"# ausente, y el schema espera un array.",
	];
	return `${lineas.join("\n")}\n`;
}

async function main() {
	const [urlEntrada, id] = process.argv.slice(2);
	if (!urlEntrada || !id) {
		console.error("Uso: pnpm nueva-obra <url-de-commons> <id>");
		process.exit(1);
	}

	const titulo = tituloDesdeUrl(urlEntrada);
	const info = await obtenerMetadatos(titulo);
	const meta = info.extmetadata ?? {};

	const licencia = valor(meta, "LicenseShortName");
	const artista = valor(meta, "Artist");
	const creditoBruto = valor(meta, "Credit");
	const descripcion = valor(meta, "ImageDescription");

	const extension = (info.url?.split(".").pop() || "jpg").toLowerCase();
	const nombrePropuesto = titulo
		.replace(/^File:/, "")
		.replace(/\.[a-zA-Z]+$/, "")
		.replace(/[_-]+/g, " ")
		.trim();

	const partesCredito = [artista, creditoBruto, licencia].filter(Boolean);
	const credito = partesCredito.length ? partesCredito.join(", ") : undefined;

	await mkdir(CARPETA_OBRAS, { recursive: true });
	await mkdir(CARPETA_ENTIDADES_OBRAS, { recursive: true });
	const rutaImagen = path.join(CARPETA_OBRAS, `${id}.${extension}`);
	await descargarImagen(info.url, rutaImagen);

	const yaml = construirYaml({
		id,
		nombre: nombrePropuesto,
		extension,
		credito,
		origen: info.descriptionurl ?? urlEntrada,
		alt: descripcion,
		autor: artista,
	});

	const rutaYaml = path.join(CARPETA_ENTIDADES_OBRAS, `${id}.yaml`);
	await writeFile(rutaYaml, yaml);

	console.log(`Imagen descargada en ${path.relative(RAIZ, rutaImagen)}`);
	console.log(`YAML escrito en ${path.relative(RAIZ, rutaYaml)}`);
	console.log(
		"Quedan a mano: autor/fecha/periodo/soporte/museo, alt final, y representa + foco.",
	);
}

main().catch((error) => {
	console.error(error.message);
	process.exit(1);
});
