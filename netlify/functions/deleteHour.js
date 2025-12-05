// deleteHour.js
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
    const { id } = JSON.parse(event.body || '{}');

    if (!id) {
      return { statusCode: 400, body: JSON.stringify({ error: 'ID is vereist voor verwijdering' }) };
    }

    const db = await getDb();
    const hoursCol = db.collection('hours');

    // Verwijder het document. 
    // Zorg ervoor dat alleen documenten van de ingelogde gebruiker verwijderd kunnen worden.
    const result = await hoursCol.deleteOne({
      _id: new ObjectId(id),
      userId: user.userId
    });

    if (result.deletedCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: 'Registratie niet gevonden of niet geautoriseerd' }) };
    }

    return { statusCode: 200, body: JSON.stringify({ success: true, deletedCount: result.deletedCount }) };
  } catch (err) {
    console.error(err);
    // Vang ongeldige ObjectId-fouten op
    if (err.name === 'BSONTypeError' || err.message.includes('invalid id')) {
        return { statusCode: 400, body: JSON.stringify({ error: 'Ongeldige registratie ID' }) };
    }
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error tijdens verwijdering' }) };
  }
};