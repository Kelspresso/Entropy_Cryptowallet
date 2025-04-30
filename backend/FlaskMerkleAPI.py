from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
from merkletools import MerkleTools
from datetime import datetime
import base64
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
print("✅ CORS is enabled!")

# === Data Stores ===
mt = MerkleTools(hash_type="sha256")
transactions = []

latest_entropy_key = None
latest_entropy_timestamp = None
latest_public_key = None

# === Crypto Utilities ===

def load_private_key(pem_str):
    return serialization.load_pem_private_key(
        pem_str.encode(),
        password=None
    )

def load_public_key(pem_str):
    return serialization.load_pem_public_key(pem_str.encode())

def sign_transaction(transaction_str, private_key):
    signature = private_key.sign(
        transaction_str.encode(),
        padding.PSS(
            mgf=padding.MGF1(hashes.SHA256()),
            salt_length=padding.PSS.MAX_LENGTH
        ),
        hashes.SHA256()
    )
    return base64.b64encode(signature).decode('utf-8')

def verify_signature(transaction_str, signature_b64, public_key):
    try:
        public_key.verify(
            base64.b64decode(signature_b64),
            transaction_str.encode(),
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.MAX_LENGTH
            ),
            hashes.SHA256()
        )
        return True
    except Exception:
        return False

# === Flask Routes ===

@app.route('/api/send-transaction', methods=['POST'])
def send_transaction():
    global latest_entropy_key, latest_public_key

    data = request.get_json()
    sender = data.get('sender')
    recipient = data.get('recipient')
    amount = data.get('amount')

    if not sender or not recipient or not amount:
        return jsonify({"error": "Missing sender, recipient, or amount."}), 400

    if not latest_entropy_key or not latest_public_key:
        return jsonify({"error": "Entropy key or public key not initialized yet"}), 500

    # Build transaction string
    txn_str = f"{sender}->{recipient}:{amount}"

    # Hash and sign the transaction
    txn_hash = hashlib.sha256(txn_str.encode()).hexdigest()
    priv_key = load_private_key(latest_entropy_key)
    signature = sign_transaction(txn_str, priv_key)

    mt.add_leaf(txn_hash, do_hash=False)
    leaf_index = len(mt.leaves) - 1
    mt.make_tree()

    proof = mt.get_proof(leaf_index)
    merkle_root = mt.get_merkle_root()

    transactions.append({
        "sender": sender,
        "recipient": recipient,
        "amount": amount,
        "hash": txn_hash,
        "signature": signature,
        "public_key": latest_public_key,
        "proof": proof,
        "merkle_root": merkle_root,
        "verified": None
    })

    return jsonify({
        "transaction_hash": txn_hash,
        "signature": signature,
        "merkle_root": merkle_root,
        "proof": proof
    })

@app.route('/api/get-transactions', methods=['GET'])
def get_transactions():
    return jsonify({"transactions": transactions}), 200

@app.route('/api/verify-transaction', methods=['POST'])
def verify_transaction():
    data = request.get_json()
    txn_hash = data.get('transaction_hash')
    proof = data.get('proof')
    merkle_root = data.get('merkle_root')

    if not txn_hash or not proof or not merkle_root:
        return jsonify({"error": "Missing fields"}), 400

    is_valid = mt.validate_proof(proof, txn_hash, merkle_root)
    return jsonify({"valid": is_valid}), 200

@app.route('/api/verify-signature', methods=['POST'])
def verify_signature_route():
    data = request.get_json()
    txn_str = data.get('transaction')
    signature = data.get('signature')
    pub_key_pem = data.get('public_key')

    if not txn_str or not signature or not pub_key_pem:
        return jsonify({"error": "Missing verification fields"}), 400

    pub = load_public_key(pub_key_pem)
    valid = verify_signature(txn_str, signature, pub)
    return jsonify({"valid": valid}), 200

@app.route('/api/latest-entropy-key', methods=['GET', 'POST'])
def get_or_post_entropy_key():
    global latest_entropy_key, latest_entropy_timestamp, latest_public_key
    if request.method == 'GET':
        return jsonify({
            "entropy_key": latest_entropy_key,
            "timestamp": latest_entropy_timestamp
        })

    # POST
    data = request.get_json()
    entropy_key = data.get('entropy_key')
    public_key = data.get('public_key')

    if not entropy_key or not public_key:
        return jsonify({"error": "Missing entropy_key or public_key"}), 400

    latest_entropy_key = entropy_key.strip()
    latest_public_key = public_key.strip()
    latest_entropy_timestamp = datetime.now().isoformat()

    print("📥 Received new entropy + public key")
    return jsonify({"message": "Entropy and public key stored"}), 200

if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
