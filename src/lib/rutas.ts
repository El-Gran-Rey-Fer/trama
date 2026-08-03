function base(): string {
	const b = import.meta.env.BASE_URL;
	return b.endsWith("/") ? b : `${b}/`;
}

export function rutaMateria(materiaSlug: string): string {
	return `${base()}${materiaSlug}/`;
}

export function rutaEntidad(materiaSlug: string, id: string): string {
	return `${base()}${materiaSlug}/e/${id}/`;
}

export function rutaRelato(materiaSlug: string, id: string): string {
	return `${base()}${materiaSlug}/m/${id}/`;
}

export function rutaPracticar(materiaSlug: string): string {
	return `${base()}${materiaSlug}/practicar/`;
}

export function rutaCapitulo(materiaSlug: string, id: string): string {
	return `${base()}${materiaSlug}/c/${id}/`;
}

export function rutaExamen(materiaSlug: string, id: string): string {
	return `${base()}${materiaSlug}/c/${id}/examen/`;
}

// Examen de personaje (plan de imágenes y álbum, paso A4): superarlo es lo
// que marca una entidad como "dominada" en el álbum.
export function rutaExamenPersonaje(materiaSlug: string, id: string): string {
	return `${base()}${materiaSlug}/e/${id}/examen/`;
}

export function rutaJuego(materiaSlug: string, juego: string): string {
	return `${base()}${materiaSlug}/jugar/${juego}/`;
}

// Los ficheros de `public/` (imágenes, etc.) se referencian en el contenido con
// ruta absoluta desde la raíz del sitio (p. ej. `/img/gr/zeus.jpg`), pero el
// despliegue vive bajo `base`: hay que anteponerla igual que en las rutas internas.
export function rutaActivo(ruta: string): string {
	return `${base()}${ruta.replace(/^\//, "")}`;
}
