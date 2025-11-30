"""Document management helpers."""

from __future__ import annotations

import uuid
from typing import List, Optional

from models import Document, DocumentVersion
from repositories.document_repository import DocumentRepository
from repositories.version_repository import DocumentVersionRepository


class DocumentService:
    """High-level document workflows (in-memory)."""

    def __init__(
        self,
        document_repo: DocumentRepository,
        version_repo: DocumentVersionRepository,
    ) -> None:
        self._documents = document_repo
        self._versions = version_repo

    def list_documents(self) -> List[Document]:
        return self._documents.list()

    def create_document(
        self,
        *,
        owner_id: str,
        title: str,
        doc_type: str = "docx",
        tags: Optional[list[str]] = None,
    ) -> Document:
        document = Document(
            id=uuid.uuid4().hex,
            title=title,
            owner_id=owner_id,
            doc_type=doc_type,
            tags=tags or [],
        )
        return self._documents.save(document)

    def add_version(
        self,
        *,
        document_id: str,
        content: str,
        created_by: str,
        summary: Optional[str] = None,
        llm_prompt: Optional[str] = None,
    ) -> DocumentVersion:
        version = DocumentVersion(
            id=uuid.uuid4().hex,
            document_id=document_id,
            content=content,
            summary=summary,
            llm_prompt=llm_prompt,
            created_by=created_by,
        )
        self._versions.save(version)

        document = self._documents.get(document_id)
        if document:
            document.latest_version_id = version.id
            document.touch()
            self._documents.save(document)

        return version

    def list_versions(self, document_id: Optional[str] = None) -> List[DocumentVersion]:
        versions = self._versions.list()
        if document_id:
            versions = [v for v in versions if v.document_id == document_id]
        return versions

