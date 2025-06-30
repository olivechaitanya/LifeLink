import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import DonorDashboard from './components/DonorDashboard';
import EmergencySOS from './components/EmergencySOS';
import './App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Navbar />
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/dashboard" element={<DonorDashboard />} />
            <Route path="/emergency" element={<EmergencySOS />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App; 