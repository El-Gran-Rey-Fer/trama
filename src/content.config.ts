import { defineCollection } from "astro:content";
import { file, glob } from "astro/loaders";
import { z } from "astro/zod";

const relacionSchema = z.object({
	tipo: z.string(),
	destino: z.string(),
	fuente: z.string().optional(),
	principal: z.boolean().optional(),
	// Solo tiene sentido en `representa` (modo aventura, plan de imágenes y álbum
	// §3.2): posición en porcentaje [x, y] del punto de foco dentro de la obra,
	// para recortarla distinto según sirva de retrato a una figura o a otra.
	foco: z.tuple([z.number(), z.number()]).optional(),
	nota: z.string().optional(),
});

// Solo la llevan las entidades `tipo: obra` (plan de imágenes y álbum §3.1). El
// campo suelto `imagen` en cualquier otra entidad desapareció: la entidad apunta
// a su obra con `retrato`.
const imagenSchema = z.object({
	archivo: z.string(),
	credito: z.string().optional(),
	origen: z.string().optional(),
	alt: z.string().optional(),
});

const entidadSchema = z
	.object({
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
		imagen: imagenSchema.optional(),
		// Id de la entidad `tipo: obra` que sirve de retrato. Si falta, se toma la
		// primera obra que la `representa` (plan de imágenes y álbum §3.1).
		retrato: z.string().optional(),
	})
	.transform((data) => {
		if (data.imagen && !data.imagen.credito) {
			console.warn(
				`[trama] falta crédito de imagen en "${data.id}" (${data.imagen.archivo})`,
			);
		}
		return data;
	});

const entidades = defineCollection({
	loader: glob({
		// Recursivo: las obras viven en entidades/obras/ para no mezclarse con el
		// resto (mismo criterio que public/img/gr/obras/), pero siguen siendo la
		// misma colección — el id sale del YAML, no de la ruta, así que
		// `destino: <id>` en cualquier relación las resuelve igual.
		pattern: "**/*.yaml",
		base: "./content/mitologia-griega/entidades",
		generateId: ({ data }) => (data as { id: string }).id,
	}),
	schema: entidadSchema,
});

const entidadesProsa = defineCollection({
	loader: glob({
		pattern: "*.mdx",
		base: "./content/mitologia-griega/entidades",
	}),
	// Sin frontmatter: el id sale del nombre del fichero (comportamiento por
	// defecto del loader), así que no puede desincronizarse del YAML hermano.
	schema: z.object({}),
});

const relatoSchema = z.object({
	id: z.string(),
	tipo: z.string(),
	nombre: z.string(),
	resumen: z.string(),
	participantes: z.array(z.string()).optional(),
	lugar: z.string().optional(),
	// id de una entrada en `eras` (materia.yaml); `orden` es local a esa era, no global.
	era: z.string().optional(),
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
	// Juego de pertenencia (plan de imágenes y álbum, paso A6): plantilla sí/no
	// para relaciones `conjunto`/`conjunto_inversa`, donde la opción múltiple no
	// escala. Usa {origen}/{destino} igual que `pregunta`/`pregunta_inversa`,
	// más {candidato} para la entidad sobre la que se pregunta.
	pertenencia: z.string().optional(),
	pertenencia_inversa: z.string().optional(),
});

const fuenteSchema = z.object({
	autor: z.string().optional(),
	obra: z.string(),
	siglo: z.number().optional(),
});

const materiaSchema = z.object({
	slug: z.string(),
	relaciones: z.record(z.string(), registroRelacionSchema),
	atributos: z.record(z.string(), z.unknown()).optional(),
	fuentes: z.record(z.string(), fuenteSchema).optional(),
	tipos: z.array(z.string()).optional(),
	eras: z.array(z.object({ id: z.string(), nombre: z.string() })).optional(),
	// Modo aventura, paso 6: una plantilla de pregunta por atributo (clave dentro
	// de `atributos` en la entidad) y una para epítetos. Se escriben una vez aquí
	// y se aplican a todo el contenido; no existe fichero de preguntas.
	plantillas_tarjeta: z
		.object({
			atributos: z.record(z.string(), z.string()).optional(),
			epiteto: z.string().optional(),
		})
		.optional(),
	// Modo aventura, paso 2 (docs/plan-modo-aventura.md): el conjunto de un capítulo
	// —de donde salen sus tarjetas y su examen— es `participantes` de sus `relatos`
	// más `entidades_extra`; no se lista a mano lo que el grafo puede derivar.
	capitulos: z
		.array(
			z.object({
				id: z.string(),
				nombre: z.string(),
				era: z.string(),
				orden: z.number(),
				resumen: z.string(),
				relatos: z.array(z.string()),
				entidades_extra: z.array(z.string()).optional(),
				examen: z.object({ aciertos: z.number(), de: z.number() }),
			}),
		)
		.optional(),
	// Plan de imágenes y álbum §3.5: nivel cosmético según cobertura (cromos
	// dominados + capítulos cerrados), nunca constancia. Ordenado de menor a
	// mayor `umbral` (fracción 0-1); `calcularNivel` en lib/estado.ts toma el
	// más alto que ya se supera.
	niveles: z
		.array(z.object({ id: z.string(), nombre: z.string(), umbral: z.number() }))
		.optional(),
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

export const collections = { entidades, entidadesProsa, materias, relatos };
