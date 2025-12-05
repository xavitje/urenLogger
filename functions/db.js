// db.js
const { MongoClient } = require('mongodb');

let client = null;
let db = null;

async function getDb() {
  if (db) return db;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');

  client = new MongoClient(uri);
  if (!client.topology?.isConnected?.()) {
    await client.connect();
  }
  db = client.db('urenLogger');
  return db;
}

module.exports = { getDb };
// mongodb+srv://rafielidrissi_db_user:rafi2506@urenlogs.hvewub6.mongodb.net/?appName=urenLogs