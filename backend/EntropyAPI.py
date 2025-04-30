from flask import Flask, jsonify, send_from_directory, request
import os
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend
import base64
import hashlib

app = Flask(__name__)
ENTROPY_DIR = os.path.join(os.path.dirname(__file__), 'entropy_keys')
PASSPHRASE = b'my_strong_passphrase_123'
SALT = b'secure_salt'

def derive_key(passphrase: bytes, salt: bytes = SALT):
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase))

@app.route("/api/keys")
def list_keys():
    try:
        files = sorted(os.listdir(ENTROPY_DIR), reverse=True)
        keys = [f for f in files if f.endswith('.bin')]
        return jsonify(keys)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/keys/download/<filename>")
def download_key(filename):
    try:
        return send_from_directory(
            directory=ENTROPY_DIR,
            path=filename,
            as_attachment=True
        )
    except Exception as e:
        return jsonify({"error": str(e)}), 404

@app.route("/api/keys/decrypt", methods=["POST"])
def decrypt_key():
    try:
        data = request.get_json()
        filename = data.get("filename")
        filepath = os.path.join(ENTROPY_DIR, filename)

        if not os.path.isfile(filepath):
            return jsonify({"error": "File not found."}), 404

        with open(filepath, 'rb') as file:
            encrypted_data = file.read()

        key = derive_key(PASSPHRASE)
        cipher = Fernet(key)
        decrypted_data = cipher.decrypt(encrypted_data)

        decrypted_text = decrypted_data.decode(errors='ignore')

        if not (decrypted_text.startswith("-----BEGIN PRIVATE KEY-----") and "-----END PRIVATE KEY-----" in decrypted_text):
            return jsonify({"error": "Invalid PEM structure detected!"}), 400

        sha256_hash = hashlib.sha256(decrypted_data).hexdigest()

        return jsonify({
            "private_key_content": decrypted_text,
            "sha256": sha256_hash
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5001, debug=True)
