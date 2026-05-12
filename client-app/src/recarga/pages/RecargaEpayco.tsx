import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserEmail } from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";
import { getCitizenId } from "../../shared/utils/boarding";
import { formatCurrency } from "../../shared/utils/format";
import { useTarjetasByCitizen } from "../../tarjetas/stores/useTarjetasStore";
import { MAX_AMOUNT, MIN_AMOUNT, PRESET_AMOUNTS } from "../models/recarga";

const COMMISSION_RATE = 0.035; // 3.5% comisión ePayco

const RecargaEpayco = () => {
  const navigate = useNavigate();
  const citizenId = getCitizenId();
  const { data: tarjetas } = useTarjetasByCitizen(citizenId);
  const userEmail = useUserEmail();
  const [isPending, setIsPending] = useState(false);

  // Todas las tarjetas activas
  const tarjetasActivas = useMemo(
    () => tarjetas?.filter((t) => t.isActive) ?? [],
    [tarjetas],
  );

  const [selectedCardId, setSelectedCardId] = useState<number | null>(null);
  const [presetAmount, setPresetAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [successRef, setSuccessRef] = useState<string | null>(null);

  const selectedTarjeta = tarjetasActivas.find((t) => t.id === selectedCardId);
  const saldoActual = selectedTarjeta?.id
    ? (tarjetas?.find((t) => t.id === selectedTarjeta.id)?.balance ?? 0)
    : 0;

  const amount =
    presetAmount !== null
      ? presetAmount
      : customAmount
        ? parseInt(customAmount)
        : 0;

  const commission = Math.round(amount * COMMISSION_RATE);
  const total = amount + commission;

  const isAmountValid =
    (PRESET_AMOUNTS.includes(amount as any) ||
      (amount >= MIN_AMOUNT && amount <= MAX_AMOUNT)) &&
    amount > 0;

  const handleContinue = () => {
    if (!selectedCardId || !isAmountValid) return;
    setError(null);
    setIsPending(true);

    // Genera referencia local
    const refCorta = Math.random().toString(36).substr(2, 8).toUpperCase();
    const reference = `RCH-${Date.now()}-${refCorta}`;
    const descripcion = `Recarga+tarjeta+transporte+${refCorta}`;
    setSuccessRef(reference);

    // URL de ePayco con email y descripción formateada
    const epaycoCheckoutUrl =
      import.meta.env.VITE_EPAYCO_URL ||
      "https://checkout.epayco.co/checkout.js";
    const epaycoUrl = `${epaycoCheckoutUrl}?key=${
      import.meta.env.VITE_EPAYCO_PUBLIC_KEY || "TEST_KEY"
    }&amount=${amount}&reference=${reference}&description=${descripcion}&currency=COP${
      userEmail ? `&email=${encodeURIComponent(userEmail)}` : ""
    }`;
    window.open(epaycoUrl, "_blank");
    setIsPending(false);
  };

  return (
    <Box className="page-enter">
      <PageHeader
        title="Recargar tarjeta"
        subtitle="Selecciona el monto para recargar tu tarjeta."
      />

      {successRef && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Recarga iniciada. Referencia: {successRef}.
          {import.meta.env.VITE_EPAYCO_URL
            ? " Complete el pago en la ventana de ePayco."
            : " Modo simulación: en un entorno real se abriría la pasarela de pago."}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {tarjetasActivas.length === 0 ? (
        <Alert severity="info">
          No tienes tarjetas vinculadas.{" "}
          <Button
            variant="text"
            onClick={() => navigate("/tarjetas")}
            sx={{ textTransform: "none" }}
          >
            Ir a Mis tarjetas
          </Button>
        </Alert>
      ) : (
        <Stack spacing={3}>
          {/* Selección de tarjeta */}
          <Box>
            <Typography variant="subtitle1" fontWeight={700} gutterBottom>
              Selecciona tu tarjeta
            </Typography>
            <Stack direction="row" spacing={1.5} flexWrap="wrap" useFlexGap>
              {tarjetasActivas.map((t) => (
                <Card
                  key={t.id}
                  variant="outlined"
                  sx={{
                    cursor: "pointer",
                    minWidth: 200,
                    borderColor:
                      selectedCardId === t.id ? "primary.main" : "divider",
                    bgcolor:
                      selectedCardId === t.id
                        ? "primary.50"
                        : "background.paper",
                  }}
                  onClick={() => setSelectedCardId(t.id)}
                >
                  <CardContent sx={{ py: 2, px: 2.5 }}>
                    <Typography fontWeight={700}>
                      {t.paymentMethod?.name ?? "Tarjeta"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {t.cardNumber ? `****${t.cardNumber.slice(-4)}` : "—"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Saldo: {formatCurrency((t as any).balance ?? 0)}
                    </Typography>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          </Box>

          {selectedCardId && (
            <>
              <Divider />

              {/* Montos predefinidos */}
              <Box>
                <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                  Monto a recargar
                </Typography>
                <ToggleButtonGroup
                  value={presetAmount}
                  exclusive
                  onChange={(_, val) => {
                    setPresetAmount(val);
                    setCustomAmount("");
                  }}
                >
                  {PRESET_AMOUNTS.map((monto) => (
                    <ToggleButton key={monto} value={monto}>
                      ${monto.toLocaleString()}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Box>

              {/* Monto personalizado */}
              <TextField
                label="Monto personalizado"
                type="number"
                value={customAmount}
                onChange={(e) => {
                  setCustomAmount(e.target.value);
                  setPresetAmount(null);
                }}
                inputProps={{ min: MIN_AMOUNT, max: MAX_AMOUNT }}
                placeholder={`$${MIN_AMOUNT.toLocaleString()} - $${MAX_AMOUNT.toLocaleString()}`}
                disabled={presetAmount !== null}
                fullWidth
                sx={{ maxWidth: 300 }}
              />

              {/* Resumen con saldos */}
              <Card variant="outlined" sx={{ maxWidth: 400 }}>
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={700} gutterBottom>
                    Resumen
                  </Typography>
                  <Stack spacing={1}>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Saldo actual</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(saldoActual)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">Monto a recargar</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(amount)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2">
                        Comisión ePayco ({(COMMISSION_RATE * 100).toFixed(1)}%)
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {formatCurrency(commission)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body1" fontWeight={700}>
                        Saldo después de recarga
                      </Typography>
                      <Typography
                        variant="body1"
                        fontWeight={700}
                        color="success.main"
                      >
                        {formatCurrency(saldoActual + amount)}
                      </Typography>
                    </Box>
                    <Box display="flex" justifyContent="space-between">
                      <Typography variant="body2" color="text.secondary">
                        Total a pagar (con comisión)
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatCurrency(total)}
                      </Typography>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>

              <Button
                variant="contained"
                size="large"
                onClick={handleContinue}
                disabled={!isAmountValid || isPending}
                sx={{ alignSelf: "flex-start" }}
              >
                {isPending ? "Procesando..." : "Continuar al pago con ePayco"}
              </Button>
            </>
          )}
        </Stack>
      )}
    </Box>
  );
};

export default RecargaEpayco;
