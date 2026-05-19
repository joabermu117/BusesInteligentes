import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Typography,
} from "@mui/material";
import PaymentRounded from "@mui/icons-material/PaymentRounded";
import CheckCircleRounded from "@mui/icons-material/CheckCircleRounded";
import PagoSelector from "./PagoSelector";
import type { Schedule, CitizenPaymentMethod } from "../models/boletos";

interface StepPaymentProps {
  tariff: number;
  paraderoName: string | undefined;
  paymentMethods: CitizenPaymentMethod[];
  isLoading: boolean;
  selectedPaymentId: number | null;
  onChange: (id: number) => void;
}

export const StepPayment = ({
  tariff,
  paraderoName,
  paymentMethods,
  isLoading,
  selectedPaymentId,
  onChange,
}: StepPaymentProps) => (
  <Card>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        <PaymentRounded sx={{ mr: 1, verticalAlign: "middle" }} />
        Método de pago
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tarifa: <strong>$ {tariff.toLocaleString("es-CO")}</strong>
      </Typography>

      {paraderoName && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Abordando en: <strong>{paraderoName}</strong>
        </Typography>
      )}

      <PagoSelector
        paymentMethods={paymentMethods}
        isLoading={isLoading}
        selectedId={selectedPaymentId}
        onChange={onChange}
      />
    </CardContent>
  </Card>
);

interface StepConfirmProps {
  schedule: Schedule | undefined;
  availableSeats: number;
  paraderoName: string | undefined;
  paymentMethodName: string | undefined;
  isPending: boolean;
  onBoard: () => void;
}

export const StepConfirm = ({
  schedule,
  availableSeats,
  paraderoName,
  paymentMethodName,
  isPending,
  onBoard,
}: StepConfirmProps) => (
  <Card>
    <CardContent>
      <Typography variant="h6" fontWeight={600} gutterBottom>
        <CheckCircleRounded
          sx={{ mr: 1, verticalAlign: "middle", color: "success.main" }}
        />
        Confirmar abordaje
      </Typography>

      {schedule && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5, mt: 2 }}>
          <Row label="Bus" value={`${schedule.bus?.plate} - ${schedule.bus?.model}`} />
          <Row label="Capacidad disponible" value={`${availableSeats} asientos`} />
          <Row label="Paradero de abordaje" value={paraderoName ?? "—"} />
          <Row label="Método de pago" value={paymentMethodName ?? "Seleccionado"} />
        </Box>
      )}

      <Button
        variant="contained"
        size="large"
        fullWidth
        sx={{ mt: 3 }}
        onClick={onBoard}
        disabled={isPending}
      >
        {isPending ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "Validar y abordar"
        )}
      </Button>
    </CardContent>
  </Card>
);

const Row = ({ label, value }: { label: string; value: string }) => (
  <Box sx={{ display: "flex", justifyContent: "space-between" }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body2" fontWeight={600}>
      {value}
    </Typography>
  </Box>
);
