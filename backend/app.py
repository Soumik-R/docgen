"""Flask application entrypoint for the AI Document Authoring Platform."""

from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from repositories.store import InMemoryDataStore
from repositories.user_repository import UserRepository
from repositories.document_repository import DocumentRepository
from repositories.version_repository import DocumentVersionRepository
from repositories.session_repository import SessionRepository
from repositories.generation_repository import GenerationRequestRepository
from routes import auth_bp, documents_bp, generation_bp
from services import AuthService, DocumentService, GenerationService
from utils.llm_helper import safe_generate


def create_app() -> Flask:
    """Instantiate and configure the Flask application."""
    load_dotenv()
    app = Flask(__name__)
    CORS(app)  # Enable CORS for all routes

    # --- In-memory persistence layer ----------------------------------- #
    store = InMemoryDataStore()
    repositories = {
        "users": UserRepository(store.users),
        "documents": DocumentRepository(store.documents),
        "versions": DocumentVersionRepository(store.versions),
        "sessions": SessionRepository(store.sessions),
        "generation": GenerationRequestRepository(store.generation_requests),
    }

    # --- Service layer -------------------------------------------------- #
    services = {
        "auth": AuthService(repositories["users"], repositories["sessions"]),
        "documents": DocumentService(repositories["documents"], repositories["versions"]),
        "generation": GenerationService(repositories["generation"], llm_callable=safe_generate),
    }

    app.config["DATA_STORE"] = store
    app.config["REPOSITORIES"] = repositories
    app.config["SERVICES"] = services

    # --- Blueprint registration ---------------------------------------- #
    app.register_blueprint(auth_bp)
    app.register_blueprint(documents_bp)
    app.register_blueprint(generation_bp)

    @app.get("/health")
    def healthcheck():
        """Simple status endpoint for local development."""
        return jsonify(
            {
                "status": "ok",
                "collections": store.snapshot_counts(),
            }
        )
    
    @app.get("/static/<filename>")
    def serve_demo_file(filename):
        """Serve demo document files."""
        from flask import send_from_directory
        import os
        demo_dir = os.path.join(os.path.dirname(__file__), 'generated_documents')
        return send_from_directory(demo_dir, filename, as_attachment=True)

    return app


app = create_app()


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5000, debug=True)
