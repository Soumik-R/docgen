"""GenerationRequest repository."""

from models import GenerationRequest
from .base import BaseRepository


class GenerationRequestRepository(BaseRepository[GenerationRequest]):
    """CRUD operations for GenerationRequest entities."""

    pass

