/** Formatea moneda en soles */
export const formatCurrency = (value: number): string =>
  new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
  }).format(value);

/** Formatea duración en minutos a "Xh Ym" */
export const formatDuration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m} min`;
};

/** Formatea fecha ISO a locale es-PE */
export const formatDate = (dateStr?: string): string => {
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("es-PE", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

/** Formatea distancia en metros */
export const formatDistance = (meters: number): string =>
  meters < 1000 ? `${meters} m` : `${(meters / 1000).toFixed(1)} km`;
