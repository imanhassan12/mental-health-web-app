const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

async function sendSMS(to, body) {
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials are not set in environment variables');
  }
  return client.messages.create({
    body,
    from: fromNumber,
    to
  });
}

module.exports = { sendSMS }; 