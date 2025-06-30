import axios from 'axios';
import dotenv from 'dotenv';
dotenv.config();

const FAST2SMS_API_KEY = process.env.FAST2SMS_API_KEY;

if (!FAST2SMS_API_KEY) {
  console.error('FAST2SMS_API_KEY is not set in environment variables');
}

export const sendSMS = async (to, message) => {
  try {
    if (!FAST2SMS_API_KEY) {
      throw new Error('Fast2SMS API key is not configured');
    }

    if (!to || !message) {
      throw new Error('Phone number and message are required');
    }

    // Format phone number to ensure it's 10 digits
    const formattedNumber = to.toString().replace(/\D/g, '').slice(-10);
    if (formattedNumber.length !== 10) {
      throw new Error('Invalid phone number format. Must be 10 digits.');
    }

    console.log('Sending SMS via Fast2SMS:', {
      to: formattedNumber,
      messageLength: message.length,
      apiKey: FAST2SMS_API_KEY ? 'Present' : 'Missing'
    });

    // Using the latest API endpoint and format
    const response = await axios({
      method: 'POST',
      url: 'https://www.fast2sms.com/dev/bulkV2',
      headers: {
        'authorization': FAST2SMS_API_KEY,
        'Content-Type': 'application/json'
      },
      data: {
        // route: 'v3',
        route: 'q',
        sender_id: 'TXTIND',
        message: message,
        language: 'english',
        flash: 0,
        numbers: formattedNumber
      }
    });

    console.log('Fast2SMS API Response:', response.data);

    if (response.data.return === true) {
      console.log('SMS sent successfully:', response.data);
      return response.data;
    } else {
      const errorMessage = response.data.message || 'Unknown error';
      console.error('Fast2SMS API Error:', {
        status: response.data.status_code,
        message: errorMessage,
        response: response.data
      });
      throw new Error(`Failed to send SMS: ${errorMessage}`);
    }
  } catch (error) {
    console.error('Error sending SMS:', {
      message: error.message,
      response: error.response?.data,
      status: error.response?.status,
      stack: error.stack
    });
    throw error;
  }
}; 