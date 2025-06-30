# LifeLink

LifeLink is a blood donation management system that connects blood donors with recipients in need. The application provides a platform for blood donation requests, donor registration, and emergency blood requests.

## Features

- User Authentication (Login/Register)
- Blood Donor Registration
- Emergency Blood Requests
- Donor List Management
- SMS Notification System
- Blood Group Matching
- Location-based Search

## Tech Stack

- Frontend: React.js with Vite
- Backend: Node.js with Express
- Database: MongoDB
- SMS Integration: Twilio API

## Prerequisites

- Node.js (v18 or higher)
- MongoDB
- Twilio Account (for SMS functionality)
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/olivechaitanya/LifeLink.git
```

2. Install Backend Dependencies:
```bash
cd backend
npm install
```

3. Install Frontend Dependencies:
```bash
cd ../frontend
npm install
```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:

```env
MONGODB_URI=your_mongodb_connection_string
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_PHONE_NUMBER=your_twilio_phone_number
```

## Running the Application

1. Start the Backend Server:
```bash
cd backend
node server.js
```

2. Start the Frontend Development Server:
```bash
cd frontend
npm run dev
```

## Project Structure

```
LifeLink/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   └── server.js
├── frontend/
│   ├── public/
│   └── src/
│       ├── components/
│       ├── pages/
│       └── App.jsx
└── README.md
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
