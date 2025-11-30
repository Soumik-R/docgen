"""Domain models for the AI Document Authoring Platform.

These dataclasses keep the backend logic decoupled from the eventual
Firestore integration. Serialization helpers allow seamless swapping between
in-memory mocks and future persistence layers.
"""

from __future__ import annotations

from dataclasses import dataclass, field, asdict
from datetime import datetime
from typing import List, Optional, Dict, Any
import uuid


def _utcnow() -> datetime:
    """Helper to create timezone-naive UTC stamps (replace with aware timestamps later)."""
    return datetime.utcnow()


@dataclass(slots=True)
class User:
    """Represents a platform user (human author or collaborator)."""

    id: str
    email: str
    display_name: str
    role: str = "author"
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def touch(self) -> None:
        """Update the modification timestamp."""
        self.updated_at = _utcnow()

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "User":
        return cls(
            id=payload["id"],
            email=payload["email"],
            display_name=payload["display_name"],
            role=payload.get("role", "author"),
            created_at=datetime.fromisoformat(payload["created_at"]),
            updated_at=datetime.fromisoformat(payload["updated_at"]),
        )


@dataclass(slots=True)
class DocumentVersion:
    """A snapshot of a document's content at a point in time."""

    id: str
    document_id: str
    content: str
    summary: Optional[str] = None
    llm_prompt: Optional[str] = None
    created_by: str = ""
    created_at: datetime = field(default_factory=_utcnow)

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "DocumentVersion":
        return cls(
            id=payload["id"],
            document_id=payload["document_id"],
            content=payload["content"],
            summary=payload.get("summary"),
            llm_prompt=payload.get("llm_prompt"),
            created_by=payload.get("created_by", ""),
            created_at=datetime.fromisoformat(payload["created_at"]),
        )


@dataclass(slots=True)
class Document:
    """Represents an authored artifact (docx/pptx) with version history."""

    id: str
    title: str
    owner_id: str
    doc_type: str = "docx"
    tags: List[str] = field(default_factory=list)
    latest_version_id: Optional[str] = None
    status: str = "draft"
    created_at: datetime = field(default_factory=_utcnow)
    updated_at: datetime = field(default_factory=_utcnow)

    def touch(self) -> None:
        self.updated_at = _utcnow()

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["updated_at"] = self.updated_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "Document":
        return cls(
            id=payload["id"],
            title=payload["title"],
            owner_id=payload["owner_id"],
            doc_type=payload.get("doc_type", "docx"),
            tags=list(payload.get("tags", [])),
            latest_version_id=payload.get("latest_version_id"),
            status=payload.get("status", "draft"),
            created_at=datetime.fromisoformat(payload["created_at"]),
            updated_at=datetime.fromisoformat(payload["updated_at"]),
        )


@dataclass(slots=True)
class Session:
    """Represents a logged-in browser session referencing a user."""

    id: str
    user_id: str
    expires_at: datetime
    created_at: datetime = field(default_factory=_utcnow)
    metadata: Dict[str, Any] = field(default_factory=dict)

    def is_expired(self, now: Optional[datetime] = None) -> bool:
        now = now or _utcnow()
        return now >= self.expires_at

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["expires_at"] = self.expires_at.isoformat()
        return data

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "Session":
        return cls(
            id=payload["id"],
            user_id=payload["user_id"],
            expires_at=datetime.fromisoformat(payload["expires_at"]),
            created_at=datetime.fromisoformat(payload["created_at"]),
            metadata=dict(payload.get("metadata", {})),
        )


@dataclass(slots=True)
class GenerationRequest:
    """Tracks interactions with the Gemini API for auditing and retries."""

    id: str = field(default_factory=lambda: uuid.uuid4().hex)
    document_id: Optional[str] = None
    user_id: Optional[str] = None
    prompt: str = ""
    tone: Optional[str] = None
    status: str = "pending"
    response: Optional[str] = None
    created_at: datetime = field(default_factory=_utcnow)
    completed_at: Optional[datetime] = None

    def mark_complete(self, response_text: str) -> None:
        self.status = "completed"
        self.response = response_text
        self.completed_at = _utcnow()

    def mark_failed(self) -> None:
        self.status = "failed"
        self.completed_at = _utcnow()

    def to_dict(self) -> Dict[str, Any]:
        data = asdict(self)
        data["created_at"] = self.created_at.isoformat()
        data["completed_at"] = self.completed_at.isoformat() if self.completed_at else None
        return data

    @classmethod
    def from_dict(cls, payload: Dict[str, Any]) -> "GenerationRequest":
        completed_at = payload.get("completed_at")
        return cls(
            id=payload["id"],
            document_id=payload.get("document_id"),
            user_id=payload.get("user_id"),
            prompt=payload.get("prompt", ""),
            tone=payload.get("tone"),
            status=payload.get("status", "pending"),
            response=payload.get("response"),
            created_at=datetime.fromisoformat(payload["created_at"]),
            completed_at=datetime.fromisoformat(completed_at) if completed_at else None,
        )

