import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaUser, FaTint, FaMapMarkerAlt, FaPhone, FaEnvelope, FaHistory, FaSearch } from 'react-icons/fa';
import EmergencySOS from "./EmergencySOS";
import './DonorDashboard.css';

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Dashboard Error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container">
          <div className="error-message">
            Something went wrong. Please try refreshing the page.
          </div>
          <button onClick={() => window.location.reload()} className="btn btn-primary">
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

const DonorDashboard = () => {
  const [donor, setDonor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [lastDonation, setLastDonation] = useState('');
  const [isInDonorList, setIsInDonorList] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [showDonationHistory, setShowDonationHistory] = useState(false);
  const [showNearbyDonors, setShowNearbyDonors] = useState(false);
  const [nearbyDonors, setNearbyDonors] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [showRequests, setShowRequests] = useState(false);
  const [hasCheckedEligibility, setHasCheckedEligibility] = useState(false);
  const [acceptedReceiver, setAcceptedReceiver] = useState(null);
  const [showReceiverModal, setShowReceiverModal] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const user = JSON.parse(localStorage.getItem('user'));
        
        if (!token || !user) {
          console.log('No token or user found, redirecting to login');
          navigate('/donor/login');
          return;
        }

        setLoading(true);
        
        try {
          const response = await axios.get('http://localhost:5000/api/donor/profile', {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          console.log('Profile Response:', response.data);

          if (response.data) {
            setDonor(response.data);
            setIsInDonorList(response.data.isInDonorList);
            
            const requestsResponse = await axios.get('http://localhost:5000/api/emergency/donor/requests', {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });

            console.log('Requests Response:', requestsResponse.data);
            setEmergencyRequests(requestsResponse.data || []);
            
            setShowWelcomeMessage(true);
            setTimeout(() => {
              setShowWelcomeMessage(false);
            }, 3000);
          } else {
            throw new Error('No donor data received');
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          if (error.response?.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            navigate('/donor/login');
          } else {
            setError('Failed to load donor profile. Please try logging in again.');
          }
        }
      } catch (error) {
        console.error('Error in authentication check:', error);
        setError('Authentication failed. Please log in again.');
        navigate('/donor/login');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndFetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/donor/login');
  };

  const checkEligibility = (months) => {
    if (!donor) return false;
    
    // Check age restrictions first
    if (donor.age < 18 || donor.age > 60) {
      return false;
    }

    const minMonths = donor.gender === 'Female' ? 4 : 3;
    return parseInt(months) >= minMonths;
  };

  const handleLastDonationChange = (e) => {
    const selectedMonths = e.target.value;
    setLastDonation(selectedMonths);
    
    if (selectedMonths) {
      // Check age restrictions first
      if (donor.age < 18) {
        setModalMessage('You must be at least 18 years old to donate blood.');
        return;
      }
      if (donor.age > 60) {
        setModalMessage('Donors must be under 60 years old to donate blood.');
        return;
      }

      const eligible = checkEligibility(selectedMonths);
      setModalMessage(
        eligible 
          ? 'You are eligible to donate!' 
          : 'You are not eligible to donate. Please wait 4 months between donations.'
      );
    } else {
      setModalMessage('');
    }
  };

  const handleLastDonationSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/donor/update-last-donation',
        { months: lastDonation },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setIsInDonorList(response.data.donor.isInDonorList);
      setShowModal(false);
      setLastDonation('');
      setModalMessage('');
      setHasCheckedEligibility(true);
      
      if (response.data.donor.isInDonorList) {
        setSuccessMessage('You have been successfully added to the donor list!');
        setTimeout(() => setSuccessMessage(''), 5000);
      }

      // Update donor data
      setDonor(prev => ({
        ...prev,
        ...response.data.donor
      }));
    } catch (error) {
      setError('Failed to update last donation date');
    }
  };

  const handleFindNearbyDonors = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        'http://localhost:5000/api/donor/find-nearby',
        {
          latitude: donor.location.latitude,
          longitude: donor.location.longitude,
          bloodGroup: donor.bloodGroup
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNearbyDonors(response.data);
      setShowNearbyDonors(true);
    } catch (error) {
      setError('Failed to find nearby donors');
    }
  };

  const handleAcceptRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/emergency/request/${requestId}/accept`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccessMessage('Request accepted successfully! The requester will be notified.');
      setTimeout(() => setSuccessMessage(''), 5000);

      // Show receiver details in a modal
      setAcceptedReceiver(response.data.receiver);
      setShowReceiverModal(true);

      // Update the requests list
      setEmergencyRequests(prev =>
        prev.map(req =>
          req._id === requestId ? response.data.request : req
        )
      );
    } catch (error) {
      console.error('Error accepting request:', error);
      setError('Failed to accept request. Please try again.');
    }
  };

  const handleDeclineRequest = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `http://localhost:5000/api/emergency/request/${requestId}/decline`,
        {},
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      setSuccessMessage('Request declined successfully.');
      setTimeout(() => setSuccessMessage(''), 5000);

      // Update the requests list
      setEmergencyRequests(prev =>
        prev.map(req =>
          req._id === requestId ? response.data.request : req
        )
      );
    } catch (error) {
      console.error('Error declining request:', error);
      setError('Failed to decline request. Please try again.');
    }
  };

  function getMonthsSince(date) {
    if (!date) return null;
    const now = new Date();
    const last = new Date(date);
    return (now.getFullYear() - last.getFullYear()) * 12 + (now.getMonth() - last.getMonth());
  }

  const monthsSinceLastDonation = getMonthsSince(donor?.lastDonation);
  const requiredMonths = donor?.gender === 'Female' ? 4 : 3;
  const monthsLeft = requiredMonths - (monthsSinceLastDonation || 0);

  const [isEligible ,setIsEligible] = useState(donor && donor.age >= 18 && donor.age <= 60 && monthsSinceLastDonation !== null && monthsSinceLastDonation >= requiredMonths);

  let eligibilityMessage = '';
  if (donor) {
    if (donor.age < 18) {
      eligibilityMessage = 'You must be at least 18 years old to donate blood.';
    } else if (donor.age > 60) {
      eligibilityMessage = 'Donors must be under 60 years old to donate blood.';
    } else if (monthsSinceLastDonation !== null && monthsSinceLastDonation < requiredMonths) {
      eligibilityMessage = `You need to wait ${monthsLeft} more month(s) before you can donate again.`;
    } else if (monthsSinceLastDonation === null) {
      eligibilityMessage = 'Please enter your last donation date to check eligibility.';
    }
  }
  console.log(donor);

  const renderDashboard = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading">Loading your profile...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="error-container">
          <div className="error-message">{error}</div>
          <button onClick={() => navigate('/donor/login')} className="btn btn-primary">
            Return to Login
          </button>
        </div>
      );
    }

    if (!donor) {
      return (
        <div className="error-container">
          <div className="error-message">No donor data found. Please log in again.</div>
          <button onClick={() => navigate('/donor/login')} className="btn btn-primary">
            Return to Login
          </button>
        </div>
      );
    }

    return (
      <>
        {showWelcomeMessage && (
          <div className="welcome-message">
            <h2>Welcome to your Dashboard!</h2>
            <p>We're glad to have you here. Your profile is being loaded...</p>
          </div>
        )}
        
        <div className="dashboard-header">
          <h1>Welcome, {donor?.fullName || 'Donor'}!</h1>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>

        {successMessage && (
          <div className="success-message">
            <p>{successMessage}</p>
          </div>
        )}

        {isInDonorList && (
          <div className="donor-list-message">
            <p>You are currently in the donor list and available for donation requests!</p>
          </div>
        )}

        <div className="dashboard-box">
          <div className="dashboard-section">
            <h2>Personal Information</h2>
            <div className="info-grid">
              <div className="info-item">
                <FaUser className="icon" />
                <div>
                  <p><strong>Name:</strong> {donor?.fullName || 'N/A'}</p>
                  <p><strong>Age:</strong> {donor?.age || 'N/A'}</p>
                  <p><strong>Gender:</strong> {donor?.gender || 'N/A'}</p>
                </div>
              </div>

              <div className="info-item">
                <FaTint className="icon" />
                <div>
                  <p><strong>Blood Group:</strong> {donor?.bloodGroup || 'N/A'}</p>
                  <p><strong>Eligibility Status:</strong> {isEligible ? 'Eligible' : 'Not Eligible'}</p>
                  {donor?.lastDonation && (
                    <p><strong>Last Donation:</strong> {new Date(donor.lastDonation).toLocaleDateString()}</p>
                  )}
                </div>
              </div>

              <div className="info-item">
                <FaMapMarkerAlt className="icon" />
                <div>
                  <p><strong>Address:</strong> {donor?.location?.address || 'N/A'}</p>
                  <p><strong>Coordinates:</strong> {donor?.location?.latitude || 'N/A'}, {donor?.location?.longitude || 'N/A'}</p>
                </div>
              </div>

              <div className="info-item">
                <FaPhone className="icon" />
                <div>
                  <p><strong>Phone:</strong> {donor?.mobileNumber || 'N/A'}</p>
                  <p><strong>Email:</strong> {donor?.email || 'N/A'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-section">
            <h2>Emergency Requests</h2>
            {emergencyRequests && emergencyRequests.length > 0 ? (
              <div className="emergency-requests">
                {emergencyRequests.map(request => {
                  console.log('Request Data:', request); // Debug log
                  return (
                    <div key={request._id} className="request-card">
                      <div className="request-header">
                        <h3>Blood Group: {request.bloodGroup}</h3>
                        <span className="request-status">{request.status}</span>
                      </div>
                      <div className="request-details">
                        <p><strong>Units Needed:</strong> {request.units}</p>
                        <p><strong>Location:</strong> {request.location?.address || 'N/A'}</p>
                        <p><strong>Receiver Name:</strong> {request.receiver?.fullName || request.receiverName || 'N/A'}</p>
                        <p><strong>Receiver Contact:</strong> {request.receiver?.mobileNumber || request.receiverMobile || 'N/A'}</p>
                        <p><strong>Time:</strong> {new Date(request.createdAt).toLocaleString()}</p>
                      </div>
                      {request.status === 'pending' && (
                        <div className="request-actions">
                          <button
                            onClick={() => handleAcceptRequest(request._id)}
                            className="accept-btn"
                          >
                            Accept Request
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request._id)}
                            className="decline-btn"
                          >
                            Decline Request
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="no-requests">No emergency requests at the moment.</p>
            )}
          </div>

          <div className="dashboard-section">
            <h2>Donation Actions</h2>
            <button
              onClick={() => setShowModal(true)}
              className={`donate-btn ${(donor.age < 18 || donor.age > 60 || isInDonorList) ? 'disabled' : ''}`}
              disabled={donor.age < 18 || donor.age > 60 || isInDonorList}
            >
              I Want to Donate
            </button>
            {hasCheckedEligibility && (
              <p><strong>Eligibility Status:</strong> {isEligible ? 'Eligible' : 'Not Eligible'}</p>
            )}
            {isInDonorList && (
              <p className="donor-list-message">
                You are already in the donor list and available for requests!
              </p>
            )}
          </div>

          {donor.donationHistory && donor.donationHistory.length > 0 && (
            <div className="dashboard-section">
              <h2>Donation History</h2>
              <div className="history-list">
                {donor.donationHistory.map((donation, index) => (
                  <div key={index} className="history-item">
                    <p><strong>Date:</strong> {new Date(donation.date).toLocaleDateString()}</p>
                    <p><strong>Location:</strong> {donation.location}</p>
                    <p><strong>Status:</strong> {donation.status}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {showModal && (
          <div className="modal">
            <div className="modal-content">
              <h2>When was your last donation?</h2>
              <select
                value={lastDonation}
                onChange={handleLastDonationChange}
                className="last-donation-select"
              >
                <option value="">Select time period</option>
                {donor.gender === 'Male' ? (
                  <>
                    <option value="1">1 month ago</option>
                    <option value="2">2 months ago</option>
                    <option value="3">3 months ago</option>
                    <option value="4">4 months ago</option>
                  </>
                ) : (
                  <>
                    <option value="1">1 month ago</option>
                    <option value="2">2 months ago</option>
                    <option value="3">3 months ago</option>
                    <option value="4">4 months ago</option>
                  </>
                )}
              </select>
              {modalMessage && (
                <p className={`modal-message ${modalMessage.includes('eligible') ? 'success' : 'error'}`}>
                  {modalMessage}
                </p>
              )}
              <div className="modal-actions">
                <button
                  onClick={handleLastDonationSubmit}
                  disabled={!lastDonation || modalMessage.includes('not eligible')}
                  className="submit-btn"
                >
                  Submit
                </button>
                <button
                  onClick={() => {
                    setShowModal(false);
                    setLastDonation('');
                    setModalMessage('');
                  }}
                  className="cancel-btn"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {showReceiverModal && acceptedReceiver && (
          <div className="modal">
            <div className="modal-content">
              <h2>Receiver Details</h2>
              <p><strong>Name:</strong> {acceptedReceiver?.fullName || 'N/A'}</p>
              <p><strong>Phone:</strong> {acceptedReceiver?.mobileNumber || 'N/A'}</p>
              <p><strong>Email:</strong> {acceptedReceiver?.email || 'N/A'}</p>
              <p><strong>Blood Group:</strong> {acceptedReceiver?.bloodGroup || 'N/A'}</p>
              <p><strong>Location:</strong> {acceptedReceiver?.location?.address || 'N/A'}</p>
              <button className="submit-btn" onClick={() => setShowReceiverModal(false)}>Close</button>
            </div>
          </div>
        )}
      </>
    );
  };

  return (
    <ErrorBoundary>
      <div className="dashboard-container">
        {renderDashboard()}
      </div>
    </ErrorBoundary>
  );
};

export default DonorDashboard; 