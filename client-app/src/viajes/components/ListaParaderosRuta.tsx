import AddRounded from "@mui/icons-material/AddRounded";
import DeleteRounded from "@mui/icons-material/DeleteRounded";
import DragIndicatorRounded from "@mui/icons-material/DragIndicatorRounded";
import {
  Box,
  Chip,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import { memo } from "react";
import type { Stop } from "../models/stop";
import type { SelectedStopData } from "../components/MapaSeleccionRuta";

type ListaParaderosRutaProps = {
  selectedStops: SelectedStopData[];
  availableStops: Stop[];
  onToggleStop: (stop: Stop) => void;
  onRemoveStop: (stopId: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
};

const ListaParaderosRuta = memo(
  ({
    selectedStops,
    availableStops,
    onToggleStop,
    onRemoveStop,
    onMoveUp,
    onMoveDown,
  }: ListaParaderosRutaProps) => {
    // Filtrar disponibles que aún no están seleccionados
    const selectedIds = new Set(selectedStops.map((s) => s.stop_id));
    const quickAdd = availableStops.filter((s) => !selectedIds.has(s.id));

    return (
      <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Agregar rápido */}
        {quickAdd.length > 0 && (
          <Box sx={{ mb: 1.5 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={600}
              display="block"
              mb={0.5}
            >
              Agregar rápido:
            </Typography>
            <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
              {quickAdd.slice(0, 10).map((s) => (
                <Chip
                  key={s.id}
                  label={s.name}
                  size="small"
                  variant="outlined"
                  icon={<AddRounded sx={{ fontSize: 14 }} />}
                  onClick={() => onToggleStop(s)}
                  sx={{ fontWeight: 600, mb: 0.5 }}
                />
              ))}
              {quickAdd.length > 10 && (
                <Chip
                  label={`+${quickAdd.length - 10} más`}
                  size="small"
                  variant="outlined"
                  sx={{ opacity: 0.5, mb: 0.5 }}
                />
              )}
            </Stack>
          </Box>
        )}

        {/* Lista de seleccionados */}
        <Box
          sx={{
            flex: 1,
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 1,
            overflow: "auto",
            maxHeight: 300,
          }}
        >
          {selectedStops.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                height: 100,
              }}
            >
              <Typography variant="body2" color="text.secondary">
                Haz clic en el mapa para agregar paraderos
              </Typography>
            </Box>
          ) : (
            <List dense>
              {selectedStops.map((stop, index) => (
                <ListItem
                  key={stop.stop_id}
                  divider={index < selectedStops.length - 1}
                  secondaryAction={
                    <Tooltip title="Quitar paradero">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => onRemoveStop(stop.stop_id)}
                      >
                        <DeleteRounded fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  }
                  sx={{
                    backgroundColor:
                      index === 0
                        ? "rgba(46,125,50,0.04)"
                        : index === selectedStops.length - 1
                          ? "rgba(211,47,47,0.04)"
                          : "transparent",
                  }}
                >
                  <Box sx={{ mr: 1, color: "text.secondary", cursor: "grab" }}>
                    <DragIndicatorRounded fontSize="small" />
                  </Box>
                  <Chip
                    label={index + 1}
                    size="small"
                    color="primary"
                    sx={{ mr: 1.5, minWidth: 32, fontWeight: 700 }}
                  />
                  <ListItemText
                    primary={stop.name}
                    secondary={stop.address}
                    primaryTypographyProps={{ fontWeight: 600, variant: "body2" }}
                    secondaryTypographyProps={{ variant: "caption" }}
                  />
                  <Stack direction="row" spacing={0.3} mr={1}>
                    <Tooltip title="Mover arriba">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === 0}
                          onClick={() => onMoveUp(index)}
                          sx={{ fontSize: 12, width: 24, height: 24 }}
                        >
                          ▲
                        </IconButton>
                      </span>
                    </Tooltip>
                    <Tooltip title="Mover abajo">
                      <span>
                        <IconButton
                          size="small"
                          disabled={index === selectedStops.length - 1}
                          onClick={() => onMoveDown(index)}
                          sx={{ fontSize: 12, width: 24, height: 24 }}
                        >
                          ▼
                        </IconButton>
                      </span>
                    </Tooltip>
                  </Stack>
                </ListItem>
              ))}
            </List>
          )}
        </Box>

        {/* Indicadores origen / destino */}
        {selectedStops.length >= 2 && (
          <Box sx={{ mt: 1, display: "flex", gap: 2, flexWrap: "wrap" }}>
            <Chip
              icon={
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#2e7d32",
                    display: "inline-block",
                  }}
                />
              }
              label={`Origen: ${selectedStops[0].name}`}
              size="small"
              variant="outlined"
              color="success"
            />
            <Chip
              icon={
                <Box
                  component="span"
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    bgcolor: "#d32f2f",
                    display: "inline-block",
                  }}
                />
              }
              label={`Destino: ${selectedStops[selectedStops.length - 1].name}`}
              size="small"
              variant="outlined"
              color="error"
            />
          </Box>
        )}
      </Box>
    );
  },
);

ListaParaderosRuta.displayName = "ListaParaderosRuta";
export default ListaParaderosRuta;
