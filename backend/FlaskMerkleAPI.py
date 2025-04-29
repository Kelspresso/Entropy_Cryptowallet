# Flask backend for hybrid PoSp-PoW Merkle verification
from flask import Flask, jsonify, request
from flask_cors import CORS
import hashlib
import os
import base64
from datetime import datetime

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.backends import default_backend

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
import threading
import time

app = Flask(__name__)
CORS(app)

# --- Config ---
ENCRYPTED_KEY_PATH = 'C:/Users/Kelse/Documents/Illinois_Tech/Courses/entropy_test/key.bin'
PASSPHRASE = b'my_strong_passphrase_123'
SALT = b'secure_salt'

# --- In-memory blockchain state ---
entropy_keys = []
merkle_tree, merkle_root = [], ''

# --- Merkle & Cryptography Helpers ---
def sha256(data: str) -> str:
    return hashlib.sha256(data.encode()).hexdigest()

def derive_key(passphrase: bytes, salt: bytes) -> bytes:
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=salt,
        iterations=100000,
        backend=default_backend()
    )
    return base64.urlsafe_b64encode(kdf.derive(passphrase))

def load_encrypted_key():
    try:
        with open(ENCRYPTED_KEY_PATH, 'rb') as f:
            encrypted_data = f.read()

        key = derive_key(PASSPHRASE, SALT)
        cipher = Fernet(key)
        decrypted = cipher.decrypt(encrypted_data)
        return decrypted.decode()
    except Exception as e:
        print("Decryption failed:", e)
        return None

def build_merkle_tree(hashes):
    if not hashes:
        return [], ''
    tree = [hashes[:]]
    while len(tree[-1]) > 1:
        level = []
        for i in range(0, len(tree[-1]), 2):
            left = tree[-1][i]
            right = tree[-1][i+1] if i+1 < len(tree[-1]) else left
            level.append(sha256(left + right))
        tree.append(level)
    return tree, tree[-1][0]

def generate_merkle_proof(tree, index):
    proof = []
    for level in tree[:-1]:
        sibling_index = index ^ 1
        if sibling_index < len(level):
            proof.append(level[sibling_index])
        index //= 2
    return proof

def verify_merkle_proof(leaf, proof, root):
    hash = sha256(leaf)
    for sibling in proof:
        combined = hash + sibling if hash < sibling else sibling + hash
        hash = sha256(combined)
    return hash == root

# --- Key Refresh Logic ---
def refresh_entropy_key():
    real_key = load_encrypted_key()
    if real_key:
        entropy_keys.clear()
        entropy_keys.append(real_key)

        hashed_keys = [sha256(k) for k in entropy_keys]
        global merkle_tree, merkle_root
        merkle_tree, merkle_root = build_merkle_tree(hashed_keys)
        print("[Watcher] Merkle tree updated with new key.")

# --- File Watcher Class ---
class KeyFileHandler(FileSystemEventHandler):
    def on_modified(self, event):
        if event.src_path.endswith("device_key_encrypted.bin"):
            print(f"[Watcher] Detected key file update: {event.src_path}")
            refresh_entropy_key()

def start_watcher():
    event_handler = KeyFileHandler()
    observer = Observer()
    watch_dir = os.path.dirname(ENCRYPTED_KEY_PATH)
    observer.schedule(event_handler, watch_dir, recursive=False)
    observer.start()
    print(f"[Watcher] Monitoring directory: {watch_dir}")

    # Keep the thread alive
    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        observer.stop()
    observer.join()

# --- Flask Routes ---
@app.route('/api/latest-block', methods=['GET'])
def get_latest_block():
    return jsonify({
        'timestamp': str(datetime.now()),
        'entropy_keys': entropy_keys,
        'merkle_root': merkle_root,
        'hash': sha256(merkle_root + str(datetime.now())),
    })

@app.route('/api/verify-merkle', methods=['POST'])
def verify():
    key = request.json.get('key')
    try:
        index = entropy_keys.index(key)
        proof = generate_merkle_proof([sha256(k) for k in entropy_keys], index)
        valid = verify_merkle_proof(key, proof, merkle_root)
        return jsonify({'valid': valid, 'proof_path': proof})
    except ValueError:
        return jsonify({'valid': False, 'error': 'Key not found'}), 400

# --- Launch Flask + Watcher ---
if __name__ == '__main__':
    # Load initial key if it exists
    refresh_entropy_key()

    # Start watcher in separate thread
    watcher_thread = threading.Thread(target=start_watcher, daemon=True)
    watcher_thread.start()

    # Start Flask server
    app.run(port=5000, debug=True)
