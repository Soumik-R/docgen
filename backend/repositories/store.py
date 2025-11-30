"""Lightweight in-memory store used until Firestore integration is ready."""

from typing import Dict

from models import (
    User,
    Document,
    DocumentVersion,
    Session,
    GenerationRequest,
)


class InMemoryDataStore:
    """Container for collection-like dictionaries keyed by entity id."""

    def __init__(self) -> None:
        self.users: Dict[str, User] = {}
        self.documents: Dict[str, Document] = {}
        self.versions: Dict[str, DocumentVersion] = {}
        self.sessions: Dict[str, Session] = {}
        self.generation_requests: Dict[str, GenerationRequest] = {}

    def snapshot_counts(self) -> Dict[str, int]:
        """Return a lightweight view of collection counts for health checks."""
        return {
            "users": len(self.users),
            "documents": len(self.documents),
            "versions": len(self.versions),
            "sessions": len(self.sessions),
            "generation_requests": len(self.generation_requests),
        }

