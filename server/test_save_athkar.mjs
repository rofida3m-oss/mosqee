import Database from './database.js';

(async () => {
  try {
    const db = new Database();
    await db.init();
    console.log('DB initialized in test script');

    const userId = 'u_test_1';
    const category = 'evening';
    const progress = { 'evening-1': 1 };
    const date = new Date().toISOString().split('T')[0];

    await db.saveAthkarLog(userId, category, progress, date);
    console.log('saveAthkarLog completed successfully');

    const log = await db.getAthkarLog(userId, date, category);
    console.log('Retrieved log:', log);
  } catch (err) {
    console.error('Test script error:', err);
  }
})();