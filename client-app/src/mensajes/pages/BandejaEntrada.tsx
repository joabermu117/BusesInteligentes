import EmailRounded from "@mui/icons-material/EmailRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import MarkEmailReadRounded from "@mui/icons-material/MarkEmailReadRounded";
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
  Typography,
} from "@mui/material";
import { useSnackbar } from "notistack";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import { extractErrorMessage } from "../../shared/utils/errorHandler";
import type { InboxItem } from "../models/message";
import {
  useInbox,
  useMarkGroupRead,
  useMarkPersonalRead,
  useUnreadCount,
} from "../stores/useMessagesStore";
import { useSocket } from "../hooks/useSocket";
import { useQueryClient } from "@tanstack/react-query";

const PAGE_SIZE = 20;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", {
    dateStyle: "short",
    timeStyle: "short",
  });

const BandejaEntrada = () => {
  const navigate = useNavigate();
  const { enqueueSnackbar } = useSnackbar();
  const qc = useQueryClient();
  const personId = getAuthUserId() ?? "";

  const [tab, setTab] = useState<"all" | "personal" | "group">("all");
  const [unreadOnly, setUnreadOnly] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InboxItem | null>(null);
  const [page, setPage] = useState(1);

  const type = tab === "all" ? undefined : tab;
  const { data: inboxData, isLoading } = useInbox(personId, {
    type,
    unread: unreadOnly,
    page,
    limit: PAGE_SIZE,
  });
  const { data: counts } = useUnreadCount(personId);
  const { mutateAsync: markPersonal } = useMarkPersonalRead();
  const { mutateAsync: markGroup } = useMarkGroupRead();

  const inbox = inboxData?.items ?? [];
  const total = inboxData?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Tiempo real
  useSocket({
    "new-message": () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      enqueueSnackbar("Nuevo mensaje recibido", { variant: "info" });
    },
    "new-group-message": () => {
      qc.invalidateQueries({ queryKey: ["inbox"] });
      qc.invalidateQueries({ queryKey: ["unread-count"] });
      enqueueSnackbar("Nuevo mensaje en grupo", { variant: "info" });
    },
    "mass-alert": (data: any) => {
      enqueueSnackbar(
        data.is_urgent ? `ALERTA URGENTE: ${data.content}` : `Alerta: ${data.content}`,
        { variant: data.is_urgent ? "error" : "warning", persist: data.is_urgent },
      );
      qc.invalidateQueries({ queryKey: ["inbox"] });
    },
  });

  const handleOpen = async (item: InboxItem) => {
    setSelectedItem(item);
    try {
      if (item.inbox_type === "personal" && item.recipient_id && !item.read_at) {
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
    // Navegar a nuevo mensaje con el destinatario pre-seleccionado
    navigate(`/mensajes/nuevo?replyTo=${encodeURIComponent(senderId)}&replyName=${encodeURIComponent(senderName)}`);
    setSelectedItem(null);
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
                          {item.message.message_type === "mass_alert" && (
                            <Chip label="Alerta masiva" size="small" color="warning" />
                          )}
                          <Box flex={1} />
                          <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                            {formatDate(item.message.sent_at)}
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
                    : "Mensaje directo"}
                </Typography>
              </Stack>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="text.secondary">
                De: {selectedItem.message.sender?.name ?? selectedItem.message.sender_person_id}
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block" mb={2}>
                {formatDate(selectedItem.message.sent_at)}
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
