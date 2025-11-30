"""Gemini API helper utilities.

This lightweight client keeps all LLM-specific concerns in one place so the
Flask app can swap providers or tweak prompt strategies without touching the
rest of the stack.
"""

from __future__ import annotations

import os
from typing import Any, Dict, Optional

import requests

DEFAULT_MODEL = "gemini-pro"
DEFAULT_ENDPOINT = "https://generativelanguage.googleapis.com"


class GeminiClient:
    """Thin wrapper around the Gemini REST API."""

    def __init__(
        self,
        *,
        api_key: Optional[str] = None,
        model: str = DEFAULT_MODEL,
        endpoint: str = DEFAULT_ENDPOINT,
        timeout: int = 30,
    ) -> None:
        self.api_key = api_key or os.getenv("GEMINI_API_KEY")
        if not self.api_key:
            raise RuntimeError("GEMINI_API_KEY is not configured.")
        self.model = model
        self.endpoint = endpoint.rstrip("/")
        self.timeout = timeout

    def _url(self) -> str:
        return f"{self.endpoint}/v1beta/models/{self.model}:generateContent"

    def generate(self, *, prompt: str, tone: Optional[str] = None, context: Optional[str] = None) -> str:
        """Send a prompt to Gemini and return the aggregated text output."""
        payload = self._build_payload(prompt=prompt, tone=tone, context=context)
        response = requests.post(
            self._url(),
            params={"key": self.api_key},
            json=payload,
            timeout=self.timeout,
        )
        response.raise_for_status()
        return self._extract_text(response.json())

    @staticmethod
    def _build_payload(*, prompt: str, tone: Optional[str], context: Optional[str]) -> Dict[str, Any]:
        parts = []
        if tone:
            parts.append({"text": f"Tone: {tone}"})
        if context:
            parts.append({"text": context})
        parts.append({"text": prompt})
        return {"contents": [{"parts": parts}]}

    @staticmethod
    def _extract_text(payload: Dict[str, Any]) -> str:
        candidates = payload.get("candidates") or []
        if not candidates:
            return ""
        parts = candidates[0].get("content", {}).get("parts", [])
        return "\n".join(part.get("text", "") for part in parts if part.get("text"))


def safe_generate(prompt: str, *, tone: Optional[str] = None, context: Optional[str] = None) -> str:
    """Best-effort helper that returns an empty string when Gemini fails."""
    try:
        client = GeminiClient()
        return client.generate(prompt=prompt, tone=tone, context=context)
    except Exception:
        # In prototype mode we swallow errors so the rest of the flow can continue.
        return ""

