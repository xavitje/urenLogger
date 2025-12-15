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
    // Vang start- en eindtijd op
    const { date, startTime, endTime, description } = JSON.parse(event.body || '{}');

    if (!date || !startTime || !endTime) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Datum, start- en eindtijd zijn vereist' }) };
    }

    // Parse tijden (formaat: "HH:MM")
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startTotalMin = startHour * 60 + startMin;
    const endTotalMin = endHour * 60 + endMin;
    
    // Controleer of de eindtijd na de starttijd is
    if (endTotalMin <= startTotalMin) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Eindtijd moet na starttijd liggen' }) };
    }
    
    // Bereken uren (verschil in minuten / 60)
    const hours = parseFloat(((endTotalMin - startTotalMin) / 60).toFixed(2));

    const db = await getDb();
    const hoursCol = db.collection('hours');

    await hoursCol.insertOne({
      userId: user.userId,
      date: new Date(date),
      startTime: startTime,
      endTime: endTime,
      hours: hours,
      description: description || '',
      createdAt: new Date()
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};