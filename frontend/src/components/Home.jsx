import React from 'react';
import { Link } from 'react-router-dom';
import { FaHeartbeat, FaExclamationTriangle } from 'react-icons/fa';

const Home = () => {
  return (
    <div className="hero">
      <h1>Welcome to BloodConnect</h1>
      <p>Connecting blood donors with those in need</p>
      
      <div className="cta-buttons">
        <Link to="/emergency" className="emergency-cta">
          <FaExclamationTriangle /> Emergency SOS
        </Link>
        <Link to="/register" className="btn btn-primary">
          <FaHeartbeat /> Become a Donor
        </Link>
      </div>
    </div>
  );
};

export default Home; 