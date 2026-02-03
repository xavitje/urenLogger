// updateSettings.js
const { getDb } = require('./db');
const { getUserFromAuthHeader } = require('./auth');
const { ObjectId } = require('mongodb');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = getUserFromAuthHeader(event.headers);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { hourlyRate, kmRate } = JSON.parse(event.body || '{}');

    if (typeof hourlyRate !== 'number' || typeof kmRate !== 'number') {
        return { statusCode: 400, body: JSON.stringify({ error: 'Uurloon en reiskostenvergoeding moeten getallen zijn.' }) };
    }

    if (hourlyRate < 0 || kmRate < 0) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Waardes mogen niet negatief zijn.' }) };
    }

    const db = await getDb();
    const usersCol = db.collection('users');

    const result = await usersCol.updateOne(
      { _id: new ObjectId(user.userId) },
      {
        $set: {
          hourlyRate: hourlyRate,
          kmRate: kmRate,
          settingsUpdatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Gebruiker niet gevonden' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};