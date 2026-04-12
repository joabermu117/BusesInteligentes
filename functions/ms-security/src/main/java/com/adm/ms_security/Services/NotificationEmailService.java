package com.adm.ms_security.Services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

@Service
public class NotificationEmailService {
    private static final Logger LOGGER = LoggerFactory.getLogger(NotificationEmailService.class);

    private final JavaMailSender mailSender;

    @Value("${app.email.from:no-reply@busesinteligentes.local}")
    private String fromAddress;

    public NotificationEmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
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
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromAddress);
            mailMessage.setTo(to);
            mailMessage.setSubject(subject);
            mailMessage.setText(body);
            mailSender.send(mailMessage);
        } catch (RuntimeException exception) {
            LOGGER.error("No fue posible enviar correo a {}", to, exception);
            throw exception;
        }
    }
}
