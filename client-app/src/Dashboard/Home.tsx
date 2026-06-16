import {
  Box,
  Paper,
  Stack,
  Typography,
  Grid,
  Card,
  CardContent,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import PageHeader from '../permisos/common/components/PageHeader';
import { useRoleStore } from '../permisos/stores/useRoleStore';
import { useScopeStore } from '../permisos/stores/useScopeStore';
import { useUserStore } from '../permisos/stores/useUserStore';
import GroupsRounded from '@mui/icons-material/GroupsRounded';
import GppGoodRounded from '@mui/icons-material/GppGoodRounded';
import DirectionsBusRounded from '@mui/icons-material/DirectionsBusRounded';
import WarningAmberRounded from '@mui/icons-material/WarningAmberRounded';
import httpClient from '../config/httpClient';

const DashboardHome = () => {
  const navigate = useNavigate();
  const { users } = useUserStore();
  const { roles } = useRoleStore();
  const { scopes } = useScopeStore();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const [activeIncidentCount, setActiveIncidentCount] = useState(0);

  useEffect(() => {
    httpClient.get(`${API_URL}/api/incidents`).then(({ data }: { data: Array<{ status: string }> }) => {
      setActiveIncidentCount(data.filter((inc: { status: string }) => inc.status !== 'resolved').length);
    }).catch(() => {});
  }, [API_URL]);

  const quickLinks = [
    {
      label: 'Usuarios',
      value: String(users.length),
      desc: 'Cuentas registradas en el sistema',
      icon: <GroupsRounded sx={{ fontSize: 36 }} />,
      path: '/users/list',
      color: '#0b4f7d',
    },
    {
      label: 'Roles',
      value: String(roles.length),
      desc: 'Perfiles de acceso definidos',
      icon: <GppGoodRounded sx={{ fontSize: 36 }} />,
      path: '/roles/list',
      color: '#4f46e5',
    },
    {
      label: 'Permisos',
      value: String(scopes.length),
      desc: 'Permisos registrados en el sistema',
      icon: <DirectionsBusRounded sx={{ fontSize: 36 }} />,
      path: '/scopes/list',
      color: '#0f8d74',
    },
    {
      label: 'Incidentes activos',
      value: String(activeIncidentCount),
      desc: 'Incidentes no resueltos',
      icon: <WarningAmberRounded sx={{ fontSize: 36 }} />,
      path: '/incidentes',
      color: '#c27b08',
    },
  ];

  return (
    <Box className="page-enter">
      <PageHeader
        title="Dashboard"
        subtitle="Resumen general del sistema de gestion de buses."
      />

      <Grid container spacing={2}>
        {quickLinks.map((link) => (
          <Grid item xs={12} sm={6} md={3} key={link.label}>
            <Card
              sx={{
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                  transform: 'translateY(-3px)',
                  boxShadow: 6,
                },
              }}
              onClick={() => navigate(link.path)}
            >
              <CardContent sx={{ p: 2.5 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 800 }}>
                      {link.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {link.label}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {link.desc}
                    </Typography>
                  </Box>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      display: 'grid',
                      placeItems: 'center',
                      color: link.color,
                      backgroundColor: `${link.color}1A`,
                    }}
                  >
                    {link.icon}
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default DashboardHome;
