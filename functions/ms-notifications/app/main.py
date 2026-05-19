"""
Microservicio de Notificaciones (ms-notifications) - FastAPI.

Unico endpoint publico para enviar correos con plantilla generica.
"""

import logging

from fastapi import FastAPI, HTTPException

from app.config import settings
from app.email_service import EmailService
from app.models import EmailResponse, HealthResponse, SendEmailRequest

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
app = FastAPI(
    title="ms-notifications",
    description="Microservicio de notificaciones por correo electronico",
    version="1.0.0",
)

email_service = EmailService()


# ------------------------------------------------------------------
# Endpoints
# ------------------------------------------------------------------

@app.get("/api/public/notifications/health", response_model=HealthResponse)
async def health():
    """Health check."""
    return HealthResponse(status="ok", service="ms-notifications")


@app.post("/api/public/notifications/send-email", response_model=EmailResponse)
async def send_email(req: SendEmailRequest):
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
    try:
        email_service.send_generic_html(
            to=req.to,
            subject=req.subject,
            title=req.title,
            user_name=req.user_name,
            message=req.message,
            footer=req.footer,
        )
        return EmailResponse(success=True, message="Correo enviado correctamente")
    except RuntimeError as e:
        raise HTTPException(status_code=502, detail=str(e))
    except Exception as e:
        logger.exception("Error enviando correo")
        raise HTTPException(status_code=500, detail=str(e))


# ------------------------------------------------------------------
# Entrypoint
# ------------------------------------------------------------------
if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.server_port,
        reload=True,
    )
