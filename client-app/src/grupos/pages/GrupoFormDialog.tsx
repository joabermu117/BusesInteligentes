import {
  FormControlLabel,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { CreateGroupPayload, Group } from "../models/group";
import { useCreateGroup, useUpdateGroup } from "../stores/useGroupsStore";

type GrupoFormDialogProps = {
  open: boolean;
  group: Group | null;
  onClose: () => void;
};

const emptyForm: CreateGroupPayload = {
  name: "",
  description: "",
  is_public: true,
  created_by_person_id: "",
};

const getUserIdFromToken = (): string => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return "";
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id ?? "";
  } catch {
    return "";
  }
};

const GrupoFormDialog = ({ open, group, onClose }: GrupoFormDialogProps) => {
  const { enqueueSnackbar } = useSnackbar();
  const isEditing = !!group;
  const { mutateAsync: createGroup, isPending: isCreating } = useCreateGroup();
  const { mutateAsync: updateGroup, isPending: isUpdating } = useUpdateGroup();
  const isSubmitting = isCreating || isUpdating;

  const [form, setForm] = useState<CreateGroupPayload>(emptyForm);

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name,
        description: group.description ?? "",
        is_public: group.is_public,
        created_by_person_id: group.created_by_person_id ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        created_by_person_id: getUserIdFromToken(),
      });
    }
  }, [group, open]);

  const handleChange =
    (field: keyof CreateGroupPayload) =>
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: e.target.value }));
    };

  const handleSubmit = async () => {
    try {
      if (isEditing && group) {
        await updateGroup({
          id: group.id,
          payload: {
            name: form.name,
            description: form.description,
            is_public: form.is_public,
          },
        });
        enqueueSnackbar("Grupo actualizado correctamente.", {
          variant: "success",
        });
      } else {
        await createGroup(form);
        enqueueSnackbar("Grupo creado correctamente.", { variant: "success" });
      }
      onClose();
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al guardar el grupo"), {
        variant: "error",
      });
    }
  };

  const isFormValid = form.name.trim().length >= 3;

  return (
    <FormDialog
      open={open}
      title={isEditing ? "Editar grupo" : "Crear nuevo grupo"}
      onClose={onClose}
      onSubmit={handleSubmit}
      submitLabel={isEditing ? "Guardar cambios" : "Crear grupo"}
      submitting={isSubmitting}
      canSubmit={isFormValid && !isSubmitting}
      maxWidth="sm"
    >
      <Stack spacing={2.5}>
        <TextField
          label="Nombre del grupo"
          value={form.name}
          onChange={handleChange("name")}
          required
          fullWidth
          inputProps={{ maxLength: 255 }}
          placeholder="Ej: Ciudadanos zona norte"
        />

        <TextField
          label="Descripción"
          value={form.description}
          onChange={handleChange("description")}
          fullWidth
          multiline
          rows={3}
          inputProps={{ maxLength: 500 }}
          placeholder="Describe el propósito del grupo..."
        />

        <FormControlLabel
          control={
            <Switch
              checked={form.is_public ?? true}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, is_public: e.target.checked }))
              }
            />
          }
          label="Grupo público (visible en el directorio)"
        />
      </Stack>
    </FormDialog>
  );
};

export default GrupoFormDialog;