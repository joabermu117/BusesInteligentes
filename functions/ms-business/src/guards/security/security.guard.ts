import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import axios from 'axios';

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
      });

      if (response.data === true) return true;
      else throw new UnauthorizedException('Permisos insuficientes');
    } catch (error: any) {
      this.logger.error(`Error al validar permisos: ${error.message}`);
      throw new UnauthorizedException('Error al validar permisos');
    }
  }
}
