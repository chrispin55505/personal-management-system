-- Personal Management Database Schema
-- Create database if it doesn't exist
CREATE DATABASE IF NOT EXISTS railway;
USE railway;

-- Users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Modules table
CREATE TABLE IF NOT EXISTS modules (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    lecturer VARCHAR(100),
    semester INT NOT NULL,
    year INT NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Exam Timetable table
CREATE TABLE IF NOT EXISTS timetable (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_code VARCHAR(20) NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    exam_date DATE NOT NULL,
    exam_time TIME NOT NULL,
    venue VARCHAR(100),
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- CA Marks table
CREATE TABLE IF NOT EXISTS marks (
    id INT AUTO_INCREMENT PRIMARY KEY,
    module_id INT NOT NULL,
    module_name VARCHAR(100) NOT NULL,
    lecturer VARCHAR(100),
    category ENUM('group-assignment', 'individual-assignment', 'test01', 'test02', 'presentation') NOT NULL,
    marks DECIMAL(5,2) NOT NULL,
    marks_date DATE NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (module_id) REFERENCES modules(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Money Records table
CREATE TABLE IF NOT EXISTS money_records (
    id INT AUTO_INCREMENT PRIMARY KEY,
    person_name VARCHAR(100) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    borrow_date DATE NOT NULL,
    expected_return_date DATE,
    status ENUM('pending', 'returned', 'cancelled') DEFAULT 'pending',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Savings table
CREATE TABLE IF NOT EXISTS savings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    amount DECIMAL(10,2) NOT NULL,
    savings_date DATE NOT NULL,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Appointments table
CREATE TABLE IF NOT EXISTS appointments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    place VARCHAR(100),
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    aim TEXT,
    notification ENUM('2hours', '1day', '30min', 'none') DEFAULT 'none',
    status ENUM('upcoming', 'completed', 'cancelled') DEFAULT 'upcoming',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Journeys table
CREATE TABLE IF NOT EXISTS journeys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    journey_from VARCHAR(100) NOT NULL,
    journey_to VARCHAR(100) NOT NULL,
    journey_date DATE NOT NULL,
    journey_time TIME DEFAULT '00:00:00',
    transport_cost DECIMAL(10,2) DEFAULT 0,
    food_cost DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (transport_cost + food_cost) STORED,
    status ENUM('pending', 'completed', 'cancelled') DEFAULT 'pending',
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Activities table for tracking recent activities
CREATE TABLE IF NOT EXISTS activities (
    id INT AUTO_INCREMENT PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL,
    activity_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Insert default admin user (password: @nzali2006)
INSERT IGNORE INTO users (id, username, password, email) VALUES (1, 'chrispin', '@nzali2006', 'chrispingolden@gmail.com');
INSERT IGNORE INTO users (id, username, password) VALUES (2, 'user', 'user123');

-- Insert sample data (optional)
-- Sample modules
INSERT IGNORE INTO modules (id, code, name, lecturer, semester, year, user_id) VALUES 
(1, 'IT101', 'Introduction to IT', 'Dr. James', 1, 1, 1),
(2, 'CS201', 'Data Structures', 'Prof. Sarah', 2, 2, 1),
(3, 'NET301', 'Computer Networks', 'Dr. Michael', 1, 3, 1);

-- Sample appointments
INSERT IGNORE INTO appointments (id, name, place, appointment_date, appointment_time, aim, notification, status, user_id) VALUES 
(1, 'Meeting with Supervisor', 'University Campus', DATE_ADD(CURDATE(), INTERVAL 1 DAY), '10:00:00', 'Discuss final year project', '2hours', 'upcoming', 1),
(2, 'Dentist Appointment', 'City Hospital', DATE_ADD(CURDATE(), INTERVAL 2 DAY), '14:30:00', 'Regular checkup', '1day', 'upcoming', 1);

-- Sample journeys
INSERT IGNORE INTO journeys (id, journey_from, journey_to, journey_date, journey_time, transport_cost, food_cost, status, user_id) VALUES 
(1, 'Dar es Salaam', 'Arusha', DATE_ADD(CURDATE(), INTERVAL 3 DAY), '08:00:00', 45000.00, 15000.00, 'pending', 1);

-- Sample money records
INSERT IGNORE INTO money_records (id, person_name, amount, borrow_date, expected_return_date, status, user_id) VALUES 
(1, 'John Peter', 150000.00, '2023-10-15', '2023-12-15', 'pending', 1),
(2, 'Mary Joseph', 80000.00, '2023-11-01', NULL, 'pending', 1);

-- Sample savings
INSERT IGNORE INTO savings (id, amount, savings_date, user_id) VALUES 
(1, 50000.00, '2023-11-10', 1),
(2, 45000.00, '2023-11-17', 1);

-- Sample marks
INSERT IGNORE INTO marks (id, module_id, module_name, lecturer, category, marks, marks_date, user_id) VALUES 
(1, 1, 'Introduction to IT', 'Dr. James', 'test01', 85.00, '2023-10-20', 1),
(2, 2, 'Data Structures', 'Prof. Sarah', 'group-assignment', 92.00, '2023-11-05', 1);

-- Sample timetable
INSERT IGNORE INTO timetable (id, module_code, module_name, exam_date, exam_time, venue, user_id) VALUES 
(1, 'IT101', 'Introduction to IT', '2023-12-10', '09:00:00', 'Room 101', 1),
(2, 'CS201', 'Data Structures', '2023-12-12', '14:00:00', 'Room 203', 1);
