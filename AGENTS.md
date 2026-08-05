# trama

Plataforma de aprendizaje para dominios narrativos. Primera materia: mitología griega.

Lee `docs/esqueleto-proyecto.md` (qué se construye) y `docs/calendario-construccion.md`
(en qué orden). Son la fuente de verdad; si algo aquí los contradice, mándamelo.

## Reglas que no se negocian
- `src/` nunca menciona una entidad concreta. `content/` nunca importa de `src/`.
- YAML para lo que se consulta, MDX para lo que se lee.
- Los hitos 1-3 (PoC) están cerrados y el proyecto lleva bloques enteros de Parte II/III
  construidos (capítulos, exámenes, árbol genealógico, identificar, álbum, modo aventura...).
  `docs/calendario-construccion.md` y `docs/estado-del-proyecto.md` son instantáneas de una
  etapa anterior y no reflejan esto — para saber en qué punto está el proyecto de verdad, mira
  lo que ya hay en `content/` y `src/`, no la lista de bloques.
- Cero dependencias nuevas sin preguntar antes.
- Español en interfaz, contenido, nombres de fichero, variables y comentarios.

## Stack
Astro 7, TypeScript strict, pnpm, Biome. Despliegue a GitHub Pages.
site: https://el-gran-rey-fer.github.io  ·  base: /trama

## Ids de tarjeta

Los ids de tarjeta (`src/lib/tarjetas.ts`) son permanentes a partir del bloque C. Mientras no
haya `localStorage`, cambiar el esquema de ids no cuesta nada. Después, cada cambio borra el
historial del usuario. Cualquier retoque al formato de id se hace antes del bloque C o no se
hace.

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)
