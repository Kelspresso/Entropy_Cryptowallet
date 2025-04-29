// AdminDashboard.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'admin') {
      navigate('/login');
    }
    fetchTransactions();
    const interval = setInterval(fetchTransactions, 5000); // Auto-refresh every 5 seconds
    return () => clearInterval(interval);
  }, [navigate]);

  const fetchTransactions = async () => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/get-transactions');
      if (response.ok) {
        const data = await response.json();
        const enrichedTransactions = data.transactions.map(txn => ({ ...txn, verified: null }));
        setTransactions(enrichedTransactions);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  const verifyProof = async (txn, index) => {
    try {
      const response = await fetch('http://127.0.0.1:5000/api/verify-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transaction_hash: txn.hash,
          proof: txn.proof,
          merkle_root: txn.merkle_root,
        }),
      });
      if (response.ok) {
        const result = await response.json();
        const updatedTransactions = [...transactions];
        updatedTransactions[index].verified = result.valid;
        setTransactions(updatedTransactions);
      } else {
        console.error('Failed to verify proof.');
      }
    } catch (error) {
      console.error('Error verifying proof:', error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-6xl">
        <h1 className="text-2xl font-bold text-center mb-6">Admin Dashboard</h1>
        <p className="text-center mb-6">Manage and verify transactions with Merkle Proofs</p>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto border">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-4 py-2">Sender</th>
                <th className="border px-4 py-2">Recipient</th>
                <th className="border px-4 py-2">Amount</th>
                <th className="border px-4 py-2">Transaction Hash</th>
                <th className="border px-4 py-2">Merkle Root</th>
                <th className="border px-4 py-2">Action</th>
                <th className="border px-4 py-2">Verification</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((txn, index) => (
                <tr key={index} className="text-center">
                  <td className="border px-2 py-1">{txn.sender}</td>
                  <td className="border px-2 py-1">{txn.recipient}</td>
                  <td className="border px-2 py-1">{txn.amount}</td>
                  <td className="border px-2 py-1 text-xs">{txn.hash}</td>
                  <td className="border px-2 py-1 text-xs">{txn.merkle_root}</td>
                  <td className="border px-2 py-1">
                    <button
                      onClick={() => verifyProof(txn, index)}
                      className="bg-blue-500 text-white py-1 px-3 rounded-xl hover:bg-blue-600"
                    >
                      Verify Proof
                    </button>
                  </td>
                  <td className="border px-2 py-1">
                    {txn.verified === null ? (
                      <span className="text-gray-400">Pending</span>
                    ) : txn.verified ? (
                      <span className="text-green-500 font-bold">Valid ✅</span>
                    ) : (
                      <span className="text-red-500 font-bold">Invalid ❌</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <button
          onClick={handleLogout}
          className="mt-6 bg-red-500 text-white py-2 rounded-xl hover:bg-red-600 w-full"
        >
          Log Out
        </button>
      </div>
    </div>
  );
}
