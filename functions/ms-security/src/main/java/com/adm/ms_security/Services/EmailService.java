package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
/**
 * Fachada de notificaciones por correo para eventos de negocio.
 * Centraliza mensajes de alta de cuenta, cambios de rol y de permisos.
 */
public class EmailService {
    @Autowired
    private EmailTemplateService theTemplateService;

    @Autowired
    private MailDeliveryService mailDeliveryService;

    // Correo de bienvenida/confirmacion al crear cuenta local.
    public void sendAccountCreatedEmail(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }

        String subject = "Cuenta creada en Buses Inteligentes";
        String body = theTemplateService.buildGenericTemplate(
                "Cuenta creada",
                user.getName(),
                "Tu cuenta fue creada correctamente. Ya puedes ingresar y gestionar tu información en la plataforma.",
                "Si no reconoces este registro, contactanos inmediatamente.");

        mailDeliveryService.sendHtmlBestEffort(user.getEmail(), subject, body);
    }

    // Notifica al usuario cuando se le asigna/remueve un rol.
    public void sendRoleUpdatedEmail(User user, Role role, String action) {
        if (user == null || role == null) {
            return;
        }

        String subject = "Actualización de rol en tu cuenta";
        String body = theTemplateService.buildGenericTemplate(
                "Cambio de rol",
                user.getName(),
                "Tu rol '" + safe(role.getName()) + "' fue " + safe(action) + " en la plataforma.",
                "Este mensaje es informativo sobre cambios de acceso.");

        mailDeliveryService.sendHtmlBestEffort(user.getEmail(), subject, body);
    }

    // Notifica impacto de cambios de permisos sobre el rol del usuario.
    public void sendPermissionUpdatedEmail(User user, Role role, Permission permission, String action) {
        if (user == null || role == null || permission == null) {
            return;
        }

        String permissionLabel = safe(permission.getMethod()) + " " + safe(permission.getUrl());
        String subject = "Actualización de permisos en tu cuenta";
        String body = theTemplateService.buildGenericTemplate(
                "Cambio de permisos",
                user.getName(),
                "Se " + safe(action) + " el permiso '" + permissionLabel + "' del rol '" + safe(role.getName()) + "'.\n"
                        + "Esto puede modificar lo que puedes ver o hacer en el sistema.",
                "Si tienes dudas, consulta con el administrador.");

        mailDeliveryService.sendHtmlBestEffort(user.getEmail(), subject, body);
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
