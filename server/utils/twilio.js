const twilio = require('twilio');

async function sendSMS(to, body) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_PHONE_NUMBER;
  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('Twilio credentials are not set in environment variables');
  }
  const client = twilio(accountSid, authToken);
  return client.messages.create({
    body,
    from: fromNumber,
    to
  });
}

module.exports = { sendSMS }; 