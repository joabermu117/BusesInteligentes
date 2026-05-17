import {
  Alert,
  Avatar,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../../common/loader";
import type { Profile } from "../../models/Profile";
import type { Role } from "../../models/Role";
import type { User } from "../../models/user";
import { ProfileService } from "../../services/ProfileService";
import { RoleService } from "../../services/RoleService";
import { UserService } from "../../services/UserService";

type SocialProvider = "google" | "github" | "microsoft";

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { userId = "" } = useParams();

  const [isLoading, setIsLoading] = useState(true);
  const [isMutating, setIsMutating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [providerToUnlink, setProviderToUnlink] =
    useState<SocialProvider | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [avatarLoadFailed, setAvatarLoadFailed] = useState(false);

  // Estados para edición de perfil
  const [editMode, setEditMode] = useState(false);
  const [editPhone, setEditPhone] = useState("");
  const [editAddress, setEditAddress] = useState("");
  const [editBirthDate, setEditBirthDate] = useState("");

  useEffect(() => {
    const loadData = async () => {
      if (!userId) {
        setErrorMessage("No se recibió identificador de usuario.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setErrorMessage(null);

      try {
        const [fetchedUser, fetchedProfile, fetchedRoles] = await Promise.all([
          UserService.getUser(userId),
          ProfileService.getProfileByUserId(userId),
          RoleService.getRoles(),
        ]);

        setUser(fetchedUser);
        setProfile(fetchedProfile);
        setRoles(fetchedRoles);
      } catch {
        setErrorMessage("No fue posible cargar el perfil del usuario.");
      } finally {
        setIsLoading(false);
      }
    };

    void loadData();
  }, [userId]);

  useEffect(() => {
    setAvatarLoadFailed(false);
  }, [profile?.photo]);

  const assignedRoles = useMemo(() => {
    if (!user) {
      return [];
    }

    return roles.filter((role) => user.roleIds.includes(role.id));
  }, [roles, user]);

  const fallbackAvatarSrc = useMemo(() => {
    const displayName = user?.name?.trim() || "Usuario";
    const initial = displayName.charAt(0).toUpperCase() || "U";
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='184' height='184' viewBox='0 0 184 184'><rect width='184' height='184' fill='%231976d2'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='white' font-size='84' font-family='Arial, sans-serif'>${initial}</text></svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  }, [user?.name]);

  const avatarSrc = useMemo(() => {
    const photo = profile?.photo?.trim();
    if (!avatarLoadFailed && photo) {
      return photo;
    }

    return fallbackAvatarSrc;
  }, [avatarLoadFailed, fallbackAvatarSrc, profile?.photo]);

  const handleUnlinkProvider = async (provider: SocialProvider) => {
    if (!user) {
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La contraseña debe tener minimo 8 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Las contraseñas no coinciden.");
      return;
    }

    setIsMutating(true);
    setErrorMessage(null);

    try {
      await ProfileService.unlinkProvider(
        user.id,
        provider,
        password,
        confirmPassword,
      );
      const updatedProfile = await ProfileService.getProfileByUserId(user.id);
      setProfile(updatedProfile);
      setProviderToUnlink(null);
      setPassword("");
      setConfirmPassword("");
    } catch {
      setErrorMessage("No fue posible desvincular la cuenta seleccionada.");
    } finally {
      setIsMutating(false);
    }
  };

  // Activa modo edición con los valores actuales del perfil
  const handleStartEdit = () => {
    setEditPhone(profile?.phone ?? "");
    setEditAddress(profile?.address ?? "");
    setEditBirthDate(profile?.birthDate ?? "");
    setErrorMessage(null);
    setSuccessMessage(null);
    setEditMode(true);
  };

  // Guarda los cambios del perfil
  const handleSaveProfile = async () => {
    if (!profile?.id || !user) return;

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsMutating(true);

    try {
      await ProfileService.updateProfile(profile.id, user.id, {
        phone: editPhone.trim() || undefined,
        address: editAddress.trim() || undefined,
        birthDate: editBirthDate || undefined,
      });

      // Refrescar perfil
      const updated = await ProfileService.getProfileByUserId(user.id);
      if (updated) setProfile(updated);

      setSuccessMessage("Perfil actualizado correctamente.");
      setEditMode(false);
    } catch {
      setErrorMessage("No fue posible guardar los cambios.");
    } finally {
      setIsMutating(false);
    }
  };

  // Cancela la edición sin guardar
  const handleCancelEdit = () => {
    setEditMode(false);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  if (isLoading) {
    return <Loader message="Cargando configuracion del perfil..." />;
  }

  if (!user) {
    return (
      <Alert severity="warning">No se encontró el usuario solicitado.</Alert>
    );
  }

  return (
    <Box className="page-enter">
      <Stack spacing={3}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Perfil de usuario
          </Typography>
          <Button variant="outlined" onClick={() => navigate("/users/list")}>
            Volver al listado
          </Button>
        </Stack>

        {errorMessage ? <Alert severity="error">{errorMessage}</Alert> : null}

        <Paper sx={{ p: 3 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2.5}>
            <Avatar
              src={avatarSrc}
              imgProps={{
                referrerPolicy: "no-referrer",
                onError: () => setAvatarLoadFailed(true),
              }}
              sx={{ width: 92, height: 92, bgcolor: "primary.main" }}
            >
              {user.name.charAt(0).toUpperCase()}
            </Avatar>

            <Stack spacing={0.75}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>
              <Typography color="text.secondary">{user.email}</Typography>
              <Typography color="text.secondary">
                Username GitHub: {profile?.githubUsername || "No disponible"}
              </Typography>
            </Stack>
          </Stack>
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Roles del usuario
          </Typography>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            {roles.length === 0 ? (
              <Chip label="Sin roles registrados" variant="outlined" />
            ) : (
              roles.map((role) => {
                const isAssigned = user.roleIds.includes(role.id);
                return (
                  <Chip
                    key={role.id}
                    label={role.name}
                    color={isAssigned ? "primary" : "default"}
                    variant={isAssigned ? "filled" : "outlined"}
                  />
                );
              })
            )}
          </Stack>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1.5 }}>
            Asignados: {assignedRoles.length} de {roles.length}
          </Typography>
        </Paper>

        {/* Información del perfil (editable) */}
        <Paper sx={{ p: 3 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Información del perfil
            </Typography>
            {!editMode && (
              <Button
                size="small"
                variant="outlined"
                onClick={handleStartEdit}
                disabled={isMutating}
              >
                Editar
              </Button>
            )}
          </Stack>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMessage}
            </Alert>
          )}

          {editMode ? (
            <Stack spacing={2}>
              <TextField
                label="Teléfono"
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Dirección"
                value={editAddress}
                onChange={(e) => setEditAddress(e.target.value)}
                fullWidth
                size="small"
              />
              <TextField
                label="Fecha de nacimiento"
                type="date"
                value={editBirthDate}
                onChange={(e) => setEditBirthDate(e.target.value)}
                fullWidth
                size="small"
                InputLabelProps={{ shrink: true }}
              />
              <Stack direction="row" spacing={1} justifyContent="flex-end">
                <Button
                  variant="outlined"
                  onClick={handleCancelEdit}
                  disabled={isMutating}
                >
                  Cancelar
                </Button>
                <Button
                  variant="contained"
                  onClick={handleSaveProfile}
                  disabled={isMutating}
                >
                  {isMutating ? "Guardando..." : "Guardar cambios"}
                </Button>
              </Stack>
            </Stack>
          ) : (
            <Stack spacing={1}>
              <Typography variant="body2">
                <strong>Teléfono:</strong>{" "}
                {profile?.phone || (
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No registrado
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Dirección:</strong>{" "}
                {profile?.address || (
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No registrada
                  </Typography>
                )}
              </Typography>
              <Typography variant="body2">
                <strong>Fecha de nacimiento:</strong>{" "}
                {profile?.birthDate || (
                  <Typography
                    component="span"
                    color="text.secondary"
                    sx={{ fontStyle: "italic" }}
                  >
                    No registrada
                  </Typography>
                )}
              </Typography>
            </Stack>
          )}
        </Paper>

        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>
            Cuentas vinculadas
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Antes de desvincular Google o GitHub debes configurar una contraseña
            local. Esta contraseña se usara para acceder si ya no tienes
            proveedores vinculados.
          </Alert>
          <Stack spacing={1.25}>
            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography>Google</Typography>
              <Button
                size="small"
                color="error"
                variant="outlined"
                disabled={!profile?.googleLinked || isMutating}
                onClick={() => {
                  setProviderToUnlink("google");
                  setErrorMessage(null);
                }}
              >
                Desvincular
              </Button>
            </Stack>

            <Stack
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <Typography>GitHub</Typography>
              <Button
                size="small"
                color="error"
                variant="outlined"
                disabled={!profile?.githubLinked || isMutating}
                onClick={() => {
                  setProviderToUnlink("github");
                  setErrorMessage(null);
                }}
              >
                Desvincular
              </Button>
            </Stack>
          </Stack>
        </Paper>

        <Dialog
          open={providerToUnlink !== null}
          onClose={() => {
            if (isMutating) {
              return;
            }

            setProviderToUnlink(null);
            setPassword("");
            setConfirmPassword("");
          }}
          fullWidth
          maxWidth="sm"
        >
          <DialogTitle>Confirmar desvinculacion</DialogTitle>
          <DialogContent>
            <Stack spacing={2} sx={{ pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Vas a desvincular{" "}
                {providerToUnlink === "google" ? "Google" : "GitHub"}. Para
                evitar que la cuenta quede bloqueada, define tu contraseña local
                con las mismas reglas de registro (minimo 8 caracteres).
              </Typography>

              <TextField
                label="Nueva contraseña"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                fullWidth
                required
              />
              <TextField
                label="Confirmar contraseña"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                fullWidth
                required
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setProviderToUnlink(null);
                setPassword("");
                setConfirmPassword("");
              }}
              disabled={isMutating}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              color="error"
              disabled={isMutating || !providerToUnlink}
              onClick={() => {
                if (!providerToUnlink) {
                  return;
                }

                void handleUnlinkProvider(providerToUnlink);
              }}
            >
              {isMutating ? "Guardando..." : "Guardar y desvincular"}
            </Button>
          </DialogActions>
        </Dialog>
      </Stack>
    </Box>
  );
};

export default UserProfilePage;
