// React frontend component for viewing PoSp/PoW hybrid block and verifying Merkle proof
import React, { useEffect, useState } from 'react';
import axios from 'axios';

export default function EntropyProofViewer() {
  const [blockData, setBlockData] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedKey, setSelectedKey] = useState('');

  useEffect(() => {
    const fetchBlock = () => {
      axios.get('http://localhost:5000/api/latest-block')
        .then(response => {
          setBlockData(response.data);
          if (response.data.entropy_keys.length > 0) {
            setSelectedKey(response.data.entropy_keys[0]);
          }
        });
    };

    fetchBlock();
    const interval = setInterval(fetchBlock, 10000); // refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const verifyMerkleProof = () => {
    axios.post('http://localhost:5000/api/verify-merkle', {
      key: selectedKey
    }).then(res => {
      setVerificationResult(res.data.valid);
    });
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-2">🧪 Entropy Block Viewer</h1>
      
      {blockData && (
        <div className="border p-4 rounded bg-gray-100 text-gray-900">
          <p><strong>Merkle Root:</strong> {blockData.merkle_root}</p>
          <p><strong>Block Hash:</strong> {blockData.hash}</p>

          <p className="mt-2 text-sm">
            <strong>Status:</strong>{" "}
            {blockData.entropy_keys.length > 0 ? (
              <span className="text-green-600 font-semibold">🔗 Key received from Pi</span>
            ) : (
              <span className="text-red-500 font-semibold">❌ No key received</span>
            )}
          </p>

          <p className="mt-4 font-semibold">Entropy Keys:</p>
          <ul className="list-disc ml-6 text-sm">
            {blockData.entropy_keys.map((key, idx) => (
              <li key={idx}>{key}</li>
            ))}
          </ul>

          <div className="mt-4">
            <label htmlFor="key-select" className="block mb-1 font-semibold">Select Entropy Key to Verify:</label>
            <select
              id="key-select"
              className="w-full p-2 border rounded"
              value={selectedKey}
              onChange={e => setSelectedKey(e.target.value)}>
              {blockData.entropy_keys.map((key, idx) => (
                <option key={idx} value={key}>{key}</option>
              ))}
            </select>
            <button
              onClick={verifyMerkleProof}
              className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Verify Merkle Proof
            </button>

            {verificationResult !== null && (
              <p className="mt-2 font-semibold text-sm">
                Result: {verificationResult ? '✅ Valid key in Merkle Tree' : '❌ Invalid key'}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
