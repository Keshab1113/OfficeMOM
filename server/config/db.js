// config/db.js - Optimized for production with proper connection management

const mysql = require("mysql2");
const dotenv = require("dotenv");

dotenv.config();

// ✅ Optimized connection pool configuration
const pool = mysql.createPool({
  // Connection settings
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,

  // ✅ Connection pool settings (optimized for production)
  connectionLimit: 50,              // Increased for high concurrency
  waitForConnections: true,         // Queue connections when limit reached
  queueLimit: 100,                  // Limit queue to prevent memory issues

  // ✅ Keep-alive settings (prevents ETIMEDOUT)
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000,    // 10 seconds

  // ✅ Connection timeout settings
  connectTimeout: 20000,            // 20 seconds to establish connection
  acquireTimeout: 20000,            // 20 seconds to acquire from pool
  timeout: 60000,                   // 60 seconds query timeout

  // ✅ Date and timezone settings
  dateStrings: true,
  timezone: "Z",                    // UTC timezone

  // ✅ Additional optimizations
  multipleStatements: false,        // Security: prevent SQL injection
  namedPlaceholders: false,         // Use ? placeholders only

  // ✅ Charset settings
  charset: 'utf8mb4',               // Support emojis and special characters
});

// ✅ Connection pool event handlers for monitoring
pool.on('connection', (connection) => {
  console.log('✅ New database connection established:', connection.threadId);
});

pool.on('acquire', (connection) => {
  console.log('📊 Connection %d acquired', connection.threadId);
});

pool.on('release', (connection) => {
  console.log('📤 Connection %d released', connection.threadId);
});

pool.on('enqueue', () => {
  console.log('⏳ Waiting for available connection slot');
});

// ✅ Graceful shutdown handler
process.on('SIGINT', async () => {
  console.log('\n🔴 Closing database connection pool...');
  try {
    await pool.end();
    console.log('✅ Database connection pool closed');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error closing database pool:', err);
    process.exit(1);
  }
});

// ✅ Test connection on startup
const testConnection = async () => {
  try {
    const connection = await pool.promise().getConnection();
    console.log('✅ Database connection test successful');
    connection.release();
  } catch (err) {
    console.error('❌ Database connection test failed:', err);
    throw err;
  }
};

// Run test connection
testConnection();

// ✅ Export promisified pool
const promisePool = pool.promise();

// ✅ Add helper method to check pool status
promisePool.getPoolStatus = () => {
  return {
    totalConnections: pool._allConnections.length,
    freeConnections: pool._freeConnections.length,
    queueLength: pool._connectionQueue.length,
  };
};

module.exports = promisePool;