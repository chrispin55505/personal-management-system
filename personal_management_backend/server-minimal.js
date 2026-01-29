require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const mysql = require('mysql2/promise');
const { initializeDatabase } = require('./database/init-database');

const app = express();
const port = process.env.PORT || 6000;

// Basic middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, '../personal_management_frontend')));

// Session middleware
app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

// Database connection
let pool;
async function initDatabase() {
    try {
        // Initialize database and get the working pool
        pool = await initializeDatabase();
        
        if (pool) {
            const connection = await pool.getConnection();
            console.log('✅ Database connected successfully');
            connection.release();
            return true;
        } else {
            console.log('⚠️ Database connection failed, running without database');
            return false;
        }
    } catch (error) {
        console.log('⚠️ Database connection failed, running without database:', error.message);
        return false;
    }
}

// Initialize database
initDatabase();

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Simple authentication
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        
        // Default credentials for Railway deployment
        if ((username === 'chrispin' && password === '@nzali2006') || 
            (username === 'admin' && password === 'admin123')) {
            
            const user = { id: 1, username, email: 'user@example.com' };
            req.session.user = user;
            
            res.json({ 
                success: true, 
                message: 'Login successful',
                user 
            });
        } else {
            res.status(401).json({ 
                success: false, 
                message: 'Invalid credentials' 
            });
        }
    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: 'Logout successful' });
    });
});

app.get('/api/auth/status', (req, res) => {
    if (req.session.user) {
        res.json({ authenticated: true, user: req.session.user });
    } else {
        res.json({ authenticated: false });
    }
});

// Simple dashboard stats
app.get('/api/dashboard/stats', (req, res) => {
    res.json({
        moduleCount: 5,
        appointmentCount: 3,
        moneyOwed: 150000,
        journeyCount: 2
    });
});

// Basic CRUD endpoints (matching schema.sql structure)
app.get('/api/modules', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, code: 'IT101', name: 'Introduction to IT', lecturer: 'Dr. James', semester: 1, year: 1 },
            { id: 2, code: 'CS201', name: 'Data Structures', lecturer: 'Prof. Sarah', semester: 2, year: 2 }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM modules ORDER BY code');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/modules', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { code, name, lecturer, semester, year } = req.body;
        const userId = 1; // Default user for now
        const [result] = await pool.execute(
            'INSERT INTO modules (code, name, lecturer, semester, year, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [code, name, lecturer, semester, year, userId]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Module insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/modules/:id', async (req, res) => {
    if (!pool) {
        return res.json({ success: true });
    }
    
    try {
        await pool.execute('DELETE FROM modules WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Timetable endpoints
app.get('/api/timetable', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, module_code: 'IT101', module_name: 'Introduction to IT', exam_date: '2024-02-15', exam_time: '09:00', venue: 'Room 101' }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM timetable ORDER BY exam_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/timetable', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { moduleCode, moduleName, date, time, venue } = req.body;
        const userId = 1; // Default user for now
        const [result] = await pool.execute(
            'INSERT INTO timetable (module_code, module_name, exam_date, exam_time, venue, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [moduleCode, moduleName, date, time, venue, userId]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Timetable insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

app.delete('/api/timetable/:id', async (req, res) => {
    if (!pool) {
        return res.json({ success: true });
    }
    
    try {
        await pool.execute('DELETE FROM timetable WHERE id = ?', [req.params.id]);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Money records endpoints (matching schema.sql)
app.get('/api/money', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, person_name: 'John Peter', amount: 150000, borrow_date: '2024-01-15', status: 'pending' }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM money_records ORDER BY borrow_date DESC');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/money', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { person, amount, borrowDate, returnDate } = req.body;
        const userId = 1; // Default user for now
        const [result] = await pool.execute(
            'INSERT INTO money_records (person_name, amount, borrow_date, expected_return_date, user_id) VALUES (?, ?, ?, ?, ?)',
            [person, amount, borrowDate, returnDate, userId]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Money insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Appointments endpoints
app.get('/api/appointments', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, name: 'Meeting with Supervisor', place: 'University Campus', appointment_date: '2024-02-15', appointment_time: '10:00', status: 'upcoming' }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM appointments ORDER BY appointment_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/appointments', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { name, place, date, time, aim } = req.body;
        const userId = 1; // Default user for now
        const [result] = await pool.execute(
            'INSERT INTO appointments (name, place, appointment_date, appointment_time, aim, user_id) VALUES (?, ?, ?, ?, ?, ?)',
            [name, place, date, time, aim, userId]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Appointment insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Journeys endpoints
app.get('/api/journeys', async (req, res) => {
    if (!pool) {
        return res.json([
            { id: 1, journey_from: 'Dar es Salaam', journey_to: 'Arusha', journey_date: '2024-02-20', journey_time: '08:00', status: 'pending' }
        ]);
    }
    
    try {
        const [rows] = await pool.execute('SELECT * FROM journeys ORDER BY journey_date');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/journeys', async (req, res) => {
    if (!pool) {
        return res.json({ id: Date.now(), success: true });
    }
    
    try {
        const { from, to, date, time, transportCost, foodCost } = req.body;
        const userId = 1; // Default user for now
        const transport = parseFloat(transportCost) || 0;
        const food = parseFloat(foodCost) || 0;
        const [result] = await pool.execute(
            'INSERT INTO journeys (journey_from, journey_to, journey_date, journey_time, transport_cost, food_cost, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [from, to, date, time, transport, food, userId]
        );
        res.json({ id: result.insertId, success: true });
    } catch (error) {
        console.error('Journey insert error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../personal_management_frontend/index.html'));
});

// Start server
app.listen(port, () => {
    console.log(`🚀 Server started successfully on port ${port}`);
    console.log(`📱 Frontend: http://localhost:${port}`);
    console.log(`🔗 API: http://localhost:${port}/api`);
    console.log(`💚 Health: http://localhost:${port}/health`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📊 Database: ${pool ? 'Connected' : 'Not connected (running in mock mode)'}`);
});

// Handle graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down gracefully');
    if (pool) {
        pool.end();
    }
    process.exit(0);
});
