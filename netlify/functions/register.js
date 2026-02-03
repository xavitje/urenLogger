// register.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');

// Standaardwaarden voor nieuwe gebruikers
const DEFAULT_HOURLY_RATE = 16.35;
const DEFAULT_KM_RATE = 0.23;
const DEFAULT_KM_RANGE = 62;

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  try {
    const { email, password } = JSON.parse(event.body || '{}');

    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Email en wachtwoord vereist' }) };
    }

    const db = await getDb();
    const users = db.collection('users');

    const existing = await users.findOne({ email });
    if (existing) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Gebruiker bestaat al' }) };
    }

    const hash = await bcrypt.hash(password, 10);

    const result = await users.insertOne({
      email,
      passwordHash: hash,
      hourlyRate: DEFAULT_HOURLY_RATE, // Standaard uurloon
      kmRate: DEFAULT_KM_RATE,         // Standaard km-vergoeding
      kmRange: DEFAULT_KM_RANGE,       // Standaard aantal kilometers
      createdAt: new Date()
    });

    const token = jwt.sign(
      { userId: result.insertedId.toString(), email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
