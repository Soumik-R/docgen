"""Auth blueprint stubs."""

from __future__ import annotations

from flask import Blueprint, jsonify, request, current_app

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _auth_service():
    return current_app.config["SERVICES"]["auth"]


@auth_bp.get("/users")
def list_users():
    users = [u.to_dict() for u in _auth_service().list_users()]
    return jsonify({"users": users})


@auth_bp.post("/users")
def create_user():
    payload = request.get_json(silent=True) or {}
    email = payload.get("email")
    display_name = payload.get("display_name")
    role = payload.get("role", "author")
    if not email or not display_name:
        return jsonify({"error": "email and display_name are required"}), 400
    user = _auth_service().create_user(email=email, display_name=display_name, role=role)
    return jsonify({"user": user.to_dict()}), 201


@auth_bp.get("/sessions")
def list_sessions():
    sessions = [s.to_dict() for s in _auth_service().list_sessions()]
    return jsonify({"sessions": sessions})


@auth_bp.post("/sessions")
def create_session():
    payload = request.get_json(silent=True) or {}
    user_id = payload.get("user_id")
    ttl_minutes = int(payload.get("ttl_minutes", 60))
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
    session = _auth_service().create_session(user_id=user_id, ttl_minutes=ttl_minutes)
    return jsonify({"session": session.to_dict()}), 201

