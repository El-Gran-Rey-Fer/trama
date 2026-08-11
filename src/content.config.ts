import { defineCollection } from "astro:content";
import path from "node:path";
import { glob } from "astro/loaders";
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
	// Tamaño del recorte (ancho, alto en % de la imagen) centrado en `foco`. Sin
	// esto, la ficha usa su caja panorámica fija de siempre; con esto, adapta su
	// alto al recorte real (una estatua vertical necesita mucho más alto que
	// ancho, y ningún `foco` por sí solo lo resuelve: decide qué franja se ve,
	// no cuánta). Solo tiene sentido junto a `foco`.
	recorte: z.tuple([z.number(), z.number()]).optional(),
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
	// Dimensiones naturales en píxeles, para poder traducir el `recorte` (en %)
	// de una relación a un aspect-ratio real. Las escribe curar-obra.mjs sola
	// (a partir de `naturalWidth`/`naturalHeight`), nunca a mano.
	ancho: z.number().optional(),
	alto: z.number().optional(),
});

const entidadSchema = z
	.object({
		id: z.string(),
		tipo: z.string(),
		nombre: z.string(),
		// Obligatorio salvo en `tipo: obra` (las obras no llevan prosa propia y
		// no siempre hace falta describirlas en texto). validar-contenido.mjs
		// exige el campo para el resto de tipos.
		resumen: z.string().optional(),
		alias: z.array(z.string()).optional(),
		epitetos: z.array(z.string()).optional(),
		atributos: z.record(z.string(), z.unknown()).optional(),
		relaciones: z.array(relacionSchema).optional(),
		etiquetas: z.array(z.string()).optional(),
		generacion: z.number().optional(),
		// Solo hace falta declararlo cuando importa para resolver una relación
		// gendered (ver `inversa_por_genero` en el registro de relaciones):
		// hijo_de necesita saber si el destino es la madre o el padre para
		// sintetizar la inversa correcta, autorice quien autorice la relación
		// original. Sin este campo, la inversa por defecto (`inversa`) asume
		// masculino — así que solo las entidades que son madre en algún
		// momento necesitan `genero: femenino`.
		genero: z.enum(["masculino", "femenino"]).optional(),
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
		// Recursivo y por materia: cada entidad vive en
		// <materia>/entidades/<tipo>/ (las obras en entidades/obra/, mismo
		// criterio que public/img/gr/obras/), pero todas siguen siendo la misma
		// colección — el id sale del YAML, no de la ruta, así que
		// `destino: <id>` en cualquier relación las resuelve igual. Distinguir
		// de qué materia es cada una se hace por `filePath` (ver
		// lib/contenidoPorMateria.ts), no por el id.
		pattern: "*/entidades/**/*.yaml",
		base: "./content",
		generateId: ({ data }) => (data as { id: string }).id,
	}),
	schema: entidadSchema,
});

const entidadesProsa = defineCollection({
	loader: glob({
		// Recursivo y por materia: la prosa vive junto a su YAML hermano, en
		// <materia>/entidades/<tipo>/.
		pattern: "*/entidades/**/*.mdx",
		base: "./content",
		// Sin frontmatter: el id sale del nombre del fichero, no de la ruta —
		// si tomara la ruta completa (comportamiento por defecto del loader),
		// el id incluiría la materia y la subcarpeta de tipo y dejaría de
		// coincidir con el id del YAML hermano.
		generateId: ({ entry }) => path.basename(entry, ".mdx"),
	}),
	schema: z.object({}),
});

const relatoSchema = z.object({
	id: z.string(),
	tipo: z.string(),
	nombre: z.string(),
	resumen: z.string(),
	participantes: z.array(z.string()).optional(),
	// Casi siempre un solo sitio, pero un relato puede recorrer varios (p.ej.
	// un delito en un lugar y un castigo eterno en otro): admite `string` suelto
	// (lo que ya hay escrito, todo en singular) o `string[]`. Se normaliza a
	// array aquí mismo, el punto de entrada más cercano al esquema, para que
	// nada aguas abajo tenga que volver a distinguir los dos casos.
	lugar: z
		.union([z.string(), z.array(z.string())])
		.optional()
		.transform((valor) =>
			valor === undefined ? undefined : Array.isArray(valor) ? valor : [valor],
		),
	// id de una entrada en `eras` (materia.yaml); `orden` es local a esa era, no global.
	era: z.string().optional(),
	orden: z.number().optional(),
	fuente_principal: z.string().optional(),
	etiquetas: z.array(z.string()).optional(),
	relaciones: z.array(relacionSchema).optional(),
});

