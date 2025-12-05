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

    // Combineer datum en tijd om Date objecten te maken
    // Zorg ervoor dat de tijd in UTC wordt opgeslagen om timezone problemen te voorkomen
    const startDateTime = new Date(`${date}T${startTime}:00Z`);
    const endDateTime = new Date(`${date}T${endTime}:00Z`);

    // Controleer of de eindtijd na de starttijd is
    if (endDateTime <= startDateTime) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Eindtijd moet na starttijd liggen' }) };
    }
    
    // Bereken het verschil in milliseconden
    const durationMs = endDateTime.getTime() - startDateTime.getTime();
    // Converteer naar uren met twee decimalen (bijv. 7.50)
    const hours = parseFloat((durationMs / (1000 * 60 * 60)).toFixed(2));

    const db = await getDb();
    const hoursCol = db.collection('hours');

    await hoursCol.insertOne({
      userId: user.userId,
      date: new Date(date), // Voor sortering, de datum zonder tijdstip
      startTime: startDateTime,
      endTime: endDateTime,
      hours: hours, // Het berekende aantal uren
      description: description || '',
      createdAt: new Date()
    });

    return { statusCode: 200, body: JSON.stringify({ success: true }) };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};