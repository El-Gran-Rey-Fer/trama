import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const relacionSchema = z.object({
	tipo: z.string(),
	destino: z.string(),
	fuente: z.string().optional(),
	principal: z.boolean().optional(),
	nota: z.string().optional(),
});

const entidadSchema = z.object({
	id: z.string(),
	tipo: z.string(),
	nombre: z.string(),
	resumen: z.string(),
	alias: z.array(z.string()).optional(),
	epitetos: z.array(z.string()).optional(),
	atributos: z.record(z.string(), z.unknown()).optional(),
	relaciones: z.array(relacionSchema).optional(),
	etiquetas: z.array(z.string()).optional(),
	generacion: z.number().optional(),
	imagen: z.string().optional(),
});

const entidades = defineCollection({
	loader: glob({
		pattern: "*.yaml",
		base: "./content/mitologia-griega/entidades",
		generateId: ({ data }) => (data as { id: string }).id,
	}),
	schema: entidadSchema,
});

const relatoSchema = z.object({
	id: z.string(),
	tipo: z.string(),
	nombre: z.string(),
	resumen: z.string(),
	participantes: z.array(z.string()).optional(),
	lugar: z.string().optional(),
	orden: z.number().optional(),
	fuente_principal: z.string().optional(),
	etiquetas: z.array(z.string()).optional(),
	relaciones: z.array(relacionSchema).optional(),
});

const relatos = defineCollection({
	loader: glob({
		pattern: "*.mdx",
		base: "./content/mitologia-griega/relatos",
		generateId: ({ data }) => (data as { id: string }).id,
	}),
	schema: relatoSchema,
});

const registroRelacionSchema = z.object({
	inversa: z.string(),
	simetrica: z.boolean().optional(),
	pregunta: z.string().optional(),
	pregunta_inversa: z.string().optional(),
	// La respuesta de una relación uno-a-muchos es un conjunto (todas las aristas
	// origen+tipo agrupadas en una sola tarjeta), no una tarjeta por arista.
	// `tarjeta: false` desactiva la generación en esa dirección sin quitar la
	// plantilla (por si documenta la pregunta igualmente).
	conjunto: z.boolean().optional(),
	conjunto_inversa: z.boolean().optional(),
	tarjeta: z.boolean().optional(),
	tarjeta_inversa: z.boolean().optional(),
});

const fuenteSchema = z.object({
	autor: z.string(),
	obra: z.string(),
	siglo: z.number().optional(),
});

const materiaSchema = z.object({
	slug: z.string(),
	relaciones: z.record(z.string(), registroRelacionSchema),
	atributos: z.record(z.string(), z.unknown()).optional(),
	fuentes: z.record(z.string(), fuenteSchema).optional(),
	tipos: z.array(z.string()).optional(),
	// --- huecos reservados: legales en el esquema, sin uso funcional en Hito 1 ---
	idiomas: z
		.object({
			disponibles: z.array(z.string()).optional(),
			porDefecto: z.string().optional(),
		})
		.optional(),
	enlaces: z
		.array(
			z.object({ tipo: z.string().optional(), url: z.string().optional() }),
		)
		.optional(),
	eras: z.array(z.string()).optional(),
	timeline: z.enum(["relativo", "absoluto"]).optional(),
	mapa: z
		.object({
			mapeable: z.boolean().optional(),
		})
		.optional(),
	rutas: z.record(z.string(), z.unknown()).optional(),
});

const materias = defineCollection({
	loader: file("./content/mitologia-griega/materia.yaml"),
	schema: materiaSchema,
});

export const collections = { entidades, materias, relatos };
