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
            sx={{
              color: "text.secondary",
              "&:hover": { backgroundColor: "action.hover" },
            }}
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
              color: "primary.main",
              borderColor: "primary.main",
              textTransform: "none",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "action.hover",
                borderColor: "primary.dark",
              },
            }}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={submitting || !canSubmit}
            variant="contained"
            startIcon={
              submitting ? <CircularProgress size={16} color="inherit" /> : null
            }
            sx={{
              backgroundColor: "primary.main",
              color: "white",
              fontWeight: 600,
              textTransform: "none",
              "&:hover": { backgroundColor: "primary.dark", boxShadow: "none" },
              "&:disabled": { backgroundColor: "action.disabledBackground" },
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
