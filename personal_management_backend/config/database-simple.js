const mysql = require('mysql2/promise');
require('dotenv').config();

// Use the same working configuration as the main database.js
const dbConfig = {
    host: 'mysql.railway.internal',
    user: 'root',
    password: 'ELgFXlNvQaWYcgqOjqRHrHrRxwGhnKMn',
    database: 'railway',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: { rejectUnauthorized: false },
    connectTimeout: 10000,
    charset: 'utf8mb4'
};

const pool = mysql.createPool(dbConfig);

// Simple connection test
async function testConnection() {
    try {
        console.log('🔧 Attempting database connection...');
        console.log('🌐 Host:', process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST || 'localhost');
        console.log('👤 User:', process.env.RAILWAY_MYSQL_USER || process.env.DB_USER || 'root');
        console.log('🗄️  Database:', process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.DB_NAME || 'railway');
        console.log('🔌 Port:', process.env.RAILWAY_MYSQL_PORT || process.env.DB_PORT || 3306);
        console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No');
        console.log('🔒 SSL:', process.env.RAILWAY_ENVIRONMENT ? 'Enabled' : 'Disabled');
        
        const connection = await pool.getConnection();
        console.log('✅ Database connected successfully!');
        
        // Test a simple query
        const [rows] = await connection.execute('SELECT 1 as test');
        console.log('✅ Database query test passed:', rows[0]);
        
        connection.release();
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        console.error('🔍 Error code:', error.code);
        console.error('📍 Error number:', error.errno);
        console.error('🔗 SQL state:', error.sqlState);
        
        // Provide specific troubleshooting based on error
        if (error.code === 'ECONNREFUSED') {
            console.error('🚨 Connection refused - Check if MySQL is running and accessible');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🚨 Host not found - Check database hostname');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🚨 Access denied - Check database credentials');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🚨 Database not found - Run schema setup script');
        }
        
        return false;
    }
}

module.exports = {
    pool,
    testConnection
};
