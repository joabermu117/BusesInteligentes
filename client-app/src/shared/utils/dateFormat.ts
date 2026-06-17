/**
 * Formatea una fecha ISO 8601 (UTC, con sufijo Z) al timezone local del navegador.
 * `new Date()` ya interpreta el offset correctamente; esto solo estandariza el formato.
 */
export const formatMessageDate = (iso: string): string =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

export const formatMessageDateMedium = (iso: string): string =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short" });
