"""Document version repository."""

from models import DocumentVersion
from .base import BaseRepository


class DocumentVersionRepository(BaseRepository[DocumentVersion]):
    """CRUD operations for DocumentVersion entities."""

    pass

