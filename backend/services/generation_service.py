"""Gemini generation workflow helpers."""

from __future__ import annotations

from typing import Callable, List, Optional

from models import GenerationRequest
from repositories.generation_repository import GenerationRequestRepository


class GenerationService:
    """Tracks Gemini prompt/response lifecycle."""

    def __init__(
        self,
        generation_repo: GenerationRequestRepository,
        llm_callable: Optional[Callable[..., str]] = None,
    ) -> None:
        self._repo = generation_repo
        self._llm_callable = llm_callable

    def list_requests(self) -> List[GenerationRequest]:
        return self._repo.list()

    def create_request(
        self,
        *,
        request: GenerationRequest,
        auto_generate: bool = True,
    ) -> GenerationRequest:
        saved = self._repo.save(request)
        if auto_generate and self._llm_callable:
            try:
                response = self._llm_callable(
                    prompt=saved.prompt,
                    tone=saved.tone,
                    context=f"Document ID: {saved.document_id or 'n/a'}",
                )
                saved.mark_complete(response or "")
            except Exception:
                saved.mark_failed()
            finally:
                saved = self._repo.save(saved)
        return saved

    def mark_complete(self, request_id: str, response: str) -> Optional[GenerationRequest]:
        req = self._repo.get(request_id)
        if not req:
            return None
        req.mark_complete(response)
        return self._repo.save(req)

    def mark_failed(self, request_id: str) -> Optional[GenerationRequest]:
        req = self._repo.get(request_id)
        if not req:
            return None
        req.mark_failed()
        return self._repo.save(req)

