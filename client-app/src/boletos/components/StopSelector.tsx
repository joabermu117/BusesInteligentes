import {
  Box,
  Card,
  CardContent,
  CircularProgress,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
} from "@mui/material";
import type { Paradero } from "../../viajes/models/ruta";

interface StopSelectorProps {
  selectedScheduleId: number | null;
  paraderos: Paradero[] | undefined;
  isLoading: boolean;
  selectedStopId: number | null;
  onChange: (stopId: number) => void;
}

const StopSelector = ({
  selectedScheduleId,
  paraderos,
  isLoading,
  selectedStopId,
  onChange,
}: StopSelectorProps) => (
  <Card>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        Paradero de abordaje
      </Typography>
      {!selectedScheduleId ? (
        <Typography variant="body2" color="text.secondary">
          Selecciona una programación primero.
        </Typography>
      ) : isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress size={24} />
        </Box>
      ) : paraderos && paraderos.length > 0 ? (
        <FormControl fullWidth>
          <InputLabel>Seleccionar paradero</InputLabel>
          <Select
            value={selectedStopId ?? ""}
            label="Seleccionar paradero"
            onChange={(e) => onChange(Number(e.target.value))}
          >
            {paraderos.map((p: Paradero) => (
              <MenuItem key={p.stop_id} value={p.stop_id}>
                {p.stop.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      ) : (
        <Typography variant="body2" color="text.secondary">
          No hay paraderos registrados para esta ruta.
        </Typography>
      )}
    </CardContent>
  </Card>
);

export default StopSelector;
