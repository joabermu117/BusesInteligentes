import axios from "axios";

/**
 * Extrae un mensaje legible de un error de Axios (NestJS validation errors, etc.)
 */
export const extractErrorMessage = (
  error: unknown,
  fallback = "Error inesperado",
): string => {
  if (axios.isAxiosError(error) && error.response?.data) {
    const data = error.response.data as Record<string, unknown>;
    if (Array.isArray(data.message)) {
      return (data.message as string[]).join("\n");
    }
    if (typeof data.message === "string") {
      return data.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return fallback;
};
