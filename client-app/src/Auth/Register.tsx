import DirectionsBusFilledRounded from "@mui/icons-material/DirectionsBusFilledRounded";
import {
  Alert,
  Box,
  Button,
  Chip,
  LinearProgress,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SecurityService } from "../permisos/services/SecurityService";

// Evalúa fortaleza: 0 = inválida, 1 = débil, 2 = media, 3 = fuerte
const evaluatePassword = (pwd: string): { score: number; missing: string[] } => {
  const missing: string[] = [];
  if (pwd.length < 8)        missing.push("mínimo 8 caracteres");
  if (!/[A-Z]/.test(pwd))    missing.push("una mayúscula");
  if (!/[a-z]/.test(pwd))    missing.push("una minúscula");
  if (!/[0-9]/.test(pwd))    missing.push("un número");
  if (!/[^A-Za-z0-9]/.test(pwd)) missing.push("un carácter especial");

  const passed = 5 - missing.length;
  const score = passed <= 2 ? 1 : passed <= 4 ? 2 : 3;
  return { score: pwd.length === 0 ? 0 : score, missing };
};

const strengthConfig = {
  0: { label: "",       color: "inherit",  value: 0   },
  1: { label: "Débil",  color: "#e53935",  value: 33  },
  2: { label: "Media",  color: "#fb8c00",  value: 66  },
  3: { label: "Fuerte", color: "#43a047",  value: 100 },
} as const;

const RegisterPage = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const { score, missing } = evaluatePassword(password);
  const strength = strengthConfig[score as keyof typeof strengthConfig];

  const getRegisterErrorMessage = (error: unknown) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 409)
        return "Ese correo ya esta registrado. Inicia sesion o usa otro correo.";
      if (error.response?.status === 400)
        return "Datos invalidos. Verifica nombre, correo y contraseña.";
    }
    return "No fue posible crear la cuenta en este momento.";
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setTouched(true);

    if (missing.length > 0) {
      setErrorMessage(`La contraseña debe tener: ${missing.join(", ")}.`);
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsSubmitting(true);
    try {
      await SecurityService.registerWithEmailPassword({ name, email, password });
      navigate("/dashboard", { replace: true });
    } catch (error) {
      setErrorMessage(getRegisterErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box sx={{
      minHeight: "100vh",
      px: { xs: 2, md: 4 },
      py: { xs: 2, md: 4 },
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    }}>
      <Paper elevation={0} sx={{
        width: "100%",
        maxWidth: 1120,
        overflow: "hidden",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 1fr" },
      }}>
        {/* Panel izquierdo — sin cambios */}
        <Box sx={{
          p: { xs: 3, md: 5 },
          background: "linear-gradient(160deg, #0a3658 0%, #0b4f7d 52%, #0f8d74 100%)",
          color: "#e8f5f5",
        }}>
          <Chip
            icon={<DirectionsBusFilledRounded />}
            label="Nuevo acceso ciudadano"
            sx={{ mb: 3, color: "#e8f5f5", borderColor: "rgba(232,245,245,0.35)" }}
            variant="outlined"
          />
          <Typography component="h1" sx={{
            fontFamily: '"Sora", "Manrope", sans-serif',
            fontWeight: 700,
            fontSize: { xs: "1.8rem", md: "2.3rem" },
            lineHeight: 1.18,
            mb: 2,
          }}>
            Crea tu cuenta y accede al sistema de buses inteligentes.
          </Typography>
          <Typography sx={{ color: "rgba(232,245,245,0.86)", maxWidth: 440 }}>
            Tu cuenta inicia con perfil ciudadano para consultar informacion y
            operar funciones basicas dentro de la plataforma.
          </Typography>
        </Box>

        {/* Panel derecho */}
        <Box sx={{ p: { xs: 3, md: 5 }, display: "flex", alignItems: "center" }}>
          <Stack spacing={2.5} sx={{ width: "100%" }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>Registro</Typography>
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
                  onChange={(e) => setName(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Correo electrónico"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                />

                {/* Campo contraseña + indicador de fortaleza */}
                <Box>
                  <TextField
                    label="Contraseña"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setTouched(true);
                    }}
                    fullWidth
                    required
                    error={touched && missing.length > 0}
                  />

                  {/* Barra de fortaleza — solo visible cuando el campo tiene texto */}
                  {touched && password.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <LinearProgress
                        variant="determinate"
                        value={strength.value}
                        sx={{
                          height: 6,
                          borderRadius: 3,
                          backgroundColor: "#e0e0e0",
                          "& .MuiLinearProgress-bar": {
                            backgroundColor: strength.color,
                            borderRadius: 3,
                          },
                        }}
                      />
                      <Typography
                        variant="caption"
                        sx={{ color: strength.color, fontWeight: 500, mt: 0.5, display: "block" }}
                      >
                        {strength.label}
                        {missing.length > 0 && (
                          <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                            {" · "}Falta: {missing.join(", ")}
                          </Box>
                        )}
                      </Typography>
                    </Box>
                  )}
                </Box>

                <TextField
                  label="Confirmar contraseña"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  fullWidth
                  required
                  error={confirmPassword.length > 0 && password !== confirmPassword}
                  helperText={
                    confirmPassword.length > 0 && password !== confirmPassword
                      ? "Las contraseñas no coinciden"
                      : ""
                  }
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