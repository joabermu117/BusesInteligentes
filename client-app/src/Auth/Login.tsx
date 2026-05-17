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
import { executeRecaptcha } from "../config/recaptcha";
import { FirebaseAuthService } from "../permisos/services/FirebaseAuthService";
import {
  SecurityService,
  isChallengeResponse,
} from "../permisos/services/SecurityService";
import GithubPrivateEmailDialog from "./GithubPrivateEmailDialog";

const GitHubIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.509 11.509 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576C20.566 21.797 24 17.3 24 12c0-6.627-5.373-12-12-12z" />
  </svg>
);

// Entry point for all login providers. Every provider routes through OTP challenge.
const LoginPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [githubEmailDialogOpen, setGithubEmailDialogOpen] = useState(false);
  const [githubPrivateData, setGithubPrivateData] = useState({
    idToken: "",
    name: "",
    photoUrl: "",
    githubUsername: "",
  });

  const getLoginErrorMessage = (
    error: unknown,
    provider: "email" | "google" | "microsoft" | "github",
  ) => {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        if (provider === "google") {
          return "No fue posible validar tu cuenta de Google.";
        }

        if (provider === "microsoft") {
          return "No fue posible validar tu cuenta de Microsoft.";
        }

        if (provider === "github") {
          return "No fue posible validar tu cuenta de GitHub.";
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

  const getGithubLinkingMessage = (error: unknown): string | null => {
    const typedError = error as {
      code?: string;
      customData?: { _tokenResponse?: { needConfirmation?: boolean } };
      response?: { data?: { needConfirmation?: boolean } };
    };

    const code = typedError?.code;
    const needConfirmationFromFirebase =
      typedError?.customData?._tokenResponse?.needConfirmation === true;
    const needConfirmationFromHttp =
      typedError?.response?.data?.needConfirmation === true;

    if (
      code === "auth/account-exists-with-different-credential" ||
      code === "auth/email-already-in-use" ||
      needConfirmationFromFirebase ||
      needConfirmationFromHttp
    ) {
      return "Ese correo ya esta asociado a Google en Firebase. Inicia con Google y luego vincula GitHub desde tu perfil.";
    }

    return null;
  };

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      // Local credentials + anti-bot, then redirect to 2FA challenge or dashboard.
      const recaptchaToken = await executeRecaptcha("login");
      const response = await SecurityService.loginWithEmailPassword(
        email,
        password,
        recaptchaToken,
      );

      // If 2FA is disabled, login returns JWT directly.
      if (!isChallengeResponse(response)) {
        SecurityService.persistTokenResponse(response);
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/2fa", { replace: true, state: response });
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
      // Social identity is validated first, then backend starts shared OTP flow.
      const recaptchaToken = await executeRecaptcha("login");
      const credential = await FirebaseAuthService.signInWithGoogle();
      const idToken = await FirebaseAuthService.getIdToken(credential);
      const socialMetadata = FirebaseAuthService.getSocialMetadata(credential);
      const response = await SecurityService.exchangeFirebaseToken(
        idToken,
        recaptchaToken,
        {
          provider: "google",
          photoUrl: socialMetadata.photoUrl,
        },
      );

      // If 2FA is disabled, login returns JWT directly.
      if (!isChallengeResponse(response)) {
        SecurityService.persistTokenResponse(response);
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/2fa", { replace: true, state: response });
    } catch (error) {
      setErrorMessage(getLoginErrorMessage(error, "google"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGithubLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    let currentGithubIdToken = "";
    try {
      const recaptchaToken = await executeRecaptcha("login");
      const credential = await FirebaseAuthService.signInWithGithub();
      const idToken = await FirebaseAuthService.getIdToken(credential);
      currentGithubIdToken = idToken;
      const socialMetadata = FirebaseAuthService.getSocialMetadata(credential);
      const requiresAlternativeEmail =
        await FirebaseAuthService.requiresGithubAlternativeEmail(credential);

      const response = await SecurityService.exchangeGithubToken(
        idToken,
        recaptchaToken,
        {
          photoUrl: socialMetadata.photoUrl,
          githubUsername: socialMetadata.githubUsername,
          requiresAlternativeEmail,
        },
      );

      // If 2FA is disabled, login returns JWT directly.
      if (!isChallengeResponse(response)) {
        SecurityService.persistTokenResponse(response);
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/2fa", { replace: true, state: response });
    } catch (error: any) {
      if (error?.code === "auth/popup-closed-by-user") return;

      const linkingMessage = getGithubLinkingMessage(error);
      if (linkingMessage) {
        setErrorMessage(linkingMessage);
        return;
      }

      if (
        error?.response?.status === 422 &&
        error?.response?.data?.requiresEmail
      ) {
        const data = error.response.data;
        setGithubPrivateData({
          idToken: currentGithubIdToken,
          name: data.name ?? "",
          photoUrl: data.photoUrl ?? "",
          githubUsername: data.githubUsername ?? "",
        });
        setGithubEmailDialogOpen(true);
        return;
      }
      setErrorMessage(getLoginErrorMessage(error, "github"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleMicrosoftLogin = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      // Microsoft uses Firebase auth token exchange then OTP challenge.
      const recaptchaToken = await executeRecaptcha("login");
      const credential = await FirebaseAuthService.signInWithMicrosoft();
      const idToken = await FirebaseAuthService.getIdToken(credential);
      const socialMetadata =
        await FirebaseAuthService.getMicrosoftSocialMetadata(credential);
      const response = await SecurityService.exchangeFirebaseToken(
        idToken,
        recaptchaToken,
        {
          provider: "microsoft",
          photoUrl: socialMetadata.photoUrl,
        },
      );

      // If 2FA is disabled, login returns JWT directly.
      if (!isChallengeResponse(response)) {
        SecurityService.persistTokenResponse(response);
        navigate("/dashboard", { replace: true });
        return;
      }

      navigate("/2fa", { replace: true, state: response });
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
              • Acceso con Google, Microsoft, GitHub y cuenta local
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
                  onChange={(e) => setEmail(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Contraseña"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  fullWidth
                  required
                />
                <Button
                  type="button"
                  variant="text"
                  onClick={() => navigate("/password-recovery")}
                  disabled={isSubmitting}
                  size="small"
                >
                  ¿Olvidó su contraseña?
                </Button>

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
              variant="outlined"
              startIcon={<GoogleIcon />}
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              size="large"
            >
              Continuar con Google
            </Button>

            <Button
              variant="outlined"
              startIcon={<GitHubIcon />}
              onClick={handleGithubLogin}
              disabled={isSubmitting}
              size="large"
              sx={{
                borderColor: "#24292e",
                color: "#24292e",
                "&:hover": {
                  borderColor: "#24292e",
                  backgroundColor: "#f6f8fa",
                },
              }}
            >
              Continuar con GitHub
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
      <GithubPrivateEmailDialog
        open={githubEmailDialogOpen}
        idToken={githubPrivateData.idToken}
        name={githubPrivateData.name}
        photoUrl={githubPrivateData.photoUrl}
        githubUsername={githubPrivateData.githubUsername}
        onClose={() => setGithubEmailDialogOpen(false)}
      />
    </Box>
  );
};

export default LoginPage;
