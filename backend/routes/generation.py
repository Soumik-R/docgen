"""Generation blueprint stubs."""

from __future__ import annotations

import uuid

from flask import Blueprint, jsonify, request, current_app

from models import GenerationRequest

generation_bp = Blueprint("generation", __name__, url_prefix="/api/generation")


def _generation_service():
    return current_app.config["SERVICES"]["generation"]


@generation_bp.get("/requests")
def list_requests():
    requests = [req.to_dict() for req in _generation_service().list_requests()]
    return jsonify({"requests": requests})


@generation_bp.post("/requests")
def create_request():
    payload = request.get_json(silent=True) or {}
    document_id = payload.get("document_id")
    user_id = payload.get("user_id")
    prompt = payload.get("prompt")
    tone = payload.get("tone")
    if not all([document_id, user_id, prompt]):
        return jsonify({"error": "document_id, user_id, and prompt are required"}), 400
    req = GenerationRequest(
        id=uuid.uuid4().hex,
        document_id=document_id,
        user_id=user_id,
        prompt=prompt,
        tone=tone,
    )
    created = _generation_service().create_request(request=req)
    return jsonify({"request": created.to_dict()}), 201


@generation_bp.post("/requests/<request_id>/complete")
def mark_complete(request_id: str):
    payload = request.get_json(silent=True) or {}
    response_text = payload.get("response", "")
    updated = _generation_service().mark_complete(request_id, response_text)
    if not updated:
        return jsonify({"error": "request not found"}), 404
    return jsonify({"request": updated.to_dict()})

