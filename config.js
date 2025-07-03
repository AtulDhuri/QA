module.exports = {
  JWT_SECRET: process.env.JWT_SECRET || 'your_long_random_jwt_secret_here',
  REFRESH_SECRET: process.env.REFRESH_SECRET || 'your_long_random_refresh_secret_here'
}; 