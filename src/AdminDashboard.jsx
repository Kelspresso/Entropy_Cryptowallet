import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [entropyKey, setEntropyKey] = useState(null);
  const [entropyTimestamp, setEntropyTimestamp] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
    fetchTransactions();
    fetchEntropyKey();

    const interval = setInterval(() => {
      fetchTransactions();
      fetchEntropyKey();
    }, 5000);

    return () => clearInterval(interval);
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/get-transactions');
      if (!res.ok) return;

      const data = await res.json();

      const enriched = await Promise.all(
        data.transactions.map(async (txn) => {
          const txnStr = `${txn.sender}->${txn.recipient}:${txn.amount}`;

          // Verify signature and derive wallet address
          const sigResult = await verifySignature(txnStr, txn.signature, txn.public_key);

          // Verify Merkle proof
          const merkleValid = await verifyMerkleProofDirect(txn);

          return {
            ...txn,
            signature_valid: sigResult.valid,
            signer_suffix: sigResult.shortKey,
            wallet_address: sigResult.walletAddress,
            merkle_valid: merkleValid
          };
        })
      );

      setTransactions(enriched);
    } catch (err) {
      console.error("❌ Error fetching transactions:", err);
    }
  };

  const fetchEntropyKey = async () => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/latest-entropy-key');
      if (!res.ok) return;

      const data = await res.json();
      setEntropyKey(data.entropy_key);
      setEntropyTimestamp(data.timestamp);
    } catch (err) {
      console.error("❌ Error fetching entropy key:", err);
    }
  };

  const verifySignature = async (txnStr, signature, pubKey) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/verify-signature', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          transaction: txnStr,
          signature,
          public_key: pubKey
        })
      });

      if (!res.ok) return { valid: false };

      const result = await res.json();

      // Derive short fingerprint from public key hash
      const hash = await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(pubKey)
      );
      const hex = Array.from(new Uint8Array(hash))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
      const suffix = hex.slice(-4);
      const walletAddr = "0x" + hex.slice(-8);

      return {
        valid: result.valid,
        shortKey: suffix,
        walletAddress: walletAddr
      };
    } catch (err) {
      console.error("❌ Signature verification error:", err);
      return { valid: false };
    }
  };

  const verifyMerkleProofDirect = async (txn) => {
    try {
      const res = await fetch('http://127.0.0.1:5000/api/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: txn.hash,
          proof: txn.proof,
          merkle_root: txn.merkle_root
        })
      });

      if (!res.ok) return false;

      const result = await res.json();
      return result.valid;
    } catch (err) {
      console.error("❌ Merkle verification error:", err);
      return false;
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-7xl">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h1>

        {/* Entropy Key Status */}
        <div className="mb-6 p-4 bg-gray-100 rounded-xl">
          <h2 className="text-lg font-bold text-center">Device Connection Status</h2>
          {entropyKey ? (
            <div className="text-green-700 text-center mt-2">
              <p><strong>Entropy Key Received</strong></p>
              <p><strong>Last Updated:</strong> {entropyTimestamp}</p>
            </div>
          ) : (
            <div className="text-red-500 text-center mt-2">
              Waiting for entropy key from device...
            </div>
          )}
        </div>

        {/* Transactions */}
        <div className="overflow-x-auto">
          <h2 className="text-lg font-bold mb-2">Signed Transactions</h2>
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-200 text-sm">
                <th className="border px-3 py-2">Sender</th>
                <th className="border px-3 py-2">Recipient</th>
                <th className="border px-3 py-2">Amount</th>
                <th className="border px-3 py-2">Wallet</th>
                <th className="border px-3 py-2">Signature</th>
                <th className="border px-3 py-2">Merkle Proof</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={index} className="text-center text-sm">
                  <td className="border px-2 py-1">{txn.sender}</td>
                  <td className="border px-2 py-1">{txn.recipient}</td>
                  <td className="border px-2 py-1">{txn.amount}</td>
                  <td className="border px-2 py-1 font-mono text-indigo-600">{txn.wallet_address}</td>
                  <td className="border px-2 py-1">
                    {txn.signature_valid ? (
                      <span className="text-green-600 font-semibold">
                        ✅ by key ...{txn.signer_suffix}
                      </span>
                    ) : (
                      <span className="text-red-500 font-semibold">❌ Invalid</span>
                    )}
                  </td>
                  <td className="border px-2 py-1">
                    {txn.merkle_valid === true ? (
                      <span className="text-green-600 font-semibold">✅ Valid</span>
                    ) : txn.merkle_valid === false ? (
                      <span className="text-red-500 font-semibold">❌ Invalid</span>
                    ) : (
                      <span className="text-gray-400">Pending</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="mt-8 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 w-full"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
