import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

type ConfirmActionDialogProps = {
  open: boolean;
  title?: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
};

const ConfirmActionDialog = ({
  open,
  title = "Confirmar acción",
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  onCancel,
  onConfirm,
  confirmDisabled = false,
}: ConfirmActionDialogProps) => {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle sx={{ color: "error.main", fontWeight: 700 }}>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{description}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onCancel} variant="outlined" color="inherit">
          {cancelLabel}
        </Button>
        <Button onClick={onConfirm} variant="contained" color="error" disabled={confirmDisabled}>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ConfirmActionDialog;
