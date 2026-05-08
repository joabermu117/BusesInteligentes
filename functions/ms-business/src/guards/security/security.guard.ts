import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SecurityGuard implements CanActivate {
  private readonly logger = new Logger('SecurityGuard');

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { headers, url, method } = request;

    if (!headers.authorization) {
      throw new UnauthorizedException('Token de autorización faltante');
    }

    const token = headers.authorization.replace('Bearer ', '');
    const permissionData = { url, method };

    try {
      const securityUrl = `${process.env.MS_SECURITY}/api/public/security/permissions-validation`;
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