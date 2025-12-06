#Session_repo

"""Session repository."""

from models import Session
from .base import BaseRepository


class SessionRepository(BaseRepository[Session]):
    """CRUD operations for Session entities."""

    pass

