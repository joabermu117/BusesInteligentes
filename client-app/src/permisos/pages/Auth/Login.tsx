import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { FormEvent } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SecurityService } from "../../services/SecurityService";

const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      await SecurityService.loginWithEmailPassword(email, password);
      navigate("/dashboard", { replace: true });
    } catch {
      setErrorMessage("Credenciales invalidas. Verifica email y contrasena.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = () => {
    window.location.href = SecurityService.getMicrosoftAuthorizeUrl();
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        background:
          "linear-gradient(135deg, rgba(8,44,79,1) 0%, rgba(10,88,125,1) 50%, rgba(18,125,139,1) 100%)",
      }}
    >
      <Paper
        elevation={8}
        sx={{ width: "100%", maxWidth: 460, p: { xs: 3, md: 4 } }}
      >
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700 }}>
              Iniciar sesion
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Accede con email y contrasena o con Microsoft.
            </Typography>
          </Box>

          {errorMessage && <Alert severity="error">{errorMessage}</Alert>}

          <Box component="form" onSubmit={handleEmailLogin}>
            <Stack spacing={2}>
              <TextField
                label="Email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Contrasena"
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
                {isSubmitting ? "Ingresando..." : "Iniciar con email"}
              </Button>
            </Stack>
          </Box>

          <Typography variant="caption" align="center" color="text.secondary">
            o
          </Typography>

          <Button
            variant="outlined"
            size="large"
            onClick={handleMicrosoftLogin}
            sx={{ textTransform: "none", fontWeight: 600 }}
          >
            Iniciar con Microsoft
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default LoginPage;
