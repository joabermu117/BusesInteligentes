"""
Servicio simple de envio de correos.
"""

import logging
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from app.config import settings
from app.templates import build_generic_template

logger = logging.getLogger(__name__)


class EmailService:
    """Servicio central de envio de correos."""

    def __init__(self):
        self._enabled = settings.mail_enabled
        self._host = settings.smtp_host
        self._port = settings.smtp_port
        self._username = settings.smtp_username
        self._password = settings.smtp_password
        self._from_addr = settings.mail_from
        self._from_name = settings.mail_from_name

    def send_generic_html(self, to: str, subject: str, title: str, user_name: str, message: str, footer: str) -> None:
        """Envia un correo HTML con la plantilla generica."""
        if not self._enabled:
            raise RuntimeError("Mail deshabilitado")

        html = build_generic_template(title, user_name, message, footer)

        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = f"{self._from_name} <{self._from_addr}>"
            msg["To"] = to
            msg["Subject"] = subject
            msg.attach(MIMEText(html, "html"))

            self._send(msg)
            logger.info("Correo enviado a %s - asunto: %s", to, subject)
        except Exception:
            logger.exception("Error enviando email a %s", to)
            raise RuntimeError(f"No fue posible enviar el correo a {to}")

    def _send(self, msg: MIMEMultipart) -> None:
        """Envia el mensaje via SMTP."""
        with smtplib.SMTP(self._host, self._port) as server:
            server.starttls()
            server.login(self._username, self._password)
            server.send_message(msg)
