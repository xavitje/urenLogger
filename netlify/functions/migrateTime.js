// migrateTime.js - Eenmalig script om oude Date tijden om te zetten naar HH:MM strings
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
    const db = await getDb();
    const hoursCol = db.collection('hours');

    // Haal alle records van de gebruiker op
    const allRecords = await hoursCol.find({ userId: user.userId }).toArray();
    
    let migratedCount = 0;
    let skippedCount = 0;

    for (const record of allRecords) {
      // Check of startTime en endTime al strings zijn in HH:MM formaat
      const isStartTimeString = typeof record.startTime === 'string' && record.startTime.match(/^\d{2}:\d{2}$/);
      const isEndTimeString = typeof record.endTime === 'string' && record.endTime.match(/^\d{2}:\d{2}$/);

      if (isStartTimeString && isEndTimeString) {
        skippedCount++;
        continue; // Al gemigreerd
      }

      // Converteer Date objecten naar HH:MM strings
      let newStartTime = record.startTime;
      let newEndTime = record.endTime;

      if (!isStartTimeString) {
        const startDate = new Date(record.startTime);
        const startHours = String(startDate.getUTCHours()).padStart(2, '0');
        const startMinutes = String(startDate.getUTCMinutes()).padStart(2, '0');
        newStartTime = `${startHours}:${startMinutes}`;
      }

      if (!isEndTimeString) {
        const endDate = new Date(record.endTime);
        const endHours = String(endDate.getUTCHours()).padStart(2, '0');
        const endMinutes = String(endDate.getUTCMinutes()).padStart(2, '0');
        newEndTime = `${endHours}:${endMinutes}`;
      }

      // Update het record
      await hoursCol.updateOne(
        { _id: record._id },
        {
          $set: {
            startTime: newStartTime,
            endTime: newEndTime,
            migratedAt: new Date()
          }
        }
      );

      migratedCount++;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        migrated: migratedCount,
        skipped: skippedCount,
        total: allRecords.length
      })
    };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: 'Server error' }) };
  }
};
