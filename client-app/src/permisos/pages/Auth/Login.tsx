import DirectionsBusFilledRounded from "@mui/icons-material/DirectionsBusFilledRounded";
import GoogleIcon from "@mui/icons-material/Google";
import WindowRoundedIcon from "@mui/icons-material/WindowRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FirebaseAuthService } from "../../services/FirebaseAuthService";
import { SecurityService } from "../../services/SecurityService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getLoginErrorMessage = (
    error: unknown,
    provider: "email" | "google" | "microsoft",
  ) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        if (provider === "google") {
          return "No fue posible validar tu cuenta de Google.";
        }

        if (provider === "microsoft") {
          return "No fue posible validar tu cuenta de Microsoft.";
        }

        return "Credenciales invalidas. Verifica email y contrasena.";
      }
    }

    if (provider === "google") {
      return "No fue posible iniciar sesion con Google.";
    }

    if (provider === "microsoft") {
      return "No fue posible iniciar sesion con Microsoft.";
    }

    return "Credenciales invalidas. Verifica email y contrasena.";
  };

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await SecurityService.loginWithEmailPassword(email, password);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error, "email"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const credential = await FirebaseAuthService.signInWithGoogle();
      const idToken = await FirebaseAuthService.getIdToken(credential);
      await SecurityService.exchangeFirebaseToken(idToken);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error, "google"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const credential = await FirebaseAuthService.signInWithMicrosoft();
      const idToken = await FirebaseAuthService.getIdToken(credential);
      await SecurityService.exchangeFirebaseToken(idToken);
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error, "microsoft"));
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
            label="Plataforma de Transporte Urbano"
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
            Supervisa rutas, flotas y operacion ciudadana en tiempo real.
          </Typography>
          <Typography sx={{ color: "rgba(232,245,245,0.86)", maxWidth: 440 }}>
            Diseñado para gestionar empresas operadoras, buses, paraderos,
            validaciones y comunicacion del servicio con una vista operativa
            unificada.
          </Typography>
          <Stack spacing={1.2} sx={{ mt: 4 }}>
            <Typography variant="body2">
              • Control de rutas y paraderos
            </Typography>
            <Typography variant="body2">
              • Trazabilidad de ciudadanos y viajes
            </Typography>
            <Typography variant="body2">
              • Acceso con Google y cuenta local
            </Typography>
          </Stack>
        </Box>

        <Box
          sx={{ p: { xs: 3, md: 5 }, display: "flex", alignItems: "center" }}
        >
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Iniciar sesión
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ingresa para operar el sistema de buses inteligentes.
              </Typography>
            </Box>

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

            <Box component="form" onSubmit={handleEmailLogin}>
              <Stack spacing={2}>
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
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  size="large"
                >
                  {isSubmitting ? "Ingresando..." : "Iniciar sesión"}
                </Button>
              </Stack>
            </Box>

            <Divider>o</Divider>

            <Button
              type="button"
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              size="large"
            >
              Continuar con Google
            </Button>

            <Button
              type="button"
              variant="outlined"
              startIcon={<WindowRoundedIcon />}
              onClick={handleMicrosoftLogin}
              disabled={isSubmitting}
              size="large"
            >
              Continuar con Microsoft
            </Button>

            <Button
              type="button"
              variant="text"
              onClick={() => navigate("/register")}
              disabled={isSubmitting}
              size="small"
            >
              Crear cuenta nueva
            </Button>
          </Stack>
        </Box>
      </Paper>
    </Box>
  );
};

export default LoginPage;
