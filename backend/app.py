from __future__ import annotations

from flask import Flask, jsonify
from flask_cors import CORS
from dotenv import load_dotenv

from db.mongo import ping_db
from routes.auth_routes import auth_bp
from routes.session_routes import session_bp
from routes.message_routes import message_bp
from routes.result_routes import result_bp
from routes.prediction_routes import prediction_bp
from routes.chat_routes import chat_bp

load_dotenv()


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(auth_bp, url_prefix="/api")
    app.register_blueprint(session_bp, url_prefix="/api")
    app.register_blueprint(message_bp, url_prefix="/api")
    app.register_blueprint(result_bp, url_prefix="/api")
    app.register_blueprint(prediction_bp, url_prefix="/api")
    app.register_blueprint(chat_bp, url_prefix="/api")

    @app.get("/")
    def root():
        return jsonify({
            "message": "UrgeEase backend is running"
        }), 200

    @app.get("/health")
    def health():
        return jsonify({"status": "ok"}), 200

    @app.get("/db-test")
    def db_test():
        if ping_db():
            return jsonify({"status": "MongoDB connected"}), 200
        return jsonify({"status": "MongoDB not connected"}), 500

    return app


if __name__ == "__main__":
    app = create_app()
    app.run(debug=True, host="0.0.0.0", port=5000)