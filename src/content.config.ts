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

const registroRelacionSchema = z.object({
	inversa: z.string(),
	simetrica: z.boolean().optional(),
	pregunta: z.string().optional(),
	pregunta_inversa: z.string().optional(),
});

const materiaSchema = z.object({
	slug: z.string(),
	relaciones: z.record(z.string(), registroRelacionSchema),
	atributos: z.record(z.string(), z.unknown()).optional(),
	fuentes: z.record(z.string(), z.unknown()).optional(),
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

export const collections = { entidades, materias };
