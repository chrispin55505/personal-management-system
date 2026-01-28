const mysql = require('mysql2/promise');
require('dotenv').config();

// Database configuration for Railway.app
const dbConfig = {
    host: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST : 
        process.env.DB_HOST || 'localhost',
    user: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_MYSQL_USER || process.env.DB_USER : 
        process.env.DB_USER || 'root',
    password: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_MYSQL_PASSWORD || process.env.DB_PASSWORD : 
        process.env.DB_PASSWORD || '',
    database: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.DB_NAME : 
        process.env.DB_NAME || 'railway',
    port: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_MYSQL_PORT || process.env.DB_PORT || 3306 : 
        process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: process.env.RAILWAY_ENVIRONMENT ? { rejectUnauthorized: false } : false
};

const pool = mysql.createPool(dbConfig);

// Test connection
async function testConnection() {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully');
        console.log(`📊 Database: ${dbConfig.database}`);
        console.log(`🌐 Host: ${dbConfig.host}`);
        console.log(`🔌 Port: ${dbConfig.port}`);
        console.log(`👤 User: ${dbConfig.user}`);
        
        // Test if tables exist
        const [tables] = await connection.execute("SHOW TABLES");
        if (tables.length === 0) {
            console.log('⚠️  No tables found. Please run the init-schema.sql script in Railway MySQL Query tab.');
        } else {
            console.log(`✅ Found ${tables.length} tables in database`);
        }
        
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.log('🔧 Troubleshooting steps:');
        console.log('   1. Ensure MySQL service is added in Railway');
        console.log('   2. Check Railway environment variables');
        console.log('   3. Run init-schema.sql script in Railway MySQL Query tab');
        
        if (process.env.RAILWAY_ENVIRONMENT) {
            console.log('🚂 Railway Environment Variables:');
            console.log(`   RAILWAY_PRIVATE_HOST: ${process.env.RAILWAY_PRIVATE_HOST || 'NOT SET'}`);
            console.log(`   RAILWAY_MYSQL_USER: ${process.env.RAILWAY_MYSQL_USER || 'NOT SET'}`);
            console.log(`   RAILWAY_MYSQL_DATABASE_NAME: ${process.env.RAILWAY_MYSQL_DATABASE_NAME || 'NOT SET'}`);
        }
    }
}

module.exports = {
    pool,
    testConnection
};
