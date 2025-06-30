import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DonorRegistration from './components/DonorRegistration';
import DonorDashboard from './components/DonorDashboard';
import DonorLogin from './components/DonorLogin';
import EmergencySOS from './components/EmergencySOS';
import './App.css';

function App() {
  const handleBloodBankClick = (e) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Open Google Maps with search for nearby blood banks
          window.open(
            `https://www.google.com/maps/search/blood+bank/@${latitude},${longitude},15z`,
            '_blank'
          );
        },
        (error) => {
          // If geolocation fails, open Google Maps with a general blood bank search
          window.open('https://www.google.com/maps/search/blood+bank', '_blank');
        }
      );
    } else {
      // If geolocation is not supported, open Google Maps with a general blood bank search
      window.open('https://www.google.com/maps/search/blood+bank', '_blank');
    }
  };

  return (
    <Router>
      <div className="app">
        <nav className="navbar">
          <div className="container">
            <Link to="/" className="logo">LifeLink</Link>
            <div className="nav-links">
              <Link to="/donor/login" className="nav-link">Donor</Link>
              <a href="#" onClick={handleBloodBankClick} className="nav-link">Blood Bank</a>
              <Link to="/emergency" className="nav-link">Emergency SOS</Link>
            </div>
          </div>
        </nav>

        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/donor/register" element={<DonorRegistration />} />
            <Route path="/donor/login" element={<DonorLogin />} />
            <Route path="/donor/dashboard" element={<DonorDashboard />} />
            <Route path="/emergency" element={<EmergencySOS />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function Home() {
  const handleBloodBankClick = (e) => {
    e.preventDefault();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          // Open Google Maps with search for nearby blood banks
          window.open(
            `https://www.google.com/maps/search/blood+bank/@${latitude},${longitude},15z`,
            '_blank'
          );
        },
        (error) => {
          // If geolocation fails, open Google Maps with a general blood bank search
          window.open('https://www.google.com/maps/search/blood+bank', '_blank');
        }
      );
    } else {
      // If geolocation is not supported, open Google Maps with a general blood bank search
      window.open('https://www.google.com/maps/search/blood+bank', '_blank');
    }
  };

  return (
    <div className="hero">
      <h1>Welcome to LifeLink</h1>
      <p>Connecting blood donors with those in need</p>
      <div className="cta-buttons">
        <Link to="/donor/login" className="btn btn-primary">I Want to Donate</Link>
        <a href="#" onClick={handleBloodBankClick} className="btn btn-secondary">Blood Bank</a>
        <Link to="/emergency" className="btn btn-danger">Emergency SOS</Link>
      </div>
    </div>
  );
}

export default App;
