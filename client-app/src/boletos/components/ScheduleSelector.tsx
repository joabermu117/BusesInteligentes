import { Box, Card, CardContent, Chip, CircularProgress, Grid, Typography } from "@mui/material";
import DirectionsBusRounded from "@mui/icons-material/DirectionsBusRounded";
import { countActivePassengers, ScheduleStatus } from "../../shared/utils/boarding";
import type { Schedule } from "../models/boletos";

interface ScheduleSelectorProps {
  schedules: Schedule[] | undefined;
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}

const ScheduleSelector = ({
  schedules,
  isLoading,
  selectedId,
  onSelect,
}: ScheduleSelectorProps) => (
  <Card>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        <DirectionsBusRounded sx={{ mr: 1, verticalAlign: "middle" }} />
        Programaciones activas
      </Typography>

      {isLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {schedules?.map((schedule) => {
            const active = countActivePassengers(schedule.tickets);
            const total = schedule.bus?.totalCapacity ?? 0;
            const isFull = active >= total;
            const isSelected = selectedId === schedule.id;
            return (
              <Grid size={{ xs: 12, sm: 6 }} key={schedule.id}>
                <Card
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    borderColor: isSelected ? "primary.main" : "divider",
                    borderWidth: isSelected ? 2 : 1,
                    bgcolor: isSelected ? "action.selected" : "background.paper",
                    opacity: isFull ? 0.6 : 1,
                    transition: "all 0.2s",
                    "&:hover": { borderColor: "primary.light" },
                  }}
                  onClick={() => {
                    if (!isFull) onSelect(schedule.id);
                  }}
                >
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight={600}>
                      Ruta #{schedule.routeId}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Bus: {schedule.bus?.plate} ({schedule.bus?.model})
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Capacidad: {active}/{total}
                    </Typography>
                    <Box sx={{ mt: 1 }}>
                      {isFull ? (
                        <Chip label="Bus lleno" color="error" size="small" />
                      ) : (
                        <Chip label={`${total - active} disponibles`} color="success" size="small" />
                      )}
                      <Chip
                        label={schedule.status === ScheduleStatus.IN_PROGRESS ? "En curso" : "Programado"}
                        size="small"
                        variant="outlined"
                        sx={{ ml: 1 }}
                      />
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}
    </CardContent>
  </Card>
);

export default ScheduleSelector;
