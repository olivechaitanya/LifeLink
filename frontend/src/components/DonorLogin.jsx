import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const DonorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('http://localhost:5000/api/auth/login', formData);
      
      // Store the token and user data in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify({
        _id: response.data._id,
        fullName: response.data.fullName,
        email: response.data.email,
        bloodGroup: response.data.bloodGroup,
        isEligible: response.data.isEligible,
        isInDonorList: response.data.isInDonorList
      }));
      
      // Redirect to dashboard immediately
      navigate('/donor/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h2>Donor Login</h2>
        {error && <div className="error-message">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              required
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="auth-links">
          <p>
            Don't have an account?{' '}
            <Link to="/donor/register" className="link-primary">
              Register here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default DonorLogin; 