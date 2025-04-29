# FlaskMerkleAPI.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import hashlib
from merkletools import MerkleTools

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})
print("✅ CORS is enabled!")

# Initialize Merkle Tree and Transactions list
mt = MerkleTools(hash_type="sha256")
transactions = []

# Endpoint to send a transaction
@app.route('/api/send-transaction', methods=['POST'])
def send_transaction():
    data = request.get_json()
    print("🚀 Incoming transaction payload:", data)

    sender = data.get('sender')
    recipient = data.get('recipient')
    amount = data.get('amount')

    if not sender or not recipient or not amount:
        return jsonify({"error": "Missing sender, recipient, or amount."}), 400

    transaction_string = f"{sender}->{recipient}:{amount}"
    transaction_hash = hashlib.sha256(transaction_string.encode()).hexdigest()

    # ✅ Capture the index BEFORE make_tree
    mt.add_leaf(transaction_hash, do_hash=False)
    leaf_index = len(mt.leaves) - 1  # <-- New leaf is always at the last index

    mt.make_tree()

    proof = mt.get_proof(leaf_index)
    merkle_root = mt.get_merkle_root()

    transactions.append({
        "sender": sender,
        "recipient": recipient,
        "amount": amount,
        "hash": transaction_hash,
        "proof": proof,
        "merkle_root": merkle_root
    })

    return jsonify({
        "transaction_hash": transaction_hash,
        "merkle_root": merkle_root,
        "proof": proof
    }), 200


# Endpoint to get all transactions
@app.route('/api/get-transactions', methods=['GET'])
def get_transactions():
    return jsonify({"transactions": transactions}), 200

# Endpoint to verify a transaction proof
@app.route('/api/verify-transaction', methods=['POST'])
def verify_transaction():
    data = request.get_json()
    transaction_hash = data.get('transaction_hash')
    proof = data.get('proof')
    merkle_root = data.get('merkle_root')

    if not transaction_hash or not proof or not merkle_root:
        return jsonify({"error": "Missing transaction hash, proof, or merkle root."}), 400

    is_valid = mt.validate_proof(proof, transaction_hash, merkle_root)

    return jsonify({"valid": is_valid}), 200

# Run the Flask app
if __name__ == '__main__':
    app.run(host="0.0.0.0", port=5000, debug=True)
