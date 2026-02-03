// getSettings.js
const { getDb } = require('./db');
const { getUserFromAuthHeader } = require('./auth');
const { ObjectId } = require('mongodb');

// Standaardwaarden voor het geval ze niet in de DB staan
const DEFAULT_HOURLY_RATE = 16.35;
const DEFAULT_KM_RATE = 0.23;

exports.handler = async (event) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = getUserFromAuthHeader(event.headers);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const db = await getDb();
    const usersCol = db.collection('users');

    const dbUser = await usersCol.findOne({ _id: new ObjectId(user.userId) });

    if (!dbUser) {
        return { statusCode: 404, body: JSON.stringify({ error: 'User not found' }) };
    }

    const settings = {
        hourlyRate: dbUser.hourlyRate || DEFAULT_HOURLY_RATE,
        kmRate: dbUser.kmRate || DEFAULT_KM_RATE,
    };

    return {
      statusCode: 200,
      body: JSON.stringify(settings)
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};