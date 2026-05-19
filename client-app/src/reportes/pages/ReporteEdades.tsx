import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useRef, useState } from "react";
import httpClient from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MONTH_OPTIONS = [
  { value: -1, label: "Todo" },
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
];
const COLORS = [
  "#1976d2",
  "#388e3c",
  "#f57c00",
  "#d32f2f",
  "#7b1fa2",
  "#9e9e9e",
];

// Convierte grados a radianes
const toRad = (deg: number) => (deg * Math.PI) / 180;

// Genera el path SVG para un sector de torta
function sectorPath(
  cx: number,
  cy: number,
  r: number,
  startAngle: number,
  endAngle: number,
) {
  const x1 = cx + r * Math.cos(toRad(startAngle - 90));
  const y1 = cy + r * Math.sin(toRad(startAngle - 90));
  const x2 = cx + r * Math.cos(toRad(endAngle - 90));
  const y2 = cy + r * Math.sin(toRad(endAngle - 90));
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`;
}

interface Segmento {
  rango: string;
  pasajeros: number;
  pasajerosUnicos: number;
  porcentaje: number;
  variacion: number;
}

const ReporteEdades = () => {
  const [period, setPeriod] = useState<number>(-1);
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [selectedSegment, setSelectedSegment] = useState<Segmento | null>(null);

  const queryKey = ["age-distribution", period, startDate, endDate];
  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period > 0) params.set("months", period.toString());
      if (startDate) params.set("startDate", startDate);
      if (endDate) params.set("endDate", endDate);
      const res = await httpClient.get(
        `${API_URL}/api/reports/passenger-age-distribution?${params}`,
      );
      return res.data;
    },
  });

  const chartRef = useRef<HTMLDivElement>(null);

  const total = data?.totalPasajeros ?? 0;
  const sinInformacion = data?.sinInformacion ?? 0;
  const segmentos: Segmento[] = data?.segmentos ?? [];
  const predominante = data?.segmentoPredominante as string | null;
  const totalConSinInfo = total + sinInformacion;

  const exportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    const { toPng } = await import("html-to-image");
    const canvas = await toPng(chartRef.current);
    const a = document.createElement("a");
    a.href = canvas;
    a.download = "distribucion-etaria.png";
    a.click();
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ["Rango etario", "Pasajeros", "Porcentaje", "Variación"];
    const rows = segmentos.map((s) =>
      [
        s.rango,
        s.pasajerosUnicos,
        `${s.porcentaje}%`,
        `${s.variacion >= 0 ? "+" : ""}${s.variacion}%`,
      ].join(","),
    );
    if (sinInformacion > 0) {
      rows.push(
        [
          "Sin información",
          sinInformacion,
          `${((sinInformacion / totalConSinInfo) * 100).toFixed(1)}%`,
          "—",
        ].join(","),
      );
    }
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "distribucion-etaria.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [segmentos, sinInformacion, totalConSinInfo]);

  const totalTorta = segmentos.reduce((sum, s) => sum + s.pasajerosUnicos, 0);

  // Calcular ángulos para SVG
  const segmentAngles = (() => {
    let currentAngle = 0;
    return segmentos.map((s) => {
      const pct = totalTorta > 0 ? s.pasajerosUnicos / totalTorta : 0;
      const angle = pct * 360;
      const start = currentAngle;
      currentAngle += angle;
      return { start, end: currentAngle };
    });
  })();

  // Calcular etiquetas para segmentos muy pequeños
  const labelSegments = segmentos.map((s, i) => {
    const angle = totalTorta > 0 ? (s.pasajerosUnicos / totalTorta) * 360 : 0;
    const midAngle = segmentAngles[i].start + angle / 2;
    const labelR = 75;
    const lx = 110 + labelR * Math.cos(toRad(midAngle - 90));
    const ly = 110 + labelR * Math.sin(toRad(midAngle - 90));
    return { angle, midAngle, lx, ly };
  });

  return (
    <Box className="page-enter">
      <PageHeader
        title="Distribución de pasajeros por rango etario"
        subtitle="Análisis de la composición demográfica de los pasajeros."
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              size="small"
              onClick={exportPNG}
              disabled={!data}
            >
              Exportar PNG
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={exportCSV}
              disabled={!data}
            >
              Exportar CSV
            </Button>
          </Stack>
        }
      />

      <Stack spacing={3}>
        {/* Filtros */}
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems="center"
        >
          <ToggleButtonGroup
            value={period}
            exclusive
            onChange={(_, v) => v !== null && setPeriod(v)}
            size="small"
          >
            {MONTH_OPTIONS.map((o) => (
              <ToggleButton key={o.value} value={o.value}>
                {o.label}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
          <TextField
            label="Desde"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            sx={{ maxWidth: 180 }}
          />
          <TextField
            label="Hasta"
            type="date"
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            sx={{ maxWidth: 180 }}
          />
        </Stack>

        {isLoading && (
          <Typography color="text.secondary">Cargando...</Typography>
        )}

        {data && (
          <>
            {sinInformacion > 0 && (
              <Chip
                label={`${sinInformacion} pasajeros sin fecha de nacimiento`}
                color="default"
                variant="outlined"
                sx={{ alignSelf: "flex-start" }}
              />
            )}

            {predominante && (
              <Chip
                label={`Segmento predominante: ${predominante}`}
                color="primary"
                variant="filled"
                sx={{
                  alignSelf: "flex-start",
                  fontWeight: 700,
                  fontSize: "1rem",
                  px: 2,
                  py: 3,
                }}
              />
            )}

            {/* Gráfico de torta SVG */}
            <Card variant="outlined" ref={chartRef}>
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Distribución porcentual
                </Typography>
                {totalTorta > 0 ? (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                      flexWrap: "wrap",
                    }}
                  >
                    <svg
                      width={220}
                      height={220}
                      viewBox="0 0 220 220"
                      style={{ flexShrink: 0 }}
                    >
                      {segmentos.map((s, i) => {
                        const { start, end } = segmentAngles[i];
                        const d = sectorPath(110, 110, 100, start, end);
                        return (
                          <g key={s.rango}>
                            <path
                              d={d}
                              fill={COLORS[i % COLORS.length]}
                              stroke="#fff"
                              strokeWidth={2}
                              style={{ cursor: "pointer" }}
                              onClick={() => setSelectedSegment(s)}
                              onMouseEnter={(e) => {
                                (
                                  e.currentTarget as SVGPathElement
                                ).style.opacity = "0.8";
                              }}
                              onMouseLeave={(e) => {
                                (
                                  e.currentTarget as SVGPathElement
                                ).style.opacity = "1";
                              }}
                            />
                            {labelSegments[i].angle > 15 && (
                              <text
                                x={labelSegments[i].lx}
                                y={labelSegments[i].ly}
                                fill="#fff"
                                fontSize={12}
                                fontWeight={700}
                                textAnchor="middle"
                                dominantBaseline="central"
                                style={{ pointerEvents: "none" }}
                              >
                                {s.porcentaje}%
                              </text>
                            )}
                          </g>
                        );
                      })}
                    </svg>
                    <Stack spacing={1}>
                      {segmentos.map((s, i) => (
                        <Stack
                          key={s.rango}
                          direction="row"
                          spacing={1}
                          alignItems="center"
                        >
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "3px",
                              backgroundColor: COLORS[i % COLORS.length],
                            }}
                          />
                          <Typography variant="body2">{s.rango}</Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {s.porcentaje}%
                          </Typography>
                        </Stack>
                      ))}
                      {sinInformacion > 0 && (
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Box
                            sx={{
                              width: 14,
                              height: 14,
                              borderRadius: "3px",
                              backgroundColor: COLORS[COLORS.length - 1],
                            }}
                          />
                          <Typography variant="body2">
                            Sin información
                          </Typography>
                          <Typography variant="body2" fontWeight={700}>
                            {((sinInformacion / totalConSinInfo) * 100).toFixed(
                              1,
                            )}
                            %
                          </Typography>
                        </Stack>
                      )}
                    </Stack>
                  </Box>
                ) : (
                  <Typography color="text.secondary">
                    No hay datos para el período seleccionado.
                  </Typography>
                )}
              </CardContent>
            </Card>

            {/* Tabla detalle */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Detalle por rango etario
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>
                          Rango etario
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Pasajeros
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Porcentaje
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Variación vs mes ant.
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {segmentos.map((s) => {
                        const pct =
                          totalTorta > 0
                            ? ((s.pasajerosUnicos / totalTorta) * 100).toFixed(
                                1,
                              )
                            : "0.0";
                        const isPredominante = s.rango === predominante;
                        return (
                          <TableRow
                            key={s.rango}
                            sx={
                              isPredominante
                                ? { backgroundColor: "action.selected" }
                                : {}
                            }
                          >
                            <TableCell
                              sx={{ fontWeight: isPredominante ? 700 : 400 }}
                            >
                              {s.rango}
                              {isPredominante ? " ⭐" : ""}
                            </TableCell>
                            <TableCell align="right">
                              {s.pasajerosUnicos}
                            </TableCell>
                            <TableCell align="right">{pct}%</TableCell>
                            <TableCell align="right">
                              <Chip
                                label={
                                  s.variacion >= 0
                                    ? `+${s.variacion}%`
                                    : `${s.variacion}%`
                                }
                                color={s.variacion >= 0 ? "success" : "error"}
                                size="small"
                                variant="outlined"
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                      {sinInformacion > 0 && (
                        <TableRow>
                          <TableCell
                            sx={{
                              fontStyle: "italic",
                              color: "text.secondary",
                            }}
                          >
                            Sin información
                          </TableCell>
                          <TableCell align="right">{sinInformacion}</TableCell>
                          <TableCell align="right">
                            {((sinInformacion / totalConSinInfo) * 100).toFixed(
                              1,
                            )}
                            %
                          </TableCell>
                          <TableCell align="right">—</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              </CardContent>
            </Card>
          </>
        )}

        {/* Modal con detalle del segmento */}
        <Dialog
          open={!!selectedSegment}
          onClose={() => setSelectedSegment(null)}
        >
          <DialogTitle>{selectedSegment?.rango}</DialogTitle>
          <DialogContent>
            <DialogContentText>
              <strong>Pasajeros únicos:</strong>{" "}
              {selectedSegment?.pasajerosUnicos}
              <br />
              <strong>Porcentaje:</strong> {selectedSegment?.porcentaje}%
              <br />
              <strong>Variación vs mes anterior:</strong>{" "}
              {selectedSegment && (
                <Chip
                  label={`${selectedSegment.variacion >= 0 ? "+" : ""}${selectedSegment.variacion}%`}
                  color={selectedSegment.variacion >= 0 ? "success" : "error"}
                  size="small"
                  variant="outlined"
                />
              )}
            </DialogContentText>
          </DialogContent>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default ReporteEdades;
