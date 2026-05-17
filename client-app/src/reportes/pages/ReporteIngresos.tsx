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
  Typography,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import PageHeader from "../../permisos/common/components/PageHeader";
import { formatCurrency } from "../../shared/utils/format";
import { useRevenueReport } from "../stores/useReportesStore";

const MONTH_OPTIONS = [
  { value: 3, label: "Últimos 3 meses" },
  { value: 6, label: "Últimos 6 meses" },
  { value: 12, label: "Últimos 12 meses" },
];

const COLORS = [
  "#1976d2",
  "#388e3c",
  "#f57c00",
  "#d32f2f",
  "#7b1fa2",
  "#00796b",
];

const ReporteIngresos = () => {
  const [period, setPeriod] = useState<number>(12);
  const { data: report, isLoading } = useRevenueReport(period);

  const maxRevenue = useMemo(() => {
    if (!report?.series.length) return 1;
    return Math.max(...report.series.flatMap((s) => s.data), 1);
  }, [report]);

  const totalGeneral = useMemo(
    () => report?.totalsByMethod.reduce((sum, t) => sum + t.total, 0) ?? 0,
    [report],
  );

  const exportCSV = useCallback(() => {
    if (!report) return;
    const headers = ["Mes", ...report.series.map((s) => s.name), "Total"];
    const rows = report.months.map((month, i) => {
      const values = report.series.map((s) => s.data[i]);
      const total = values.reduce((a, b) => a + b, 0);
      return [month, ...values, total].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reporte-ingresos-${period}meses.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [report, period]);

  return (
    <Box className="page-enter">
      <PageHeader
        title="Reporte de ingresos por método de pago"
        subtitle="Evolución mensual de ingresos agrupados por método de pago."
        actions={
          <Button variant="outlined" onClick={exportCSV} disabled={!report}>
            Exportar CSV
          </Button>
        }
      />

      <Stack spacing={3}>
        {/* Selector de período */}
        <ToggleButtonGroup
          value={period}
          exclusive
          onChange={(_, val) => val && setPeriod(val)}
          size="small"
        >
          {MONTH_OPTIONS.map((opt) => (
            <ToggleButton key={opt.value} value={opt.value}>
              {opt.label}
            </ToggleButton>
          ))}
        </ToggleButtonGroup>

        {isLoading && (
          <Typography color="text.secondary">Cargando reporte...</Typography>
        )}

        {report && (
          <>
            {/* Totales por método */}
            <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
              {report.totalsByMethod.map((t, i) => (
                <Chip
                  key={t.method}
                  label={`${t.method}: ${formatCurrency(t.total)}`}
                  sx={{
                    backgroundColor: COLORS[i % COLORS.length] + "22",
                    color: COLORS[i % COLORS.length],
                    fontWeight: 700,
                    fontSize: "0.9rem",
                    px: 1,
                  }}
                />
              ))}
              <Chip
                label={`Total general: ${formatCurrency(totalGeneral)}`}
                color="primary"
                variant="filled"
                sx={{ fontWeight: 700, fontSize: "0.9rem", px: 1 }}
              />
            </Stack>

            {/* Gráfico de barras (CSS puro) */}
            <Card variant="outlined">
              <CardContent>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Evolución mensual
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    gap: 1.5,
                    alignItems: "flex-end",
                    minHeight: 280,
                    pt: 2,
                    pb: 4,
                    overflowX: "auto",
                  }}
                >
                  {report.months.map((month, mi) => {
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
                          {report.series.map((s, si) => {
                            const height = (s.data[mi] / maxRevenue) * 220;
                            cumulative += height;
                            return (
                              <Box
                                key={s.name}
                                title={`${s.name}: ${formatCurrency(s.data[mi])}`}
                                sx={{
                                  width: "100%",
                                  height: Math.max(height, 1),
                                  backgroundColor: COLORS[si % COLORS.length],
                                  borderTopLeftRadius:
                                    si === report.series.length - 1 ? 4 : 0,
                                  borderTopRightRadius:
                                    si === report.series.length - 1 ? 4 : 0,
                                  transition: "height 0.3s",
                                  "&:hover": { opacity: 0.8 },
                                }}
                              />
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
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                  {report.series.map((s, i) => (
                    <Stack
                      key={s.name}
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
                        {report.series.map((s) => (
                          <TableCell
                            key={s.name}
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
                      {report.months.map((month, mi) => {
                        const total = report.series.reduce(
                          (sum, s) => sum + s.data[mi],
                          0,
                        );
                        return (
                          <TableRow key={month}>
                            <TableCell>{month}</TableCell>
                            {report.series.map((s) => (
                              <TableCell key={s.name} align="right">
                                {formatCurrency(s.data[mi])}
                              </TableCell>
                            ))}
                            <TableCell align="right" sx={{ fontWeight: 700 }}>
                              {formatCurrency(total)}
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

        {!isLoading && !report && (
          <Typography color="text.secondary">
            No hay datos de ingresos para el período seleccionado.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

export default ReporteIngresos;
