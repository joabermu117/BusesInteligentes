import AdminPanelSettingsRounded from "@mui/icons-material/AdminPanelSettingsRounded";
import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import BlockRounded from "@mui/icons-material/BlockRounded";
import ExitToAppRounded from "@mui/icons-material/ExitToAppRounded";
import PersonRemoveRounded from "@mui/icons-material/PersonRemoveRounded";
import StarRounded from "@mui/icons-material/StarRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import ConfirmActionDialog from "../../permisos/common/components/ConfirmActionDialog";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import { GROUP_ACTION_LABELS } from "../models/group";
import {
  useBlockMember,
  useGroup,
  useGroupMembers,
  useLeaveGroup,
  useMembershipLog,
  usePromoteMember,
  useRemoveMember,
} from "../stores/useGroupsStore";

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

  const currentMember = members?.find((m) => m.person_id === personId);
  const isAdmin = currentMember?.role === "admin";
  const isMember = !!currentMember;

  // Admin del sistema si viene desde /grupos/admin/:id
  const isSystemAdmin = location.pathname.includes("/grupos/admin/");

  // Puede gestionar si es admin del grupo O admin del sistema
  const canManage = isAdmin || isSystemAdmin;

  const filteredMembers = members?.filter((m) =>
    m.person?.name?.toLowerCase().includes(searchMember.toLowerCase()) ||
    m.person_id.toLowerCase().includes(searchMember.toLowerCase()),
  );

  const handleLeave = async () => {
    if (!personId) return;
    try {
      await leaveGroup({ groupId, personId });
      enqueueSnackbar("Abandonaste el grupo exitosamente.", { variant: "success" });
      navigate("/grupos");
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al abandonar el grupo"), { variant: "error" });
    } finally {
      setLeaveDialogOpen(false);
    }
  };

  const handleRemove = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await removeMember({ groupId, personId: targetPersonId, actionBy: personId });
      enqueueSnackbar("Miembro removido del grupo.", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al remover miembro"), { variant: "error" });
    }
  };

  const handlePromote = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await promoteMember({ groupId, personId: targetPersonId, actionBy: personId });
      enqueueSnackbar("Miembro promovido a administrador.", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al promover miembro"), { variant: "error" });
    }
  };

  const handleBlock = async (targetPersonId: string) => {
    if (!personId) return;
    try {
      await blockMember({ groupId, personId: targetPersonId, actionBy: personId });
      enqueueSnackbar("Miembro bloqueado. No podrá volver a unirse.", { variant: "success" });
    } catch (e) {
      enqueueSnackbar(extractErrorMessage(e, "Error al bloquear miembro"), { variant: "error" });
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
      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" mb={3}>
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
            {/* Solo mostrar chip Admin si es admin del grupo, no del sistema */}
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

        {/* Botón abandonar — solo si es miembro y NO es admin del sistema */}
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
          <Typography variant="h6" fontWeight={700} mb={1}>
            Miembros ({members?.length ?? 0})
          </Typography>

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
                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                      <Box>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="body2" fontWeight={600}>
                            {member.person?.name ?? member.person_id}
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
                            <Chip label="Bloqueado" size="small" color="error" />
                          )}
                        </Stack>
                        <Typography variant="caption" color="text.secondary">
                          Se unió:{" "}
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleDateString("es-CO")
                            : "—"}
                        </Typography>
                      </Box>

                      {/* Botones de gestión — canManage incluye admin sistema y admin grupo */}
                      {canManage && member.person_id !== personId && (
                        <Stack direction="row" spacing={0.5}>
                          {member.role !== "admin" && (
                            <Tooltip title="Promover a admin">
                              <IconButton
                                size="small"
                                color="primary"
                                disabled={isPromoting}
                                onClick={() => handlePromote(member.person_id!)}
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

        {/* Panel log — visible para admin grupo y admin sistema */}
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
                        {log.person_id}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {GROUP_ACTION_LABELS[log.action] ?? log.action}
                        {log.action_by_person_id &&
                          ` por ${log.action_by_person_id}`}
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
    </Box>
  );
};

export default GrupoDetalle;