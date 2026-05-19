"""
Microservicio de Notificaciones (ms-notifications) - Flask.

Unico endpoint publico para enviar correos con plantilla generica.
"""

import logging

from flask import Flask, jsonify, request

from app.config import settings
from app.email_service import EmailService
from app.models import validate_email

# ------------------------------------------------------------------
# Logging
# ------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ------------------------------------------------------------------
# App
# ------------------------------------------------------------------
app = Flask(__name__)

email_service = EmailService()


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@app.route("/api/public/notifications/health", methods=["GET"])
def health():
    """Health check."""
    return jsonify({"status": "ok", "service": "ms-notifications"})


@app.route("/api/public/notifications/send-email", methods=["POST"])
def send_email():
    """
    Envia un correo HTML usando la plantilla generica.
    Body (JSON):
      - to:        destinatario
      - subject:   asunto
      - title:     titulo interno (default "Notificacion")
      - user_name: nombre del usuario (default "Usuario")
      - message:   contenido del mensaje
      - footer:    nota al pie (default vacio)
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"success": False, "message": "Cuerpo JSON requerido"}), 400

    to = data.get("to", "").strip()
    subject = data.get("subject", "").strip()
    message = data.get("message", "").strip()

    if not to:
        return jsonify({"success": False, "message": "El campo 'to' es requerido"}), 400
    if not subject:
        return jsonify({"success": False, "message": "El campo 'subject' es requerido"}), 400
    if not message:
        return jsonify({"success": False, "message": "El campo 'message' es requerido"}), 400

    err = validate_email(to)
    if err:
        return jsonify({"success": False, "message": err}), 400

    title = data.get("title", "Notificacion").strip()
    user_name = data.get("user_name", "Usuario").strip()
    footer = data.get("footer", "").strip()

    try:
        email_service.send_generic_html(
            to=to,
            subject=subject,
            title=title,
            user_name=user_name,
            message=message,
            footer=footer,
        )
        return jsonify({"success": True, "message": "Correo enviado correctamente"})
    except RuntimeError as e:
        logger.error("Error enviando correo a %s: %s", to, e)
        return jsonify({"success": False, "message": str(e)}), 502
    except Exception as e:
        logger.exception("Error enviando correo a %s", to)
        return jsonify({"success": False, "message": "Error interno del servidor"}), 500


# ------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------
if __name__ == "__main__":
    app.run(
        host=settings.host,
        port=settings.server_port,
        debug=True,
    )
