const redis = require('redis');

let redisClient;

if (process.env.NODE_ENV === 'production') {
  // Production: Cloud Redis (Upstash / ElastiCache)
  redisClient = redis.createClient({
    url: process.env.REDIS_URL,
  });
} else {
  // Development: Redis in Docker
  redisClient = redis.createClient({
    socket: {
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
    },
  });
}

redisClient.on('error', (err) => {
  console.error('❌ Redis connection error:', err);
});

// Connect immediately
(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('✅ Connected to Redis');
    }
  } catch (err) {
    console.error('❌ Failed to connect to Redis:', err);
  }
})();

module.exports = { redisClient };
