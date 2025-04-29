// UserWallet.jsx
import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import TransactionForm from './TransactionForm';

export default function UserWallet() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [balance, setBalance] = useState(1000);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user || user.role !== 'user') {
      navigate('/login');
    } else {
      setUsername(user.username);
      const savedBalance = localStorage.getItem(`${user.username}_balance`);
      setBalance(savedBalance ? parseInt(savedBalance) : 1000);
    }
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (username) {
        const updatedBalance = localStorage.getItem(`${username}_balance`);
        setBalance(updatedBalance ? parseInt(updatedBalance) : 1000);
      }
    }, 5000); // Refresh balance every 5 seconds

    return () => clearInterval(interval);
  }, [username]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    navigate('/login');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-2xl shadow-md w-full max-w-2xl">
        <h1 className="text-2xl font-bold text-center mb-6 text-green-700">{username}'s Wallet</h1>

        <div className="bg-green-200 text-green-800 font-bold p-6 rounded-xl mb-6 text-center text-2xl">
          💰 Balance: ${balance}
        </div>

        <TransactionForm currentUser={username} />

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
