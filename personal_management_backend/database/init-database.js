const mysql = require('mysql2/promise');
require('dotenv').config();

async function initializeDatabase() {
    let pool;
    
    try {
        // Create connection without database specified
        pool = mysql.createPool({
            host: process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST || 'localhost',
            user: process.env.RAILWAY_MYSQL_USER || process.env.DB_USER || 'root',
            password: process.env.RAILWAY_MYSQL_PASSWORD || process.env.DB_PASSWORD || '',
            port: process.env.RAILWAY_MYSQL_PORT || 3306,
            ssl: process.env.RAILWAY_ENVIRONMENT ? { 
                rejectUnauthorized: false,
                mode: 'REQUIRED'
            } : (process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false),
            connectTimeout: 10000,
            charset: 'utf8mb4'
            // Removed invalid options: acquireTimeout, reconnect
        });

        console.log('🔧 Initializing database...');
        console.log('🔗 Host:', process.env.RAILWAY_PRIVATE_HOST || process.env.DB_HOST);
        console.log('👤 User:', process.env.RAILWAY_MYSQL_USER || process.env.DB_USER);

        // Create database if not exists
        const dbName = process.env.RAILWAY_MYSQL_DATABASE_NAME || process.env.DB_NAME || 'railway';
        await pool.execute(`CREATE DATABASE IF NOT EXISTS ${dbName}`);
        await pool.execute(`USE ${dbName}`);

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
        console.log('🔧 Running in mock mode (without database)');
        return false;
    } finally {
        if (pool) {
            await pool.end();
        }
    }
}

module.exports = { initializeDatabase };
