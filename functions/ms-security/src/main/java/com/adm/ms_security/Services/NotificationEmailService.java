package com.adm.ms_security.Services;

import org.springframework.stereotype.Service;

@Service
public class NotificationEmailService {
    private final MailDeliveryService mailDeliveryService;

    public NotificationEmailService(MailDeliveryService mailDeliveryService) {
        this.mailDeliveryService = mailDeliveryService;
    }

    public void sendOtpCode(String to, String otpCode, long ttlSeconds) {
        String subject = "Codigo de verificacion";
        String body = "Tu codigo de verificacion es: " + otpCode + "\n\n"
                + "Este codigo expira en " + Math.max(1, ttlSeconds / 60) + " minuto(s).";
        sendMessage(to, subject, body);
    }

    public void sendPasswordRecoveryLink(String to, String resetLink) {
        String subject = "Recuperacion de contraseña";
        String body = "Recibimos una solicitud para restablecer tu contraseña.\n\n"
                + "Usa el siguiente enlace para continuar:\n" + resetLink + "\n\n"
                + "Si no solicitaste este cambio, puedes ignorar este mensaje.";
        sendMessage(to, subject, body);
    }

    private void sendMessage(String to, String subject, String body) {
        mailDeliveryService.sendPlainTextRequired(to, subject, body);
    }
}
