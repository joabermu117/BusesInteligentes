import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import axios from "axios";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { SecurityService } from "../permisos/services/SecurityService";

const OTP_LENGTH = 6;

type ChallengeState = {
  challengeId: string;
  maskedEmail: string;
  expiresInSeconds: number;
};

const TwoFactorPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location.state ?? null) as ChallengeState | null;

  const [challengeId, setChallengeId] = useState(state?.challengeId ?? "");
  const [maskedEmail, setMaskedEmail] = useState(state?.maskedEmail ?? "");
  const [secondsLeft, setSecondsLeft] = useState(state?.expiresInSeconds ?? 0);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (!state?.challengeId) {
      navigate("/login", { replace: true });
      return;
    }
  }, [navigate, state?.challengeId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSecondsLeft((current) => (current > 0 ? current - 1 : 0));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (!isFinished && challengeId) {
        void SecurityService.cancelOtpChallenge(challengeId).catch(() => undefined);
      }
    };
  }, [challengeId, isFinished]);

  const formattedCountdown = useMemo(() => {
    const minutes = Math.floor(secondsLeft / 60);
    const seconds = secondsLeft % 60;
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  }, [secondsLeft]);

  const handleCodeChange = (value: string) => {
    const onlyDigits = value.replace(/\D/g, "").slice(0, OTP_LENGTH);
    setCode(onlyDigits);
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData("text");
    handleCodeChange(pasted);
  };

  const handleVerify = async () => {
    setError(null);
    setInfo(null);

    if (code.length !== OTP_LENGTH) {
      setError("Ingresa un codigo de 6 digitos.");
      return;
    }

    setIsSubmitting(true);
    try {
      await SecurityService.verifyOtpCode({ challengeId, code });
      setIsFinished(true);
      navigate("/dashboard", { replace: true });
    } catch (unknownError) {
      if (axios.isAxiosError(unknownError)) {
        const apiCode = unknownError.response?.data?.code;
        const remainingAttempts = unknownError.response?.data?.details?.remainingAttempts;

        if (apiCode === "OTP_ATTEMPTS_EXCEEDED") {
          setIsFinished(true);
          setError("Se agotaron los intentos. Debes iniciar sesion de nuevo.");
          navigate("/login", { replace: true });
          return;
        }

        if (apiCode === "OTP_INVALID" && typeof remainingAttempts === "number") {
          setError(`Codigo incorrecto. Intentos restantes: ${remainingAttempts}`);
          return;
        }

        if (apiCode === "OTP_EXPIRED") {
          setError("El codigo expiro. Solicita un reenvio.");
          return;
        }
      }

      setError("No fue posible validar el codigo OTP.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setInfo(null);

    setIsSubmitting(true);
    try {
      const response = await SecurityService.resendOtpCode(challengeId);
      setChallengeId(response.challengeId);
      setMaskedEmail(response.maskedEmail);
      setSecondsLeft(response.expiresInSeconds);
      setCode("");
      setInfo("Te enviamos un nuevo codigo. Revisa bandeja principal y spam.");
    } catch (unknownError) {
      if (axios.isAxiosError(unknownError)) {
        const cooldownSeconds = unknownError.response?.data?.details?.cooldownSeconds;
        if (typeof cooldownSeconds === "number") {
          setError(`Espera ${cooldownSeconds}s antes de reenviar.`);
          return;
        }
      }

      setError("No fue posible reenviar el codigo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (challengeId) {
      await SecurityService.cancelOtpChallenge(challengeId).catch(() => undefined);
    }
    setIsFinished(true);
    navigate("/login", { replace: true });
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
      <Paper sx={{ width: "100%", maxWidth: 520, p: { xs: 3, md: 4 } }}>
        <Stack spacing={2.5}>
          <Box>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Verificacion de seguridad
            </Typography>
            <Typography color="text.secondary">
              Enviamos un codigo de 6 digitos a {maskedEmail || "tu correo"}.
            </Typography>
            <Typography color={secondsLeft > 0 ? "text.primary" : "error.main"} sx={{ mt: 1 }}>
              Expira en: {formattedCountdown}
            </Typography>
          </Box>

          {error && <Alert severity="error">{error}</Alert>}
          {info && <Alert severity="success">{info}</Alert>}

          <TextField
            label="Codigo OTP"
            value={code}
            onChange={(event) => handleCodeChange(event.target.value)}
            onPaste={handlePaste}
            inputProps={{ inputMode: "numeric", pattern: "[0-9]*", maxLength: OTP_LENGTH }}
            fullWidth
            autoFocus
          />

          <Button variant="contained" disabled={isSubmitting || secondsLeft <= 0} onClick={handleVerify}>
            {isSubmitting ? "Validando..." : "Validar codigo"}
          </Button>

          <Button variant="outlined" disabled={isSubmitting} onClick={handleResend}>
            Reenviar codigo
          </Button>

          <Typography variant="body2" color="text.secondary">
            ¿No recibiste el codigo? Revisa spam o reenviar.
          </Typography>

          <Button variant="text" color="inherit" disabled={isSubmitting} onClick={handleCancel}>
            Cancelar y volver al login
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
};

export default TwoFactorPage;
