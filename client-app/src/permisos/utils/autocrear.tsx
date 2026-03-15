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
import type { ScopeCategory } from "../models/ScopeCategory";
import { useCategoryStore } from "../stores/useScopeCategoryStore";
import { useScopeStore } from "../stores/useScopeStore";
import rawCategories from "./scope_categories.json";
import rawScopes from "./scopes.json";

const CARGA_RETRASO_MS = 1000;

export const CargaMasivaButton = ({
  tipo,
}: {
  tipo: "categorias" | "scopes";
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const { createCategory } = useCategoryStore();
  const { createScope } = useScopeStore();

  const handleCrear = async () => {
    setIsProcessing(true);

    if (tipo === "categorias") {
      const categories = rawCategories as ScopeCategory[];

      for (const item of categories) {
        try {
          await createCategory(item);
        } catch (error) {
          console.error("Error al crear categoría:", item, error);
        }
        await new Promise((resolve) => setTimeout(resolve, CARGA_RETRASO_MS));
      }
    }

    if (tipo === "scopes") {
      const scopes = rawScopes as Array<
        Omit<Scope, "key" | "deprecated" | "categoryName">
      >;

      for (const item of scopes) {
        try {
          await createScope(item);
        } catch (error) {
          console.error("Error al crear scope:", item, error);
        }
        await new Promise((resolve) => setTimeout(resolve, CARGA_RETRASO_MS));
      }
    }

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
          `Cargar ${tipo === "categorias" ? "categorías" : "scopes"} desde JSON`
        )}
      </Button>

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
          ¿Cargar {tipo === "categorias" ? "categorías" : "scopes"} desde
          archivo?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="carga-masiva-dialog-description">
            Esta acción intentará crear todos los {tipo} desde el archivo
            cargado. ¿Deseas continuar?
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
