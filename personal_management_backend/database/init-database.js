const mysql = require('mysql2/promise');
require('dotenv').config();

// Helper function to wait
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Retry function for database connection
async function retryDatabaseConnection(maxRetries = 5, delayMs = 3000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            console.log(`🔄 Database connection attempt ${attempt}/${maxRetries}...`);
            
            // Log all connection parameters (without password)
            let connectionConfig;
            
            // Try to parse Railway MySQL URL first
            if (process.env.RAILWAY_SERVICE_MYSQL_URL) {
                console.log('🔗 Found RAILWAY_SERVICE_MYSQL_URL, using as host...');
                const mysqlHost = process.env.RAILWAY_SERVICE_MYSQL_URL;
                console.log('🌐 MySQL Host:', mysqlHost);
                
                // Railway provides the host, but we need to get credentials from other variables
                connectionConfig = {
                    host: mysqlHost,
                    user: process.env.RAILWAY_MYSQL_USER || process.env.MYSQLUSER || 'root',
                    password: process.env.RAILWAY_MYSQL_PASSWORD || process.env.MYSQLPASSWORD || '@nzali2006',
                    port: process.env.RAILWAY_MYSQL_PORT || process.env.MYSQLPORT || 3306,
                    database: process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.MYSQL_DATABASE || 'railway',
                    ssl: { rejectUnauthorized: false },
                    connectTimeout: 10000,
                    charset: 'utf8mb4'
                };
                console.log('✅ Using Railway MySQL host with credentials');
            } else {
                // Fallback to individual environment variables
                connectionConfig = {
                    host: process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST || 'localhost',
                    user: process.env.RAILWAY_MYSQL_USER || process.env.DB_USER || 'root',
                    password: process.env.RAILWAY_MYSQL_PASSWORD || process.env.DB_PASSWORD || '@nzali2006',
                    port: process.env.RAILWAY_MYSQL_PORT || process.env.DB_PORT || 3306,
                    ssl: process.env.RAILWAY_ENVIRONMENT ? { 
                        rejectUnauthorized: false,
                        mode: 'REQUIRED'
                    } : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false),
                    connectTimeout: 10000,
                    charset: 'utf8mb4'
                };
            }
            
            console.log('🔧 Connection config:', {
                host: connectionConfig.host,
                user: connectionConfig.user,
                password: connectionConfig.password ? '[SET]' : '[NOT SET]',
                port: connectionConfig.port,
                database: connectionConfig.database || 'railway',
                ssl: connectionConfig.ssl ? 'ENABLED' : 'DISABLED',
                railwayEnv: process.env.RAILWAY_ENVIRONMENT ? 'YES' : 'NO',
                railwayMysqlUrl: process.env.RAILWAY_SERVICE_MYSQL_URL || 'NOT SET',
                // Show all potential credential variables
                railwayMysqlUser: process.env.RAILWAY_MYSQL_USER || 'NOT SET',
                mysqlUser: process.env.MYSQLUSER || 'NOT SET',
                railwayMysqlPassword: process.env.RAILWAY_MYSQL_PASSWORD ? '[SET]' : '[NOT SET',
                mysqlPassword: process.env.MYSQLPASSWORD ? '[SET]' : '[NOT SET]',
                railwayMysqlPort: process.env.RAILWAY_MYSQL_PORT || 'NOT SET',
                mysqlPort: process.env.MYSQLPORT || 'NOT SET',
                railwayMysqlDatabase: process.env.RAILWAY_MYSQL_DATABASE_NAME || 'NOT SET',
                mysqlDatabase: process.env.MYSQL_DATABASE || 'NOT SET'
            });
            
            const pool = mysql.createPool(connectionConfig);

            // Test connection
            const connection = await pool.getConnection();
            console.log('✅ Database connection established!');
            connection.release();
            
            return pool;
            
        } catch (error) {
            console.error(`❌ Attempt ${attempt} failed:`, {
                message: error.message,
                code: error.code,
                errno: error.errno,
                sqlState: error.sqlState,
                sqlMessage: error.sqlMessage,
                stack: error.stack
            });
            
            if (attempt === maxRetries) {
                throw error;
            }
            
            console.log(`⏳ Waiting ${delayMs}ms before retry...`);
            await sleep(delayMs);
        }
    }
}

