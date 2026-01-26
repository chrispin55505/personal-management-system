-- Railway.app Database Initialization Script
-- Run this script in Railway MySQL Query tab after deployment

-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS personal_management;
USE personal_management;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default user for Railway deployment
INSERT IGNORE INTO users (username, email, password) VALUES 
('chrispin', 'chrispingolden@gmail.com', '@nzali2006');

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    credits INT DEFAULT 0,
    semester VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    exam_name VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    venue VARCHAR(100),
    module_code VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Marks table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    module_code VARCHAR(20) NOT NULL,
    assessment_type VARCHAR(50) NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL,
    total_marks DECIMAL(5,2) NOT NULL,
    percentage DECIMAL(5,2) GENERATED ALWAYS AS (marks_obtained / total_marks * 100) STORED,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Money table
CREATE TABLE IF NOT EXISTS money (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    person_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    type ENUM('lent', 'borrowed') NOT NULL,
    date_given DATE NOT NULL,
    date_returned DATE,
    status ENUM('pending', 'returned') DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Savings table
CREATE TABLE IF NOT EXISTS savings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    week_number INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date_saved DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    title VARCHAR(100) NOT NULL,
    description TEXT,
    appointment_date DATETIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    location VARCHAR(100),
    status ENUM('scheduled', 'completed', 'cancelled') DEFAULT 'scheduled',
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Journeys table
CREATE TABLE IF NOT EXISTS journeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    destination VARCHAR(100) NOT NULL,
    purpose VARCHAR(100),
    departure_date DATETIME NOT NULL,
    return_date DATETIME,
    estimated_cost DECIMAL(10,2),
    actual_cost DECIMAL(10,2),
    transport_mode VARCHAR(50),
    status ENUM('planned', 'ongoing', 'completed') DEFAULT 'planned',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Activities table
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    related_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_modules_user_id ON modules(user_id);
CREATE INDEX IF NOT EXISTS idx_timetable_user_id ON timetable(user_id);
CREATE INDEX IF NOT EXISTS idx_marks_user_id ON marks(user_id);
CREATE INDEX IF NOT EXISTS idx_money_user_id ON money(user_id);
CREATE INDEX IF NOT EXISTS idx_savings_user_id ON savings(user_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_journeys_user_id ON journeys(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);

-- Success message
SELECT 'Database schema initialized successfully!' as message;
