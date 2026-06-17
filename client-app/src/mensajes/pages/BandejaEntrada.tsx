import DeleteRounded from "@mui/icons-material/DeleteRounded";
import EmailRounded from "@mui/icons-material/EmailRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import MarkEmailReadRounded from "@mui/icons-material/MarkEmailReadRounded";
import NotificationsActiveRounded from "@mui/icons-material/NotificationsActiveRounded";
import ReplyRounded from "@mui/icons-material/ReplyRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import {
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Pagination,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import { formatMessageDate } from "../../shared/utils/dateFormat";
import { useGroups } from "../../grupos/stores/useGroupsStore";
import type { InboxItem } from "../models/message";
import {
  useDeleteGroupMessage,
  useInbox,
  useMarkGroupRead,
  useMarkPersonalRead,
  useUnreadCount,
} from "../stores/useMessagesStore";
import { useSocket } from "../hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;
const BATCH_WINDOW_MS = 2000;

const BandejaEntrada = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar, closeSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const personId = getAuthUserId() ?? "";

  const [tab, setTab] = useState<"all" | "personal" | "group">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [page, setPage] = useState(1);
  const [hasNewMessages, setHasNewMessages] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const type = tab === "all" ? undefined : tab;
  const { data: inboxData, isLoading } = useInbox(personId, {
    type,
    unread: unreadOnly,
    page,
    limit: PAGE_SIZE,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });
  const { data: counts } = useUnreadCount(personId);
  const { mutateAsync: markPersonal } = useMarkPersonalRead();
  const { mutateAsync: markGroup } = useMarkGroupRead();
  const { mutateAsync: deleteGroupMsg, isPending: isDeletingMsg } = useDeleteGroupMessage();

  // Grupos donde el usuario es admin (para permitir eliminar mensajes inapropiados)
  const { data: allGroups } = useGroups();
  const adminGroupIds = useMemo(() => {
    const ids = new Set<number>();
    for (const g of allGroups ?? []) {
      if (g.groupPersons?.some((gp) => gp.person_id === personId && gp.role === "admin")) {
        ids.add(g.id);
      }
    }
    return ids;
  }, [allGroups, personId]);

  const inbox = inboxData?.items ?? [];
  const total = inboxData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const refreshInbox = () => {
    qc.invalidateQueries({ queryKey: ["inbox"] });
    setHasNewMessages(false);
  };

  // Agrupa notificaciones de "nuevo mensaje" que llegan en una ventana corta
  // para no saturar con una snackbar por cada mensaje.
  const batchRef = useRef<{ count: number; lastSender?: string; timer?: ReturnType<typeof setTimeout> }>(
    { count: 0 },
  );
  const queueMessageNotification = (senderName?: string) => {
    const batch = batchRef.current;
    batch.count += 1;
    batch.lastSender = senderName;
    if (batch.timer) clearTimeout(batch.timer);
    batch.timer = setTimeout(() => {
      enqueueSnackbar(
        batch.count > 1
          ? `${batch.count} nuevos mensajes`
          : `Nuevo mensaje${batch.lastSender ? ` de ${batch.lastSender}` : ""}`,
        { variant: "info" },
      );
      batchRef.current = { count: 0 };
    }, BATCH_WINDOW_MS);
  };

  const handleNewMessage = (data?: { senderName?: string }) => {
    qc.invalidateQueries({ queryKey: ["unread-count"] });
    queueMessageNotification(data?.senderName);
    // No saltar de página si el usuario está navegando resultados anteriores:
    // solo refrescar automáticamente en la página 1.
    if (page === 1) {
      qc.invalidateQueries({ queryKey: ["inbox"] });
    } else {
      setHasNewMessages(true);
    }
  };

  // Tiempo real
  useSocket(
    {
      "new-message": (data: any) => handleNewMessage({ senderName: data?.senderName }),
      "new-group-message": (data: any) =>
        handleNewMessage({ senderName: data?.groupName ?? data?.senderName }),
      "mass-alert": (data: any) => {
        enqueueSnackbar(
          data.is_urgent ? `ALERTA URGENTE: ${data.content}` : `Alerta: ${data.content}`,
          { variant: data.is_urgent ? "error" : "warning", persist: data.is_urgent },
        );
        if (page === 1) qc.invalidateQueries({ queryKey: ["inbox"] });
        else setHasNewMessages(true);
        qc.invalidateQueries({ queryKey: ["unread-count"] });
      },
      "group-message-deleted": () => {
        qc.invalidateQueries({ queryKey: ["inbox"] });
        qc.invalidateQueries({ queryKey: ["unread-count"] });
      },
    },
    (connected) => {
      if (!connected) {
        enqueueSnackbar("Desconectado del servidor de notificaciones", {
          variant: "warning",
          key: "socket-disconnected",
          persist: true,
        });
      } else {
        closeSnackbar("socket-disconnected");
      }
    },
  );

  const handleOpen = async (item: InboxItem) => {
    setSelectedItem(item);
    try {
      if (
        (item.inbox_type === "personal" || item.inbox_type === "mass_alert") &&
        item.recipient_id &&
        !item.read_at
      ) {
        await markPersonal(item.recipient_id);
      } else if (item.inbox_type === "group" && !item.read_at && item.group) {
        await markGroup({ messageId: item.message.id, groupId: item.group.id, personId });
      }
    } catch {
      // silencioso
    }
  };

  const handleTabChange = (_: any, v: "all" | "personal" | "group") => {
    setTab(v);
    setPage(1);
  };

  const handlePageChange = (_: any, v: number) => {
    setPage(v);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleReply = () => {
    if (!selectedItem) return;
    const senderId = selectedItem.message.sender_person_id;
    const senderName = selectedItem.message.sender?.name ?? senderId;
    navigate("/mensajes/nuevo", { state: { replyTo: senderId, replyName: senderName } });
    setSelectedItem(null);
  };

  const handleDeleteGroupMessage = async () => {
    if (!selectedItem?.group) return;
    try {
      await deleteGroupMsg({
        messageId: selectedItem.message.id,
        groupId: selectedItem.group.id,
        actorPersonId: personId,
      });
      enqueueSnackbar("Mensaje eliminado del grupo", { variant: "success" });
      setSelectedItem(null);
    } catch {
      enqueueSnackbar("No se pudo eliminar el mensaje", { variant: "error" });
    }
  };

  return (
    <Box className="page-enter">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Bandeja de entrada
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mensajes directos, grupales y alertas recibidas.
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<GroupsRounded />}
            onClick={() => navigate("/mensajes/grupo")}
            size="small"
          >
            Mensaje a grupo
          </Button>
          <Button
            variant="contained"
            startIcon={<SendRounded />}
            onClick={() => navigate("/mensajes/nuevo")}
            size="small"
          >
            Nuevo mensaje
          </Button>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={1} mb={2} alignItems="center">
        <Tabs value={tab} onChange={handleTabChange}>
          <Tab
            label={
              <Badge badgeContent={counts?.total} color="error" max={99}>
                <span>Todos</span>
              </Badge>
            }
            value="all"
          />
          <Tab
            label={
              <Badge badgeContent={counts?.personal} color="error" max={99}>
                <span>Directos</span>
              </Badge>
            }
            value="personal"
          />
          <Tab
            label={
              <Badge badgeContent={counts?.group} color="error" max={99}>
                <span>Grupos</span>
              </Badge>
            }
            value="group"
          />
        </Tabs>
        <Box flex={1} />
        <TextField
          label="Desde"
          type="date"
          size="small"
          value={dateFrom}
          onChange={(e) => {
            setDateFrom(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <TextField
          label="Hasta"
          type="date"
          size="small"
          value={dateTo}
          onChange={(e) => {
            setDateTo(e.target.value);
            setPage(1);
          }}
          InputLabelProps={{ shrink: true }}
          sx={{ width: 150 }}
        />
        <Chip
          label={unreadOnly ? "Solo no leídos" : "Todos"}
          onClick={() => {
            setUnreadOnly((p) => !p);
            setPage(1);
          }}
          color={unreadOnly ? "primary" : "default"}
          variant={unreadOnly ? "filled" : "outlined"}
          size="small"
        />
      </Stack>

      {hasNewMessages && (
        <Alert
          severity="info"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={refreshInbox}>
              Ver nuevos mensajes
            </Button>
          }
        >
          Hay mensajes nuevos. Tu posición actual no se actualizará automáticamente.
        </Alert>
      )}

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : inbox.length === 0 ? (
        <Alert severity="info">
          {unreadOnly ? "No tienes mensajes sin leer." : "Tu bandeja de entrada está vacía."}
        </Alert>
      ) : (
        <Stack spacing={1.5}>
          {inbox.map((item, idx) => {
            const isUnread = !item.read_at;
            const isUrgent = item.message.is_urgent;
            const isMassAlert = item.inbox_type === "mass_alert";
            return (
              <Card
                key={`${item.inbox_type}-${item.message.id}-${idx}`}
                variant="outlined"
                sx={{
                  borderColor: isUrgent ? "error.main" : isUnread ? "primary.main" : "divider",
                  borderWidth: isUnread ? 2 : 1,
                }}
              >
                <CardActionArea onClick={() => handleOpen(item)}>
                  <CardContent>
                    <Stack direction="row" spacing={1} alignItems="flex-start">
                      <Box pt={0.25}>
                        {item.inbox_type === "group" ? (
                          <GroupsRounded color={isUnread ? "primary" : "disabled"} />
                        ) : isMassAlert ? (
                          <NotificationsActiveRounded color={isUrgent ? "error" : "warning"} />
                        ) : isUrgent ? (
                          <WarningAmberRounded color="error" />
                        ) : (
                          <EmailRounded color={isUnread ? "primary" : "disabled"} />
                        )}
                      </Box>
                      <Box flex={1} minWidth={0}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography variant="body2" fontWeight={isUnread ? 700 : 400} noWrap>
                            {item.message.sender?.name ?? item.message.sender_person_id}
                          </Typography>
                          {isUrgent && <Chip label="Urgente" size="small" color="error" />}
                          {item.inbox_type === "group" && item.group && (
                            <Chip label={item.group.name} size="small" variant="outlined" />
                          )}
                          {isMassAlert && (
                            <Chip label="Alerta masiva" size="small" color="warning" />
                          )}
                          <Box flex={1} />
                          <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                            {formatMessageDate(item.message.sent_at)}
                          </Typography>
                        </Stack>
                        <Typography
                          variant="body2"
                          color={isUnread ? "text.primary" : "text.secondary"}
                          noWrap
                        >
                          {item.message.content_preview ?? item.message.content}
                        </Typography>
                      </Box>
                      {!isUnread && (
                        <MarkEmailReadRounded sx={{ color: "success.main", mt: 0.25, flexShrink: 0 }} />
                      )}
                    </Stack>
                  </CardContent>
                </CardActionArea>
              </Card>
            );
          })}

          {/* Paginación */}
          {totalPages > 1 && (
            <Box display="flex" justifyContent="center" py={2}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={handlePageChange}
                color="primary"
                size="small"
              />
            </Box>
          )}
        </Stack>
      )}

      {/* Diálogo de detalle */}
      <Dialog
        open={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        maxWidth="sm"
        fullWidth
      >
        {selectedItem && (
          <>
            <DialogTitle>
              <Stack direction="row" spacing={1} alignItems="center">
                {selectedItem.message.is_urgent && <WarningAmberRounded color="error" />}
                <Typography variant="h6" fontWeight={700}>
                  {selectedItem.inbox_type === "group"
                    ? `Grupo: ${selectedItem.group?.name}`
                    : selectedItem.inbox_type === "mass_alert"
                    ? "Alerta masiva"
                    : "Mensaje directo"}
                </Typography>
                {selectedItem.inbox_type === "mass_alert" && (
                  <Chip label="Solo lectura" size="small" color="warning" />
                )}
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="text.secondary">
                De: {selectedItem.message.sender?.name ?? selectedItem.message.sender_person_id}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {formatMessageDate(selectedItem.message.sent_at)}
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {selectedItem.message.content}
              </Typography>
              {selectedItem.message.latitude && selectedItem.message.longitude && (
                <Typography variant="caption" color="text.secondary" mt={2} display="block">
                  Ubicación: {selectedItem.message.latitude}, {selectedItem.message.longitude}
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
              {selectedItem.inbox_type === "personal" && !selectedItem.message.is_readonly && (
                <Button
                  variant="contained"
                  startIcon={<ReplyRounded />}
                  onClick={handleReply}
                  size="small"
                >
                  Responder
                </Button>
              )}
              {selectedItem.inbox_type === "group" &&
                selectedItem.group &&
                adminGroupIds.has(selectedItem.group.id) && (
                  <Button
                    variant="outlined"
                    color="error"
                    startIcon={<DeleteRounded />}
                    onClick={handleDeleteGroupMessage}
                    disabled={isDeletingMsg}
                    size="small"
                  >
                    Eliminar
                  </Button>
                )}
              <Button
                variant="outlined"
                onClick={() => setSelectedItem(null)}
                size="small"
              >
                Cerrar
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default BandejaEntrada;
