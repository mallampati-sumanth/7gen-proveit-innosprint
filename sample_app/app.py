from flask import Flask, jsonify
import os
import sys

app = Flask(__name__)

# Sample app configuration
APP_PORT = int(os.environ.get("PORT", 3000))
REQUIRED_SECRET = os.environ.get("REQUIRED_SECRET", "default_secret_val")

# Failure simulation triggers for testing
FAIL_HEALTH = os.environ.get("FAIL_HEALTH", "false").lower() == "true"
CRASH_ON_BOOT = os.environ.get("CRASH_ON_BOOT", "false").lower() == "true"

if CRASH_ON_BOOT:
    sys.stderr.write("FATAL: Required environment variable MISSING_CONFIG is not set!\n")
    sys.exit(1)


@app.route("/", methods=["GET"])
def index():
    return jsonify({
        "service": "sample_app",
        "status": "running",
        "port": APP_PORT,
        "message": "Hello from ProveIt Target Sample Application!"
    }), 200


@app.route("/health", methods=["GET"])
def health():
    if FAIL_HEALTH:
        return jsonify({"status": "error", "reason": "Simulated health failure"}), 500
    return jsonify({
        "status": "healthy",
        "uptime": "ok",
        "service": "sample_app"
    }), 200


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=APP_PORT)
