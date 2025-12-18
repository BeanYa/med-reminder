const database = require('../src/database/database');

async function initDatabase() {
  try {
    console.log('Initializing database...');
    await database.init();
    console.log('Database initialized successfully!');
    database.close();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    process.exit(1);
  }
}

initDatabase();