import EmailRounded from "@mui/icons-material/EmailRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import SendRounded from "@mui/icons-material/SendRounded";
import WarningAmberRounded from "@mui/icons-material/WarningAmberRounded";
import DoneAllRounded from "@mui/icons-material/DoneAllRounded";
import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getAuthUserId } from "../../config/httpClient";
import type { Message } from "../models/message";
import { useSent, useReadReceipts } from "../stores/useMessagesStore";

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString("es-CO", { dateStyle: "short", timeStyle: "short" });

const ReadReceiptsDialog = ({
  messageId,
  open,
  onClose,
}: {
  messageId: number;
  open: boolean;
  onClose: () => void;
}) => {
  const { data: receipts, isLoading } = useReadReceipts(messageId);
  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Recibos de lectura</DialogTitle>
      <DialogContent dividers>
        {isLoading ? (
          <CircularProgress size={24} />
        ) : !receipts || receipts.length === 0 ? (
          <Typography color="text.secondary">Nadie ha leído este mensaje aún.</Typography>
        ) : (
          <Stack spacing={1}>
            {receipts.map((r) => (
              <Stack key={r.id} direction="row" justifyContent="space-between">
                <Typography variant="body2">{r.person?.name ?? r.person_id}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {r.read_at ? formatDate(r.read_at) : "No leído"}
                </Typography>
              </Stack>
            ))}
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

const MensajesEnviados = () => {
  const navigate = useNavigate();
  const personId = getAuthUserId() ?? "";
  const { data: sent, isLoading } = useSent(personId);
  const [selectedMsg, setSelectedMsg] = useState<Message | null>(null);
  const [receiptsMsg, setReceiptsMsg] = useState<number | null>(null);

  return (
    <Box className="page-enter">
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mensajes enviados
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Mensajes que has enviado.
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<SendRounded />}
          onClick={() => navigate("/mensajes/nuevo")}
          size="small"
        >
          Nuevo mensaje
        </Button>
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !sent || sent.length === 0 ? (
        <Alert severity="info">No has enviado mensajes aún.</Alert>
      ) : (
        <Stack spacing={1.5}>
          {sent.map((msg) => (
            <Card key={msg.id} variant="outlined">
              <CardActionArea onClick={() => setSelectedMsg(msg)}>
                <CardContent>
                  <Stack direction="row" spacing={1} alignItems="flex-start">
                    <Box pt={0.25}>
                      {msg.message_type === "group" ? (
                        <GroupsRounded color="action" />
                      ) : msg.is_urgent ? (
                        <WarningAmberRounded color="error" />
                      ) : (
                        <EmailRounded color="action" />
                      )}
                    </Box>
                    <Box flex={1} minWidth={0}>
                      <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                          {msg.message_type === "personal"
                            ? `Para: ${(msg.recipientPersons ?? []).map((r) => r.recipient?.name ?? r.recipient_person_id).join(", ")}`
                            : msg.message_type === "group"
                            ? `Grupos: ${(msg.recipientGroups ?? []).map((rg) => rg.group?.name ?? rg.group_id).join(", ")}`
                            : "Alerta masiva"}
                        </Typography>
                        {msg.is_urgent && <Chip label="Urgente" size="small" color="error" />}
                        {msg.message_type === "mass_alert" && (
                          <Chip label="Alerta" size="small" color="warning" />
                        )}
                        <Box flex={1} />
                        <Typography variant="caption" color="text.secondary" whiteSpace="nowrap">
                          {formatDate(msg.sent_at)}
                        </Typography>
                      </Stack>
                      <Typography variant="body2" color="text.secondary" noWrap>
                        {msg.content}
                      </Typography>
                    </Box>
                    {msg.message_type === "group" && (
                      <Button
                        size="small"
                        startIcon={<DoneAllRounded />}
                        onClick={(e) => {
                          e.stopPropagation();
                          setReceiptsMsg(msg.id);
                        }}
                        sx={{ flexShrink: 0 }}
                      >
                        Leídos
                      </Button>
                    )}
                  </Stack>
                </CardContent>
              </CardActionArea>
            </Card>
          ))}
        </Stack>
      )}

      {/* Detalle del mensaje */}
      <Dialog open={!!selectedMsg} onClose={() => setSelectedMsg(null)} maxWidth="sm" fullWidth>
        {selectedMsg && (
          <>
            <DialogTitle fontWeight={700}>
              {selectedMsg.message_type === "personal" ? "Mensaje directo" : "Mensaje grupal"}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="caption" color="text.secondary">
                Enviado: {formatDate(selectedMsg.sent_at)}
              </Typography>
              <Divider sx={{ my: 2 }} />
              <Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
                {selectedMsg.content}
              </Typography>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Recibos de lectura */}
      {receiptsMsg && (
        <ReadReceiptsDialog
          messageId={receiptsMsg}
          open={!!receiptsMsg}
          onClose={() => setReceiptsMsg(null)}
        />
      )}
    </Box>
  );
};

export default MensajesEnviados;
