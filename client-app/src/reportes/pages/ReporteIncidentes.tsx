import {
  Box,
  Card,
  CardContent,
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
import { useMemo, useState } from "react";
import httpClient from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";
const MONTH_OPTIONS = [
  { value: 3, label: "3 meses" },
  { value: 6, label: "6 meses" },
  { value: 12, label: "12 meses" },
];
const COLORS = ["#d32f2f", "#f57c00", "#1976d2", "#388e3c"];

const ReporteIncidentes = () => {
  const [period, setPeriod] = useState(12);
  const { data, isLoading } = useQuery({
    queryKey: ["incident-trends", period],
    queryFn: async () => {
      const { data } = await httpClient.get(
        `${API_URL}/api/reports/incident-trends?months=${period}`,
      );
      return data;
    },
  });

  const series = data?.series ?? [];
  const months = data?.months ?? [];
  const maxCount = useMemo(
    () => Math.max(...series.flatMap((s: any) => s.data), 1),
    [series],
  );

  return (
    <Box className="page-enter">
      <PageHeader
        title="Tendencia de incidentes"
        subtitle="Evolución mensual de incidentes por tipo."
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
            {/* Gráfico de líneas (CSS puro, sin librerías) */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Incidentes por mes
                </Typography>
                <Box
                  sx={{
                    position: "relative",
                    minHeight: 280,
                    pt: 2,
                    pb: 4,
                    overflowX: "auto",
                  }}
                >
                  {/* Eje Y */}
                  <Box
                    sx={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      bottom: 40,
                      width: 40,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "space-between",
                    }}
                  >
                    <Typography variant="caption">{maxCount}</Typography>
                    <Typography variant="caption">
                      {Math.round(maxCount / 2)}
                    </Typography>
                    <Typography variant="caption">0</Typography>
                  </Box>
                  {/* Gráfico */}
                  <Box
                    sx={{
                      ml: 5,
                      display: "flex",
                      gap: 1.5,
                      alignItems: "flex-end",
                      minHeight: 260,
                    }}
                  >
                    {months.map((month: string, mi: number) => {
                      let cumulative = 0;
                      return (
                        <Box
                          key={month}
                          sx={{
                            display: "flex",
                            flexDirection: "column",
                            alignItems: "center",
                            minWidth: 60,
                          }}
                        >
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column-reverse",
                              width: 40,
                              height: 240,
                              position: "relative",
                            }}
                          >
                            {series.map((s: any, si: number) => {
                              const height = (s.data[mi] / maxCount) * 220;
                              cumulative += height;
                              return (
                                <Tooltip
                                  key={s.type}
                                  title={`${s.name}: ${s.data[mi]}`}
                                >
                                  <Box
                                    sx={{
                                      width: "100%",
                                      height: Math.max(height, 1),
                                      backgroundColor:
                                        COLORS[si % COLORS.length],
                                      borderTopLeftRadius:
                                        si === series.length - 1 ? 4 : 0,
                                      borderTopRightRadius:
                                        si === series.length - 1 ? 4 : 0,
                                      transition: "height 0.3s",
                                      "&:hover": { opacity: 0.8 },
                                    }}
                                  />
                                </Tooltip>
                              );
                            })}
                          </Box>
                          <Typography
                            variant="caption"
                            sx={{
                              mt: 0.5,
                              writingMode: "vertical-lr",
                              rotate: "180deg",
                              fontSize: "0.7rem",
                            }}
                          >
                            {month}
                          </Typography>
                        </Box>
                      );
                    })}
                  </Box>
                  {/* Leyenda */}
                  <Stack
                    direction="row"
                    spacing={2}
                    flexWrap="wrap"
                    useFlexGap
                    sx={{ mt: 2, ml: 5 }}
                  >
                    {series.map((s: any, i: number) => (
                      <Stack
                        key={s.type}
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                      >
                        <Box
                          sx={{
                            width: 12,
                            height: 12,
                            borderRadius: "2px",
                            backgroundColor: COLORS[i % COLORS.length],
                          }}
                        />
                        <Typography variant="caption">{s.name}</Typography>
                      </Stack>
                    ))}
                  </Stack>
                </Box>
              </CardContent>
            </Card>

            {/* Tabla detalle */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Detalle mensual
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 700 }}>Mes</TableCell>
                        {series.map((s: any) => (
                          <TableCell
                            key={s.type}
                            sx={{ fontWeight: 700 }}
                            align="right"
                          >
                            {s.name}
                          </TableCell>
                        ))}
                        <TableCell sx={{ fontWeight: 700 }} align="right">
                          Total
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {months.map((month: string, mi: number) => {
                        const total = series.reduce(
                          (sum: number, s: any) => sum + s.data[mi],
                          0,
                        );
                        return (
                          <TableRow key={month}>
                            <TableCell>{month}</TableCell>
                            {series.map((s: any) => (
                              <TableCell key={s.type} align="right">
                                {s.data[mi]}
                              </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {total}
                            </TableCell>
                          </TableRow>
                        );
                      })}
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

export default ReporteIncidentes;
