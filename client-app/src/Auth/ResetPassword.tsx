import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { SecurityService } from "../permisos/services/SecurityService";

// Step 2 of recovery: consumes token from URL and sets a new password.
const ResetPasswordPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => searchParams.get("token")?.trim() ?? "", [searchParams]);

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Performs client-side validation before calling confirm endpoint.
  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setMessage(null);

    if (!token) {
      setError("El enlace no contiene token de recuperación.");
      return;
    }

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener mínimo 8 caracteres.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("La confirmación no coincide con la nueva contraseña.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await SecurityService.confirmPasswordRecovery(token, newPassword);
      setMessage(response.message);
      setNewPassword("");
      setConfirmPassword("");
      window.setTimeout(() => navigate("/login"), 1600);
    } catch (requestError) {
      if (requestError instanceof Error) {
        setError(requestError.message);
      } else {
        setError("No fue posible actualizar la contraseña.");
      }
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
              Restablecer contraseña
            </Typography>
            <Typography color="text.secondary">
              Define una nueva contraseña para tu cuenta.
            </Typography>
          </Box>

          {!token && (
            <Alert severity="error">
              Enlace inválido. Solicita nuevamente la recuperación de contraseña.
            </Alert>
          )}

          {error && <Alert severity="error">{error}</Alert>}
          {message && <Alert severity="success">{message}</Alert>}

          <Box component="form" onSubmit={handleSubmit}>
            <Stack spacing={2}>
              <TextField
                label="Nueva contraseña"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
                fullWidth
                disabled={!token || isSubmitting}
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
                fullWidth
                disabled={!token || isSubmitting}
              />
              <Button type="submit" variant="contained" disabled={!token || isSubmitting}>
                {isSubmitting ? "Actualizando..." : "Actualizar contraseña"}
              </Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
};

export default ResetPasswordPage;
