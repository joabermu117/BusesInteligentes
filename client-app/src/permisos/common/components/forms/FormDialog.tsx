import { Close as CloseIcon } from "@mui/icons-material";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  type SxProps,
  type Theme,
} from "@mui/material";
import type { ReactNode } from "react";

interface FormDialogProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  submitLabel: string;
  submitting: boolean;
  canSubmit: boolean;
  children: ReactNode;
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl";
  submitSx?: SxProps<Theme>;
}

const FormDialog = ({
  open,
  title,
  onClose,
  onSubmit,
  submitLabel,
  submitting,
  canSubmit,
  children,
  maxWidth = "md",
  submitSx,
}: FormDialogProps) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth>
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Typography variant="h4" component="div" sx={{ fontWeight: "bold" }}>
            {title}
          </Typography>
          <IconButton
            onClick={onClose}
            disabled={submitting}
            sx={{ color: "#E52320", "&:hover": { backgroundColor: "#fce4e4" } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
      >
        <DialogContent>
          <Box sx={{ pt: 1 }}>{children}</Box>
        </DialogContent>

        <DialogActions sx={{ p: 3, pt: 1 }}>
          <Button
            onClick={onClose}
            disabled={submitting}
            variant="outlined"
            sx={{
              color: "#E52320",
              borderColor: "#E52320",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": { backgroundColor: "#fce4e4", borderColor: "#C71A17" },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting || !canSubmit}
            variant="contained"
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : null}
            sx={{
              backgroundColor: "#E52320",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { backgroundColor: "#c21e1b", boxShadow: "none" },
              "&:disabled": { backgroundColor: "#ccc" },
              ...submitSx,
            }}
          >
            {submitting ? "Procesando..." : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};

export default FormDialog;