const relatos = defineCollection({
	loader: glob({
		// Recursivo y por materia: los relatos viven en subcarpetas por era
		// (<materia>/relatos/<era>/), mismo criterio que entidades/<tipo>/ — el
		// id sale del YAML, no de la ruta.
		pattern: "*/relatos/**/*.mdx",
		base: "./content",
		generateId: ({ data }) => (data as { id: string }).id,
	}),
	schema: relatoSchema,
});

const registroRelacionSchema = z.object({
	inversa: z.string(),
	// Cuando este tipo es azúcar sintáctico que puede apuntar a cualquiera de
	// dos progenitores según el género (p.ej. hijo_de, que no distingue padre
	// de madre), este mapa dice a qué tipo "real" equivale la arista cuando
	// el destino tiene ese género — grafo.ts la trata entonces como si el
	// destino la hubiera autoriado en sentido contrario con ese tipo, antes
	// de generar preguntas o sintetizar inversas. Sin `genero` en el destino,
	// o si su género no tiene entrada aquí, la arista se deja tal cual.
	inversa_por_genero: z.record(z.string(), z.string()).optional(),
	simetrica: z.boolean().optional(),
	pregunta: z.string().optional(),
	pregunta_inversa: z.string().optional(),
	// La respuesta de una relación uno-a-muchos es un conjunto (todas las aristas
	// origen+tipo agrupadas en una sola tarjeta), no una tarjeta por arista.
	// `tarjeta: false` desactiva la generación en esa dirección sin quitar la
	// plantilla (por si documenta la pregunta igualmente).
	//
	// `"dinamico"` es un tercer estado, distinto de `true`/sin marca: decide por
	// grupo origen+tipo (o destino+tipo, en la inversa) según la arity real de
	// ESE grupo en el contenido — un solo destino sigue dando la tarjeta de
	// valor único de siempre (con distractores); dos o más, tarjeta de conjunto.
	// Pensado para relaciones donde la mayoría de los grupos son de un único
	// destino pero alguno puede no serlo (ej. `ocurre_en`: casi todo relato pasa
	// en un solo lugar, pero uno puede recorrer varios). No lo uses en una
	// relación que ya sea `true` a propósito aunque hoy tenga grupos de arity 1
	// (ej. `padre_de`): cambiar esos a `"dinamico"` movería tarjetas de formato
	// conjunto a valor único, y los ids de tarjeta son permanentes a partir del
	// bloque C (ver CLAUDE.md).
	conjunto: z.union([z.boolean(), z.literal("dinamico")]).optional(),
	conjunto_inversa: z.union([z.boolean(), z.literal("dinamico")]).optional(),
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
	nombre: z.string(),
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
	//
	// `relatos` es la lista prevista del mapa, no una garantía de que ya existan:
	// cargarCapitulos (src/lib/capitulos.ts) calcula cuántos de esos ids están
	// escritos y de ahí sale `activo`. `resumen` es opcional porque un capítulo
	// sin ningún relato escrito todavía no tiene nada que resumir.
	capitulos: z
		.array(
			z.object({
				id: z.string(),
				nombre: z.string(),
				era: z.string(),
				orden: z.number(),
				resumen: z.string().optional(),
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
	// Contrato multi-materia (bloque V). No se consumen todavía: entran aquí
	// porque son la base sobre la que se apoyan los bloques W-Z y la interfaz
	// de Design, y declararlos tarde obliga a tocar materia.yaml otra vez.
	//
	// Tipos cuya entidad genera medalla de personaje automática al reunir
	// suficientes tarjetas propias (bloque Y). El valor concreto lo declara
	// cada materia en su materia.yaml, no src/.
	tipos_coleccionables: z.array(z.string()).optional(),
	// Etiqueta visible del eje temporal de `eras` ("Eras" en Grecia,
	// "Periodos" o "Siglos" en otra materia). Puramente de rótulo.
	etiqueta_eje_temporal: z.string().optional(),
	// Color por tipo de entidad (fondo de la casilla sin retrato, patrón
	// Gmail). Sustituye a las variables --color-tipo-* que antes vivían fijas
	// en src/styles/tokens.css — Base.astro las inyecta por materia como
	// custom properties. Sin entrada para un tipo, Casilla.astro cae a
	// --color-tarjeta-borde (fallback ya existente, sin cambios).
	colores_tipo: z.record(z.string(), z.string()).optional(),
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
	// Un materia.yaml por materia, en content/<materia>/materia.yaml. El id de
	// la entrada sale del nombre de la carpeta (mismo id que se usa en
	// content/<materia>/entidades y content/<materia>/relatos), no de un campo
	// dentro del YAML: así materiaId y la ruta a su contenido son siempre la
	// misma cosa.
	loader: glob({
		pattern: "*/materia.yaml",
		base: "./content",
		generateId: ({ entry }) => path.dirname(entry),
	}),
	schema: materiaSchema,
});

export const collections = { entidades, entidadesProsa, materias, relatos };
