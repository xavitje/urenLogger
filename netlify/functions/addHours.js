// addHours.js
const { getDb } = require('./db');
const { getUserFromAuthHeader } = require('./auth');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const user = getUserFromAuthHeader(event.headers);
  if (!user) {
    return { statusCode: 401, body: JSON.stringify({ error: 'Unauthorized' }) };
  }

  try {
    const { date, hours, description } = JSON.parse(event.body || '{}');

    if (!date || typeof hours !== 'number') {
      return { statusCode: 400, body: JSON.stringify({ error: 'Datum en uren vereist' }) };
    }

    const db = await getDb();
    const hoursCol = db.collection('hours');

    await hoursCol.insertOne({
      userId: user.userId,
      date: new Date(date),
      hours,
      description: description || '',
      createdAt: new Date()
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
