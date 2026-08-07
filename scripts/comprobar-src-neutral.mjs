#!/usr/bin/env node
// Comprueba que src/ nunca menciona una entidad concreta (regla invariante
// del proyecto: src/ nunca menciona una entidad concreta; content/ nunca
// importa de src/). El bloque V (docs/plan-gamificacion-aventura.md §10)
// extiende esta regla a la capa de gamificación y la vuelve un test
// verificable en CI, no solo una intención.
//
// Uso: pnpm comprobar-src-neutral (o automático dentro de `pnpm build`)

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const CARPETA_SRC = path.join(RAIZ, "src");
const PATRON = /grieg|mito|titan|zeus|olimp|hesiod/i;

function relativa(rutaAbsoluta) {
	return path.relative(RAIZ, rutaAbsoluta);
}

function listarFicheros(carpeta) {
	return readdirSync(carpeta, { withFileTypes: true }).flatMap((entrada) => {
		const ruta = path.join(carpeta, entrada.name);
		return entrada.isDirectory() ? listarFicheros(ruta) : [ruta];
	});
}

function main() {
	const coincidencias = [];
	for (const ruta of listarFicheros(CARPETA_SRC)) {
		const texto = readFileSync(ruta, "utf-8");
		texto.split("\n").forEach((linea, indice) => {
			if (PATRON.test(linea)) {
				coincidencias.push(`${relativa(ruta)}:${indice + 1}: ${linea.trim()}`);
			}
		});
	}

	if (coincidencias.length > 0) {
		console.error(
			`\n${coincidencias.length} referencia(s) a una materia concreta en src/:\n`,
		);
		for (const coincidencia of coincidencias) {
			console.error(`  ${coincidencia}`);
		}
		console.error(
			"\nsrc/ nunca menciona una entidad concreta — mueve el dato a " +
				"content/<materia>/materia.yaml o generaliza el ejemplo.\n",
		);
		process.exit(1);
	}

	console.log("src/ neutral: sin referencias a una materia concreta.");
}

main();
