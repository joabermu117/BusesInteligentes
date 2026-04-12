package com.adm.ms_security.Services;

import com.adm.ms_security.Models.Permission;
import com.adm.ms_security.Models.Role;
import com.adm.ms_security.Models.User;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger LOGGER = LoggerFactory.getLogger(EmailService.class);

    @Autowired(required = false)
    private JavaMailSender theMailSender;

    @Autowired
    private EmailTemplateService theTemplateService;

    @Value("${app.mail.enabled:false}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@buses-inteligentes.local}")
    private String from;

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

        sendHtmlMail(user.getEmail(), subject, body);
    }

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

        sendHtmlMail(user.getEmail(), subject, body);
    }

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

        sendHtmlMail(user.getEmail(), subject, body);
    }

    private void sendHtmlMail(String to, String subject, String htmlContent) {
        if (!mailEnabled) {
            LOGGER.info("Email deshabilitado. Se omitio envio a {} con asunto '{}'", to, subject);
            return;
        }

        if (theMailSender == null) {
            LOGGER.warn("JavaMailSender no esta disponible. Se omitio envio a {}", to);
            return;
        }

        try {
            MimeMessage message = theMailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(from);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            theMailSender.send(message);
        } catch (Exception ex) {
            LOGGER.error("No fue posible enviar email a {}: {}", to, ex.getMessage());
        }
    }

    private String safe(String value) {
        return value == null ? "" : value;
    }
}
