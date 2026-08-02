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

// Los ficheros de `public/` (imágenes, etc.) se referencian en el contenido con
// ruta absoluta desde la raíz del sitio (p. ej. `/img/gr/zeus.jpg`), pero el
// despliegue vive bajo `base`: hay que anteponerla igual que en las rutas internas.
export function rutaActivo(ruta: string): string {
	return `${base()}${ruta.replace(/^\//, "")}`;
}
