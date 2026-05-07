import {
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  CircularProgress,
  Box,
  Typography,
} from "@mui/material";
import type { CitizenPaymentMethod } from "../models/boletos";

interface PagoSelectorProps {
  paymentMethods: CitizenPaymentMethod[];
  isLoading: boolean;
  selectedId: number | null;
  onChange: (id: number) => void;
  error?: string;
}

const PagoSelector = ({
  paymentMethods,
  isLoading,
  selectedId,
  onChange,
  error,
}: PagoSelectorProps) => {
  return (
    <FormControl fullWidth error={!!error}>
      <InputLabel>Método de pago</InputLabel>
      <Select
        value={selectedId ?? ""}
        label="Método de pago"
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {isLoading ? (
          <MenuItem disabled>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2">Cargando métodos...</Typography>
            </Box>
          </MenuItem>
        ) : paymentMethods.length === 0 ? (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              No hay métodos de pago registrados
            </Typography>
          </MenuItem>
        ) : (
          paymentMethods.map((pm) => (
            <MenuItem key={pm.id} value={pm.id}>
              {pm.paymentMethod?.name ?? "Método"} ••••{" "}
              {pm.cardNumber?.slice(-4) ?? ""}
              {pm.isDefault ? " (Predeterminado)" : ""}
            </MenuItem>
          ))
        )}
      </Select>
      {error && <FormHelperText>{error}</FormHelperText>}
    </FormControl>
  );
};

export default PagoSelector;
