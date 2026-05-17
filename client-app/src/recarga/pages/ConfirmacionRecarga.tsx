import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import httpClient, { getAuthUserId } from "../../config/httpClient";
import { useTarjetasByCitizen } from "../../tarjetas/stores/useTarjetasStore";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const ConfirmacionRecarga = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const citizenId = getAuthUserId() ?? "";
  const { refetch: refetchTarjetas } = useTarjetasByCitizen(citizenId);
  const [status, setStatus] = useState<"processing" | "success" | "error">(
    "processing",
  );
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const processRecharge = async () => {
      // ePayco pasa los datos por query params: ref_payco, transactionId, etc.
      const refPayco = searchParams.get("ref_payco");
      const codResponse = searchParams.get("cod_response");

      // También intentamos recuperar datos pendientes guardados antes del checkout
      const pendingRaw = sessionStorage.getItem("pendingRecharge");
      let pendingData: {
        cardId: number;
        reference: string;
        amount: number;
      } | null = null;
      try {
        if (pendingRaw) pendingData = JSON.parse(pendingRaw);
      } catch {
        // ignorar
      }

      // Si el pago fue exitoso (cod_response=1 en ePayco) O es modo simulación
      const paymentSuccessful = codResponse === "1" || !refPayco;

      if (!paymentSuccessful) {
        setStatus("error");
        setErrorMsg("El pago fue rechazado o cancelado.");
        sessionStorage.removeItem("pendingRecharge");
        return;
      }

      if (!pendingData) {
        setStatus("error");
        setErrorMsg("No hay datos de recarga pendiente.");
        return;
      }

      try {
        await httpClient.post(
          `${API_URL}/api/citizen-payment-methods/recharge-balance`,
          {
            cardId: pendingData.cardId,
            amount: pendingData.amount,
            reference: pendingData.reference,
          },
        );

        setStatus("success");
        sessionStorage.removeItem("pendingRecharge");
        // Refrescar datos de tarjetas para ver el nuevo saldo
        refetchTarjetas();
      } catch (err: any) {
        console.error("[Confirmacion] Error:", err);
        setStatus("error");
        setErrorMsg(
          err?.response?.data?.message?.[0] ||
            err?.message ||
            "Error al procesar la recarga.",
        );
      }
    };

    processRecharge();
  }, [searchParams, refetchTarjetas]);

  return (
    <Box
      className="page-enter"
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "60vh",
        textAlign: "center",
        gap: 2,
      }}
    >
      {status === "processing" && (
        <>
          <CircularProgress size={48} />
          <Typography variant="h6">Procesando tu recarga...</Typography>
        </>
      )}

      {status === "success" && (
        <>
          <Typography variant="h4" color="success.main" fontWeight={700}>
            ✅ Recarga exitosa
          </Typography>
          <Typography variant="body1" color="text.secondary">
            El saldo se ha actualizado correctamente. Ya puedes usarlo en tus
            viajes.
          </Typography>
          <Button variant="contained" onClick={() => navigate("/recargar")}>
            Volver a recargas
          </Button>
        </>
      )}

      {status === "error" && (
        <>
          <Typography variant="h4" color="error.main" fontWeight={700}>
            ❌ Error en la recarga
          </Typography>
          <Alert severity="error">
            {errorMsg || "Ocurrió un error al procesar la recarga."}
          </Alert>
          <Button variant="outlined" onClick={() => navigate("/recargar")}>
            Intentar de nuevo
          </Button>
        </>
      )}
    </Box>
  );
};

export default ConfirmacionRecarga;
