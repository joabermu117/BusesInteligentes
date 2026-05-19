"""
Unica plantilla HTML reutilizable para correos transaccionales.
Misma estructura que EmailTemplateService.java del ms-security.
"""

from app.config import settings

APP_NAME = settings.app_name
SUPPORT_EMAIL = settings.support_email


def build_generic_template(
    title: str,
    recipient_name: str,
    message: str,
    footer_note: str,
) -> str:
    """Construye el mismo HTML que EmailTemplateService.buildGenericTemplate() en Java."""
    safe_title = _safe(title)
    safe_recipient = _safe(recipient_name)
    safe_message = _safe(message).replace("\n", "<br/>")
    safe_footer = _safe(footer_note)

    return f"""<html>
  <body style="margin:0;padding:0;background:#f4f6fb;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="640" cellspacing="0" cellpadding="0" style="max-width:640px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
            <tr>
              <td style="background:#0b5cab;color:#ffffff;padding:18px 24px;font-size:20px;font-weight:700;">{APP_NAME} | {safe_title}</td>
            </tr>
            <tr>
              <td style="padding:24px;">
                <p style="margin:0 0 12px;font-size:16px;">Hola {safe_recipient},</p>
                <p style="margin:0 0 16px;font-size:15px;line-height:1.6;">{safe_message}</p>
                <p style="margin:0;font-size:13px;color:#6b7280;">{safe_footer}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:16px 24px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#6b7280;">
                {APP_NAME} - Soporte: {SUPPORT_EMAIL}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>"""


def _safe(value: str | None) -> str:
    return value if value else ""
