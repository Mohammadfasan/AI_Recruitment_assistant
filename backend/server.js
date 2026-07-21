// Triggering nodemon restart after env change
import env from './src/config/env.js';
import app from './app.js';
import connectDB from './src/config/db.js';

const PORT = env.port;

// Initialize Database connection and boot up server
const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`====================================================`);
      console.log(`Recruitment Assistant Backend running on port ${PORT}`);
      console.log(`Environment: ${env.nodeEnv}`);
      console.log(`====================================================`);
    });
  } catch (error) {
    console.error('CRITICAL: Server startup failed:', error.message);
    process.exit(1);
  }
};

startServer();
