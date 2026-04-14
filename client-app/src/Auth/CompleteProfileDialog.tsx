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
import { ProfileService } from "../permisos/services/ProfileService";

interface CompleteProfileDialogProps {
  open: boolean;
  userId: string;
  onCompleted: () => void;
}

const CompleteProfileDialog = ({
  open,
  userId,
  onCompleted,
}: CompleteProfileDialogProps) => {
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError(null);

    if (phone.trim().length < 7) {
      setError("Ingresa un teléfono válido.");
      return;
    }

    if (address.trim().length < 5) {
      setError("Ingresa una dirección válida.");
      return;
    }

    setIsSubmitting(true);
    try {
      await ProfileService.completeProfile(userId, phone.trim(), address.trim());
      onCompleted();
    } catch {
      setError("No fue posible guardar la información. Intenta de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} maxWidth="xs" fullWidth>
      <DialogTitle>Completa tu perfil</DialogTitle>
      <DialogContent>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            Para continuar necesitamos algunos datos adicionales de tu perfil
            ciudadano.
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Teléfono"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            fullWidth
            size="small"
            autoFocus
            inputProps={{ inputMode: "tel" }}
          />
          <TextField
            label="Dirección"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            fullWidth
            size="small"
            multiline
            rows={2}
            placeholder="Calle, número, barrio, ciudad"
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={isSubmitting}
          fullWidth
        >
          {isSubmitting ? "Guardando..." : "Guardar y continuar"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default CompleteProfileDialog;