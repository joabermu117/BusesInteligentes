import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { executeRecaptcha } from "../config/recaptcha";
import { SecurityService } from "../permisos/services/SecurityService";

interface GithubPrivateEmailDialogProps {
  open: boolean;
  idToken: string;
  name: string;
  photoUrl: string;
  githubUsername: string;
  onClose: () => void;
}

const GithubPrivateEmailDialog = ({
  open,
  idToken,
  name,
  photoUrl,
  githubUsername,
  onClose,
}: GithubPrivateEmailDialogProps) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);
    if (!email.includes("@")) {
      setError("Ingresa un email válido.");
      return;
    }

    setIsSubmitting(true);
    try {
      const recaptchaToken = await executeRecaptcha("login");
      const challenge = await SecurityService.completeGithubLoginWithEmail({
        idToken,
        email,
        name,
        photoUrl,
        githubUsername,
        recaptchaToken,
      });
      onClose();
      navigate("/2fa", { replace: true, state: challenge });
    } catch (e: any) {
      const status = e?.response?.status;
      if (status === 409) {
        setError("Ese correo ya está registrado con otro método. Intenta con otro email.");
      } else {
        setError("No fue posible completar el registro. Intenta de nuevo.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Email requerido</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Tu cuenta de GitHub tiene el email configurado como privado.
            Ingresa un email alternativo para completar tu registro.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Email alternativo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            size="small"
            autoFocus
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="inherit" disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting}>
          {isSubmitting ? "Procesando..." : "Continuar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default GithubPrivateEmailDialog;