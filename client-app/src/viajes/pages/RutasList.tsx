import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Box,
  Chip,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useRutas } from "../stores/useRutasStore";

const RutasList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: rutas, isLoading } = useRutas(search || undefined);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("es-PE", {
      style: "currency",
      currency: "PEN",
    }).format(value);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m} min`;
  };

  return (
    <Box className="page-enter">
      <PageHeader
        title="Rutas disponibles"
        subtitle="Consulta las rutas de transporte público, horarios y tarifas."
      />

      <TextField
        placeholder="Buscar ruta por nombre..."
        value={search}
        onChange={handleSearchChange}
        slotProps={{
          input: {
            startAdornment: <SearchRounded sx={{ mr: 1, color: "text.secondary" }} />,
          },
        }}
        sx={{ mb: 3, width: { xs: "100%", md: 400 } }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 700 }}>Nombre</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Origen</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Destino</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Distancia</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Duración</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Tarifa</TableCell>
              <TableCell sx={{ fontWeight: 700 }}>Estado</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    Cargando rutas...
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {!isLoading && rutas?.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography variant="body2" color="text.secondary">
                    No se encontraron rutas.
                  </Typography>
                </TableCell>
              </TableRow>
            )}
            {rutas?.map((ruta) => (
              <TableRow
                key={ruta.id}
                hover
                sx={{ cursor: "pointer" }}
                onClick={() => navigate(`/rutas/${ruta.id}`)}
              >
                <TableCell sx={{ fontWeight: 600 }}>{ruta.name}</TableCell>
                <TableCell>{ruta.origin}</TableCell>
                <TableCell>{ruta.destination}</TableCell>
                <TableCell>{ruta.distance} km</TableCell>
                <TableCell>{formatDuration(ruta.estimated_duration)}</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>
                  {formatCurrency(ruta.tarifa)}
                </TableCell>
                <TableCell>
                  <Chip
                    label={ruta.is_active ? "Activa" : "Inactiva"}
                    color={ruta.is_active ? "success" : "default"}
                    size="small"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default RutasList;
