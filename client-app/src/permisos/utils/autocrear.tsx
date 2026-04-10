import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import { useState } from "react";
import type { Scope } from "../models/Scope";
import { useScopeStore } from "../stores/useScopeStore";
import rawScopes from "./scopes.json";

const CARGA_RETRASO_MS = 250;

export const CargaMasivaButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const { createScope, scopes } = useScopeStore();

  const handleCrear = async () => {
    setIsProcessing(true);
    setResultMessage(null);

    const scopesFromJson = rawScopes as Array<Omit<Scope, "id">>;
    const existingKeys = new Set(
      scopes.map((scope) => `${scope.method.toUpperCase()}::${scope.url}`),
    );

    let created = 0;
    let skipped = 0;
    let failed = 0;

    for (const item of scopesFromJson) {
      const itemKey = `${item.method.toUpperCase()}::${item.url}`;

      if (existingKeys.has(itemKey)) {
        skipped += 1;
        continue;
      }

      try {
        await createScope({
          url: item.url,
          method: item.method.toUpperCase(),
          model: item.model,
        });
        existingKeys.add(itemKey);
        created += 1;
      } catch (error) {
        failed += 1;
        console.error("Error al crear scope:", item, error);
      }

      await new Promise((resolve) => setTimeout(resolve, CARGA_RETRASO_MS));
    }

    setResultMessage(
      `Finalizado. Creados: ${created}, omitidos por duplicado: ${skipped}, fallidos: ${failed}.`,
    );

    setIsProcessing(false);
    setIsModalOpen(false);
  };

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        disabled={isProcessing}
        variant="outlined"
        sx={{
          color: "#E52320",
          borderColor: "#E52320",
          fontWeight: 600,
          textTransform: "none",
          "&:hover": {
            backgroundColor: "#fce4e4",
            borderColor: "#C71A17",
          },
          "&:disabled": {
            borderColor: "#ccc",
            color: "#ccc",
          },
        }}
      >
        {isProcessing ? (
          <>
            <CircularProgress size={20} sx={{ mr: 1, color: "#E52320" }} />
            Cargando...
          </>
        ) : (
          "Cargar permisos desde JSON"
        )}
      </Button>

      {resultMessage && (
        <DialogContentText sx={{ mt: 1, color: "#4b5563" }}>
          {resultMessage}
        </DialogContentText>
      )}

      <Dialog
        open={isModalOpen}
        onClose={() => !isProcessing && setIsModalOpen(false)}
        aria-labelledby="carga-masiva-dialog-title"
        aria-describedby="carga-masiva-dialog-description"
      >
        <DialogTitle
          id="carga-masiva-dialog-title"
          sx={{ color: "#E52320", fontWeight: 700 }}
        >
          ¿Cargar permisos desde archivo?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="carga-masiva-dialog-description">
            Esta acción intentará crear todos los permisos del archivo JSON que
            aún no existan. ¿Deseas continuar?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setIsModalOpen(false)}
            disabled={isProcessing}
            sx={{
              color: "#E52320",
              borderColor: "#E52320",
              "&:hover": {
                backgroundColor: "#fce4e4",
                borderColor: "#C71A17",
              },
            }}
            variant="outlined"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleCrear}
            disabled={isProcessing}
            sx={{
              backgroundColor: "#E52320",
              color: "white",
              fontWeight: 600,
              "&:hover": {
                backgroundColor: "#c21e1b",
                boxShadow: "none",
              },
              "&:disabled": {
                backgroundColor: "#ccc",
              },
            }}
            variant="contained"
          >
            {isProcessing ? (
              <CircularProgress size={20} sx={{ color: "white" }} />
            ) : (
              "Confirmar"
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
