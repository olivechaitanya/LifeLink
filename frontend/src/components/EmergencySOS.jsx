import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaExclamationTriangle, FaTint, FaMapMarkerAlt, FaUser, FaPhone } from 'react-icons/fa';
import {jwtDecode} from 'jwt-decode';

const EmergencySOS = () => {
  const [bloodGroup, setBloodGroup] = useState('');
  const [units, setUnits] = useState(1);
  const [address, setAddress] = useState('');
  const [fullName, setFullName] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [notifiedCount, setNotifiedCount] = useState(0);
  const [acceptedDonors, setAcceptedDonors] = useState([]);
  const [showDonorModal, setShowDonorModal] = useState(false);
  const navigate = useNavigate();

  // Get current user id from token
  let currentUserId = null;
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const decoded = jwtDecode(token);
      currentUserId = decoded.id;
    } catch (e) { currentUserId = null; }
  }

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:5000/api/emergency/request', {
        bloodGroup,
        units,
        location: {
          address
        },
        fullName,
        mobileNumber
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setNotifiedCount(response.data.notifiedDonors);
      setSuccess(`Emergency request sent successfully! ${response.data.notifiedDonors} donors have been notified.`);
      setTimeout(() => {
        navigate('/');
      }, 5000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to send emergency request');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;
    if (success && currentUserId) {
      interval = setInterval(async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await axios.get('http://localhost:5000/api/emergency/requests', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const myRequest = response.data.find(r => r.requesterId._id === currentUserId);
          if (myRequest && myRequest.acceptedBy && myRequest.acceptedBy.length > 0) {
            setAcceptedDonors(myRequest.acceptedBy.map(a => a.donorId));
            setShowDonorModal(true);
            clearInterval(interval);
          }
        } catch (err) {}
      }, 10000);
    }
    return () => clearInterval(interval);
  }, [success, currentUserId]);

  return (
    <>
      <h1 style={{color: 'red', textAlign: 'center', marginTop: '40px'}}>EMERGENCY SOS</h1>
      <div className="emergency-container">
        <div className="emergency-box">
          <div className="emergency-header">
            <FaExclamationTriangle className="emergency-icon" />
            <h1>Emergency Blood Request</h1>
          </div>

          <div className="emergency-instructions">
            <ol>
              <li>Enter your <strong>Name</strong> and <strong>Contact Number</strong>.</li>
              <li>Choose the <strong>Blood Group</strong> you need.</li>
              <li>Enter the <strong>Number of Units</strong> required.</li>
              <li>Provide your <strong>Location</strong> (address).</li>
              <li>Click <strong>Send Emergency Request</strong>.</li>
            </ol>
            <p className="helper-text">Eligible donors will be notified instantly via SMS.</p>
          </div>

          {error && <div className="error-message">{error}</div>}
          {success && <div className="success-message">{success}</div>}

          <form onSubmit={handleSubmit} className="emergency-form">
            <div className="form-group">
              <label>
                <FaUser className="icon" /> Your Name
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                placeholder="Enter your full name"
              />
              <span className="helper-text">Enter your full name for identification.</span>
            </div>

            <div className="form-group">
              <label>
                <FaPhone className="icon" /> Contact Number
              </label>
              <input
                type="tel"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                required
                pattern="[0-9]{10}"
                placeholder="Enter your 10-digit mobile number"
              />
              <span className="helper-text">Enter your contact number for communication.</span>
            </div>

            <div className="form-group">
              <label>
                <FaTint className="icon" /> Blood Group Required
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                required
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              <span className="helper-text">Select the blood group you need urgently.</span>
            </div>

            <div className="form-group">
              <label>Number of Units Required</label>
              <input
                type="number"
                min="1"
                max="10"
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                required
                placeholder="e.g. 2"
              />
              <span className="helper-text">Enter the number of blood units needed (1-10).</span>
            </div>

            <div className="form-group">
              <label>
                <FaMapMarkerAlt className="icon" /> Location
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Enter your address (e.g. City Hospital, Main Road)"
                required
              />
              <span className="helper-text">Provide your address for donor matching.</span>
            </div>

            <button 
              type="submit" 
              className="sos-button"
              disabled={loading}
            >
              {loading ? 'Sending Request...' : 'Send Emergency Request'}
            </button>
          </form>
        </div>
      </div>

      {showDonorModal && acceptedDonors.length > 0 && (
        <div className="modal">
          <div className="modal-content">
            <h2>Donor Details</h2>
            {acceptedDonors.map((donor, idx) => (
              <div key={donor._id || idx} className="donor-details">
                <p><strong>Name:</strong> {donor.fullName}</p>
                <p><strong>Phone:</strong> {donor.mobileNumber}</p>
                <p><strong>Email:</strong> {donor.email}</p>
                <p><strong>Blood Group:</strong> {donor.bloodGroup}</p>
                <p><strong>Location:</strong> {donor.location?.address}</p>
                <hr />
              </div>
            ))}
            <button className="submit-btn" onClick={() => setShowDonorModal(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
};

export default EmergencySOS; 