"""Flask blueprint registrations for the AI Document Authoring Platform."""

from .auth import auth_bp
from .documents import documents_bp
from .generation import generation_bp

__all__ = ["auth_bp", "documents_bp", "generation_bp"]

