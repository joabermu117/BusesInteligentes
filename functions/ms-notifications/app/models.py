from pydantic import BaseModel, EmailStr


class SendEmailRequest(BaseModel):
    """Peticion generica para enviar un correo con la plantilla."""
    to: EmailStr
    subject: str
    title: str = "Notificacion"
    user_name: str = "Usuario"
    message: str
    footer: str = ""


class HealthResponse(BaseModel):
    status: str = "ok"
    service: str = "ms-notifications"


class EmailResponse(BaseModel):
    success: bool
    message: str
