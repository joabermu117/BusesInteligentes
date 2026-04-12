package com.adm.ms_security.Services;

import org.springframework.stereotype.Service;

@Service
public class NotificationEmailService {
    private final MailDeliveryService mailDeliveryService;
    private final EmailTemplateService emailTemplateService;

    public NotificationEmailService(MailDeliveryService mailDeliveryService, EmailTemplateService emailTemplateService) {
        this.mailDeliveryService = mailDeliveryService;
        this.emailTemplateService = emailTemplateService;
    }

    public void sendOtpCode(String to, String otpCode, long ttlSeconds) {
        String subject = "Codigo de verificacion";
        String recipientName = extractRecipientName(to);
        String message = "Tu codigo de verificacion es:<br/><br/>"
            + "<span style=\"display:inline-block;font-size:26px;letter-spacing:6px;font-weight:800;padding:10px 14px;border-radius:8px;background:#eef3fb;color:#0b5cab;\">"
            + otpCode + "</span><br/><br/>"
            + "Este codigo expira en " + Math.max(1, ttlSeconds / 60) + " minuto(s).";

        String body = emailTemplateService.buildGenericTemplate(
            "Codigo de verificacion",
            recipientName,
            message,
            "Si no solicitaste este acceso, ignora este mensaje.");

        mailDeliveryService.sendHtmlRequired(to, subject, body);
    }

    public void sendPasswordRecoveryLink(String to, String resetLink) {
        String subject = "Recuperacion de contraseña";
        String recipientName = extractRecipientName(to);
        String message = "Recibimos una solicitud para restablecer tu contraseña.<br/><br/>"
            + "<a href=\"" + resetLink
            + "\" style=\"display:inline-block;background:#0b5cab;color:#ffffff;text-decoration:none;padding:10px 16px;border-radius:8px;font-weight:600;\">"
            + "Restablecer contraseña</a><br/><br/>"
            + "Si el boton no funciona, copia y pega este enlace en tu navegador:<br/>" + resetLink
            + "<br/><br/>Si no solicitaste este cambio, puedes ignorar este mensaje.";

        String body = emailTemplateService.buildGenericTemplate(
            "Recuperacion de contraseña",
            recipientName,
            message,
            "Este enlace expirara por seguridad.");

        mailDeliveryService.sendHtmlRequired(to, subject, body);
    }

    private void sendMessage(String to, String subject, String body) {
        mailDeliveryService.sendPlainTextRequired(to, subject, body);
    }

    private String extractRecipientName(String email) {
        if (email == null || email.isBlank()) {
            return "Usuario";
        }

        int atIndex = email.indexOf('@');
        if (atIndex <= 0) {
            return "Usuario";
        }

        return email.substring(0, atIndex);
    }
}
