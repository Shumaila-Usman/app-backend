require('dotenv').config();
const app = require('./app');
const connectDB = require('./config/db');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`SiteLedger API running on port ${PORT}`);
      console.log(`Health: http://localhost:${PORT}/health`);
      console.log(`API health: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    console.error('Failed to start local server:', error.message);
    process.exit(1);
  }
};

startServer();
