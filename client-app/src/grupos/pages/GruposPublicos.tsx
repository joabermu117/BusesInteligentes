import GroupsRounded from "@mui/icons-material/GroupsRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import SearchRounded from "@mui/icons-material/SearchRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import { useJoinGroup, usePublicGroups } from "../stores/useGroupsStore";

const NOTIFICATIONS_URL =
  import.meta.env.VITE_NOTIFICATIONS_URL || "http://localhost:8082";

const getUserIdFromToken = (): string | null => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    if (!token) return null;
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload?.id ?? null;
  } catch {
    return null;
  }
};

const GruposPublicos = () => {
  const { enqueueSnackbar } = useSnackbar();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const { data: groups, isLoading } = usePublicGroups(search || undefined);
  const { mutateAsync: joinGroup, isPending: isJoining } = useJoinGroup();

  const personId = getUserIdFromToken();

  const isAlreadyMember = (group: any) =>
    group.groupPersons?.some(
      (gp: any) => gp.person_id === personId && !gp.is_blocked,
    );

  const isBlocked = (group: any) =>
    group.groupPersons?.some(
      (gp: any) => gp.person_id === personId && gp.is_blocked === true,
    );

  const handleJoin = async (group: any) => {
    if (!personId) {
      enqueueSnackbar("No se pudo identificar tu usuario.", {
        variant: "error",
      });
      return;
    }
    try {
      await joinGroup({ groupId: group.id, personId });

      enqueueSnackbar("¡Te uniste al grupo exitosamente! Bienvenido.", {
        variant: "success",
      });

      // Notificación de bienvenida por email
      const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
      const payload = token ? JSON.parse(atob(token.split(".")[1])) : null;
      const userEmail = payload?.email;
      const userName = payload?.name ?? "Usuario";

      if (userEmail) {
        fetch(`${NOTIFICATIONS_URL}/api/public/notifications/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            to: userEmail,
            subject: `¡Bienvenido al grupo "${group.name}"!`,
            title: "Bienvenida al grupo",
            user_name: userName,
            message: `Te has unido exitosamente al grupo <strong>${group.name}</strong>.<br/><br/>
              ${group.description ? `<strong>Descripción:</strong> ${group.description}<br/><br/>` : ""}
              Ya puedes participar y recibir mensajes de este grupo.`,
            footer: "Si no solicitaste unirte a este grupo, contáctanos.",
          }),
        }).catch(() => {});
      }
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "No fue posible unirse al grupo"),
        { variant: "error" },
      );
    }
  };

  return (
    <Box className="page-enter">
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
      >
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Grupos públicos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Únete a grupos de interés y recibe información de la comunidad.
          </Typography>
        </Box>
        <Button
          variant="outlined"
          startIcon={<GroupsRounded />}
          onClick={() => navigate("/grupos/mis-grupos")}
        >
          Mis grupos
        </Button>
      </Stack>

      <TextField
        placeholder="Buscar grupos por nombre o descripción..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        size="small"
        sx={{ mb: 3, width: { xs: "100%", md: 400 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchRounded sx={{ color: "text.secondary" }} />
            </InputAdornment>
          ),
        }}
      />

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !groups || groups.length === 0 ? (
        <Alert severity="info">No se encontraron grupos públicos.</Alert>
      ) : (
        <Stack spacing={2}>
          {groups.map((group) => {
            const alreadyMember = isAlreadyMember(group);
            const blocked = isBlocked(group);

            return (
              <Card key={group.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                    spacing={1}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        mb={0.5}
                        flexWrap="wrap"
                        useFlexGap
                      >
                        <Typography variant="h6" fontWeight={700}>
                          {group.name}
                        </Typography>
                        <Chip
                          label="Público"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                        {alreadyMember && (
                          <Chip
                            label="Ya eres miembro"
                            size="small"
                            color="primary"
                          />
                        )}
                        {blocked && (
                          <Chip
                            label="Bloqueado"
                            size="small"
                            color="error"
                          />
                        )}
                      </Stack>
                      {group.description && (
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          mb={1}
                        >
                          {group.description}
                        </Typography>
                      )}
                      <Stack
                        direction="row"
                        spacing={0.5}
                        alignItems="center"
                      >
                        <PeopleRounded
                          sx={{ fontSize: 16, color: "text.secondary" }}
                        />
                        <Typography variant="caption" color="text.secondary">
                          {group.groupPersons?.filter((gp: any) => !gp.is_blocked).length ?? 0} miembros
                        </Typography>
                      </Stack>
                    </Box>

                    <Stack direction="row" spacing={1}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => navigate(`/grupos/${group.id}`)}
                      >
                        Ver detalles
                      </Button>
                      {blocked ? (
                        <Chip
                          label="No puedes unirte"
                          size="small"
                          color="error"
                          variant="outlined"
                          sx={{ alignSelf: "center" }}
                        />
                      ) : !alreadyMember ? (
                        <Button
                          variant="contained"
                          size="small"
                          disabled={isJoining}
                          onClick={() => handleJoin(group)}
                        >
                          Unirse
                        </Button>
                      ) : null}
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </Box>
  );
};

export default GruposPublicos;