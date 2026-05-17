import {
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import httpClient from "../../config/httpClient";
import { BUS_STATUS_LABELS } from "../models/bus";
import { useBus } from "../stores/useBusesStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const BusDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: bus, isLoading } = useBus(Number(id));
  const [uploading, setUploading] = useState(false);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bus) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      await httpClient.patch(`${API_URL}/api/buses/${bus.id}`, {
        photoUrl: base64,
      });
      window.location.reload();
    };
    reader.readAsDataURL(file);
    setUploading(false);
  };

  if (isLoading) return <Typography>Cargando...</Typography>;
  if (!bus) return <Typography>Bus no encontrado.</Typography>;

  return (
    <Box className="page-enter">
      <Button
        variant="outlined"
        onClick={() => navigate("/buses")}
        sx={{ mb: 2 }}
      >
        ← Volver a flota
      </Button>
      <Card variant="outlined">
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={3}
            alignItems="flex-start"
          >
            <Box textAlign="center">
              <Avatar
                src={bus.photoUrl}
                sx={{
                  width: 160,
                  height: 160,
                  bgcolor: "primary.main",
                  fontSize: 48,
                }}
              >
                {bus.plate.charAt(0)}
              </Avatar>
              <Button
                variant="text"
                component="label"
                size="small"
                sx={{ mt: 1 }}
                disabled={uploading}
              >
                {uploading ? "Subiendo..." : "Subir foto"}
                <input
                  type="file"
                  hidden
                  accept="image/*"
                  onChange={handleUploadPhoto}
                />
              </Button>
            </Box>
            <Stack spacing={1.5} sx={{ flex: 1 }}>
              <Typography variant="h4" fontWeight={700}>
                {bus.plate}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {bus.model} · {bus.year}
              </Typography>
              <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                <Chip
                  label={BUS_STATUS_LABELS[bus.status]}
                  color={
                    bus.status === "operative"
                      ? "success"
                      : bus.status === "maintenance"
                        ? "warning"
                        : "error"
                  }
                  size="small"
                />
                <Chip
                  label={`Capacidad: ${bus.totalCapacity} pasajeros`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Sentados: ${bus.seatedCapacity ?? "N/A"}`}
                  variant="outlined"
                  size="small"
                />
                <Chip
                  label={`Parados: ${bus.standingCapacity ?? "N/A"}`}
                  variant="outlined"
                  size="small"
                />
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Empresa: {bus.company?.name ?? "—"}
              </Typography>
              {bus.qrCode && (
                <Typography variant="body2" color="text.secondary">
                  QR:{" "}
                  <code style={{ fontSize: "0.8rem", wordBreak: "break-all" }}>
                    {bus.qrCode}
                  </code>
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
};

export default BusDetail;
