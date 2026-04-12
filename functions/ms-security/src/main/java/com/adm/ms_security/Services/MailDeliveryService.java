package com.adm.ms_security.Services;

import com.adm.ms_security.Exceptions.ApiException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class MailDeliveryService {
    private static final Logger LOGGER = LoggerFactory.getLogger(MailDeliveryService.class);

    private final JavaMailSender mailSender;

    @Value("${app.mail.enabled:true}")
    private boolean mailEnabled;

    @Value("${app.mail.from:no-reply@buses-inteligentes.local}")
    private String fromAddress;

    public MailDeliveryService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendPlainTextRequired(String to, String subject, String body) {
        if (!mailEnabled) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MAIL_DISABLED",
                    "El envio de correo no esta habilitado");
        }

        sendPlainTextInternal(to, subject, body, true);
    }

    public void sendHtmlBestEffort(String to, String subject, String htmlContent) {
        if (!mailEnabled) {
            LOGGER.info("Email deshabilitado. Se omitio envio a {} con asunto '{}'", to, subject);
            return;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
        } catch (RuntimeException | jakarta.mail.MessagingException exception) {
            LOGGER.error("No fue posible enviar email HTML a {}", to, exception);
        }
    }

    private void sendPlainTextInternal(String to, String subject, String body, boolean failOnError) {
        try {
            SimpleMailMessage mailMessage = new SimpleMailMessage();
            mailMessage.setFrom(fromAddress);
            mailMessage.setTo(to);
            mailMessage.setSubject(subject);
            mailMessage.setText(body);
            mailSender.send(mailMessage);
        } catch (RuntimeException exception) {
            LOGGER.error("No fue posible enviar correo a {}", to, exception);
            if (failOnError) {
                throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "MAIL_SEND_ERROR",
                        "No fue posible enviar el correo requerido");
            }
        }
    }
}
