package com.adm.ms_security.Services;

import org.springframework.stereotype.Service;

@Service
/**
 * Generador de plantillas HTML reutilizables para correos transaccionales.
 * Mantiene estilo visual comun y placeholders simples.
 */
public class EmailTemplateService {
  private static final String APP_NAME = "Buses Inteligentes";
  private static final String SUPPORT_EMAIL = "soporte@buses-inteligentes.local";

  public String buildGenericTemplate(String title, String recipientName, String message, String footerNote) {
    String safeTitle = safe(title);
    String safeRecipient = safe(recipientName);
    String safeMessage = safe(message).replace("\n", "<br/>");
    String safeFooter = safe(footerNote);

    String template = """
        <html>
          <body style=\"margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;\">
            <table role=\"presentation\" width=\"100%\" cellspacing=\"0\" cellpadding=\"0\" style=\"padding:24px 12px;\">
              <tr>
                <td align=\"center\">
                  <table role=\"presentation\" width=\"640\" cellspacing=\"0\" cellpadding=\"0\" style=\"max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;\">
                    <tr>
                      <td style=\"background:#0b5cab;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:700;\">{{HEADER}}</td>
                    </tr>
                    <tr>
                      <td style=\"padding:24px;\">
                        <p style=\"margin:0 0 12px;font-size:16px;\">Hola {{RECIPIENT}},</p>
                        <p style=\"margin:0 0 16px;font-size:15px;line-height:1.6;\">{{MESSAGE}}</p>
                        <p style=\"margin:0;font-size:13px;color:#6b7280;\">{{FOOTER}}</p>
                      </td>
                    </tr>
                    <tr>
                      <td style=\"padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;\">
                        {{APP_NAME}} - Soporte: {{SUPPORT_EMAIL}}
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </body>
        </html>
        """;

    return template
        .replace("{{HEADER}}", APP_NAME + " | " + safeTitle)
        .replace("{{RECIPIENT}}", safeRecipient)
        .replace("{{MESSAGE}}", safeMessage)
        .replace("{{FOOTER}}", safeFooter)
        .replace("{{APP_NAME}}", APP_NAME)
        .replace("{{SUPPORT_EMAIL}}", SUPPORT_EMAIL);
  }

  private String safe(String value) {
    return value == null ? "" : value;
  }
}
