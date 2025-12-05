// auth.js
const jwt = require('jsonwebtoken');
const { ObjectId } = require('mongodb');

function getUserFromAuthHeader(headers) {
  const authHeader = headers.authorization || headers.Authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;

  const token = authHeader.substring(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    return { userId: new ObjectId(payload.userId), email: payload.email };
  } catch (e) {
    return null;
  }
}

module.exports = { getUserFromAuthHeader };
