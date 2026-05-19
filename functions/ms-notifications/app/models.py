import re


def validate_email(email: str) -> str | None:
    """Valida formato basico de email, retorna error o None."""
    pattern = r"^[^@\s]+@[^@\s]+\.[^@\s]+$"
    if not re.match(pattern, email):
        return "Formato de email invalido"
    return None
