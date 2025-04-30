const db = require('../models');
const { sendSMS } = require('../utils/twilio');
const cron = require('node-cron');
const { Op } = require('sequelize');

const Reminder = db.Reminder;

function getNextDueDate(current, recurrence, recurrenceRule) {
  const date = new Date(current);
  switch (recurrence) {
    case 'daily':
      date.setDate(date.getDate() + 1);
      break;
    case 'weekly':
      date.setDate(date.getDate() + 7);
      break;
    case 'monthly':
      date.setMonth(date.getMonth() + 1);
      break;
    case 'custom':
      // recurrenceRule: e.g., "3d" for every 3 days
      if (recurrenceRule && recurrenceRule.endsWith('d')) {
        const days = parseInt(recurrenceRule);
        date.setDate(date.getDate() + (isNaN(days) ? 1 : days));
      }
      break;
    default:
      return null;
  }
  return date;
}

async function processRecurringReminders() {
  const now = new Date();
  const reminders = await Reminder.findAll({
    where: {
      recurrence: { [Op.not]: 'none' },
      isDone: false,
      dueDate: { [Op.lte]: now },
    },
  });
  for (const reminder of reminders) {
    // Create next instance
    const nextDueDate = getNextDueDate(reminder.dueDate, reminder.recurrence, reminder.recurrenceRule);
    if (!nextDueDate) continue;
    await Reminder.create({
      clientId: reminder.clientId,
      practitionerId: reminder.practitionerId,
      alertId: reminder.alertId,
      type: reminder.type,
      message: reminder.message,
      dueDate: nextDueDate,
      recurrence: reminder.recurrence,
      recurrenceRule: reminder.recurrenceRule,
      phoneNumber: reminder.phoneNumber,
      isDone: false,
      sent: false,
    });
    // Mark original as done
    reminder.isDone = true;
    await reminder.save();
    // Send SMS for the new reminder
    try {
      await sendSMS(reminder.phoneNumber, reminder.message);
      console.log(`Sent recurring SMS to ${reminder.phoneNumber} for reminder ${reminder.id}`);
    } catch (err) {
      console.error('Failed to send recurring SMS:', err);
    }
  }
}

// Run every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Running recurring reminders job...');
  processRecurringReminders();
});

// For manual run
if (require.main === module) {
  processRecurringReminders().then(() => {
    console.log('Manual recurring reminders run complete.');
    process.exit(0);
  });
} 