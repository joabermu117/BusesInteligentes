import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { FormEvent } from "react";
import { useState } from "react";
import { executeRecaptcha } from "../config/recaptcha";
import { SecurityService } from "../permisos/services/SecurityService";

const PasswordRecoveryPage = () => {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    try {
      const recaptchaToken = await executeRecaptcha("password_recovery");
      const response = await SecurityService.requestPasswordRecovery(email, recaptchaToken);
      setMessage(response.message);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("VITE_RECAPTCHA_SITE_KEY")) {
          setError("Falta configurar VITE_RECAPTCHA_SITE_KEY en el frontend.");
          return;
        }

        setError(error.message);
        return;
      }

      setError("No fue posible procesar la solicitud. Intentalo nuevamente.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        px: 2,
      }}
    >
      <Paper sx={{ width: "100%", maxWidth: 480, p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Recuperar contraseña
            </Typography>
            <Typography color="text.secondary">
              Ingresa tu correo y te enviaremos instrucciones si la cuenta existe.
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Correo electrónico"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                fullWidth
              />
              <Button type="submit" variant="contained" disabled={isSubmitting}>
                {isSubmitting ? "Procesando..." : "Solicitar recuperación"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default PasswordRecoveryPage;
