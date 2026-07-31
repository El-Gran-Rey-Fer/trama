// Módulo de cliente: localStorage no existe en build. A diferencia de grafo.ts o
// tarjetas.ts (que corren en Node al generar el sitio estático), este módulo solo
// se ejecuta en el navegador, importado desde un <script type="module">.

export interface EstadoTarjeta {
	ef: number;
	intervalo: number;
	proxima: string;
}

export interface EstadoCapitulo {
	estado: "cerrado" | "abierto" | "en-curso";
	intentos: number;
}

export interface EstadoV1 {
	v: 1;
	tarjetas: Record<string, EstadoTarjeta>;
	leidos: string[];
	capitulos: Record<string, EstadoCapitulo>;
	medallas: string[];
	modo: "aventura" | "sandbox";
}

const CLAVE = "trama:estado";

export function estadoPorDefecto(): EstadoV1 {
	return {
		v: 1,
		tarjetas: {},
		leidos: [],
		capitulos: {},
		medallas: [],
		modo: "aventura",
	};
}

function esEstadoV1(valor: unknown): valor is EstadoV1 {
	return (
		typeof valor === "object" &&
		valor !== null &&
		(valor as { v?: unknown }).v === 1
	);
}

export function leerEstado(): EstadoV1 {
	const bruto = localStorage.getItem(CLAVE);
	if (!bruto) return estadoPorDefecto();
	try {
		const valor: unknown = JSON.parse(bruto);
		if (!esEstadoV1(valor)) return estadoPorDefecto();
		return valor;
	} catch {
		return estadoPorDefecto();
	}
}

export function guardarEstado(estado: EstadoV1): void {
	localStorage.setItem(CLAVE, JSON.stringify(estado));
}

export function exportarEstado(): void {
	const estado = leerEstado();
	const blob = new Blob([JSON.stringify(estado, null, 2)], {
		type: "application/json",
	});
	const url = URL.createObjectURL(blob);
	const a = document.createElement("a");
	a.href = url;
	a.download = `trama-estado-${new Date().toISOString().slice(0, 10)}.json`;
	a.click();
	URL.revokeObjectURL(url);
}

export async function importarEstado(
	archivo: File,
): Promise<{ ok: true } | { ok: false; error: string }> {
	let valor: unknown;
	try {
		valor = JSON.parse(await archivo.text());
	} catch {
		return { ok: false, error: "El fichero no es JSON válido." };
	}
	if (!esEstadoV1(valor)) {
		return {
			ok: false,
			error: "El fichero no tiene el formato esperado (v: 1).",
		};
	}
	guardarEstado(valor);
	return { ok: true };
}
