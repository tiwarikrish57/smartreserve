# ============================================================
# BusGo — Firebase Admin SDK Initialization
# firebase_admin_setup.py
# ============================================================
# This module initializes the Firebase Admin SDK using a
# service account JSON key file.
#
# SETUP:
#  1. Go to Firebase Console → Project Settings → Service Accounts
#  2. Click "Generate new private key" → save as serviceAccountKey.json
#  3. Place the file in the backend/ folder
#  4. Set SERVICE_ACCOUNT_PATH in your .env file
# ============================================================

import os
import firebase_admin
from firebase_admin import credentials, firestore, auth

_app = None

def get_firebase_app():
    """Returns the initialized Firebase Admin app (singleton)."""
    global _app
    if _app is None:
        service_account_path = os.getenv(
            "SERVICE_ACCOUNT_PATH", "serviceAccountKey.json"
        )
        if not os.path.exists(service_account_path):
            raise FileNotFoundError(
                f"Firebase service account key not found at: {service_account_path}\n"
                "Please download it from Firebase Console → Project Settings → Service Accounts."
            )
        cred = credentials.Certificate(service_account_path)
        _app = firebase_admin.initialize_app(cred)
    return _app


def get_firestore_client():
    """Returns a Firestore client after ensuring Firebase is initialized."""
    get_firebase_app()
    return firestore.client()


def verify_firebase_token(token: str) -> dict:
    """
    Verifies a Firebase ID token (passed from frontend via Authorization header).
    Returns the decoded token dict with uid, email, etc.
    Raises an exception if the token is invalid or expired.
    """
    get_firebase_app()
    return auth.verify_id_token(token)
