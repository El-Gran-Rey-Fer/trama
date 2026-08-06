#!/usr/bin/env node
// Índice de contenido: qué mitos y entidades existen, cuáles tienen prosa
// (.mdx) propia, qué entidades están sueltas (sin relato ni relación que las
// use) y qué notas de huecos futuros hay dejadas en materia.yaml. No es un
// validador (para eso está validar-contenido.mjs) — es una foto de dónde
// seguir añadiendo contenido.
//
// Uso: pnpm indice-de-contenido

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "yaml";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_ENTIDADES = path.join(RAIZ, "content/mitologia-griega/entidades");
const CARPETA_RELATOS = path.join(RAIZ, "content/mitologia-griega/relatos");
const FICHERO_MATERIA = path.join(
	RAIZ,
	"content/mitologia-griega/materia.yaml",
);

function listarConExtension(carpeta, extension, { recursivo = false } = {}) {
	return readdirSync(carpeta, { recursive: recursivo }).filter((f) =>
		f.endsWith(extension),
	);
}

function cargarEntidades() {
	// Solo el nivel superior de entidades/: las obras (entidades/obras/) quedan
	// fuera a propósito, igual que pidió el usuario para este índice.
	const ficheros = listarConExtension(CARPETA_ENTIDADES, ".yaml");
	const mdxDisponibles = new Set(
		listarConExtension(CARPETA_ENTIDADES, ".mdx").map((f) =>
			f.replace(/\.mdx$/, ""),
		),
	);
	return ficheros.map((f) => {
		const ruta = path.join(CARPETA_ENTIDADES, f);
		const datos = parse(readFileSync(ruta, "utf-8"));
		return { ruta, datos, tieneMdx: mdxDisponibles.has(datos.id) };
	});
}

function cargarRelatos() {
	// recursivo: true porque los relatos viven en subcarpetas por era.
	return listarConExtension(CARPETA_RELATOS, ".mdx", { recursivo: true }).map(
		(f) => {
			const ruta = path.join(CARPETA_RELATOS, f);
			const texto = readFileSync(ruta, "utf-8");
			const bloque = texto.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? "";
			return { ruta, datos: parse(bloque) };
		},
	);
}

function cargarMateria() {
	const texto = readFileSync(FICHERO_MATERIA, "utf-8");
	return { texto, datos: parse(texto)["mitologia-griega"] };
}

