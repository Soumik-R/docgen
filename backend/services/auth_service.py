"""Authentication-related helpers (in-memory implementation)."""

from __future__ import annotations

import uuid
from datetime import datetime, timedelta
from typing import List

from models import Session, User
from repositories.session_repository import SessionRepository
from repositories.user_repository import UserRepository


class AuthService:
    """Coordinates user + session lifecycle without a real database."""

    def __init__(self, user_repo: UserRepository, session_repo: SessionRepository) -> None:
        self._users = user_repo
        self._sessions = session_repo

    # -- User helpers ----------------------------------------------------- #
    def list_users(self) -> List[User]:
        return self._users.list()

    def get_user(self, user_id: str) -> User | None:
        return self._users.get(user_id)

    def create_user(self, *, email: str, display_name: str, role: str = "author") -> User:
        user = User(
            id=uuid.uuid4().hex,
            email=email,
            display_name=display_name,
            role=role,
        )
        return self._users.save(user)

    # -- Session helpers -------------------------------------------------- #
    def list_sessions(self) -> List[Session]:
        return self._sessions.list()

    def create_session(self, *, user_id: str, ttl_minutes: int = 60) -> Session:
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        session = Session(
            id=uuid.uuid4().hex,
            user_id=user_id,
            expires_at=expires_at,
            metadata={"ttl_minutes": ttl_minutes},
        )
        return self._sessions.save(session)

    def invalidate_session(self, session_id: str) -> None:
        self._sessions.delete(session_id)