async function initializeDatabase() {
    let pool;
    
    try {
        console.log('🔧 Starting database initialization...');
        console.log('🚂 Railway Environment:', process.env.RAILWAY_ENVIRONMENT ? 'Yes' : 'No');
        console.log('🔗 Host:', process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST);
        console.log('👤 User:', process.env.RAILWAY_MYSQL_USER || process.env.DB_USER);
        
        // Wait a bit for Railway services to be ready
        if (process.env.RAILWAY_ENVIRONMENT) {
            console.log('⏳ Waiting for Railway MySQL service to be ready...');
            await sleep(5000); // Wait 5 seconds for MySQL to start
        }
        
        // Try to connect with retries
        pool = await retryDatabaseConnection(5, 3000);

        // Create database if not exists
        let dbName;
        if (pool && pool.config && pool.config.database) {
            dbName = pool.config.database;
        } else {
            dbName = process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.DB_NAME || 'railway';
        }
        
        console.log(`📁 Using database: ${dbName}`);
        
        // Don't try to create database if we're using the one from Railway URL
        if (!process.env.RAILWAY_SERVICE_MYSQL_URL) {
            await pool.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
            await pool.execute(`USE ${dbName}`);
        }

        // Create tables
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                email VARCHAR(100),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS modules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                code VARCHAR(20) NOT NULL,
                name VARCHAR(100) NOT NULL,
                lecturer VARCHAR(100),
                semester INT NOT NULL,
                year INT NOT NULL,
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS timetable (
                id INT AUTO_INCREMENT PRIMARY KEY,
                module_code VARCHAR(20) NOT NULL,
                module_name VARCHAR(100) NOT NULL,
                exam_date DATE NOT NULL,
                exam_time TIME NOT NULL,
                venue VARCHAR(100),
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS money_records (
                id INT AUTO_INCREMENT PRIMARY KEY,
                person_name VARCHAR(100) NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                borrow_date DATE NOT NULL,
                expected_return_date DATE,
                status ENUM('pending', 'returned', 'cancelled') DEFAULT 'pending',
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS appointments (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                place VARCHAR(100),
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                aim TEXT,
                notification ENUM('2hours', '1day', '30min', 'none') DEFAULT 'none',
                status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS journeys (
                id INT AUTO_INCREMENT PRIMARY KEY,
                journey_from VARCHAR(100) NOT NULL,
                journey_to VARCHAR(100) NOT NULL,
                journey_date DATE NOT NULL,
                journey_time TIME DEFAULT '00:00:00',
                transport_cost DECIMAL(10,2) DEFAULT 0,
                food_cost DECIMAL(10,2) DEFAULT 0,
                total_cost DECIMAL(10,2) GENERATED ALWAYS AS (transport_cost + food_cost) STORED,
                status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS activities (
                id INT AUTO_INCREMENT PRIMARY KEY,
                description VARCHAR(255) NOT NULL,
                type VARCHAR(50) NOT NULL,
                status VARCHAR(20) NOT NULL,
                activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                user_id INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        // Create all tables
        for (const table of tables) {
            await pool.execute(table);
        }

        // Insert default user
        await pool.execute(
            'INSERT IGNORE INTO users (username, password, email) VALUES (?, ?, ?)',
            ['chrispin', '@nzali2006', 'chrispingolden@gmail.com']
        );

        console.log('✅ Database initialized successfully!');
        return true;

    } catch (error) {
        console.error('❌ Database initialization failed:', error.message);
        console.error('🔍 Error details:', {
            code: error.code,
            errno: error.errno,
            sqlState: error.sqlState,
            sqlMessage: error.sqlMessage
        });
        
        // Provide specific guidance based on error type
        if (error.code === 'ECONNREFUSED') {
            console.error('🚨 Connection refused - MySQL may not be running yet');
            console.error('💡 Solution: Wait a moment and retry, or check MySQL service');
        } else if (error.code === 'ENOTFOUND') {
            console.error('🚨 Host not found - Check database hostname configuration');
            console.error('💡 Solution: Verify RAILWAY_PRIVATE_HOST environment variable');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('🚨 Access denied - Check database credentials');
            console.error('💡 Solution: Verify RAILWAY_MYSQL_USER and RAILWAY_MYSQL_PASSWORD');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('🚨 Database error - May need manual schema setup');
            console.error('💡 Solution: Run schema.sql in Railway MySQL Query tab');
        }
        
        console.log('🔧 Running in mock mode (without database)');
        return false;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

module.exports = { initializeDatabase };