// Notas de huecos futuros: comentarios sueltos dentro del bloque `capitulos:`
// que no son el separador decorativo de era (los que son solo rayas). No
// intenta emparejarlos con una era concreta — son pistas, no datos.
function extraerNotasDeCapitulos(textoMateria) {
	const inicio = textoMateria.indexOf("\n  capitulos:");
	if (inicio === -1) return [];
	const bloque = textoMateria.slice(inicio);
	return bloque
		.split("\n")
		.map((l) => l.trim())
		.filter((l) => l.startsWith("#"))
		.map((l) => l.replace(/^#\s*/, ""))
		.filter((l) => l.length > 0 && !/^[─\s]+$/.test(l));
}

function main() {
	const entidades = cargarEntidades();
	const relatos = cargarRelatos();
	const { texto: textoMateria, datos: materia } = cargarMateria();

	// Todo lo que ancla una entidad a un relato o a otra entidad: participante o
	// lugar de un relato, entidad_extra de un capítulo, o destino de la
	// relación de otra entidad.
	const usadas = new Set();
	for (const { datos } of relatos) {
		for (const p of datos.participantes ?? []) usadas.add(p);
		if (datos.lugar) usadas.add(datos.lugar);
	}
	for (const cap of materia.capitulos ?? []) {
		for (const id of cap.entidades_extra ?? []) usadas.add(id);
	}
	for (const { datos } of entidades) {
		for (const r of datos.relaciones ?? []) usadas.add(r.destino);
	}

	// --- resumen ---
	console.log(`\n=== Índice de contenido: ${materia.nombre} ===\n`);
	console.log(
		`${entidades.length} entidades · ${relatos.length} relatos · ${materia.capitulos?.length ?? 0} capítulos construidos\n`,
	);

	// --- relatos por era/capítulo ---
	console.log("--- Relatos por era ---\n");
	const relatosPorId = new Map(relatos.map((r) => [r.datos.id, r]));
	for (const era of materia.eras ?? []) {
		const capitulos = (materia.capitulos ?? []).filter((c) => c.era === era.id);
		console.log(`${era.nombre}:`);
		if (capitulos.length === 0) {
			console.log("  (sin capítulos construidos)");
			continue;
		}
		for (const cap of capitulos.sort((a, b) => a.orden - b.orden)) {
			const idsRelatos = cap.relatos ?? [];
			console.log(`  [${cap.orden}] ${cap.nombre}`);
			for (const idRelato of idsRelatos) {
				const existe = relatosPorId.has(idRelato) ? "" : "  ⚠ falta el .mdx";
				console.log(`      - ${idRelato}${existe}`);
			}
		}
	}

	// --- relatos escritos pero sin capítulo que los use ---
	const idsRelatosEnCapitulos = new Set(
		(materia.capitulos ?? []).flatMap((c) => c.relatos ?? []),
	);
	const relatosSinCapitulo = relatos.filter(
		(r) => !idsRelatosEnCapitulos.has(r.datos.id),
	);
	if (relatosSinCapitulo.length > 0) {
		console.log(
			"\n--- Relatos escritos pero sin capítulo en materia.yaml ---\n",
		);
		for (const r of relatosSinCapitulo) console.log(`  ${r.datos.id}`);
	}

	// --- notas de huecos dejadas en materia.yaml ---
	const notas = extraerNotasDeCapitulos(textoMateria);
	if (notas.length > 0) {
		console.log(
			"\n--- Notas de huecos futuros (comentarios en materia.yaml) ---\n",
		);
		for (const n of notas) console.log(`  ${n}`);
	}

	// --- entidades por tipo, con mdx ---
	console.log("\n--- Entidades por tipo ---\n");
	const porTipo = new Map();
	for (const e of entidades) {
		const lista = porTipo.get(e.datos.tipo) ?? [];
		lista.push(e);
		porTipo.set(e.datos.tipo, lista);
	}
	for (const tipo of [...porTipo.keys()].sort()) {
		const lista = porTipo
			.get(tipo)
			.sort((a, b) => a.datos.id.localeCompare(b.datos.id));
		console.log(`${tipo} (${lista.length}):`);
		for (const e of lista) {
			const marca = e.tieneMdx ? "[mdx]" : "     ";
			console.log(`  ${marca} ${e.datos.id}`);
		}
	}

	// --- entidades sin usar en ningún sitio ---
	const sueltas = entidades.filter((e) => !usadas.has(e.datos.id));
	console.log(
		`\n--- Entidades escritas pero sin anclar a ningún relato/relación (${sueltas.length}) ---\n`,
	);
	if (sueltas.length === 0) {
		console.log("  (ninguna)");
	} else {
		for (const e of sueltas) {
			const resumen = (e.datos.resumen ?? "").replace(/\s+/g, " ").trim();
			console.log(`  ${e.datos.id}: ${resumen}`);
		}
	}

	// --- entidades sin relaciones propias ni citadas como destino ---
	const aisladas = entidades.filter(
		(e) => (e.datos.relaciones ?? []).length === 0 && !usadas.has(e.datos.id),
	);
	if (aisladas.length > 0) {
		console.log(
			`\n--- Entidades totalmente aisladas del grafo de relaciones (${aisladas.length}) ---\n`,
		);
		console.log(
			"  (subconjunto de las anteriores: cero relaciones propias Y nadie apunta a ellas)\n",
		);
		for (const e of aisladas) console.log(`  ${e.datos.id}`);
	}

	console.log("");
}

main();
