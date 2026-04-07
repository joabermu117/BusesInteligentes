import DirectionsBusFilledRounded from "@mui/icons-material/DirectionsBusFilledRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SecurityService } from "../../services/SecurityService";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getRegisterErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409) {
        return "Ese correo ya esta registrado. Inicia sesion o usa otro correo.";
      }

      if (error.response?.status === 400) {
        return "Datos invalidos. Verifica nombre, correo y contraseña (minimo 8 caracteres).";
      }
    }

    return "No fue posible crear la cuenta en este momento.";
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);

    try {
      await SecurityService.registerWithEmailPassword({
        name,
        email,
        password,
      });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getRegisterErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        px: { xs: 2, md: 4 },
        py: { xs: 2, md: 4 },
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Paper
        elevation={0}
        sx={{
          width: "100%",
          maxWidth: 1120,
          overflow: "hidden",
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
        }}
      >
        <Box
          sx={{
            p: { xs: 3, md: 5 },
            background:
              "linear-gradient(160deg, #0a3658 0%, #0b4f7d 52%, #0f8d74 100%)",
            color: "#e8f5f5",
            position: "relative",
          }}
        >
          <Chip
            icon={<DirectionsBusFilledRounded />}
            label="Nuevo acceso ciudadano"
            sx={{
              mb: 3,
              color: "#e8f5f5",
              borderColor: "rgba(232,245,245,0.35)",
            }}
            variant="outlined"
          />
          <Typography
            component="h1"
            sx={{
              fontFamily: '"Sora", "Manrope", sans-serif',
              fontWeight: 700,
              fontSize: { xs: "1.8rem", md: "2.3rem" },
              lineHeight: 1.18,
              mb: 2,
            }}
          >
            Crea tu cuenta y accede al sistema de buses inteligentes.
          </Typography>
          <Typography sx={{ color: "rgba(232,245,245,0.86)", maxWidth: 440 }}>
            Tu cuenta inicia con perfil ciudadano para consultar informacion y
            operar funciones basicas dentro de la plataforma.
          </Typography>
        </Box>

        <Box
          sx={{ p: { xs: 3, md: 5 }, display: "flex", alignItems: "center" }}
        >
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Registro
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Completa tus datos para crear una cuenta nueva.
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box component="form" onSubmit={handleRegister}>
              <Stack spacing={2}>
                <TextField
                  label="Nombre"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  fullWidth
                />
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  fullWidth
                  required
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  size="large"
                >
                  {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                </Button>

                <Button
                  type="button"
                  variant="text"
                  onClick={() => navigate("/login")}
                  disabled={isSubmitting}
                  size="small"
                >
                  Ya tengo cuenta, iniciar sesion
                </Button>
              </Stack>
            </Box>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default RegisterPage;
