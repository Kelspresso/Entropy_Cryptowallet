import React, { useState } from "react";
import { Card, CardContent } from "./components/ui/card";
import { Button } from "./components/ui/button";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import EntropyProofViewer from "./EntropyProofViewer";

function Login({ onLogin }) {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white">
      <Card className="w-full max-w-sm bg-white shadow-2xl">
        <CardContent>
          <h1 className="text-2xl font-bold mb-4 text-center text-indigo-700">Login</h1>
          <div className="space-y-2">
            <Button className="w-full" onClick={() => onLogin(true)}>
              Admin Login
            </Button>
            <Button className="w-full" onClick={() => onLogin(false)}>
              Client Login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AdminDashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <Button onClick={onLogout}>Log Out</Button>
        </div>

        <Card className="bg-gray-800 border-gray-600">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Entropy Sensor Data</h2>
            <ul className="space-y-1">
              <li>BME280: Temp=22.5Â°C, Humidity=55%, Pressure=1012 hPa</li>
              <li>MQ135: Air Quality=185 ppm</li>
              <li>MAX9814: Noise Level=70 dB</li>
              <li>Photoresistor: Light=320 Lux</li>
            </ul>
          </CardContent>
        </Card>

        <Card classname="bg-gray-800 border-gray-600">
          <CardContent>
            <EntropyProofViewer />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function ClientWallet({ onLogout }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Crypto Wallet</h1>
          <Button onClick={onLogout}>Log Out</Button>
        </div>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Market Overview</h2>
            <ul className="space-y-1">
              <li>Bitcoin (BTC): <span className="font-medium text-green-400">$65,000</span></li>
              <li>Ethereum (ETH): <span className="font-medium text-green-400">$3,200</span></li>
              <li>Cardano (ADA): <span className="font-medium text-green-400">$1.50</span></li>
            </ul>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Wallet Balance</h2>
            <p>Total: <span className="font-medium text-white">$18,750</span></p>
            <p>BTC: 0.3</p>
            <p>ETH: 1.0</p>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Send Crypto</h2>
            <div>
              <p>To: <code className="bg-gray-700 px-2 py-1 rounded">0x123...456</code></p>
              <p>Amount: 0.5 BTC</p>
            </div>
            <Button className="mt-3">Send (Dummy)</Button>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-600">
          <CardContent>
            <h2 className="text-xl font-semibold mb-2">Cryptographic Key</h2>
            <p>Public Key: <code className="bg-gray-700 px-2 py-1 rounded">0xABCDEF123456</code></p>
            <p className="text-green-400 font-medium">Status: Secure</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function App() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  const handleLogin = (admin) => {
    setIsAdmin(admin);
    setLoggedIn(true);
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setLoggedIn(false);
  };

  return (
    <Router>
      <Routes>
        {!loggedIn ? (
          <Route path="/*" element={<Login onLogin={handleLogin} />} />
        ) : isAdmin ? (
          <Route path="/*" element={<AdminDashboard onLogout={handleLogout} />} />
        ) : (
          <Route path="/*" element={<ClientWallet onLogout={handleLogout} />} />
        )}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Router>
  );
}

export default App;