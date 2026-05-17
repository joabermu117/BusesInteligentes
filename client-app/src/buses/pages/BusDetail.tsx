import DownloadRounded from "@mui/icons-material/DownloadRounded";
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
import { useSnackbar } from "notistack";
import { QRCodeCanvas } from "qrcode.react";
import { useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import httpClient from "../../config/httpClient";
import { BUS_STATUS_LABELS } from "../models/bus";
import { useBus } from "../stores/useBusesStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const BusDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const { data: bus, isLoading, refetch } = useBus(Number(id));
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrRef = useRef<HTMLCanvasElement>(null);

  const handleUploadPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !bus) return;
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = reader.result as string;
        await httpClient.patch(`${API_URL}/api/buses/${bus.id}`, {
          photo: base64,
        });
        refetch();
        enqueueSnackbar("Foto actualizada correctamente", {
          variant: "success",
        });
      } catch {
        enqueueSnackbar("Error al subir la foto", { variant: "error" });
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadQR = () => {
    if (!qrRef.current) return;
    const canvas = qrRef.current;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.download = `QR-${bus?.plate}.png`;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
                src={bus.photo}
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
                  ref={fileInputRef}
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
                Empresa:{" "}
                {bus.company?.nombre
                  ? `${bus.company.nombre} (${bus.company.nit ?? ""})`
                  : "—"}
              </Typography>
            </Stack>
          </Stack>

          {bus.qrCode && (
            <Box
              sx={{
                mt: 4,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 1.5,
              }}
            >
              <Typography variant="subtitle1" fontWeight={600}>
                Código QR del bus
              </Typography>
              <QRCodeCanvas
                ref={qrRef}
                value={bus.qrCode}
                size={200}
                level="M"
              />
              <Button
                variant="outlined"
                size="small"
                startIcon={<DownloadRounded />}
                onClick={handleDownloadQR}
              >
                Descargar QR
              </Button>
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
};

export default BusDetail;
