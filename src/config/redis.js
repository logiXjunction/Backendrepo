const redis = require('redis');

let redisClient;

const baseConfig = {
  socket: {
    reconnectStrategy: (retries) => {
      // retries = number of attempts so far
      const delay = Math.min(retries * 100, 3000); // max 3s

      console.log(`🔁 Redis reconnect attempt #${retries}, retrying in ${delay}ms`);

      // After too many retries, keep retrying but slower
      return delay;
    },
  },
};

if (process.env.NODE_ENV === 'production') {
  // Production (Upstash / managed Redis)
  redisClient = redis.createClient({
    ...baseConfig,
    url: process.env.REDIS_URL,
  });
} else {
  // Development (Docker Redis)
  redisClient = redis.createClient({
    ...baseConfig,
    socket: {
      ...baseConfig.socket,
      host: process.env.REDIS_HOST || 'redis',
      port: process.env.REDIS_PORT || 6379,
    },
  });
}

/* ---------------- Redis Events ---------------- */

redisClient.on('connect', () => {
  console.log('🟡 Redis connecting...');
});

redisClient.on('ready', () => {
  console.log('🟢 Redis ready');
});

redisClient.on('end', () => {
  console.warn('⚠️ Redis connection closed');
});

redisClient.on('error', (err) => {
  console.error('🔴 Redis error:', err.message);
});

/* ---------------- Initial connect ---------------- */

(async () => {
  try {
    if (!redisClient.isOpen) {
      await redisClient.connect();
      console.log('🚀 Redis initial connection successful');
    }
  } catch (err) {
    console.error('❌ Initial Redis connection failed, will retry automatically');
  }
})();

module.exports = { redisClient };
