"""Document blueprint stubs."""

from __future__ import annotations

from flask import Blueprint, jsonify, request, current_app

documents_bp = Blueprint("documents", __name__, url_prefix="/api/documents")


def _doc_service():
    return current_app.config["SERVICES"]["documents"]


@documents_bp.get("/")
def list_documents():
    documents = [doc.to_dict() for doc in _doc_service().list_documents()]
    return jsonify({"documents": documents})


@documents_bp.post("/")
def create_document():
    payload = request.get_json(silent=True) or {}
    owner_id = payload.get("owner_id")
    title = payload.get("title")
    doc_type = payload.get("doc_type", "docx")
    tags = payload.get("tags") or []
    if not owner_id or not title:
        return jsonify({"error": "owner_id and title are required"}), 400
    document = _doc_service().create_document(
        owner_id=owner_id,
        title=title,
        doc_type=doc_type,
        tags=tags,
    )
    return jsonify({"document": document.to_dict()}), 201


@documents_bp.get("/<document_id>/versions")
def list_versions(document_id: str):
    versions = [v.to_dict() for v in _doc_service().list_versions(document_id)]
    return jsonify({"versions": versions})


@documents_bp.post("/<document_id>/versions")
def add_version(document_id: str):
    payload = request.get_json(silent=True) or {}
    content = payload.get("content", "")
    created_by = payload.get("created_by")
    summary = payload.get("summary")
    llm_prompt = payload.get("llm_prompt")
    if not created_by:
        return jsonify({"error": "created_by is required"}), 400
    version = _doc_service().add_version(
        document_id=document_id,
        content=content,
        created_by=created_by,
        summary=summary,
        llm_prompt=llm_prompt,
    )
    return jsonify({"version": version.to_dict()}), 201

