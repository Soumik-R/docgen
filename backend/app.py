"""
Strat
"""

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
    
    # Load environment variables from .env file (contains API keys, config)
    load_dotenv()
    
    # Create Flask application instance
    app = Flask(__name__)
    
    # Enable CORS (Cross-Origin Resource Sharing)
    # This allows the frontend (different port/domain) to make requests to this API
    CORS(app)

    # --- In-memory persistence layer ----------------------------------- #
    # Create the data store - currently uses dictionaries for development
    # Future: Replace with Firestore collections for production
    store = InMemoryDataStore()
    
    repositories = {
        "users": UserRepository(store.users),              # User account management
        "documents": DocumentRepository(store.documents),   # Document CRUD operations
        "versions": DocumentVersionRepository(store.versions),  # Version history tracking
        "sessions": SessionRepository(store.sessions),      # Authentication session management
        "generation": GenerationRequestRepository(store.generation_requests),  # AI request tracking
    }

    # --- Service layer -------------------------------------------------- #
    #Service Layer is starting
    services = {
        # AuthService: Manages user authentication and session lifecycle
        "auth": AuthService(repositories["users"], repositories["sessions"]),
        
        # DocumentService: Handles document creation and version management
        "documents": DocumentService(repositories["documents"], repositories["versions"]),
        
        # Note: Receives llm_callable for AI generation (dependency injection)
        "generation": GenerationService(repositories["generation"], llm_callable=safe_generate),
    }

    # Store in Flask app config
    # Routes access these via current_app.config
    app.config["DATA_STORE"] = store
    app.config["REPOSITORIES"] = repositories
    app.config["SERVICES"] = services

    # --- Blueprint registration ---------------------------------------- #
    # Blueprints organize routes by feature/domain
    # Each blueprint handles a specific area of functionality
    app.register_blueprint(auth_bp)         # /api/auth/* - Authentication endpoints
    app.register_blueprint(documents_bp)    # /api/documents/* - Document management
    app.register_blueprint(generation_bp)   # /api/generation/* - AI generation

    @app.get("/health")
    def healthcheck():
        """
        Health check endpoint for monitoring and debugging.
        
        Returns current status and entity counts from the data store.
        Useful for:
            - Verifying the server is running
            - Checking data state during development
            - Monitoring in production
            
        Returns:
            JSON response with status and collection counts
            
        Example Response:
            {
                "status": "ok",
                "collections": {
                    "users": 5,
                    "documents": 12,
                    "versions": 28,
                    "sessions": 3,
                    "generation_requests": 45
                }
            }
        """
        return jsonify(
            {
                "status": "ok",
                "collections": store.snapshot_counts(),
            }
        )
    
    @app.get("/static/<filename>")
    def serve_demo_file(filename):
        """
        Serve demo document files for download.
        
        This endpoint serves generated document files (like sample Word/PowerPoint files)
        from the generated_documents directory.
        
        Args:
            filename: Name of the file to serve
            
        Returns:
            File download response
            
        Note:
            In production, consider using a CDN or cloud storage for file serving
        """
        from flask import send_from_directory
        import os
        demo_dir = os.path.join(os.path.dirname(__file__), 'generated_documents')
        return send_from_directory(demo_dir, filename, as_attachment=True)

    return app


# Create the application instance
# This app object is used by Flask development server and WSGI servers (Gunicorn, etc.)
app = create_app()


if __name__ == "__main__":
    """
    Development server entry point.
    
    Run this file directly for local development:
        python backend/app.py
        
    The Flask development server will start on http://127.0.0.1:5000
    
    Features:
        - Debug mode enabled (auto-reload on code changes)
        - Detailed error pages
        - Interactive debugger
        
    Note:
        DO NOT use this server in production! Use Gunicorn or similar WSGI server.
    """
    app.run(host="127.0.0.1", port=5000, debug=True)
