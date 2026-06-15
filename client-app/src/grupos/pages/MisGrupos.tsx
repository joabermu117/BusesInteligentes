import ArrowBackRounded from "@mui/icons-material/ArrowBackRounded";
import GroupsRounded from "@mui/icons-material/GroupsRounded";
import PeopleRounded from "@mui/icons-material/PeopleRounded";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { AUTH_TOKEN_STORAGE_KEY } from "../../config/httpClient";
import { useGroups } from "../stores/useGroupsStore";

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

const MisGrupos = () => {
  const navigate = useNavigate();
  const personId = getUserIdFromToken();
  const { data: allGroups, isLoading } = useGroups();

  // Filtrar solo los grupos donde el usuario es miembro
  const misGrupos = allGroups?.filter((group) =>
    group.groupPersons?.some((gp) => gp.person_id === personId),
  );

  return (
    <Box className="page-enter">
      <Button
        startIcon={<ArrowBackRounded />}
        onClick={() => navigate("/grupos")}
        sx={{ mb: 2 }}
      >
        Volver a grupos públicos
      </Button>

      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" fontWeight={700}>
            Mis grupos
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Grupos a los que perteneces actualmente.
          </Typography>
        </Box>
      </Stack>

      {isLoading ? (
        <Box display="flex" justifyContent="center" py={6}>
          <CircularProgress />
        </Box>
      ) : !misGrupos || misGrupos.length === 0 ? (
        <Alert
          severity="info"
          action={
            <Button size="small" onClick={() => navigate("/grupos")}>
              Explorar grupos
            </Button>
          }
        >
          No perteneces a ningún grupo aún.
        </Alert>
      ) : (
        <Stack spacing={2}>
          {misGrupos.map((group) => {
            const myMembership = group.groupPersons?.find(
              (gp) => gp.person_id === personId,
            );
            return (
              <Card key={group.id} variant="outlined">
                <CardContent>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                    spacing={1}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ flex: 1 }}>
                      {group.image_url && (
                        <Avatar
                          src={group.image_url}
                          alt={group.name}
                          variant="rounded"
                          sx={{ width: 56, height: 56, flexShrink: 0 }}
                        />
                      )}
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                          <Typography variant="h6" fontWeight={700}>
                            {group.name}
                          </Typography>
                          <Chip
                            label={group.is_public ? "Público" : "Privado"}
                            size="small"
                            color={group.is_public ? "success" : "default"}
                            variant="outlined"
                          />
                          {myMembership?.role === "admin" && (
                            <Chip label="Admin" size="small" color="primary" />
                          )}
                        </Stack>
                        {group.description && (
                          <Typography variant="body2" color="text.secondary" mb={1}>
                            {group.description}
                          </Typography>
                        )}
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <PeopleRounded sx={{ fontSize: 16, color: "text.secondary" }} />
                          <Typography variant="caption" color="text.secondary">
                            {group.groupPersons?.length ?? 0} miembros
                          </Typography>
                        </Stack>
                      </Box>
                    </Stack>

                    <Button
                      variant="outlined"
                      size="small"
                      startIcon={<GroupsRounded />}
                      onClick={() => navigate(`/grupos/${group.id}`)}
                    >
                      Ver grupo
                    </Button>
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

export default MisGrupos;