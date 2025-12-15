// updateHour.js
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
    const { id, date, startTime, endTime, description } = JSON.parse(event.body || '{}');

    if (!id || !date || !startTime || !endTime) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ID, datum, start- en eindtijd zijn vereist' }) };
    }

    // Parse tijden om uren te berekenen
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    if (endTotalMin <= startTotalMin) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Eindtijd moet na starttijd liggen' }) };
    }
    
    const hours = parseFloat(((endTotalMin - startTotalMin) / 60).toFixed(2));

    const db = await getDb();
    const hoursCol = db.collection('hours');

    const result = await hoursCol.updateOne(
      { _id: new ObjectId(id), userId: user.userId },
      {
        $set: {
          date: new Date(date),
          startTime: startTime,
          endTime: endTime,
          hours: hours,
          description: description || '',
          updatedAt: new Date()
        }
      }
    );

    if (result.matchedCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Niet gevonden of geen toegang' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
