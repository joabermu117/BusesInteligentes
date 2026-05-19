from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Server
    server_port: int = 8082
    host: str = "0.0.0.0"

    # SMTP
    mail_enabled: bool = True
    smtp_host: str = "smtp.gmail.com"
    smtp_port: int = 587
    smtp_username: str = ""
    smtp_password: str = ""
    mail_from: str = "notificaciones.buses@gmail.com"
    mail_from_name: str = "Notificaciones Buses"

    # App
    app_name: str = "Buses Inteligentes"
    support_email: str = "soporte@buses-inteligentes.local"
    reset_password_url: str = "http://localhost:5173/reset-password"

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
