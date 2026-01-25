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
        process.env.DB_NAME || 'personal_management',
    port: process.env.RAILWAY_ENVIRONMENT ? 
        process.env.RAILWAY_MYSQL_PORT || 3306 : 
        3306,
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
        console.log('Database connected successfully');
        console.log(`Database: ${dbConfig.database}`);
        console.log(`Host: ${dbConfig.host}`);
        connection.release();
    } catch (error) {
        console.error('Database connection failed:', error.message);
        console.log('Please check your database configuration');
    }
}

module.exports = {
    pool,
    testConnection
};
