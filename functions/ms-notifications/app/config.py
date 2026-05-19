import os
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # Server
    server_port: int = int(os.getenv("SERVER_PORT", "8082"))
    host: str = os.getenv("HOST", "0.0.0.0")

    # SMTP
    mail_enabled: bool = os.getenv("MAIL_ENABLED", "true").lower() == "true"
    smtp_host: str = os.getenv("SMTP_HOST", "smtp.gmail.com")
    smtp_port: int = int(os.getenv("SMTP_PORT", "587"))
    smtp_username: str = os.getenv("SMTP_USERNAME", "")
    smtp_password: str = os.getenv("SMTP_PASSWORD", "")
    mail_from: str = os.getenv("MAIL_FROM", "notificaciones.buses@gmail.com")
    mail_from_name: str = os.getenv("MAIL_FROM_NAME", "Notificaciones Buses")

    # App
    app_name: str = os.getenv("APP_NAME", "Buses Inteligentes")
    support_email: str = os.getenv("SUPPORT_EMAIL", "soporte@buses-inteligentes.local")


settings = Settings()
