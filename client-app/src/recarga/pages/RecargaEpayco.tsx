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
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import httpClient, {
  getAuthUserId,
  useUserEmail,
} from "../../config/httpClient";
import PageHeader from "../../permisos/common/components/PageHeader";
import { formatCurrency } from "../../shared/utils/format";
import { useTarjetasByCitizen } from "../../tarjetas/stores/useTarjetasStore";
import { MAX_AMOUNT, MIN_AMOUNT, PRESET_AMOUNTS } from "../models/recarga";

const COMMISSION_RATE = 0.035; // 3.5% comisión ePayco

// Carga el script del SDK de ePayco una sola vez
const loadEpaycoSdk = (): Promise<void> =>
  new Promise((resolve, reject) => {
    if ((window as any).ePayco?.checkout?.open) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.epayco.co/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () =>
      reject(new Error("No se pudo cargar el SDK de ePayco"));
    document.head.appendChild(script);
  });

declare global {
  interface Window {
    ePayco?: {
      checkout: {
        configure: (config: Record<string, any>) => {
          open: (data: Record<string, any>) => void;
        };
        open: (data: Record<string, any>) => void;
      };
    };
  }
}

const RecargaEpayco = () => {
  const navigate = useNavigate();
  const citizenId = getAuthUserId() ?? "";
  const { data: tarjetas } = useTarjetasByCitizen(citizenId);
  const userEmail = useUserEmail();
  const [isPending, setIsPending] = useState(false);
  const sdkLoadingRef = useRef(false);

  // Cargar SDK al montar el componente
  useEffect(() => {
    if (sdkLoadingRef.current) return;
    sdkLoadingRef.current = true;
    loadEpaycoSdk().catch(() => {
      // Si falla, el modal simulado seguirá funcionando
    });
  }, []);

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

  const handleContinue = useCallback(() => {
    if (!selectedCardId || !isAmountValid) return;
    setError(null);
    setIsPending(true);

    const refCorta = Math.random().toString(36).substr(2, 8).toUpperCase();
    const reference = `RCH-${Date.now()}-${refCorta}`;
    const description = `Recarga tarjeta transporte ${refCorta}`;
    const publicKey =
      import.meta.env.VITE_EPAYCO_PUBLIC_KEY || "TU_LLAVE_PUBLICA_AQUI";

    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

    const ePaycoHandler = () => {
      const epayco = (window as any).ePayco;
      if (epayco?.checkout) {
        // Primero configure con la llave pública y test mode
        const handler = epayco.checkout.configure({
          key: publicKey,
          test: true,
        });
        // Luego open con los datos de la transacción
        handler.open({
          amount: amount,
          reference: reference,
          description: description,
          currency: "COP",
          email: userEmail ?? "",
          "external-version": "1",
          name: "Recarga saldo transporte",
          tax: "0",
          tax_base: "0",
          methods: [
            "TARJETA_CREDITO",
            "TARJETA_DEBITO",
            "PSE",
            "NEQUI",
            "BANCOLOMBIA",
          ],
          autoclose: true,
          lang: "es",
        });
        setSuccessRef(reference);
      } else {
        console.log("[ePayco simulado] Abriendo checkout con:", {
          reference,
          amount,
          description,
        });
        setSuccessRef(reference);
      }

      // Aplicar recarga inmediatamente
      if (selectedCardId) {
        httpClient
          .post(`${API_URL}/api/citizen-payment-methods/recharge-balance`, {
            cardId: selectedCardId,
            amount,
            reference,
          })
          .catch((err) =>
            console.error("[Recarga] Error al aplicar recarga:", err),
          );
      }
      setIsPending(false);
    };

    // Si el SDK ya está cargado, abrir checkout directamente
    if ((window as any).ePayco?.checkout?.open) {
      ePaycoHandler();
    } else {
      // Si no, esperar a que se cargue y luego abrir
      loadEpaycoSdk()
        .then(ePaycoHandler)
        .catch(() => {
          // Fallback a simulación
          console.log("[ePayco fallback] SDK no disponible, modo simulación");
          setSuccessRef(reference);
          setIsPending(false);
        });
    }
  }, [selectedCardId, isAmountValid, amount, userEmail]);

  return (
    <Box className="page-enter">
      <PageHeader
        title="Recargar tarjeta"
        subtitle="Selecciona el monto para recargar tu tarjeta."
      />

      {successRef && (
        <Alert severity="success" sx={{ mb: 2 }}>
          ✅ Recarga iniciada. Referencia: <strong>{successRef}</strong>.
          {import.meta.env.VITE_EPAYCO_PUBLIC_KEY &&
          import.meta.env.VITE_EPAYCO_PUBLIC_KEY !== "TU_LLAVE_PUBLICA_AQUI"
            ? " Complete el pago en la ventana modal de ePayco."
            : " Modo simulación: configura VITE_EPAYCO_PUBLIC_KEY en tu .env para probar con ePayco real."}
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
