import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import { useGroups } from "../../grupos/stores/useGroupsStore";
import { useSendGroupMessage } from "../stores/useMessagesStore";

const EnviarMensajeGrupo = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const personId = getAuthUserId() ?? "";

  const { data: allGroups, isLoading: loadingGroups } = useGroups();
  const myGroups = allGroups?.filter((g) =>
    g.groupPersons?.some((gp) => gp.person_id === personId),
  ) ?? [];

  const [selectedGroupIds, setSelectedGroupIds] = useState<number[]>([]);
  const [content, setContent] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);

  const { mutateAsync: sendMessage, isPending } = useSendGroupMessage();

  const toggleGroup = (id: number) =>
    setSelectedGroupIds((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );

  const handleSend = async () => {
    if (!content.trim() || selectedGroupIds.length === 0) return;
    try {
      await sendMessage({
        content: content.trim(),
        sender_person_id: personId,
        group_ids: selectedGroupIds,
        is_urgent: isUrgent,
      });
      enqueueSnackbar("Mensaje enviado al grupo correctamente", { variant: "success" });
      navigate("/mensajes/bandeja");
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al enviar el mensaje"), { variant: "error" });
    }
  };

  const canSend = content.trim().length > 0 && selectedGroupIds.length > 0 && !isPending;

  return (
    <Box className="page-enter" maxWidth={600} mx="auto">
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/mensajes/bandeja")}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      <Typography variant="h4" fontWeight={700} mb={1}>
        Mensaje a grupo
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Envía un mensaje a uno o varios grupos de los que eres miembro.
      </Typography>

      <Stack spacing={3}>
        {/* Selector de grupos */}
        <Box>
          <Typography variant="subtitle2" mb={1}>
            Selecciona grupos
          </Typography>
          {loadingGroups ? (
            <CircularProgress size={20} />
          ) : myGroups.length === 0 ? (
            <Alert severity="info">No perteneces a ningún grupo.</Alert>
          ) : (
            <Stack>
              {myGroups.map((g) => (
                <FormControlLabel
                  key={g.id}
                  control={
                    <Checkbox
                      checked={selectedGroupIds.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                  }
                  label={
                    <Stack direction="row" spacing={0.5} alignItems="center">
                      <GroupsRounded fontSize="small" color="action" />
                      <Typography variant="body2">{g.name}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        ({g.groupPersons?.length ?? 0} miembros)
                      </Typography>
                    </Stack>
                  }
                />
              ))}
            </Stack>
          )}
        </Box>

        {/* Contenido */}
        <TextField
          label="Mensaje"
          multiline
          rows={5}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          fullWidth
          inputProps={{ maxLength: 2000 }}
          placeholder="Escribe el mensaje para el grupo..."
          helperText={`${content.length}/2000`}
        />

        <FormControlLabel
          control={
            <Switch
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              color="error"
            />
          }
          label={
            <Stack direction="row" spacing={0.5} alignItems="center">
              <WarningAmberRounded fontSize="small" color={isUrgent ? "error" : "disabled"} />
              <Typography variant="body2">Marcar como urgente</Typography>
            </Stack>
          }
        />

        <Button
          variant="contained"
          startIcon={<SendRounded />}
          onClick={handleSend}
          disabled={!canSend}
          size="large"
        >
          {isPending ? "Enviando..." : "Enviar al grupo"}
        </Button>
      </Stack>
    </Box>
  );
};

export default EnviarMensajeGrupo;
