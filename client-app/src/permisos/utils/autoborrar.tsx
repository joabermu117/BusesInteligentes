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
import rawScopesToDelete from "./scopes-to-delete.json";

const CARGA_RETRASO_MS = 250;

export const EliminacionMasivaButton = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultMessage, setResultMessage] = useState<string | null>(null);

  const { scopes, deleteScope } = useScopeStore();

  const handleEliminar = async () => {
    setIsProcessing(true);
    setResultMessage(null);

    const scopesFromJson = rawScopesToDelete as Array<Omit<Scope, "id">>;
    const existingItems = scopes.filter((scope) => {
      const match = scopesFromJson.find(
        (item) =>
          item.url === scope.url &&
          item.method.toUpperCase() === scope.method.toUpperCase(),
      );
      return !!match;
    });

    let deleted = 0;
    let skipped = 0;
    let failed = 0;

    for (const scope of existingItems) {
      try {
        const result = await deleteScope(scope.id);
        if (result.success) {
          deleted += 1;
        } else {
          failed += 1;
        }
      } catch (error) {
        failed += 1;
        console.error("Error al eliminar scope:", scope, error);
      }

      await new Promise((resolve) => setTimeout(resolve, CARGA_RETRASO_MS));
    }

    setResultMessage(
      `Finalizado. Eliminados: ${deleted}, no encontrados: ${skipped}, fallidos: ${failed}.`,
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
            Eliminando...
          </>
        ) : (
          "Eliminar permisos incorrectos"
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
        aria-labelledby="eliminacion-masiva-dialog-title"
        aria-describedby="eliminacion-masiva-dialog-description"
      >
        <DialogTitle
          id="eliminacion-masiva-dialog-title"
          sx={{ color: "#E52320", fontWeight: 700 }}
        >
          ¿Eliminar permisos incorrectos?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="eliminacion-masiva-dialog-description">
            Esta acción eliminará todos los permisos del archivo de limpieza que
            coincidan con los existentes en el sistema. ¿Deseas continuar?
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
            onClick={handleEliminar}
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
