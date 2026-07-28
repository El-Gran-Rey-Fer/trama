# trama

Plataforma de aprendizaje para dominios narrativos. Primera materia: mitología griega.

Lee `docs/esqueleto-proyecto.md` (qué se construye) y `docs/calendario-construccion.md`
(en qué orden). Son la fuente de verdad; si algo aquí los contradice, mándamelo.

## Reglas que no se negocian
- `src/` nunca menciona una entidad concreta. `content/` nunca importa de `src/`.
- YAML para lo que se consulta, MDX para lo que se lee.
- Estamos en el **hito 1**. No implementes nada de hitos posteriores aunque lo veas venir.
- Cero dependencias nuevas sin preguntar antes.
- Español en interfaz, contenido, nombres de fichero, variables y comentarios.

## Stack
Astro 7, TypeScript strict, pnpm, Biome. Despliegue a GitHub Pages.
site: https://el-gran-rey-fer.github.io  ·  base: /trama
