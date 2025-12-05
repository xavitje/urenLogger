// login.js
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('./db');
const { ObjectId } = require('mongodb');

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

    const user = await users.findOne({ email });
    if (!user) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Ongeldige login' }) };
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return { statusCode: 401, body: JSON.stringify({ error: 'Ongeldige login' }) };
    }

    const token = jwt.sign(
      { userId: user._id.toString(), email: user.email },
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
