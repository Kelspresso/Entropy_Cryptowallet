import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const users = [
  { username: 'admin', password: 'admin', role: 'admin' },
  { username: 'Kelsey', password: 'kelsey123', role: 'user' },
  { username: 'Nolan', password: 'nolan123', role: 'user' },
  { username: 'Kate', password: 'kate123', role: 'user' },
  { username: 'Mia', password: 'mia123', role: 'user' },
];

export default function Login() {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [backgroundColor, setBackgroundColor] = useState('bg-gray-100');

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      if (user.role === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/user-wallet');
      }
    }
  }, [navigate]);

  const handleLogin = (e) => {
    e.preventDefault();
    const foundUser = users.find(
      (user) => user.username === username && user.password === password
    );
    if (foundUser) {
      localStorage.setItem('currentUser', JSON.stringify(foundUser));
      if (foundUser.role === 'admin') {
        setBackgroundColor('bg-purple-200'); // Admin users get purple tint
        navigate('/admin-dashboard');
      } else {
        setBackgroundColor('bg-green-100'); // Regular users get green tint
        navigate('/user-wallet');
      }
    } else {
      setError('Invalid username or password.');
    }
  };

  return (
    <div className={`flex flex-col items-center justify-center min-h-screen ${backgroundColor}`}>
      <div className="bg-white p-8 rounded-2xl shadow-md w-80">
        <img
          src="/ChaotiKey_Logo.png"
          alt="ChaotiKey Logo"
          className="w-32 h-32 mx-auto mb-6 rounded-full shadow-lg"
        />
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col space-y-4">
          <input
            type="text"
            placeholder="Username"
            className="border p-2 rounded-xl"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            className="border p-2 rounded-xl"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          <button type="submit" className="bg-blue-500 text-white py-2 rounded-xl hover:bg-blue-600">
            Log In
          </button>
        </form>
      </div>
    </div>
  );
}
