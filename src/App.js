import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './Login';
import AdminDashboard from './AdminDashboard';
import UserWallet from './UserWallet';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/user-wallet" element={<UserWallet />} />
      </Routes>
    </Router>
  );
}
