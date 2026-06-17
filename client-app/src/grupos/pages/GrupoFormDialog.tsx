import {
  Autocomplete,
  Chip,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import FormDialog from "../../permisos/common/components/forms/FormDialog";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { CitizenSearchResult } from "../../mensajes/models/message";
import { useCitizenSearch } from "../../mensajes/stores/useMessagesStore";
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
  image_url: "",
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
  const [memberSearchQ, setMemberSearchQ] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<CitizenSearchResult[]>([]);

  const { data: searchResults, isFetching: isSearching } = useCitizenSearch(
    memberSearchQ,
    getUserIdFromToken(),
  );

  const MIN_INITIAL_MEMBERS = 2;

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name,
        description: group.description ?? "",
        is_public: group.is_public,
        image_url: group.image_url ?? "",
        created_by_person_id: group.created_by_person_id ?? "",
      });
    } else {
      setForm({
        ...emptyForm,
        created_by_person_id: getUserIdFromToken(),
      });
    }
    setSelectedMembers([]);
    setMemberSearchQ("");
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
            image_url: form.image_url,
          },
        });
        enqueueSnackbar("Grupo actualizado correctamente.", {
          variant: "success",
        });
      } else {
        const creatorId = getUserIdFromToken();
        const memberIds = selectedMembers.map((m) => m.person_id);
        await createGroup({
          ...form,
          created_by_person_id: creatorId,
          member_person_ids: memberIds.length > 0 ? memberIds : undefined,
        });
        enqueueSnackbar("Grupo creado correctamente.", { variant: "success" });
      }
      onClose();
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al guardar el grupo"), {
        variant: "error",
      });
    }
  };

  const isFormValid =
    form.name.trim().length >= 3 &&
    (isEditing || selectedMembers.length >= MIN_INITIAL_MEMBERS);

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

        {!isEditing && (
          <Stack spacing={1}>
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography variant="subtitle2">Miembros iniciales</Typography>
              <Typography
                variant="caption"
                color={selectedMembers.length < MIN_INITIAL_MEMBERS ? "error" : "text.secondary"}
              >
                {selectedMembers.length}/{MIN_INITIAL_MEMBERS} mínimo
              </Typography>
            </Stack>
            <Autocomplete
              multiple
              options={searchResults ?? []}
              getOptionLabel={(o) => o.name ?? o.person_id}
              filterOptions={(x) => x}
              inputValue={memberSearchQ}
              onInputChange={(_, v) => setMemberSearchQ(v)}
              value={selectedMembers}
              onChange={(_, v) => setSelectedMembers(v)}
              loading={isSearching}
              noOptionsText={
                memberSearchQ.length < 2
                  ? "Escribe al menos 2 caracteres para buscar"
                  : "Sin resultados"
              }
              isOptionEqualToValue={(a, b) => a.person_id === b.person_id}
              renderTags={(value, getTagProps) =>
                value.map((opt, idx) => (
                  <Chip
                    key={opt.person_id}
                    label={opt.name ?? opt.person_id}
                    size="small"
                    {...getTagProps({ index: idx })}
                  />
                ))
              }
              renderInput={(params) => (
                <TextField
                  {...params}
                  placeholder="Buscar ciudadanos..."
                  helperText={`Debes agregar al menos ${MIN_INITIAL_MEMBERS} miembros además de ti`}
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearching ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        )}

        <TextField
          label="URL de imagen del grupo (opcional)"
          value={form.image_url ?? ""}
          onChange={handleChange("image_url")}
          fullWidth
          inputProps={{ maxLength: 500 }}
          placeholder="https://ejemplo.com/imagen.png"
          helperText="URL pública de la imagen o ícono del grupo"
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