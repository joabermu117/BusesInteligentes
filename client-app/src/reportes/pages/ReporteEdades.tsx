import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
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

const ReporteEdades = () => {
  const [period, setPeriod] = useState<number>(-1);
  const { data, isLoading } = useQuery({
    queryKey: ["age-distribution", period],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (period > 0) params.set("months", period.toString());
      const res = await httpClient.get(
        `${API_URL}/api/reports/passenger-age-distribution?${params}`,
      );
      return res.data;
    },
  });

  const chartRef = useRef<HTMLDivElement>(null);

  const total = data?.totalPasajeros ?? 0;
  const segmentos = data?.segmentos ?? [];
  const predominante = data?.segmentoPredominante;

  const exportPNG = useCallback(async () => {
    if (!chartRef.current) return;
    const canvas = await import("html-to-image").then((m) =>
      m.toPng(chartRef.current!),
    );
    const a = document.createElement("a");
    a.href = canvas;
    a.download = "distribucion-etaria.png";
    a.click();
  }, []);

  const exportCSV = useCallback(() => {
    const headers = ["Rango etario", "Pasajeros", "Porcentaje", "Variación"];
    const rows = segmentos.map((s: any) =>
      [
        s.rango,
        s.pasajerosUnicos,
        `${s.porcentaje}%`,
        `${s.variacion >= 0 ? "+" : ""}${s.variacion}%`,
      ].join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "distribucion-etaria.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [segmentos]);

  const totalTorta = segmentos.reduce(
    (sum: number, s: any) => sum + s.pasajerosUnicos,
    0,
  );

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

        {isLoading && (
          <Typography color="text.secondary">Cargando...</Typography>
        )}

        {data && (
          <>
            {data.sinInformacion > 0 && (
              <Chip
                label={`${data.sinInformacion} pasajeros sin fecha de nacimiento`}
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

            {/* Gráfico de torta (CSS puro) */}
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
                    <Box
                      sx={{
                        position: "relative",
                        width: 220,
                        height: 220,
                        borderRadius: "50%",
                        background: segmentos
                          .map((s: any, i: number) => {
                            const pct = (s.pasajerosUnicos / totalTorta) * 100;
                            const prevPct = segmentos
                              .slice(0, i)
                              .reduce(
                                (sum: number, seg: any) =>
                                  sum +
                                  (seg.pasajerosUnicos / totalTorta) * 100,
                                0,
                              );
                            return `${COLORS[i % COLORS.length]} ${prevPct}% ${prevPct + pct}%`;
                          })
                          .join(", "),
                        flexShrink: 0,
                      }}
                    >
                      {segmentos.map((s: any) => {
                        const pct = (s.pasajerosUnicos / totalTorta) * 100;
                        return pct > 0 ? (
                          <Tooltip
                            key={s.rango}
                            title={`${s.rango}: ${s.pasajerosUnicos} pasajeros (${pct.toFixed(1)}%)`}
                          >
                            <Box
                              sx={{
                                position: "absolute",
                                inset: 0,
                                cursor: "pointer",
                                "&:hover": { opacity: 0.8 },
                              }}
                              onClick={() =>
                                alert(
                                  `${s.rango}: ${s.pasajerosUnicos} pasajeros`,
                                )
                              }
                            />
                          </Tooltip>
                        ) : null;
                      })}
                    </Box>
                    <Stack spacing={1}>
                      {segmentos.map((s: any, i: number) => {
                        const pct =
                          totalTorta > 0
                            ? ((s.pasajerosUnicos / totalTorta) * 100).toFixed(
                                1,
                              )
                            : 0;
                        return (
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
                              {pct}%
                            </Typography>
                          </Stack>
                        );
                      })}
                      {data.sinInformacion > 0 && (
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
                            {(
                              (data.sinInformacion /
                                (total + data.sinInformacion)) *
                              100
                            ).toFixed(1)}
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
                      {segmentos.map((s: any) => {
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
                      {data.sinInformacion > 0 && (
                        <TableRow>
                          <TableCell
                            sx={{
                              fontStyle: "italic",
                              color: "text.secondary",
                            }}
                          >
                            Sin información
                          </TableCell>
                          <TableCell align="right">
                            {data.sinInformacion}
                          </TableCell>
                          <TableCell align="right">
                            {(
                              (data.sinInformacion /
                                (total + data.sinInformacion)) *
                              100
                            ).toFixed(1)}
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
      </Stack>
    </Box>
  );
};

export default ReporteEdades;
