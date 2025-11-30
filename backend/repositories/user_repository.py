"""User repository."""

from models import User
from .base import BaseRepository


class UserRepository(BaseRepository[User]):
    """CRUD operations for User entities."""

    pass

