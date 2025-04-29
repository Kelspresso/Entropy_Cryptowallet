// TransactionForm.jsx
import { useState } from 'react';

export default function TransactionForm({ currentUser }) {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');

  const handleSend = async (e) => {
    e.preventDefault();
    if (!recipient || !amount) {
      setMessage('Please fill out all fields.');
      return;
    }

    try {
      const response = await fetch('/api/send-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sender: currentUser,
          recipient,
          amount,
        }),
      });

      if (response.ok) {
        setMessage('✅ Transaction sent successfully!');

        // Update localStorage balances
        const senderBalance = parseInt(localStorage.getItem(`${currentUser}_balance`) || '1000');
        const recipientBalance = parseInt(localStorage.getItem(`${recipient}_balance`) || '1000');
        const amt = parseInt(amount);

        if (senderBalance >= amt) {
          localStorage.setItem(`${currentUser}_balance`, senderBalance - amt);
          localStorage.setItem(`${recipient}_balance`, recipientBalance + amt);
        }
      } else {
        setMessage('❌ Failed to send transaction.');
      }
    } catch (error) {
      console.error('Error sending transaction:', error);
      setMessage('❌ Error connecting to server.');
    }

    setRecipient('');
    setAmount('');
  };

  return (
    <div className="mt-8 bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-bold mb-4 text-center text-green-700">Send Money</h2>
      <form onSubmit={handleSend} className="flex flex-col space-y-4 items-center">
        <input
          type="text"
          placeholder="Recipient Username"
          className="border p-2 rounded-xl w-72"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          required
        />
        <input
          type="number"
          placeholder="Amount"
          className="border p-2 rounded-xl w-72"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          required
        />
        <button type="submit" className="bg-green-500 text-white py-2 px-6 rounded-xl hover:bg-green-600">
          Send
        </button>
        {message && <p className="text-center text-green-600 w-72">{message}</p>}
      </form>
    </div>
  );
}
