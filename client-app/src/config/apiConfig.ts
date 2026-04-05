const API_URL_PERMISOS =
  import.meta.env.VITE_API_URL_PERMISOS || "http://localhost:8081/api";
const API_URL_SECURITY =
  import.meta.env.VITE_API_URL_SECURITY ||
  "http://localhost:8081/api/public/security";

export const API_CONFIG = {
  permisosBaseUrl: API_URL_PERMISOS,
  securityBaseUrl: API_URL_SECURITY,
};
