import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios, { AxiosError } from 'axios';

// Rutas de servicio-a-servicio que no requieren JWT (invocadas por ms-security)
const SERVICE_ROUTES: ReadonlySet<string> = new Set([
  '/api/citizens/activate',
  '/api/drivers/activate',
]);

const isServiceRoute = (method: string, url: string): boolean => {
  if (method === 'POST' && SERVICE_ROUTES.has(url)) return true;
  if (
    method === 'PATCH' &&
    url.endsWith('/deactivate') &&
    (url.startsWith('/api/citizens/') || url.startsWith('/api/drivers/'))
  )
    return true;
  return false;
};

const WEBHOOK_ROUTES: ReadonlySet<string> = new Set([
  '/api/recharge/epayco/webhook',
]);

const isPublicRoute = (method: string, url: string): boolean => {
  if (method === 'POST' && WEBHOOK_ROUTES.has(url)) return true;
  return false;
};

const isSecurityValidationEndpoint = (url: string): boolean => {
  return url.includes('/api/public/security/permissions-validation');
};

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger('SecurityGuard');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { headers, url, method } = request;

    // Bypass para llamadas internas de ms-security (activate/deactivate)
    if (isServiceRoute(method, url)) {
      return true;
    }

    // No validar permisos contra nosotros mismos (bucle infinito)
    if (isSecurityValidationEndpoint(url)) {
      return true;
    }

    if (!headers.authorization) {
      throw new UnauthorizedException('Token de autorización faltante');
    }

    const token = headers.authorization.replace('Bearer ', '');
    const permissionData = { url, method };

    const msSecurityBaseUrl =
      process.env.MS_SECURITY || 'http://localhost:8081';

    try {
      const securityUrl = `${msSecurityBaseUrl}/api/public/security/permissions-validation`;
      const response = await axios.post(securityUrl, permissionData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 5000,
      });

      if (response.data === true) return true;
      else throw new UnauthorizedException('Permisos insuficientes');
    } catch (error: unknown) {
      // Si ms-security no está disponible (timeout, conexión rechazada),
      // permitir el acceso para no bloquear toda la app.
      if (error instanceof AxiosError && !error.response) {
        this.logger.warn(
          `ms-security no disponible (${error.code}), permitiendo acceso a ${method} ${url}`,
        );
        return true;
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      this.logger.error(`Error al validar permisos: ${(error as Error).message}`);
      if (error instanceof AxiosError && error.response) {
        this.logger.error(
          `Respuesta de ms-security: status=${error.response.status}, data=${JSON.stringify(error.response.data)}`,
        );
      }
      throw new UnauthorizedException('Error al validar permisos');
    }
  }
}
