import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import ExitToAppRounded from "@mui/icons-material/ExitToAppRounded";
import PersonAddRounded from "@mui/icons-material/PersonAddRounded";
import PersonRemoveRounded from "@mui/icons-material/PersonRemoveRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Autocomplete,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { CitizenSearchResult } from "../../mensajes/models/message";
import { useCitizenSearch } from "../../mensajes/stores/useMessagesStore";
import { GROUP_ACTION_LABELS } from "../models/group";
import {
  useAddMemberByAdmin,
  useBlockMember,
  useGroup,
  useGroupMembers,
  useLeaveGroup,
  useMembershipLog,
  usePromoteMember,
  useRemoveMember,
} from "../stores/useGroupsStore";

const MS_SECURITY_URL =
  import.meta.env.VITE_API_URL_PERMISOS?.replace("/api", "") ||
  "http://localhost:8081";
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

const getUserById = async (
  userId: string,
): Promise<{ name: string; email: string } | null> => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY);
    const res = await fetch(`${MS_SECURITY_URL}/api/users/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
};

const sendEmail = async (
  to: string,
  userName: string,
  subject: string,
  message: string,
) => {
  await fetch(`${NOTIFICATIONS_URL}/api/public/notifications/send-email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      to,
      subject,
      title: subject,
      user_name: userName,
      message,
      footer: "Sistema de Buses Inteligentes",
    }),
  }).catch(() => {});
};

