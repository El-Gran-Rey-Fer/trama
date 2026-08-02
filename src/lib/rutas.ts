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
