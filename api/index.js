const app = require('../src/app');
const connectDB = require('../src/config/db');

const isHealthPath = (url = '') => {
  const path = url.split('?')[0];
  return path === '/health' || path === '/api/health';
};

module.exports = async (req, res) => {
  try {
    const path = req.url || '';

    if (isHealthPath(path)) {
      console.log('Health route reached (Vercel):', path);
      return app(req, res);
    }

    await connectDB();
    return app(req, res);
  } catch (error) {
    console.error('Vercel function error:', error.message);

    return res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message,
    });
  }
};