const GrupoDetalle = () => {
  const { id } = useParams<{ id: string }>();
  const groupId = Number(id);
  const navigate = useNavigate();
  const location = useLocation();
  const { enqueueSnackbar } = useSnackbar();
  const personId = getUserIdFromToken();

  const { data: group, isLoading: isLoadingGroup } = useGroup(groupId);
  const { data: members, isLoading: isLoadingMembers } = useGroupMembers(groupId);
  const { data: logs } = useMembershipLog(groupId);

  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup();
  const { mutateAsync: removeMember, isPending: isRemoving } = useRemoveMember();
  const { mutateAsync: promoteMember, isPending: isPromoting } = usePromoteMember();
  const { mutateAsync: blockMember, isPending: isBlocking } = useBlockMember();

  const [leaveDialogOpen, setLeaveDialogOpen] = useState(false);
  const [searchMember, setSearchMember] = useState("");
  const [logUsers, setLogUsers] = useState<Record<string, string>>({});
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [addMemberSearchQ, setAddMemberSearchQ] = useState("");
  const [selectedAddMember, setSelectedAddMember] = useState<CitizenSearchResult | null>(null);

  const { mutateAsync: addMember, isPending: isAddingMember } = useAddMemberByAdmin();
  const { data: citizenSearchResults, isFetching: isSearchingCitizens } =
    useCitizenSearch(addMemberSearchQ);

  const currentMember = members?.find((m) => m.person_id === personId);
  const isAdmin = currentMember?.role === "admin";
  const isMember = !!currentMember;

  const isSystemAdmin = location.pathname.includes("/grupos/admin/");
  const canManage = isAdmin || isSystemAdmin;

  const filteredMembers = members?.filter(
    (m) =>
      (m.person as any)?.name
        ?.toLowerCase()
        .includes(searchMember.toLowerCase()) ||
      m.person_id.toLowerCase().includes(searchMember.toLowerCase()),
  );

  // Resolver nombres del log desde ms-security
  useEffect(() => {
    if (!logs || logs.length === 0) return;

    const ids = new Set<string>();
    logs.forEach((log) => {
      if (log.person_id) ids.add(log.person_id);
      if (log.action_by_person_id) ids.add(log.action_by_person_id);
    });

    const resolveNames = async () => {
      const resolved: Record<string, string> = {};
      for (const id of ids) {
        const user = await getUserById(id);
        if (user?.name) resolved[id] = user.name;
      }
      setLogUsers(resolved);
    };

    resolveNames();
  }, [logs]);

  const handleLeave = async () => {
    if (!personId) return;
    try {
      await leaveGroup({ groupId, personId });
      enqueueSnackbar("Abandonaste el grupo exitosamente.", {
        variant: "success",
      });

      // Notificar a los admins del grupo
      const admins = members?.filter(
        (m) => m.role === "admin" && m.person_id !== personId,
      );
      const leavingUser = await getUserById(personId);
      if (admins && admins.length > 0 && leavingUser) {
        for (const admin of admins) {
          const adminUser = await getUserById(admin.person_id!);
          if (adminUser?.email) {
            await sendEmail(
              adminUser.email,
              adminUser.name,
              `Un miembro abandonó el grupo "${group?.name}"`,
              `El usuario <strong>${leavingUser.name}</strong> ha abandonado voluntariamente el grupo <strong>${group?.name}</strong>.`,
            );
          }
        }
      }

      navigate("/grupos");
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al abandonar el grupo"),
        { variant: "error" },
      );
    } finally {
      setLeaveDialogOpen(false);
    }
  };

  const handleRemove = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await removeMember({
        groupId,
        personId: targetPersonId,
        actionBy: personId,
      });
      enqueueSnackbar("Miembro removido del grupo.", { variant: "success" });

      // Notificar al miembro removido
      const targetUser = await getUserById(targetPersonId);
      if (targetUser?.email) {
        await sendEmail(
          targetUser.email,
          targetUser.name,
          `Has sido removido del grupo "${group?.name}"`,
          `Has sido removido del grupo <strong>${group?.name}</strong> por un administrador.<br/><br/>
          Ya no recibirás mensajes de este grupo.`,
        );
      }
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al remover miembro"),
        { variant: "error" },
      );
    }
  };

  const handlePromote = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await promoteMember({
        groupId,
        personId: targetPersonId,
        actionBy: personId,
      });
      enqueueSnackbar("Miembro promovido a administrador.", {
        variant: "success",
      });

      // Notificar al miembro promovido
      const targetUser = await getUserById(targetPersonId);
      if (targetUser?.email) {
        await sendEmail(
          targetUser.email,
          targetUser.name,
          `Eres administrador del grupo "${group?.name}"`,
          `Has sido promovido a <strong>administrador</strong> del grupo <strong>${group?.name}</strong>.<br/><br/>
          Ahora puedes gestionar los miembros del grupo.`,
        );
      }
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al promover miembro"),
        { variant: "error" },
      );
    }
  };

  const handleBlock = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await blockMember({
        groupId,
        personId: targetPersonId,
        actionBy: personId,
      });
      enqueueSnackbar(
        "Miembro bloqueado y removido. No podrá volver a unirse.",
        { variant: "success" },
      );

      // Notificar al miembro bloqueado
      const targetUser = await getUserById(targetPersonId);
      if (targetUser?.email) {
        await sendEmail(
          targetUser.email,
          targetUser.name,
          `Has sido bloqueado del grupo "${group?.name}"`,
          `Has sido bloqueado del grupo <strong>${group?.name}</strong> por un administrador.<br/><br/>
          No podrás volver a unirte a este grupo.`,
        );
      }
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al bloquear miembro"),
        { variant: "error" },
      );
    }
  };

  const handleAddMember = async () => {
    if (!personId || !selectedAddMember) return;
    try {
      await addMember({
        groupId,
        personId: selectedAddMember.person_id,
        actionBy: personId,
      });
      enqueueSnackbar(
        `${selectedAddMember.name ?? selectedAddMember.person_id} agregado al grupo.`,
        { variant: "success" },
      );
      setAddMemberDialogOpen(false);
      setSelectedAddMember(null);
      setAddMemberSearchQ("");

      // Notificar al nuevo miembro
      const newMember = await getUserById(selectedAddMember.person_id);
      if (newMember?.email) {
        await sendEmail(
          newMember.email,
          newMember.name,
          `Has sido agregado al grupo "${group?.name}"`,
          `Has sido agregado al grupo <strong>${group?.name}</strong> por un administrador.<br/><br/>
          Ahora puedes recibir mensajes del grupo.`,
        );
      }
    } catch (e) {
      enqueueSnackbar(
        extractErrorMessage(e, "Error al agregar miembro"),
        { variant: "error" },
      );
    }
  };

  if (isLoadingGroup) {
    return (
      <Box display="flex" justifyContent="center" py={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!group) {
    return <Alert severity="error">Grupo no encontrado.</Alert>;
  }

  return (
    <Box className="page-enter">
      <ConfirmActionDialog
        open={leaveDialogOpen}
        title="Abandonar grupo"
        description={`¿Estás seguro de que quieres abandonar "${group.name}"? Dejarás de recibir mensajes del grupo.`}
        confirmLabel="Abandonar"
        onCancel={() => setLeaveDialogOpen(false)}
        onConfirm={handleLeave}
        confirmDisabled={isLeaving}
      />

      {/* Botón volver */}
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2 }}
      >
        Volver
      </Button>

      {/* Header */}
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start"
        mb={3}
      >
        <Stack direction="row" spacing={2} alignItems="flex-start">
          {group.image_url && (
            <Avatar
              src={group.image_url}
              alt={group.name}
              variant="rounded"
              sx={{ width: 80, height: 80 }}
            />
          )}
          <Box>
            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
              <Typography variant="h4" fontWeight={700}>
                {group.name}
              </Typography>
              <Chip
                label={group.is_public ? "Público" : "Privado"}
                size="small"
                color={group.is_public ? "success" : "default"}
                variant="outlined"
              />
              {isAdmin && (
                <Chip
                  label="Administrador"
                  size="small"
                  color="primary"
                  icon={<AdminPanelSettingsRounded />}
                />
              )}
              {isSystemAdmin && (
                <Chip
                  label="Admin sistema"
                  size="small"
                  color="warning"
                  icon={<AdminPanelSettingsRounded />}
                />
              )}
            </Stack>
            {group.description && (
              <Typography variant="body2" color="text.secondary">
                {group.description}
              </Typography>
            )}
          </Box>
        </Stack>

        {isMember && !isSystemAdmin && (
          <Button
            variant="outlined"
            color="error"
            startIcon={<ExitToAppRounded />}
            onClick={() => setLeaveDialogOpen(true)}
            size="small"
          >
            Abandonar grupo
          </Button>
        )}
      </Stack>

      <Stack direction={{ xs: "column", md: "row" }} spacing={3}>
        {/* Panel miembros */}
        <Box sx={{ flex: 1.5 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
            <Typography variant="h6" fontWeight={700}>
              Miembros ({members?.length ?? 0})
            </Typography>
            {canManage && (
              <Button
                variant="outlined"
                size="small"
                startIcon={<PersonAddRounded />}
                onClick={() => setAddMemberDialogOpen(true)}
              >
                Agregar
              </Button>
            )}
          </Stack>

          <TextField
            placeholder="Buscar miembro..."
            value={searchMember}
            onChange={(e) => setSearchMember(e.target.value)}
            size="small"
            fullWidth
            sx={{ mb: 2 }}
          />

          {isLoadingMembers ? (
            <CircularProgress size={24} />
          ) : (
            <Stack spacing={1}>
              {filteredMembers?.map((member) => (
                <Card key={member.person_id} variant="outlined">
                  <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            {(member.person as any)?.name ?? member.person_id}
                          </Typography>
                          {member.role === "admin" && (
                            <Chip
                              label="Admin"
                              size="small"
                              color="primary"
                              icon={<StarRounded />}
                            />
                          )}
                          {member.is_blocked && (
                            <Chip
                              label="Bloqueado"
                              size="small"
                              color="error"
                            />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Se unió:{" "}
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString(
                                "es-CO",
                              )
                            : "—"}
                        </Typography>
                      </Box>

                      {canManage && member.person_id !== personId && (
                        <Stack direction="row" spacing={0.5}>
                          {member.role !== "admin" && (
                            <Tooltip title="Promover a admin">
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isPromoting}
                                onClick={() =>
                                  handlePromote(member.person_id!)
                                }
                              >
                                <StarRounded fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                          <Tooltip title="Remover del grupo">
                            <IconButton
                              size="small"
                              color="warning"
                              disabled={isRemoving}
                              onClick={() => handleRemove(member.person_id!)}
                            >
                              <PersonRemoveRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Bloquear usuario">
                            <IconButton
                              size="small"
                              color="error"
                              disabled={isBlocking}
                              onClick={() => handleBlock(member.person_id!)}
                            >
                              <BlockRounded fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        </Stack>
                      )}
                    </Stack>
                  </CardContent>
                </Card>
              ))}
            </Stack>
          )}
        </Box>

        {/* Panel log */}
        {canManage && (
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" fontWeight={700} mb={1}>
              Log de membresía
            </Typography>
            <Stack spacing={1}>
              {!logs || logs.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  No hay registros aún.
                </Typography>
              ) : (
                logs.map((log) => (
                  <Card key={log.id} variant="outlined">
                    <CardContent sx={{ py: 1, "&:last-child": { pb: 1 } }}>
                      <Typography variant="body2" fontWeight={600}>
                        {logUsers[log.person_id] ?? log.person_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {GROUP_ACTION_LABELS[log.action] ?? log.action}
                        {log.action_by_person_id && (
                          ` por ${logUsers[log.action_by_person_id] ?? log.action_by_person_id}`
                        )}
                      </Typography>
                      <br />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(log.action_at).toLocaleString("es-CO")}
                      </Typography>
                    </CardContent>
                  </Card>
                ))
              )}
            </Stack>
          </Box>
        )}
      </Stack>

      {/* Diálogo agregar miembro */}
      <Dialog
        open={addMemberDialogOpen}
        onClose={() => {
          setAddMemberDialogOpen(false);
          setSelectedAddMember(null);
          setAddMemberSearchQ("");
        }}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle fontWeight={700}>Agregar miembro al grupo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Typography variant="body2" color="text.secondary">
              Busca un usuario por nombre o ID para agregarlo al grupo.
            </Typography>
            <Autocomplete
              options={citizenSearchResults ?? []}
              getOptionLabel={(o) => o.name ?? o.person_id}
              filterOptions={(x) => x}
              inputValue={addMemberSearchQ}
              onInputChange={(_, v) => setAddMemberSearchQ(v)}
              value={selectedAddMember}
              onChange={(_, v) => setSelectedAddMember(v)}
              loading={isSearchingCitizens}
              noOptionsText={
                addMemberSearchQ.length < 2
                  ? "Escribe al menos 2 caracteres"
                  : "Sin resultados"
              }
              isOptionEqualToValue={(a, b) => a.person_id === b.person_id}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label="Buscar ciudadano"
                  placeholder="Nombre o ID..."
                  InputProps={{
                    ...params.InputProps,
                    endAdornment: (
                      <>
                        {isSearchingCitizens ? <CircularProgress size={16} /> : null}
                        {params.InputProps.endAdornment}
                      </>
                    ),
                  }}
                />
              )}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button
            onClick={() => {
              setAddMemberDialogOpen(false);
              setSelectedAddMember(null);
              setAddMemberSearchQ("");
            }}
            size="small"
          >
            Cancelar
          </Button>
          <Button
            variant="contained"
            startIcon={<PersonAddRounded />}
            onClick={handleAddMember}
            disabled={!selectedAddMember || isAddingMember}
            size="small"
          >
            {isAddingMember ? "Agregando..." : "Agregar miembro"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GrupoDetalle;