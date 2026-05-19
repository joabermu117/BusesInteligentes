import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider,
} from "@mui/material";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import type { Ticket } from "../models/boletos";

interface ConfirmacionAbordajeProps {
  open: boolean;
  ticket: Ticket | null;
  remainingBalance: number;
  onClose: () => void;
}

const ConfirmacionAbordaje = ({
  open,
  ticket,
  remainingBalance,
  onClose,
}: ConfirmacionAbordajeProps) => {
  if (!ticket) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ textAlign: "center", pt: 3 }}>
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          <CheckCircleRounded sx={{ fontSize: 56, color: "success.main" }} />
          <Typography variant="h5" fontWeight={700}>
            Abordaje exitoso
          </Typography>
        </Box>
      </DialogTitle>
      <DialogContent>
        <DialogContentText component="div">
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            <Divider />
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Boleto
              </Typography>
              <Chip
                label={ticket.ticketNumber}
                color="primary"
                variant="outlined"
                size="small"
              />
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Tarifa
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                $ {Number(ticket.price).toLocaleString("es-CO")}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Saldo restante
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                $ {Number(remainingBalance).toLocaleString("es-CO")}
              </Typography>
            </Box>
            <Box
              sx={{ display: "flex", justifyContent: "space-between" }}
            >
              <Typography variant="body2" color="text.secondary">
                Estado
              </Typography>
              <Chip
                label="Emitido"
                color="success"
                size="small"
              />
            </Box>
          </Box>
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ justifyContent: "center", pb: 3 }}>
        <Button onClick={onClose} variant="contained" sx={{ px: 4 }}>
          Continuar
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmacionAbordaje;
