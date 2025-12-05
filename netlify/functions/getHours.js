// getHours.js
const { getDb } = require('./db');
const { getUserFromAuthHeader } = require('./auth');

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
    const hoursCol = db.collection('hours');

    const docs = await hoursCol
      .find({ userId: user.userId })
      .sort({ date: -1 })
      .limit(100)
      .toArray();

    return { statusCode: 200, body: JSON.stringify(docs) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
