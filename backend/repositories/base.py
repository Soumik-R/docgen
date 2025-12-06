#Created Base in repository
"""Generic repository helpers for in-memory collections."""

from __future__ import annotations

from typing import Dict, Generic, Iterable, List, Optional, TypeVar

T = TypeVar("T")


class BaseRepository(Generic[T]):
    """Provides CRUD helpers against a dictionary-backed collection."""

    def __init__(self, bucket: Dict[str, T]) -> None:
        self._bucket = bucket

    def list(self) -> List[T]:
        return list(self._bucket.values())

    def get(self, entity_id: str) -> Optional[T]:
        return self._bucket.get(entity_id)

    def save(self, entity: T) -> T:
        # Assumes the entity exposes an `id` attribute.
        self._bucket[getattr(entity, "id")] = entity
        return entity

    def bulk_save(self, entities: Iterable[T]) -> None:
        for entity in entities:
            self.save(entity)

    def delete(self, entity_id: str) -> None:
        self._bucket.pop(entity_id, None)

