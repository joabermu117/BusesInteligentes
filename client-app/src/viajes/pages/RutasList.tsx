import ErrorOutlineRounded from "@mui/icons-material/ErrorOutlineRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Chip,
  TableCell,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import DataTable from "../../permisos/common/components/DataTable";
import PageHeader from "../../permisos/common/components/PageHeader";
import { useRutas } from "../stores/useRutasStore";
import { formatCurrency, formatDuration } from "../../shared/utils/format";

const RutasList = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: rutas, isLoading, error } = useRutas(search || undefined);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearch(e.target.value);
    },
    []
  );

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

      {error ? (
        <Alert
          severity="warning"
          icon={<ErrorOutlineRounded />}
          sx={{ mb: 3 }}
        >
          No tienes permiso para consultar las rutas. Contacta al administrador
          si crees que deberías tener acceso.
        </Alert>
      ) : (
        <DataTable
          columns={[
            "Nombre",
            "Descripción",
            "Origen",
            "Destino",
            "Distancia",
            "Duración",
            "Tarifa",
            "Estado",
          ]}
          hasData={!!rutas && rutas.length > 0}
          emptyMessage={
            isLoading ? "Cargando rutas..." : "No se encontraron rutas."
          }
          colSpan={8}
        >
          {rutas?.map((ruta) => (
            <TableRow
              key={ruta.id}
              hover
              sx={{ cursor: "pointer" }}
              onClick={() => navigate(`/rutas/${ruta.id}`)}
            >
              <TableCell sx={{ fontWeight: 600 }}>{ruta.name}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {ruta.description ?? "—"}
              </TableCell>
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
        </DataTable>
      )}
    </Box>
  );
};

export default RutasList;
